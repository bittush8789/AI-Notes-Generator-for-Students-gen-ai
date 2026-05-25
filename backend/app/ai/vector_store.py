import os
import json
import re
import math
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Try to import numpy and sentence-transformers
try:
    import numpy as np
except ImportError:
    np = None

try:
    from sentence_transformers import SentenceTransformer
except BaseException:
    SentenceTransformer = None

class RecursiveTextSplitter:
    """
    Pure-python implementation of recursive character splitting.
    Splits text by double newlines, single newlines, spaces, and finally characters.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        if not text:
            return []
        
        # Simple splitting hierarchy
        separators = ["\n\n", "\n", ". ", " ", ""]
        
        return self._split(text, separators, self.chunk_size, self.chunk_overlap)

    def _split(self, text: str, separators: List[str], max_size: int, overlap: int) -> List[str]:
        if len(text) <= max_size:
            return [text]
        
        # Select best separator
        separator = separators[-1]
        for s in separators:
            if s in text:
                separator = s
                break
        
        # Split by the separator
        if separator == "":
            splits = list(text)
        else:
            splits = text.split(separator)
            
        chunks = []
        current_chunk = ""
        
        for part in splits:
            # Re-append separator except if it's empty
            part_str = part + (separator if separator != "" else "")
            
            if len(current_chunk) + len(part_str) > max_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                
                # Setup next chunk with overlap
                if overlap > 0 and len(current_chunk) > overlap:
                    overlap_start = max(0, len(current_chunk) - overlap)
                    current_chunk = current_chunk[overlap_start:] + part_str
                else:
                    current_chunk = part_str
            else:
                current_chunk += part_str
                
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        # If any chunk is still too big, split it recursively with finer separators
        final_chunks = []
        next_separators = separators[separators.index(separator) + 1:] if separator in separators else separators
        
        for chunk in chunks:
            if len(chunk) > max_size and next_separators:
                final_chunks.extend(self._split(chunk, next_separators, max_size, overlap))
            else:
                final_chunks.append(chunk)
                
        return [c for c in final_chunks if c]


class LocalVectorStore:
    """
    A compile-free Vector Store that uses SentenceTransformers for semantic embeddings,
    and fallback to an elegant pure-python BM25-based keyword index if torch/sentence-transformers are missing.
    """
    def __init__(self, persist_dir: str = "vector_store"):
        self.persist_dir = persist_dir
        os.makedirs(persist_dir, exist_ok=True)
        
        # Loaded model for embeddings
        self.model = None
        self._load_model()
        
        # Document index storage: {note_id: {"chunks": [...], "embeddings": [[...], ...]}}
        self.indices: Dict[str, Dict[str, Any]] = {}
        
    def _load_model(self):
        """Loads the SentenceTransformer model in a non-blocking/fail-safe way."""
        if SentenceTransformer is not None:
            try:
                logger.info("Initializing SentenceTransformer model (all-MiniLM-L6-v2)...")
                # Use a small, high-performance, lightweight embedding model (approx 90MB)
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("SentenceTransformer model loaded successfully!")
            except Exception as e:
                logger.warning(f"Failed to load SentenceTransformer: {e}. Falling back to Keyword retrieval.")
                self.model = None
        else:
            logger.info("sentence-transformers library not installed. Using Keyword BM25 fallback retrieval.")

    def add_note_content(self, note_id: int, content: str):
        """Splits note content into chunks, calculates embeddings (or term freqs), and stores them."""
        splitter = RecursiveTextSplitter(chunk_size=800, chunk_overlap=150)
        chunks = splitter.split_text(content)
        
        if not chunks:
            logger.warning(f"No chunks generated for note {note_id}")
            return
            
        note_key = str(note_id)
        
        if self.model is not None and np is not None:
            try:
                logger.info(f"Generating embeddings for {len(chunks)} chunks of note {note_id}...")
                embeddings = self.model.encode(chunks)
                # Convert to list for JSON serialization
                embeddings_list = embeddings.tolist()
                
                self.indices[note_key] = {
                    "chunks": chunks,
                    "embeddings": embeddings_list,
                    "type": "semantic"
                }
                self._save_index(note_key)
                return
            except Exception as e:
                logger.error(f"Error generating embeddings: {e}. Falling back to TF-IDF/Keyword index.")
        
        # Fallback keyword index (TF-IDF bag of words representation)
        logger.info(f"Indexing {len(chunks)} chunks using TF-IDF for note {note_id}...")
        self.indices[note_key] = {
            "chunks": chunks,
            "type": "keyword",
            "terms": self._build_tf_idf_index(chunks)
        }
        self._save_index(note_key)

    def _build_tf_idf_index(self, chunks: List[str]) -> List[Dict[str, float]]:
        """Builds lightweight term frequency dictionaries for each chunk."""
        chunk_tfs = []
        for chunk in chunks:
            # Tokenize and clean
            words = re.findall(r'\w+', chunk.lower())
            tf = {}
            for w in words:
                tf[w] = tf.get(w, 0) + 1
            # Normalize TF
            total_words = len(words) or 1
            tf_norm = {w: count / total_words for w, count in tf.items()}
            chunk_tfs.append(tf_norm)
        return chunk_tfs

    def _save_index(self, note_key: str):
        """Saves a single note index to disk."""
        filepath = os.path.join(self.persist_dir, f"note_{note_key}.json")
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(self.indices[note_key], f, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to persist index for note {note_key}: {e}")

    def _load_index(self, note_key: str) -> bool:
        """Loads index from file if it is not already in memory."""
        if note_key in self.indices:
            return True
        
        filepath = os.path.join(self.persist_dir, f"note_{note_key}.json")
        if not os.path.exists(filepath):
            return False
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                self.indices[note_key] = json.load(f)
            return True
        except Exception as e:
            logger.error(f"Failed to load index from {filepath}: {e}")
            return False

    def query(self, note_id: int, query_text: str, top_k: int = 3) -> List[str]:
        """Queries the vector/keyword index to retrieve the top_k relevant chunks."""
        note_key = str(note_id)
        if not self._load_index(note_key):
            logger.warning(f"No index found for note {note_id}")
            return []
            
        index_data = self.indices[note_key]
        chunks = index_data.get("chunks", [])
        
        if not chunks:
            return []

        # Semantic Search (Cosine Similarity)
        if index_data.get("type") == "semantic" and self.model is not None and np is not None:
            try:
                query_emb = self.model.encode(query_text)
                chunk_embs = np.array(index_data["embeddings"])
                
                # Calculate Cosine Similarity
                dot_product = np.dot(chunk_embs, query_emb)
                chunk_norms = np.linalg.norm(chunk_embs, axis=1)
                query_norm = np.linalg.norm(query_emb)
                
                similarities = dot_product / (chunk_norms * query_norm + 1e-9)
                top_indices = np.argsort(similarities)[::-1][:top_k]
                
                return [chunks[i] for i in top_indices]
            except Exception as e:
                logger.error(f"Semantic query failed: {e}. Falling back to keyword query.")

        # Keyword Search (TF-IDF Overlap Score)
        query_words = re.findall(r'\w+', query_text.lower())
        if not query_words:
            return chunks[:top_k]
            
        chunk_tfs = index_data.get("terms", [])
        if not chunk_tfs:
            # Fallback if no term frequencies are available
            return chunks[:top_k]
            
        scores = []
        # Calculate TF-IDF-like match for each chunk
        for tf in chunk_tfs:
            score = 0.0
            for qw in query_words:
                if qw in tf:
                    # Simple term match count weighted by tf
                    score += tf[qw]
            scores.append(score)
            
        # Get top-K indices
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        return [chunks[i] for i in top_indices]

# Singleton instance of vector store
vector_store = LocalVectorStore()
