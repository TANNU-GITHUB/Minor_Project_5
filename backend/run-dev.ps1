# backend/run-dev.ps1
# Run this file to start the FastAPI backend on Windows

Write-Host "Starting TongueBridge Backend..." -ForegroundColor Green

# Check Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python not found. Install from https://python.org" -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing Python packages..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Start the server
Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Use localhost for DATABASE_URL when running Python directly (not in Docker)
$env:DATABASE_URL = "postgresql://tb:tb_local_pass_123@localhost:5432/tonguebridge"
$env:REDIS_URL = "redis://localhost:6379"
# Uses GROQ_API_KEY from .env for Whisper + Llama. Set MOCK_ANALYSIS=true to skip AI calls.
Write-Host "Using Groq (GROQ_API_KEY). Set MOCK_ANALYSIS=true in .env to use sample DNA only." -ForegroundColor DarkGray

uvicorn main:app --host 0.0.0.0 --port 8000 --reload