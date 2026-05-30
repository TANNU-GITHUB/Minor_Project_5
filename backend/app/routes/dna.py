from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import LanguageDNA
import uuid

router = APIRouter()

@router.get("/user/{user_id}")
async def get_dna(user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    result = await db.execute(
        select(LanguageDNA)
        .where(LanguageDNA.user_id == uid)
        .order_by(LanguageDNA.created_at.desc())
        .limit(1)
    )
    dna = result.scalar_one_or_none()
    if not dna:
        raise HTTPException(status_code=404, detail="No DNA found. Complete onboarding first.")

    return {
        "id": str(dna.id),
        "vocabulary_richness": dna.vocabulary_richness,
        "formality_level": dna.formality_level,
        "humor_style": dna.humor_style,
        "sentence_complexity": dna.sentence_complexity,
        "fluency_score": dna.fluency_score,
        "cultural_richness": dna.cultural_richness,
        "favorite_topics": dna.favorite_topics,
        "communication_patterns": dna.communication_patterns,
        "cultural_references": dna.cultural_references,
        "teaching_persona": dna.teaching_persona,
    }
    