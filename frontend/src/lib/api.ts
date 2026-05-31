// src/lib/api.ts
// Central place for all backend API calls

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL  = import.meta.env.VITE_WS_URL  || "ws://localhost:8000";

// ─── Simple fetch wrapper ─────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "API error");
  }
  return res.json();
}

// ─── DNA / Analysis ──────────────────────────────────────────────────────────
export async function uploadVoice(
  audioBlob: Blob,
  nativeLanguage: string,
  targetLanguage: string,
  userId: string
) {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  form.append("native_language", nativeLanguage);
  form.append("target_language", targetLanguage);
  form.append("user_id", userId);

  const res = await fetch(`${API_URL}/api/analyze/voice`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Voice analysis failed" }));
    const detail = typeof err.detail === "string" ? err.detail : "Voice analysis failed";
    throw new Error(detail);
  }
  return res.json();
}

export async function getDNA(userId: string) {
  return apiFetch<{
    vocabulary_richness: number;
    formality_level: number;
    humor_style: string;
    sentence_complexity: number;
    fluency_score: number;
    cultural_richness: number;
    favorite_topics: string[];
    communication_patterns: string[];
    teaching_persona: string;
  }>(`/api/dna/user/${userId}`);
}

// ─── Lessons ─────────────────────────────────────────────────────────────────
export async function getLessons(userId: string) {
  return apiFetch<Array<{
    id: string; day: number; week: number;
    title: string; theme: string;
    content: Record<string, unknown>;
    completed: boolean; score: number;
  }>>(`/api/lessons/user/${userId}`);
}

export async function getLesson(lessonId: string) {
  return apiFetch<{
    id: string; day: number; title: string;
    theme: string; content: Record<string, unknown>; completed: boolean;
  }>(`/api/lessons/${lessonId}`);
}

export async function completeLesson(lessonId: string, score: number) {
  return apiFetch(`/api/lessons/${lessonId}/complete?score=${score}`, { method: "PATCH" });
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface PhraseAttempt {
  day?: number;
  phrase?: string;
  score: number;
  passed: boolean;
}

export interface SessionReview {
  date?: string;
  summary_native?: string;
  summary_target?: string;
  strengths?: string[];
  weaknesses?: string[];
  improvement_tips?: string[];
  target_usage_percent?: number;
}

export async function getProgress(userId: string) {
  const native = UserSession.getNativeLang();
  const target = UserSession.getTargetLang();
  const qs = new URLSearchParams({ native_language: native, target_language: target });
  return apiFetch<{
    lessons_total: number;
    lessons_completed: number;
    sessions_completed: number;
    words_learned: number;
    pronunciation_score_avg: number;
    streak_days: number;
    weekly_minutes: number;
    current_day: number;
    phrase_practice_avg: number;
    phrase_attempts: PhraseAttempt[];
    strengths: string[];
    weaknesses: string[];
    improvement_tips: string[];
    recent_session_reviews: SessionReview[];
  }>(`/api/progress/${userId}?${qs}`);
}

export async function practicePhrase(
  lessonId: string,
  phraseIndex: number,
  audioBlob: Blob
) {
  const form = new FormData();
  form.append("audio", audioBlob, "practice.webm");
  form.append("phrase_index", String(phraseIndex));
  form.append("native_language", UserSession.getNativeLang());
  form.append("target_language", UserSession.getTargetLang());

  const res = await fetch(`${API_URL}/api/lessons/${lessonId}/practice-phrase`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Practice failed" }));
    throw new Error(err.detail || "Practice failed");
  }
  return res.json() as Promise<{
    score: number;
    passed: boolean;
    transcript: string;
    feedback_native: string;
    feedback_target: string;
    strength: string;
    weakness: string;
    phrase_index: number;
    lesson_score: number;
    phrases_completed: number;
    phrases_total: number;
    all_phrases_passed: boolean;
  }>;
}

// ─── Billing ─────────────────────────────────────────────────────────────────
export async function createCheckout(userId: string, userEmail: string) {
  return apiFetch<{ checkout_url: string }>(
    `/api/billing/create-checkout?user_id=${userId}&user_email=${userEmail}`,
    { method: "POST" }
  );
}

// ─── Conversations ────────────────────────────────────────────────────────────
export interface ConversationSummary {
  id: string;
  created_at: string | null;
  lesson_id: string | null;
  lesson_title: string;
  message_count: number;
  preview: string;
  pronunciation_score: number;
  words_learned_count: number;
}

export interface StoredChatMessage {
  role: "user" | "assistant";
  content: string;
  message_native?: string;
  message_target?: string;
  phase?: string;
  pronunciation_score?: number | null;
  answer_correct?: boolean | null;
  evaluation_native?: string | null;
}

export interface ConversationDetail {
  id: string;
  user_id: string;
  lesson_id: string | null;
  lesson_title: string;
  created_at: string | null;
  messages: StoredChatMessage[];
  words_learned: { target: string; native: string }[];
  pronunciation_score: number;
  session_review: Record<string, unknown>;
  duration_seconds: number;
}

export async function listConversations(userId: string) {
  return apiFetch<{ sessions: ConversationSummary[] }>(
    `/api/conversations/user/${userId}`
  );
}

export async function getConversation(sessionId: string) {
  return apiFetch<ConversationDetail>(`/api/conversations/${sessionId}`);
}

// ─── WebSocket helper ─────────────────────────────────────────────────────────
export function createConversationSocket(
  userId: string,
  nativeLanguage?: string,
  targetLanguage?: string
): WebSocket {
  const native = nativeLanguage ?? UserSession.getNativeLang();
  const target = targetLanguage ?? UserSession.getTargetLang();
  const qs = new URLSearchParams({
    native_language: native,
    target_language: target,
  });
  return new WebSocket(`${WS_URL}/ws/converse/${userId}?${qs}`);
}

// ─── Local storage helpers (simple session management) ────────────────────────
export const UserSession = {
  getId: (): string => {
    let id = localStorage.getItem("tb_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("tb_user_id", id);
    }
    return id;
  },

  isLoggedIn: (): boolean => localStorage.getItem("tb_logged_in") === "true",

  login: (email: string, name?: string) => {
    localStorage.setItem("tb_logged_in", "true");
    localStorage.setItem("tb_user_email", email);
    if (name) localStorage.setItem("tb_user_name", name);
    UserSession.getId();
  },

  logout: () => {
    localStorage.clear();
  },

  getEmail: () => localStorage.getItem("tb_user_email") || "",
  getName: () => localStorage.getItem("tb_user_name") || "Learner",

  isOnboardingComplete: (): boolean =>
    localStorage.getItem("tb_onboarding_complete") === "true",

  setOnboardingComplete: (value = true) => {
    localStorage.setItem("tb_onboarding_complete", value ? "true" : "false");
  },

  saveDNA: (dna: Record<string, unknown>) => {
    localStorage.setItem("tb_dna", JSON.stringify(dna));
  },

  getDNA: () => {
    const raw = localStorage.getItem("tb_dna");
    return raw ? JSON.parse(raw) : null;
  },

  setLanguages: (native: string, target: string) => {
    localStorage.setItem("tb_native_lang", native.toLowerCase());
    localStorage.setItem("tb_target_lang", target.toLowerCase());
  },

  getNativeLang: () => localStorage.getItem("tb_native_lang") || "",
  getTargetLang: () => localStorage.getItem("tb_target_lang") || "",

  hasLanguages: (): boolean =>
    !!(UserSession.getNativeLang() && UserSession.getTargetLang()),
};