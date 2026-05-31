import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { HolographicGlobe } from "../HolographicGlobe";

const FLAGS = ["🇮🇳", "🇪🇸", "🇫🇷", "🇯🇵", "🇩🇪", "🇧🇷", "🇰🇷", "🇮🇹", "🇨🇳", "🇵🇹"];

export function Hero() {
  return (
    <section className="relative pt-28 md:pt-24 pb-16 min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-6 grid md:grid-cols-2 gap-10 items-center relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-tint text-brand text-xs font-semibold animate-pulse-slow">
            🧬 Powered by Language DNA
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-extrabold leading-[1.05] text-heading tracking-tight">
            Learn Any Language
            <br />
            The Way{" "}
            <span className="relative inline-block">
              YOU
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 120 10" preserveAspectRatio="none">
                <path d="M0 5 Q 20 0, 40 5 T 80 5 T 120 5" fill="none" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <br />
            Think
          </h1>
          <p className="mt-6 text-lg text-body max-w-xl">
            TongueBridge analyses your natural speaking style, humor, and personality — then teaches you a
            new language in your own voice. No boring textbooks. Just you, amplified.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark transition active:scale-95 shadow-card"
            >
              <span>🧬</span> Analyze My Language DNA →
            </Link>
            <button className="inline-flex items-center gap-2 px-7 py-4 rounded-full border-2 border-brand text-brand font-semibold hover:bg-brand-tint transition active:scale-95">
              <Play className="w-4 h-4 fill-brand" /> Watch Demo
            </button>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#0F6E56", "#534AB7", "#EF9F27"].map((c, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white" style={{ background: c }} />
              ))}
            </div>
            <p className="text-sm text-muted-ink">Join <span className="font-semibold text-heading">12,400+</span> learners across 40 countries</p>
          </div>
          <div className="mt-6 overflow-hidden max-w-md">
            <div className="flex gap-6 animate-marquee whitespace-nowrap text-2xl">
              {[...FLAGS, ...FLAGS].map((f, i) => <span key={i}>{f}</span>)}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative flex justify-center items-center"
        >
          <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] relative">
            <div className="absolute inset-8 md:inset-10">
              <HolographicGlobe size={typeof window !== "undefined" && window.innerWidth < 768 ? 260 : 420} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
