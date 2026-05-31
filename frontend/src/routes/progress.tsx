import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";
import { getProgress, getLessons, UserSession } from "@/lib/api";
import { requireAppAccess } from "@/lib/guards";
import { capitalizeLang, getLangFlag, isLessonUnlocked } from "@/lib/languages";
import { Flame } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — TongueBridge" }] }),
  beforeLoad: requireAppAccess,
  component: Progress,
});

interface ProgressData {
  lessons_total: number;
  lessons_completed: number;
  sessions_completed: number;
  words_learned: number;
  pronunciation_score_avg: number;
  streak_days: number;
  weekly_minutes: number;
  phrase_practice_avg: number;
  phrase_attempts: { day?: number; phrase?: string; score: number; passed: boolean }[];
  strengths: string[];
  weaknesses: string[];
  improvement_tips: string[];
  recent_session_reviews: {
    summary_native?: string;
    summary_target?: string;
    strengths?: string[];
    weaknesses?: string[];
    improvement_tips?: string[];
    target_usage_percent?: number;
  }[];
}

interface Lesson {
  id: string;
  day: number;
  week: number;
  title: string;
  theme: string;
  content: Record<string, unknown>;
  completed: boolean;
  score: number;
}

function ProgressSkeleton() {
  return (
    <AppShell>
      <div className="flex items-center gap-3 mb-6 animate-pulse">
        <div className="h-10 w-64 bg-border-subtle rounded" />
        <div className="h-8 w-32 bg-border-subtle rounded-full" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-card h-24 animate-pulse bg-border-subtle" />
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl p-6 shadow-card h-96 animate-pulse bg-border-subtle" />
    </AppShell>
  );
}

function Progress() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = UserSession.getId();
        const [p, l] = await Promise.all([
          getProgress(userId),
          getLessons(userId),
        ]);
        setProgress(p);
        setLessons(l);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load progress";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <ProgressSkeleton />;
  }

  if (error || !progress) {
    return (
      <AppShell>
        <div className="bg-white rounded-2xl p-6 shadow-card text-center">
          <h1 className="text-2xl font-bold text-heading mb-4">Error Loading Progress</h1>
          <p className="text-body">{error || "Could not load progress data"}</p>
        </div>
      </AppShell>
    );
  }

  // Prepare lesson progress data for chart
  const lessonChartData = lessons.map((l) => ({
    name: `Day ${l.day}`,
    score: l.score || 0,
  }));

  const targetLang = UserSession.getTargetLang();
  const sorted = [...lessons].sort((a, b) => a.day - b.day);
  const currentDay = sorted.find((l) => !l.completed)?.day ?? 1;

  return (
    <AppShell>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-extrabold text-heading">Your Progress</h1>
        <span className="px-3 py-1 rounded-full bg-purple-brand/15 text-purple-brand text-xs font-semibold">🧬 DNA Active</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Flame className="w-7 h-7 text-amber-brand" />} value={`${progress.streak_days}`} label="Day Streak" color="text-amber-brand" />
        <StatCard
          icon={<span className="text-3xl">{getLangFlag(targetLang)}</span>}
          value={`${progress.words_learned}`}
          label={`${capitalizeLang(targetLang)} words practiced`}
          color="text-brand"
        />
        <StatCard icon={<span className="text-3xl">🎤</span>} value={`${progress.pronunciation_score_avg}%`} label="Avg Pronunciation" color="text-purple-brand" />
        <StatCard icon={<span className="text-3xl">⏱️</span>} value={`${progress.weekly_minutes}m`} label="This Week" color="text-amber-brand" />
        <StatCard icon={<span className="text-3xl">💬</span>} value={`${progress.sessions_completed}`} label="Conversations" color="text-brand" />
        <StatCard icon={<span className="text-3xl">✅</span>} value={`${progress.lessons_completed}/${progress.lessons_total}`} label="Lessons" color="text-success" />
      </div>

      {/* Lesson Progress List */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-card">
        <h3 className="font-bold text-heading mb-4">Lesson Progress</h3>
        <div className="space-y-3">
          {sorted.map((lesson) => {
            const isCompleted = lesson.completed;
            const isCurrent = !lesson.completed && lesson.day === currentDay;
            const unlocked = isLessonUnlocked(lesson.day, sorted);
            const progressPercent = isCompleted ? lesson.score || 100 : isCurrent ? 50 : 0;

            return (
              <div key={lesson.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className="font-semibold text-heading text-sm">
                      Day {lesson.day}: {lesson.title} {lesson.theme}
                    </div>
                    <div className="text-xs text-muted-ink">Week {lesson.week}</div>
                  </div>
                  {isCompleted && (
                    <span className="px-3 py-1 rounded-full bg-success/15 text-success text-sm font-semibold">
                      {lesson.score}%
                    </span>
                  )}
                  {isCurrent && (
                    <span className="px-3 py-1 rounded-full bg-amber-brand/15 text-amber-brand text-sm font-semibold">
                      In Progress
                    </span>
                  )}
                  {!isCompleted && !isCurrent && (
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm font-semibold">
                      {unlocked ? "Available" : "Locked"}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted ? "bg-success" : isCurrent ? "bg-amber-brand" : "bg-gray-300"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & weaknesses */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-heading mb-3">💪 Your Strengths</h3>
          <ul className="space-y-2 text-sm text-body">
            {(progress.strengths || []).map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-success">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-heading mb-3">🎯 Areas to Improve</h3>
          <ul className="space-y-2 text-sm text-body">
            {(progress.weaknesses || []).map((w) => (
              <li key={w} className="flex gap-2">
                <span className="text-amber-brand">→</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 bg-brand-tint rounded-2xl p-6 border border-brand/20">
        <h3 className="font-bold text-heading mb-3">📋 How to Improve</h3>
        <ul className="space-y-2 text-sm text-body">
          {(progress.improvement_tips || []).map((t) => (
            <li key={t}>• {t}</li>
          ))}
        </ul>
      </div>

      {/* Phrase pronunciation scores */}
      {(progress.phrase_attempts?.length ?? 0) > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-heading mb-1">
            🎤 Phrase Pronunciation — {capitalizeLang(targetLang)}
          </h3>
          <p className="text-sm text-muted-ink mb-4">
            Average score: <strong>{progress.phrase_practice_avg}%</strong>
          </p>
          <div className="space-y-2">
            {progress.phrase_attempts.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 text-sm border-b border-border-subtle pb-2"
              >
                <span className="truncate flex-1">
                  Day {a.day}: {a.phrase}
                </span>
                <span
                  className={`font-bold shrink-0 ${a.passed ? "text-success" : "text-amber-brand"}`}
                >
                  {Math.round(a.score)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session reviews */}
      {(progress.recent_session_reviews?.length ?? 0) > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="font-bold text-heading">💬 Conversation Reviews</h3>
          {progress.recent_session_reviews.map((review, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-card space-y-3">
              {review.summary_native && (
                <div>
                  <div className="text-xs text-muted-ink mb-1">{capitalizeLang(UserSession.getNativeLang())}</div>
                  <p className="text-sm text-body">{review.summary_native}</p>
                </div>
              )}
              {review.summary_target && (
                <div>
                  <div className="text-xs text-muted-ink mb-1">{capitalizeLang(targetLang)}</div>
                  <p className="text-sm text-body font-medium">{review.summary_target}</p>
                </div>
              )}
              {review.target_usage_percent != null && (
                <p className="text-xs text-brand font-semibold">
                  You used {capitalizeLang(targetLang)} ~{review.target_usage_percent}% of the time
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Score Chart */}
      {lessonChartData.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-heading mb-4">Score Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lessonChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#7A9E94" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#7A9E94" }} />
                <Tooltip />
                <Bar dataKey="score" fill="#0F6E56" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card">
      <div className="mb-2">{icon}</div>
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-muted-ink">{label}</div>
    </div>
  );
}
