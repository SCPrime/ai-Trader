@echo off
echo Starting AI Trading Suite...
echo.

REM Kill any existing processes on our ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do taskkill /f /pid %%a 2>nul

echo Starting Complete AI Trading API...
start /min cmd /c "python complete_api.py"

echo Waiting for API to start...
timeout /t 3 /nobreak > nul

echo.
echo Services starting...
echo.
echo Available interfaces:
echo - Complete Dashboard: http://localhost:8001
echo - Supervisor Console: http://localhost:8001/supervisor
echo - API Documentation: http://localhost:8001/docs
echo.
echo Opening browser...
start http://localhost:8001
echo.
echo Press any key to check status...
pause
netstat -an | findstr "8001"