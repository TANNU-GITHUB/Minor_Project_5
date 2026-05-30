from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Lesson, ConversationSession, LanguageDNA
from app.services.insights_service import build_progress_insights
import uuid

router = APIRouter()


def _collect_words_from_sessions(sessions) -> set[str]:
    words: set[str] = set()
    for s in sessions:
        for w in s.words_learned or []:
            if isinstance(w, dict) and w.get("target"):
                words.add(str(w["target"]).strip().lower())
    return words


def _collect_words_from_lessons(lessons) -> set[str]:
    words: set[str] = set()
    for lesson in lessons:
        content = lesson.content if isinstance(lesson.content, dict) else {}
        for phrase in content.get("phrases") or []:
            if isinstance(phrase, dict) and phrase.get("target"):
                words.add(str(phrase["target"]).strip().lower())
    return words


def _calculate_streak(sessions) -> int:
    if not sessions:
        return 0
    days = sorted({s.created_at.date() for s in sessions if s.created_at}, reverse=True)
    if not days:
        return 0
    streak = 1
    for i in range(1, len(days)):
        if (days[i - 1] - days[i]).days == 1:
            streak += 1
        else:
            break
    return streak


@router.get("/{user_id}")
async def get_progress(
    user_id: str,
    native_language: str = "hindi",
    target_language: str = "spanish",
    db: AsyncSession = Depends(get_db),
):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    lessons_result = await db.execute(
        select(Lesson).where(Lesson.user_id == uid).order_by(Lesson.day_number)
    )
    lessons = lessons_result.scalars().all()
    completed = [l for l in lessons if l.completed]

    sessions_result = await db.execute(
        select(ConversationSession)
        .where(ConversationSession.user_id == uid)
        .order_by(ConversationSession.created_at.desc())
    )
    sessions = sessions_result.scalars().all()

    dna_result = await db.execute(
        select(LanguageDNA)
        .where(LanguageDNA.user_id == uid)
        .order_by(LanguageDNA.created_at.desc())
        .limit(1)
    )
    dna_row = dna_result.scalar_one_or_none()
    native_lang = native_language.lower()
    target_lang = target_language.lower()

    all_words = _collect_words_from_sessions(sessions) | _collect_words_from_lessons(completed)

    scores = [s.pronunciation_score for s in sessions if s.pronunciation_score]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    weekly_minutes = sum((s.duration_seconds or 0) for s in sessions) // 60
    if weekly_minutes == 0 and sessions:
        weekly_minutes = len(sessions) * 10

    insights = build_progress_insights(lessons, sessions, native_lang, target_lang)

    return {
        "lessons_total": len(lessons),
        "lessons_completed": len(completed),
        "sessions_completed": len(sessions),
        "words_learned": len(all_words),
        "pronunciation_score_avg": avg_score,
        "streak_days": _calculate_streak(sessions),
        "weekly_minutes": weekly_minutes,
        "current_day": (
            next((l.day_number for l in lessons if not l.completed), None)
            or (lessons[-1].day_number if lessons else 1)
        ),
        **insights,
    }
