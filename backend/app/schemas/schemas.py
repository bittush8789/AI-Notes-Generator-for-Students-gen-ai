from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Union, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Uploaded File Schemas
class UploadedFileResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

# Notes Schemas
class NoteCreate(BaseModel):
    title: str
    content: str
    topics: Optional[str] = None
    language: str = "en"
    file_id: Optional[int] = None

class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    topics: Optional[str] = None
    language: str
    file_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Flashcards Schemas
class FlashcardResponse(BaseModel):
    id: int
    question: str
    answer: str
    difficulty: str
    note_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FlashcardGenerateRequest(BaseModel):
    note_id: int
    difficulty: str = "medium"  # easy, medium, hard

# Quiz Schemas
class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str  # mcq, true_false, fill_blank, short_answer
    options: Optional[List[str]] = None  # Deserialized from JSON string in controller
    correct_answer: str
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    note_id: int
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True

class QuizGenerateRequest(BaseModel):
    note_id: int
    difficulty: str = "medium"  # easy, medium, hard
    quiz_type: Optional[str] = "mcq"  # mcq, true_false, mixed

class QuestionAnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str

class QuizSubmitRequest(BaseModel):
    answers: List[QuestionAnswerSubmit]

class QuizScoreResponse(BaseModel):
    score: int
    total_questions: int
    percentage: float
    results: List[Dict[str, Any]]  # Contains details about correctness of each question

# Chat / RAG Schemas
class MessageResponse(BaseModel):
    id: int
    sender: str  # user, assistant
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    note_id: int
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    note_id: int
    message: str

# Stats Schemas
class DashboardStats(BaseModel):
    total_notes: int
    total_files: int
    total_flashcards: int
    total_quizzes: int
    recent_activity: List[Dict[str, Any]]


# Prompt-to-Notes Schemas
class PromptEnhanceRequest(BaseModel):
    prompt: str

class PromptEnhanceResponse(BaseModel):
    original_prompt: str
    enhanced_prompt: str

class PromptGenerateRequest(BaseModel):
    prompt: str
    generation_mode: str = "exam"  # beginner, intermediate, advanced, exam, interview, research
    note_length: str = "medium"    # short, medium, detailed, full
    language: str = "en"           # en, hi, hinglish

class PromptFollowupRequest(BaseModel):
    note_id: int
    followup_query: str

class PromptHistoryResponse(BaseModel):
    id: int
    prompt: str
    enhanced_prompt: Optional[str] = None
    generation_mode: str
    note_length: str
    language: str
    created_at: datetime

    class Config:
        from_attributes = True
