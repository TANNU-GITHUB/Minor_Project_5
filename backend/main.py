from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.config import settings

# Import all routers
from app.routes.analyze import router as analyze_router
from app.routes.lessons import router as lessons_router
from app.routes.dna import router as dna_router
from app.routes.progress import router as progress_router
from app.routes.billing import router as billing_router
from app.routes.conversations import router as conversations_router
from app.websocket.conversation_ws import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text(
                "ALTER TABLE conversation_sessions "
                "ADD COLUMN IF NOT EXISTS session_review JSONB DEFAULT '{}'"
            ))
        except Exception:
            pass
    print("✅ TongueBridge API started. Tables ready.")
    yield
    await engine.dispose()

app = FastAPI(title="TongueBridge API", lifespan=lifespan)

# Allow your frontend to call this backend (any localhost port for Vite/Lovable dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "https://tonguebridge.pages.dev",
        "https://tonguebridge.in",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(analyze_router,  prefix="/api/analyze",  tags=["analyze"])
app.include_router(dna_router,      prefix="/api/dna",      tags=["dna"])
app.include_router(lessons_router,  prefix="/api/lessons",  tags=["lessons"])
app.include_router(progress_router, prefix="/api/progress", tags=["progress"])
app.include_router(billing_router,  prefix="/api/billing",  tags=["billing"])
app.include_router(conversations_router, prefix="/api/conversations", tags=["conversations"])
app.include_router(ws_router)  # WebSocket — no prefix

@app.get("/api/health")
async def health():
    return {"status": "ok"}