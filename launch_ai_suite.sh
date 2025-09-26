#!/bin/bash
echo "🚀 Launching AI Trading Suite"
echo "=============================="

# Start main app with dashboard
echo "Starting main dashboard..."
python main.py dashboard &
MAIN_PID=$!

# Wait for main app to start
sleep 5

# Start Streamlit interface
echo "Starting Streamlit interface..."
python -m streamlit run streamlit_ai_interface.py --server.port 8501 &
STREAMLIT_PID=$!

echo ""
echo "✅ All systems running!"
echo ""
echo "📊 Main Dashboard: http://localhost:8002"
echo "💬 AI Chat: http://localhost:8002/ai-chat-enhanced"
echo "🎨 Streamlit UI: http://localhost:8501"
echo "🔗 API Endpoint: http://localhost:8002/api/ai-query?query=YOUR_QUERY"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $MAIN_PID $STREAMLIT_PID; exit" INT
wait