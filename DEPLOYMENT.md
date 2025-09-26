# 🚀 Deployment Guide - AI Trading Bot

## 🌐 Vercel Deployment (Recommended)

### **Prerequisites**
- GitHub account
- Vercel account (free tier available)
- API keys configured

### **Step 1: Push to GitHub**
```bash
# Commit all changes
git add .
git commit -m "Ready for deployment"

# Push to GitHub
git push origin main
```

### **Step 2: Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your `ai-Trader` repository

### **Step 3: Environment Variables**
Add these environment variables in Vercel dashboard:

**Required:**
```
ALPACA_API_KEY_ID=PKZOA0NRY3QYX6N04X7E
ALPACA_API_SECRET_KEY=2zPcmhcYvT2QtQcNsra8QIVALEvwKPcCk6pwSmEe
APCA_API_BASE_URL=https://paper-api.alpaca.markets
```

**AI Providers:**
```
ANTHROPIC_API_KEY=your_claude_key_here
OPENAI_API_KEY=your_openai_key_here (optional)
```

**Safety Settings:**
```
ENVIRONMENT=production
FORCE_PAPER_TRADING=true
TRADING_MODE=paper
```

### **Step 4: Deploy**
- Vercel will automatically deploy when you push to GitHub
- First deployment takes ~2-3 minutes
- Your app will be available at: `https://your-app.vercel.app`

---

## 🔧 Configuration Manager

The app automatically detects environment and loads appropriate settings:

### **Local Development**
```json
{
  "name": "local",
  "trading_mode": "paper",
  "debug": true,
  "max_risk": 1000
}
```

### **Production (Vercel)**
```json
{
  "name": "production",
  "trading_mode": "paper_only",
  "debug": false,
  "max_risk": 500,
  "force_paper": true
}
```

---

## 🔐 Security Features

### **Automatic Safety**
- ✅ **Paper Trading Enforced**: All environments default to paper trading
- ✅ **Production Detection**: Automatically detects Vercel deployment
- ✅ **Risk Limits**: Lower limits in production
- ✅ **Secret Management**: API keys from environment variables only

### **Environment Separation**
- **Local**: `.env` file + `config/environments/local.json`
- **Production**: Vercel env vars + `config/environments/production.json`

---

## 🌐 Available Endpoints

Once deployed, your app will have these endpoints:

### **Main Interfaces**
- `/` - Main dashboard
- `/ai-chat-enhanced` - Enhanced AI chat interface
- `/supervisor` - Human oversight dashboard

### **API Endpoints**
- `/api/ai-query?query=YOUR_QUESTION` - AI query endpoint
- `/api/health` - Health check
- `/api/portfolio/positions` - Portfolio data

### **WebSocket**
- `/ws/ai-enhanced` - Real-time AI chat

---

## 📱 Mobile Optimization

The interfaces are responsive and work well on:
- 📱 **Mobile phones**: Touch-optimized controls
- 💻 **Tablets**: Optimized layouts
- 🖥️ **Desktop**: Full feature set

---

## 🔄 Automatic Updates

### **GitHub Integration**
- Push to `main` branch triggers automatic deployment
- Zero-downtime deployments
- Rollback capability

### **Monitoring**
- Vercel provides built-in analytics
- Real-time deployment logs
- Performance monitoring

---

## 🛠️ Local Development

### **Start Development Server**
```bash
# Use the launcher
launch_ai_suite.bat

# Or manually
python main.py dashboard
python -m streamlit run streamlit_ai_interface.py --server.port 8501
```

### **Environment Setup**
```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit with your API keys
notepad .env
```

---

## 🚨 Troubleshooting

### **Common Issues**

**Deployment Fails**
- Check all environment variables are set
- Verify API keys are valid
- Check Vercel build logs

**AI Not Responding**
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key has sufficient credits
- Try the local fallback

**Trading Errors**
- Confirm `ALPACA_API_KEY_ID` and `ALPACA_API_SECRET_KEY` are correct
- Verify using paper trading endpoint
- Check market hours (trading only during market hours)

### **Debug Commands**
```bash
# Check configuration
python -c "from src.config_manager import config; print(config.config)"

# Test AI connection
python -c "from src.unified_ai_engine import ai_engine; print('AI OK')"

# Verify environment
python -c "import os; print(f'ENV: {os.getenv(\"ENVIRONMENT\", \"local\")}')"
```

---

## 🎯 Performance Optimization

### **Vercel Optimization**
- Functions automatically scale
- Global CDN distribution
- Automatic HTTPS/SSL

### **Local Optimization**
- Run multiple interfaces simultaneously
- Background processes for real-time data
- Efficient WebSocket connections

---

## 📊 Monitoring & Analytics

### **Built-in Metrics**
- Portfolio performance tracking
- AI query analytics
- Trade execution monitoring

### **Vercel Analytics**
- Request volume and latency
- Geographic distribution
- Error rates and uptime

---

## 🔄 Backup & Recovery

### **Code Backup**
- All code in GitHub repository
- Automatic version history
- Easy rollback capability

### **Configuration Backup**
- Environment configs in version control
- API keys stored securely in Vercel
- Easy to migrate between environments

---

**🎉 Your AI Trading Bot is now ready for global deployment!**

Deploy to Vercel and start intelligent trading from anywhere in the world.