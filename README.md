# 🤖 AI Trading Bot - Complete Suite

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Dashboard-green.svg)](https://fastapi.tiangolo.com/)
[![Claude AI](https://img.shields.io/badge/Claude-AI%20Powered-orange.svg)](https://www.anthropic.com/)
[![Paper Trading](https://img.shields.io/badge/Trading-Paper%20Only-green.svg)](#)

A production-ready AI trading bot with multiple interfaces, Claude AI integration, and comprehensive safety features.

## 🚀 Quick Start

### **Windows (Recommended)**
```bash
# Full AI suite with all interfaces
launch_ai_suite.bat

# Simple dashboard only
run_local.bat
```

### **Linux/Mac**
```bash
# Full AI suite
./launch_ai_suite.sh

# Simple dashboard
./run_local.sh
```

## 🌐 Available Interfaces

| Interface | URL | Features |
|-----------|-----|----------|
| **🤖 Enhanced AI Chat** | `localhost:8000/ai-chat-enhanced` | Claude AI, GitHub-style UI, interactive charts |
| **📊 Unified Dashboard** | `localhost:8501` | Streamlit with Chat/Analytics/Charts tabs |
| **💬 Standalone Chat** | `localhost:8502` | Dedicated AI chat with metrics |
| **🔧 Main Dashboard** | `localhost:8002` | Core FastAPI with supervisor features |
| **🔌 REST API** | `localhost:8000/api/ai-query` | Direct API access |

## 🧠 AI Features

- **🎯 Multi-Provider**: Claude (primary) → OpenAI (fallback) → Local responses
- **📊 Smart Analysis**: Portfolio insights, strategy recommendations, market analysis
- **💡 Interactive**: Suggestions, quick actions, chart generation
- **🔄 Real-time**: WebSocket connections for live chat

## 🔐 Safety Features

- ✅ **Paper Trading Only**: Enforced across all environments
- ✅ **Environment Validation**: Automatic API key checks
- ✅ **Risk Management**: Configurable limits per environment
- ✅ **Production Security**: Vercel deployment with safety overrides

## 📖 Documentation

- **[LAUNCH_GUIDE.md](LAUNCH_GUIDE.md)** - How to start the application
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - How to deploy to Vercel
- **[AI_INTERFACE_README.md](AI_INTERFACE_README.md)** - AI features and usage
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Complete project overview

## 🚀 Deployment

### **Local Development**
Ready to run locally with full features.

### **Vercel Production**
```bash
# Automated deployment with safety checks
./deploy_vercel.sh          # Linux/Mac
powershell deploy_vercel.ps1 # Windows
```

## 🎯 Example Queries

- "What are my current positions?"
- "How is my AAPL position performing?"
- "Analyze SPY trends"
- "What's my risk exposure?"
- "Should I adjust my strategy?"

## 🔧 Technology Stack

- **Backend**: FastAPI, Python
- **AI**: Anthropic Claude, OpenAI GPT-4
- **Frontend**: Streamlit, HTML/CSS/JavaScript
- **Trading**: Alpaca API (paper trading)
- **Deployment**: Vercel, Environment-based configs
- **Data**: yfinance, pandas, plotly

## 📊 Project Structure

```
ai-Trader/
├── 🚀 Launchers (launch_ai_suite.*, run_local.*)
├── 🧠 AI Engine (src/unified_ai_engine.py)
├── 🌐 Interfaces (streamlit_*.py, templates/)
├── ⚙️ Config (vercel.json, config/environments/)
├── 🔧 Core (main.py, app.py, src/core/)
└── 📖 Docs (README.md, *.md guides)
```

## 🎉 What You Get

1. **🤖 Intelligent Trading Assistant**: Chat with Claude AI about your trades
2. **📊 Beautiful Dashboards**: Multiple interface options for different needs
3. **🔒 Production Security**: Safe deployment with paper trading enforcement
4. **🌐 Global Deployment**: Ready for Vercel with automatic scaling
5. **📈 Analytics**: Portfolio tracking, backtesting, performance analysis

---

**🎯 Ready to start intelligent trading? Choose your launcher and begin!**

**Recommended**: `launch_ai_suite.bat` for full experience
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Alpaca](https://img.shields.io/badge/Alpaca-API-orange.svg)](https://alpaca.markets/)
[![Claude AI](https://img.shields.io/badge/Claude-AI-purple.svg)](https://www.anthropic.com/)

A sophisticated AI-powered trading bot featuring an interactive web dashboard with automated options income strategy analysis, real-time market data, and intelligent investment leg selection with profit projections.

## ✨ Key Features

### 🚀 **Core Trading**
- **Real-time Trading**: Live market data streaming via Alpaca API
- **Advanced Strategies**: RSI with divergence detection and volume filtering
- **Signal Classification**: STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL
- **Position Sizing**: Kelly Criterion-based with volatility adjustments
- **Paper Trading**: Safe testing environment (default mode)

### 📊 **Interactive Web Dashboard**
- **Options Income Strategy**: Automated research and analysis of high-IV stocks
- **Strategy Universe**: Auto-populated investment opportunities ($1-$4 price range, >80% IV)
- **Multi-leg Analysis**: Cash-secured puts and covered calls with detailed projections
- **Investment Selection**: Individual leg selection with real-time portfolio totals
- **Profit Projections**: Estimated returns, ROI calculations, and confidence levels
- **Real-time Charts**: Interactive price charts with technical indicators
- **Portfolio Management**: Live position tracking and P&L monitoring

### 🛡️ **Risk Management**
- **Multi-layer Safety**: Daily loss limits, position size controls
- **Automatic Stop Loss**: 2% default with customizable thresholds
- **Portfolio Limits**: Maximum exposure and position count controls
- **Sector Diversification**: Prevents concentration in single sectors
- **Emergency Stop**: Immediate trading halt capability

### 🤖 **AI Integration**
- **Claude AI Analysis**: Intelligent trade reasoning and analysis
- **Market Sentiment**: AI-powered market condition assessment
- **Trade Optimization**: AI-assisted strategy refinement
- **Risk Assessment**: Enhanced risk evaluation with AI insights

### 📊 **Monitoring & Analytics**
- **Real-time Dashboard**: Grafana-powered monitoring interface
- **Performance Metrics**: Comprehensive P&L and trade statistics
- **System Health**: CPU, memory, and network monitoring
- **Trade Logging**: Detailed audit trail for all activities

### 🔧 **Professional Features**
- **Docker Deployment**: Containerized with multi-service architecture
- **High Performance**: uvloop async event loop optimization
- **Rich CLI Interface**: Beautiful command-line interface with progress indicators
- **Configuration Management**: YAML + environment variable configuration
- **State Persistence**: Automatic state saving and recovery

## 🏗️ Architecture

```
ai-trader/
├── src/
│   ├── core/                 # Core trading functionality
│   │   ├── alpaca_client.py    # Async Alpaca API integration
│   │   ├── websocket_manager.py # Real-time data streaming
│   │   └── order_manager.py     # Order management & validation
│   ├── strategies/           # Trading strategies
│   │   ├── rsi_strategy.py     # Advanced RSI implementation
│   │   └── strategy_engine.py   # Strategy orchestration
│   ├── risk/                 # Risk management
│   │   └── risk_manager.py     # Comprehensive risk system
│   ├── ai/                   # AI integration
│   │   ├── ai_agent.py         # Claude LLM integration
│   │   └── prompts/           # AI trading prompts
│   └── utils/                # Utilities & helpers
│       ├── logger.py          # Advanced logging system
│       ├── validators.py      # Input validation
│       └── state_manager.py   # Application state
├── config/                   # Configuration
│   ├── config.py             # Config management
│   └── settings.yaml         # Default settings
├── deployment/               # Docker & deployment
│   ├── Dockerfile           # Multi-stage container
│   ├── docker-compose.yml   # Multi-service setup
│   └── scripts/deploy.sh    # Deployment automation
├── main.py                  # CLI interface
└── app.py                   # Main application
```

## 🚀 Quick Start

### 1. **Clone Repository**
```bash
git clone <your-repository-url>
cd ai-trader
```

### 2. **Install Dependencies**
```bash
# Create virtual environment (Python 3.11+ recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install requirements
pip install -r requirements.txt
```

### 3. **Configuration Setup**
```bash
# Run setup wizard
python main.py setup

# Edit configuration with your API keys
nano .env  # or your preferred editor
```

### 4. **Required API Keys**

#### Alpaca Markets (Trading)
1. Sign up at [Alpaca Markets](https://alpaca.markets/)
2. Get your API keys from the dashboard
3. Add to `.env` file:
```bash
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here
ALPACA_PAPER_TRADING=true  # Start with paper trading!
```

#### Anthropic Claude (AI Analysis) - Optional
1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Get your API key
3. Add to `.env` file:
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 5. **Start Trading**
```bash
# Paper trading (safe default)
python main.py run --mode paper --symbols AAPL,TSLA,MSFT

# Check status
python main.py status

# View performance
python main.py performance --days 30
```

## 🐳 Docker Deployment

### Quick Docker Start
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f trading-bot

# Stop services
docker-compose down
```

### Docker Services
- **trading-bot**: Main application container
- **redis**: Caching and session storage
- **postgres**: Database for trade history
- **grafana**: Monitoring dashboard (port 3000)
- **prometheus**: Metrics collection (port 9090)

### Automated Deployment
```bash
# Use deployment script
./deployment/scripts/deploy.sh

# Available commands
./deployment/scripts/deploy.sh help
```

## 📋 CLI Commands

### Core Commands
```bash
# Start trading bot
python main.py run [OPTIONS]
  --mode [paper|live]     Trading mode (default: paper)
  --symbols TEXT          Comma-separated symbols
  --strategy TEXT         Strategy to use (default: rsi)
  --dry-run              Simulation mode

# Check system status
python main.py status

# Analyze specific symbol
python main.py analyze --symbol AAPL --days 30

# Show performance metrics
python main.py performance --days 30

# View configuration
python main.py config-info

# Setup wizard
python main.py setup
```

### Example Usage
```bash
# Paper trading with tech stocks
python main.py run --mode paper --symbols AAPL,MSFT,GOOGL,TSLA

# Live trading (requires confirmation)
python main.py run --mode live --symbols SPY

# Analyze Tesla stock
python main.py analyze --symbol TSLA --days 60

# Check bot status
python main.py status
```

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# Trading Configuration
ALPACA_API_KEY=your_api_key
ALPACA_SECRET_KEY=your_secret_key
ALPACA_PAPER_TRADING=true

# AI Integration
ANTHROPIC_API_KEY=your_claude_key

# Risk Management
MAX_DAILY_LOSS=0.05      # 5% max daily loss
POSITION_SIZE=0.02       # 2% position size
STOP_LOSS_PCT=0.02       # 2% stop loss

# Strategy Parameters
RSI_PERIOD=14
RSI_OVERSOLD=30.0
RSI_OVERBOUGHT=70.0
```

### YAML Configuration (config/settings.yaml)
```yaml
trading:
  max_positions: 5
  position_size: 0.02
  stop_loss_pct: 0.02
  take_profit_pct: 0.04

rsi:
  period: 14
  oversold: 30.0
  overbought: 70.0
  use_divergence: true
  use_volume_filter: true

risk:
  max_daily_loss: 0.05
  max_portfolio_risk: 0.10
  require_confirmation: true
```

## 🔒 Security & Safety

### Safety Features
- **Paper Trading Default**: All trading starts in simulation mode
- **Live Trading Confirmation**: Explicit confirmation required for real money
- **API Key Security**: Environment variable storage, never in code
- **Risk Limits**: Multiple safety layers prevent large losses
- **Emergency Stop**: Immediate halt capability
- **Audit Logging**: Complete trade history and decision tracking

### Security Best Practices
```bash
# 1. Use paper trading for testing
ALPACA_PAPER_TRADING=true

# 2. Set conservative risk limits
MAX_DAILY_LOSS=0.02  # 2% max daily loss
POSITION_SIZE=0.01   # 1% position size

# 3. Regular monitoring
python main.py status  # Check regularly

# 4. Secure your .env file
chmod 600 .env  # Restrict file permissions
```

## 📊 Monitoring

### Access Dashboards
- **Grafana**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Bot API**: http://localhost:8000 (when implemented)

### Log Files
```bash
# Main application logs
tail -f logs/trading_bot.log

# Trade-specific logs
tail -f logs/trades.log

# Error logs
tail -f logs/errors.log

# Performance metrics
tail -f logs/performance.log
```

## 🧪 Testing & Validation

### Strategy Backtesting
```bash
# Backtest RSI strategy
python main.py backtest --symbols AAPL,TSLA --days 60 --strategy rsi

# Analyze specific symbol
python main.py analyze --symbol AAPL --days 30
```

### Paper Trading Validation
```bash
# Start paper trading session
python main.py run --mode paper --symbols SPY --dry-run

# Monitor performance
python main.py performance --days 7
```

## 🛠️ Development

### Adding New Strategies
1. Create strategy in `src/strategies/`
2. Implement `Strategy` interface
3. Add to strategy registry
4. Update configuration options

### Custom Risk Rules
1. Extend `RiskManager` class
2. Add validation methods
3. Configure limits in settings
4. Test with paper trading

### AI Integration
1. Implement custom prompts in `src/ai/prompts/`
2. Extend `AIAgent` class
3. Configure Claude model settings
4. Test analysis accuracy

## 🔧 Troubleshooting

### Common Issues

#### API Connection Errors
```bash
# Check API keys
python main.py config-info

# Test connection
python main.py status
```

#### Performance Issues
```bash
# Check system metrics
docker-compose exec trading-bot python -c "import psutil; print(f'CPU: {psutil.cpu_percent()}% Memory: {psutil.virtual_memory().percent}%')"

# Restart services
docker-compose restart trading-bot
```

#### Configuration Problems
```bash
# Validate configuration
python main.py setup

# Reset to defaults
cp .env.example .env
```

### Log Analysis
```bash
# Error investigation
grep -i error logs/trading_bot.log

# Trade analysis
grep -i "ORDER_PLACED" logs/trades.log

# Performance issues
grep -i "performance" logs/performance.log
```

## 📈 Performance Optimization

### System Optimization
- **uvloop**: High-performance async event loop
- **Vectorized Calculations**: NumPy/Pandas optimizations
- **Connection Pooling**: Efficient API usage
- **Caching**: Redis for frequently accessed data
- **Resource Limits**: Docker memory/CPU controls

### Trading Optimization
- **Signal Filtering**: Volume and trend confirmations
- **Position Sizing**: Kelly Criterion implementation
- **Risk Controls**: Multiple safety layers
- **AI Analysis**: Enhanced decision making

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Setup
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Code formatting
black src/

# Linting
pylint src/
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**Important**: This software is for educational and informational purposes only. Trading stocks and other financial instruments involves risk and can result in significant financial losses. Past performance does not guarantee future results.

- **Not Financial Advice**: This software does not provide financial advice
- **Use at Your Own Risk**: All trading decisions are your responsibility
- **Test Thoroughly**: Always test strategies with paper trading first
- **Understand the Risks**: Be aware of the potential for financial loss
- **Compliance**: Ensure compliance with local financial regulations

## 🙋‍♂️ Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Open GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

### Resources
- [Alpaca API Documentation](https://alpaca.markets/docs/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Python async/await Guide](https://docs.python.org/3/library/asyncio.html)

---

**🎉 Happy Trading! Remember: Always start with paper trading and never risk more than you can afford to lose.**

*Built with ❤️ using Claude Code*