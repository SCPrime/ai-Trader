# 🌐 AI Trading Bot Dashboard

A comprehensive web-based dashboard for monitoring and controlling your AI Trading Bot with real-time charts, portfolio analytics, and trading controls.

## ✨ Features

### 📊 Interactive Charts
- **Candlestick Charts**: Real-time price visualization with OHLCV data
- **Technical Indicators**: RSI, MACD, SMA, EMA, Bollinger Bands, Stochastic, Williams %R, ADX, VWAP, and more
- **Multiple Timeframes**: 1min, 5min, 15min, 1hour, 1day charts
- **Zoom & Pan**: Interactive chart navigation with Plotly.js

### 💼 Portfolio Management
- **Real-time Portfolio Value**: Live updates of total portfolio worth
- **Position Monitoring**: Current holdings with P&L tracking
- **Buying Power**: Available cash for new positions
- **Performance Metrics**: Daily changes and portfolio analytics

### 🤖 AI Integration
- **AI Analysis**: Get Claude AI recommendations for any symbol
- **Auto/Manual Mode**: Toggle between AI-driven and manual trading
- **Confidence Scoring**: AI recommendation confidence levels
- **Risk Assessment**: AI-powered risk factor analysis

### ⚡ Trading Controls
- **Paper/Live Toggle**: Switch between paper and live trading modes
- **Quick Trade**: Place buy/sell orders directly from the dashboard
- **Position Management**: Close positions with one click
- **Order History**: View recent trade activity

### 📈 Real-time Monitoring
- **WebSocket Updates**: Live data streaming without page refresh
- **System Health**: Monitor bot performance and API connectivity
- **Notifications**: Toast notifications for trades and system events
- **Connection Status**: Real-time connection indicator

## 🚀 Getting Started

### Option 1: Demo Mode (No API Keys Required)
```bash
# Run the demo dashboard with mock data
python demo_dashboard.py
```

### Option 2: Full Dashboard (Requires API Configuration)
```bash
# Start the full dashboard with your configuration
python main.py dashboard --host 0.0.0.0 --port 8000
```

### Option 3: Production Deployment
```bash
# Using the systemd service (after installation)
sudo systemctl start ai-trader
# Dashboard available at http://your-server:8000
```

## 🎯 Dashboard Sections

### 1. Navigation Bar
- **Trading Mode Toggle**: Switch between Paper/Live trading
- **AI Mode Toggle**: Enable/disable AI auto-trading
- **Connection Status**: Real-time WebSocket connection indicator

### 2. Dashboard Cards
- **Portfolio Value**: Total account value with daily change
- **Buying Power**: Available cash for trading
- **Active Positions**: Number of open positions
- **System Health**: Overall bot health status

### 3. Main Chart Panel
- **Symbol Input**: Enter any stock symbol (AAPL, TSLA, etc.)
- **Interactive Chart**: Candlestick chart with multiple indicators
- **Technical Analysis**: Visual indicators overlaid on price data

### 4. Control Panels

#### AI Analysis Panel
- **Get Analysis Button**: Request AI analysis for current symbol
- **Recommendation Display**: BUY/SELL/HOLD with confidence
- **Reasoning**: Detailed AI analysis explanation
- **Suggested Actions**: Specific trading recommendations

#### Quick Trade Panel
- **Symbol**: Stock symbol to trade
- **Quantity**: Number of shares
- **Order Type**: Market or Limit orders
- **Buy/Sell Buttons**: Execute trades directly

#### Technical Indicators Panel
- **Real-time Values**: Current indicator readings
- **Signal Interpretation**: Bullish/Bearish/Neutral signals
- **Color Coding**: Visual signal strength indicators

### 5. Data Tables

#### Current Positions
- **Symbol**: Stock ticker
- **Quantity**: Number of shares held
- **Market Value**: Current position value
- **P&L**: Profit/Loss with percentage
- **Actions**: Quick close position button

#### Recent Orders
- **Time**: Order execution time
- **Symbol**: Stock ticker
- **Side**: Buy or Sell
- **Quantity**: Number of shares
- **Status**: Order status (filled, pending, etc.)

## 🛠️ Technical Architecture

### Frontend Technologies
- **HTML5 & CSS3**: Modern responsive design
- **Bootstrap 5**: Mobile-first UI framework
- **JavaScript ES6+**: Interactive functionality
- **Plotly.js**: High-performance charting library
- **WebSockets**: Real-time data streaming

### Backend Technologies
- **FastAPI**: High-performance Python web framework
- **WebSocket Support**: Real-time bidirectional communication
- **Jinja2 Templates**: Server-side rendering
- **Async/Await**: Non-blocking I/O operations

### Data Flow
1. **Client Request**: Browser requests chart data for symbol
2. **Data Fetch**: Server fetches OHLCV data from Alpaca API
3. **Indicator Calculation**: Technical indicators computed server-side
4. **Chart Generation**: Plotly chart created with all indicators
5. **JSON Response**: Chart data sent to client as JSON
6. **Rendering**: Client renders interactive chart with Plotly.js

### Real-time Updates
- **WebSocket Connection**: Persistent connection for live updates
- **Periodic Data**: Account and position updates every 30 seconds
- **Event-driven**: Immediate updates for trades and mode changes
- **Auto-reconnect**: Automatic reconnection on connection loss

## 📱 Mobile Responsiveness

The dashboard is fully responsive and works on:
- **Desktop**: Full feature set with large charts
- **Tablets**: Optimized layout with touch controls
- **Mobile**: Compact view with essential features

## 🔧 Configuration

### Environment Variables
```bash
# Dashboard specific settings
API_HOST=0.0.0.0
API_PORT=8000
ENABLE_WEBSOCKETS=true

# Trading configuration
ALPACA_PAPER_TRADING=true  # Start in paper mode
ENABLE_AI_ANALYSIS=true
```

### Security Features
- **No API Key Exposure**: Sensitive data never sent to frontend
- **Input Validation**: All user inputs validated server-side
- **CSRF Protection**: Built-in FastAPI security features
- **Rate Limiting**: Prevents API abuse

## 🎨 Customization

### Themes
The dashboard supports:
- **Light Mode**: Default clean interface
- **Dark Mode**: Automatic based on browser preference
- **Custom CSS**: Easy styling customization

### Chart Customization
- **Indicator Selection**: Enable/disable specific indicators
- **Color Schemes**: Customizable chart colors
- **Timeframe Options**: Multiple chart intervals
- **Layout Options**: Adjustable chart heights and arrangements

## 🐛 Troubleshooting

### Common Issues

1. **Dashboard not loading**
   ```bash
   # Check if server is running
   curl http://localhost:8000/api/health

   # Check logs
   tail -f logs/trading_bot.log
   ```

2. **Charts not displaying**
   - Ensure symbol exists and has market data
   - Check browser console for JavaScript errors
   - Verify API connectivity

3. **WebSocket connection failed**
   - Check firewall settings
   - Verify WebSocket support in browser
   - Check network connectivity

4. **Trade execution not working**
   - Verify API keys are configured
   - Check trading mode (paper vs live)
   - Ensure sufficient buying power

### Performance Optimization
- **Browser Cache**: Charts cached for better performance
- **Data Compression**: Gzip compression for large datasets
- **Lazy Loading**: Components loaded on demand
- **WebSocket Batching**: Multiple updates batched together

## 📊 Demo Features

The demo dashboard (`demo_dashboard.py`) includes:
- **Mock Data**: Realistic simulated market data
- **All Features**: Full functionality without API requirements
- **Educational**: Learn the interface without risk
- **Testing**: Validate changes before live deployment

## 🔮 Future Enhancements

Planned features for future releases:
- **Advanced Charting**: More technical indicators and drawing tools
- **Strategy Builder**: Visual strategy creation interface
- **Backtesting UI**: Interactive backtesting with results visualization
- **Multi-timeframe**: Simultaneous multiple timeframe analysis
- **Alerts Dashboard**: Custom alert creation and management
- **Performance Analytics**: Detailed trading performance reports
- **Mobile App**: Native mobile application
- **Collaboration**: Multi-user dashboard with role-based access

## 📄 API Documentation

The dashboard exposes a RESTful API:

### Endpoints
- `GET /`: Main dashboard page
- `GET /api/account`: Account information
- `GET /api/positions`: Current positions
- `GET /api/orders`: Recent orders
- `GET /api/chart/{symbol}`: Chart data with indicators
- `GET /api/health`: System health status
- `POST /api/trading/toggle`: Toggle trading mode
- `POST /api/ai/toggle`: Toggle AI mode
- `POST /api/trade/{symbol}`: Place trade order
- `GET /api/ai/analysis/{symbol}`: Get AI analysis

### WebSocket Events
- `periodic_update`: Regular account/position updates
- `trading_mode_changed`: Trading mode toggle notification
- `ai_mode_changed`: AI mode toggle notification
- `trade_placed`: New trade execution notification

## 🤝 Contributing

To contribute to the dashboard:
1. **Frontend**: Edit files in `src/web/static/`
2. **Backend**: Modify `src/web/dashboard.py`
3. **Templates**: Update `src/web/templates/`
4. **Testing**: Use `demo_dashboard.py` for development

## 📋 License

This dashboard is part of the AI Trading Bot project and follows the same license terms.