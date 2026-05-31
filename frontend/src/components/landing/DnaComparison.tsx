const OLD = ["Same lessons for everyone","Random vocabulary lists","Robotic AI voices","No personality matching","Generic grammar rules","You adapt to the app"];
const NEW = ["Lessons built from your personality","Vocabulary from YOUR interests","Native voices via ElevenLabs","AI tutor that matches YOUR style","Grammar taught through your examples","The app adapts to YOU"];

export function DnaComparison() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 relative">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-muted-ink mb-6">Traditional Apps</h3>
            <ul className="space-y-3">
              {OLD.map((t) => (
                <li key={t} className="flex items-center gap-3 text-body">
                  <span className="text-coral">❌</span> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-brand-tint to-white rounded-2xl p-8 border-2 border-brand/20">
            <h3 className="text-2xl font-bold text-brand mb-6">TongueBridge</h3>
            <ul className="space-y-3">
              {NEW.map((t) => (
                <li key={t} className="flex items-center gap-3 text-heading font-medium">
                  <span className="text-success">✅</span> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 items-center">
            <div className="w-px h-full bg-gradient-to-b from-transparent via-brand/40 to-transparent" />
            <div className="absolute bg-white rounded-full p-3 shadow-elevated">
              <span className="text-2xl">🧬</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
