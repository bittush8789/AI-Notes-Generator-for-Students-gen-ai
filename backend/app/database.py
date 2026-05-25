import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SQLITE_FALLBACK_URL = os.getenv("SQLITE_FALLBACK_URL", "sqlite:///./notes_generator.db")

engine = None
SessionLocal = None
db_type = "SQLite"

# Try connecting to MySQL
try:
    if DATABASE_URL and DATABASE_URL.startswith("mysql"):
        logger.info("Attempting to connect to MySQL database...")
        # Add a short timeout (3 seconds) to MySQL connection so it doesn't hang the app if MySQL is down
        engine = create_engine(
            DATABASE_URL, 
            connect_args={"connect_timeout": 3}
        )
        # Test connection
        connection = engine.connect()
        connection.close()
        db_type = "MySQL"
        logger.info("Successfully connected to MySQL database!")
except Exception as e:
    logger.warning(f"Failed to connect to MySQL ({str(e)}). Falling back to SQLite...")
    engine = None

# Fallback to SQLite if MySQL failed or is not configured
if engine is None:
    logger.info(f"Using SQLite database at: {SQLITE_FALLBACK_URL}")
    # SQLite connection parameters (check_same_thread is needed for multi-threaded access in FastAPI)
    engine = create_engine(
        SQLITE_FALLBACK_URL, 
        connect_args={"check_same_thread": False} if SQLITE_FALLBACK_URL.startswith("sqlite") else {}
    )
    db_type = "SQLite"

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_type():
    """Helper to check current database type"""
    return db_type
