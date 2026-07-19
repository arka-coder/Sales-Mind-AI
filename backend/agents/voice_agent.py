"""
Voice Agent — Whisper STT + ElevenLabs TTS integration for voice AI conversations.
"""
import logging
import io
import tempfile
import os
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


class VoiceAgent:
    """Handles speech-to-text (Whisper) and text-to-speech (ElevenLabs)."""

    def __init__(self):
        from openai import OpenAI
        self.whisper_client = OpenAI(api_key=settings.OPENAI_API_KEY)

        from elevenlabs.client import ElevenLabs
        self.tts_client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)

        self.voice_id = settings.ELEVENLABS_VOICE_ID

    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> str:
        """Transcribe audio to text using OpenAI Whisper."""
        try:
            # Save to temp file (Whisper requires a file)
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                with open(tmp_path, "rb") as audio_file:
                    transcript = self.whisper_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language,
                        response_format="text"
                    )
                return transcript.strip()
            finally:
                os.unlink(tmp_path)

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise ValueError(f"Failed to transcribe audio: {str(e)}")

    async def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75
    ) -> bytes:
        """Convert text to speech using ElevenLabs v1.9.0 client API."""
        try:
            vid = voice_id or self.voice_id

            # ElevenLabs v1.x SDK: use client.text_to_speech.convert()
            from elevenlabs import VoiceSettings

            audio_iterator = self.tts_client.text_to_speech.convert(
                voice_id=vid,
                text=text,
                model_id="eleven_turbo_v2",
                voice_settings=VoiceSettings(
                    stability=stability,
                    similarity_boost=similarity_boost,
                ),
            )

            # Collect all chunks into bytes
            audio_bytes = b""
            for chunk in audio_iterator:
                if chunk:
                    audio_bytes += chunk

            return audio_bytes

        except Exception as e:
            logger.error(f"TTS synthesis error: {e}")
            raise ValueError(f"Failed to synthesize speech: {str(e)}")

    def get_available_voices(self):
        """Get list of available ElevenLabs voices."""
        try:
            voices = self.tts_client.voices.get_all()
            return [
                {
                    "voice_id": v.voice_id,
                    "name": v.name,
                    "category": v.category,
                    "description": v.description if hasattr(v, "description") else None,
                    "labels": v.labels if hasattr(v, "labels") else {}
                }
                for v in voices.voices
            ]
        except Exception as e:
            logger.error(f"Failed to get voices: {e}")
            return []


_voice_agent = None

def get_voice_agent() -> VoiceAgent:
    global _voice_agent
    if _voice_agent is None:
        _voice_agent = VoiceAgent()
    return _voice_agent
