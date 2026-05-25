import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.database import Base, engine, get_db, get_db_type
from backend.app.models.models import Note, UploadedFile, Flashcard, Quiz, AIHistory, User
from backend.app.schemas.schemas import DashboardStats
from backend.app.api.auth import get_current_user
from backend.app.api import auth, notes, study, chat

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Automatically create tables in MySQL/SQLite on startup
try:
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema creation successful!")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

# Initialize FastAPI application
app = FastAPI(
    title="AI Notes Generator for Students",
    description="Full-stack FastAPI backend with dynamic summarization, quiz parsing, RAG chat, and automatic database fallbacks.",
    version="1.0.0"
)

# Configure CORS Middleware for local React frontend connection
# Standard Vite React port is 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local deployment flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(notes.v1_router)
app.include_router(study.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    """Root health-check endpoint showing database type and system readiness."""
    return {
        "status": "online",
        "app_name": "AI Notes Generator API",
        "database_engine": get_db_type(),
        "info": "Upload documents at /api/notes/upload to generate smart study materials."
    }

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Computes stats and recent activity for the student dashboard."""
    total_notes = db.query(Note).filter(Note.user_id == current_user.id).count()
    total_files = db.query(UploadedFile).filter(UploadedFile.user_id == current_user.id).count()
    total_flashcards = db.query(Flashcard).filter(Flashcard.user_id == current_user.id).count()
    total_quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).count()
    
    # Get last 5 activities
    activities = db.query(AIHistory).filter(
        AIHistory.user_id == current_user.id
    ).order_by(AIHistory.created_at.desc()).limit(5).all()
    
    recent_activity = [
        {
            "id": act.id,
            "action_type": act.action_type,
            "details": act.details,
            "created_at": act.created_at
        }
        for act in activities
    ]
    
    return {
        "total_notes": total_notes,
        "total_files": total_files,
        "total_flashcards": total_flashcards,
        "total_quizzes": total_quizzes,
        "recent_activity": recent_activity
    }
