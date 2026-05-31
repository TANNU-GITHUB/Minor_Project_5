import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart, ChevronDown } from "lucide-react";
import { getLesson, getLessons, completeLesson, UserSession } from "@/lib/api";
import { requireAppAccess } from "@/lib/guards";
import { capitalizeLang, getLangFlag, isLessonUnlocked } from "@/lib/languages";
import { PhrasePracticeCard } from "@/components/PhrasePracticeCard";
import { toast } from "sonner";

export const Route = createFileRoute("/lesson/$day")({
  head: () => ({ meta: [{ title: "Lesson — TongueBridge" }] }),
  beforeLoad: requireAppAccess,
  component: Lesson,
});

interface LessonData {
  id: string;
  day: number;
  week: number;
  title: string;
  theme: string;
  content: {
    title?: string;
    theme?: string;
    phrases?: Array<{
      target: string;
      native: string;
      pronunciation: string;
    }>;
    grammar_tip?: string;
    cultural_note?: string;
    practice_prompt?: string;
  };
  completed: boolean;
  score: number;
}

function LessonSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-border-subtle z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 bg-border-subtle rounded" />
          <div className="flex-1">
            <div className="h-4 w-64 bg-border-subtle rounded mb-2" />
            <div className="h-2 w-32 bg-border-subtle rounded" />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="h-6 w-96 bg-border-subtle rounded mx-auto mb-8 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-border-subtle rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Lesson() {
  const { day: lessonId } = useParams({ from: "/lesson/$day" });
  const nav = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [showCulture, setShowCulture] = useState(false);
  const [phraseScores, setPhraseScores] = useState<Record<number, { score: number; passed: boolean }>>({});

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const userId = UserSession.getId();
        const allLessons = await getLessons(userId);
        const data = await getLesson(lessonId);
        const lessonData = data as LessonData;

        if (!isLessonUnlocked(lessonData.day, allLessons)) {
          toast.error("Complete the previous day first!");
          nav({ to: "/dashboard" });
          return;
        }

        const content = lessonData.content || {};
        const existing = (content.phrase_scores as Array<{ phrase_index: number; score: number; passed: boolean }>) || [];
        const map: Record<number, { score: number; passed: boolean }> = {};
        existing.forEach((s) => {
          map[s.phrase_index] = { score: s.score, passed: s.passed };
        });
        setPhraseScores(map);
        setLesson(lessonData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load lesson";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    void fetchLesson();
  }, [lessonId, nav]);

  if (loading) {
    return <LessonSkeleton />;
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b border-border-subtle z-10">
          <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
            <Link to="/dashboard" className="p-1">
              <ArrowLeft className="w-5 h-5 text-body" />
            </Link>
            <div className="flex-1">
              <div className="text-sm font-semibold text-heading">Error Loading Lesson</div>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-5 py-8 text-center">
          <p className="text-body mb-4">{error || "Could not load lesson"}</p>
          <Link to="/dashboard" className="inline-block px-6 py-3 rounded-full bg-brand text-white font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const targetLang = UserSession.getTargetLang();
  const nativeLang = UserSession.getNativeLang();
  const contentTitle = lesson.content.title || lesson.title;
  const contentTheme = lesson.content.theme || lesson.theme;
  const phrases = lesson.content.phrases || [];
  const grammarTip = lesson.content.grammar_tip;
  const culturalNote = lesson.content.cultural_note;
  const practicePrompt = lesson.content.practice_prompt;
  const phrasesDone = phrases.filter((_, i) => phraseScores[i]?.passed).length;
  const allPhrasesPassed = phrases.length > 0 && phrasesDone >= phrases.length;

  const handleCompleteLesson = async () => {
    if (!allPhrasesPassed) {
      toast.error("Practice and pass all phrases with the microphone first 🎤");
      return;
    }
    try {
      setCompleting(true);
      const avg =
        Object.values(phraseScores).reduce((a, s) => a + s.score, 0) /
        Object.values(phraseScores).length;
      await completeLesson(lessonId, avg);
      nav({ to: "/conversation" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete lesson");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-border-subtle z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link to="/dashboard" className="p-1">
            <ArrowLeft className="w-5 h-5 text-body" />
          </Link>
          <div className="flex-1">
            <div className="text-sm font-semibold text-heading">Day {lesson.day}: {contentTitle}</div>
            <div className="h-1.5 bg-border-subtle rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${(lesson.day / 7) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 text-coral font-semibold">
            <Heart className="w-4 h-4 fill-coral" /> 5
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        <h2 className="text-2xl font-bold text-heading text-center mb-2">
          Day {lesson.day}: {contentTitle} {getLangFlag(targetLang)}
        </h2>
        <p className="text-center text-muted-ink mb-6">
          {contentTheme} · {capitalizeLang(targetLang)} lesson
        </p>

        {/* Phrase Cards */}
        {phrases.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-heading mb-1">
              Phrases to Master — {capitalizeLang(targetLang)} {getLangFlag(targetLang)}
            </h3>
            <p className="text-sm text-muted-ink mb-4">
              Listen slowly, then tap <strong>Say it</strong> — we&apos;ll score your pronunciation (
              {phrasesDone}/{phrases.length} passed)
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {phrases.map((phrase, idx) => (
                <PhrasePracticeCard
                  key={idx}
                  lessonId={lessonId}
                  phraseIndex={idx}
                  phrase={phrase}
                  nativeLang={nativeLang}
                  targetLang={targetLang}
                  existingScore={phraseScores[idx]}
                  onScored={(r) =>
                    setPhraseScores((prev) => ({
                      ...prev,
                      [idx]: { score: r.score, passed: r.passed },
                    }))
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="mt-8 space-y-3">
          {grammarTip && (
            <Accordion title="💡 Grammar Tip" open={showGrammar} onClick={() => setShowGrammar(!showGrammar)}>
              {grammarTip}
            </Accordion>
          )}
          {culturalNote && (
            <Accordion title="🌍 Cultural Note" open={showCulture} onClick={() => setShowCulture(!showCulture)}>
              {culturalNote}
            </Accordion>
          )}
          {practicePrompt && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
              <div className="font-semibold text-green-900 mb-1">🎯 Today's Challenge</div>
              <div className="text-sm text-green-800">{practicePrompt}</div>
            </div>
          )}
        </div>

        {/* Complete Button */}
        <button
          type="button"
          onClick={handleCompleteLesson}
          disabled={completing || !allPhrasesPassed}
          className="mt-10 w-full px-6 py-3.5 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {completing
            ? "Starting chat…"
            : allPhrasesPassed
              ? "Start Conversation Practice 💬 →"
              : `Pass all phrases to continue (${phrasesDone}/${phrases.length})`}
        </button>
      </div>
    </div>
  );
}

function Accordion({ title, open, onClick, children }: { title: string; open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-mint rounded-2xl overflow-hidden">
      <button onClick={onClick} className="w-full p-4 flex items-center justify-between text-left hover:bg-white/50 transition">
        <span className="font-semibold text-heading">{title}</span>
        <ChevronDown className={`w-4 h-4 text-body transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-body">{children}</div>}
    </div>
  );
}
