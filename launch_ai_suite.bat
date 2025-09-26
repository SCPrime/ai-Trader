@echo off
echo 🚀 Launching AI Trading Suite
echo ==============================

echo Starting main dashboard...
start /B python main.py dashboard
timeout /t 5 /nobreak >nul

echo Starting Streamlit interface...
start /B python -m streamlit run streamlit_ai_interface.py --server.port 8501

echo.
echo ✅ All systems running!
echo.
echo 📊 Main Dashboard: http://localhost:8002
echo 💬 AI Chat: http://localhost:8002/ai-chat-enhanced
echo 🎨 Streamlit UI: http://localhost:8501
echo 🔗 API Endpoint: http://localhost:8002/api/ai-query?query=YOUR_QUERY
echo.
echo Press any key to stop all services...
pause >nul

echo Stopping services...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im streamlit.exe >nul 2>&1