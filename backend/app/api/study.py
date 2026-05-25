import json
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import User, Note, Flashcard, Quiz, QuizQuestion, AIHistory
from backend.app.schemas.schemas import (
    FlashcardResponse, QuizResponse, QuizGenerateRequest, 
    QuizSubmitRequest, QuizScoreResponse, FlashcardGenerateRequest
)
from backend.app.api.auth import get_current_user
from backend.app.ai.generator import ai_generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/study", tags=["Study Tools (Quizzes & Flashcards)"])

# ==========================================
# FLASHCARD ROUTERS
# ==========================================

@router.get("/flashcards/{note_id}", response_model=List[FlashcardResponse])
def get_or_generate_flashcards(
    note_id: int,
    difficulty: str = "medium",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves existing flashcards for a note.
    If no flashcards exist yet, it automatically generates a high-quality set of 20+ cards using AI.
    """
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")

    # 1. Check if flashcards already exist
    existing_cards = db.query(Flashcard).filter(Flashcard.note_id == note_id).all()
    if existing_cards:
        return existing_cards

    # 2. Generate new flashcards using AI
    logger.info(f"Generating flashcards for note {note_id}...")
    try:
        cards_data = ai_generator.generate_flashcards(note.content, difficulty=difficulty)
        
        db_cards = []
        for card in cards_data:
            db_card = Flashcard(
                question=card.get("question", "Question?"),
                answer=card.get("answer", "Answer."),
                difficulty=card.get("difficulty", difficulty).lower(),
                note_id=note_id,
                user_id=current_user.id
            )
            db.add(db_card)
            db_cards.append(db_card)
            
        db.commit()
        
        # Log to AI History
        history = AIHistory(
            user_id=current_user.id,
            action_type="generate_flashcard",
            details=f"Generated {len(db_cards)} AI flashcards for Note: '{note.title}' (Difficulty: {difficulty})."
        )
        db.add(history)
        db.commit()
        
        # Refresh and return
        return db.query(Flashcard).filter(Flashcard.note_id == note_id).all()
    except Exception as e:
        logger.error(f"Failed to generate flashcards: {e}")
        raise HTTPException(status_code=500, detail=f"AI flashcard generation failed: {str(e)}")


# ==========================================
# QUIZ ROUTERS
# ==========================================

@router.get("/quizzes/{note_id}", response_model=QuizResponse)
def get_or_generate_quiz(
    note_id: int,
    difficulty: str = "medium",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the quiz associated with a note.
    If no quiz exists yet, it automatically generates a 10-question quiz (MCQ, True/False, Fill in blanks, Short QA) using AI.
    """
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")

    # 1. Check if quiz already exists
    existing_quiz = db.query(Quiz).filter(Quiz.note_id == note_id).first()
    if existing_quiz:
        return _serialize_quiz_response(existing_quiz)

    # 2. Generate new quiz using AI
    logger.info(f"Generating quiz for note {note_id}...")
    try:
        quiz_questions = ai_generator.generate_quiz(note.content, difficulty=difficulty)
        
        # Create Quiz entry
        db_quiz = Quiz(
            title=f"Quiz - {note.title}",
            difficulty=difficulty,
            note_id=note_id,
            user_id=current_user.id
        )
        db.add(db_quiz)
        db.commit()
        db.refresh(db_quiz)
        
        # Create Questions entries
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
        
        # Log to AI History
        history = AIHistory(
            user_id=current_user.id,
            action_type="generate_quiz",
            details=f"Generated AI quiz for Note: '{note.title}' (10 questions, Difficulty: {difficulty})."
        )
        db.add(history)
        db.commit()
        
        return _serialize_quiz_response(db_quiz)
    except Exception as e:
        logger.error(f"Failed to generate quiz: {e}")
        raise HTTPException(status_code=500, detail=f"AI quiz generation failed: {str(e)}")


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizScoreResponse)
def submit_quiz(
    quiz_id: int,
    submission: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits student's quiz answers, scores them,
    and returns detailed explanations and corrections for each answer.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    score = 0
    results = []
    
    # Map submission answers by question_id
    answers_map = {ans.question_id: ans.selected_answer for ans in submission.answers}
    
    for q in quiz.questions:
        student_answer = answers_map.get(q.id, "").strip()
        correct_answer = q.correct_answer.strip()
        
        # Grade comparison
        is_correct = False
        if q.question_type in {"mcq", "true_false"}:
            is_correct = student_answer.lower() == correct_answer.lower()
        else:
            # Semantic/Keyword matching helper for fill_blank and short_answers
            is_correct = _evaluate_text_similarity(student_answer, correct_answer)
            
        if is_correct:
            score += 1
            
        # Parse options
        parsed_options = None
        if q.options:
            try:
                parsed_options = json.loads(q.options)
            except Exception:
                pass
                
        results.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": parsed_options,
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation
        })
        
    total_questions = len(quiz.questions)
    percentage = (score / total_questions * 100) if total_questions > 0 else 0.0
    
    # Log to history
    history = AIHistory(
        user_id=current_user.id,
        action_type="submit_quiz",
        details=f"Completed quiz: '{quiz.title}'. Score: {score}/{total_questions} ({percentage:.1f}%)."
    )
    db.add(history)
    db.commit()
    
    return {
        "score": score,
        "total_questions": total_questions,
        "percentage": round(percentage, 1),
        "results": results
    }


# ==========================================
# PRIVATE SERIALIZATION HELPERS
# ==========================================

def _serialize_quiz_response(quiz: Quiz) -> Dict[str, Any]:
    """Helper to convert Quiz DB model to deserialized response structure."""
    questions_list = []
    for q in quiz.questions:
        options_list = None
        if q.options:
            try:
                options_list = json.loads(q.options)
            except Exception:
                options_list = []
                
        questions_list.append({
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": options_list,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation
        })
        
    return {
        "id": quiz.id,
        "title": quiz.title,
        "difficulty": quiz.difficulty,
        "note_id": quiz.note_id,
        "created_at": quiz.created_at,
        "questions": questions_list
    }

def _evaluate_text_similarity(ans1: str, ans2: str) -> bool:
    """Checks if a student answer matches the correct keyword in a relaxed manner."""
    if not ans1 or not ans2:
        return False
    a1 = ans1.lower().strip()
    a2 = ans2.lower().strip()
    
    # Exact check
    if a1 == a2:
        return True
        
    # Check if correct answer is a keyword inside student's answer
    if a2 in a1 and len(a2) > 2:
        return True
        
    # Check if student answer contains core word of correct answer
    words_a2 = [w for w in re.findall(r'\w+', a2) if len(w) > 3]
    if words_a2 and any(w in a1 for w in words_a2):
        return True
        
    return False
