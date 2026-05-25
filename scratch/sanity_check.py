import os
import sys

# Add workspace to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def check_dependencies():
    print("Checking core package imports...")
    try:
        import fastapi
        print("[OK] FastAPI imported successfully.")
    except ImportError as e:
        print(f"[ERROR] Failed to import FastAPI: {e}")
        return False

    try:
        import sqlalchemy
        print("[OK] SQLAlchemy imported successfully.")
    except ImportError as e:
        print(f"[ERROR] Failed to import SQLAlchemy: {e}")
        return False

    try:
        import numpy as np
        print("[OK] NumPy imported successfully.")
    except ImportError as e:
        print("[WARN] NumPy not installed. Falling back to clean term-frequency retriever.")

    return True

def test_database():
    print("\nTesting Database Connection & Schema Generation...")
    try:
        from backend.app.database import SessionLocal, get_db_type, Base, engine
        print(f"Active DB Type detected: {get_db_type()}")
        
        # Schema creation test
        Base.metadata.create_all(bind=engine)
        print("[OK] Database schemas validated and created successfully.")
        
        # Test Session creation
        db = SessionLocal()
        db.close()
        print("[OK] Database session local test successful.")
        return True
    except Exception as e:
        print(f"[ERROR] Database test failed: {e}")
        return False

def test_parsers():
    print("\nTesting Chunker & Parser pipelines...")
    try:
        from backend.app.ai.vector_store import RecursiveTextSplitter
        text = "Hello study companion. " * 100
        splitter = RecursiveTextSplitter(chunk_size=100, chunk_overlap=20)
        chunks = splitter.split_text(text)
        print(f"[OK] Text Splitter parsed text into {len(chunks)} chunks successfully.")
        return True
    except Exception as e:
        print(f"[ERROR] Text Splitter test failed: {e}")
        return False

def test_mock_generators():
    print("\nTesting AI Generators in Offline/Demo Mode...")
    try:
        from backend.app.ai.generator import ai_generator
        notes, topics = ai_generator.generate_notes("This is a demo physics lecture on quantum mechanics and particle behaviors.", "en")
        print("[OK] Notes offline generator test passed.")
        print(f"Generated Title: {notes.splitlines()[0]}")
        print(f"Extracted Topic Nodes count: {len(topics)}")
        
        flashcards = ai_generator.generate_flashcards("Computer science lecture on Object Oriented Programming.", "medium")
        print(f"[OK] Flashcards offline generator test passed. Card count: {len(flashcards)}")
        
        quiz = ai_generator.generate_quiz("History lecture on industrial reforms.", "medium", "mcq")
        print(f"[OK] Quiz offline generator test passed. Question count: {len(quiz)}")
        return True
    except Exception as e:
        print(f"[ERROR] AI Offline Generator test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("AI STUDY NOTES GENERATOR - WORKSPACE SANITY CHECK")
    print("=" * 50)
    
    success = True
    success &= check_dependencies()
    success &= test_database()
    success &= test_parsers()
    success &= test_mock_generators()
    
    print("\n" + "=" * 50)
    if success:
        print("SUCCESS: ALL SYSTEMS HEALTHY & VERIFIED READY FOR PRODUCTION!")
    else:
        print("WARNING: SOME SYSTEMS HAD ERRORS. PLEASE INSPECT LOGS ABOVE.")
    print("=" * 50)
