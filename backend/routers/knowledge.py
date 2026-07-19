"""
Knowledge Router — Document upload and RAG-powered queries.
"""
import uuid
import os
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List

from models.schemas import KnowledgeQuery
from database.supabase_client import get_supabase
from rag.pipeline import get_rag_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/knowledge", tags=["Knowledge"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"pdf", "docx", "txt", "csv", "md"}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form("")
):
    """Upload a document and add it to the knowledge base."""
    db = get_supabase()
    rag = get_rag_pipeline()
    
    # Get file extension
    file_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if file_ext not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_TYPES)}"
        )
    
    doc_id = str(uuid.uuid4())
    doc_name = name or file.filename.rsplit(".", 1)[0]
    tags_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.{file_ext}")
    content = await file.read()
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create DB record (processing state)
    db_record = {
        "id": doc_id,
        "name": doc_name,
        "original_filename": file.filename,
        "file_type": file_ext,
        "file_size_bytes": len(content),
        "status": "processing",
        "chunk_count": 0,
        "description": description,
        "tags": tags_list,
        "storage_path": file_path,
    }
    
    try:
        db.table("documents").insert(db_record).execute()
    except Exception as e:
        logger.error(f"DB insert failed: {e}")
    
    # Process and embed
    try:
        chunk_count = await rag.ingest_document(
            file_path=file_path,
            document_id=doc_id,
            file_type=file_ext,
            document_name=doc_name,
            tags=tags_list
        )
        
        # Update status
        db.table("documents").update({
            "status": "ready",
            "chunk_count": chunk_count
        }).eq("id", doc_id).execute()
        
        return {
            "document_id": doc_id,
            "name": doc_name,
            "file_type": file_ext,
            "chunk_count": chunk_count,
            "status": "ready"
        }
    except Exception as e:
        logger.error(f"Document processing error: {e}")
        db.table("documents").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", doc_id).execute()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/documents")
async def get_documents():
    """List all documents in the knowledge base."""
    db = get_supabase()
    try:
        result = db.table("documents").select("*") \
            .order("created_at", desc=True).execute()
        return {"documents": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Remove a document from the knowledge base."""
    db = get_supabase()
    rag = get_rag_pipeline()
    
    try:
        # Get document info
        result = db.table("documents").select("storage_path") \
            .eq("id", document_id).execute()
        
        if result.data:
            # Remove from vector store
            rag.vector_store.delete_document(document_id)
            
            # Remove file
            storage_path = result.data[0].get("storage_path")
            if storage_path and os.path.exists(storage_path):
                os.remove(storage_path)
        
        # Remove from DB
        db.table("documents").delete().eq("id", document_id).execute()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def query_knowledge(request: KnowledgeQuery):
    """Query the knowledge base with semantic search."""
    rag = get_rag_pipeline()
    
    try:
        chunks = rag.retrieve(request.query, n_results=request.n_results)
        context = rag.format_context(chunks)
        
        # Generate an answer using the retrieved context
        from groq import Groq
        from config import settings
        
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        if chunks:
            answer_prompt = f"""Based on the following knowledge base content, answer this question accurately:

Question: {request.query}

Knowledge Base Content:
{context}

Provide a clear, accurate answer based on the retrieved information. If the information doesn't fully answer the question, say so and provide what you can."""
            
            completion = client.chat.completions.create(
                model=settings.GROQ_MODEL_FAST,
                messages=[{"role": "user", "content": answer_prompt}],
                temperature=0.3,
                max_tokens=500,
            )
            answer = completion.choices[0].message.content
        else:
            answer = "No relevant information found in the knowledge base."
        
        return {
            "query": request.query,
            "answer": answer,
            "sources": chunks,
            "source_count": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_knowledge_stats():
    """Get knowledge base statistics."""
    db = get_supabase()
    rag = get_rag_pipeline()
    
    try:
        result = db.table("documents").select("status, file_type, chunk_count").execute()
        docs = result.data or []
        
        total_docs = len(docs)
        ready_docs = sum(1 for d in docs if d.get("status") == "ready")
        total_chunks = sum(d.get("chunk_count", 0) for d in docs)
        
        type_breakdown = {}
        for doc in docs:
            ft = doc.get("file_type", "unknown")
            type_breakdown[ft] = type_breakdown.get(ft, 0) + 1
        
        return {
            "total_documents": total_docs,
            "ready_documents": ready_docs,
            "total_chunks": total_chunks,
            "vector_store_count": rag.vector_store.count(),
            "type_breakdown": type_breakdown
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
