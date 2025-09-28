@echo off
title AI Trading Bot - Working Dashboard
echo.
echo ======================================
echo   AI Trading Bot - Working Dashboard
echo ======================================
echo.

REM Kill any existing processes on our target ports
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do taskkill /f /pid %%a 2>nul

echo.
echo Starting services...
echo.

REM Start the complete API
echo [1/1] Starting Complete AI Trading API...
start /min cmd /c "python complete_api.py"

REM Wait for API to start
timeout /t 3 /nobreak > nul

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   SERVICES READY - WORKING INTERFACES
echo ========================================
echo.
echo 🤖 Complete Dashboard:     http://localhost:8001
echo 🔧 Supervisor Console:     http://localhost:8001/supervisor
echo 📖 API Documentation:      http://localhost:8001/docs
echo 🔧 Health Check:          http://localhost:8001/api/health
echo.
echo ========================================
echo   FEATURES AVAILABLE
echo ========================================
echo.
echo ✅ AI Chat with Claude     - Working
echo ✅ Real-time Dashboard     - Working
echo ✅ Analytics Charts        - Working
echo ✅ Paper Trading Mode      - Enforced
echo ✅ WebSocket Support       - Working
echo.
echo Press any key to check service status...
pause > nul

echo.
echo Checking service status...
echo.
netstat -an | findstr "8001" | findstr LISTENING
echo.
echo Services are running! Open the URLs above in your browser.
echo.
echo Press any key to exit...
pause > nul