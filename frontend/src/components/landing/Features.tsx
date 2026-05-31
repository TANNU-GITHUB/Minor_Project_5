import { motion } from "framer-motion";

const FEATURES = [
  { icon: "🧬", title: "Language DNA Analysis", desc: "Speak for 3 minutes. Our AI maps your vocabulary richness, humor style, sentence complexity, and cultural personality. Your teaching style is completely unique." },
  { icon: "🎯", title: "Personalized Curriculum", desc: "7-day lesson plans built from YOUR interests. Cricket fan? You'll learn Spanish through sports commentary. Foodie? Italian through recipes." },
  { icon: "🗣️", title: "AI Conversation Partner", desc: "Practice real conversations with an AI tutor that matches your humor, pace, and style. No scripts. Just natural dialogue." },
  { icon: "🔊", title: "Native Voice Pronunciation", desc: "Hear every phrase spoken by native speakers via ElevenLabs. Press any word to hear it. Our AI scores your pronunciation in real-time." },
  { icon: "📊", title: "Progress DNA Tracker", desc: "Watch your Language DNA evolve. See your fluency score climb, vocabulary richness expand, and pronunciation accuracy improve week by week." },
  { icon: "🌍", title: "12 Languages Supported", desc: "Spanish, French, Mandarin, Japanese, German, Korean, Italian, Portuguese, Arabic, Russian, Turkish, and English — all with native voice models." },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-heading">Everything You Need to Master a Language</h2>
          <p className="mt-4 text-body text-lg">Built on Language DNA technology — the only app that teaches the way YOUR brain already works.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-card border-l-[3px] border-brand hover:shadow-elevated transition-shadow"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-heading">{f.title}</h3>
              <p className="text-sm text-body leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
