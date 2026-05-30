from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.database import get_db
from app.models import LanguageDNA, Lesson
from app.config import settings
from app.services.whisper_service import transcribe_audio
from app.services.dna_service import analyze_language_dna, generate_curriculum, normalize_dna
from app.services.pinecone_service import store_dna
from app.services.mock_analysis import MOCK_TRANSCRIPT, mock_dna, mock_curriculum
import uuid

router = APIRouter()


def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "quota" in msg or "insufficient_quota" in msg


async def _transcribe(audio_bytes: bytes, native_language: str) -> str:
    if settings.mock_analysis:
        print("🧪 MOCK_ANALYSIS: using sample transcript")
        return MOCK_TRANSCRIPT
    try:
        print("📝 Transcribing with Whisper...")
        transcription = await transcribe_audio(audio_bytes, native_language)
        return transcription["transcript"]
    except Exception as e:
        if _is_quota_error(e):
            print("⚠️ Groq API limit hit — using sample transcript for dev")
            return MOCK_TRANSCRIPT
        raise


async def _extract_dna(transcript: str) -> dict:
    if settings.mock_analysis:
        print("🧪 MOCK_ANALYSIS: using sample DNA")
        return mock_dna()
    try:
        print("🧬 Extracting DNA with Claude...")
        return await analyze_language_dna(transcript)
    except Exception as e:
        if _is_quota_error(e) or settings.mock_analysis:
            print(f"⚠️ DNA API unavailable ({e}) — using sample DNA")
            return mock_dna()
        raise


async def _build_curriculum(dna: dict, native_language: str, target_language: str) -> list:
    if settings.mock_analysis:
        return mock_curriculum(native_language, target_language)
    try:
        print("📚 Generating curriculum...")
        return await generate_curriculum(dna, native_language, target_language)
    except Exception as e:
        print(f"⚠️ Curriculum API unavailable ({e}) — using sample lessons")
        return mock_curriculum(native_language, target_language)


@router.post("/voice")
async def analyze_voice(
    audio: UploadFile = File(...),
    native_language: str = Form(default="hindi"),
    target_language: str = Form(default="spanish"),
    user_id: str = Form(default="demo-user"),
    db: AsyncSession = Depends(get_db),
):
    try:
        audio_bytes = await audio.read()
        transcript = await _transcribe(audio_bytes, native_language)

        if not transcript.strip():
            raise HTTPException(status_code=400, detail="No speech detected. Please record again.")

        dna = normalize_dna(await _extract_dna(transcript))

        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            uid = uuid.uuid4()

        dna_record = LanguageDNA(
            user_id=uid,
            vocabulary_richness=dna.get("vocabulary_richness", 5.0),
            formality_level=dna.get("formality_level", 5.0),
            humor_style=dna.get("humor_style", "none"),
            sentence_complexity=dna.get("sentence_complexity", 5.0),
            fluency_score=dna.get("fluency_score", 5.0),
            cultural_richness=dna.get("cultural_richness", 5.0),
            favorite_topics=dna.get("favorite_topics", []),
            communication_patterns=dna.get("communication_patterns", []),
            cultural_references=dna.get("cultural_references", []),
            teaching_persona=dna.get("teaching_persona", ""),
            raw_transcript=transcript,
        )
        db.add(dna_record)
        await db.commit()
        await db.refresh(dna_record)

        try:
            await store_dna(str(uid), dna)
        except Exception as e:
            print(f"⚠️ Pinecone skipped: {e}")

        # Replace prior week-1 plan so user always starts fresh at Day 1
        await db.execute(delete(Lesson).where(Lesson.user_id == uid))
        await db.commit()

        lessons = await _build_curriculum(dna, native_language, target_language)
        for lesson_data in lessons:
            lesson = Lesson(
                user_id=uid,
                week_number=1,
                day_number=lesson_data.get("day", 1),
                title=lesson_data.get("title", ""),
                theme=lesson_data.get("theme", ""),
                content=lesson_data,
            )
            db.add(lesson)
        await db.commit()

        return {
            "dna_id": str(dna_record.id),
            "vocabulary_richness": dna_record.vocabulary_richness,
            "formality_level": dna_record.formality_level,
            "humor_style": dna_record.humor_style,
            "sentence_complexity": dna_record.sentence_complexity,
            "fluency_score": dna_record.fluency_score,
            "cultural_richness": dna_record.cultural_richness,
            "favorite_topics": dna_record.favorite_topics,
            "communication_patterns": dna_record.communication_patterns,
            "cultural_references": dna_record.cultural_references,
            "teaching_persona": dna_record.teaching_persona,
            "transcript_preview": transcript[:200],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
