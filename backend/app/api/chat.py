import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import User, Note, ChatSession, ChatMessage, AIHistory
from backend.app.schemas.schemas import ChatRequest, MessageResponse, ChatSessionResponse
from backend.app.api.auth import get_current_user
from backend.app.ai.vector_store import vector_store
from backend.app.ai.generator import ai_generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["AI Chat with Notes (RAG)"])

@router.post("", response_model=MessageResponse)
def chat_with_note(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stateful and persistent Context-Aware AI Chatbot (RAG).
    1. Fetches relevant context chunks from the local vector database.
    2. Recalls recent session chat history.
    3. Prompts the AI model (Groq or fallback) for a friendly, detailed answer.
    4. Persists the conversation in the database.
    """
    # 1. Retrieve the note to verify ownership
    note = db.query(Note).filter(Note.id == request.note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found."
        )

    # 2. Get or create a Chat Session for this note
    session = db.query(ChatSession).filter(
        ChatSession.note_id == request.note_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        session = ChatSession(note_id=request.note_id, user_id=current_user.id)
        db.add(session)
        db.commit()
        db.refresh(session)

    # 3. Retrieve relevant chunks using Vector Store semantic query
    logger.info(f"Retrieving vector chunks for query on note {request.note_id}...")
    context_chunks = vector_store.query(request.note_id, request.message, top_k=3)
    
    # 4. Recall last 6 messages of history for conversational memory
    history_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    chat_history = [
        {"role": "user" if msg.sender == "user" else "assistant", "content": msg.message}
        for msg in history_messages[-6:]
    ]

    # 5. Generate Response using AI Pipeline
    logger.info("Generating chatbot response...")
    try:
        ai_reply = ai_generator.answer_chat_query(
            query_text=request.message,
            context_chunks=context_chunks,
            chat_history=chat_history
        )
    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI chatbot response."
        )

    # 6. Save messages to the database
    user_msg = ChatMessage(session_id=session.id, sender="user", message=request.message)
    assistant_msg = ChatMessage(session_id=session.id, sender="assistant", message=ai_reply)
    
    db.add(user_msg)
    db.add(assistant_msg)
    
    # Update AI History
    history = AIHistory(
        user_id=current_user.id,
        action_type="chat",
        details=f"Asked AI Chatbot about note: '{note.title}'."
    )
    db.add(history)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg


@router.get("/session/{note_id}", response_model=ChatSessionResponse)
def get_chat_session_history(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full chat history for a note session."""
    session = db.query(ChatSession).filter(
        ChatSession.note_id == note_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        # Create a fresh empty session
        session = ChatSession(note_id=note_id, user_id=current_user.id)
        db.add(session)
        db.commit()
        db.refresh(session)
        
    return session
