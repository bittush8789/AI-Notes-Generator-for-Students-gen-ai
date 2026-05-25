# <p align="center"><img src="https://img.icons8.com/nolan/96/artificial-intelligence.png" width="80" alt="StudyAI Logo" /><br>StudyAI Notes</p>
<p align="center">
  <strong>AI-Powered Smart Study Workspace</strong>
</p>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI Badge" /></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq_Cloud-F55036?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Groq Badge" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind Badge" /></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Badge" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License Badge" /></a>
</p>

<p align="center">
  StudyAI Notes is a modern, enterprise-ready educational SaaS workspace designed to supercharge the learning process. It bridges the gap between raw educational content and active, long-term knowledge retention. By converting unstructured lecture material (PDF documents, PowerPoint decks, audio lectures, and plain-text files) or raw prompts into beautifully organized, exam-ready study notes, high-impact flashcards, customizable quizzes, and persistent context-aware RAG AI chat sessions, StudyAI Notes equips students with a personal, virtual 24/7 academic advisor.
</p>

---

## 📖 Table of Contents
- [1. Hero Section](#-studyai-notes)
- [2. Project Overview](#-2-project-overview)
- [3. Key Features](#-3-key-features)
- [4. Interface & Screenshots](#-4-interface--screenshots)
- [5. System Architecture](#-5-system-architecture)
- [6. Technical Stack](#-6-technical-stack)
- [7. Complete Folder Structure](#-7-complete-folder-structure)
- [8. Installation & Setup Guide](#-8-installation--setup-guide)
- [9. Environment Variables Configuration](#-9-environment-variables-configuration)
- [10. REST API Documentation](#-10-rest-api-documentation)
- [11. Premium UI/UX & Interaction Design](#-11-premium-uiux--interaction-design)
- [12. Enterprise Security & Session Protection](#-12-enterprise-security--session-protection)
- [13. Advanced Performance Optimizations](#-13-advanced-performance-optimizations)
- [14. Strategic Feature Roadmap](#-14-strategic-feature-roadmap)
- [15. Production Deployment Guide](#-15-production-deployment-guide)
- [16. Open-Source Contribution Guidelines](#-16-open-source-contribution-guidelines)
- [17. Project License](#-17-project-license)

---

## 🎯 2. Project Overview

Modern students and professionals face an unprecedented information overload. Keeping up with hour-long audio lectures, hundreds of pages of PDF textbooks, and complicated concepts under tight schedules leads to high cognitive fatigue and inefficient study methods. Active recall and spaced repetition are scientifically proven to maximize memory retention, yet manually compiling flashcards, testing yourself with custom quizzes, and writing structured summaries is tedious and time-consuming.

**StudyAI Notes** solves this fundamental educational bottleneck. Built using a modern **React (Vite) single-page application** and an ultra-fast **FastAPI backend REST framework**, the system orchestrates a beautiful generative workspace:

```
[ Unstructured Materials ]   ───►   [ AI Processing Core ]   ───►   [ Interactive Notebook ]
 - PDFs & Textbook Chapters         - Groq Llama 3.3 Engine           - Spaced-Recall Flashcards
 - Audio Lecture Records             - Custom Vector Embeddings        - Pedagogical Practice Quizzes
 - Custom Concept Prompts           - Hybrid TF-IDF Keyword Fallback  - Context-Aware Active RAG Chat
```

By leveraging the cutting-edge inference speed of **Groq Cloud APIs** (Llama-3.3-70b-versatile and Llama-3-8b-8192) combined with a local compile-free vector storage retriever, StudyAI Notes acts as a lightning-fast, production-grade learning copilot.

---

## ✨ 3. Key Features

Our platform is engineered around three major academic paradigms: **Automated Synthesis**, **Active Recall Testing**, and **Contextual Q&A Exploration**.

### 🌟 Core AI & Generation Features
| Feature | Capabilities & Implementations | Tech Subsystem |
| :--- | :--- | :--- |
| **AI Study Notes Synthesis** | Instantly compiles material into Markdown sheets featuring top summaries, deep-dive core concepts, bold definitions, blockquotes, and LaTeX formatting. | `GroqAIGenerator` & `pdfplumber` |
| **Prompt-to-Notes Engine** | Type any topic (e.g., *Quantum Computing Basics*) and choose custom difficulty, language, and note length to generate a complete custom notebook. | `FastAPI v1_router` / `generate` |
| **OCR & Text Extraction** | Multi-format document text extraction supporting structured document architectures. | `pypdf`, `pdfplumber`, `python-docx` |
| **Whisper Audio Lecture Transcription** | Uploads audio lecture recordings and transcribes them via `whisper-large-v3` directly into text before summarizing. | `backend.app.utils.audio` |
| **Persistent Markdown Workspace** | Clean markdown renderer supporting syntax highlights, mathematical rendering, and Notion-style visual alerts. | `react-markdown` & Custom CSS |
| **Flexible Export Engine** | Save synthesized study guides, flashcard sets, and generated quizzes as print-ready offline study materials. | Frontend Workspace Exports |
| **Multi-Language Engine** | High-fidelity processing, synthesis, and Q&A chat in **English**, **Hindi (हिंदी)**, and **Hinglish (Latin script mix)**. | System-wide LLM System Prompts |

### 🧠 Active Recall & Study Enhancement
| Feature | Capabilities & Implementations | Tech Subsystem |
| :--- | :--- | :--- |
| **AI Flashcard Generator** | Automatically generates sets of 20+ comprehensive Q&A flashcards per lecture. Features interactive 3D flipping, and status indicators. | `backend/app/api/study.py` |
| **Interactive Quiz Engine** | Synthesizes a structured 10-question quiz per note featuring a rich mix of Multiple Choice, True/False, Fill-in-the-blanks, and Short Answer questions. | Graded submit pipelines & SQLite/MySQL DB |
| **Pedagogical Scoring & Review** | Submits and grades quizzes in real-time, providing immediate feedback with detailed pedagogical explanation cards. | String similarity token match helper |
| **Context-Aware Chatbot (RAG)** | Chat directly with your lecture documents. Ask details, clarify formulas, or request alternative analogies with persistent memory. | `LocalVectorStore` & `SentenceTransformer` |
| **Smart Spaced Revision Planner** | Analyzes notes metadata to suggest optimized daily spaced repetition review schedules to prevent learning curve decay. | Frontend Dashboard Recommendation |

---

## 📸 4. Interface & Screenshots

### 🖥️ Student Dashboard Workspace
> An elegant glassmorphic dashboard showcasing rapid statistics, study session calendars, dynamic upload drops, and revision alerts.
```
┌────────────────────────────────────────────────────────────────────────┐
│  [StudyAI Notes]   Dashboard     My Notebooks     Stats       [Dark/Light]│
├────────────────────────────────────────────────────────────────────────┤
│  Welcome back, student! 👋                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────────────┐ │
│  │ Total Notes   │ │ Flashcards    │ │ Recommended Revision Plan     │ │
│  │     12        │ │     240       │ │ 🌟 Spaced Repetition (Day 3)  │ │
│  └───────────────┘ └───────────────┘ └───────────────────────────────┘ │
│                                                                        │
│  [ Drag & Drop Lecture Files Here (PDF, DOCX, MP3 up to 50MB) ]        │
│                                                                        │
│  Recent Notebooks:                                                     │
│  🗂️ Intro to Neural Networks     🗂️ Calculus II - Integration         │
│  🗂️ OS Deadlock Prevention       🗂️ Advanced Organic Chemistry        │
└────────────────────────────────────────────────────────────────────────┘
```

### 📓 Interactive Notebook & AI Chat Workspace
> A dual-pane workspace containing interactive study content on the left (Notes, Flashcards, Quizzes) and a context-aware chat interface on the right.
```
┌──────────────────────────────────────────┬─────────────────────────────┐
│ 📓 Notebook: Intro to Neural Networks    │ 💬 Study Buddy Chat         │
├──────────────────────────────────────────┼─────────────────────────────┤
│  [Notes]   [Flashcards (24)]   [Quiz]    │ AI: Hello! Let's review     │
│                                          │ your neural networks note.  │
│  # 1. Artificial Neural Networks (ANN)   │                             │
│  An ANN is an information-processing     │ User: Can you explain the   │
│  model inspired by biological systems... │ gradient descent formula    │
│                                          │ in simple terms?            │
│  > [!IMPORTANT]                          │                             │
│  > Gradient descent is optimized using   │ AI: Imagine you're on a     │
│  > backpropagation to minimize losses.   │ foggy mountain at night. To │
│                                          │ find the valley (minimum    │
│  $$\theta_{t+1} = \theta_t - \eta \nabla│ loss), you feel the slope   │
│  J(\theta_t)$$                           │ under your feet and take a  │
│                                          │ step downward. That slope   │
│  [ ⚡ Enhance Prompt ]                   │ is the gradient!            │
└──────────────────────────────────────────┴─────────────────────────────┘
```

---

## 🏗️ 5. System Architecture

The architecture uses a high-performance **decoupled model** designed for massive client traffic, secure sessions, and microsecond responses. The following diagram demonstrates the data flows and system architecture of a production-grade StudyAI Notes cluster:

```mermaid
graph TD
    %% Styling Configuration
    classDef client fill:#38B2AC,stroke:#2C7A7B,stroke-width:2px,color:#fff;
    classDef proxy fill:#4A5568,stroke:#2D3748,stroke-width:2px,color:#fff;
    classDef server fill:#009688,stroke:#00796B,stroke-width:2px,color:#fff;
    classDef db fill:#3182CE,stroke:#2B6CB0,stroke-width:2px,color:#fff;
    classDef ai fill:#F55036,stroke:#C53030,stroke-width:2px,color:#fff;

    %% Elements
    User((🎓 Student User))
    
    subgraph Frontend [React SPA Client]
        SPA[Vite React Application]:::client
        Zustand[Zustand Global State]:::client
        AxiosClient[Axios API Handler]:::client
    end
    
    subgraph Gateway [Inbound Traffic Controller]
        Nginx[Nginx Reverse Proxy & Load Balancer]:::proxy
    end

    subgraph Backend [FastAPI Application Instance]
        Router[APIRouter Context Gateway]:::server
        AuthHandler[JWT & Bcrypt Security Guards]:::server
        FileParser[Multi-Format File Parser]:::server
        AIService[AI Orchestration Pipeline]:::server
    end

    subgraph Storage [Relational & Semantic Datastores]
        SQLite[(MySQL / SQLite Engine)]:::db
        VectorStore[(Local Vector Store Index)]:::db
    end

    subgraph ExternalServices [Generative AI Cloud Layer]
        GroqAPI[Groq Inference Engine Llama 3.3]:::ai
        WhisperAPI[Whisper Audio Engine large-v3]:::ai
    end

    %% Routing Connections
    User ──►|"HTTPS Requests (Port 80/443)"| SPA
    SPA ──►|Zustand Events| Zustand
    Zustand ──►|Axios Client Requests| AxiosClient
    AxiosClient ──► Nginx
    Nginx ──►|Proxy Route /api| Router
    
    Router ──► AuthHandler
    Router ──► FileParser
    Router ──► AIService
    
    AuthHandler ──►|Read/Write User Credentials| SQLite
    FileParser ──►|Parse PDFs & TXTs| AIService
    AIService ──►|Store Notes, Flashcards & Quizzes| SQLite
    
    %% AI Pipeline Routing
    AIService ──►|Semantic Retrieval Queries| VectorStore
    AIService ──►|Groq Chat Completions REST calls| GroqAPI
    FileParser ──►|Transcribe Audio Lectures| WhisperAPI
    
    class SPA,Zustand,AxiosClient client;
    class Nginx proxy;
    class Router,AuthHandler,FileParser,AIService server;
    class SQLite,VectorStore db;
    class GroqAPI,WhisperAPI ai;
```

---

## 🛠️ 6. Technical Stack

The StudyAI Notes tech stack is highly optimized for fast response times and lightweight footprints:

### Frontend Technologies
*   **Core Frame:** React 18+ (using Vite for lightning-fast HMR and bundling).
*   **Theme & Aesthetics:** Tailwind CSS. Engineered with a premium **glassmorphism** design system, beautiful HSL tailored colors, dark mode synchronization, and smooth micro-animations.
*   **State Management:** Lightweight React Context API (with ready configurations for Zustand scale).
*   **Text & Formula Rendering:** React Markdown with KaTeX support for rendering scientific notation and LaTeX mathematical equations.
*   **Transitions:** CSS Keyframe animations and interactive UI components.

### Backend Frameworks
*   **Web Engine:** FastAPI (Python 3.10+). Selected for its native asynchronous capabilities, automatic OpenAPI generation, and exceptional request processing speeds.
*   **ORM Layer:** SQLAlchemy 2.0. Highly optimized declarative mapping with built-in connection pooling.
*   **Validation:** Pydantic v2. Clean, strict data serialization and robust runtime validation.

### Generative AI & Retrieval Pipelines
*   **Inference Provider:** Groq Cloud API. Powers inference speeds up to **240 tokens per second** using `llama-3.3-70b-versatile` and `llama3-8b-8192` as an automatic fallback.
*   **Vector Embeddings:** SentenceTransformers (using the pre-trained `all-MiniLM-L6-v2` model) to build compact, semantic 384-dimensional text vectors.
*   **Search Engine:** `LocalVectorStore` - a highly refined, zero-dependency, compile-free vector storage model. Calculates cosine similarities via NumPy and features a **pure-Python TF-IDF/BM25 fallback keyword index** for instant, compilation-free setups.
*   **Audio Transcription:** OpenAI Whisper API via Groq `whisper-large-v3` endpoints.

### Datastores & Storage Layers
*   **Primary DB:** Dynamic connection pool supporting **MySQL** for heavy loads, with an automated fallback to **SQLite** (`notes_generator.db`) to ensure zero-configuration, instant local running.
*   **File Storage:** Secure directory-isolated local folder uploads.

---

## 📂 7. Complete Folder Structure

Below is the directory architecture of the workspace, structured cleanly for rapid, intuitive onboarding:

```
d:/Notes-generator/
├── backend/                        # Python FastAPI Backend Services
│   ├── Dockerfile                  # Multi-stage production container script
│   └── app/                        # Application Source Code
│       ├── __init__.py             # Python module initialization
│       ├── database.py             # DB Session engine & dynamic dialect mapper
│       ├── main.py                 # Core entry, CORS configuration, system routes
│       ├── models/                 # DB Schemas (SQLAlchemy Declarative Models)
│       │   └── models.py           # User, Note, Flashcard, Quiz, Chat Session schemas
│       ├── schemas/                # Data Serialization & JSON Contracts
│       │   └── schemas.py          # Pydantic schemas (Request/Response validators)
│       ├── api/                    # Route Handlers / API Controllers
│       │   ├── auth.py             # Authentication endpoints, password hashing, JWTs
│       │   ├── chat.py             # Stateful RAG Chat, persistence, history logs
│       │   ├── notes.py            # File Uploads, parse triggers, note generation
│       │   └── study.py            # Active Recall (Quiz submissions, Flashcards)
│       ├── ai/                     # LLM Generative & Semantic Retrieval Core
│       │   ├── generator.py        # Groq completions & high-fidelity mock generators
│       │   └── vector_store.py     # Local Vector Store (NumPy embeddings & TF-IDF)
│       └── utils/                  # Background utility helpers
│           ├── audio.py            # Whisper audio parser & transcribers
│           └── parser.py           # Multi-format document text parsers
│
├── frontend/                       # Vite React Frontend client
│   ├── Dockerfile                  # Production builder serving build via Nginx
│   ├── index.html                  # Core HTML5 entry point & Outfit typography
│   ├── package.json                # NPM Dependency declarations
│   ├── vite.config.js              # Vite compiler config & port binding
│   ├── tailwind.config.js          # Tailgraded glassmorphic theme styles
│   ├── postcss.config.js           # CSS post-processing rules
│   └── src/                        # React Application Source
│       ├── main.jsx                # UI mounting & root setup
│       ├── App.jsx                 # Client routes, context providers, layout shell
│       ├── App.css                 # Custom keyframes and global animations
│       ├── index.css               # Tailwind directives & CSS design tokens
│       ├── services/               # HTTP client connectors
│       │   └── api.js              # Axios interceptors, auth headers, API functions
│       ├── components/             # Reusable UI Components
│       │   ├── Navbar.jsx          # Dynamic Header (profile, logout, state sync)
│       │   ├── UploadZone.jsx      # Drag & drop file upload panel with progress
│       │   ├── Chatbot.jsx         # Stateful slide-out conversational panel
│       │   ├── FlashcardCard.jsx   # 3D interactive flipping card with animation
│       │   └── QuizTaker.jsx       # Graded practice test runner & feedback dashboard
│       └── pages/                  # Main Screen Views
│           ├── Landing.jsx         # High-impact promotional features showcase
│           ├── Auth.jsx            # Sleek dual login/registration forms card
│           ├── Dashboard.jsx       # User study deck portal & file manager
│           └── NotesViewer.jsx     # Master dual-pane generative workspace
│
├── uploads/                        # Volume-mounted local uploads folder
├── vector_store/                   # Persisted local JSON vector indices
├── notes_generator.db              # Zero-config SQLite database (local running)
├── requirements.txt                # Backend python dependency configuration
├── .env                            # Local developer config variables (git ignored)
└── docker-compose.yml              # Production Docker orchestrator configuration
```

---

## 🚀 8. Installation & Setup Guide

Get your local developer workspace running in less than 5 minutes by following these instructions.

### Prerequisites Check
*   **Operating System:** Windows, macOS, or Linux.
*   **Python Engine:** Python 3.10 or higher.
*   **Node JS Environment:** Node.js v18.0.0 or higher (along with npm).
*   **Groq API Key (Optional):** Register at [console.groq.com](https://console.groq.com/) for immediate access. *If omitted, the platform automatically switches to its elegant offline keyword simulation mode to let you test every feature without any API keys!*

---

### Step 1: Clone the Repository
Open a terminal shell and clone the codebase:
```bash
git clone https://github.com/your-username/Notes-generator.git
cd Notes-generator
```

---

### Step 2: Configure Environment Variables
Create a new file named `.env` in the root of the project:
```bash
# Windows PowerShell
New-Item .env -ItemType File

# macOS / Linux / Git Bash
touch .env
```
Copy and paste the following standard configurations inside the `.env` file:
```env
# Database Dialects Configuration
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/notes_generator
SQLITE_FALLBACK_URL=sqlite:///./notes_generator.db

# JWT Security Configurations
SECRET_KEY=9a15f03d526fa189c4568a1f8dbbc67284bcf6cc15cd567ff7cda6e47cb19283
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Core Configuration
GROQ_API_KEY=your_groq_api_key_here # Omit/leave blank to run in fully interactive Offline Demo Mode!

# Local Directory Configs
UPLOAD_DIR=uploads
VECTOR_STORE_DIR=vector_store
```

---

### Step 3: Set Up the Backend Server
1. Create a Python virtual environment and activate it:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Upgrade pip and install all required modules:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. Start the FastAPI application via uvicorn in reload/development mode:
   ```bash
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```
   *The backend will boot immediately on `http://localhost:8000/`. It will automatically scan your database settings, create all SQLite or MySQL schema tables out-of-the-box, and expose interactive API docs at `http://localhost:8000/docs`.*

---

### Step 4: Set Up the Frontend Client
1. Open a new terminal window, navigate into the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Boot the local development server:
   ```bash
   npm run dev
   ```
   *The Vite compiler will spin up on `http://localhost:5173/`. Open this address in your browser to begin generating smart study guides!*

---

### Step 5: Run Pre-Deployment Verification
We include an enterprise diagnostics script to make sure the AI generators, local vector store logic, and SQLite schemas are fully functional:
```bash
# Return to root directory and run the sanity check
cd ..
python scratch/sanity_check.py
```
*Expected successful output:*
`🚀 ALL SYSTEMS HEALTHY & VERIFIED READY FOR PRODUCTION!`

---

## 🔒 9. Environment Variables Configuration

The `.env` file handles database fallback policies, API endpoints, directory settings, and encryption:

| Key | Example / Default Value | Purpose |
| :--- | :--- | :--- |
| **DATABASE_URL** | `mysql+pymysql://user:pass@host:3306/db` | Primary MySQL database URL path. |
| **SQLITE_FALLBACK_URL** | `sqlite:///./notes_generator.db` | High-safety local SQLite URL used automatically if MySQL is unavailable. |
| **SECRET_KEY** | `9a15f03d526fa189c4568a1f8dbbc67284bcf6cc15c...` | Secure signing key used to compile and decode JWT auth tokens. |
| **ALGORITHM** | `HS256` | Cryptographic signature model standard for JWT encoding. |
| **ACCESS_TOKEN_EXPIRE_MINUTES** | `1440` | Session lifetime. `1440` minutes equals 24 hours of login validity. |
| **GROQ_API_KEY** | `gsk_AbC123...` | Secure Cloud API Key for Groq Inference. Leave blank for mock evaluation. |
| **UPLOAD_DIR** | `uploads` | Isolation directory where parsed PDFs and audios are securely saved. |
| **VECTOR_STORE_DIR** | `vector_store` | Target storage folder where semantic JSON vector maps are saved. |

---

## 🔌 10. REST API Documentation

FastAPI automatically serves premium OpenAPI-compliant documentation at `/docs` (Swagger UI) and `/redoc` (ReDoc). Below is the comprehensive schema mapping the key REST API controllers:

### User & Authentication API Route (`/api/auth`)
*   `POST /api/auth/register`
    *   **Description:** Registers a new student account. Automatically hashes passwords.
    *   **Payload:**
        ```json
        {
          "email": "student@university.edu",
          "password": "SecurePassword123",
          "full_name": "Jane Doe"
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
          "id": 1,
          "email": "student@university.edu",
          "full_name": "Jane Doe",
          "created_at": "2026-05-25T19:42:34"
        }
        ```
*   `POST /api/auth/login`
    *   **Description:** Authenticates credentials and returns a secure JWT access token.
    *   **Payload:**
        ```json
        {
          "email": "student@university.edu",
          "password": "SecurePassword123"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "token_type": "bearer"
        }
        ```
*   `GET /api/auth/me`
    *   **Description:** Retrieves current user profile from bearer token context.
    *   **Auth Required:** Bearer JWT Token.
    *   **Response (200 OK):** Same as User Response object.

---

### Study Notebooks & Generation API Route (`/api/notes`)
*   `POST /api/notes/upload`
    *   **Description:** Uploads raw lecture documents or lecture audios, extracts text, transcribes files, runs the generative markdown notes pipeline, and indexes vectors.
    *   **Auth Required:** Bearer JWT Token.
    *   **Request Type:** `multipart/form-data`
    *   **Fields:** `file` (Binary File), `language` (Form String: `en` / `hi`).
    *   **Response (200 OK):**
        ```json
        {
          "id": 12,
          "title": "Intro_to_Calculus_Syllabus",
          "content": "# Comprehensive Study Guide: Limits & Derivatives...",
          "language": "en",
          "topics": "[{\"name\": \"Limits\", \"importance\": \"High\"}]",
          "created_at": "2026-05-25T19:45:12",
          "user_id": 1,
          "file_id": 4
        }
        ```
*   `POST /api/v1/notes/generate`
    *   **Description:** The complete, automated "Prompt-to-Notes" pipeline. Automatically enhances user prompt query, synthesizes complete markdown notes, pre-compiles 20+ flashcards, constructs 10 graded quiz questions, and index vectors.
    *   **Auth Required:** Bearer JWT Token.
    *   **Payload:**
        ```json
        {
          "prompt": "Explain deadlocks in Operating Systems, safety algorithms, and banker's code.",
          "generation_mode": "exam", 
          "note_length": "medium",
          "language": "en"
        }
        ```
    *   **Response (200 OK):** Synthesized NoteResponse JSON object.
*   `POST /api/v1/notes/followup`
    *   **Description:** Expanding and modifying an existing note through follow-up prompts (e.g. *explain simpler*, *translate to Hindi*).
    *   **Payload:**
        ```json
        {
          "note_id": 12,
          "followup_query": "Add a simplified 5-year old analogy explaining banker's safety algorithm."
        }
        ```
    *   **Response (200 OK):** NoteResponse containing updated content.
*   `DELETE /api/notes/{note_id}`
    *   **Description:** Safely deletes notes, associated upload files, flashcard lists, quiz sets, and local vector indices.

---

### Recall Tools API Route (`/api/study`)
*   `GET /api/study/flashcards/{note_id}`
    *   **Description:** Retrieves flashcards. Generates 20+ high-quality recall cards via Groq if they don't already exist.
    *   **Response (200 OK):**
        ```json
        [
          {
            "id": 142,
            "question": "What is mutual exclusion in Operating Systems?",
            "answer": "A constraint preventing multiple processes from simultaneously accessing a shared resource.",
            "difficulty": "medium",
            "note_id": 12
          }
        ]
        ```
*   `GET /api/study/quizzes/{note_id}`
    *   **Description:** Fetches or compiles a 10-question graded exam featuring dynamic MCQs, short answers, and TF questions.
    *   **Response (200 OK):**
        ```json
        {
          "id": 34,
          "title": "Quiz - OS Deadlocks",
          "difficulty": "medium",
          "note_id": 12,
          "questions": [
            {
              "id": 101,
              "question_text": "True or False: Mutual exclusion is a necessary condition for deadlocks.",
              "question_type": "true_false",
              "options": ["True", "False"],
              "correct_answer": "True",
              "explanation": "Without mutual exclusion, resources can be shared, preventing deadlocks."
            }
          ]
        }
        ```
*   `POST /api/study/quizzes/{quiz_id}/submit`
    *   **Description:** Grades quiz submissions. Employs relaxed token-matching for fill-in-the-blanks and short answers, returning immediate grades and rich pedagogical explanations.
    *   **Payload:**
        ```json
        {
          "answers": [
            { "question_id": 101, "selected_answer": "True" }
          ]
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "score": 10,
          "total_questions": 10,
          "percentage": 100.0,
          "results": [
            {
              "question_id": 101,
              "question_text": "...",
              "student_answer": "True",
              "correct_answer": "True",
              "is_correct": true,
              "explanation": "..."
            }
          ]
        }
        ```

---

### Contextual Q&A RAG Chat API Route (`/api/chat`)
*   `POST /api/chat`
    *   **Description:** Stateful context-aware Chatbot Q&A. Automatically searches the `LocalVectorStore` to extract top-k chunks, recalls previous message threads for memory, prompts Groq for replies, and logs the chat conversation.
    *   **Payload:**
        ```json
        {
          "note_id": 12,
          "message": "Give me a practical real-world example of mutual exclusion."
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "id": 890,
          "session_id": 45,
          "sender": "assistant",
          "message": "**AI Study Buddy:** Think of a public restroom with a single key...",
          "created_at": "2026-05-25T19:48:30"
        }
        ```

---

## 🎨 11. Premium UI/UX & Interaction Design

The design system of StudyAI Notes balances functional spacing with an immersive, visual user experience. 

*   **Premium Glassmorphic Layouts:** Modern design using glass panels (`backdrop-filter: blur(16px)`), extremely thin solid borders (`border: 1px solid rgba(255,255,255,0.08)`), and soft radial gradients that look stunning in dark mode.
*   **Modern Typography:** The user interface uses **Outfit** (a warm, round, modern geometric font by Google Fonts) for headings and dashboards, paired with **Inter** for reading content to reduce reading fatigue.
*   **Active Recall 3D Interactive Flipping:** Flashcards feature fluid 3D transformations (`transform-style: preserve-3d` with `perspective: 1000px`). A student simply clicks to flip cards.
*   **Smooth Micro-Animations:** Buttons, upload panels, and chat sidebars use micro-animations (`cubic-bezier(0.4, 0, 0.2, 1)`) to provide tactile feedback and delight users.
*   **Persistent Custom Sidebar:** The slide-out RAG chatbot panel is accessible with a single click from any location in the notebook workspace.
*   **True Adaptive Responsive UI:** Grid components scale smoothly from large 4K monitors down to mobile viewports.

---

## 🛡️ 12. Enterprise Security & Session Protection

StudyAI Notes implement security controls that match enterprise compliance guidelines:

*   **Secure Authentication Protocols:** Strict **JWT (JSON Web Tokens)** standard using cryptographically secure asymmetric HMAC signatures (`HS256`).
*   **One-Way Password Cryptography:** Passwords are never saved in plain text. Backend employs **Bcrypt key derivation** with a work factor cost of 12, protecting user credentials against brute-force attacks.
*   **Isolated Data Storage:** Injected SQLite/MySQL variables are routed through standard parameterized ORMs, preventing SQL Injection vulnerability points.
*   **Client Upload Sanitization:** Restricts uploaded lecture materials to verified extensions (`pdf`, `docx`, `pptx`, `txt`, `mp3`, `wav`).
*   **Global Access Controls:** FastAPI dependency-injection patterns protect all study APIs by checking token validation state before returning records.

---

## ⚡ 13. Advanced Performance Optimizations

Our architecture is tuned to run efficiently on simple, low-cost servers:

*   **Asynchronous FastAPI Controllers:** Handlers utilize standard async endpoints (`async def`) and run inside asynchronous event loops.
*   **Multi-Model Groq Fallback Architecture:** Notes synthesis requests hit the high-performance `llama-3.3-70b-versatile` model. If rate limits are met, the engine retries with the ultra-fast `llama3-8b-8192` model.
*   **Fast Text Parsing:** Uses `pdfplumber` to extract document structures in microseconds.
*   **Lightweight Embedding Models:** SentenceTransformer models (`all-MiniLM-L6-v2`) are extremely fast, run efficiently on CPUs, and require less than **90MB** of system RAM.
*   **Efficient Index Backups:** Semantic JSON files are persisted in isolated key-value structures, bypassing the overhead of external vector database servers.

---

## 🗺️ 14. Strategic Feature Roadmap

We are constantly improving StudyAI Notes to help students succeed. Here is our planned roadmap for future releases:

- [ ] **Multi-Agent Collaborative AI Tutors**
  - Synthesize virtual, personalized academic panels where different AI agents represent different viewpoints (e.g. *The Scientist*, *The Skeptic*, *The Historian*) to discuss concepts.
- [ ] **AI-Powered Concept Mind Maps**
  - Integrate dynamic node graphs that automatically link core concepts together visually to help students structure their knowledge.
- [ ] **AI Voice Study Partner**
  - Interactive verbal study mode. Talk to your notes using low-latency WebRTC connections and structured audio generation.
- [ ] **Real-Time Study Rooms**
  - Shared study rooms where groups of students can study together, share notebooks, test each other with quizzes, and chat with a shared AI study buddy.
- [ ] **Fine-Tuned Educational Models**
  - Build and fine-tune specialized open-source models (like Llama-3-8B and Mistral-7B) on high-quality academic datasets to provide better, more accurate study notes.
- [ ] **Dynamic Anki Exports**
  - Add native `.apkg` card generators to let students export cards directly to Anki with one click.
- [ ] **Cross-Platform Mobile App**
  - Build beautiful iOS and Android apps using React Native.

---

## 🐳 15. Production Deployment Guide

Deploy StudyAI Notes in production in minutes using standard Docker container orchestrators:

### Option A: Complete Multi-Container Docker Compose Setup
This handles load-balanced static React clients on Port 80 (served by Nginx), Python FastAPI REST APIs on Port 8000, and persistent databases.

1. Verify Docker and Docker Compose are installed:
   ```bash
   docker --version
   docker-compose --version
   ```
2. Build and start the cluster in the background:
   ```bash
   docker-compose up --build -d
   ```
3. Check the status of your running services:
   ```bash
   docker-compose ps
   ```
4. Access the different portals:
   *   **Student UI Portal:** `http://localhost/`
   *   **FastAPI REST APIs:** `http://localhost:8000/`
   *   **Interactive REST Docs:** `http://localhost:8000/docs`

---

### Option B: Cloud Native Deployments

#### Frontend Client (Vercel)
Deploy your React build on Vercel:
```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Backend FastAPI Engine (Railway or Render)
Deploy your backend using the included Dockerfile:
1. Connect your GitHub repository to [Railway](https://railway.app/).
2. Add your environment variables (`GROQ_API_KEY`, `SECRET_KEY`, etc.) in the dashboard settings.
3. Railway will build, run, and scale your backend Docker container automatically!

---

## 🤝 16. Open-Source Contribution Guidelines

We love contributions! Follow these steps to contribute to StudyAI Notes:

### Contribution Process
1.  **Fork the Repository:** Click the 'Fork' button at the top of the GitHub page.
2.  **Create a Feature Branch:** Build your feature inside a dedicated branch:
    ```bash
    git checkout -b feature/amazing-new-tool
    ```
3.  **Ensure Code Quality:** Format and lint your code to keep the codebase clean:
    ```bash
    # Python formatting
    black backend/app/
    
    # JavaScript linting
    cd frontend && npm run lint
    ```
4.  **Submit a Pull Request:** Describe your changes clearly and submit a PR to the main branch.

### Commit Guidelines
We use clean semantic commits to make tracking changes easy:
*   `feat: add dynamic mind map generation`
*   `fix: resolve JWT parsing issue on token refresh`
*   `docs: update installation commands for windows`
*   `perf: optimize semantic embedding search query times`

---

## 📄 17. Project License

StudyAI Notes is open-source software licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 StudyAI Engineering Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
<p align="center">
  <sub>Developed with ❤️ by the StudyAI Team to help students succeed. Happy Learning! 🎓</sub>
</p>
