# backend/app/services/dna_service.py
import json
from app.config import settings

# ─── Mock data returned when MOCK_ANALYSIS=true ───────────────────────────────
MOCK_DNA = {
    "vocabulary_richness": 7.2,
    "formality_level": 3.5,
    "humor_style": "sarcastic",
    "sentence_complexity": 5.8,
    "fluency_score": 8.1,
    "cultural_richness": 7.5,
    "favorite_topics": ["cricket", "technology", "street food", "Bollywood", "politics"],
    "communication_patterns": [
        "uses rhetorical questions",
        "tells stories to make a point",
        "uses hyperbole for emphasis",
        "mixes English words into sentences",
    ],
    "cultural_references": ["IPL", "chai", "jugaad", "chaiwala", "desi"],
    "teaching_persona": (
        "Teach using cricket and tech analogies. Match their sarcastic wit. "
        "Keep sentences short and punchy. Mix in occasional English phrases "
        "as they are comfortable switching between languages."
    ),
}

MOCK_LESSONS = [
    {
        "day": i,
        "title": f"Day {i} — " + ["¡Hola! Greetings your way", "Cricket in Spanish", "Street food vocabulary",
                                   "Talking tech in Spanish", "Bollywood expressions", "Weekend plans", "Review day"][i-1],
        "theme": ["Greetings","Sports","Food","Technology","Entertainment","Planning","Review"][i-1],
        "phrases": [
            {"target": "¿Qué pasa?", "native": "What's happening?", "pronunciation": "Kay PAH-sah"},
            {"target": "¡Qué golazo!", "native": "What a great goal!", "pronunciation": "Kay go-LAH-so"},
            {"target": "Me encanta", "native": "I love it", "pronunciation": "May en-KAHN-tah"},
            {"target": "No me digas", "native": "You don't say!", "pronunciation": "No may DEE-gas"},
            {"target": "¡Buena onda!", "native": "Good vibes!", "pronunciation": "BWAY-nah ON-dah"},
        ],
        "grammar_tip": f"Tip for day {i}: Use 'me gusta' for things you like — 'Me gusta el cricket' = I like cricket",
        "cultural_note": "Spanish speakers often use hand gestures — it makes you seem more natural!",
        "practice_prompt": "Tell me about your favorite cricket match as if you're texting a friend in Spanish.",
    }
    for i in range(1, 8)
]


# ─── DNA Extraction Prompt for Llama ──────────────────────────────────────────
DNA_PROMPT = """You are a linguistics expert. Analyse this speech transcript and return ONLY a valid JSON object. No explanation, no markdown code fences, just raw JSON.

The JSON must have exactly these fields:
{{
  "vocabulary_richness": <float 0-10>,
  "formality_level": <float 0-10, 0=very casual, 10=very formal>,
  "humor_style": <one of: "dry","sarcastic","wordplay","self-deprecating","storytelling","none">,
  "sentence_complexity": <float 0-10>,
  "fluency_score": <float 0-10>,
  "cultural_richness": <float 0-10>,
  "favorite_topics": <list of 4-6 topic strings>,
  "communication_patterns": <list of 3-5 patterns>,
  "cultural_references": <list of cultural things mentioned>,
  "teaching_persona": "<single string: 2-3 sentences on HOW to teach this person — NOT an array>"
}}

TRANSCRIPT:
{transcript}"""


# ─── Curriculum Prompt ────────────────────────────────────────────────────────
CURRICULUM_PROMPT = """Create a 7-day {target_lang} curriculum for a native {native_lang} speaker.

Their language DNA:
{dna_json}

Rules:
- EVERY "target" phrase MUST be written in {target_lang} native script ONLY (NOT English transliteration)
- "native" field MUST be written in {native_lang} native script ONLY (e.g. Devanagari for Hindi, NOT English)
- "pronunciation" = simple phonetic guide in Latin letters for learners
- Match vocabulary to their level ({vocab}/10)
- Weave in their interests: {topics}
- Use their {humor} humor style in examples
- Each day must teach NEW vocabulary — no repeating phrases from earlier days
- Day 1 = greetings, Day 2+ build on prior days

Return ONLY a valid JSON array of 7 lesson objects. No markdown, no explanation:
[
  {{
    "day": 1,
    "title": "lesson title",
    "theme": "one word theme",
    "phrases": [
      {{"target": "phrase in {target_lang}", "native": "meaning", "pronunciation": "phonetic guide"}},
      ... 5 phrases
    ],
    "grammar_tip": "one grammar rule",
    "cultural_note": "one cultural insight",
    "practice_prompt": "a conversation scenario using their interests"
  }},
  ... 7 total
]"""


def _get_groq_client():
    from groq import AsyncGroq
    return AsyncGroq(api_key=settings.groq_api_key)


def _as_str_list(value, default=None) -> list:
    default = default or []
    if value is None:
        return default
    if isinstance(value, list):
        return [str(x).strip() for x in value if x is not None and str(x).strip()]
    if isinstance(value, str):
        return [value.strip()] if value.strip() else default
    return [str(value).strip()] if str(value).strip() else default


def _as_str(value, default: str = "") -> str:
    if value is None:
        return default
    if isinstance(value, str):
        return value.strip() or default
    if isinstance(value, list):
        parts = [str(x).strip() for x in value if x is not None and str(x).strip()]
        return " ".join(parts) if parts else default
    return str(value).strip() or default


def _as_float(value, default: float = 5.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_dna(dna: dict) -> dict:
    """Coerce LLM JSON to DB-safe types (teaching_persona must be str, not list)."""
    humor = _as_str(dna.get("humor_style"), "none").lower()
    if humor not in ("dry", "sarcastic", "wordplay", "self-deprecating", "storytelling", "none"):
        humor = "none"

    return {
        "vocabulary_richness": _as_float(dna.get("vocabulary_richness"), 5.0),
        "formality_level": _as_float(dna.get("formality_level"), 5.0),
        "humor_style": humor,
        "sentence_complexity": _as_float(dna.get("sentence_complexity"), 5.0),
        "fluency_score": _as_float(dna.get("fluency_score"), 5.0),
        "cultural_richness": _as_float(dna.get("cultural_richness"), 5.0),
        "favorite_topics": _as_str_list(dna.get("favorite_topics")),
        "communication_patterns": _as_str_list(dna.get("communication_patterns")),
        "cultural_references": _as_str_list(dna.get("cultural_references")),
        "teaching_persona": _as_str(dna.get("teaching_persona"), "Be encouraging and clear."),
    }


def _parse_json_from_llm(raw_text: str):
    """Safely parse JSON from LLM output — handles markdown code fences."""
    text = raw_text.strip()
    # Remove ```json ... ``` if present
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            try:
                return json.loads(part)
            except Exception:
                continue
    return json.loads(text)


async def analyze_language_dna(transcript: str) -> dict:
    """Send transcript to Llama via Groq → get Language DNA."""
    if settings.mock_analysis:
        print("🔵 MOCK MODE: returning sample DNA")
        return MOCK_DNA

    client = _get_groq_client()
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",   # Free on Groq
        messages=[
            {"role": "system", "content": "You are a linguistics expert. Always respond with valid JSON only."},
            {"role": "user",   "content": DNA_PROMPT.format(transcript=transcript)},
        ],
        temperature=0.3,
        max_tokens=1024,
    )
    raw = response.choices[0].message.content
    return normalize_dna(_parse_json_from_llm(raw))


async def generate_curriculum(dna: dict, native_lang: str, target_lang: str) -> list:
    """Ask Llama to build 7 personalized lessons based on Language DNA."""
    if settings.mock_analysis:
        print("🔵 MOCK MODE: returning sample curriculum")
        return MOCK_LESSONS

    client = _get_groq_client()
    prompt = CURRICULUM_PROMPT.format(
        target_lang=target_lang,
        native_lang=native_lang,
        dna_json=json.dumps(dna, indent=2),
        vocab=dna.get("vocabulary_richness", 5),
        topics=", ".join(dna.get("favorite_topics", [])),
        humor=dna.get("humor_style", "neutral"),
        refs=", ".join(dna.get("cultural_references", [])[:3]),
    )

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a language teacher. Always respond with valid JSON only."},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.5,
        max_tokens=4000,
    )
    raw = response.choices[0].message.content
    return _parse_json_from_llm(raw)


def build_tutor_system_prompt(dna: dict, native_lang: str, target_lang: str, lesson: dict = None) -> str:
    """Build the system prompt for the live conversation tutor."""
    topics   = ", ".join(dna.get("favorite_topics", ["general topics"]))
    humor    = dna.get("humor_style", "none")
    persona  = dna.get("teaching_persona", "Be encouraging and clear.")
    complexity = dna.get("sentence_complexity", 5)

    lesson_ctx = ""
    if lesson:
        phrases_preview = json.dumps(lesson.get("phrases", [])[:2])
        lesson_ctx = f"""
Today's lesson: "{lesson.get('title', '')}"
Phrases to practice: {phrases_preview}
Today's challenge: {lesson.get('practice_prompt', '')}
"""

    return f"""You are Priya — a warm, light-hearted Indian language tutor (slightly playful {humor} humor).
Student speaks {native_lang}; they are learning {target_lang}. Speak SLOWLY and clearly in your mind.

STUDENT PROFILE:
- Favorite topics: {topics}
- Teaching approach: {persona}
- Sentence complexity: {complexity}/10

{lesson_ctx}

LANGUAGE SWITCHING STRATEGY (enforce every turn):
1. Start reply in {native_lang} script (comfort) — 1 short sentence
2. Ask student to repeat or answer in {target_lang} script — 1 slow sentence
3. If they used only {native_lang}, gently require {target_lang} before continuing
4. Correct mistakes in BOTH scripts separately
5. Use 2–3 emojis max — warm, not childish

STRICT RULES — reply ONLY valid JSON:
{{
  "message_native": "<2-3 SHORT sentences in {native_lang} SCRIPT ONLY — not English>",
  "message_target": "<1-2 SHORT sentences in {target_lang} SCRIPT ONLY — slow, simple>",
  "pronunciation_score": <0-100 if student spoke {target_lang}, else null>,
  "correction_native": "<fix in {native_lang} script or null>",
  "correction_target": "<fix in {target_lang} script or null>",
  "encouragement": "<short phrase with emoji>",
  "new_word": {{"target": "<{target_lang} script>", "native": "<{native_lang} script>"}} or null,
  "language_tip": "<one tip: push them to use more {target_lang} today>"
}}"""