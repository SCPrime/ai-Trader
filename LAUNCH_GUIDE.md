# 🚀 AI Trading Bot - Launch Guide

## 🎯 **Quick Start Options**

### **🖱️ One-Click Launch (Windows)**
```bash
# Full AI suite with multiple interfaces
launch_ai_suite.bat

# Single dashboard only
run_local.bat
```

### **⌨️ Command Line Options**
```bash
# Linux/Mac - Full suite
./launch_ai_suite.sh

# Linux/Mac - Single dashboard
./run_local.sh

# Manual launch
python main.py dashboard
```

---

## 🌐 **Available Interfaces**

| Interface | URL | Description |
|-----------|-----|-------------|
| **🤖 Enhanced AI Chat** | `http://localhost:8000/ai-chat-enhanced` | Professional GitHub-style UI with Claude AI |
| **📊 Unified Dashboard** | `http://localhost:8501` | Streamlit app with Chat/Analytics/Charts tabs |
| **💬 Standalone Chat** | `http://localhost:8502` | Dedicated AI chat with metrics sidebar |
| **🔧 Main Dashboard** | `http://localhost:8002` | Core FastAPI dashboard with supervisor |
| **🔌 REST API** | `http://localhost:8000/api/ai-query` | Direct API access for integrations |

---

## 🎛️ **Launch Scripts Explained**

### **`launch_ai_suite.bat` / `launch_ai_suite.sh`**
- **Purpose**: Starts complete AI trading suite
- **Includes**:
  - Main FastAPI dashboard (port 8002)
  - Unified Streamlit interface (port 8501)
  - All AI features active
- **Best For**: Full development and testing

### **`run_local.bat` / `run_local.sh`**
- **Purpose**: Minimal local setup
- **Includes**:
  - Main dashboard only (port 8002)
  - Environment validation
  - Safety checks
- **Best For**: Quick testing and production-like environment

---

## ⚙️ **Environment Configuration**

### **Automatic Detection**
- **Local**: Uses `.env` file + `config/environments/local.json`
- **Production**: Uses Vercel env vars + `config/environments/production.json`

### **Safety Features**
- ✅ **Paper Trading Enforced**: All environments default to paper trading
- ✅ **Environment Validation**: Checks for required API keys
- ✅ **Risk Limits**: Automatically applied based on environment

---

## 🔧 **Development Workflow**

### **Standard Development**
```bash
# 1. Start full suite for development
launch_ai_suite.bat

# 2. Access different interfaces as needed
# Main: http://localhost:8002
# AI Chat: http://localhost:8000/ai-chat-enhanced
# Streamlit: http://localhost:8501
```

### **Quick Testing**
```bash
# 1. Start minimal setup
run_local.bat

# 2. Access main dashboard
# http://localhost:8002
```

### **Production Simulation**
```bash
# 1. Set production environment
set ENVIRONMENT=production

# 2. Start with production config
run_local.bat
```

---

## 🌐 **Deployment Options**

### **Local Development**
- Use launch scripts above
- Full feature access
- Real-time code changes

### **Vercel Production**
1. Push to GitHub: `git push origin main`
2. Connect to Vercel
3. Add environment variables
4. Automatic deployment
5. Access at: `https://your-app.vercel.app`

---

## 🎯 **Which Option to Choose?**

### **For Development**
- **`launch_ai_suite.bat`** - Complete development environment
- Access multiple interfaces simultaneously
- Full AI features with real-time testing

### **For Quick Testing**
- **`run_local.bat`** - Fast startup with core features
- Single interface focus
- Production-like environment

### **For Production**
- **Vercel Deployment** - Global, scalable deployment
- Automatic HTTPS and CDN
- Environment variable management

---

## 🚨 **Troubleshooting**

### **Common Issues**

**Scripts won't run**
- Check Python is installed and in PATH
- Verify all dependencies: `pip install -r requirements.txt`
- Ensure `.env` file exists with API keys

**Ports already in use**
- Check what's running: `netstat -an | findstr ":850"`
- Kill existing processes: `taskkill /f /im python.exe`
- Restart with launch script

**AI not responding**
- Verify `ANTHROPIC_API_KEY` in `.env`
- Check API key has sufficient credits
- Try local fallback responses

### **Validation Commands**
```bash
# Check environment
python -c "from src.config_manager import config; print(f'Environment: {config.environment}')"

# Test AI connection
python -c "from src.unified_ai_engine import ai_engine; print('AI Engine OK')"

# Verify paper trading
python -c "from src.config_manager import config; print(f'Trading Mode: {config.config[\"trading_mode\"]}')"
```

---

## 📊 **Performance Tips**

### **Optimal Local Setup**
- Use SSD for faster startup
- Close unnecessary browser tabs
- Allocate sufficient RAM (4GB+ recommended)

### **Network Optimization**
- Stable internet for AI API calls
- Low latency for real-time data
- Backup connection for reliability

---

## 🎉 **Success Indicators**

### **Successful Launch**
- ✅ No error messages in console
- ✅ Web interfaces accessible
- ✅ AI responds to test queries
- ✅ Paper trading mode confirmed

### **Ready for Trading**
- ✅ API keys validated
- ✅ Market data updating
- ✅ Strategy signals generating
- ✅ Risk management active

---

**🚀 Choose your launch method and start intelligent trading!**

**Recommended for beginners**: `launch_ai_suite.bat`
**Recommended for production**: Vercel deployment