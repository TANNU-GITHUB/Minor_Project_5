from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Lesson
from app.services.practice_service import score_phrase_attempt
import uuid
import copy

router = APIRouter()

@router.get("/user/{user_id}")
async def get_lessons(user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    result = await db.execute(
        select(Lesson).where(Lesson.user_id == uid).order_by(Lesson.day_number)
    )
    lessons = result.scalars().all()
    return [
        {
            "id": str(l.id),
            "day": l.day_number,
            "week": l.week_number,
            "title": l.title,
            "theme": l.theme,
            "content": l.content,
            "completed": l.completed,
            "score": l.score,
        }
        for l in lessons
    ]

@router.get("/{lesson_id}")
async def get_lesson(lesson_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Lesson).where(Lesson.id == uuid.UUID(lesson_id))
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {
        "id": str(lesson.id),
        "day": lesson.day_number,
        "week": lesson.week_number,
        "title": lesson.title,
        "theme": lesson.theme,
        "content": lesson.content,
        "completed": lesson.completed,
        "score": lesson.score,
    }

@router.post("/{lesson_id}/practice-phrase")
async def practice_phrase(
    lesson_id: str,
    phrase_index: int = Form(...),
    native_language: str = Form(default="hindi"),
    target_language: str = Form(default="spanish"),
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lesson).where(Lesson.id == uuid.UUID(lesson_id))
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    content = copy.deepcopy(lesson.content) if lesson.content else {}
    phrases = content.get("phrases") or []
    if phrase_index < 0 or phrase_index >= len(phrases):
        raise HTTPException(status_code=400, detail="Invalid phrase index")

    phrase = phrases[phrase_index]
    if isinstance(phrase, dict):
        expected_target = phrase.get("target") or phrase.get("text") or ""
        expected_native = phrase.get("native") or phrase.get("meaning") or ""
    else:
        expected_target = str(phrase)
        expected_native = ""

    if not expected_target.strip():
        raise HTTPException(status_code=400, detail="Phrase has no target text to practice")

    audio_bytes = await audio.read()
    grading = await score_phrase_attempt(
        audio_bytes,
        expected_target,
        expected_native,
        target_language,
        native_language,
    )

    scores_list = content.get("phrase_scores") or []
    scores_list = [s for s in scores_list if s.get("phrase_index") != phrase_index]
    scores_list.append({
        "phrase_index": phrase_index,
        "phrase_target": phrase.get("target"),
        "phrase_native": phrase.get("native"),
        "score": int(grading.get("score") or 0),
        "passed": bool(grading.get("passed")),
        "transcript": grading.get("transcript", ""),
        "feedback_native": grading.get("feedback_native", ""),
        "feedback_target": grading.get("feedback_target", ""),
        "strength": grading.get("strength", ""),
        "weakness": grading.get("weakness", ""),
    })
    content["phrase_scores"] = scores_list

    all_scores = [s["score"] for s in scores_list]
    lesson_avg = sum(all_scores) / len(all_scores) if all_scores else 0

    await db.execute(
        update(Lesson)
        .where(Lesson.id == lesson.id)
        .values(content=content, score=lesson_avg)
    )
    await db.commit()

    all_passed = len(scores_list) >= len(phrases) and all(s.get("passed") for s in scores_list)

    return {
        **grading,
        "phrase_index": phrase_index,
        "lesson_score": round(lesson_avg, 1),
        "phrases_completed": len(scores_list),
        "phrases_total": len(phrases),
        "all_phrases_passed": all_passed,
    }


@router.patch("/{lesson_id}/complete")
async def complete_lesson(lesson_id: str, score: float = 80.0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Lesson).where(Lesson.id == uuid.UUID(lesson_id))
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    content = lesson.content or {}
    phrases = content.get("phrases") or []
    scores_list = content.get("phrase_scores") or []
    if phrases and len(scores_list) < len(phrases):
        raise HTTPException(
            status_code=400,
            detail="Practice all phrases with the microphone before completing the lesson.",
        )

    final_score = score
    if scores_list:
        final_score = sum(s["score"] for s in scores_list) / len(scores_list)

    await db.execute(
        update(Lesson)
        .where(Lesson.id == uuid.UUID(lesson_id))
        .values(completed=True, score=final_score)
    )
    await db.commit()
    return {"message": "Lesson marked complete", "score": final_score}