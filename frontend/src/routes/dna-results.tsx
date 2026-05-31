import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { UserSession, getDNA } from "@/lib/api";
import { capitalizeLang, getLangFlag } from "@/lib/languages";

export const Route = createFileRoute("/dna-results")({
  head: () => ({ meta: [{ title: "Your Language DNA — TongueBridge" }] }),
  component: DnaResults,
});

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

interface RadarDataPoint {
  axis: string;
  value: number;
}

const HUMOR_STYLE_EMOJIS: Record<string, string> = {
  sarcastic: "🎭",
  dry: "😑",
  wordplay: "🎪",
  none: "😐",
};

const HUMOR_STYLE_NAMES: Record<string, string> = {
  sarcastic: "Sarcastic Wit",
  dry: "Dry Humor",
  wordplay: "Wordplay Master",
  none: "Straightforward",
};

function color(v: number) {
  if (v < 5) return "#EF9F27";
  if (v < 8) return "#0F6E56";
  return "#22C55E";
}

function DNALoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-5 md:p-10 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="h-4 w-20 bg-border-subtle rounded mb-6" />
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="h-10 w-64 bg-border-subtle rounded" />
          <div className="h-8 w-32 bg-border-subtle rounded-full" />
        </div>
        <div className="h-4 w-96 bg-border-subtle rounded mt-4" />
        
        <div className="mt-6 bg-white rounded-2xl shadow-elevated p-6 md:p-8 grid md:grid-cols-2 gap-8">
          <div className="h-80 bg-border-subtle rounded" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-32 bg-border-subtle rounded" />
                  <div className="h-4 w-12 bg-border-subtle rounded" />
                </div>
                <div className="h-2 w-full bg-border-subtle rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DnaResults() {
  const [dna, setDna] = useState<DNAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    UserSession.setOnboardingComplete(true);
    const fetchDNA = async () => {
      try {
        // Try to get DNA from localStorage first
        const localDNA = UserSession.getDNA();
        if (localDNA) {
          setDna(localDNA as DNAData);
          setLoading(false);
          return;
        }

        // If not in localStorage, fetch from backend
        const userId = UserSession.getId();
        const fetchedDNA = await getDNA(userId);
        setDna(fetchedDNA as DNAData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load DNA data";
        setError(errorMsg);
        toast.error(`Could not load DNA data: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDNA();
  }, []);

  if (loading) {
    return <DNALoadingSkeleton />;
  }

  const handleReanalyze = () => {
    localStorage.removeItem("tb_dna");
    localStorage.removeItem("tb_user_id");
    localStorage.removeItem("tb_native_lang");
    localStorage.removeItem("tb_target_lang");
    nav({ to: "/onboarding" });
  };

  if (error || !dna) {
    return (
      <div className="min-h-screen bg-background p-5 md:p-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-heading mb-4">Error Loading DNA</h1>
          <p className="text-body mb-6">{error || "Could not load DNA data"}</p>
          <Link to="/onboarding" className="inline-block px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark">
            Start Over
          </Link>
        </div>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData: RadarDataPoint[] = [
    { axis: "Vocabulary", value: dna.vocabulary_richness },
    { axis: "Formality", value: dna.formality_level },
    { axis: "Complexity", value: dna.sentence_complexity },
    { axis: "Fluency", value: dna.fluency_score },
    { axis: "Cultural", value: dna.cultural_richness },
    { axis: "Humor", value: dna.humor_style === "none" ? 2 : 8 },
  ];

  // Get humor style display
  const humourStyleName = HUMOR_STYLE_NAMES[dna.humor_style.toLowerCase()] || "Unique Humor";
  const humourStyleEmoji = HUMOR_STYLE_EMOJIS[dna.humor_style.toLowerCase()] || "😊";

  // Prepare traits for scoring display
  const TRAITS = [
    { key: "vocabulary_richness" as const, label: "Vocabulary Richness", value: dna.vocabulary_richness },
    { key: "formality_level" as const, label: "Formality Level", value: dna.formality_level },
    { key: "sentence_complexity" as const, label: "Sentence Complexity", value: dna.sentence_complexity },
    { key: "fluency_score" as const, label: "Fluency Score", value: dna.fluency_score },
    { key: "cultural_richness" as const, label: "Cultural Richness", value: dna.cultural_richness },
  ];

  return (
    <div className="min-h-screen bg-background p-5 md:p-10">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-body hover:text-brand">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-4xl font-extrabold text-heading">Your Language DNA</h1>
          <span className="px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-semibold">Analysis Complete ✅</span>
        </div>
        <p className="text-body mt-2">Here's how your mind works with language:</p>

        <div className="mt-6 bg-white rounded-2xl shadow-elevated p-6 md:p-8 grid md:grid-cols-2 gap-8">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#DFF0EA" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#0D2B22", fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                <Radar name="You" dataKey="value" stroke="#534AB7" fill="url(#dnaGrad)" fillOpacity={0.7} />
                <defs>
                  <linearGradient id="dnaGrad" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#534AB7" />
                    <stop offset="100%" stopColor="#0F6E56" />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {TRAITS.map((t) => (
              <div key={t.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-body">{t.label}</span>
                  <span className="font-bold text-heading">{t.value.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${t.value * 10}%`, background: color(t.value) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <div className="text-xs text-muted-ink uppercase tracking-wide">Your Humor Style</div>
            <span className="inline-block mt-2 px-3 py-1.5 rounded-full bg-purple-brand text-white text-sm font-semibold">{humourStyleEmoji} {humourStyleName}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <div className="text-xs text-muted-ink uppercase tracking-wide">Formality Vibe</div>
            <span className="inline-block mt-2 px-3 py-1.5 rounded-full bg-amber-brand text-[#0D2B22] text-sm font-semibold">{dna.formality_level < 5 ? "😎 Casual & Direct" : dna.formality_level < 8 ? "🤝 Balanced" : "🎩 Formal & Measured"}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <div className="text-xs text-muted-ink uppercase tracking-wide">Teaching Approach</div>
            <p className="mt-2 text-sm italic text-body">"{dna.teaching_persona}"</p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl p-6 shadow-card">
          <div className="text-sm font-semibold text-heading mb-3">Topics You Love</div>
          <div className="flex flex-wrap gap-2">
            {dna.favorite_topics.map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full bg-white border border-brand text-brand text-sm font-medium">{t}</span>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl p-6 shadow-card">
          <div className="text-sm font-semibold text-heading mb-3">Communication Patterns</div>
          <ul className="space-y-2 text-body text-sm">
            {dna.communication_patterns.map((pattern) => (
              <li key={pattern}>• {pattern}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/dashboard" className="px-6 py-4 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark active:scale-95 transition text-center">
            Build My Personalized Curriculum →
          </Link>
          <button
            onClick={handleReanalyze}
            className="px-6 py-4 rounded-full bg-white border-2 border-brand text-brand font-semibold hover:bg-brand-tint active:scale-95 transition"
          >
            Re-analyze
          </button>
        </div>
        <p className="text-center text-xs text-muted-ink mt-2">Your 7-day lesson plan will be ready in seconds</p>
      </div>
    </div>
  );
}
