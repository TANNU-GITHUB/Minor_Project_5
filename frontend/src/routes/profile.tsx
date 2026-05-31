import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireAppAccess } from "@/lib/guards";
import { AppShell } from "@/components/AppShell";
import { UserSession, createCheckout, getDNA, getProgress } from "@/lib/api";
import { capitalizeLang, getLangFlag } from "@/lib/languages";
import { getUserInitials } from "@/lib/userDisplay";
import { Link } from "@tanstack/react-router";
import { Pencil, ChevronDown, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — TongueBridge" }] }),
  beforeLoad: requireAppAccess,
  component: Profile,
});

const SECTIONS = [
  { title: "Learning Preferences", body: "prefs" },
  { title: "Voice & Audio", body: "voice" },
  { title: "Account", body: "account" },
  { title: "Subscription", body: "sub" },
] as const;

const LANG_OPTIONS = [
  "Hindi",
  "Tamil",
  "Bengali",
  "Punjabi",
  "English",
  "Spanish",
  "French",
  "Mandarin",
] as const;

type LangOption = (typeof LANG_OPTIONS)[number];

interface DNAData {
  vocabulary_richness: number;
  formality_level: number;
  humor_style: string;
  sentence_complexity: number;
  fluency_score: number;
  cultural_richness: number;
  favorite_topics: string[];
  communication_patterns: string[];
  teaching_persona: string;
}

const HUMOR_STYLE_NAMES: Record<string, string> = {
  sarcastic: "Sarcastic Wit",
  dry: "Dry Humor",
  wordplay: "Wordplay Master",
  none: "Straightforward",
};

function capitalize(lang: string): string {
  if (!lang) return "";
  return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
}

function matchLangOption(stored: string): LangOption {
  const normalized = capitalize(stored);
  return LANG_OPTIONS.includes(normalized as LangOption)
    ? (normalized as LangOption)
    : "Hindi";
}

function Profile() {
  const navigate = useNavigate();
  const [open, setOpen] = useState("prefs");
  const [goal, setGoal] = useState(15);
  const [userId, setUserId] = useState("");
  const [nativeLang, setNativeLang] = useState<LangOption>("Hindi");
  const [targetLang, setTargetLang] = useState<LangOption>("Spanish");
  const [dna, setDna] = useState<DNAData | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [stats, setStats] = useState({
    sessions: 0,
    words: 0,
    streak: 0,
  });

  const plan = dna !== null ? "Pro" : "Free";

  useEffect(() => {
    const id = UserSession.getId();
    setUserId(id);
    setNativeLang(matchLangOption(UserSession.getNativeLang()));
    setTargetLang(matchLangOption(UserSession.getTargetLang()));

    const loadProgress = async () => {
      try {
        const p = await getProgress(id);
        setStats({
          sessions: p.sessions_completed,
          words: p.words_learned,
          streak: p.streak_days,
        });
      } catch {
        /* optional */
      }
    };

    const loadDNA = async () => {
      const localDNA = UserSession.getDNA() as DNAData | null;
      if (localDNA) {
        setDna(localDNA);
        return;
      }
      try {
        const fetched = await getDNA(id);
        setDna(fetched);
      } catch {
        setDna(null);
      }
    };

    void loadDNA();
    void loadProgress();
  }, []);

  const avatarText = getUserInitials(UserSession.getName());
  const humorLabel =
    HUMOR_STYLE_NAMES[dna?.humor_style?.toLowerCase() ?? ""] ??
    (dna?.humor_style ? capitalize(dna.humor_style) : null);
  const topTopics = dna?.favorite_topics?.slice(0, 3) ?? [];

  const handleNativeChange = (lang: LangOption) => {
    setNativeLang(lang);
    UserSession.setLanguages(lang.toLowerCase(), targetLang.toLowerCase());
  };

  const handleTargetChange = (lang: LangOption) => {
    setTargetLang(lang);
    UserSession.setLanguages(nativeLang.toLowerCase(), lang.toLowerCase());
  };

  const handleSaveLanguages = () => {
    navigate({ to: "/onboarding" });
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { checkout_url } = await createCheckout(userId, "user@tonguebridge.in");
      window.location.href = checkout_url;
    } catch {
      setUpgrading(false);
    }
  };

  const handleSignOut = () => {
    UserSession.logout();
    navigate({ to: "/login" });
  };

  return (
    <AppShell>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold tracking-tight">
              {avatarText || "—"}
            </div>
            <button type="button" className="absolute -bottom-1 -right-1 bg-white border border-border-subtle rounded-full p-1.5 shadow">
              <Pencil className="w-3 h-3 text-body" />
            </button>
          </div>
          <h2 className="mt-4 text-xl font-bold text-heading">{UserSession.getName()}</h2>
          <p className="text-sm text-muted-ink">
            {capitalizeLang(nativeLang)} → {capitalizeLang(targetLang)} {getLangFlag(targetLang)}
          </p>
          <p className="text-xs text-body mt-2">
            Native: {capitalize(nativeLang)} · Learning: {capitalize(targetLang)}
          </p>

          {dna && (
            <div className="mt-4 space-y-2 text-left">
              {humorLabel && (
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-purple-brand text-white text-xs font-semibold">
                    {humorLabel}
                  </span>
                </div>
              )}
              {topTopics.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {topTopics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2.5 py-1 rounded-full bg-mint text-brand text-xs font-medium border border-brand/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                plan === "Pro"
                  ? "bg-amber-brand/25 text-amber-brand border border-amber-brand/40"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {plan} Plan
            </span>
            {plan === "Free" && (
              <button
                type="button"
                onClick={() => setOpen("sub")}
                className="text-xs text-brand font-semibold cursor-pointer"
              >
                Upgrade →
              </button>
            )}
          </div>
          <p className="text-xs text-muted-ink mt-2">ID ···{userId.slice(-8)}</p>
          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            <div>
              <div className="text-lg font-extrabold text-heading">{stats.sessions}</div>
              <div className="text-[10px] text-muted-ink">Sessions</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-heading">{stats.words}</div>
              <div className="text-[10px] text-muted-ink">Words</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-heading">{stats.streak}</div>
              <div className="text-[10px] text-muted-ink">Days</div>
            </div>
          </div>
          <Link
            to="/conversations"
            className="mt-4 flex items-center justify-between gap-2 w-full px-4 py-3 rounded-xl bg-mint hover:bg-brand/10 transition text-sm font-semibold text-brand"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Past tutor chats
            </span>
            <span className="text-muted-ink font-normal">View history →</span>
          </Link>
        </div>

        <div className="md:col-span-2 space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.body} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === s.body ? "" : s.body)}
                className="w-full p-5 flex items-center justify-between"
              >
                <span className="font-semibold text-heading">{s.title}</span>
                <ChevronDown className={`w-4 h-4 transition ${open === s.body ? "rotate-180" : ""}`} />
              </button>
              {open === s.body && (
                <div className="px-5 pb-5 space-y-3">
                  {s.body === "prefs" && (
                    <>
                      <Row label="Native Language">
                        <select
                          className="select"
                          value={nativeLang}
                          onChange={(e) => handleNativeChange(e.target.value as LangOption)}
                        >
                          {LANG_OPTIONS.map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      </Row>
                      <Row label="Target Language">
                        <select
                          className="select"
                          value={targetLang}
                          onChange={(e) => handleTargetChange(e.target.value as LangOption)}
                        >
                          {LANG_OPTIONS.map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      </Row>
                      <button
                        type="button"
                        onClick={handleSaveLanguages}
                        className="w-full px-4 py-2.5 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition"
                      >
                        Save & Re-analyze
                      </button>
                      <Row label="Daily Goal">
                        <div className="flex gap-2">
                          {[5, 10, 15, 30].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setGoal(m)}
                              className={`px-3 py-1.5 rounded-full text-sm ${goal === m ? "bg-brand text-white" : "bg-mint text-body"}`}
                            >
                              {m} min
                            </button>
                          ))}
                        </div>
                      </Row>
                      <Row label="Reminder Time">
                        <input type="time" defaultValue="19:00" className="select" />
                      </Row>
                    </>
                  )}
                  {s.body === "voice" && (
                    <>
                      <Row label="Voice Speed">
                        <div className="flex gap-2">
                          {["Slow", "Normal", "Fast"].map((speed, i) => (
                            <button
                              key={speed}
                              type="button"
                              className={`px-3 py-1.5 rounded-full text-sm ${i === 1 ? "bg-brand text-white" : "bg-mint text-body"}`}
                            >
                              {speed}
                            </button>
                          ))}
                        </div>
                      </Row>
                      <Row label="Auto-play pronunciation">
                        <Toggle defaultOn />
                      </Row>
                      <Row label="Microphone">
                        <span className="text-success font-semibold text-sm">✓ Allowed</span>
                      </Row>
                    </>
                  )}
                  {s.body === "account" && (
                    <>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full border border-border-subtle text-body text-sm hover:bg-mint"
                      >
                        Change Password
                      </button>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-body">Connected</span>
                        <span className="px-2 py-0.5 rounded-full bg-mint text-body text-xs">Google</span>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full border border-border-subtle text-body text-sm hover:bg-mint"
                      >
                        Export my data
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full border border-coral text-coral text-sm hover:bg-coral/10"
                      >
                        Delete Account
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 rounded-full border border-border-subtle text-body text-sm hover:bg-mint mt-1"
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                  {s.body === "sub" && (
                    <>
                      {plan === "Free" ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-base font-semibold text-heading">
                              Upgrade to Pro — ₹499/month
                            </h3>
                            <ul className="mt-3 space-y-2 text-sm text-body">
                              <li>• Unlimited sessions</li>
                              <li>• All language pairs</li>
                              <li>• Priority voice</li>
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleUpgrade()}
                            disabled={upgrading || !userId}
                            className="px-6 py-2.5 rounded-full bg-amber-brand text-[#0D2B22] text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                          >
                            {upgrading ? "Redirecting…" : "Upgrade to Pro"}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-ink">
                          You&apos;re on Pro. Manage your subscription from your billing portal.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`.select{padding:8px 12px;border-radius:12px;border:1px solid var(--border-subtle);background:white;font-size:14px;color:var(--body)}`}</style>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span className="text-sm text-body">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`w-11 h-6 rounded-full transition relative ${on ? "bg-brand" : "bg-border-subtle"}`}
    >
      <span
        className={`absolute top-0.5 ${on ? "right-0.5" : "left-0.5"} w-5 h-5 rounded-full bg-white shadow transition`}
      />
    </button>
  );
}
