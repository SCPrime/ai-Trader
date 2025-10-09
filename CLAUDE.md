# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PaiiD (Personal Artificial Intelligence Investment Dashboard)** - A full-stack AI-powered trading application with real-time market data, intelligent trade execution, and a 10-stage radial workflow interface. Integrates with Alpaca Paper Trading API for real-time portfolio management and Claude AI for conversational onboarding and strategy building.

**Live Deployments:**
- Frontend: https://ai-trader-snowy.vercel.app (Vercel)
- Backend: https://ai-trader-86a1.onrender.com (Render)

## Architecture

### Monorepo Structure
- `frontend/` - Next.js 14 (Pages Router) + TypeScript + D3.js
- `backend/` - FastAPI (Python) + Alpaca Trading API
- Proxy pattern: Frontend routes backend requests through `/api/proxy/[...path]` to avoid CORS

### Key Technologies
**Frontend:**
- Next.js 14.2.33 (Pages Router, NOT App Router)
- TypeScript 5.9.2
- D3.js 7.9.0 for radial menu visualization
- Anthropic SDK for AI chat features
- No CSS framework - uses inline styles with glassmorphism dark theme

**Backend:**
- FastAPI with uvicorn
- Alpaca Trading API (alpaca-py>=0.21.0)
- Anthropic API for AI recommendations
- APScheduler for automated tasks
- Redis for caching (optional)

## Development Commands

### Frontend (from `frontend/` directory)
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (required before deployment)
npm start            # Production server
npm run test         # Run Jest tests in watch mode
npm run test:ci      # Run tests with coverage
```

### Backend (from `backend/` directory)
```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001

# Note: Backend runs on port 8001 (not 8000)
# Entry point: backend/app/main.py
```

### Environment Variables

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_TOKEN=rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl
NEXT_PUBLIC_BACKEND_API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_ANTHROPIC_API_KEY=<your-key>
```

**Backend `.env`:**
```env
API_TOKEN=rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl
ALPACA_PAPER_API_KEY=<your-key>
ALPACA_PAPER_SECRET_KEY=<your-secret>
ALLOW_ORIGIN=http://localhost:3000
```

## Critical Architecture Details

### Frontend Routing Pattern
- Main dashboard: `pages/index.tsx` (NOT `app/page.tsx`)
- API proxy: `pages/api/proxy/[...path].ts`
- All backend calls go through proxy: `/api/proxy/api/<endpoint>`

### Component Architecture
1. **RadialMenu** (`components/RadialMenu.tsx`):
   - 10 pie-wedge segments using D3.js arc generators
   - Center logo with live market data (SPY/QQQ)
   - Workflow selection triggers split-screen layout

2. **Split-Screen Layout** (`pages/index.tsx`):
   - Left panel: Scaled radial menu (0.5x) + logo header
   - Right panel: Dynamic workflow content
   - Uses `react-split` for resizable panels

3. **Workflow Components** (10 total):
   - Morning Routine: `MorningRoutineAI.tsx`
   - Active Positions: `ActivePositions.tsx`
   - Execute Trade: `ExecuteTradeForm.tsx`
   - Research: `MarketScanner.tsx`
   - AI Recommendations: `AIRecommendations.tsx`
   - P&L Dashboard: `Analytics.tsx`
   - News Review: `NewsReview.tsx`
   - Strategy Builder: `StrategyBuilderAI.tsx`
   - Backtesting: `Backtesting.tsx`
   - Settings: `Settings.tsx`

4. **User Onboarding** (`UserSetupAI.tsx`):
   - AI-guided conversational setup (default)
   - Manual 8-page form fallback (imports `UserSetup.tsx` via require)
   - Stores ONLY trading preferences in localStorage (no personal info)
   - Triggers on first load when `localStorage.getItem('user-setup-complete')` is null

### Backend API Structure
- Entry point: `backend/app/main.py`
- Routers in `backend/app/routers/`:
  - `health.py` - Health checks
  - `portfolio.py` - Positions and account data
  - `orders.py` - Trade execution
  - `market.py` - Market data and quotes
  - `ai.py` - AI recommendations
  - `claude.py` - Claude chat endpoints
  - `strategies.py` - Strategy management
  - `scheduler.py` - Scheduled tasks
  - `telemetry.py` - Event tracking

### Data Flow
1. **Live Data Sources**:
   - Account/Positions: Alpaca Paper Trading API
   - Market Data: Alpaca quotes API (`/api/market/indices`)
   - AI Recommendations: Backend `/api/ai/recommendations`

2. **NO Mock Data**:
   - All data is real or user-generated
   - Components show errors if backend unavailable
   - Historical P&L in Analytics is calculated (Alpaca doesn't provide history)

3. **User Preferences**:
   - Stored in localStorage only
   - NO personal information (name, email removed)
   - Keys: `user-setup-complete`, `trading-preferences`, `watchlist`

## Important Conventions

### Styling
- NO CSS-in-JS libraries or Tailwind
- All styles are inline React style objects
- Dark theme colors: `#0f172a`, `#1f2937`, `#1e293b`
- Glassmorphism effects: `background: rgba(15, 23, 42, 0.6)`, `backdrop-filter: blur(10px)`

### Logo Branding (CRITICAL)
The "PaiiD" logo has specific color requirements (ALL letters use teal + green):
- **P**: Teal gradient `linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)` with drop-shadow
- **a**: Teal gradient `linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)`
- **aii**: Teal gradient `linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)` with GREEN animated glow (`rgba(16, 185, 129, ...)`, 3s infinite)
- **D**: Teal gradient `linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)` with drop-shadow
- Subtitle 1: "Personal artificial intelligence investment Dashboard" (#cbd5e1, 22px)
- Subtitle 2: "10 Stage Workflow" (#94a3b8, 18px)

Logo appears in 3 places:
1. Main screen (`RadialMenu.tsx` lines 529-546)
2. Center of radial menu (42px size)
3. Split-screen left panel header (`index.tsx` lines 318-336)

### TypeScript Patterns
- Use `interface` for props, `type` for unions
- All components are functional with hooks
- Avoid `any` - use proper typing or `unknown`
- Export interfaces used across files

### State Management
- NO Redux or external state libraries
- Uses React `useState` and `useEffect`
- localStorage for user preferences
- Backend maintains session state via API token

## Common Pitfalls

1. **Port Confusion**: Backend runs on port 8001, not 8000
2. **Endpoint Paths**: Use `/api/positions` NOT `/api/portfolio/positions`
3. **API Token**: Must match between frontend and backend env vars
4. **Build Errors**: Run `npm run build` locally before pushing (Vercel fails on TS errors)
5. **Fast Refresh Loops**: Avoid infinite re-renders in useEffect by proper dependency arrays
6. **Logo Colors**: Never change logo colors without explicit approval
7. **Pages Router**: This is NOT Next.js App Router - files go in `pages/` not `app/`

## Testing Strategy

### Frontend Tests
```bash
cd frontend
npm run test         # Watch mode for development
npm run test:ci      # CI mode with coverage
```

- Uses Jest + @testing-library/react
- Test files: `__tests__/` or `*.test.tsx`
- Mock API calls in tests

### Backend Testing
- No automated tests currently configured
- Manual testing via:
  - Health check: `curl http://127.0.0.1:8001/api/health`
  - Account: `curl -H "Authorization: Bearer rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl" http://127.0.0.1:8001/api/account`
  - Positions: `curl -H "Authorization: Bearer rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl" http://127.0.0.1:8001/api/positions`

## Deployment

### Frontend (Vercel)
- Auto-deploys from `main` branch
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `.next`
- No environment variables needed (API proxy handles routing)

### Backend (Render)
- Auto-deploys from `main` branch
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment Variables: Must set `API_TOKEN`, `ALPACA_PAPER_API_KEY`, `ALPACA_PAPER_SECRET_KEY`

## Key Files Reference

### Frontend Entry Points
- `pages/index.tsx` - Main dashboard with radial menu and split-screen
- `pages/_app.tsx` - Global layout and providers
- `components/RadialMenu.tsx` - D3.js radial navigation menu
- `lib/alpaca.ts` - Alpaca API client functions
- `lib/aiAdapter.ts` - Anthropic AI adapter

### Backend Entry Points
- `app/main.py` - FastAPI app initialization and router registration
- `app/core/config.py` - Settings and environment variable loading
- `app/routers/market.py` - Market data endpoints (includes `/api/market/indices`)
- `app/routers/portfolio.py` - Portfolio and positions endpoints

### Configuration Files
- `frontend/next.config.js` - Next.js configuration
- `frontend/tsconfig.json` - TypeScript compiler options
- `backend/requirements.txt` - Python dependencies
- `.env` files - Local environment variables (NOT committed)

## Security Notes

- Uses Alpaca Paper Trading API by default (NO real money)
- API token authentication for backend
- CORS configured for specific origins
- NO personal information stored (privacy-first design)
- All credentials in environment variables, never hardcoded

## Troubleshooting

### "API key not configured" errors
- Check `.env.local` has `NEXT_PUBLIC_ANTHROPIC_API_KEY`
- Restart Next.js dev server to reload env vars

### Positions not loading
- Verify backend is running on port 8001
- Check network tab for 404 errors on `/api/proxy/api/positions`
- Confirm API token matches in both frontend and backend

### Build failures on Vercel
- Run `npm run build` locally first
- Check for TypeScript errors
- Ensure no duplicate CSS properties in inline styles

### Radial menu not rendering
- Clear Next.js cache: `rm -rf frontend/.next`
- Check browser console for D3.js errors
- Verify `d3` and `@types/d3` are installed

## Documentation Files

- `README.md` - Project overview and setup
- `DATA_SOURCES.md` - Explains real vs calculated data
- `IMPLEMENTATION_STATUS.md` - Current implementation checklist
- `instructions/` - Detailed implementation specs (15+ markdown files)