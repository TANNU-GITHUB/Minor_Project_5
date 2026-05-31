export const MOCK_USER = {
  name: "Arjun Mehta",
  initials: "AM",
  email: "arjun@example.com",
  nativeLanguage: "Hindi",
  targetLanguage: "Spanish",
  targetFlag: "🇪🇸",
  plan: "Free" as "Free" | "Pro",
  streak: 5,
  wordsLearned: 47,
  sessions: 8,
  joined: "May 2025",
};

export const DNA_SCORES = {
  vocabulary_richness: 7.2,
  formality_level: 4.5,
  humor_style: 8.1,
  sentence_complexity: 6.8,
  fluency_score: 8.3,
  cultural_richness: 7.9,
};

export const DNA_RADAR = [
  { trait: "Vocabulary", you: 7.2, avg: 5.5 },
  { trait: "Formality", you: 4.5, avg: 5.5 },
  { trait: "Humor", you: 8.1, avg: 5.5 },
  { trait: "Complexity", you: 6.8, avg: 5.5 },
  { trait: "Fluency", you: 8.3, avg: 5.5 },
  { trait: "Culture", you: 7.9, avg: 5.5 },
];

export const DNA_WEEK = [
  { trait: "Vocabulary", w1: 6.0, w2: 7.2 },
  { trait: "Formality", w1: 4.2, w2: 4.5 },
  { trait: "Humor", w1: 7.7, w2: 8.1 },
  { trait: "Complexity", w1: 6.3, w2: 6.8 },
  { trait: "Fluency", w1: 7.5, w2: 8.3 },
  { trait: "Culture", w1: 7.4, w2: 7.9 },
];

export const FAVORITE_TOPICS = ["🏏 Cricket", "💻 Technology", "🍛 Food", "🎬 Bollywood", "🏙️ City Life"];

export const LANGUAGES = [
  { name: "Spanish", native: "Español", flag: "🇪🇸", speakers: "500M" },
  { name: "French", native: "Français", flag: "🇫🇷", speakers: "280M" },
  { name: "Japanese", native: "日本語", flag: "🇯🇵", speakers: "125M" },
  { name: "German", native: "Deutsch", flag: "🇩🇪", speakers: "130M" },
  { name: "Mandarin", native: "中文", flag: "🇨🇳", speakers: "1.1B" },
  { name: "Korean", native: "한국어", flag: "🇰🇷", speakers: "77M" },
  { name: "Italian", native: "Italiano", flag: "🇮🇹", speakers: "65M" },
  { name: "Portuguese", native: "Português", flag: "🇧🇷", speakers: "260M" },
  { name: "Arabic", native: "العربية", flag: "🇦🇪", speakers: "420M" },
  { name: "Russian", native: "Русский", flag: "🇷🇺", speakers: "260M" },
  { name: "Turkish", native: "Türkçe", flag: "🇹🇷", speakers: "85M" },
  { name: "English", native: "English", flag: "🇬🇧", speakers: "1.5B" },
];

export const NATIVE_LANGS = [
  { name: "Hindi", flag: "🇮🇳" },
  { name: "Tamil", flag: "🇮🇳" },
  { name: "Bengali", flag: "🇮🇳" },
  { name: "Punjabi", flag: "🇮🇳" },
  { name: "Marathi", flag: "🇮🇳" },
  { name: "Gujarati", flag: "🇮🇳" },
  { name: "English", flag: "🇬🇧" },
  { name: "Other", flag: "🌐" },
];

export const CURRICULUM = [
  { day: 1, title: "Greetings Your Way", status: "done" as const },
  { day: 2, title: "Your Interests in Spanish", status: "today" as const },
  { day: 3, title: "Food & Cricket Vocabulary", status: "locked" as const },
  { day: 4, title: "Telling Stories", status: "locked" as const },
  { day: 5, title: "Expressing Opinions", status: "locked" as const },
  { day: 6, title: "Making Plans", status: "locked" as const },
  { day: 7, title: "Full Conversation", status: "locked" as const },
];

export const PHRASES = [
  {
    target: "¿Viste el partido ayer?",
    phonetic: "bees-teh el par-TEE-doh ah-YER",
    translation: "Did you watch the match yesterday?",
  },
  {
    target: "Me encanta la tecnología.",
    phonetic: "meh en-KAN-tah lah tek-no-lo-HEE-ah",
    translation: "I love technology.",
  },
  {
    target: "¿Probaste la comida india?",
    phonetic: "pro-BAS-teh lah ko-MEE-dah EEN-dee-ah",
    translation: "Have you tried Indian food?",
  },
  {
    target: "Vamos al cine esta noche.",
    phonetic: "BAH-mos al SEE-neh es-tah NO-cheh",
    translation: "Let's go to the movies tonight.",
  },
  {
    target: "Cuéntame sobre tu día.",
    phonetic: "KWEN-tah-meh SO-breh too DEE-ah",
    translation: "Tell me about your day.",
  },
];

export const CONVERSATION = [
  { who: "ai" as const, text: "¡Hola! ¿Cómo estás? Oí que eres fan del cricket. ¿Viste el partido India vs Australia ayer?" },
  { who: "user" as const, text: "Sí, fue increíble. India ganó.", score: 87 },
  { who: "ai" as const, text: "¡Qué bueno! ¿Cuál es tu jugador favorito?" },
  { who: "user" as const, text: "Mi favorito es Virat Kohli.", score: 92 },
  { who: "ai" as const, text: "Excelente elección. ¿Juegas cricket también?" },
  { who: "user" as const, text: "A veces, los fines de semana.", score: 62 },
];

export const PRONUNCIATION_TREND = Array.from({ length: 14 }, (_, i) => ({
  date: `May ${10 + i}`,
  score: 65 + Math.round(Math.random() * 20),
}));

export const WORDS_TABLE = [
  { word: "partido", translation: "match", score: 92, date: "May 22", status: "Mastered" },
  { word: "jugador", translation: "player", score: 88, date: "May 22", status: "Mastered" },
  { word: "increíble", translation: "incredible", score: 75, date: "May 21", status: "Learning" },
  { word: "fin de semana", translation: "weekend", score: 81, date: "May 21", status: "Mastered" },
  { word: "tecnología", translation: "technology", score: 70, date: "May 20", status: "Learning" },
  { word: "comida", translation: "food", score: 95, date: "May 20", status: "Mastered" },
  { word: "película", translation: "movie", score: 68, date: "May 19", status: "Learning" },
  { word: "amigo", translation: "friend", score: 99, date: "May 18", status: "Mastered" },
];

export const ACHIEVEMENTS = [
  { icon: "🧬", name: "DNA Unlocked", unlocked: true },
  { icon: "🗣️", name: "First Conversation", unlocked: true },
  { icon: "🎯", name: "Perfect Score", unlocked: true },
  { icon: "🔥", name: "7-Day Streak", unlocked: false },
  { icon: "📚", name: "50 Words", unlocked: false },
  { icon: "🌍", name: "Globe Trotter", unlocked: false },
];

export const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    city: "Mumbai",
    initials: "PS",
    color: "#534AB7",
    text: "I tried Duolingo for 6 months and gave up. TongueBridge analyzed that I love Bollywood and cricket, then taught me Spanish through those exact topics. I was having conversations in 3 weeks.",
  },
  {
    name: "Arjun Mehta",
    city: "Delhi",
    initials: "AM",
    color: "#0F6E56",
    text: "The DNA analysis blew my mind. It figured out I use sarcastic humor and prefer short, punchy sentences. My AI tutor now matches my energy exactly. French feels natural now, not foreign.",
  },
  {
    name: "Kavya Reddy",
    city: "Hyderabad",
    initials: "KR",
    color: "#EF9F27",
    text: "I'm learning Japanese and the AI knew I love anime and street food without me telling it directly. The lessons feel like they were written just for me. My pronunciation improved 40% in a month.",
  },
];
