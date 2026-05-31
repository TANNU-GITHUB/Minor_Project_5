import { Mic, Dna, GraduationCap } from "lucide-react";

const STEPS = [
  { n: 1, icon: Mic, title: "Speak Naturally", desc: "Record yourself talking for 3-5 minutes in your native language. Talk about your day, your interests, anything. Our AI listens for patterns, not content.", mock: "waveform" },
  { n: 2, icon: Dna, title: "Get Your Language DNA", desc: "Within 60 seconds, you receive a full DNA profile: vocabulary richness, humor style, formality, favorite topics, cultural references. Visualized as a radar chart.", mock: "radar" },
  { n: 3, icon: GraduationCap, title: "Learn Your Way", desc: "Your personalized lesson plan appears immediately. Every phrase, every cultural note, every conversation scenario is tailored to YOU.", mock: "card" },
];

function MockVisual({ kind }: { kind: string }) {
  if (kind === "waveform") {
    return (
      <div className="bg-[#0a1f18] rounded-xl p-4 flex items-end justify-center gap-1 h-24">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-brand rounded-full"
            style={{
              height: `${20 + Math.sin(i) * 40 + Math.random() * 30}%`,
              animation: `wave 1s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    );
  }
  if (kind === "radar") {
    return (
      <div className="bg-white/5 rounded-xl p-3 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full">
          <polygon points="50,10 85,35 75,80 25,80 15,35" fill="none" stroke="rgba(255,255,255,0.2)" />
          <polygon points="50,20 75,40 68,72 32,72 25,40" fill="url(#g1)" stroke="#534AB7" />
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#534AB7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0F6E56" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl p-3 h-24 text-left">
      <div className="text-[10px] text-muted-ink">Day 2 · Spanish</div>
      <div className="text-sm font-bold text-heading mt-1">¿Viste el partido?</div>
      <div className="text-[10px] text-brand mt-2">▶ Listen</div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-[#0D2B22] text-white">
      <div className="max-w-[1280px] mx-auto px-6">
        <h2 className="text-center text-4xl md:text-5xl font-extrabold text-white">From Stranger to Speaker in 3 Steps</h2>
        <div className="mt-16 grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px border-t-2 border-dashed border-white/15" />
          {STEPS.map(({ n, icon: Icon, title, desc, mock }) => (
            <div key={n} className="relative text-center">
              <div
                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg,#0F6E56,#534AB7)", boxShadow: "0 8px 32px rgba(83,74,183,0.35)" }}
              >
                <Icon className="w-8 h-8 text-white" />
                <span className="absolute -mt-16 -ml-12 bg-amber-brand text-[#0D2B22] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{n}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{desc}</p>
              <div className="mt-5"><MockVisual kind={mock} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
