import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutDashboard, BookOpen, MessageSquare, TrendingUp, User, Crown } from "lucide-react";
import { Logo } from "./Logo";
import { getLessons, getProgress, UserSession } from "@/lib/api";
import { getUserInitials } from "@/lib/userDisplay";
import { capitalizeLang, getLangFlag, getCurrentLessonDay, isLessonUnlocked } from "@/lib/languages";

interface LessonItem {
  id: string;
  day: number;
  title: string;
  completed: boolean;
}

interface SidebarData {
  lessons: LessonItem[];
  streak: number;
  words: number;
  sessions: number;
  currentLessonId: string | null;
  targetLang: string;
  hasDna: boolean;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { location } = useRouterState();
  const [sidebar, setSidebar] = useState<SidebarData>({
    lessons: [],
    streak: 0,
    words: 0,
    sessions: 0,
    currentLessonId: null,
    targetLang: "spanish",
    hasDna: false,
  });

  const userId = UserSession.getId();
  const avatarText = getUserInitials(UserSession.getName());
  const targetLabel = capitalizeLang(sidebar.targetLang);
  const targetFlag = getLangFlag(sidebar.targetLang);

  useEffect(() => {
    const load = async () => {
      const targetLang = UserSession.getTargetLang();
      const hasDna = !!UserSession.getDNA();

      try {
        const [lessons, progress] = await Promise.all([
          getLessons(userId),
          getProgress(userId),
        ]);

        const current = lessons.find((l) => !l.completed) ?? lessons[0];
        setSidebar({
          lessons: lessons.map((l) => ({
            id: l.id,
            day: l.day,
            title: l.title,
            completed: l.completed,
          })),
          streak: progress.streak_days,
          words: progress.words_learned,
          sessions: progress.sessions_completed,
          currentLessonId: current?.id ?? null,
          targetLang,
          hasDna,
        });
      } catch {
        setSidebar((s) => ({ ...s, targetLang, hasDna }));
      }
    };

    void load();
  }, [userId]);

  const lessonLink = sidebar.currentLessonId
    ? `/lesson/${sidebar.currentLessonId}`
    : "/dashboard";

  const TABS = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: lessonLink, label: "Lessons", icon: BookOpen },
    { to: "/conversation", label: "Chat", icon: MessageSquare },
    { to: "/progress", label: "Progress", icon: TrendingUp },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const currentDay = getCurrentLessonDay(sidebar.lessons);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white border-b border-border-subtle">
        <div className="max-w-[1400px] mx-auto px-5 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <button type="button" className="relative p-2 rounded-full hover:bg-mint">
              <Bell className="w-5 h-5 text-body" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">
              {avatarText}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto md:flex">
        <aside className="hidden md:block w-[280px] shrink-0 border-r border-border-subtle bg-white min-h-[calc(100vh-64px)] p-5">
          <div className="bg-mint rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                {avatarText}
              </div>
              <div>
                <div className="font-semibold text-heading">Learner</div>
                <div className="text-xs text-muted-ink">
                  Learning {targetLabel} {targetFlag}
                </div>
              </div>
            </div>
            <span
              className={`inline-block mt-3 px-2 py-0.5 rounded-full text-xs font-semibold ${
                sidebar.hasDna
                  ? "bg-amber-brand/25 text-amber-brand"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {sidebar.hasDna ? "Pro" : "Free"} Plan
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-amber-brand/10 rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-amber-brand">🔥 {sidebar.streak}</div>
              <div className="text-[10px] text-muted-ink">Streak</div>
            </div>
            <div className="bg-brand-tint rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-brand">📚 {sidebar.words}</div>
              <div className="text-[10px] text-muted-ink">Words</div>
            </div>
            <div className="bg-purple-brand/10 rounded-xl p-2 text-center">
              <div className="text-lg font-bold text-purple-brand">🎯 {sidebar.sessions}</div>
              <div className="text-[10px] text-muted-ink">Sessions</div>
            </div>
          </div>

          <h4 className="text-xs uppercase tracking-wide text-muted-ink mt-6 mb-2 px-1">
            7-Day Plan
          </h4>
          <div className="space-y-1.5">
            {sidebar.lessons.length === 0 ? (
              <Link
                to="/onboarding"
                className="block rounded-full px-3 py-2 text-sm text-brand font-semibold bg-brand-tint"
              >
                🎤 Start voice analysis
              </Link>
            ) : (
              sidebar.lessons.map((d) => {
                const isToday = d.day === currentDay && !d.completed;
                const isDone = d.completed;
                const unlocked = isLessonUnlocked(d.day, sidebar.lessons);
                const rowClass = isToday
                  ? "bg-brand-tint text-brand font-semibold border-l-4 border-brand"
                  : isDone
                    ? "text-success hover:bg-mint"
                    : unlocked
                      ? "text-body hover:bg-mint"
                      : "text-muted-ink opacity-60 cursor-not-allowed";

                if (!unlocked) {
                  return (
                    <div
                      key={d.id}
                      className={`rounded-full px-3 py-2 text-sm flex items-center gap-2 ${rowClass}`}
                    >
                      <span>🔒</span>
                      <span className="truncate">
                        Day {d.day} — {d.title}
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={d.id}
                    to="/lesson/$day"
                    params={{ day: d.id }}
                    className={`rounded-full px-3 py-2 text-sm flex items-center gap-2 ${rowClass}`}
                  >
                    <span>{isDone ? "✅" : isToday ? "🔵" : "📖"}</span>
                    <span className="truncate">
                      Day {d.day} — {d.title}
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {!sidebar.hasDna && (
            <div
              className="mt-6 rounded-2xl p-4 text-white"
              style={{ background: "linear-gradient(135deg,#0F6E56,#534AB7)" }}
            >
              <Crown className="w-5 h-5 mb-2" />
              <div className="font-bold">Upgrade to Pro</div>
              <div className="text-xs opacity-90">Unlock all 7 daily lessons</div>
            </div>
          )}

          <nav className="mt-6 space-y-1">
            {TABS.map(({ to, label, icon: Icon }) => {
              const isLessonTab = label === "Lessons";
              const tabActive = isLessonTab
                ? location.pathname.startsWith("/lesson")
                : location.pathname === to;

              return (
                <Link
                  key={label}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                    tabActive ? "bg-brand text-white" : "text-body hover:bg-mint"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-5 md:p-8 pb-24 md:pb-8">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border-subtle grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => {
          const tabActive =
            label === "Lessons"
              ? location.pathname.startsWith("/lesson")
              : location.pathname === to;
          return (
            <Link
              key={label}
              to={to}
              className={`py-2 flex flex-col items-center gap-1 text-[10px] ${
                tabActive ? "text-brand" : "text-muted-ink"
              }`}
            >
              <Icon className="w-5 h-5" /> {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
