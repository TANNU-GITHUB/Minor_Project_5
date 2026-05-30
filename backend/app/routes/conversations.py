# backend/app/routes/conversations.py
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ConversationSession, Lesson

router = APIRouter()


def _preview_from_messages(messages: list | None) -> str:
    if not messages:
        return ""
    for m in reversed(messages):
        if m.get("role") == "assistant":
            text = m.get("message_native") or m.get("content") or ""
            if text:
                return text[:120]
    for m in messages:
        if m.get("role") == "user":
            return (m.get("content") or "")[:120]
    return ""


@router.get("/user/{user_id}")
async def list_conversations(user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(400, "Invalid user_id")

    result = await db.execute(
        select(ConversationSession)
        .where(ConversationSession.user_id == uid)
        .order_by(ConversationSession.created_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()

    lesson_ids = {s.lesson_id for s in sessions if s.lesson_id}
    lesson_titles: dict[uuid.UUID, str] = {}
    if lesson_ids:
        lr = await db.execute(select(Lesson).where(Lesson.id.in_(lesson_ids)))
        for lesson in lr.scalars().all():
            lesson_titles[lesson.id] = lesson.title

    out = []
    for s in sessions:
        msgs = s.messages or []
        review = s.session_review or {}
        out.append({
            "id": str(s.id),
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "lesson_id": str(s.lesson_id) if s.lesson_id else None,
            "lesson_title": lesson_titles.get(s.lesson_id) or review.get("lesson_title") or "Practice chat",
            "message_count": len(msgs),
            "preview": _preview_from_messages(msgs),
            "pronunciation_score": s.pronunciation_score,
            "words_learned_count": len(s.words_learned or []),
        })
    return {"sessions": out}


@router.get("/{session_id}")
async def get_conversation(session_id: str, db: AsyncSession = Depends(get_db)):
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(400, "Invalid session_id")

    result = await db.execute(
        select(ConversationSession).where(ConversationSession.id == sid)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Conversation not found")

    lesson_title = "Practice chat"
    if session.lesson_id:
        lr = await db.execute(select(Lesson).where(Lesson.id == session.lesson_id))
        lesson = lr.scalar_one_or_none()
        if lesson:
            lesson_title = lesson.title

    return {
        "id": str(session.id),
        "user_id": str(session.user_id),
        "lesson_id": str(session.lesson_id) if session.lesson_id else None,
        "lesson_title": lesson_title,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "messages": session.messages or [],
        "words_learned": session.words_learned or [],
        "pronunciation_score": session.pronunciation_score,
        "session_review": session.session_review or {},
        "duration_seconds": session.duration_seconds,
    }
