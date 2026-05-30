# backend/app/services/elevenlabs_service.py
# ElevenLabs removed — text-to-speech now happens in the browser
# using the free Web Speech API (no API key needed)

async def speak_base64(text: str, target_language: str) -> str:
    """
    Previously converted text to audio using ElevenLabs.
    Now we return empty string — the frontend uses browser's
    built-in SpeechSynthesis API instead (completely free).
    """
    return ""   # Frontend handles TTS now