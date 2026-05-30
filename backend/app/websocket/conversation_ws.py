# backend/app/websocket/conversation_ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import LanguageDNA, Lesson, ConversationSession
from app.services.dna_service import MOCK_DNA
from app.services.tutor_flow_service import (
    initial_state,
    generate_turn,
    generate_welcome,
    sanitize_tutor_payload,
)
from app.services.whisper_service import transcribe_learner_audio
from app.services.tutor_flow_service import speech_hint_for_state
from app.services.insights_service import generate_session_review
from app.config import settings
import uuid
import base64
import copy
import traceback

router = APIRouter()

LANG_FLAGS = {
    "hindi": "🇮🇳", "tamil": "🇮🇳", "bengali": "🇮🇳", "punjabi": "🇮🇳",
    "english": "🇬🇧", "spanish": "🇪🇸", "french": "🇫🇷", "mandarin": "🇨🇳",
}


def _tutor_display(target_lang: str) -> tuple[str, str]:
    return f"Priya · {target_lang.title()} Tutor ✨", LANG_FLAGS.get(target_lang.lower(), "🌐")


def _flatten_tutor_payload(tutor: dict) -> dict:
    tutor = sanitize_tutor_payload(tutor)
    native = tutor.get("message_native", "")
    target = tutor.get("message_target", "")
    return {
        "message_native": native,
        "message_target": target,
        "message": f"{native}\n{target}".strip(),
        "pronunciation_score": tutor.get("pronunciation_score"),
        "correction_native": tutor.get("correction_native"),
        "correction_target": tutor.get("correction_target"),
        "correction": tutor.get("correction_target") or tutor.get("correction_native"),
        "encouragement": tutor.get("encouragement"),
        "new_word": tutor.get("new_word"),
        "language_tip": tutor.get("language_tip"),
        "phase": tutor.get("phase"),
        "answer_correct": tutor.get("answer_correct"),
        "evaluation_native": tutor.get("evaluation_native"),
        "phrase_index": tutor.get("phrase_index"),
        "word_index": tutor.get("word_index"),
        "phrases_total": tutor.get("phrases_total"),
        "current_phrase_target": tutor.get("current_phrase_target"),
        "awaiting_user": tutor.get("awaiting_user", False),
    }


def _message_record(role: str, payload: dict, user_text: str = "") -> dict:
    if role == "user":
        return {"role": "user", "content": user_text}
    return {
        "role": "assistant",
        "content": payload.get("message", ""),
        "message_native": payload.get("message_native"),
        "message_target": payload.get("message_target"),
        "phase": payload.get("phase"),
        "pronunciation_score": payload.get("pronunciation_score"),
        "answer_correct": payload.get("answer_correct"),
        "evaluation_native": payload.get("evaluation_native"),
    }


def _is_quiz_question(flat: dict) -> bool:
    return (
        flat.get("phase") == "quiz"
        and flat.get("answer_correct") is None
        and flat.get("pronunciation_score") is None
        and not flat.get("evaluation_native")
    )


def _is_quiz_evaluation(flat: dict) -> bool:
    return flat.get("phase") == "quiz" and (
        flat.get("evaluation_native")
        or flat.get("pronunciation_score") is not None
        or flat.get("answer_correct") is not None
    )


async def _persist_session(db, session_row: ConversationSession) -> None:
    await db.commit()


@router.websocket("/ws/converse/{user_id}")
async def converse(websocket: WebSocket, user_id: str):
    await websocket.accept()

    native_lang = websocket.query_params.get("native_language", "hindi").lower()
    target_lang = websocket.query_params.get("target_language", "spanish").lower()
    tutor_name, tutor_flag = _tutor_display(target_lang)

    async with AsyncSessionLocal() as db:
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            uid = uuid.uuid4()

        dna = MOCK_DNA
        lesson = None
        lesson_id = None

        if not settings.mock_analysis:
            dna_result = await db.execute(
                select(LanguageDNA)
                .where(LanguageDNA.user_id == uid)
                .order_by(LanguageDNA.created_at.desc())
                .limit(1)
            )
            dna_record = dna_result.scalar_one_or_none()
            if not dna_record:
                await websocket.send_json({
                    "type": "error",
                    "message": "Complete voice analysis first to unlock conversation. 🎤",
                })
                await websocket.close()
                return

            dna = {
                "vocabulary_richness": dna_record.vocabulary_richness,
                "formality_level": dna_record.formality_level,
                "humor_style": dna_record.humor_style,
                "sentence_complexity": dna_record.sentence_complexity,
                "favorite_topics": dna_record.favorite_topics,
                "communication_patterns": dna_record.communication_patterns,
                "teaching_persona": dna_record.teaching_persona,
            }

            lesson_result = await db.execute(
                select(Lesson)
                .where(Lesson.user_id == uid, Lesson.completed == False)
                .order_by(Lesson.day_number)
                .limit(1)
            )
            lesson_record = lesson_result.scalar_one_or_none()
            if lesson_record:
                lesson = lesson_record.content
                lesson_id = lesson_record.id

        tutor_state = initial_state(lesson)
        lesson_title = tutor_state["lesson_title"]
        stored_messages: list[dict] = []
        words_learned: list = []
        pronunciation_scores: list[float] = []
        awaiting_user = False

        session_row = ConversationSession(
            user_id=uid,
            lesson_id=lesson_id,
            messages=[],
            words_learned=[],
            pronunciation_score=0.0,
            session_review={"lesson_title": lesson_title},
        )
        db.add(session_row)
        await db.flush()
        db_session_id = str(session_row.id)

        await websocket.send_json({
            "type": "connected",
            "session_id": db_session_id,
            "lesson_title": lesson_title,
            "lesson_id": str(lesson_id) if lesson_id else None,
            "target_lang": target_lang,
            "native_lang": native_lang,
            "tutor_name": tutor_name,
            "tutor_flag": tutor_flag,
            "mock_mode": settings.mock_analysis,
        })

        async def send_tutor_turn(payload: dict) -> dict:
            nonlocal awaiting_user
            flat = _flatten_tutor_payload(payload)
            if _is_quiz_question(flat):
                awaiting_user = True
            elif _is_quiz_evaluation(flat):
                awaiting_user = not bool(flat.get("answer_correct"))
            flat["awaiting_user"] = awaiting_user

            await websocket.send_json({
                "type": "ai_message",
                **flat,
                "user_text": "",
                "audio_base64": "",
            })
            stored_messages.append(_message_record("assistant", flat))
            if payload.get("new_word"):
                words_learned.append(payload["new_word"])
            if flat.get("pronunciation_score") is not None:
                pronunciation_scores.append(float(flat["pronunciation_score"]))
            session_row.messages = copy.deepcopy(stored_messages)
            session_row.words_learned = copy.deepcopy(words_learned)
            if pronunciation_scores:
                session_row.pronunciation_score = sum(pronunciation_scores) / len(pronunciation_scores)
            await _persist_session(db, session_row)
            return flat

        async def send_next_step() -> bool:
            """One tutor bubble; client must send tts_done before the next."""
            nonlocal tutor_state, awaiting_user
            if tutor_state["phase"] == "done":
                return False
            if awaiting_user:
                return False
            try:
                payload, tutor_state = await generate_turn(
                    tutor_state, "", dna, native_lang, target_lang, lesson, stored_messages
                )
                await send_tutor_turn(payload)
                return True
            except Exception as e:
                print(f"⚠️ send_next_step failed: {e}")
                traceback.print_exc()
                await websocket.send_json({
                    "type": "error",
                    "message": f"Tutor error: {e}",
                })
                return False

        try:
            welcome, tutor_state = await generate_welcome(
                tutor_state, dna, native_lang, target_lang, lesson
            )
            await send_tutor_turn(welcome)
        except Exception as e:
            print(f"⚠️ Welcome failed: {e}")
            traceback.print_exc()
            await websocket.send_json({
                "type": "error",
                "message": str(e),
            })

        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type", "text")
                user_text = ""

                if msg_type == "tts_done":
                    await send_next_step()
                    continue

                if msg_type == "continue":
                    await send_next_step()
                    continue

                if msg_type == "audio":
                    await websocket.send_json({"type": "transcribing"})
                    try:
                        audio_bytes = base64.b64decode(data.get("audio", ""))
                        hint = speech_hint_for_state(tutor_state)
                        t = await transcribe_learner_audio(
                            audio_bytes,
                            native_lang,
                            target_lang,
                            expected_text=hint.get("expected_text") or None,
                            prefer_target=hint.get("prefer_target", True),
                        )
                        user_text = (t.get("transcript") or "").strip()
                        if not user_text:
                            await websocket.send_json({
                                "type": "error",
                                "message": "Could not hear you — hold the mic longer and speak clearly.",
                            })
                            continue
                        await websocket.send_json({
                            "type": "transcription",
                            "text": user_text,
                            "confidence": t.get("confidence"),
                        })
                    except Exception as e:
                        print(f"⚠️ Transcription failed: {e}")
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Could not transcribe audio: {e}",
                        })
                        continue
                elif msg_type == "text":
                    user_text = data.get("text", "").strip()

                if not user_text:
                    continue

                await websocket.send_json({"type": "thinking"})

                stored_messages.append(_message_record("user", {}, user_text))
                session_row.messages = copy.deepcopy(stored_messages)
                await _persist_session(db, session_row)

                try:
                    payload, tutor_state = await generate_turn(
                        tutor_state,
                        user_text,
                        dna,
                        native_lang,
                        target_lang,
                        lesson,
                        stored_messages,
                    )
                    flat = await send_tutor_turn(payload)
                    # After a correct quiz answer, client tts_done will trigger next phrase
                    if flat.get("answer_correct") and tutor_state["phase"] != "quiz":
                        awaiting_user = False
                except Exception as e:
                    print(f"⚠️ User turn failed: {e}")
                    traceback.print_exc()
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Could not evaluate answer: {e}",
                    })
                    await websocket.send_json({"type": "thinking_done"})

        except WebSocketDisconnect:
            review = {}
            if stored_messages:
                try:
                    review = await generate_session_review(
                        stored_messages, native_lang, target_lang, dna
                    )
                except Exception as e:
                    print(f"⚠️ Review failed: {e}")
                review["lesson_title"] = lesson_title
                session_row.session_review = review
                session_row.messages = stored_messages
                session_row.words_learned = words_learned
                await _persist_session(db, session_row)
            print(f"✅ Session {db_session_id} saved ({len(stored_messages)} messages).")
