"""Learning insights: strengths, weaknesses, session reviews."""
import json
from app.config import settings
from app.services.dna_service import _parse_json_from_llm, MOCK_DNA


async def generate_session_review(
    conversation: list,
    native_lang: str,
    target_lang: str,
    dna: dict,
) -> dict:
    """After a chat session, summarize performance."""
    if settings.mock_analysis or not conversation:
        return {
            "summary_native": "आपने अच्छा अभ्यास किया! अगली बार और अधिक फ्रेंच शब्द बोलें।",
            "summary_target": "Bonne séance! Essayez plus de phrases en français la prochaine fois.",
            "strengths": ["Warm conversational tone", "Good effort speaking"],
            "weaknesses": ["Need more target-language sentences"],
            "improvement_tips": [
                "हर जवाब में कम से कम एक वाक्य लक्ष्य भाषा में बोलें",
                "Répondez avec une phrase complète en français",
            ],
            "target_usage_percent": 40,
        }

    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.groq_api_key)
    convo_text = json.dumps(conversation[-16:], ensure_ascii=False)

    prompt = f"""Analyze this language tutoring chat. Native: {native_lang}, learning: {target_lang}.
Humor style: {dna.get('humor_style', 'friendly')}

Conversation:
{convo_text}

Return ONLY JSON:
{{
  "summary_native": "<3 sentences in {native_lang} script ONLY — warm Indian tutor tone>",
  "summary_target": "<3 sentences in {target_lang} script ONLY — what they did well + one fix>",
  "strengths": ["<in {native_lang} script>", ... 3 items],
  "weaknesses": ["<in {native_lang} script>", ... 2 items],
  "improvement_tips": ["<actionable tip in {native_lang}>", "<tip in {target_lang}>", ... 3],
  "target_usage_percent": <0-100 estimate of how much student used {target_lang}>
}}"""

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=700,
    )
    return _parse_json_from_llm(response.choices[0].message.content)


def build_progress_insights(
    lessons: list,
    sessions: list,
    native_lang: str,
    target_lang: str,
) -> dict:
    """Aggregate phrase practice + chat data for progress page."""
    phrase_attempts = []
    phrase_scores = []

    for lesson in lessons:
        content = lesson.content if isinstance(lesson.content, dict) else {}
        for attempt in content.get("phrase_scores") or []:
            phrase_attempts.append({
                "day": lesson.day_number,
                "phrase": attempt.get("phrase_target", ""),
                "score": attempt.get("score", 0),
                "passed": attempt.get("passed", False),
            })
            phrase_scores.append(attempt.get("score", 0))

    reviews = []
    for s in sessions:
        review = getattr(s, "session_review", None) or {}
        if review:
            reviews.append({
                "date": s.created_at.isoformat() if s.created_at else "",
                **review,
            })

    avg_phrase = round(sum(phrase_scores) / len(phrase_scores), 1) if phrase_scores else 0

    strengths = []
    weaknesses = []
    tips = []

    if phrase_scores:
        if avg_phrase >= 75:
            strengths.append(f"Strong phrase pronunciation ({avg_phrase}% avg)")
        else:
            weaknesses.append(f"Phrase pronunciation needs work ({avg_phrase}% avg)")
            tips.append("Practice each phrase slowly 3 times before moving on")

    for r in reviews[:3]:
        strengths.extend((r.get("strengths") or [])[:2])
        weaknesses.extend((r.get("weaknesses") or [])[:1])
        tips.extend((r.get("improvement_tips") or [])[:1])

    if not strengths:
        strengths = ["Consistent daily practice", "Willingness to speak aloud"]
    if not weaknesses:
        weaknesses = [f"Use more {target_lang} in conversation — start with one sentence per reply"]
    if not tips:
        tips = [
            f"Listen → repeat each phrase in {target_lang} at half speed",
            f"Chat में हर उत्तर में एक {target_lang} वाक्य जोड़ें",
        ]

    return {
        "phrase_practice_avg": avg_phrase,
        "phrase_attempts": phrase_attempts[-20:],
        "strengths": list(dict.fromkeys(strengths))[:5],
        "weaknesses": list(dict.fromkeys(weaknesses))[:4],
        "improvement_tips": list(dict.fromkeys(tips))[:5],
        "recent_session_reviews": reviews[:5],
    }
