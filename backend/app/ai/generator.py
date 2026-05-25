import os
import json
import requests
import logging
import re
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GroqAIGenerator:
    """
    Handles LLM content generation using Groq API.
    Gracefully falls back to a highly realistic Offline Mock Generator if GROQ_API_KEY is not configured.
    """
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.model = "llama-3.3-70b-versatile"  # High quality model
        # Fallback model in case of rate limits
        self.fallback_model = "llama3-8b-8192"

    def _call_groq(self, system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
        """Helper to invoke Groq Chat Completions API with fallback handling."""
        if not self.api_key:
            raise ValueError("Groq API key is missing.")

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            logger.info(f"Invoking Groq API model {self.model}...")
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 429: # Rate limit
                logger.warning(f"Groq Rate Limit hit. Retrying with {self.fallback_model}...")
                payload["model"] = self.fallback_model
                response = requests.post(url, headers=headers, json=payload, timeout=60)
                
            if response.status_code != 200:
                logger.error(f"Groq API Error: {response.status_code} - {response.text}")
                raise ValueError(f"Groq generation failed: {response.text}")

            result = response.json()
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")
            raise

    def generate_notes(self, document_text: str, language: str = "en") -> Tuple[str, List[Dict[str, Any]]]:
        """
        Generates highly structured Markdown study notes.
        Returns a tuple: (markdown_notes_content, list_of_topics)
        """
        if not self.api_key:
            return self._mock_generate_notes(document_text, language)

        system_prompt = (
            "You are an elite academic AI assistant. Your goal is to convert lecture materials into clean, "
            "comprehensive, and structured study notes in Markdown format. "
            f"Write the output in the requested language: {'Hindi' if language == 'hi' else 'English'}.\n\n"
            "The notes MUST include:\n"
            "1. A beautiful top-level title H1 (#)\n"
            "2. '## Quick Summary' section outlining the core themes.\n"
            "3. '## Core Concepts Explained' with H3 headings, detailed explanations, and bullet points.\n"
            "4. '## Important Formulas & Definitions' highlighting terms in bold or math notations where appropriate.\n"
            "5. '## Real-world Examples' demonstrating practical applications of the concepts.\n"
            "6. '## Exam-focused Insights & Common Gotchas' containing tips, key questions that often appear in exams, and tricky aspects.\n"
            "7. '## Simplified Analogy' explaining the hardest concept like I'm 5 years old.\n\n"
            "Structure it cleanly, using bold text, italics, blockquotes, and code blocks as appropriate for max visual excellence."
        )

        user_prompt = (
            f"Here is the lecture text:\n"
            f"====================\n"
            f"{document_text[:12000]}\n"
            f"====================\n\n"
            "Please generate the complete study notes based on this content."
        )

        try:
            markdown_content = self._call_groq(system_prompt, user_prompt, json_mode=False)
            
            # Now, extract keywords/topics in a structured format
            topics_prompt_sys = (
                "You are an expert system that extracts key topic metadata from lecture notes. "
                "You MUST respond ONLY with a JSON object. No other text or markdown code blocks outside JSON.\n"
                "JSON format:\n"
                "{\n"
                "  \"topics\": [\n"
                "    {\"name\": \"Topic Name\", \"importance\": \"High/Medium/Low\", \"category\": \"Concept/Formula/Keyword\"},\n"
                "    ...\n"
                "  ]\n"
                "}"
            )
            
            topics_raw = self._call_groq(topics_prompt_sys, f"Lecture summary notes:\n{markdown_content[:6000]}", json_mode=True)
            topics_data = json.loads(topics_raw)
            return markdown_content, topics_data.get("topics", [])
            
        except Exception as e:
            logger.warning(f"Groq Notes generation failed: {e}. Falling back to offline generation...")
            return self._mock_generate_notes(document_text, language)

    def generate_flashcards(self, document_text: str, difficulty: str = "medium") -> List[Dict[str, Any]]:
        """
        Generates a minimum of 20 high-quality Q&A flashcards.
        difficulty: easy, medium, hard
        """
        if not self.api_key:
            return self._mock_generate_flashcards(document_text, difficulty)

        system_prompt = (
            "You are an expert educator. Generate a set of high-quality study flashcards based on the provided lecture content. "
            "You MUST return ONLY a JSON object containing an array of flashcards. No other introductory or concluding text.\n"
            f"Generate flashcards tailored to the target difficulty level: '{difficulty.upper()}'.\n"
            "Produce EXACTLY 20 flashcards (or more if appropriate, but minimum 20).\n\n"
            "JSON Format Requirement:\n"
            "{\n"
            "  \"flashcards\": [\n"
            "    {\n"
            "      \"question\": \"Short, punchy question on a critical concept?\",\n"
            "      \"answer\": \"Concise, clear, and high-impact explanation.\",\n"
            "      \"difficulty\": \"easy/medium/hard\"\n"
            "    },\n"
            "    ...\n"
            "  ]\n"
            "}"
        )

        user_prompt = (
            f"Target Difficulty: {difficulty}\n"
            f"Lecture text:\n"
            f"====================\n"
            f"{document_text[:10000]}\n"
            f"====================\n"
        )

        try:
            raw_response = self._call_groq(system_prompt, user_prompt, json_mode=True)
            result = json.loads(raw_response)
            return result.get("flashcards", [])
        except Exception as e:
            logger.warning(f"Groq Flashcard generation failed: {e}. Falling back to offline generator.")
            return self._mock_generate_flashcards(document_text, difficulty)

    def generate_quiz(self, document_text: str, difficulty: str = "medium", quiz_type: str = "mcq") -> List[Dict[str, Any]]:
        """
        Generates a high-quality interactive quiz.
        Includes multiple question types: mcq, true_false, fill_blank, short_answer.
        """
        if not self.api_key:
            return self._mock_generate_quiz(document_text, difficulty, quiz_type)

        system_prompt = (
            "You are an academic test maker. Generate a comprehensive exam-style quiz based on the provided lecture content.\n"
            f"Target Difficulty: {difficulty.upper()}\n"
            "You MUST return ONLY a JSON object containing an array of questions. No surrounding conversational text.\n"
            "Include a good mix of question types (MCQ, True/False, Fill-in-the-blanks, Short Answer).\n"
            "Provide exactly 10 questions in total, balanced across the topic.\n\n"
            "JSON Format Requirement:\n"
            "{\n"
            "  \"questions\": [\n"
            "    {\n"
            "      \"question_text\": \"The text of the question...\",\n"
            "      \"question_type\": \"mcq\",  // can be 'mcq', 'true_false', 'fill_blank', 'short_answer'\n"
            "      \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],  // Required ONLY for 'mcq'\n"
            "      \"correct_answer\": \"The exact correct answer (matching one of the options for MCQ)\",\n"
            "      \"explanation\": \"A rich pedagogical explanation of why this answer is correct.\"\n"
            "    },\n"
            "    ...\n"
            "  ]\n"
            "}"
        )

        user_prompt = (
            f"Lecture text:\n"
            f"====================\n"
            f"{document_text[:10000]}\n"
            f"====================\n"
        )

        try:
            raw_response = self._call_groq(system_prompt, user_prompt, json_mode=True)
            result = json.loads(raw_response)
            return result.get("questions", [])
        except Exception as e:
            logger.warning(f"Groq Quiz generation failed: {e}. Falling back to offline generator.")
            return self._mock_generate_quiz(document_text, difficulty, quiz_type)

    def answer_chat_query(self, query_text: str, context_chunks: List[str], chat_history: List[Dict[str, str]] = None) -> str:
        """
        Generates RAG context-aware answers to student questions.
        """
        if not self.api_key:
            return self._mock_answer_chat_query(query_text, context_chunks)

        system_prompt = (
            "You are a helpful, extremely intelligent AI Study Buddy. "
            "You are discussing the lecture material with a student. "
            "Use the provided Document Context to answer the student's question accurately. "
            "If the answer cannot be found in the context, use your general knowledge but mention "
            "that it is outside the lecture notes. "
            "Keep your tone friendly, educational, encouraging, and clear. "
            "Use bold, bullet points, or lists to make your answers highly readable."
        )

        # Build context prompt
        context_str = "\n---\n".join(context_chunks)
        
        # Build history string
        history_str = ""
        if chat_history:
            history_str = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in chat_history[-6:]])

        user_prompt = (
            f"DOCUMENT CONTEXT:\n"
            f"====================\n"
            f"{context_str}\n"
            f"====================\n\n"
        )
        
        if history_str:
            user_prompt += f"RECENT CHAT HISTORY:\n{history_str}\n\n"
            
        user_prompt += f"STUDENT QUESTION: {query_text}\n"

        try:
            return self._call_groq(system_prompt, user_prompt, json_mode=False)
        except Exception as e:
            logger.warning(f"Groq RAG Chat failed: {e}. Falling back to offline chatbot.")
            return self._mock_answer_chat_query(query_text, context_chunks)

    def enhance_prompt(self, user_prompt: str) -> str:
        """
        Enhances the student's raw topic prompt into a rich, structured academic instruction set.
        """
        if not self.api_key:
            return f"[ENHANCED FOR MAXIMUM RETENTION]: Create a detailed study guide exploring the core pillars, definitions, formulas, real-world examples, and common gotchas of: {user_prompt}. Provide a quick revision analogy."

        system_prompt = (
            "You are an expert prompt enhancer. The user is a student requesting study notes on a topic. "
            "Your job is to expand their prompt to request detailed explanations, section headings, visual definitions, "
            "practical examples, mathematical formulas, and common traps. "
            "Provide ONLY the enhanced prompt content itself as raw text without any introductory chat."
        )
        try:
            return self._call_groq(system_prompt, f"Enhance this study topic: {user_prompt}", json_mode=False)
        except Exception:
            return f"[ENHANCED FOR MAXIMUM RETENTION]: Create a detailed study guide exploring the core pillars, definitions, formulas, real-world examples, and common gotchas of: {user_prompt}."

    def generate_notes_from_prompt(self, prompt: str, mode: str = "exam", length: str = "medium", language: str = "en") -> Tuple[str, List[Dict[str, Any]]]:
        """
        Generates structured Markdown study notes on a custom prompt topic.
        Returns a tuple: (markdown_content, list_of_topics)
        """
        if not self.api_key:
            return self._mock_generate_notes_from_prompt(prompt, mode, length, language)

        system_prompt = (
            f"You are a master academic study guide builder. Your goal is to generate detailed, structured, "
            f"and premium study guide notes in Markdown format based on the student's custom prompt.\n"
            f"Target Mode: {mode.upper()} (Beginner, Intermediate, Advanced, Exam Focused, Interview Focused, Research Mode).\n"
            f"Target Length: {length.upper()} (Short Notes, Medium Notes, Detailed Notes, Full Study Material).\n"
            f"Target Language: {'Hindi (हिंदी)' if language == 'hi' else 'Hinglish (mix of Hindi and English in Roman/Latin script)' if language == 'hinglish' else 'English'}.\n\n"
            "Markdown structural requirements:\n"
            "1. Beautiful top-level Title (# H1)\n"
            "2. Table of Contents\n"
            "3. H2 Quick Summary section outlining core pillars.\n"
            "4. Core Concepts Explained (H3 headings, detailed spacing, bullet points, custom markdown table if useful).\n"
            "5. Important Formulas & Definitions (highlight terms in bold, write equations in standalone $$ and inline $ notations).\n"
            "6. Real-world Examples (practical deployment or execution cases).\n"
            "7. Exam-focused Insights or Common Gotchas (> [!IMPORTANT] style visual callout card).\n"
            "8. Simplified Analogy explaining the hard concept like I'm 5 years old.\n"
            "9. Simulated Code Editor block (fenced with ```) if the topic is technical.\n\n"
            "Ensure excellent paragraph separation and spacing. Output ONLY structured, clean Markdown."
        )

        user_prompt = f"Please generate study notes for the following custom topic: {prompt}"

        try:
            markdown_content = self._call_groq(system_prompt, user_prompt, json_mode=False)
            
            # Now, extract keywords/topics in a structured format
            topics_prompt_sys = (
                "You are an expert system that extracts key topic metadata from lecture notes. "
                "You MUST respond ONLY with a JSON object. No other text or markdown code blocks outside JSON.\n"
                "JSON format:\n"
                "{\n"
                "  \"topics\": [\n"
                "    {\"name\": \"Topic Name\", \"importance\": \"High/Medium/Low\", \"category\": \"Concept/Formula/Keyword\"},\n"
                "    ...\n"
                "  ]\n"
                "}"
            )
            
            topics_raw = self._call_groq(topics_prompt_sys, f"Generated study guide summary:\n{markdown_content[:6000]}", json_mode=True)
            topics_data = json.loads(topics_raw)
            return markdown_content, topics_data.get("topics", [])
            
        except Exception as e:
            logger.warning(f"Groq Prompt Note generation failed: {e}. Falling back to offline generator...")
            return self._mock_generate_notes_from_prompt(prompt, mode, length, language)

    def generate_followup_notes(self, previous_content: str, followup_query: str, language: str = "en") -> str:
        """
        Edits and expands existing study notes based on follow-up user query.
        """
        if not self.api_key:
            # Simulated local follow-up edit
            followup_tag = f"\n\n---\n\n## 🔮 AI Follow-up: {followup_query.capitalize()}\n\nHere is some additional study content compiled based on your follow-up request:\n\n* **Key Takeaway**: Explaining the concept in simple, accessible terms.\n* **Analogy**: Imagine learning to ride a bike—at first you need support, but with practice you balance naturally.\n* **Study Tip**: Practice writing this explanation by hand once to lock it in memory!\n"
            return previous_content + followup_tag

        system_prompt = (
            "You are an elite academic notes editor. You are given the existing study notes and the student's follow-up request "
            "(e.g., 'explain simpler', 'add more examples', 'translate', 'create mnemonic devices').\n"
            "Review the existing material and output a revised, integrated, or expanded version of the study notes "
            "that fully addresses the student's request. Maintain the beautiful markdown, title, table of contents, "
            "Notion-style alerts, and code blocks.\n"
            "Ensure the entire updated note is returned as a complete, unified Markdown document. Do not add introductory chatter."
        )

        user_prompt = (
            f"EXISTING STUDY NOTES:\n{previous_content}\n\n"
            f"FOLLOW-UP REQUEST:\n{followup_query}\n"
        )
        try:
            return self._call_groq(system_prompt, user_prompt, json_mode=False)
        except Exception:
            return previous_content + f"\n\n---\n\n## 🔮 AI Follow-up: {followup_query.capitalize()}\n\nFailed to reach Groq API. Fallback follow-up content generated locally."

    # ==========================================
    # OFFLINE MOCK GENERATOR METHODS
    # ==========================================
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Simple helper to extract key academic-sounding words from text for Mocking."""
        words = re.findall(r'\b[A-Za-z]{5,15}\b', text.lower())
        stopwords = {
            "their", "there", "about", "would", "could", "should", "these", "those", "which", "where",
            "these", "after", "before", "other", "first", "under", "these", "using", "being", "through",
            "between", "without", "during", "called", "known", "means", "refers", "system", "study", "notes"
        }
        keywords = [w for w in words if w not in stopwords]
        # Get unique words maintaining frequency
        freq = {}
        for w in keywords:
            freq[w] = freq.get(w, 0) + 1
        
        sorted_kws = sorted(freq.keys(), key=lambda x: freq[x], reverse=True)
        return [w.capitalize() for w in sorted_kws[:12]]

    def _mock_generate_notes(self, text: str, language: str = "en") -> Tuple[str, List[Dict[str, Any]]]:
        """Generates realistic structured notes when running in offline/demo mode."""
        logger.info("Running offline generator for Notes...")
        kws = self._extract_keywords(text)
        
        # Primary topic name
        main_topic = kws[0] if kws else "Advanced Study Topic"
        sub_topic_1 = kws[1] if len(kws) > 1 else "Core Principles"
        sub_topic_2 = kws[2] if len(kws) > 2 else "Applied Methodology"
        
        # Build dynamic topics metadata
        topics_metadata = []
        for index, kw in enumerate(kws[:8]):
            importance = "High" if index < 3 else ("Medium" if index < 6 else "Low")
            category = "Formula" if index == 4 else ("Keyword" if index > 5 else "Concept")
            topics_metadata.append({"name": kw, "importance": importance, "category": category})

        # Sample formulas based on keywords
        formula_snippet = (
            "$$\n"
            "E = mc^2 \\quad \\text{(Einstein's Mass-Energy Equivalence)}\n"
            "$$\n"
            "$$\n"
            "\\text{Efficiency (}\\eta\\text{)} = \\frac{\\text{Useful Work Output}}{\\text{Total Energy Input}} \\times 100\\%\n"
            "$$"
        )
        if "physics" in text.lower() or "quantum" in text.lower():
            formula_snippet = (
                "**1. Planck's Equation:**\n"
                "$$\n"
                "E = h\\nu\n"
                "$$\n"
                "Where $E$ is Energy, $h$ is Planck's constant ($6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$), and $\\nu$ is frequency.\n\n"
                "**2. De Broglie Wavelength:**\n"
                "$$\n"
                "\\lambda = \\frac{h}{p} = \\frac{h}{mv}\n"
                "$$\n"
                "Where $\\lambda$ represents the particle's wavelength, and $p$ represents momentum."
            )
        elif "oop" in text.lower() or "programming" in text.lower() or "computer" in text.lower():
            formula_snippet = (
                "**1. Time Complexity (Big O):**\n"
                "- $O(1)$ - Constant Time\n"
                "- $O(\\log n)$ - Logarithmic Time (e.g. Binary Search)\n"
                "- $O(n)$ - Linear Time (e.g. Simple Loop)\n"
                "- $O(n^2)$ - Quadratic Time (e.g. Nested Loops, Bubble Sort)\n\n"
                "**2. Space Complexity:**\n"
                "Calculates the memory required by an algorithm relative to the size of its input $N$."
            )

        # Build dynamic Hindi text if language is "hi"
        if language == "hi":
            markdown = f"""# {main_topic} पर व्यापक अध्ययन नोट्स (DEMO MODE)

> [!NOTE]
> **ऑफ़लाइन / डेमो मोड:** यह नोट्स आपके अपलोडेड लेक्चर से चुनिंदा कीवर्ड्स को निकालकर ऑफ़लाइन जनरेटर द्वारा बनाए गए हैं। वास्तविक AI नोट्स के लिए कृपया `.env` में `GROQ_API_KEY` डालें।

## Quick Summary (संक्षिप्त सारांश)
यह अध्ययन सामग्री **{main_topic}** के मुख्य स्तंभों, इसके सिद्धांतों, और विद्यार्थियों के लिए महत्वपूर्ण अवधारणाओं पर केंद्रित है। इसमें प्रमुखतः **{sub_topic_1}** और **{sub_topic_2}** की व्याख्या की गई है जो परीक्षा की दृष्टि से अत्यंत महत्वपूर्ण हैं।

---

## Core Concepts Explained (मूल अवधारणाएं)

### 1. {main_topic} क्या है?
{main_topic} एक प्रमुख शैक्षणिक अवधारणा है। इसका मूल उद्देश्य विषय-वस्तु को गहराई से समझना और विश्लेषण करना है। यह निम्नलिखित तीन मुख्य स्तंभों पर टिका है:
* **प्रथम स्तंभ ({sub_topic_1}):** यह बुनियादी संरचना और नियमों को परिभाषित करता. है।
* **द्वितीय स्तंभ ({sub_topic_2}):** व्यावहारिक उपयोग में इसकी भूमिका सुनिश्चित करता है।
* **तृतीय स्तंभ ({kws[3] if len(kws) > 3 else "अनुप्रयोग"}):** वर्तमान अनुसंधान और भविष्य की उपयोगिता पर प्रकाश डालता है।

### 2. {sub_topic_1} के मूल सिद्धांत
{sub_topic_1} के मुख्य सिद्धांतों में विषय के व्यावहारिक और सैद्धांतिक दोनों पक्षों को शामिल किया जाता है। इसके अनुसार:
- **विश्वसनीयता (Reliability):** हर बार समान परिणाम प्राप्त होना।
- **सरलता (Abstraction):** जटिल प्रक्रियाओं को आसान भाषा में प्रस्तुत करना।

---

## Important Formulas & Definitions (महत्वपूर्ण सूत्र और परिभाषाएं)
1. **{main_topic} की परिभाषा:** यह एक सुनियोजित अध्ययन और प्रयोगात्मक ढांचा है जो ज्ञान के अर्जन में सहायक होता है।
2. **प्रमुख सूत्र:**
{formula_snippet}

---

## Real-world Examples (वास्तविक उदाहरण)
* **उदाहरण 1:** हमारे दैनिक जीवन में **{sub_topic_1}** का प्रयोग सामान्य समस्याओं के समाधान और कार्यकुशलता बढ़ाने में किया जाता है।
* **उदाहरण 2:** व्यावसायिक क्षेत्रों में **{sub_topic_2}** के उपयोग से उत्पादकता में 25% तक की वृद्धि देखी जा सकती है।

---

## Exam-focused Insights & Common Gotchas (परीक्षा उपयोगी बातें)
> [!IMPORTANT]
> **परीक्षा टिप:** परीक्षा में अक्सर **{main_topic}** और **{sub_topic_1}** के बीच अंतर पूछा जाता है। इसे हमेशा एक तुलनात्मक तालिका बनाकर स्पष्ट करें।
> 
> * **सामान्य गलती:** विद्यार्थी अक्सर **{sub_topic_2}** की व्याख्या करते समय इसकी मूल परिभाषा को भूल जाते हैं। ऐसा करने से अंक कट सकते हैं।

---

## Simplified Analogy (सरल सादृश्य)
**{main_topic}** को ऐसे समझें जैसे आप एक नई भाषा सीख रहे हों। पहले आप वर्णमाला सीखे हैं (**{sub_topic_1}**), फिर आप वाक्य बनाना सीखते हैं (**{sub_topic_2}**), और अंत में आप धाराप्रवाह बातचीत करने लगते हैं!
"""
            return markdown, topics_metadata

        # English notes
        markdown = f"""# Comprehensive Study Guide: {main_topic} (DEMO MODE)

> [!NOTE]
> **Offline / Demo Mode Active:** This comprehensive study guide has been synthesized locally using key extraction from your uploaded text. For full Generative AI notes, please register a `GROQ_API_KEY` in the backend `.env` file.

## Quick Summary
This study guide breaks down the core concepts of **{main_topic}**, exploring its definitions, functional models, and key parameters. We focus heavily on the theoretical underpinnings of **{sub_topic_1}** and the practical implementations of **{sub_topic_2}**. These topics constitute approximately 70% of exam syllabi in this domain.

---

## Core Concepts Explained

### 1. Understanding {main_topic}
At its core, **{main_topic}** represents a paradigm shift in how we analyze data, processes, and structures. It can be characterized by three primary layers:
* **The Foundational Layer ({sub_topic_1}):** Serves as the structural bedrock, dictating constraints and parameters.
* **The Operational Layer ({sub_topic_2}):** Dictates how active modules perform computation, tasks, or behaviors.
* **The Optimization Layer ({kws[3] if len(kws) > 3 else "Performance"}):** Handles fine-tuning, error correction, and long-term adaptation.

### 2. Deep-Dive into {sub_topic_1}
**{sub_topic_1}** operates under a set of deterministic principles that govern behavior. When designing or reviewing these systems, keep these parameters in mind:
- **Encapsulation of State:** Keeping localized values insulated from global processes.
- **Dynamic Adaptability:** Modifying responses based on changing environmental variables.

---

## Important Formulas & Definitions

* **{main_topic}**: The systematic methodology of structuring, analyzing, and optimizing concepts and operations to yield maximum utility.
* **{sub_topic_1}**: The core architectural model that enforces safety, consistency, and structural integrity.
* **Mathematical Representations & Equations:**
{formula_snippet}

---

## Real-world Examples
* **Example A (Consumer Scale):** Modern applications implement **{sub_topic_2}** in high-throughput engines to serve millions of simultaneous queries.
* **Example B (Academic/Research):** Scientific groups utilize **{sub_topic_1}** structures to simulate particle collisions or complex molecular structures with high accuracy.

---

## Exam-focused Insights & Common Gotchas

> [!IMPORTANT]
> **Exam Prep Focus:** Review the critical distinction between **{sub_topic_1}** and **{sub_topic_2}**. Exam questions frequently test your ability to explain when to use one model over another under strict resource constraints.
> 
> * **Common Trap:** Do not confuse **{kws[3] if len(kws) > 3 else "Performance"}** with **{sub_topic_2}**. The latter represents execution, whereas the former represents evaluation.

---

## Simplified Analogy
Imagine **{main_topic}** is like building a premium skyscraper. 
* **{sub_topic_1}** is the structural steel skeleton - rigid, holding everything together, and ensuring it won't fall down.
* **{sub_topic_2}** is the elevator systems, plumbing, and electricity - active components that make the building functional and liveable.
Without both working together, you just have a useless pile of metal or a building that collapses!
"""
        return markdown, topics_metadata

    def _mock_generate_flashcards(self, text: str, difficulty: str) -> List[Dict[str, Any]]:
        """Generates 20+ realistic mock flashcards based on extracted keywords."""
        logger.info(f"Running offline generator for Flashcards ({difficulty})...")
        kws = self._extract_keywords(text)
        
        main_t = kws[0] if kws else "Subject Matter"
        sub_t = kws[1] if len(kws) > 1 else "Core Principles"
        third_t = kws[2] if len(kws) > 2 else "Practical Use Case"
        
        # Build 20 dynamic study cards
        flashcards = [
            {"question": f"What is the primary definition of {main_t}?", "answer": f"{main_t} refers to the foundational system of concepts, architectures, and guidelines designed to organize and analyze this subject matter effectively.", "difficulty": "easy"},
            {"question": f"What is the role of {sub_t} within this domain?", "answer": f"It acts as a primary operational construct, enforcing rules, consistency, and structural integrity across the system.", "difficulty": "easy"},
            {"question": f"How does {third_t} interact with {main_t}?", "answer": f"It provides the practical, real-world context and application parameters that make {main_t} useful in industrial or research settings.", "difficulty": "medium"},
            {"question": f"What is the difference between {sub_t} and {third_t}?", "answer": f"{sub_t} is the theoretical framework or constraint structure, whereas {third_t} is the actual operational implementation or runtime execution.", "difficulty": "hard"},
        ]
        
        # Add general academic cards to fill up to 20 cards
        for idx in range(len(flashcards), 20):
            kw = kws[idx % len(kws)] if kws else "Concept"
            diff = "easy" if idx < 8 else ("medium" if idx < 15 else "hard")
            
            flashcards.append({
                "question": f"Why is the study of **{kw}** critical to mastering this topic?",
                "answer": f"Mastering **{kw}** allows students to correctly predict system behaviors, resolve optimization bottlenecks, and understand core exam questions.",
                "difficulty": diff
            })
            
        return flashcards

    def _mock_generate_quiz(self, text: str, difficulty: str, quiz_type: str) -> List[Dict[str, Any]]:
        """Generates 10 high-quality mock questions (MCQs, True/False, Fill in the blank, Short Answer)."""
        logger.info(f"Running offline generator for Quiz ({difficulty}, {quiz_type})...")
        kws = self._extract_keywords(text)
        
        main_t = kws[0] if kws else "Subject"
        sub_t = kws[1] if len(kws) > 1 else "Principle"
        third_t = kws[2] if len(kws) > 2 else "Application"
        
        questions = [
            {
                "question_text": f"Which of the following best describes the primary function of **{main_t}**?",
                "question_type": "mcq",
                "options": [
                    f"To design a theoretical framework and guidelines for {sub_t}",
                    f"To completely replace the operational layers of {third_t}",
                    "To minimize all mathematical constraints to absolute zero",
                    "To act as a secondary data backup with no execution capability"
                ],
                "correct_answer": f"To design a theoretical framework and guidelines for {sub_t}",
                "explanation": f"{main_t} provides the overarching structure and guidelines that make the deployment of {sub_t} possible and consistent."
            },
            {
                "question_text": f"True or False: **{sub_t}** represents the operational execution, while **{third_t}** defines the rules and constraints.",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "False",
                "explanation": f"Actually, the reverse is true! **{sub_t}** defines the rules and constraints, while **{third_t}** represents the operational execution."
            },
            {
                "question_text": f"In academic examinations, ___________ is frequently cited as the primary bottleneck in optimizing {main_t} performance.",
                "question_type": "fill_blank",
                "correct_answer": f"resource constraints",
                "explanation": f"Resource constraints (such as time, CPU, memory, or budget) limit how effectively we can scale the implementations of {main_t}."
            },
            {
                "question_text": f"Explain briefly how **{third_t}** helps in modern industrial applications.",
                "question_type": "short_answer",
                "correct_answer": "By bridging theoretical formulas with actual machinery or software loops, improving output speed and reducing error margins.",
                "explanation": f"{third_t} translates abstract equations into physical outputs, leading to a direct increase in automation and throughput."
            }
        ]
        
        # Populate up to 10 questions
        for idx in range(len(questions), 10):
            kw = kws[idx % len(kws)] if kws else "Concept"
            q_type = "mcq" if idx % 2 == 0 else "true_false"
            
            if q_type == "mcq":
                questions.append({
                    "question_text": f"Why is **{kw}** considered highly significant in this context?",
                    "question_type": "mcq",
                    "options": [
                        f"Because it represents the core optimization layer of the topic.",
                        "Because it decreases overall system stability and increases errors.",
                        "Because it has no relevance to academic scoring or exams.",
                        "Because it was discovered by accident and has only minor utility."
                    ],
                    "correct_answer": f"Because it represents the core optimization layer of the topic.",
                    "explanation": f"Mastery of {kw} allows systems to scale efficiently, which is why it is highly prized in both academia and production environments."
                })
            else:
                questions.append({
                    "question_text": f"True or False: A solid understanding of **{kw}** reduces common study traps and helps avoid exam mistakes.",
                    "question_type": "true_false",
                    "options": ["True", "False"],
                    "correct_answer": "True",
                    "explanation": f"{kw} is a frequently misunderstood topic. A clear, solid grasp on its definition directly prevents common mistakes."
                })
                
        return questions

    def _mock_answer_chat_query(self, query_text: str, context_chunks: List[str]) -> str:
        """Offline chatbot that parses user's query and matches it against context chunks."""
        logger.info("Running offline chatbot...")
        query_lower = query_text.lower()
        
        # Try to find a chunk containing terms from the query
        matching_chunks = []
        words = re.findall(r'\w+', query_lower)
        important_words = [w for w in words if len(w) > 4]
        
        for chunk in context_chunks:
            match_score = 0
            for w in important_words:
                if w in chunk.lower():
                    match_score += 1
            if match_score > 0:
                matching_chunks.append((match_score, chunk))
                
        # Sort by match score
        matching_chunks.sort(key=lambda x: x[0], reverse=True)
        
        if matching_chunks:
            best_chunk = matching_chunks[0][1]
            return (
                f"**Offline Assistant (Demo Mode):**\n\n"
                f"Based on your notes, here is the relevant explanation I found:\n\n"
                f"> {best_chunk}\n\n"
                f"Is there a specific detail you would like me to expand on? "
                f"*(Note: Paste your `GROQ_API_KEY` in the `.env` file to chat with our fully conversational RAG AI model!)*"
            )
            
        # Generic academic explanation if no text overlaps
        return (
            f"**Offline Assistant (Demo Mode):**\n\n"
            f"I didn't find an exact matching section in your uploaded document, but here is a general academic breakdown:\n\n"
            f"- **Core Intent:** Your question relates to key concepts in the study material. "
            f"In general, it is best to study the **Summaries** and review the **Flashcards** for active recall.\n"
            f"- **Formula Focus:** Remember to check the mathematical or structural definitions, as they provide quantitative answers.\n\n"
            f"What specific topic or question from the lecture can I help clarify?"
        )

    def _mock_generate_notes_from_prompt(self, prompt: str, mode: str, length: str, language: str) -> Tuple[str, List[Dict[str, Any]]]:
        """Synthesizes high-fidelity offline mock notes based on a custom prompt topic."""
        logger.info(f"Running offline prompt-to-notes generator ({mode}, {length}, {language})...")
        
        # Clean topic title
        topic = prompt.strip().replace('"', '').replace("'", "")
        # Capitalize words
        topic_title = " ".join([w.capitalize() for w in topic.split()])
        if len(topic_title) > 60:
            topic_title = topic_title[:57] + "..."
            
        topics_metadata = [
            {"name": topic_title, "importance": "High", "category": "Concept"},
            {"name": "Core Principles", "importance": "High", "category": "Concept"},
            {"name": "Practical Applications", "importance": "Medium", "category": "Keyword"},
            {"name": "Revision Summary", "importance": "Low", "category": "Keyword"}
        ]

        formula_snippet = (
            "$$\n"
            "f(x) = \\int_{-\\infty}^{\\infty} F(t) e^{-2\\pi i x t} dt \\quad \\text{(Fourier Transform Block)}\n"
            "$$\n"
            "$$\n"
            "\\text{Learning Objective} = \\text{Focus} \\times \\text{Time Spent} \\times \\text{Active Recall}\n"
            "$$"
        )

        code_snippet = (
            "```python\n"
            "# Elegant prompt representation module\n"
            "def study_smart(topic, mode):\n"
            "    print(f'AI Notes: Analyzing {topic} in {mode} style')\n"
            "    core_pillars = ['Theoretical Bedrock', 'Practical Application', 'Exam Insights']\n"
            "    return core_pillars\n"
            "\n"
            "pillars = study_smart('" + topic_title + "', '" + mode + "')\n"
            "for idx, p in enumerate(pillars):\n"
            "    print(f'{idx+1}. {p}')\n"
            "```"
        )

        if language == "hi":
            # Hindi representation
            content = f"""# {topic_title} पर विस्तृत अध्ययन गाइड (AI generated)

## Quick Summary (संक्षिप्त सारांश)
यह अध्ययन गाइड **{topic_title}** की व्याख्या करने के लिए बनाई गई है। इस नोट्स का स्तर **{mode.upper()}** के अनुकूल तैयार किया गया है, और इसका प्रकार **{length.upper()}** के अनुसार अनुकूलित है।

---

## Core Concepts Explained (मूल अवधारणाएं)

### 1. {topic_title} की बुनियादी समझ
**{topic_title}** आधुनिक पाठ्यक्रम का एक मुख्य हिस्सा है। इसके अंतर्गत निम्नलिखित बिंदुओं पर विशेष ध्यान दिया जाता है:
* **प्रथम सिद्धांत:** विषय की गहराइयों को आसान भाषा में समझना।
* **व्यावहारिक ढांचा:** प्राप्त ज्ञान को वास्तविक जीवन की समस्याओं को सुलझाने में लागू करना।
* **परीक्षा मार्गदर्शन:** उन महत्वपूर्ण प्रश्नों की पहचान करना जो अक्सर परीक्षाओं में पूछे जाते हैं।

### 2. {topic_title} का महत्व
शैक्षणिक और व्यावसायिक दोनों क्षेत्रों में इसकी महत्वपूर्ण भूमिका है। इसे समझने से विद्यार्थी जटिल प्रक्रियाओं का आसानी से विश्लेषण कर सकते हैं।

---

## Important Formulas & Definitions (महत्वपूर्ण सूत्र और परिभाषाएं)
* **परिभाषा:** {topic_title} वह प्रयोगात्मक और सैद्धांतिक पद्धति है जो विषय-वस्तु का व्यवस्थित ज्ञान प्रदान करती है।
* **गणितीय सूत्र:**
{formula_snippet}

---

## Real-world Examples (वास्तविक उदाहरण)
* **उदाहरण 1:** सॉफ्टवेयर और विज्ञान के क्षेत्रों में **{topic_title}** का उपयोग उच्च गुणवत्ता वाले गणना कार्यों को करने में किया जाता है।
* **उदाहरण 2:** दैनिक जीवन में इसके सिद्धांतों का पालन करके जटिल समस्याओं को छोटे-छोटे चरणों में विभाजित किया जा सकता है।

---

## Exam-focused Insights & Common Gotchas (परीक्षा उपयोगी बातें)
> [!IMPORTANT]
> **परीक्षा फोकस टिप:** परीक्षा में अक्सर **{topic_title}** के तीन प्रमुख स्तंभों के बारे में पूछा जाता है। इसे हमेशा एक तुलनात्मक आरेख या तालिका बनाकर स्पष्ट करें।
> 
> * **सामान्य गलती:** विद्यार्थी अक्सर सिद्धांतों की व्याख्या करते समय वास्तविक उदाहरणों को छोड़ देते हैं, जिससे अंक कट सकते हैं।

---

## Simplified Analogy (सरल सादृश्य)
**{topic_title}** को ऐसे समझें जैसे आप एक नया खेल सीख रहे हैं। पहले आप उसके नियम समझते हैं, फिर अभ्यास करते हैं, और अंततः उसमें महारत हासिल कर लेते हैं!

---

## Technical Snippet (तकनीकी कोड)
{code_snippet}
"""
        elif language == "hinglish":
            # Hinglish representation
            content = f"""# Master Study Guide: {topic_title} (Hinglish Study Notes)

## Quick Summary
Hello students! Aaj hum **{topic_title}** ke baare mein detail mein baat karenge. Yeh notes aapki **{mode.upper()}** learning style aur **{length.upper()}** length preference ke hisab se generate kiye gaye hain. Isse padhne ke baad aapko topic ekdum crystal clear ho jayega!

---

## Core Concepts Explained

### 1. {topic_title} Kya Hai? (Basics)
Simply put, **{topic_title}** ek aisi methodology hai jo humein concepts ko systematically analyse karne mein help karti hai. Iske 3 main pillars hote hain:
* **Theoretical Pillar:** Jo basic concepts aur rules ko define karta hai.
* **Practical Application:** Jo real-life problems ko solve karne mein kaam aata hai.
* **Exam Insights:** Jo exams mein higher scores achieve karne mein help karta hai.

### 2. Yeh Kyu Important Hai?
Mastering **{topic_title}** is very important kyunki isse aapki problem-solving skills strong hoti hain aur exams mein typical logic-based questions easily solve ho jaate hain.

---

## Important Formulas & Definitions
* **Main Definition:** {topic_title} represents the core concept of structuring and optimizing workflows to get maximum output with minimum effort.
* **Equations & Formulas:**
{formula_snippet}

---

## Real-world Examples
* **Example A:** Corporate companies aur development teams **{topic_title}** ka use karti hain taaki application performance aur task execution fast ho sake.
* **Example B:** Hum daily life mein scheduling aur prioritization karte hain, jo isi concept ka ek practical example hai.

---

## Exam-focused Insights & Common Gotchas
> [!IMPORTANT]
> **Exam Warning:** Students aksar theoretical definition to sahi likhte hain, par **{topic_title}** ke application-based questions mein logical error kar dete hain. Hamesha question ko acche se read karein!
> 
> * **Common Gotcha:** Kuch students confusion mein basic formulas interchange kar dete hain. Formula sheets ko daily revise karein!

---

## Simplified Analogy
**{topic_title}** ko ek simple story se samjho: 
Aap ek game khel rahe ho. Pehle aap rules seekhte ho, fir simple level clear karte ho, aur dheere-dheere master ban jaate ho. Pehle rule samajhna hi foundation hai!

---

## Technical Snippet (Implementation)
{code_snippet}
"""
        else:
            # Standard English notes
            content = f"""# Master Study Guide: {topic_title}

## Quick Summary
This comprehensive guide is designed to help you master **{topic_title}** efficiently. This notebook has been dynamically generated under the **{mode.upper()}** learning mode and optimized to a **{length.upper()}** layout to balance thoroughness with active revision.

---

## Core Concepts Explained

### 1. Understanding {topic_title}
At its core, **{topic_title}** represents a highly structured academic framework. Mastering this topic requires understanding three primary layers:
* **The Foundation Layer:** Serves as the structural bedrock, governing basic laws and definitions.
* **The Application Layer:** Operates in practical environments, showing how theoretical formulas perform real-world work.
* **The Assessment Layer:** Highlights the specific segments tested heavily in academic examinations.

### 2. Key Objectives & Scope
This guide clarifies core elements, helping students formulate clear mental maps of complex logic trees.

---

## Important Formulas & Definitions
* **Core Definition:** {topic_title} is defined as the systematic methodology of structuring, analyzing, and optimizing workflows to achieve academic and operational excellence.
* **Mathematical Representations:**
{formula_snippet}

---

## Real-world Examples
* **Example 1 (Industrial Deployment):** High-volume software suites use **{topic_title}** algorithms to optimize server request load routing.
* **Example 2 (Scientific Labs):** Physics laboratories apply these rules to evaluate thermal dissipation structures under simulated stress test scenarios.

---

## Exam-focused Insights & Common Gotchas
> [!IMPORTANT]
> **Exam Strategy Tip:** Pay close attention to how **{topic_title}** is defined under extreme resource constraints. Exam makers regularly design trick questions around this exact boundary!
> 
> * **Common Trap:** Do not confuse base equations with optimization multipliers. The multipliers only apply during scaling phases.

---

## Simplified Analogy
Think of **{topic_title}** like baking a gourmet cake.
* The recipe is your theoretical framework (safety rules, ingredient proportions).
* The actual baking, mixing, and heating represent practical application.
* The final decoration is your optimization—it's what makes it presentable and ready for evaluation!

---

## Technical Snippet
{code_snippet}
"""
        return content, topics_metadata


# Singleton AI Generator
ai_generator = GroqAIGenerator()
