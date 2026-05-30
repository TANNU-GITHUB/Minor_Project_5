# TongueBridge / Atlas Dance Show - Project Overview

## What this project is

TongueBridge is a full-stack language-learning application built with a Python FastAPI backend and a React/TypeScript frontend. It is designed to analyze learner voice samples, extract a personalized learning profile (language DNA), generate tailored lessons, and provide interactive speaking practice with AI-powered feedback.

The workspace contains two main parts:
- `backend/` – Python API, AI services, lesson generation, database models, WebSocket tutor.
- `client/` – React frontend, UI pages, routes, and controls for onboarding, practice, dashboard, and progress.

## Top-level folder structure

```
/ (project root)
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py          # App and API configuration from .env
│   │   ├── database.py        # SQLAlchemy/Postgres initialization
│   │   ├── models.py          # DB models: User, LanguageDNA, Lesson, ConversationSession
│   │   ├── routes/            # FastAPI route modules
│   │   │   ├── analyze.py
│   │   │   ├── billing.py
│   │   │   ├── conversations.py
│   │   │   ├── dna.py
│   │   │   ├── lessons.py
│   │   │   ├── progress.py
│   │   ├── services/          # AI and business logic services
│   │   │   ├── dna_service.py
│   │   │   ├── elevenlabs_service.py
│   │   │   ├── insights_service.py
│   │   │   ├── mock_analysis.py
│   │   │   ├── pinecone_service.py
│   │   │   ├── practice_service.py
│   │   │   ├── tutor_flow_service.py
│   │   │   ├── whisper_service.py
│   │   ├── websocket/         # WebSocket conversational tutor
│   │   │   └── conversation_ws.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.db.yml
│   ├── main.py                # FastAPI app entrypoint
│   ├── README.md              # Backend run instructions
│   ├── requirements.txt
│   └── run-dev.ps1

├── client/
│   ├── bunfig.toml            # Bun package manager config
│   ├── components.json        # shadcn component config
│   ├── eslint.config.js
│   ├── package.json
│   ├── PROJECT_STRUCTURE.md
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # Reusable UI components and landing page sections
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities and API helpers
│   │   ├── routes/            # App routes / pages
│   │   └── styles.css         # Global styles
```

## Backend architecture and purpose

### Main functions
- Receive user voice uploads during onboarding.
- Transcribe audio with Groq/Whisper-like service.
- Analyze user speech to build a personalized learner profile (`LanguageDNA`).
- Generate a 7-day curriculum from the learner profile.
- Save lessons, practice progress, conversation sessions, and review data in Postgres.
- Score spoken phrase practice and provide real-time feedback.
- Deliver live conversation tutoring through WebSocket.
- Support Stripe billing checkout and webhook handling.

### Backend key components
- `backend/main.py` – creates FastAPI app, includes CORS settings, mounts API routers.
- `backend/app/config.py` – reads environment variables, including API keys for Groq, Stripe, Pinecone, database and AWS.
- `backend/app/models.py` – defines storage structure for users, DNA, lessons, and sessions.
- `backend/app/services/dna_service.py` – builds prompts, calls Groq LLM for learner profiling and curriculum generation, and normalizes results.
- `backend/app/services/whisper_service.py` – audio transcription logic, language detection, and support for mock dev mode.
- `backend/app/services/practice_service.py` – evaluates learner audio against expected phrase targets, computes score and feedback.
- `backend/app/websocket/conversation_ws.py` – WebSocket-driven tutor session engine.
- `backend/app/services/tutor_flow_service.py` – tutor state machine for lesson phases and conversation flow.
- `backend/app/services/insights_service.py` – session review generation and learner progress insight aggregation.

## API endpoints

### Core health
- `GET /api/health` – simple status check.

### Voice analysis & onboarding
- `POST /api/analyze/voice`
  - Upload learner audio and submit metadata
  - Inputs: `audio`, `native_language`, `target_language`, `user_id`
  - Outputs: personalized language DNA, transcript preview, derived profile values

### Learner profile
- `GET /api/dna/user/{user_id}`
  - Fetch latest language DNA for a given user.

### Lessons and practice
- `GET /api/lessons/user/{user_id}`
  - Retrieve all lessons for a learner.
- `GET /api/lessons/{lesson_id}`
  - Retrieve a single lesson by its ID.
- `POST /api/lessons/{lesson_id}/practice-phrase`
  - Submit learner audio for a specific phrase.
  - Returns a practice score, transcript, pass/fail status, and feedback.
- `PATCH /api/lessons/{lesson_id}/complete`
  - Mark a lesson complete and store final lesson score.

### Progress and analytics
- `GET /api/progress/{user_id}`
  - Returns aggregate progress metrics, streak, completed lesson count, learned words, weekly minutes, average score, and insights.

### Conversations and chat history
- `GET /api/conversations/user/{user_id}`
  - List recent practice/chat sessions for a learner.
- `GET /api/conversations/{session_id}`
  - Get details of a saved conversation session.

### Billing
- `POST /api/billing/create-checkout`
  - Creates a Stripe checkout session for subscription payments.
  - Inputs: `user_id`, `user_email`.
- `POST /api/billing/webhook`
  - Stripe webhook to update user plan after successful checkout.

### Real-time tutor
- WebSocket: `/ws/converse/{user_id}`
  - Live tutor conversation channel.
  - Supports audio/text input, session persistence, scoring, corrections, and follow-up turns.

## Frontend architecture and purpose

### Main user experience flows
- **Landing / marketing pages** – home, pricing, features, testimonials.
- **Onboarding** – collect voice sample, learner languages, and create learner DNA.
- **Dashboard** – show current lesson progress and session status.
- **DNA results** – present extracted learner profile and personality-driven lesson setup.
- **Lesson practice** – practice phrases, hear pronunciation help, and receive feedback.
- **Progress page** – show progress metrics, streaks, learned words, phrase scores, and insights.
- **Conversation page** – connect to the WebSocket tutor for interactive speaking practice.
- **Login / signup** – user auth pages are present in routes, though backend auth routes are not fully exposed in the current API.

### Frontend core technologies
- **React 19** – UI rendering.
- **TypeScript** – static type safety.
- **TanStack Start / React Router** – page routing and SSR-like app structure.
- **Vite** – quick development build tooling.
- **Bun** (`bunfig.toml`) – package management and runtime config.
- **Tailwind CSS 4** – utility-first styling.
- **shadcn UI** – accessible component primitives for buttons, cards, dialogs, forms, tables, etc.
- **Three.js** – 3D content such as the holographic globe.
- **Recharts** – charts for progress and analytics.

### Important frontend directories
- `client/src/components/landing/` – landing page sections and home page UX.
- `client/src/components/ui/` – reusable design system components.
- `client/src/lib/` – shared utilities including API wrappers and error handling.
- `client/src/routes/` – page-level route files matching app views.

## Technology stack with purpose

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Python FastAPI | API, routing, request validation, async services |
| Backend | SQLAlchemy + Postgres | database models, persistence, lesson data, session history |
| Backend | Groq / LLM | voice analysis, learner DNA extraction, curriculum generation, tutoring logic |
| Backend | Stripe | subscription checkout and payment event handling |
| Backend | WebSockets | interactive tutoring sessions and real-time conversation flow |
| Frontend | React + TypeScript | modern UI, route management, page rendering |
| Frontend | TanStack Start | app structure, routing, SSR-ready architecture |
| Frontend | Tailwind CSS + shadcn | visual design, reusable UI components |
| Frontend | Three.js | animated visualization and rich landing experience |
| Dev / Deployment | Docker Compose | local Postgres / Redis / backend orchestration |

## How the core flow works

1. **User uploads voice** during onboarding.
2. Backend transcribes the audio and analyzes the transcript through a language model.
3. The app stores a personalized profile (`LanguageDNA`) with vocabulary, formality, humor, complexity, and cultural preferences.
4. The backend generates a lesson plan of 7 days tailored to the learner.
5. The frontend shows lessons, phrase practice cards, and progress metrics.
6. Learners record phrase audio and submit it to the backend for scoring.
7. Scores and feedback are stored inside the lesson content.
8. Learners can open the conversation page and practice live with the AI tutor over WebSocket.
9. After sessions, a short review is generated and saved in the conversation history.

## What is already present in this repository

- Voice onboarding and learner profiling.
- Personalized lesson creation based on extracted speech DNA.
- Phrase-level practice scoring.
- Lesson completion tracking.
- Progress summary and insight aggregation.
- WebSocket tutoring for interactive conversational practice.
- Stripe billing checkout stub and webhook handler.
- Docker Compose support for backend + Postgres + Redis.
- Mock analysis mode for development without API credits.

## Known gaps / missing areas in the current implementation

- No fully exposed backend auth endpoints for sign-up/login yet.
- Frontend signup/login routes exist, but backend user creation flow is not complete.
- Billing integration exists in backend, but frontend checkout UI is not documented here.
- AWS and Pinecone config are present in settings but may not be fully wired into the current API flow.

## Future scope and enhancements

### Payment and subscriptions
- Complete Stripe full checkout flow on the frontend.
- Support subscription plan management and in-app plan upgrades.
- Add billing UI and access control for free/pro features.

### Learner experience
- Add user accounts and secure authentication.
- Support multiple native and target languages across the UI.
- Add spaced repetition and multi-week curriculum tracking.
- Add gamification: streak badges, levels, daily goals.
- Add a lesson library and review queue.
- Enable audio playback of tutor and learner responses.

### AI and personalization
- Improve language DNA extraction with more advanced prompts.
- Add aggregated learner models for better curriculum adaptation.
- Add AI chat fallback for voice coach if WebSocket tutor fails.
- Add pronunciation history charts and progress comparisons.

### Deployment & operations
- Containerize both backend and frontend for production deployment.
- Add CI/CD pipeline for build/test/deploy.
- Add environment-specific deployment docs.
- Add observability: logs, errors, and usage analytics.

### Extensions
- Add payment gateway alternatives beyond Stripe.
- Add export / report generation for learner progress.
- Add admin dashboard for instructors and curriculum review.
- Add integration with external course content or third-party language APIs.

## How to run locally

1. Start Postgres and Redis:
   - `cd backend`
   - `docker compose -f docker-compose.db.yml up -d`
2. Install backend dependencies:
   - `pip install -r requirements.txt`
3. Start backend:
   - `./run-dev.ps1`
4. Start frontend:
   - `cd client`
   - `npm run dev`
5. Visit the frontend URL and ensure `VITE_API_URL=http://localhost:8000` in client environment settings.

## Summary

This repository is a language tutoring platform built from:
- a FastAPI backend with audio analysis, curriculum generation, practice scoring, and chat tutoring;
- a React-based frontend with lesson pages, progress dashboards, and conversational UX;
- a modern developer setup using Docker, TypeScript, Bun, Tailwind, and AI services.

The project is already well-structured for future enhancements around payment, user accounts, expanded languages, and richer learning analytics.
