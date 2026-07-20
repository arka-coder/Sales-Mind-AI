from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SalesMind AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server — Render injects PORT automatically
    PORT: int = 8000

    # Groq AI
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MODEL_FAST: str = "llama-3.1-8b-instant"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = Field(default="", validation_alias="SUPABASE_SERVICE_ROLE_KEY")

    # ChromaDB
    # Render free tier: use /tmp (ephemeral). Paid tier: mount a disk at /data
    CHROMA_PERSIST_DIR: str = os.environ.get("CHROMA_PERSIST_DIR", "/tmp/chroma_db")
    CHROMA_COLLECTION_NAME: str = "salesmind_knowledge"

    # ElevenLabs
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice

    # OpenAI (for Whisper STT)
    OPENAI_API_KEY: str = ""

    # Resend Email
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "SalesMind AI <noreply@salesmind.ai>"

    # JWT
    SECRET_KEY: str = "salesmind-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS — kept as str; split into list via property to avoid pydantic-settings JSON-parsing
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://salesmind.ai"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # ignore unknown env vars like FROM_EMAIL, FROM_NAME


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
