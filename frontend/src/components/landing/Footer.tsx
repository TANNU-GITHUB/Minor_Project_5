import { Logo } from "../Logo";

const COLS = [
  { title: "Product", links: ["Features","How It Works","Pricing","Languages","DNA Analysis","Roadmap"] },
  { title: "Company", links: ["About Us","Blog","Press Kit","Careers","Contact"] },
  { title: "Legal", links: ["Privacy Policy","Terms of Service","Cookie Policy","Refund Policy"] },
];

export function Footer() {
  return (
    <footer className="bg-[#0D2B22] text-white/80">
      <div className="max-w-[1280px] mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="[&_*]:!text-white"><Logo /></div>
          <p className="mt-4 text-sm text-white/60 max-w-xs">Learn any language the way YOU think.</p>
          <div className="flex gap-3 mt-5 text-lg">
            <a className="hover:text-cyan-glow">𝕏</a>
            <a className="hover:text-cyan-glow">in</a>
            <a className="hover:text-cyan-glow">◌</a>
            <a className="hover:text-cyan-glow">▶</a>
          </div>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h4 className="text-white font-semibold mb-4">{c.title}</h4>
            <ul className="space-y-2 text-sm text-white/60">
              {c.links.map((l) => <li key={l}><a className="hover:text-white transition">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 py-5 flex flex-col md:flex-row justify-between gap-3 text-xs text-white/50">
          <p>© 2025 TongueBridge. Built with ❤️ in India.</p>
          <p>Powered by Claude AI + OpenAI Whisper + ElevenLabs</p>
        </div>
      </div>
    </footer>
  );
}
