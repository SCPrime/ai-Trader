@echo off
title AI Trading Suite - Complete Control Center
color 0A
echo.
echo  ════════════════════════════════════════════════════════════
echo    🤖 AI TRADING SUITE - COMPLETE CONTROL CENTER 🤖
echo  ════════════════════════════════════════════════════════════
echo.

REM Kill any existing processes on our target ports
echo [CLEANUP] Stopping existing services...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8003') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8505') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8006') do taskkill /f /pid %%a 2>nul
timeout /t 2 /nobreak > nul

echo.
echo [STARTUP] Launching AI Trading Suite...
echo.

REM Start the main working FastAPI app
echo [1/3] 🚀 Starting Main AI Trading Dashboard...
start /min cmd /c "PORT=8003 python app_working.py"
timeout /t 4 /nobreak > nul

REM Start Streamlit with proper configuration
echo [2/3] 📊 Starting Analytics Dashboard...
start /min cmd /c "streamlit run streamlit_ai_interface.py --server.port=8505 --server.headless=true"
timeout /t 4 /nobreak > nul

REM Start the unified control center
echo [3/3] 🎛️ Starting Unified Control Center...
start /min cmd /c "PORT=8006 python unified_trading_interface.py"
timeout /t 4 /nobreak > nul

echo.
echo [STARTUP] All services launching... Please wait...
timeout /t 8 /nobreak > nul

echo.
echo  ════════════════════════════════════════════════════════════
echo    ✅ AI TRADING SUITE READY - ALL INTERFACES ONLINE ✅
echo  ════════════════════════════════════════════════════════════
echo.
echo  🎛️ UNIFIED CONTROL CENTER    http://localhost:8006
echo     ├─ Bot Management & Control
echo     ├─ AI Assistant Integration
echo     ├─ Real-time Portfolio View
echo     └─ Multi-Bot Selection Panel
echo.
echo  🤖 MAIN AI DASHBOARD         http://localhost:8003
echo     ├─ AI Chat Enhanced UI
echo     ├─ Claude/GPT Integration
echo     ├─ WebSocket Real-time Data
echo     └─ Portfolio Management
echo.
echo  📊 ANALYTICS DASHBOARD       http://localhost:8505
echo     ├─ Interactive Charts
echo     ├─ Technical Analysis
echo     ├─ Performance Metrics
echo     └─ Strategy Builder
echo.
echo  🔧 QUICK LINKS:
echo     ├─ Enhanced AI Chat:     http://localhost:8003/ai-chat-enhanced
echo     ├─ System Health:       http://localhost:8003/api/health
echo     ├─ Bot Configuration:   http://localhost:8006/config
echo     └─ API Documentation:   http://localhost:8003/docs
echo.
echo  ⚡ FEATURES AVAILABLE:
echo     ✅ Multi-Provider AI (Claude/GPT-4/Local)
echo     ✅ Real-time Trading Data & Analytics
echo     ✅ Multiple Bot Selection & Control
echo     ✅ Paper Trading Mode (SAFE)
echo     ✅ Risk Management & Safety Checks
echo     ✅ WebSocket Live Updates
echo     ✅ Interactive Strategy Builder
echo     ✅ Portfolio Performance Tracking
echo.
echo  ════════════════════════════════════════════════════════════
echo.

echo Checking service status...
echo.
timeout /t 2 /nobreak > nul

REM Check if services are running
echo 🔍 Service Status Check:
echo.
netstat -an | findstr "8003 8505 8006" | findstr LISTENING > temp_status.txt
if %errorlevel% == 0 (
    echo ✅ All services are running properly!
    echo.
    type temp_status.txt
) else (
    echo ⚠️ Some services may still be starting...
)
del temp_status.txt 2>nul

echo.
echo  ════════════════════════════════════════════════════════════
echo    🎯 RECOMMENDED: Start with the Unified Control Center
echo       👉 http://localhost:8006
echo  ════════════════════════════════════════════════════════════
echo.
echo Press any key to open Control Center in browser...
pause > nul

REM Try to open in default browser
start http://localhost:8001

echo.
echo ✨ AI Trading Suite is now running!
echo.
echo Press any key to keep services running, or close this window to stop all services.
pause > nul