"""
Voice Router — Speech-to-text (Whisper) and text-to-speech (ElevenLabs) endpoints.
"""
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
from typing import Optional

from models.schemas import VoiceSynthesizeRequest
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["Voice"])


def _get_voice_agent():
    """Lazy import voice agent to avoid startup errors if keys missing."""
    try:
        from agents.voice_agent import get_voice_agent
        return get_voice_agent()
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Voice service unavailable: {str(e)}"
        )


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "en"
):
    """Transcribe audio to text using Whisper."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")
    
    agent = _get_voice_agent()
    
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")
    
    try:
        transcript = await agent.transcribe(audio_bytes, language)
        return {
            "transcript": transcript,
            "language": language,
            "word_count": len(transcript.split())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/synthesize")
async def synthesize_speech(request: VoiceSynthesizeRequest):
    """Convert text to speech using ElevenLabs."""
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")
    
    agent = _get_voice_agent()
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        audio_bytes = await agent.synthesize(
            text=request.text,
            voice_id=request.voice_id
        )
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=response.mp3",
                "Content-Length": str(len(audio_bytes))
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voices")
async def get_voices():
    """Get available ElevenLabs voices."""
    if not settings.ELEVENLABS_API_KEY:
        return {"voices": [], "message": "ElevenLabs API key not configured"}
    
    try:
        agent = _get_voice_agent()
        voices = agent.get_available_voices()
        return {"voices": voices}
    except Exception as e:
        return {"voices": [], "error": str(e)}


@router.post("/chat")
async def voice_chat(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = None,
    lead_id: Optional[str] = None,
):
    """Full voice conversation: STT → AI → TTS pipeline."""
    agent = _get_voice_agent()
    from agents.sales_agent import get_sales_agent
    sales_agent = get_sales_agent()
    import uuid
    
    # STT
    audio_bytes = await file.read()
    try:
        transcript = await agent.transcribe(audio_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    
    if not transcript.strip():
        raise HTTPException(status_code=400, detail="Could not transcribe audio")
    
    # AI Response
    conv_id = conversation_id or str(uuid.uuid4())
    try:
        result = await sales_agent.chat(
            message=transcript,
            conversation_id=conv_id,
            lead_id=lead_id,
            stream=False
        )
        response_text = result["response"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {e}")
    
    # TTS
    try:
        audio_response = await agent.synthesize(response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {e}")
    
    # Return audio with metadata headers
    return Response(
        content=audio_response,
        media_type="audio/mpeg",
        headers={
            "X-Transcript": transcript[:200],
            "X-Response-Text": response_text[:200],
            "X-Conversation-Id": conv_id,
            "X-Sentiment": result.get("sentiment", "neutral"),
        }
    )
