# PaiiD Trading Platform

**Personal Artificial Intelligence Investment Dashboard** - A full-stack AI-powered trading platform with an intuitive 10-stage radial workflow interface, real-time market data, and intelligent trade execution.

## 🚀 Live Deployment

- **Frontend**: https://paiid-snowy.vercel.app
- **Backend API**: https://paiid-86a1.onrender.com

## 📊 Current Project State (Commit 5855bb5)

### ✅ Working Features

1. **D3.js Radial Navigation Menu**
   - 8 interactive pie-wedge segments
   - Hover effects with segment expansion
   - Click-to-activate workflow switching
   - Native React/D3 implementation (no iframes)

2. **Morning Routine Workflow**
   - Automated health checks for backend API
   - `/api/health` endpoint status
   - `/api/settings` configuration check
   - `/api/portfolio/positions` data validation
   - Response time monitoring

3. **Active Positions Workflow**
   - Live portfolio positions table
   - Real-time P&L calculations
   - 3 summary cards: Total P&L, Cost Basis, Market Value
   - 7-column enhanced table with color-coded profits/losses
   - Auto-refresh every 30 seconds
   - Currently displaying: AAPL +$17.60 position

4. **Execute Trade Workflow**
   - Order form with symbol, quantity, side (buy/sell)
   - Direct API integration to `/api/trades/execute`
   - Order type selection (market/limit)
   - Real-time order submission

5. **Full-Screen Centered Layout**
   - Header with gradient branding
   - Centered radial menu (600px max width)
   - System Status panel with live indicator
   - Dynamic workflow content area
   - Keyboard navigation hints
   - Glassmorphism dark theme design

### 🚧 Placeholder Workflows (Coming Soon)

- **P&L Dashboard**: Profit/loss analytics and performance metrics
- **News Review**: Market news aggregation with sentiment analysis
- **AI Recommendations**: ML-generated trade signals and confidence scores
- **Strategy Builder**: Visual rule designer for custom trading strategies
- **Backtesting**: Historical strategy simulation and optimization

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 14.2.33 (Pages Router)
- **Language**: TypeScript 5.9.2
- **Visualization**: D3.js 7.9.0
- **UI**: React 18.3.1
- **Styling**: Inline styles with CSS-in-JS, dark theme (#0f172a, #1f2937)
- **Deployment**: Vercel

### Backend Stack
- **Framework**: FastAPI (Python)
- **Broker Integration**: Alpaca Trading API
- **Deployment**: Render
- **Endpoints**: RESTful API with `/api/proxy` reverse proxy

### API Proxy Pattern
Frontend routes all backend requests through `/api/proxy/[...path]` to avoid CORS issues:
```
Frontend: /api/proxy/api/health
Backend:  https://paiid-86a1.onrender.com/api/health
```

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 20+ and npm
- Python 3.11+
- Git
- Alpaca API keys (for backend)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend runs at http://localhost:8000

### Environment Variables

**Frontend** (`.env.local`):
```env
# No environment variables required - API proxy handles routing
```

**Backend** (`.env`):
```env
ALPACA_API_KEY=your_api_key_here
ALPACA_SECRET_KEY=your_secret_key_here
ALPACA_BASE_URL=https://paper-api.alpaca.markets  # or live
```

## 📁 Project Structure

```
PaiiD/
├── frontend/
│   ├── components/
│   │   ├── RadialMenu.tsx          # D3.js radial navigation (8 segments)
│   │   ├── PositionsTable.tsx      # Enhanced positions with P&L cards
│   │   ├── MorningRoutine.tsx      # Health check workflow
│   │   └── ExecuteTradeForm.tsx    # Order execution form
│   ├── pages/
│   │   ├── index.tsx               # Main dashboard with radial menu
│   │   ├── test-radial.tsx         # Isolated radial menu test page
│   │   └── api/
│   │       └── proxy/[...path].ts  # Backend API proxy
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json                 # Vercel deployment config
├── backend/
│   ├── main.py                     # FastAPI application
│   ├── requirements.txt
│   └── [additional backend files]
├── README.md                       # This file
├── ROADMAP.md                      # Development roadmap
├── COMPONENT_ARCHITECTURE.md       # Technical architecture docs
└── API_DOCUMENTATION.md            # API endpoint reference
```

## 🚀 Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Deploy automatically on every push to `main`

**Deployment URL**: https://paiid-snowy.vercel.app

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (Alpaca API keys)

**API URL**: https://paiid-86a1.onrender.com

## 🐛 Troubleshooting

### Common Issues

1. **Favicon 404 Error**
   - This is cosmetic and can be ignored
   - Add `public/favicon.ico` to frontend if desired

2. **API Proxy Not Working**
   - Ensure backend is running on Render
   - Check browser DevTools Network tab for proxy errors
   - Verify `/api/proxy/api/health` returns 200

3. **D3 Radial Menu Not Rendering**
   - Check browser console for D3.js errors
   - Ensure `d3` and `@types/d3` are installed: `npm install`
   - Clear `.next` cache: `rm -rf frontend/.next`

4. **Build Errors on Vercel**
   - Check for TypeScript errors locally: `npm run build`
   - Verify no duplicate CSS properties (previous issue)
   - Review Vercel deployment logs

5. **Positions Table Showing -100% P&L**
   - Fixed in current version (commit 5855bb5)
   - Backend returns `marketPrice` field correctly
   - Field mapping prioritizes `marketPrice` over `currentPrice`

## 📚 Documentation

- [Development Roadmap](./ROADMAP.md) - Detailed specs for 5 remaining workflows
- [Component Architecture](./COMPONENT_ARCHITECTURE.md) - Technical implementation guide
- [API Documentation](./API_DOCUMENTATION.md) - Complete endpoint reference

## 🔐 Security Notes

- Never commit `.env` files with real API keys
- Use Alpaca Paper Trading API for development
- Production deployment uses environment variables on Render
- Content Security Policy (CSP) headers prevent iframe injection

## 🎯 Next Steps

See [ROADMAP.md](./ROADMAP.md) for detailed implementation plans for:

1. P&L Dashboard with historical charts
2. News Review with sentiment analysis
3. AI Recommendations with ML signals
4. Strategy Builder with visual designer
5. Backtesting engine with optimization

## 📝 Recent Changes (Commit 5855bb5)

- Fixed TypeScript build errors (duplicate CSS properties)
- Verified production deployment
- Enhanced PositionsTable with summary cards
- Improved dark theme consistency
- Added comprehensive documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-workflow`
3. Make changes and test locally
4. Build successfully: `cd frontend && npm run build`
5. Commit with descriptive messages
6. Push and create a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues, questions, or feature requests, please open a GitHub issue.

---

**Built with Claude Code** 🤖
