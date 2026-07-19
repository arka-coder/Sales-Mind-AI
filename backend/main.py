"""
SalesMind AI — FastAPI Backend Application
Enterprise-grade AI Sales Copilot for Businesses
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("=" * 60)
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 60)
    
    # Initialize RAG pipeline (loads ChromaDB + embedding model)
    try:
        from rag.pipeline import get_rag_pipeline
        rag = get_rag_pipeline()
        logger.info(f"✅ RAG Pipeline initialized — {rag.vector_store.count()} chunks indexed")
    except Exception as e:
        logger.warning(f"⚠️ RAG Pipeline init warning: {e}")
    
    # Initialize ML models
    try:
        from ml.models import get_sentiment_analyzer, get_intent_classifier, get_lead_scorer
        get_sentiment_analyzer()
        get_intent_classifier()
        get_lead_scorer()
        logger.info("✅ ML Models initialized")
    except Exception as e:
        logger.warning(f"⚠️ ML Models init warning: {e}")
    
    # Test Supabase connection
    try:
        from database.supabase_client import get_supabase
        db = get_supabase()
        db.table("leads").select("id").limit(1).execute()
        logger.info("✅ Supabase connected")
    except Exception as e:
        logger.warning(f"⚠️ Supabase connection warning: {e}")
    
    logger.info("🎯 All systems ready. SalesMind AI is live!")
    logger.info("=" * 60)
    
    yield
    
    logger.info("👋 Shutting down SalesMind AI...")


# Create FastAPI app
app = FastAPI(
    title="SalesMind AI API",
    description="Enterprise-grade AI Sales Copilot — REST API",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ============================================
# MIDDLEWARE
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Transcript", "X-Response-Text", "X-Conversation-Id", "X-Sentiment"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# ============================================
# ROUTERS
# ============================================

from routers.auth import router as auth_router
from routers.chat import router as chat_router
from routers.leads import router as leads_router
from routers.analytics import router as analytics_router
from routers.knowledge import router as knowledge_router
from routers.followup import router as followup_router
from routers.voice import router as voice_router

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(leads_router)
app.include_router(analytics_router)
app.include_router(knowledge_router)
app.include_router(followup_router)
app.include_router(voice_router)


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "services": {
            "groq": bool(settings.GROQ_API_KEY),
            "supabase": bool(settings.SUPABASE_URL),
            "elevenlabs": bool(settings.ELEVENLABS_API_KEY),
            "whisper": bool(settings.OPENAI_API_KEY),
            "resend": bool(settings.RESEND_API_KEY),
        }
    }


@app.get("/")
async def root():
    return {
        "message": "SalesMind AI Backend is running",
        "docs": "/api/docs",
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
