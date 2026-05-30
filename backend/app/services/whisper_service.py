# backend/app/services/whisper_service.py
import os
import re
import tempfile
from difflib import SequenceMatcher

from app.config import settings

LANGUAGE_CODES = {
    "hindi": "hi",
    "tamil": "ta",
    "bengali": "bn",
    "punjabi": "pa",
    "english": "en",
    "spanish": "es",
    "french": "fr",
    "mandarin": "zh",
    "japanese": "ja",
}


def _lang_code(language: str | None) -> str | None:
    if not language:
        return None
    key = language.lower().strip()
    return LANGUAGE_CODES.get(key, key[:2] if len(key) >= 2 else None)


def _audio_suffix(audio_bytes: bytes) -> str:
    if len(audio_bytes) >= 4 and audio_bytes[:4] == b"\x1aE\xdf\xa3":
        return ".webm"
    if len(audio_bytes) >= 3 and audio_bytes[:3] == b"ID3":
        return ".mp3"
    if len(audio_bytes) >= 8 and audio_bytes[4:8] == b"ftyp":
        return ".m4a"
    if len(audio_bytes) >= 4 and audio_bytes[:4] == b"RIFF":
        return ".wav"
    return ".webm"


def _build_prompt(
    expected_text: str | None,
    target_lang: str,
    native_lang: str,
) -> str:
    """Short context for Whisper (max ~224 tokens). No newlines — Groq can 500 on them."""
    parts = [
        "Language learning app. Transcribe exactly what the speaker said.",
        "Keep the original language and script. Do not translate.",
    ]
    if expected_text:
        clean = re.sub(r"\s+", " ", expected_text.strip())[:180]
        parts.append(f"Expected phrase or words: {clean}")
    parts.append(f"Learner native: {native_lang}. Learning: {target_lang}.")
    return " ".join(parts)[:400]


def _similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


async def _transcribe_once(
    audio_bytes: bytes,
    language: str | None,
    prompt: str | None,
) -> str:
    from groq import AsyncGroq

    client = AsyncGroq(api_key=settings.groq_api_key)
    suffix = _audio_suffix(audio_bytes)
    lang_code = _lang_code(language)

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            kwargs = {
                "model": "whisper-large-v3",
                "file": (f"recording{suffix}", audio_file),
                "response_format": "json",
                "temperature": 0.0,
            }
            if lang_code:
                kwargs["language"] = lang_code
            if prompt:
                kwargs["prompt"] = prompt

            response = await client.audio.transcriptions.create(**kwargs)
        return (response.text or "").strip()
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


async def transcribe_audio(audio_bytes: bytes, language: str = None) -> dict:
    """Basic transcription (onboarding, etc.)."""
    if settings.mock_analysis:
        return {
            "transcript": (
                "I love talking about cricket and Bollywood. "
                "I want to learn Spanish for travel."
            ),
            "detected_language": language or "hindi",
            "duration": 0,
        }

    prompt = _build_prompt(None, language or "english", language or "hindi")
    text = await _transcribe_once(audio_bytes, language, prompt)
    return {
        "transcript": text,
        "detected_language": language or "unknown",
        "duration": 0,
    }


async def transcribe_learner_audio(
    audio_bytes: bytes,
    native_lang: str,
    target_lang: str,
    *,
    expected_text: str | None = None,
    prefer_target: bool = True,
) -> dict:
    """
    Accurate transcription for practice/chat.
    Tries target + native language hints and picks the best match to expected phrase.
    """
    if settings.mock_analysis:
        return {
            "transcript": (expected_text or "hola").strip(),
            "detected_language": target_lang if prefer_target else native_lang,
            "confidence": 1.0,
        }

    if not audio_bytes or len(audio_bytes) < 200:
        return {"transcript": "", "detected_language": None, "confidence": 0.0}

    prompt = _build_prompt(expected_text, target_lang, native_lang)
    order = [target_lang, native_lang] if prefer_target else [native_lang, target_lang]

    attempts: list[tuple[str, str]] = []
    seen_texts: set[str] = set()

    for lang in order:
        try:
            text = await _transcribe_once(audio_bytes, lang, prompt)
            key = text.lower().strip()
            if text and key not in seen_texts:
                seen_texts.add(key)
                attempts.append((lang, text))
        except Exception as e:
            print(f"⚠️ Whisper ({lang}): {e}")

    if not attempts or (expected_text and max(_similarity(t, expected_text) for _, t in attempts) < 0.25):
        try:
            text = await _transcribe_once(audio_bytes, None, prompt)
            key = text.lower().strip()
            if text and key not in seen_texts:
                attempts.append(("auto", text))
        except Exception as e:
            print(f"⚠️ Whisper (auto): {e}")

    if not attempts:
        return {"transcript": "", "detected_language": None, "confidence": 0.0}

    if expected_text and expected_text.strip():
        best_lang, best_text = max(
            attempts,
            key=lambda pair: _similarity(pair[1], expected_text),
        )
        conf = _similarity(best_text, expected_text)
    else:
        best_lang, best_text = attempts[0]
        conf = 0.7

    return {
        "transcript": best_text,
        "detected_language": best_lang,
        "confidence": round(conf, 2),
        "alternates": [{"language": l, "text": t} for l, t in attempts if t != best_text],
    }
