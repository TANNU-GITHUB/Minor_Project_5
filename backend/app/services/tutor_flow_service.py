"""Structured tutor: intro (native) → word-by-word → quiz with evaluation."""
from __future__ import annotations

import json
import re
from typing import Any

from app.config import settings


def _parse_phrases(lesson: dict | None) -> list[dict]:
    if not lesson:
        return [
            {
                "target": "Bonjour!",
                "native": "Hello",
                "pronunciation": "bon-ZHOOR",
            }
        ]
    raw = lesson.get("phrases") or []
    out: list[dict] = []
    for p in raw:
        if isinstance(p, dict):
            out.append({
                "target": p.get("target", ""),
                "native": p.get("native", ""),
                "pronunciation": p.get("pronunciation", ""),
            })
        elif isinstance(p, str):
            out.append({"target": p, "native": "", "pronunciation": ""})
    return out or [{"target": "Hello", "native": "Hello", "pronunciation": ""}]


def _split_words(target: str) -> list[str]:
    cleaned = re.sub(r"[^\w\s\u0900-\u097F\u4e00-\u9fff\u3040-\u30ffÀ-ÿ'’\-?!¡¿]", " ", target)
    parts = [w for w in cleaned.split() if w.strip()]
    return parts if parts else [target.strip() or "?"]


def initial_state(lesson: dict | None) -> dict[str, Any]:
    phrases = _parse_phrases(lesson)
    return {
        "phase": "intro",
        "phrase_index": 0,
        "word_index": 0,
        "phrases": phrases,
        "lesson_title": (lesson or {}).get("title", "Today's practice"),
        "lesson_theme": (lesson or {}).get("theme", ""),
        "practice_prompt": (lesson or {}).get("practice_prompt", ""),
        "grammar_tip": (lesson or {}).get("grammar_tip", ""),
    }


def _current_phrase(state: dict) -> dict:
    idx = state["phrase_index"]
    phrases = state["phrases"]
    return phrases[min(idx, len(phrases) - 1)]


def speech_hint_for_state(state: dict) -> dict:
    """What the learner is likely saying — improves Whisper accuracy."""
    phase = state.get("phase", "")
    phrase = _current_phrase(state)
    target_sentence = phrase.get("target", "")

    if phase == "teach_word":
        words = _split_words(target_sentence)
        wi = state.get("word_index", 0)
        expected = words[min(wi, len(words) - 1)]
        return {"expected_text": expected, "prefer_target": True}
    if phase in ("quiz", "overview"):
        return {"expected_text": target_sentence, "prefer_target": True}
    if phase == "intro":
        return {"expected_text": target_sentence, "prefer_target": False}
    return {"expected_text": target_sentence, "prefer_target": True}


async def _llm_json(system: str, user: str) -> dict:
    from groq import AsyncGroq
    from app.services.dna_service import _parse_json_from_llm

    client = AsyncGroq(api_key=settings.groq_api_key)
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.65,
        max_tokens=600,
    )
    raw = response.choices[0].message.content or "{}"
    try:
        return _parse_json_from_llm(raw)
    except Exception:
        return {
            "message_native": raw[:300],
            "message_target": "",
            "pronunciation_score": None,
            "correction_native": None,
            "correction_target": None,
            "encouragement": "Keep going! 🌟",
            "new_word": None,
            "language_tip": None,
            "phase": None,
            "answer_correct": None,
            "evaluation_native": None,
        }


def _base_system(dna: dict, native_lang: str, target_lang: str, lesson: dict | None) -> str:
    persona = dna.get("teaching_persona", "Be warm and clear.")
    topics = ", ".join(dna.get("favorite_topics", ["daily life"]))
    return f"""You are Priya, an Indian language tutor. Student's native: {native_lang}. Learning: {target_lang}.
Topics they love: {topics}. Style: {persona}
Always reply ONLY valid JSON with these keys:
{{
  "message_native": "2-4 sentences in {native_lang} SCRIPT (explanations, praise, instructions)",
  "message_target": "1-3 sentences in {target_lang} SCRIPT (the phrase/word being taught)",
  "pronunciation_score": null or 0-100,
  "correction_native": null or string in {native_lang} script,
  "correction_target": null or string in {target_lang} script,
  "encouragement": "short phrase with emoji",
  "new_word": {{"target": "...", "native": "..."}} or null,
  "language_tip": "one actionable tip or null",
  "phase": "intro|overview|teach_word|quiz|done",
  "answer_correct": true|false|null,
  "evaluation_native": "detailed feedback on their answer in {native_lang} script or null"
}}"""


def _mock_payload(
    phase: str,
    state: dict,
    native_lang: str,
    target_lang: str,
    user_text: str = "",
) -> dict:
    phrase = _current_phrase(state)
    words = _split_words(phrase["target"])
    wi = state["word_index"]
    title = state["lesson_title"]

    if phase == "intro":
        return {
            "message_native": (
                f"नमस्ते! 🙏 आज का पाठ: «{title}». "
                f"हम {len(state['phrases'])} वाक्य सीखेंगे — पहले मैं {native_lang} में समझाऊँगी, "
                f"फिर शब्द-दर-शब्द {target_lang} सिखाऊँगी, फिर आपसे सवाल पूछूँगी।"
            ),
            "message_target": phrase["target"],
            "pronunciation_score": None,
            "correction_native": None,
            "correction_target": None,
            "encouragement": "चलिए शुरू करते हैं! ✨",
            "new_word": None,
            "language_tip": "जवाब देने के लिए माइक या टाइप का उपयोग करें।",
            "phase": "intro",
            "answer_correct": None,
            "evaluation_native": None,
        }

    if phase == "overview":
        return {
            "message_native": (
                f"अब हम यह वाक्य सीखेंगे: «{phrase['native']}» — अर्थ: {phrase['native']}. "
                f"नीचे पूरा {target_lang} वाक्य है, फिर हर शब्द अलग समझाऊँगी।"
            ),
            "message_target": phrase["target"],
            "pronunciation_score": None,
            "correction_native": None,
            "correction_target": None,
            "encouragement": "ध्यान से सुनिए 👂",
            "new_word": {"target": phrase["target"], "native": phrase["native"]},
            "language_tip": f"उच्चारण: {phrase.get('pronunciation') or 'धीरे-धीरे दोहराएँ'}",
            "phase": "overview",
            "answer_correct": None,
            "evaluation_native": None,
        }

    if phase == "teach_word":
        word = words[min(wi, len(words) - 1)]
        return {
            "message_native": (
                f"शब्द {wi + 1}/{len(words)}: «{word}» — इस वाक्य «{phrase['target']}» का हिस्सा है। "
                f"पूरे वाक्य का अर्थ: {phrase['native']}।"
            ),
            "message_target": word,
            "pronunciation_score": None,
            "correction_native": None,
            "correction_target": None,
            "encouragement": "अब इस शब्द को ज़ोर से बोलकर दोहराइए 🔁",
            "new_word": {"target": word, "native": phrase["native"]},
            "language_tip": None,
            "phase": "teach_word",
            "answer_correct": None,
            "evaluation_native": None,
        }

    if phase == "quiz":
        score = 78 if user_text else None
        correct = bool(user_text and len(user_text) > 2)
        return {
            "message_native": (
                f"{'बहुत अच्छा! ✅' if correct else 'कोशिश अच्छी है!'} "
                f"सवाल: पूरा वाक्य «{phrase['target']}» {target_lang} में बोलिए या लिखिए। "
                f"अर्थ: {phrase['native']}."
            ),
            "message_target": phrase["target"],
            "pronunciation_score": score,
            "correction_native": None if correct else f"पूरा वाक्य याद रखें: {phrase['native']}",
            "correction_target": None if correct else phrase["target"],
            "encouragement": "शाबाश! 💪" if correct else "फिर से कोशिश करें 🌟",
            "new_word": None,
            "language_tip": f"अगला वाक्य जल्द ही — {state['practice_prompt'][:80]}",
            "phase": "quiz",
            "answer_correct": correct,
            "evaluation_native": (
                f"आपने {'सही' if correct else 'लगभग सही'} जवाब दिया। अगला कदम: अगला वाक्य।"
            ),
        }

    return {
        "message_native": "आज का पाठ पूरा! 🎉 अगली बार फिर मिलते हैं।",
        "message_target": "¡Hasta luego!",
        "pronunciation_score": None,
        "correction_native": None,
        "correction_target": None,
        "encouragement": "बहुत बढ़िया सत्र! 🏆",
        "new_word": None,
        "language_tip": None,
        "phase": "done",
        "answer_correct": None,
        "evaluation_native": None,
    }


def _str_field(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return str(value)


def sanitize_tutor_payload(payload: dict) -> dict:
    """Ensure JSON fields are strings so WebSocket/UI never crash."""
    out = dict(payload or {})
    out["message_native"] = _str_field(out.get("message_native"))
    out["message_target"] = _str_field(out.get("message_target"))
    out["correction_native"] = out.get("correction_native") or None
    out["correction_target"] = out.get("correction_target") or None
    if out["correction_native"] is not None:
        out["correction_native"] = _str_field(out["correction_native"]) or None
    if out["correction_target"] is not None:
        out["correction_target"] = _str_field(out["correction_target"]) or None
    if out.get("encouragement") is not None:
        out["encouragement"] = _str_field(out.get("encouragement"))
    if out.get("language_tip") is not None:
        out["language_tip"] = _str_field(out.get("language_tip"))
    if out.get("evaluation_native") is not None:
        out["evaluation_native"] = _str_field(out.get("evaluation_native"))
    return out


def _enrich_payload(payload: dict, state: dict) -> dict:
    payload = sanitize_tutor_payload(payload)
    payload.setdefault("phase", state["phase"])
    payload["phrase_index"] = state["phrase_index"]
    payload["word_index"] = state["word_index"]
    payload["phrases_total"] = len(state["phrases"])
    payload["current_phrase_target"] = _current_phrase(state).get("target", "")
    return payload


def advance_state(state: dict, user_text: str, payload: dict) -> dict:
    """Move state machine after a tutor turn (and optional user answer in quiz)."""
    phase = state["phase"]
    phrases = state["phrases"]
    pi = state["phrase_index"]
    phrase = _current_phrase(state)
    words = _split_words(phrase["target"])

    if phase == "intro":
        state["phase"] = "overview"
        return state

    if phase == "overview":
        state["phase"] = "teach_word"
        state["word_index"] = 0
        return state

    if phase == "teach_word":
        if state["word_index"] < len(words) - 1:
            state["word_index"] += 1
        else:
            state["phase"] = "quiz"
        return state

    if phase == "quiz":
        passed = payload.get("answer_correct") is True or (
            payload.get("pronunciation_score") is not None
            and payload.get("pronunciation_score", 0) >= 55
        )
        if user_text and passed:
            if pi < len(phrases) - 1:
                state["phrase_index"] = pi + 1
                state["word_index"] = 0
                state["phase"] = "overview"
            else:
                state["phase"] = "done"
        elif user_text and not passed:
            pass  # stay in quiz, tutor will correct
        elif not user_text:
            pass
        return state

    return state


async def generate_turn(
    state: dict,
    user_text: str,
    dna: dict,
    native_lang: str,
    target_lang: str,
    lesson: dict | None,
    history: list[dict],
) -> tuple[dict, dict]:
    """
    Produce tutor JSON for current phase. If user_text provided during quiz, evaluate first.
    Returns (payload, new_state).
    """
    phase = state["phase"]
    phrase = _current_phrase(state)
    words = _split_words(phrase["target"])
    system = _base_system(dna, native_lang, target_lang, lesson)
    title = state["lesson_title"]
    pi = state["phrase_index"]
    wi = state["word_index"]

    if settings.mock_analysis:
        if phase == "teach_word" and user_text:
            word = words[min(wi, len(words) - 1)]
            payload = {
                "message_native": f"बहुत अच्छा! «{word}» अच्छा बोला। अगला शब्द सुनिए। 👏",
                "message_target": word,
                "pronunciation_score": 75,
                "correction_native": None,
                "correction_target": None,
                "encouragement": "शाबाश! 💪",
                "new_word": {"target": word, "native": phrase["native"]},
                "language_tip": None,
                "phase": "teach_word",
                "answer_correct": True,
                "evaluation_native": None,
            }
            new_state = advance_state(dict(state), "", payload)
            return _enrich_payload(payload, new_state), new_state
        if phase == "quiz" and user_text:
            payload = _mock_payload("quiz", state, native_lang, target_lang, user_text)
            new_state = advance_state(dict(state), user_text, payload)
            return _enrich_payload(payload, new_state), new_state
        if phase == "quiz" and not user_text:
            payload = {
                **_mock_payload("quiz", state, native_lang, target_lang, ""),
                "message_native": (
                    f"अब आपकी बारी! 🎤 पूरा वाक्य {target_lang} में बोलिए या लिखिए: "
                    f"«{phrase['target']}» — अर्थ: {phrase['native']}."
                ),
            }
            return _enrich_payload(payload, state), state

        payload = _mock_payload(phase, state, native_lang, target_lang, user_text)
        new_state = advance_state(dict(state), user_text, payload)
        return _enrich_payload(payload, new_state), new_state

    # ── Live LLM ─────────────────────────────────────────────────────────────
    if phase == "intro" and not user_text:
        user = f"""PHASE: INTRO (native language only for explanation).
Lesson title: {title}. Theme: {state['lesson_theme']}.
Phrases today ({len(state['phrases'])}): {json.dumps(state['phrases'][:3], ensure_ascii=False)}
Grammar tip: {state['grammar_tip']}

In message_native ({native_lang} script): warmly explain WHAT they will learn today step by step
(intro → word-by-word → questions). Do NOT teach words yet.
In message_target: only the first phrase as a preview, slow and simple.
Set phase to "intro". pronunciation_score null."""

    elif phase == "overview" and not user_text:
        user = f"""PHASE: SENTENCE OVERVIEW.
Phrase {pi + 1}/{len(state['phrases'])}: target="{phrase['target']}" meaning="{phrase['native']}" pronunciation="{phrase.get('pronunciation', '')}"
In message_native: explain the FULL sentence meaning in {native_lang}. Say we will break it word by word next.
In message_target: repeat the full sentence slowly in {target_lang}.
Set phase to "overview". new_word = full phrase pair."""

    elif phase == "teach_word" and not user_text:
        word = words[min(wi, len(words) - 1)]
        user = f"""PHASE: TEACH ONE WORD.
Full sentence: "{phrase['target']}" (meaning: {phrase['native']})
Word {wi + 1} of {len(words)}: "{word}"
In message_native: explain ONLY this word's role and meaning in the sentence ({native_lang} script).
In message_target: say ONLY this word in {target_lang}, ask them to repeat it aloud.
Set phase to "teach_word". new_word = this word + brief native gloss."""

    elif phase == "quiz" and not user_text:
        user = f"""PHASE: QUIZ QUESTION (do not evaluate yet).
Ask ONE clear question in {native_lang}: student must say or type the full phrase in {target_lang}.
Phrase: "{phrase['target']}" meaning "{phrase['native']}"
message_target: show the expected phrase as hint only if needed.
Set phase to "quiz". answer_correct null. pronunciation_score null."""

    elif phase == "quiz" and user_text:
        user = f"""PHASE: EVALUATE ANSWER.
Expected phrase in {target_lang}: "{phrase['target']}"
Expected meaning: "{phrase['native']}"
Student answered: "{user_text}"

Score pronunciation/accuracy 0-100. Set answer_correct true if mostly correct (≥55 score).
In evaluation_native: explain what was right/wrong in {native_lang}.
correction_target if wrong. encouragement always.
Set phase to "quiz"."""

    elif phase == "done":
        user = "PHASE: DONE. Congratulate in native language. Brief summary of what they learned. phase=done."

    elif phase == "teach_word" and user_text:
        word = words[min(wi, len(words) - 1)]
        user = f"""PHASE: WORD REPETITION CHECK.
Student said: "{user_text}" while learning word "{word}" in sentence "{phrase['target']}".
In message_native ({native_lang}): praise or gently correct, then say we move to the next word.
In message_target: repeat "{word}" once.
pronunciation_score 0-100. phase "teach_word"."""

    else:
        user = f"""Student said: "{user_text}" during phase {phase}.
Briefly encourage in {native_lang}. Keep phase "{phase}"."""

    payload = await _llm_json(system, user)
    if not payload.get("phase"):
        payload["phase"] = phase

    new_state = dict(state)
    if phase == "quiz" and user_text:
        new_state = advance_state(new_state, user_text, payload)
    elif phase == "teach_word" and user_text:
        new_state = advance_state(new_state, "", payload)
    elif not user_text:
        new_state = advance_state(new_state, user_text, payload)

    return _enrich_payload(payload, new_state), new_state


async def generate_welcome(
    state: dict,
    dna: dict,
    native_lang: str,
    target_lang: str,
    lesson: dict | None,
) -> tuple[dict, dict]:
    """First message: intro only."""
    payload, new_state = await generate_turn(
        state, "", dna, native_lang, target_lang, lesson, []
    )
    return payload, new_state
