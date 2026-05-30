# 🌍 TongueBridge

> **AI that learns how YOU speak - then teaches any language the same way.**

TongueBridge analyses your natural speech patterns to build a personalised *Language DNA* profile, then generates a 7-day curriculum that matches your vocabulary range, humor style, and cultural references. Instead of generic lessons, you get content that feels like it was made for you.

---

## ✨ Features

- 🎙️ **Voice Analysis** — Records your natural speech and extracts a full personality profile
- 🧬 **Language DNA** — Radar chart of vocabulary, formality, complexity, fluency, and cultural richness
- 📚 **Personalised Curriculum** — AI-generated 7-day plan using your topics and humor style
- 🗣️ **Phrase Practice** — Submit audio, get scored, see exactly where to improve
- 🤖 **Live AI Tutor** — Real-time WebSocket conversation partner that teaches in your style
- 📊 **Progress Dashboard** — Streaks, words learned, pronunciation scores, session history
- 💳 **Stripe Billing** — Free and Pro tiers with Stripe Checkout

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python + FastAPI** | API server, routing, request validation |
| **SQLAlchemy + PostgreSQL** | Database models and persistence |
| **Groq (Llama 3.3 + Whisper)** | Voice transcription, DNA extraction, tutoring |
| **WebSockets** | Real-time AI tutor conversation |
| **Stripe** | Subscription billing |
| **Pinecone** | Vector storage for learner DNA |
| **Docker** | Containerised local development |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19 + TypeScript** | UI rendering and type safety |
| **TanStack Start** | SSR-ready app structure and routing |
| **Tailwind CSS 4 + shadcn/ui** | Design system and UI components |
| **Three.js** | 3D holographic globe on landing page |
| **Recharts** | Progress charts and analytics |
| **Vite + Bun** | Build tooling and package management |

---

## 🏗 Architecture

```
User Browser
     │
     ├── Frontend (React/TanStack)
     │        ├── Cloudflare Pages (CDN, free, global)
     │        └── SSR via Cloudflare Workers
     │
     └── API Calls ──► AWS App Runner (Backend)
                              │
                  ┌───────────┼────────────┐
                  ▼           ▼            ▼
            AWS RDS       Upstash      Pinecone
          PostgreSQL        Redis       Vectors
                  │
                  └── Groq API (LLM + Whisper)
```

---

## 🚀 Getting Started Locally

### Prerequisites

- Python 3.12+
- Node.js 20+ and Bun
- Docker Desktop (running)
- A free [Groq API key](https://console.groq.com)
- A free [Pinecone account](https://pinecone.io)

### 1. Clone the repository

```bash
git clone https://github.com/TANNU-GITHUB/tonguebridge.git
cd tonguebridge
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Open .env and fill in your API keys
```

Your `.env` needs:

```bash
MOCK_ANALYSIS=true          # Set false when you have real API keys
GROQ_API_KEY=gsk_...
PINECONE_API_KEY=...
PINECONE_ENV=gcp-starter
DATABASE_URL=postgresql://tb:tb_local_pass_123@localhost:5432/tonguebridge
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
```

### 3. Start the database

```bash
# From the backend/ directory
docker compose -f docker-compose.db.yml up -d
```

### 4. Start the backend

```bash
# Windows (PowerShell)
.\run-dev.ps1

# Mac / Linux
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at **http://localhost:8000**
Interactive API docs at **http://localhost:8000/docs**

### 5. Start the frontend

```bash
cd client
bun install        # or: npm install
bun run dev        # or: npm run dev
```

Frontend runs at **http://localhost:5173**

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/analyze/voice` | Upload voice, get Language DNA |
| `GET` | `/api/dna/user/{user_id}` | Fetch learner DNA profile |
| `GET` | `/api/lessons/user/{user_id}` | Get all lessons for a learner |
| `GET` | `/api/lessons/{lesson_id}` | Get one lesson |
| `POST` | `/api/lessons/{lesson_id}/practice-phrase` | Submit phrase audio for scoring |
| `PATCH` | `/api/lessons/{lesson_id}/complete` | Mark lesson complete |
| `GET` | `/api/progress/{user_id}` | Aggregate progress and insights |
| `GET` | `/api/conversations/user/{user_id}` | List conversation sessions |
| `GET` | `/api/conversations/{session_id}` | Get session details |
| `POST` | `/api/billing/create-checkout` | Create Stripe checkout |
| `POST` | `/api/billing/webhook` | Stripe payment webhook |
| `WS` | `/ws/converse/{user_id}` | Live AI tutor WebSocket |

Full interactive docs: `http://localhost:8000/docs`

---

## 🗂 Project Structure

```
tonguebridge/
│
├── backend/                        # Python FastAPI backend
│   ├── app/
│   │   ├── config.py               # Environment configuration
│   │   ├── database.py             # PostgreSQL connection
│   │   ├── models.py               # User, DNA, Lesson, Session models
│   │   ├── routes/                 # API route handlers
│   │   │   ├── analyze.py          # Voice upload and DNA extraction
│   │   │   ├── dna.py              # Learner profile retrieval
│   │   │   ├── lessons.py          # Lesson management and scoring
│   │   │   ├── progress.py         # Progress metrics
│   │   │   ├── conversations.py    # Session history
│   │   │   └── billing.py          # Stripe checkout
│   │   ├── services/               # AI and business logic
│   │   │   ├── dna_service.py      # Groq LLM - DNA extraction, curriculum
│   │   │   ├── whisper_service.py  # Groq Whisper - audio transcription
│   │   │   ├── practice_service.py # Phrase scoring and feedback
│   │   │   ├── tutor_flow_service.py # Tutor state machine
│   │   │   ├── insights_service.py # Progress insights
│   │   │   ├── mock_analysis.py    # Mock data for dev mode
│   │   │   ├── elevenlabs_service.py # TTS (browser fallback)
│   │   │   └── pinecone_service.py # Vector storage
│   │   └── websocket/
│   │       └── conversation_ws.py  # Live tutor WebSocket
│   ├── main.py                     # App entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.db.yml       # DB-only compose for local dev
│   └── run-dev.ps1                 # Windows dev startup script
│
├── client/                         # React/TanStack Start frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/            # Landing page sections
│   │   │   └── ui/                 # shadcn design system
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # API helpers, utilities
│   │   └── routes/                 # Page-level route files
│   │       ├── index.tsx           # Home / landing page
│   │       ├── onboarding.tsx      # Voice recording + language selection
│   │       ├── dna-results.tsx     # Language DNA radar chart
│   │       ├── dashboard.tsx       # Lesson dashboard
│   │       ├── lesson.$day.tsx     # Phrase practice
│   │       ├── conversation.tsx    # Live AI tutor
│   │       ├── progress.tsx        # Progress analytics
│   │       ├── profile.tsx         # User profile
│   │       └── pricing.tsx         # Pricing page
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .github/
│   └── workflows/
│       └── deploy-backend.yml      # Auto-deploy backend to AWS
│
└── README.md
```

---

## 🌐 How Language DNA Works

When you record yourself speaking naturally (3-5 minutes):

1. **Groq Whisper** transcribes your audio in your native language
2. **Groq Llama 3.3** analyses the transcript and extracts:
   - Vocabulary richness (0-10)
   - Formality level (0-10)
   - Humor style (sarcastic / dry / wordplay / storytelling)
   - Sentence complexity (0-10)
   - Fluency score (0-10)
   - Cultural richness (0-10)
   - Favorite topics (cricket, tech, food, etc.)
   - Cultural references
3. A **personalised tutor persona** is built from these traits
4. A **7-day curriculum** is generated using your topics, humor, and vocabulary level
5. The **AI tutor** adopts this persona in every conversation

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MOCK_ANALYSIS` | Yes | `true` = sample data, `false` = real AI |
| `GROQ_API_KEY` | Yes | Free key from console.groq.com |
| `PINECONE_API_KEY` | Optional | Vector storage for DNA |
| `PINECONE_ENV` | Optional | Pinecone environment |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |
| `STRIPE_SECRET_KEY` | Optional | For billing features |
| `STRIPE_WEBHOOK_SECRET` | Optional | For Stripe webhooks |

### Frontend (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend URL (e.g. http://localhost:8000) |
| `VITE_WS_URL` | Yes | WebSocket URL (e.g. ws://localhost:8000) |

---

## 🚢 Deployment

The app deploys as:
- **Frontend** → Cloudflare Pages (free)
- **Backend** → AWS App Runner (containerised)
- **Database** → AWS RDS PostgreSQL
- **Cache** → Upstash Redis (free)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete step-by-step guide.

---

## 🧪 Development Tips

**Run with mock data (no API keys needed):**
```bash
MOCK_ANALYSIS=true
```
The backend returns realistic sample data — full UI works without spending API credits.

**Test the API interactively:**
```
http://localhost:8000/docs
```
Swagger UI lets you call every endpoint directly from the browser.

**Check backend logs:**
When running `run-dev.ps1`, all logs print to that terminal. Errors show in red.

---

## 🗺 Roadmap

- [ ] Full user authentication (sign up / login)
- [ ] Spaced repetition for vocabulary review
- [ ] Multi-week curriculum tracking
- [ ] Gamification (streaks, badges, levels)
- [ ] Audio playback for tutor responses
- [ ] Pronunciation history charts
- [ ] Admin dashboard for curriculum review
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) — blazing fast free LLM inference
- [TanStack](https://tanstack.com) — excellent React tooling
- [shadcn/ui](https://ui.shadcn.com) — accessible component library
- [FastAPI](https://fastapi.tiangolo.com) — modern Python API framework

---

<div align="center">
  <strong>Built with ❤️ — AI that actually gets you</strong>
</div>
