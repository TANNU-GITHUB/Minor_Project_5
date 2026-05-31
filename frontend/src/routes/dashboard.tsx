import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getLessons, getProgress, UserSession } from "@/lib/api";
import { requireAppAccess } from "@/lib/guards";
import {
  capitalizeLang,
  getLangFlag,
  getCurrentLessonDay,
  isLessonUnlocked,
  speakPhrase,
} from "@/lib/languages";
import { Volume2, Star, Flame, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TongueBridge" }] }),
  beforeLoad: requireAppAccess,
  component: Dashboard,
});

interface Lesson {
  id: string;
  day: number;
  week: number;
  title: string;
  theme: string;
  content: {
    phrases?: Array<{
      target: string;
      native: string;
      pronunciation: string;
    }>;
    grammar_tip?: string;
    cultural_note?: string;
  };
  completed: boolean;
  score: number;
}

interface Progress {
  lessons_total: number;
  lessons_completed: number;
  sessions_completed: number;
  words_learned: number;
  pronunciation_score_avg: number;
  streak_days: number;
  weekly_minutes: number;
}

interface Phrase {
  target: string;
  native: string;
  pronunciation: string;
}

function Ring({ value, color }: { value: number; color: string }) {
  const c = 2 * Math.PI * 22;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="22" fill="none" stroke="#DFF0EA" strokeWidth="5" />
      <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} strokeLinecap="round"
        transform="rotate(-90 28 28)" />
      <text x="28" y="32" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0D2B22">{value}%</text>
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <AppShell>
      <div className="bg-white rounded-2xl p-6 shadow-card animate-pulse">
        <div className="h-8 w-64 bg-border-subtle rounded mb-3" />
        <div className="h-4 w-96 bg-border-subtle rounded" />
      </div>

      <div className="mt-5 rounded-2xl p-6 bg-border-subtle animate-pulse h-48" />

      <h3 className="mt-8 mb-3 text-lg font-bold text-heading">Loading...</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-card h-40 animate-pulse bg-border-subtle" />
        ))}
      </div>
    </AppShell>
  );
}

function Dashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = UserSession.getId();
        const [l, p] = await Promise.all([
          getLessons(userId),
          getProgress(userId),
        ]);
        setLessons(l);
        setProgress(p);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load dashboard";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePronounce = (text: string, lang?: string) => {
    try {
      speakPhrase(text, lang || UserSession.getTargetLang());
    } catch {
      toast.error("Could not play pronunciation");
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !progress) {
    return (
      <AppShell>
        <div className="bg-white rounded-2xl p-6 shadow-card text-center">
          <h1 className="text-2xl font-bold text-heading mb-4">Error Loading Dashboard</h1>
          <p className="text-body mb-6">{error || "Could not load your data"}</p>
          <Link to="/onboarding" className="inline-block px-6 py-3 rounded-full bg-brand text-white font-semibold">
            Start Over
          </Link>
        </div>
      </AppShell>
    );
  }

  const sortedLessons = [...lessons].sort((a, b) => a.day - b.day);
  const currentDay = getCurrentLessonDay(sortedLessons);
  const currentLesson =
    sortedLessons.find((l) => l.day === currentDay && !l.completed) ??
    sortedLessons.find((l) => l.day === currentDay) ??
    sortedLessons[0];

  // Empty state
  if (lessons.length === 0) {
    return (
      <AppShell>
        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <h2 className="text-2xl font-bold text-heading mb-3">📚 No Lessons Yet</h2>
          <p className="text-body mb-6">Complete your voice analysis to get your personalized lessons</p>
          <Link to="/onboarding" className="inline-block px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark">
            Analyze Your Voice
          </Link>
        </div>
      </AppShell>
    );
  }

  const targetLang = UserSession.getTargetLang();
  const userName = progress.lessons_completed > 0 ? "back" : "there";

  return (
    <AppShell>
      {/* Header with greeting and stats */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h1 className="text-2xl font-extrabold text-heading">
          Welcome {userName}! {getLangFlag(targetLang)}
        </h1>
        <p className="text-body mt-1">
          <strong>Day {currentDay}</strong> of 7 · Learning{" "}
          <strong>{capitalizeLang(targetLang)}</strong>
          {progress.streak_days > 0 && (
            <span> · 🔥 {progress.streak_days}-day streak</span>
          )}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-brand" />
            <span className="text-body">{progress.streak_days} day streak</span>
          </div>
          <div className="text-body">
            • 📖 {progress.words_learned} {capitalizeLang(targetLang)} words practiced
          </div>
          <div className="text-body">• {progress.pronunciation_score_avg}% avg score</div>
          <div className="text-body">• {progress.sessions_completed} sessions</div>
        </div>
      </div>

      {/* Current lesson card */}
      {currentLesson && (
        <div className="mt-5 rounded-2xl p-6 text-white shadow-elevated" style={{ background: "linear-gradient(135deg,#0F6E56,#0A4D3C)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                Day {currentLesson.day}: {currentLesson.title}
              </h2>
              <p className="opacity-80 text-sm mt-1">
                Theme: {currentLesson.theme} · {currentLesson.content.phrases?.length || 0}{" "}
                {capitalizeLang(targetLang)} phrases
              </p>
              <div className="mt-4 max-w-xs">
                <div className="text-xs opacity-80 mb-1">
                  Week progress: {progress.lessons_completed} / {progress.lessons_total} days
                </div>
                <div className="h-2 rounded-full bg-white/15">
                  <div
                    className="h-full bg-amber-brand rounded-full transition-all"
                    style={{
                      width: `${progress.lessons_total ? (progress.lessons_completed / progress.lessons_total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  nav({ to: "/lesson/$day", params: { day: currentLesson.id } })
                }
                className="px-6 py-3 rounded-full bg-amber-brand text-[#0D2B22] font-semibold hover:opacity-90 active:scale-95 transition whitespace-nowrap"
              >
                Open Lesson 📖
              </button>
              <button
                type="button"
                onClick={() => nav({ to: "/conversation" })}
                className="px-6 py-3 rounded-full bg-white text-brand font-semibold hover:bg-brand-tint active:scale-95 transition whitespace-nowrap"
              >
                Practice Chat 💬
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phrases */}
      <h3 className="mt-8 mb-3 text-lg font-bold text-heading">
        Phrases to Master — {capitalizeLang(targetLang)} {getLangFlag(targetLang)} (Day {currentDay})
      </h3>
      {currentLesson?.content.phrases && currentLesson.content.phrases.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(currentLesson.content.phrases as Phrase[]).map((p) => (
            <div key={p.target} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-elevated transition relative">
              <button className="absolute top-3 right-3 text-muted-ink hover:text-amber-brand">
                <Star className="w-4 h-4" />
              </button>
              <div className="text-xs text-muted-ink uppercase tracking-wide mb-1">
                {capitalizeLang(targetLang)}
              </div>
              <div className="text-lg font-bold text-brand">{p.target}</div>
              <div className="text-sm text-muted-ink mt-1 italic">🗣️ {p.pronunciation}</div>
              <div className="text-sm text-body mt-2">
                {UserSession.getNativeLang() && (
                  <span className="text-muted-ink">{capitalizeLang(UserSession.getNativeLang())}: </span>
                )}
                {p.native}
              </div>
              <button
                onClick={() => handlePronounce(p.target, targetLang)}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-tint text-brand text-xs font-semibold hover:bg-brand/10"
              >
                <Volume2 className="w-3 h-3" /> Listen
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Info boxes */}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {currentLesson?.content.grammar_tip && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h4 className="font-bold text-blue-900 mb-2">📚 Grammar Tip</h4>
            <p className="text-sm text-blue-800">{currentLesson.content.grammar_tip}</p>
          </div>
        )}
        {currentLesson?.content.cultural_note && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h4 className="font-bold text-amber-900 mb-2">🌍 Cultural Note</h4>
            <p className="text-sm text-amber-800">{currentLesson.content.cultural_note}</p>
          </div>
        )}
      </div>

      {/* Lesson progress */}
      <h3 className="mt-8 mb-3 text-lg font-bold text-heading">Your Progress</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="🎤 Pronunciation" value={progress.pronunciation_score_avg} color="#0F6E56" />
        <WordsStat count={progress.words_learned} lang={targetLang} />
        <div className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-4">
          <Flame className="w-12 h-12 text-amber-brand" />
          <div>
            <div className="text-2xl font-extrabold text-heading">{progress.streak_days}</div>
            <div className="text-xs text-muted-ink">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-8 rounded-2xl p-6 bg-white shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-heading">Ready to Practice? 💬</h3>
          <p className="text-sm text-body mt-1 max-w-md">
            Chat with your AI tutor in {capitalizeLang(targetLang)} — personalized to your DNA
          </p>
        </div>
        <button
          onClick={() => nav({ to: "/conversation" })}
          className="px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark active:scale-95 transition whitespace-nowrap"
        >
          Start Conversation →
        </button>
      </div>

      {/* Lessons sidebar (optional reference) */}
      <h3 className="mt-8 mb-3 text-lg font-bold text-heading">All Lessons</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {sortedLessons.map((l) => {
          const isLocked = !isLessonUnlocked(l.day, sortedLessons);
          const isCurrent = l.day === currentDay && !l.completed;

          return (
            <button
              key={l.id}
              onClick={() => !isLocked && nav({ to: "/lesson/$day", params: { day: l.id } })}
              disabled={isLocked}
              className={`p-3 rounded-xl font-semibold text-sm transition ${
                isLocked
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                  : isCurrent
                  ? "bg-brand text-white shadow-elevated"
                  : l.completed
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-white border-2 border-border-subtle text-body hover:border-brand"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Day {l.day}</span>
                {isLocked && <Lock className="w-3 h-3" />}
                {l.completed && <span>✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}

function WordsStat({ count, lang }: { count: number; lang: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-purple-brand/10 flex items-center justify-center text-2xl">
        {getLangFlag(lang)}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-heading">{count}</div>
        <div className="text-xs text-muted-ink">
          {capitalizeLang(lang)} words practiced
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-4">
      <Ring value={Math.min(Math.max(value, 0), 100)} color={color} />
      <div>
        <div className="text-2xl font-extrabold text-heading">{Math.round(value)}%</div>
        <div className="text-xs text-muted-ink">{label}</div>
      </div>
    </div>
  );
}
