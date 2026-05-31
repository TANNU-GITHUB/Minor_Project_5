/** Browser TTS — slow bilingual tutor with reliable sequential playback */

import { getLangTTS } from "./languages";

const LEARNING_RATE = 0.68;
const LEARNING_PITCH = 1.05;

let voicesCache: SpeechSynthesisVoice[] | null = null;
let voicesReadyPromise: Promise<void> | null = null;

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return [];
  voicesCache = window.speechSynthesis.getVoices();
  return voicesCache;
}

/** Wait until the browser exposes speech voices (required on Chrome/Edge). */
export function ensureVoicesLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (voicesCache?.length) return Promise.resolve();
  if (voicesReadyPromise) return voicesReadyPromise;

  voicesReadyPromise = new Promise((resolve) => {
    const tryLoad = () => {
      const voices = loadVoices();
      if (voices.length > 0) {
        resolve();
        return true;
      }
      return false;
    };
    if (tryLoad()) return;
    const onChange = () => {
      if (tryLoad()) {
        window.speechSynthesis.removeEventListener("voiceschanged", onChange);
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    window.setTimeout(() => {
      tryLoad();
      resolve();
    }, 800);
  });
  return voicesReadyPromise;
}

/** Prefer regional voices for the learner's language. */
export function pickVoiceForLang(langKey: string): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  const langCode = getLangTTS(langKey);
  const langPrefix = langCode.split("-")[0];

  const ranked = voices
    .filter(
      (v) =>
        v.lang.startsWith(langPrefix) ||
        v.lang.replace("_", "-").startsWith(langPrefix)
    )
    .sort((a, b) => {
      const score = (v: SpeechSynthesisVoice) => {
        let s = 0;
        const n = v.name.toLowerCase();
        const lang = v.lang.replace("_", "-");
        if (lang === langCode) s += 20;
        if (lang.includes("-IN") && langCode.includes("-IN")) s += 12;
        if (n.includes("google")) s += 4;
        if (n.includes("natural") || n.includes("neural")) s += 3;
        if (langPrefix === "hi" && (n.includes("hindi") || n.includes("heera"))) s += 10;
        if (langPrefix === "ta" && n.includes("tamil")) s += 10;
        if (langPrefix === "bn" && n.includes("bengali")) s += 10;
        return s;
      };
      return score(b) - score(a);
    });

  return (
    ranked[0] ??
    voices.find((v) => v.lang.startsWith(langPrefix)) ??
    null
  );
}

/** Remove emojis / markup so TTS does not skip or misread. */
export function stripForSpeech(text: string): string {
  return text
    .replace(/\[.*?\]/g, "")
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function speakSlow(
  text: string,
  langKey: string,
  onEnd?: () => void,
  cancelPrevious = true
): void {
  const cleaned = stripForSpeech(text);
  if (!cleaned || typeof window === "undefined") {
    onEnd?.();
    return;
  }

  if (cancelPrevious) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = getLangTTS(langKey);
  utterance.rate = LEARNING_RATE;
  utterance.pitch = LEARNING_PITCH;
  const voice = pickVoiceForLang(langKey);
  if (voice) utterance.voice = voice;

  const finish = () => onEnd?.();
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
}

/** Speak native line first, then target — returns when both finish. */
export function speakBilingualAsync(
  nativeText: string,
  targetText: string,
  nativeLang: string,
  targetLang: string
): Promise<void> {
  return ensureVoicesLoaded().then(
    () =>
      new Promise((resolve) => {
        const n = stripForSpeech(nativeText);
        const t = stripForSpeech(targetText);

        if (n && t) {
          speakSlow(n, nativeLang, () => speakSlow(t, targetLang, resolve, false), true);
        } else if (n) {
          speakSlow(n, nativeLang, resolve, true);
        } else if (t) {
          speakSlow(t, targetLang, resolve, true);
        } else {
          resolve();
        }
      })
  );
}

/** @deprecated Use speakBilingualAsync for sequential chat */
export function speakBilingual(
  nativeText: string,
  targetText: string,
  nativeLang: string,
  targetLang: string
): void {
  void speakBilingualAsync(nativeText, targetText, nativeLang, targetLang);
}

if (typeof window !== "undefined") {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
  void ensureVoicesLoaded();
}
