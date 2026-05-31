import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Loader, X } from "lucide-react";

interface PricingProps {
  onUpgrade?: () => void | Promise<void>;
  loading?: boolean;
}

export function Pricing({ onUpgrade, loading = false }: PricingProps) {
  const [annual, setAnnual] = useState(false);
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-heading">Simple, Honest Pricing</h2>
          <p className="mt-3 text-body">Start free. Upgrade when you're ready.</p>
          <div className="mt-6 inline-flex items-center gap-1 bg-brand-tint rounded-full p-1">
            <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-full text-sm font-medium ${!annual ? "bg-white shadow text-brand" : "text-muted-ink"}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${annual ? "bg-white shadow text-brand" : "text-muted-ink"}`}>
              Annually <span className="text-[10px] bg-amber-brand text-white px-2 py-0.5 rounded-full">20% OFF</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-card">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-tint text-brand text-xs font-semibold">Free Forever</span>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-5xl font-extrabold text-heading">₹0</span><span className="text-muted-ink mb-2">/ month</span>
            </div>
            <p className="text-sm text-muted-ink">No credit card needed</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["1 Language DNA analysis per day","10 minutes of AI conversation daily","3 lesson modules per week","Pronunciation scoring","Basic progress tracking"].map((t) => (
                <li key={t} className="flex gap-2 text-body"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" />{t}</li>
              ))}
              {["Unlimited conversations","Advanced DNA analytics","Priority voice quality"].map((t) => (
                <li key={t} className="flex gap-2 text-muted-ink"><X className="w-4 h-4 shrink-0 mt-0.5" />{t}</li>
              ))}
            </ul>
            <Link to="/signup" className="mt-8 block text-center px-6 py-3 rounded-full border-2 border-brand text-brand font-semibold hover:bg-brand-tint">Start Free</Link>
          </div>

          <div className="rounded-2xl p-8 shadow-elevated text-white relative" style={{ background: "linear-gradient(135deg,#0F6E56,#0A4D3C)" }}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-brand text-[#0D2B22] text-xs font-bold">⭐ Most Popular</span>
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold">Pro</span>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-5xl font-extrabold">₹{annual ? 399 : 499}</span><span className="opacity-80 mb-2">/ month</span>
            </div>
            <p className="text-sm opacity-80">Cancel anytime</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Unlimited Language DNA analyses","Unlimited AI conversations","All 7 daily lessons unlocked","Advanced pronunciation AI scoring","Full DNA evolution tracker","Priority ElevenLabs voice quality","12 languages (all unlocked)","Export your progress report"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="w-4 h-4 shrink-0 mt-0.5" />{t}</li>
              ))}
            </ul>
            {onUpgrade ? (
              <button
                type="button"
                onClick={() => void onUpgrade()}
                disabled={loading}
                className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-brand font-semibold hover:bg-brand-tint disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? "Redirecting…" : "Start 7-Day Free Trial"}
              </button>
            ) : (
              <Link to="/signup" className="mt-8 block text-center px-6 py-3 rounded-full bg-white text-brand font-semibold hover:bg-brand-tint">
                Start 7-Day Free Trial
              </Link>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-muted-ink mt-6">🔒 Secured by Stripe. Cancel any time. No questions asked.</p>
      </div>
    </section>
  );
}
