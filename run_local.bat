@echo off
echo 🏠 Starting LOCAL Paper Trading Bot
echo ===================================

set ENVIRONMENT=local
set FORCE_PAPER_TRADING=true

REM Check .env exists
if not exist .env (
    echo ❌ Error: .env file not found!
    echo Create .env with your PAPER trading keys
    pause
    exit /b 1
)

REM Start locally
echo Starting on http://localhost:8002
python main.py dashboard

pause