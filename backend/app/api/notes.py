import os
import shutil
import logging
import re
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import User, UploadedFile, Note, AIHistory, PromptHistory, Flashcard, Quiz, QuizQuestion
from backend.app.schemas.schemas import (
    NoteResponse, UploadedFileResponse, PromptEnhanceRequest, PromptEnhanceResponse,
    PromptGenerateRequest, PromptFollowupRequest, PromptHistoryResponse
)
from backend.app.api.auth import get_current_user
from backend.app.utils.parser import parse_file
from backend.app.utils.audio import transcribe_audio
from backend.app.ai.vector_store import vector_store
from backend.app.ai.generator import ai_generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notes", tags=["Notes & Uploads"])
v1_router = APIRouter(prefix="/api/v1/notes", tags=["AI Prompt Notes v1"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=NoteResponse)
async def upload_file(
    file: UploadFile = File(...),
    language: str = Form("en"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a lecture material (PDF, DOCX, PPTX, TXT, or Audio),
    extracts the text content, generates structured study notes using AI,
    and indexes the content in the vector database for RAG.
    """
    # 1. Save uploaded file to disk
    file_ext = file.filename.split(".")[-1].lower()
    allowed_exts = {"pdf", "docx", "pptx", "ppt", "txt", "mp3", "wav", "m4a", "ogg"}
    
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported formats: {', '.join(allowed_exts)}"
        )

    file_id_str = f"usr_{current_user.id}_{int(os.urandom(4).hex(), 16)}"
    safe_filename = f"{file_id_str}.{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to write file to disk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file."
        )

    # Calculate file size
    file_size = os.path.getsize(filepath)

    # 2. Extract Text Content
    extracted_text = ""
    is_audio = file_ext in {"mp3", "wav", "m4a", "ogg"}
    
    try:
        # Create DB record for Uploaded File
        db_file = UploadedFile(
            filename=file.filename,
            filepath=filepath,
            file_type=file_ext,
            file_size=file_size,
            user_id=current_user.id
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)

        if is_audio:
            logger.info("Processing audio transcription...")
            extracted_text = transcribe_audio(filepath, language=language)
        else:
            logger.info("Processing document text parsing...")
            extracted_text = parse_file(filepath, file_ext)

        if not extracted_text.strip():
            raise ValueError("No text could be extracted from this lecture material.")

        # 3. Generate Structured Study Notes using LLM (or mock fallback)
        logger.info("Generating study notes from extracted content...")
        note_title = file.filename.rsplit(".", 1)[0]
        markdown_notes, topics_list = ai_generator.generate_notes(extracted_text, language=language)

        # 4. Save Notes to DB
        db_note = Note(
            title=note_title,
            content=markdown_notes,
            topics=json_dumps(topics_list),
            language=language,
            user_id=current_user.id,
            file_id=db_file.id
        )
        db.add(db_note)
        db.commit()
        db.refresh(db_note)

        # 5. Index chunks in local Vector Store for RAG Q&A
        logger.info(f"Indexing note {db_note.id} in local vector store...")
        vector_store.add_note_content(db_note.id, extracted_text)

        # 6. Log AI History
        history = AIHistory(
            user_id=current_user.id,
            action_type="summarize",
            details=f"Generated study notes for lecture file: '{file.filename}' (Note ID: {db_note.id})."
        )
        db.add(history)
        db.commit()

        return db_note

    except Exception as e:
        logger.error(f"Error processing upload pipeline: {str(e)}")
        # Cleanup file if saved but failed pipeline
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}"
        )

import json
def json_dumps(obj):
    try:
        return json.dumps(obj)
    except Exception:
        return "[]"

@router.get("", response_model=List[NoteResponse])
def get_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all generated notes for the currently logged in student."""
    return db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.created_at.desc()).all()

# ==========================================
# PROMPT-TO-NOTES ROUTERS (V1 API CORE)
# ==========================================

@v1_router.post("/enhance", response_model=PromptEnhanceResponse)
def api_enhance_prompt(
    request: PromptEnhanceRequest,
    current_user: User = Depends(get_current_user)
):
    """Enhances a raw topic prompt into a detailed academic study guideline."""
    enhanced = ai_generator.enhance_prompt(request.prompt)
    return {
        "original_prompt": request.prompt,
        "enhanced_prompt": enhanced
    }

@v1_router.post("/generate", response_model=NoteResponse)
async def generate_notes(
    request: PromptGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Coordinates full generation pipeline from custom prompt:
    Enhances prompt, runs Groq generator, creates note record,
    generates 20 flashcards, builds 10 quiz questions, and indexes Vector Store.
    """
    logger.info(f"Enhancing prompt: '{request.prompt[:50]}...'")
    enhanced_prompt = ai_generator.enhance_prompt(request.prompt)

    # Log Prompt History
    db_history = PromptHistory(
        user_id=current_user.id,
        prompt=request.prompt,
        enhanced_prompt=enhanced_prompt,
        generation_mode=request.generation_mode,
        note_length=request.note_length,
        language=request.language
    )
    db.add(db_history)
    db.commit()

    # Generate Notes Content
    logger.info("Generating study notes from enhanced prompt...")
    notes_markdown, topics_list = ai_generator.generate_notes_from_prompt(
        prompt=enhanced_prompt,
        mode=request.generation_mode,
        length=request.note_length,
        language=request.language
    )

    # Extract note title from first H1 or use prompt
    note_title = request.prompt.split("\n")[0][:40]
    title_match = re.search(r"^#\s+(.+)$", notes_markdown, re.MULTILINE)
    if title_match:
        note_title = title_match.group(1).strip()
        
    db_note = Note(
        title=note_title,
        content=notes_markdown,
        topics=json_dumps(topics_list),
        language=request.language,
        user_id=current_user.id,
        prompt=request.prompt,
        generation_mode=request.generation_mode,
        note_length=request.note_length
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)

    # Synchronously pre-compile Flashcards and Quizzes for instant loading in notes workspace
    try:
        logger.info(f"Pre-compiling flashcards for prompt note {db_note.id}...")
        cards_data = ai_generator.generate_flashcards(notes_markdown, difficulty="medium")
        for card in cards_data:
            db_card = Flashcard(
                question=card.get("question", "Question?"),
                answer=card.get("answer", "Answer."),
                difficulty=card.get("difficulty", "medium").lower(),
                note_id=db_note.id,
                user_id=current_user.id
            )
            db.add(db_card)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to pre-compile flashcards: {e}")

    try:
        logger.info(f"Pre-compiling quizzes for prompt note {db_note.id}...")
        quiz_questions = ai_generator.generate_quiz(notes_markdown, difficulty="medium")
        db_quiz = Quiz(
            title=f"Quiz - {db_note.title}",
            difficulty="medium",
            note_id=db_note.id,
            user_id=current_user.id
        )
        db.add(db_quiz)
        db.commit()
        db.refresh(db_quiz)

        for q in quiz_questions:
            options_json = None
            if q.get("question_type") == "mcq" and "options" in q:
                options_json = json.dumps(q["options"])
            elif q.get("question_type") == "true_false":
                options_json = json.dumps(["True", "False"])
                
            db_q = QuizQuestion(
                quiz_id=db_quiz.id,
                question_text=q.get("question_text", "Question?"),
                question_type=q.get("question_type", "mcq"),
                options=options_json,
                correct_answer=str(q.get("correct_answer", "")),
                explanation=q.get("explanation", "")
            )
            db.add(db_q)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to pre-compile quiz questions: {e}")

    # Index chunks in vector store
    try:
        logger.info(f"Indexing prompt note {db_note.id} in local vector store...")
        vector_store.add_note_content(db_note.id, notes_markdown)
    except Exception as e:
        logger.error(f"Failed to index note content in vector store: {e}")

    # Add activity log
    ai_log = AIHistory(
        user_id=current_user.id,
        action_type="prompt_notes",
        details=f"Generated AI Prompt-to-Notes notebook on: '{note_title}' (Mode: {request.generation_mode})."
    )
    db.add(ai_log)
    db.commit()

    return db_note

@v1_router.post("/followup", response_model=NoteResponse)
def generate_followup(
    request: PromptFollowupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Processes follow-up prompts to modify, expand, or simplify an existing note."""
    note = db.query(Note).filter(Note.id == request.note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")

    logger.info(f"Generating follow-up for note {request.note_id} with query: '{request.followup_query}'")
    updated_markdown = ai_generator.generate_followup_notes(
        previous_content=note.content,
        followup_query=request.followup_query,
        language=note.language
    )

    note.content = updated_markdown
    db.commit()
    db.refresh(note)

    # Log action
    ai_log = AIHistory(
        user_id=current_user.id,
        action_type="followup_notes",
        details=f"Applied AI follow-up modification on note: '{note.title}'."
    )
    db.add(ai_log)
    db.commit()

    return note

@v1_router.get("/history", response_model=List[PromptHistoryResponse])
def get_prompt_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves list of past user prompts generated."""
    return db.query(PromptHistory).filter(PromptHistory.user_id == current_user.id).order_by(PromptHistory.created_at.desc()).all()


# ==========================================
# PARAMETERIZED NOTE ROUTERS (DEFINED AFTER STATIC PATHS TO AVOID SHADOWING)
# ==========================================

@router.get("/{note_id}", response_model=NoteResponse)
def get_note_by_id(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves a specific note's details."""
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found."
        )
    return note

@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a note along with its associated uploaded files, flashcards, quizzes, etc."""
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found."
        )
    
    # Delete uploaded file from physical disk if exists
    if note.uploaded_file and os.path.exists(note.uploaded_file.filepath):
        try:
            os.remove(note.uploaded_file.filepath)
        except Exception as e:
            logger.error(f"Failed to remove file from disk: {e}")

    # Remove from local vector store files
    index_path = os.path.join(os.getenv("VECTOR_STORE_DIR", "vector_store"), f"note_{note_id}.json")
    if os.path.exists(index_path):
        try:
            os.remove(index_path)
        except Exception:
            pass

    # Log action
    history = AIHistory(
        user_id=current_user.id,
        action_type="delete_note",
        details=f"Deleted study note: '{note.title}' (ID: {note_id})."
    )
    
    db.delete(note)
    db.add(history)
    db.commit()
    return {"detail": "Note and associated assets successfully deleted."}
