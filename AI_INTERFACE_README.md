# 🤖 AI Trading Interface Suite

A comprehensive suite of AI-powered interfaces for your trading bot, featuring multiple UI options and a unified AI engine.

## 🚀 Quick Start

### Option 1: Launch Everything (Windows)
```bash
# Double-click or run:
launch_ai_suite.bat
```

### Option 2: Manual Launch
```bash
# Start main dashboard
python main.py dashboard

# Start Streamlit interface
streamlit run streamlit_ai_interface.py --server.port 8501

# Start AI chat interface
streamlit run ai_trading_chat.py --server.port 8502
```

## 🌐 Available Interfaces

### 1. Enhanced Web Chat
- **URL**: http://localhost:8002/ai-chat-enhanced
- **Features**: Professional GitHub-style dark theme, real-time AI responses, interactive charts
- **Best For**: Quick AI conversations and analysis

### 2. Unified Streamlit App
- **URL**: http://localhost:8501
- **Features**: Tabbed interface (Chat/Analytics/Charts), AI provider selection, portfolio analytics
- **Best For**: Comprehensive analysis and visualization

### 3. Standalone Chat App
- **URL**: http://localhost:8502
- **Features**: Dedicated AI chat with sidebar metrics and quick actions
- **Best For**: Focused AI conversations

### 4. REST API
- **URL**: http://localhost:8002/api/ai-query?query=YOUR_QUESTION
- **Features**: Direct programmatic access to AI engine
- **Best For**: Integration with other tools

## 🧠 AI Engine Features

### Multi-Provider Support
- **Primary**: Claude (Anthropic) - Advanced reasoning and analysis
- **Fallback**: OpenAI GPT-4 - Backup when Claude unavailable
- **Local**: Rule-based responses - Always available offline

### Smart Query Classification
- **Portfolio**: "What are my positions?" → Position analysis
- **Performance**: "How am I doing?" → P&L and metrics
- **Strategy**: "Explain my strategy" → Strategy breakdown
- **Market**: "Analyze SPY" → Market insights
- **Risk**: "What's my risk?" → Risk assessment

### Context Awareness
- Current trading positions
- Account balance and P&L
- Recent trading activity
- Strategy performance
- Market conditions

## 💬 Example Queries

### Portfolio Analysis
- "What are my current positions?"
- "Show me my portfolio allocation"
- "How is my AAPL position performing?"

### Performance Tracking
- "What's my daily P&L?"
- "How am I performing vs SPY?"
- "Show me my win rate this month"

### Strategy Insights
- "Explain my current trading strategy"
- "Should I adjust my RSI parameters?"
- "What signals am I getting today?"

### Market Analysis
- "Analyze SPY trends"
- "What's the market sentiment?"
- "Should I buy the dip in QQQ?"

### Risk Management
- "What's my current risk exposure?"
- "Am I overconcentrated in tech?"
- "Should I add stop losses?"

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...  # Optional fallback

# Trading API
ALPACA_PAPER_API_KEY=your_key
ALPACA_PAPER_SECRET_KEY=your_secret
```

### AI Provider Priority
1. **Claude**: Primary provider for advanced analysis
2. **OpenAI**: Fallback when Claude unavailable
3. **Local**: Always-available rule-based responses

## 📊 Chart Types

The AI can suggest and generate various chart types:

- **Line Charts**: Performance trends, P&L over time
- **Pie Charts**: Portfolio allocation, sector breakdown
- **Candlestick**: Price action and technical analysis
- **Heatmaps**: Market sector performance
- **Bar Charts**: Comparison metrics

## 🎯 Quick Actions

All interfaces include quick action buttons for common queries:

- 📊 Portfolio Overview
- 📈 Performance Analysis
- 🔍 Market Analysis
- ⚠️ Risk Assessment
- 🎯 Strategy Review

## 🔧 Technical Details

### Architecture
```
User Interface Layer
├── Streamlit Apps (streamlit_*.py)
├── Web Interface (templates/enhanced_chat.html)
└── FastAPI Endpoints (app.py)
                ↓
Unified AI Engine (src/unified_ai_engine.py)
├── Query Classification
├── Context Management
├── Provider Routing
└── Response Formatting
                ↓
AI Providers
├── Claude (Anthropic)
├── OpenAI GPT-4
└── Local Fallback
```

### Files Structure
```
ai-Trader/
├── streamlit_ai_interface.py    # Unified Streamlit app
├── ai_trading_chat.py           # Standalone chat app
├── templates/
│   └── enhanced_chat.html       # Web interface
├── src/
│   └── unified_ai_engine.py     # Core AI engine
├── launch_ai_suite.bat         # Windows launcher
└── AI_INTERFACE_README.md      # This file
```

## 🚨 Troubleshooting

### Common Issues

**AI not responding**
- Check ANTHROPIC_API_KEY in .env file
- Verify internet connection
- Try local fallback responses

**Interface not loading**
- Check if ports 8501/8502 are available
- Restart services with launcher script
- Check console for error messages

**Charts not showing**
- Ensure plotly is installed: `pip install plotly`
- Check browser console for JavaScript errors
- Try refreshing the page

### Support Commands
```bash
# Check running services
netstat -an | findstr ":850"

# Restart services
taskkill /f /im python.exe
launch_ai_suite.bat

# Check AI engine
python -c "from src.unified_ai_engine import ai_engine; print('OK')"
```

## 🎉 What's Next?

Your AI trading suite is now fully operational! You can:

1. **Start with the Streamlit interface** for comprehensive analysis
2. **Use the web chat** for quick AI conversations
3. **Integrate the API** into your own tools
4. **Customize the AI responses** in the unified engine
5. **Add new chart types** and visualizations

The unified architecture makes it easy to add new interfaces or enhance existing ones while keeping all the AI logic centralized and consistent.

Happy trading! 🚀