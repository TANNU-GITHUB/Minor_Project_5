import { TESTIMONIALS } from "@/lib/mock-data";

export function Testimonials() {
  return (
    <section className="py-24 bg-mint">
      <div className="max-w-[1280px] mx-auto px-6">
        <h2 className="text-center text-4xl md:text-5xl font-extrabold text-heading mb-12">What Learners Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-6 shadow-card border-t-[3px] border-brand">
              <div className="flex gap-1 text-amber-brand text-lg mb-3">★★★★★</div>
              <p className="text-body text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: t.color }}>{t.initials}</div>
                <div>
                  <div className="font-semibold text-heading text-sm">{t.name}</div>
                  <div className="text-xs text-muted-ink">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
