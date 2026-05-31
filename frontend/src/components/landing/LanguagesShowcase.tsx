import { LANGUAGES } from "@/lib/mock-data";

export function LanguagesShowcase() {
  return (
    <section id="languages" className="py-24 bg-background">
      <div className="max-w-[1280px] mx-auto px-6">
        <h2 className="text-center text-4xl md:text-5xl font-extrabold text-heading">12 Languages. One Method. Your Way.</h2>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-5">
          {LANGUAGES.map((l) => (
            <div key={l.name} className="bg-white rounded-2xl p-6 text-center shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all">
              <div className="text-5xl mb-2">{l.flag}</div>
              <div className="text-lg font-bold text-heading">{l.name}</div>
              <div className="text-xs text-muted-ink">{l.native}</div>
              <div className="text-xs text-body mt-2">{l.speakers} speakers</div>
              <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-semibold bg-brand-tint text-brand">Available</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
