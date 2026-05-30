"""Sample DNA + curriculum for local dev when AI APIs are unavailable."""

MOCK_TRANSCRIPT = (
    "I love talking about cricket and Bollywood movies with my friends. "
    "We usually mix Hindi and English. "
    "I want to learn Spanish so I can travel and order food confidently."
)

DAY_THEMES = [
    "greetings",
    "food",
    "travel",
    "family",
    "hobbies",
    "shopping",
    "review",
]

# Per-target sample phrases (target = learning language only)
TARGET_PHRASE_BANK: dict[str, list[dict]] = {
    "spanish": [
        {"target": "¡Hola!", "native": "Hello", "pronunciation": "OH-lah"},
        {"target": "¿Qué tal?", "native": "How are you?", "pronunciation": "kay TAHL"},
        {"target": "Mucho gusto", "native": "Nice to meet you", "pronunciation": "MOO-choh GOOS-toh"},
        {"target": "Me llamo…", "native": "My name is…", "pronunciation": "may YAH-moh"},
        {"target": "¿Dónde está…?", "native": "Where is…?", "pronunciation": "DON-day es-TAH"},
        {"target": "La cuenta, por favor", "native": "The bill, please", "pronunciation": "lah KWEN-tah por fah-VOR"},
        {"target": "¡Qué golazo!", "native": "What a goal!", "pronunciation": "kay go-LAH-so"},
    ],
    "french": [
        {"target": "Bonjour!", "native": "Hello", "pronunciation": "bon-ZHOOR"},
        {"target": "Comment ça va?", "native": "How are you?", "pronunciation": "koh-mahn sa VA"},
        {"target": "Enchanté", "native": "Nice to meet you", "pronunciation": "ahn-shahn-TAY"},
        {"target": "Je m'appelle…", "native": "My name is…", "pronunciation": "zhuh mah-PELL"},
        {"target": "Où est…?", "native": "Where is…?", "pronunciation": "oo ay"},
        {"target": "L'addition, s'il vous plaît", "native": "The bill, please", "pronunciation": "lah-dee-SYOHN seel voo PLAY"},
        {"target": "C'est magnifique!", "native": "It's wonderful!", "pronunciation": "say mahn-yee-FEEK"},
    ],
    "english": [
        {"target": "Hello!", "native": "Hello", "pronunciation": "heh-LOH"},
        {"target": "How are you?", "native": "How are you?", "pronunciation": "how ar YOO"},
        {"target": "Nice to meet you", "native": "Nice to meet you", "pronunciation": "nice tuh MEET yoo"},
        {"target": "My name is…", "native": "My name is…", "pronunciation": "my name iz"},
        {"target": "Where is…?", "native": "Where is…?", "pronunciation": "wair iz"},
        {"target": "Check, please", "native": "The bill, please", "pronunciation": "chek PLEEZ"},
        {"target": "That's amazing!", "native": "That's amazing!", "pronunciation": "thats ah-MAY-zing"},
    ],
    "mandarin": [
        {"target": "你好!", "native": "Hello", "pronunciation": "nee-HOW"},
        {"target": "你好吗?", "native": "How are you?", "pronunciation": "nee-HOW-ma"},
        {"target": "很高兴认识你", "native": "Nice to meet you", "pronunciation": "hen gao-SING ren-SHI nee"},
        {"target": "我叫…", "native": "My name is…", "pronunciation": "wo jiao"},
        {"target": "…在哪里?", "native": "Where is…?", "pronunciation": "zai NAH-lee"},
        {"target": "买单", "native": "The bill, please", "pronunciation": "mai-DAHN"},
        {"target": "太棒了!", "native": "That's great!", "pronunciation": "tai BAHNG le"},
    ],
    "hindi": [
        {"target": "नमस्ते!", "native": "Hello", "pronunciation": "nam-ah-STAY"},
        {"target": "आप कैसे हैं?", "native": "How are you?", "pronunciation": "aap KAY-say hain"},
        {"target": "आप से मिलकर खुशी हुई", "native": "Nice to meet you", "pronunciation": "aap say mil-KAR KHOO-shee hoo-EE"},
        {"target": "मेरा नाम… है", "native": "My name is…", "pronunciation": "MAY-ra naam hai"},
        {"target": "…कहाँ है?", "native": "Where is…?", "pronunciation": "kahaan hai"},
        {"target": "बिल लाइए", "native": "The bill, please", "pronunciation": "bill LAI-yeh"},
        {"target": "बहुत बढ़िया!", "native": "Very good!", "pronunciation": "bah-HOOT BAH-dee-yah"},
    ],
    "tamil": [
        {"target": "வணக்கம்!", "native": "Hello", "pronunciation": "van-ak-KAM"},
        {"target": "எப்படி இருக்கிறீர்கள்?", "native": "How are you?", "pronunciation": "ep-PADI i-ruk-ki-REENG-gal"},
        {"target": "சந்தித்ததில் மகிழ்ச்சி", "native": "Nice to meet you", "pronunciation": "san-dith-tha-thil ma-hil-chi"},
        {"target": "என் பெயர்…", "native": "My name is…", "pronunciation": "en PEY-ar"},
        {"target": "…எங்கே?", "native": "Where is…?", "pronunciation": "eng-GEH"},
        {"target": "பில் கொடுங்கள்", "native": "The bill, please", "pronunciation": "bill ko-DUNG-gal"},
        {"target": "அருமை!", "native": "Wonderful!", "pronunciation": "a-RU-mai"},
    ],
}


def mock_dna() -> dict:
    return {
        "vocabulary_richness": 7.2,
        "formality_level": 4.5,
        "humor_style": "wordplay",
        "sentence_complexity": 6.8,
        "fluency_score": 8.3,
        "cultural_richness": 7.9,
        "favorite_topics": ["cricket", "Bollywood", "travel", "food", "family"],
        "communication_patterns": [
            "code-switches between languages",
            "uses vivid examples",
            "asks rhetorical questions",
        ],
        "cultural_references": ["IPL", "Bollywood", "street food"],
        "teaching_persona": (
            "Learn best through real-life scenarios and humor. "
            "Use cricket and travel examples; keep lessons conversational."
        ),
    }


def mock_curriculum(native_lang: str, target_lang: str) -> list:
    key = target_lang.lower()
    bank = TARGET_PHRASE_BANK.get(key, TARGET_PHRASE_BANK["spanish"])
    titles = {
        1: f"Greetings in {target_lang.title()}",
        2: f"Food & dining in {target_lang.title()}",
        3: f"Travel phrases in {target_lang.title()}",
        4: f"Family talk in {target_lang.title()}",
        5: f"Hobbies in {target_lang.title()}",
        6: f"Shopping in {target_lang.title()}",
        7: f"Week 1 review — {target_lang.title()}",
    }

    lessons = []
    for d, theme in enumerate(DAY_THEMES, start=1):
        phrase = bank[(d - 1) % len(bank)]
        lessons.append({
            "day": d,
            "title": titles.get(d, f"Day {d}"),
            "theme": theme,
            "phrases": [
                phrase,
                bank[(d) % len(bank)],
                bank[(d + 1) % len(bank)],
                bank[(d + 2) % len(bank)],
                bank[(d + 3) % len(bank)],
            ],
            "grammar_tip": f"Day {d}: Practice {theme} vocabulary — all phrases are in {target_lang} only.",
            "cultural_note": f"Connecting {native_lang} speakers learning {target_lang}.",
            "practice_prompt": f"Have a short conversation about {theme} using today's {target_lang} phrases.",
        })
    return lessons
