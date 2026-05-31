/** Shared language display, onboarding options, and TTS helpers */

import { speakSlow, speakBilingual } from "./voice";

export { speakSlow, speakBilingual };

export const LANG_FLAGS: Record<string, string> = {
  hindi: "🇮🇳",
  tamil: "🇮🇳",
  bengali: "🇮🇳",
  punjabi: "🇮🇳",
  english: "🇬🇧",
  spanish: "🇪🇸",
  french: "🇫🇷",
  mandarin: "🇨🇳",
};

export const LANG_TTS: Record<string, string> = {
  hindi: "hi-IN",
  tamil: "ta-IN",
  bengali: "bn-IN",
  punjabi: "pa-IN",
  english: "en-US",
  spanish: "es-ES",
  french: "fr-FR",
  mandarin: "zh-CN",
};

/** Languages user may speak at home */
export const NATIVE_LANGUAGE_OPTIONS = [
  { name: "Hindi", key: "hindi", flag: "🇮🇳" },
  { name: "Tamil", key: "tamil", flag: "🇮🇳" },
  { name: "Bengali", key: "bengali", flag: "🇮🇳" },
  { name: "Punjabi", key: "punjabi", flag: "🇮🇳" },
  { name: "English", key: "english", flag: "🇬🇧" },
] as const;

/** Languages user can learn */
export const TARGET_LANGUAGE_OPTIONS = [
  { name: "Spanish", key: "spanish", flag: "🇪🇸", sub: "Español" },
  { name: "French", key: "french", flag: "🇫🇷", sub: "Français" },
  { name: "English", key: "english", flag: "🇬🇧", sub: "English" },
  { name: "Mandarin", key: "mandarin", flag: "🇨🇳", sub: "中文" },
  { name: "Hindi", key: "hindi", flag: "🇮🇳", sub: "हिन्दी" },
  { name: "Tamil", key: "tamil", flag: "🇮🇳", sub: "தமிழ்" },
] as const;

export function capitalizeLang(lang: string): string {
  if (!lang) return "";
  return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
}

export function getLangFlag(lang: string): string {
  return LANG_FLAGS[lang.toLowerCase()] ?? "🌐";
}

export function getLangTTS(lang: string): string {
  return LANG_TTS[lang.toLowerCase()] ?? "en-US";
}

export function speakPhrase(text: string, lang: string): void {
  speakSlow(text, lang);
}

/** Day N is unlocked when day N-1 is completed (day 1 always open). */
export function isLessonUnlocked(
  lessonDay: number,
  lessons: { day: number; completed: boolean }[]
): boolean {
  if (lessonDay <= 1) return true;
  const previous = lessons.find((l) => l.day === lessonDay - 1);
  return previous?.completed === true;
}

export function getCurrentLessonDay(
  lessons: { day: number; completed: boolean }[]
): number {
  const sorted = [...lessons].sort((a, b) => a.day - b.day);
  const firstOpen = sorted.find((l) => !l.completed);
  return firstOpen?.day ?? sorted[sorted.length - 1]?.day ?? 1;
}
