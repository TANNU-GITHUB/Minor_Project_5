"""Score spoken phrase practice via Whisper + similarity + Groq feedback."""
import json
import re
import unicodedata
from difflib import SequenceMatcher

from app.config import settings
from app.services.whisper_service import transcribe_learner_audio
from app.services.dna_service import _parse_json_from_llm

SCRIPT_HINTS = {
    "hindi": "Devanagari (हिन्दी) only — no Roman English",
    "tamil": "Tamil script (தமிழ்) only",
    "bengali": "Bengali script (বাংলা) only",
    "punjabi": "Gurmukhi (ਪੰਜਾਬੀ) only",
    "english": "English only",
    "spanish": "Spanish with proper accents (¿¡)",
    "french": "French with accents (é, ç, etc.)",
    "mandarin": "Simplified Chinese (中文) only",
}

PASS_THRESHOLD = 65


def _normalize_for_compare(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
    return " ".join(text.split())


def phrase_similarity(spoken: str, expected: str) -> float:
    """0–1 match; forgiving of accents, punctuation, minor Whisper mistakes."""
    a = _normalize_for_compare(spoken)
    b = _normalize_for_compare(expected)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.93
    ratio = SequenceMatcher(None, a, b).ratio()
    a_tokens = set(a.split())
    b_tokens = set(b.split())
    if a_tokens and b_tokens:
        overlap = len(a_tokens & b_tokens) / max(len(a_tokens), len(b_tokens))
        ratio = max(ratio, overlap * 0.95)
    return ratio


def similarity_to_score(ratio: float) -> int:
    if ratio >= 0.95:
        return 98
    if ratio >= 0.85:
        return 88
    if ratio >= 0.75:
        return 78
    if ratio >= 0.65:
        return 72
    if ratio >= 0.55:
        return 62
    if ratio >= 0.40:
        return 48
    return max(0, int(ratio * 45))


def _coerce_score(value) -> int:
    if value is None:
        return 0
    if isinstance(value, bool):
        return 100 if value else 0
    if isinstance(value, (int, float)):
        return max(0, min(100, int(round(value))))
    if isinstance(value, str):
        match = re.search(r"\d{1,3}", value)
        if match:
            return max(0, min(100, int(match.group())))
    return 0


def _default_feedback(native_lang: str, target_lang: str, passed: bool, score: int) -> dict:
    if passed:
        return {
            "feedback_native": "बहुत अच्छा! आपने सही बोला।" if native_lang == "hindi" else "Great job! You said it correctly.",
            "feedback_target": "¡Muy bien!" if target_lang == "spanish" else "Well done!",
            "strength": "Clear effort",
            "weakness": "",
        }
    return {
        "feedback_native": "फिर से धीरे-धीरे दोहराएँ।" if native_lang == "hindi" else "Try again slowly, listening to each syllable.",
        "feedback_target": "Listen and repeat once more." if target_lang != "spanish" else "Escucha y repite otra vez.",
        "strength": "",
        "weakness": "Match the phrase on screen more closely",
    }


async def score_phrase_attempt(
    audio_bytes: bytes,
    expected_target: str,
    expected_native: str,
    target_lang: str,
    native_lang: str,
) -> dict:
    """Transcribe learner audio and score against expected phrase."""
    expected_target = (expected_target or "").strip()
    expected_native = (expected_native or "").strip()

    if settings.mock_analysis:
        return {
            "score": 82,
            "transcript": expected_target,
            "feedback_native": "बहुत अच्छा! आपकी उच्चारण अच्छी है।",
            "feedback_target": "¡Muy bien! Sigue practicando despacio.",
            "passed": True,
            "strength": "Good rhythm",
            "weakness": "",
            "match_ratio": 1.0,
        }

    if not audio_bytes or len(audio_bytes) < 200:
        fb = _default_feedback(native_lang, target_lang, False, 0)
        return {
            "score": 0,
            "transcript": "",
            "passed": False,
            "match_ratio": 0.0,
            **fb,
            "error": "audio_too_short",
        }

    transcription = await transcribe_learner_audio(
        audio_bytes,
        native_lang,
        target_lang,
        expected_text=expected_target,
        prefer_target=True,
    )
    spoken = (transcription.get("transcript") or "").strip()

    if not spoken:
        fb = _default_feedback(native_lang, target_lang, False, 0)
        return {
            "score": 0,
            "transcript": "",
            "passed": False,
            "match_ratio": 0.0,
            **fb,
            "error": "no_speech_detected",
        }

    match_ratio = phrase_similarity(spoken, expected_target)
    algo_score = similarity_to_score(match_ratio)

    llm_result: dict = {}
    llm_score = 0
    try:
        from groq import AsyncGroq

        client = AsyncGroq(api_key=settings.groq_api_key)
        prompt = f"""Grade a language learner's pronunciation attempt. Be fair and generous when they clearly said the right phrase.

Expected phrase ({target_lang}): {expected_target}
Meaning ({native_lang}): {expected_native}
What we transcribed from their voice: {spoken}
Algorithm similarity: {match_ratio:.0%} (use this as a guide)

Rules:
- If transcription closely matches expected phrase, score >= 75 even if accents differ
- Romanized spelling vs native script still counts if same words
- Only score below 50 if clearly wrong words or empty meaning
- score must be integer 0-100

Return ONLY JSON:
{{
  "score": <integer 0-100>,
  "passed": <true if score >= {PASS_THRESHOLD}>,
  "feedback_native": "<2 short sentences in {native_lang} script>",
  "feedback_target": "<2 short sentences in {target_lang} script>",
  "strength": "<one strength>",
  "weakness": "<one weakness or empty string>"
}}"""

        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Return valid JSON only. Be fair to learners."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=400,
        )
        raw = response.choices[0].message.content or "{}"
        llm_result = _parse_json_from_llm(raw)
        llm_score = _coerce_score(llm_result.get("score"))
    except Exception as e:
        print(f"⚠️ Phrase LLM grade failed, using algorithm only: {e}")
        llm_result = {}

    # Trust transcription match; never let a correct utterance score 0 because LLM was harsh
    if match_ratio >= 0.85:
        final_score = max(algo_score, llm_score, 85)
    elif match_ratio >= 0.70:
        final_score = max(algo_score, llm_score, 70)
    else:
        final_score = max(algo_score, llm_score)

    passed = final_score >= PASS_THRESHOLD or match_ratio >= 0.72

    fb = _default_feedback(native_lang, target_lang, passed, final_score)
    return {
        "score": final_score,
        "transcript": spoken,
        "passed": passed,
        "match_ratio": round(match_ratio, 2),
        "feedback_native": llm_result.get("feedback_native") or fb["feedback_native"],
        "feedback_target": llm_result.get("feedback_target") or fb["feedback_target"],
        "strength": llm_result.get("strength") or fb["strength"],
        "weakness": llm_result.get("weakness") or fb["weakness"],
    }
