# TongueBridge Backend

Python **FastAPI** API — not an npm/Node project. There is no `npm run dev` in this folder.

## Quick start (recommended)

### 1. Fix Docker Desktop

If you see `500 Internal Server Error` on `dockerDesktopLinuxEngine`, the Docker engine is not running correctly:

1. Quit **Docker Desktop** completely (system tray → Quit).
2. Start **Docker Desktop** again and wait until it says **Engine running**.
3. If it still fails: Docker Desktop → **Troubleshoot** → **Restart Docker Desktop** (or **Reset to factory defaults** as a last resort).
4. Verify: `docker info` should print server info without errors.

### 2. Start Postgres + Redis

```powershell
cd backend
docker compose -f docker-compose.db.yml up -d
```

### 3. Start the API (on your machine)

```powershell
pip install -r requirements.txt
.\run-dev.ps1
```

Open http://localhost:8000/api/health — you should see `{"status":"ok"}`.

### 4. Start the frontend

```powershell
cd ../client
npm run dev
```

Ensure `client/.env` has `VITE_API_URL=http://localhost:8000`.

## AI stack (Groq — free tier)

Voice + DNA + chat use **Groq** (not OpenAI). Add your key to `backend/.env`:

```
GROQ_API_KEY=gsk_...
MOCK_ANALYSIS=false
```

Get a free key at https://console.groq.com

If Groq rate-limits you, set `MOCK_ANALYSIS=true` for sample DNA without API calls.

## Full stack in Docker

Once Docker works:

```powershell
docker compose up
```

This runs API + Postgres + Redis together on port 8000.

## Common errors

| Error | Cause | Fix |
|-------|--------|-----|
| `npm run dev` missing script | Backend is Python | Use `.\run-dev.ps1` |
| `ERR_CONNECTION_REFUSED` on :8000 | API not running | Run `.\run-dev.ps1` |
| CORS blocked on `:8081` | Frontend port not allowed | Restart API after pull (CORS allows all localhost ports) |
| Groq 429 / rate limit | Free tier exhausted | `MOCK_ANALYSIS=true` or wait |
| `openai_api_key` AttributeError | Old config | Use `GROQ_API_KEY` (already fixed) |
| Docker `500` on image pull | Docker engine down | Restart Docker Desktop |
| DB connection errors | Postgres not up | `docker compose -f docker-compose.db.yml up -d` |
