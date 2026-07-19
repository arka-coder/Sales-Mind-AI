"""
RAG Pipeline — Document ingestion, embedding, and semantic retrieval for SalesMind AI.
Supports PDF, DOCX, TXT, CSV, and Markdown files.
"""
import os
import uuid
import logging
import hashlib
from typing import List, Dict, Any, Optional
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer

from config import settings

logger = logging.getLogger(__name__)


# ============================================
# DOCUMENT CHUNKER
# ============================================

class DocumentChunker:
    """Splits documents into overlapping chunks for optimal RAG performance."""

    def __init__(self, chunk_size: int = 512, overlap: int = 64):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str, metadata: Dict = {}) -> List[Dict]:
        """Split text into overlapping chunks."""
        chunks = []
        words = text.split()
        
        i = 0
        chunk_idx = 0
        while i < len(words):
            chunk_words = words[i:i + self.chunk_size]
            chunk_text = " ".join(chunk_words)
            
            if len(chunk_text.strip()) > 50:  # Skip tiny chunks
                chunks.append({
                    "text": chunk_text,
                    "metadata": {
                        **metadata,
                        "chunk_index": chunk_idx,
                        "word_count": len(chunk_words)
                    }
                })
                chunk_idx += 1
            
            i += self.chunk_size - self.overlap
        
        return chunks

    def parse_pdf(self, file_path: str) -> str:
        """Extract text from PDF."""
        try:
            import PyPDF2
            text_parts = []
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
            return "\n\n".join(text_parts)
        except Exception as e:
            logger.error(f"PDF parsing error: {e}")
            return ""

    def parse_docx(self, file_path: str) -> str:
        """Extract text from DOCX."""
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
        except Exception as e:
            logger.error(f"DOCX parsing error: {e}")
            return ""

    def parse_txt(self, file_path: str) -> str:
        """Extract text from TXT/MD."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            logger.error(f"TXT parsing error: {e}")
            return ""

    def parse_csv(self, file_path: str) -> str:
        """Convert CSV to readable text."""
        try:
            import pandas as pd
            df = pd.read_csv(file_path)
            return df.to_string(index=False)
        except Exception as e:
            logger.error(f"CSV parsing error: {e}")
            return ""

    def parse_file(self, file_path: str, file_type: str) -> str:
        """Parse any supported file type."""
        parsers = {
            "pdf": self.parse_pdf,
            "docx": self.parse_docx,
            "txt": self.parse_txt,
            "md": self.parse_txt,
            "csv": self.parse_csv,
        }
        parser = parsers.get(file_type.lower())
        if parser:
            return parser(file_path)
        return ""


# ============================================
# VECTOR STORE
# ============================================

class VectorStore:
    """ChromaDB vector store with sentence-transformer embeddings."""

    _instance = None
    _client = None
    _collection = None
    _embedder = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._initialize()

    def _initialize(self):
        """Initialize ChromaDB and embedding model."""
        try:
            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            
            self._client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR
            )
            
            self._collection = self._client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            
            # Use a lightweight but effective model
            self._embedder = SentenceTransformer("all-MiniLM-L6-v2")
            
            logger.info(f"VectorStore initialized. Collection has {self._collection.count()} documents.")
        except Exception as e:
            logger.error(f"VectorStore initialization error: {e}")
            raise

    def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        return self._embedder.encode(texts, convert_to_numpy=True).tolist()

    def add_chunks(self, chunks: List[Dict], document_id: str) -> int:
        """Add document chunks to vector store."""
        if not chunks:
            return 0

        texts = [c["text"] for c in chunks]
        embeddings = self.embed(texts)
        
        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [c["metadata"] for c in chunks]
        
        self._collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )
        
        return len(chunks)

    def query(self, query_text: str, n_results: int = 5, 
              where: Optional[Dict] = None) -> List[Dict]:
        """Semantic search over knowledge base."""
        query_embedding = self.embed([query_text])[0]
        
        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": min(n_results, max(1, self._collection.count())),
            "include": ["documents", "metadatas", "distances"]
        }
        if where:
            kwargs["where"] = where
        
        results = self._collection.query(**kwargs)
        
        output = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                output.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "relevance_score": 1 - (results["distances"][0][i] if results["distances"] else 0),
                })
        
        # Sort by relevance
        output.sort(key=lambda x: x["relevance_score"], reverse=True)
        return output

    def delete_document(self, document_id: str):
        """Remove all chunks for a document."""
        try:
            self._collection.delete(where={"document_id": document_id})
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")

    def count(self) -> int:
        return self._collection.count()


# ============================================
# RAG PIPELINE
# ============================================

class RAGPipeline:
    """Full RAG pipeline: ingest → chunk → embed → store → retrieve."""

    def __init__(self):
        self.chunker = DocumentChunker(chunk_size=400, overlap=50)
        self.vector_store = VectorStore.get_instance()

    async def ingest_document(
        self, 
        file_path: str, 
        document_id: str,
        file_type: str,
        document_name: str,
        tags: List[str] = []
    ) -> int:
        """Full ingestion pipeline for a document file."""
        try:
            # Parse document
            text = self.chunker.parse_file(file_path, file_type)
            if not text.strip():
                raise ValueError("No text content extracted from document")

            # Chunk with metadata
            metadata = {
                "document_id": document_id,
                "document_name": document_name,
                "file_type": file_type,
                "tags": ",".join(tags)
            }
            chunks = self.chunker.chunk_text(text, metadata)
            
            if not chunks:
                raise ValueError("No chunks generated from document")

            # Add to vector store
            count = self.vector_store.add_chunks(chunks, document_id)
            logger.info(f"Ingested {count} chunks from document '{document_name}'")
            return count

        except Exception as e:
            logger.error(f"Document ingestion failed: {e}")
            raise

    def retrieve(self, query: str, n_results: int = 5, 
                 document_filter: Optional[str] = None) -> List[Dict]:
        """Retrieve relevant chunks for a query."""
        where = None
        if document_filter:
            where = {"document_id": document_filter}
        return self.vector_store.query(query, n_results, where)

    def format_context(self, chunks: List[Dict]) -> str:
        """Format retrieved chunks into a coherent context string."""
        if not chunks:
            return "No relevant information found in the knowledge base."
        
        parts = []
        for i, chunk in enumerate(chunks, 1):
            source = chunk["metadata"].get("document_name", "Unknown")
            score = chunk["relevance_score"]
            parts.append(
                f"[Source {i}: {source} (relevance: {score:.2f})]\n{chunk['content']}"
            )
        
        return "\n\n---\n\n".join(parts)


# Singleton
_rag_pipeline: Optional[RAGPipeline] = None

def get_rag_pipeline() -> RAGPipeline:
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline()
    return _rag_pipeline
