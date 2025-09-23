# 🚀 Quick Start Guide - AI Trading Bot Dashboard

## ✅ **Dashboard is Now Running!**

Your AI Trading Bot Dashboard is successfully running at:
**http://localhost:8000** or **http://127.0.0.1:8000**

## 🎯 **Current Status**

✅ **Dashboard Server**: Running successfully
✅ **Web Interface**: Fully functional
✅ **Configuration File**: Created (.env)
⚠️ **API Keys**: Need to be configured for full functionality

## 📋 **Next Steps to Enable Full Features**

### 1. **Get API Keys**

#### **Alpaca Trading API** (Required for real trading)
1. Go to [Alpaca Markets](https://alpaca.markets/)
2. Sign up for a free account
3. Get your Paper Trading API keys (safe for testing)
4. Later, get Live Trading keys (for real money)

#### **Anthropic Claude AI** (Optional but recommended)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up and get your API key
3. This enables AI-powered trade analysis

### 2. **Configure Your API Keys**

Edit the `.env` file in your project directory:

```bash
# Open .env file and replace these values:

# Alpaca API (get from alpaca.markets)
ALPACA_API_KEY=your_actual_alpaca_api_key_here
ALPACA_SECRET_KEY=your_actual_alpaca_secret_key_here
ALPACA_PAPER_TRADING=true  # Keep as true for safe testing

# AI Analysis (get from console.anthropic.com)
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

### 3. **Restart the Dashboard**

After adding your API keys:
1. Stop the current dashboard (Ctrl+C in the terminal)
2. Restart with: `python start_dashboard.py`

## 🌟 **What You Can Do Right Now**

Even without API keys, you can explore all features with demo data:

### **📊 Interactive Charts**
- Enter any symbol (AAPL, TSLA, MSFT) and click "Load"
- View candlestick charts with technical indicators
- See RSI, MACD, moving averages, and more

### **🤖 AI Analysis**
- Click "Get AI Analysis" for any symbol
- See simulated AI recommendations
- View confidence scores and reasoning

### **💼 Portfolio Monitoring**
- View demo portfolio value and positions
- Monitor P&L and performance metrics
- Track buying power and cash allocation

### **⚡ Trading Controls**
- Test buy/sell functionality with demo trades
- Toggle between paper and live trading modes
- Switch AI auto/manual modes

### **📈 Real-time Features**
- Live updates via WebSockets
- Real-time portfolio monitoring
- Instant notifications for actions

## 🔧 **Dashboard Features Guide**

### **Navigation Bar**
- **Paper/Live Toggle**: Switch trading modes (always starts in paper)
- **AI Auto/Manual**: Enable/disable AI-driven trading
- **Connection Status**: Shows real-time connection status

### **Dashboard Cards**
- **Portfolio Value**: Total account worth with daily changes
- **Buying Power**: Available cash for new trades
- **Active Positions**: Number of open positions
- **System Health**: Overall bot health status

### **Chart Panel**
- **Symbol Input**: Enter any stock ticker
- **Interactive Charts**: Zoom, pan, and analyze
- **Technical Indicators**: Multiple indicators overlay

### **Control Panels**
- **AI Analysis**: Get recommendations for any symbol
- **Quick Trade**: Place buy/sell orders instantly
- **Technical Indicators**: Live indicator values

### **Data Tables**
- **Current Positions**: All open trades with P&L
- **Recent Orders**: Trade history and status

## 🛠️ **Commands Reference**

```bash
# Start the dashboard
python start_dashboard.py

# Start demo dashboard (no config needed)
python demo_dashboard.py

# Check if server is running
curl http://localhost:8000/api/health
```

## 🔒 **Safety Features**

- **Paper Trading Default**: Always starts in safe paper trading mode
- **Demo Data**: Works without real API keys
- **No Real Money**: Demo mode uses simulated trades only
- **API Key Protection**: Sensitive data never exposed to frontend

## 📚 **Learning the Interface**

1. **Start with Demo**: Explore all features without risk
2. **Load Charts**: Try different symbols (AAPL, TSLA, MSFT)
3. **Test AI Analysis**: See how AI recommendations work
4. **Practice Trading**: Use demo buy/sell buttons
5. **Configure APIs**: Add real keys when ready

## 🆘 **Troubleshooting**

### **Dashboard won't load**
- Check if server is running: `python start_dashboard.py`
- Try: http://localhost:8000 or http://127.0.0.1:8000

### **Charts not showing**
- Make sure you clicked "Load" after entering a symbol
- Check browser console for any JavaScript errors

### **API errors**
- Check your .env file has correct API keys
- Verify Alpaca account is active
- Ensure paper trading is enabled for testing

## 🎉 **You're All Set!**

Your AI Trading Bot Dashboard is ready to use! Start exploring the interface and when you're ready to connect real APIs, just add your keys to the .env file.

**Happy Trading!** 📈🤖