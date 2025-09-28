@echo off
echo Opening AI Trading Dashboard...
echo.
echo Available interfaces:
echo - Complete Dashboard: http://localhost:8001
echo - Supervisor Console: http://localhost:8001/supervisor
echo - API Documentation: http://localhost:8001/docs
echo.
start http://localhost:8001
start http://localhost:8001/supervisor
echo.
echo Browser windows opened!
pause