# VS Code Integration Guide - AI Trader Platform

**Project**: PaiD Trading Platform
**Date Created**: 2025-10-06
**Latest Commit**: 7cd4c15 - Backend authentication fixes and account balance filtering

---

## 🎯 Quick Start

### Open Project in VS Code
```bash
cd C:\Users\SSaint-Cyr\Documents\source\ai-Trader
code .
```

### Start Development Servers
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Access Application
- **Local Frontend**: http://localhost:3000
- **Local Backend**: http://localhost:8000
- **Production**: https://ai-trader-snowy.vercel.app

---

## 📁 Project Structure

```
ai-Trader/
├── frontend/                    # Next.js 14.2.33 React app
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx      # Theme-based button
│   │   │   ├── Card.tsx        # Glassmorphic card
│   │   │   ├── Input.tsx       # Themed input field
│   │   │   ├── Select.tsx      # Themed select dropdown
│   │   │   └── index.ts        # Exports all UI components
│   │   ├── MorningRoutine.tsx  # Pre-market analysis workflow
│   │   ├── NewsReview.tsx      # News feed with sentiment
│   │   ├── ExecuteTradeForm.tsx # Trade execution form
│   │   ├── AIRecommendations.tsx # AI trade suggestions
│   │   ├── PositionsTable.tsx  # Active positions display
│   │   ├── RadialMenu.tsx      # 10-segment navigation
│   │   └── Settings.tsx        # User settings modal
│   ├── pages/
│   │   ├── index.tsx           # Main dashboard (radial nav)
│   │   ├── _app.tsx            # App wrapper
│   │   └── api/
│   │       └── proxy/
│   │           └── [...path].ts # Backend API proxy
│   ├── styles/
│   │   ├── theme.ts            # Global theme system ⭐
│   │   └── globals.css
│   ├── lib/
│   │   └── userManagement.ts   # Session management
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── .env.local              # Frontend environment vars
│
├── backend/                     # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── core/
│   │   │   ├── auth.py         # require_bearer() auth
│   │   │   └── config.py       # Settings management
│   │   └── routers/
│   │       ├── health.py       # Health check
│   │       ├── settings.py     # User settings
│   │       ├── portfolio.py    # Portfolio positions
│   │       ├── orders.py       # Order management
│   │       ├── screening.py    # Opportunity screening ⭐
│   │       ├── market.py       # Market conditions ⭐
│   │       ├── stream.py       # WebSocket streaming
│   │       └── trading/        # Trading operations
│   ├── requirements.txt
│   └── .env                    # Backend environment vars
│
├── VSCODE_INTEGRATION_GUIDE.md # This file
└── README.md
```

⭐ = Recently updated/created files

---

## 🎨 Theme System Architecture

### Core Theme File
**Location**: `frontend/styles/theme.ts`

**Purpose**: Centralized design system matching glassmorphic radial menu aesthetic

**Key Features**:
- Glassmorphic backgrounds with blur effects
- Green (#10b981) primary accent color
- Multiple glow effects (green, teal, purple, orange, red)
- Consistent spacing, border radius, transitions
- Type-safe TypeScript definitions

**Usage Pattern**:
```typescript
import { theme } from '../styles/theme';
import { Card, Button } from './ui';

<Card glow="green" style={{ marginBottom: theme.spacing.lg }}>
  <Button variant="primary" size="md">
    Click Me
  </Button>
</Card>
```

### UI Component Library
**Location**: `frontend/components/ui/`

**Available Components**:
1. **Button** - 3 variants (primary, secondary, danger), 3 sizes, loading state
2. **Card** - Glassmorphic container with optional glow effects
3. **Input** - Themed text input with label and error handling
4. **Select** - Themed dropdown with label and error handling

**Import Pattern**:
```typescript
import { Card, Button, Input, Select } from './ui';
```

---

## 🔧 Recent Session Work (2025-10-06)

### Problem Solved
User reported: "filter for morning checks should be based on available investment dollars in the account, to present multiple investment options in the various categories. not seeing the various investments types shown/rendered"

### Changes Made

#### Backend (`backend/app/routers/`)

**1. Fixed Authentication** (screening.py:7, market.py:7)
```python
# CHANGED FROM:
from ..core.auth import require_api_token

# CHANGED TO:
from ..core.auth import require_bearer
```

**2. Added Account Balance Filtering** (screening.py:24-96)
```python
@router.get("/screening/opportunities", dependencies=[Depends(require_bearer)])
async def get_opportunities(max_price: float | None = None) -> dict:
    """
    Get strategy-based trading opportunities

    Args:
        max_price: Optional maximum price to filter opportunities
                   (based on available account balance)
    """
    # Filter opportunities by price
    if max_price is not None:
        opportunities = [opp for opp in all_opportunities
                       if opp.currentPrice <= max_price]
```

**3. Implemented Investment Type Diversity** (screening.py:99-108)
```python
# Ensure diverse investment types in results
type_groups = {"stock": [], "option": [], "multileg": []}
for opp in opportunities:
    type_groups[opp.type].append(opp)

diverse_opportunities = []
for opp_type in ["stock", "option", "multileg"]:
    if type_groups[opp_type]:
        diverse_opportunities.extend(type_groups[opp_type])
```

#### Frontend (`frontend/components/`)

**4. Updated MorningRoutine** (MorningRoutine.tsx:79-89)
```typescript
// Extract available cash from settings to filter opportunities
const settingsResult = out.find(r => r.name === 'settings');
const availableCash = settingsResult?.body?.buyingPower ||
                     settingsResult?.body?.cash || 10000;

const oppResult = await timedJson(
  `/api/proxy/screening/opportunities?max_price=${availableCash}`
);
```

**5. Fixed Webpack Cache Corruption**
```bash
Remove-Item -Recurse -Force .next,.swc,node_modules\.cache
npm run dev
```

### Git Commit
```bash
git commit -m "fix(backend): Fix authentication and add account balance filtering

- Fixed require_api_token → require_bearer in screening.py and market.py
- Added max_price parameter to /screening/opportunities endpoint
- Implemented investment type diversity logic (stock, option, multileg)
- Updated MorningRoutine to extract and pass available account balance
- All endpoints now working with proper authentication"

git push origin main  # ✅ Successfully pushed
```

---

## 🌐 API Endpoints

### Health & Settings
- `GET /api/health` - System health check
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

### Portfolio
- `GET /api/portfolio/positions` - Get current positions

### Trading
- `POST /api/trading/execute` - Execute trades (supports dry-run)

### Market Analysis (NEW - 2025-10-06)
- `GET /api/screening/opportunities?max_price=<float>` - Get filtered opportunities
- `GET /api/screening/strategies` - Get available screening strategies
- `GET /api/market/conditions` - Get current market conditions
- `GET /api/market/indices` - Get major market indices
- `GET /api/market/sectors` - Get sector performance data

### AI
- `GET /api/ai/recommendations` - Get AI-powered trade suggestions

---

## 🧪 Testing in VS Code

### Using Integrated Terminal

**1. Test Backend Health**
```bash
curl http://localhost:8000/api/health
```

**2. Test Screening Endpoint**
```bash
curl -H "Authorization: Bearer AKF6WG4GNJZWOSMX03EE" \
  "http://localhost:8000/api/screening/opportunities?max_price=250"
```

**Expected Response**:
```json
{
  "opportunities": [
    {
      "symbol": "AAPL",
      "type": "stock",
      "strategy": "Momentum Breakout",
      "currentPrice": 184.1,
      "targetPrice": 192.5,
      "confidence": 85,
      "risk": "medium"
    },
    {
      "symbol": "SPY 450C 30DTE",
      "type": "option",
      "currentPrice": 5.2,
      ...
    },
    {
      "symbol": "TSLA Iron Condor 240/250/270/280",
      "type": "multileg",
      "currentPrice": 250.0,
      ...
    }
  ],
  "filteredByPrice": true,
  "maxPrice": 250.0
}
```

**3. Test Market Conditions**
```bash
curl -H "Authorization: Bearer AKF6WG4GNJZWOSMX03EE" \
  "http://localhost:8000/api/market/conditions"
```

### Using VS Code REST Client Extension

Create a file `.vscode/api-tests.http`:

```http
### Health Check
GET http://localhost:8000/api/health

### Get Screening Opportunities (Filtered)
GET http://localhost:8000/api/screening/opportunities?max_price=250
Authorization: Bearer AKF6WG4GNJZWOSMX03EE

### Get Market Conditions
GET http://localhost:8000/api/market/conditions
Authorization: Bearer AKF6WG4GNJZWOSMX03EE

### Execute Trade (Dry Run)
POST http://localhost:3000/api/proxy/trading/execute
Content-Type: application/json

{
  "dryRun": true,
  "requestId": "test-123",
  "orders": [{
    "symbol": "SPY",
    "side": "buy",
    "qty": 1,
    "type": "market"
  }]
}
```

---

## 🔍 VS Code Extensions Recommended

### Essential
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Python** - Python language support
- **Pylance** - Python IntelliSense

### Helpful
- **REST Client** - Test API endpoints directly in VS Code
- **GitLens** - Enhanced Git capabilities
- **Thunder Client** - Alternative API testing tool
- **Auto Rename Tag** - Auto-rename paired HTML/JSX tags
- **Import Cost** - Display import/require package sizes

---

## 🐛 Debugging Configuration

### Frontend Debugging
Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "cwd": "${workspaceFolder}/frontend"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Backend Debugging
Add to `.vscode/launch.json`:

```json
{
  "name": "Python: FastAPI",
  "type": "python",
  "request": "launch",
  "module": "uvicorn",
  "args": [
    "app.main:app",
    "--reload",
    "--port",
    "8000"
  ],
  "cwd": "${workspaceFolder}/backend",
  "env": {
    "PYTHONPATH": "${workspaceFolder}/backend"
  }
}
```

---

## 🎯 VS Code Tasks

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "problemMatcher": [],
      "presentation": {
        "group": "dev"
      }
    },
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "python -m uvicorn app.main:app --reload --port 8000",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "problemMatcher": [],
      "presentation": {
        "group": "dev"
      }
    },
    {
      "label": "Start Both Servers",
      "dependsOn": ["Start Frontend", "Start Backend"],
      "problemMatcher": []
    }
  ]
}
```

**Usage**: Press `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Both Servers"

---

## ⚙️ Environment Variables

### Frontend `.env.local`
```env
BACKEND_API_BASE_URL=http://localhost:8000
API_TOKEN=AKF6WG4GNJZWOSMX03EE
```

### Backend `.env`
```env
PORT=8000
API_TOKEN=AKF6WG4GNJZWOSMX03EE
ALLOW_ORIGIN=*
```

**⚠️ IMPORTANT**: Both `.env` files are gitignored. Never commit them!

---

## 📝 Code Snippets

Add to `.vscode/snippets.code-snippets`:

```json
{
  "Theme Card Component": {
    "prefix": "tcard",
    "body": [
      "<Card glow=\"${1|green,teal,purple,orange,red|}\" style={{ marginBottom: theme.spacing.lg }}>",
      "  ${2:// Card content}",
      "</Card>"
    ],
    "description": "Themed Card component with glow"
  },
  "Theme Button": {
    "prefix": "tbutton",
    "body": [
      "<Button variant=\"${1|primary,secondary,danger|}\" size=\"${2|sm,md,lg|}\" loading={${3:false}}>",
      "  ${4:Button Text}",
      "</Button>"
    ],
    "description": "Themed Button component"
  },
  "FastAPI Router Endpoint": {
    "prefix": "frouter",
    "body": [
      "@router.${1|get,post,put,delete|}(\"/${2:endpoint}\", dependencies=[Depends(require_bearer)])",
      "async def ${3:function_name}() -> dict:",
      "    \"\"\"",
      "    ${4:Endpoint description}",
      "    \"\"\"",
      "    return {${5}}"
    ],
    "description": "FastAPI router endpoint with auth"
  }
}
```

---

## 🚀 Deployment Workflow

### From VS Code Terminal

**1. Commit Changes**
```bash
git add .
git status  # Review changes
git commit -m "feat: your descriptive message"
```

**2. Push to GitHub**
```bash
git push origin main
```

**3. Automatic Deployments**
- **Vercel** (Frontend): Auto-deploys from main branch
- **Render** (Backend): Auto-deploys if configured

**4. Monitor Deployment**
- Vercel Dashboard: https://vercel.com/dashboard
- View logs in VS Code terminal or dashboard

**5. Verify Production**
```bash
# Test production frontend
curl https://ai-trader-snowy.vercel.app/api/proxy/health

# Or open in browser
start https://ai-trader-snowy.vercel.app
```

---

## 🔧 Common VS Code Commands

### Terminal Shortcuts
- **Open Terminal**: `` Ctrl+` ``
- **New Terminal**: `Ctrl+Shift+~`
- **Split Terminal**: `Ctrl+Shift+5`
- **Toggle Terminal**: `` Ctrl+` ``

### Editor Shortcuts
- **Command Palette**: `Ctrl+Shift+P`
- **Quick Open**: `Ctrl+P`
- **Go to Symbol**: `Ctrl+Shift+O`
- **Find in Files**: `Ctrl+Shift+F`
- **Replace in Files**: `Ctrl+Shift+H`

### Git Shortcuts
- **Source Control**: `Ctrl+Shift+G`
- **Commit**: `Ctrl+Enter` (in source control)
- **View Changes**: `Ctrl+Shift+G` → Click file

### Debugging
- **Start Debugging**: `F5`
- **Toggle Breakpoint**: `F9`
- **Step Over**: `F10`
- **Step Into**: `F11`
- **Continue**: `F5`

---

## 📊 Project Status Dashboard

### ✅ Working Features
- [x] Morning Routine workflow with account balance filtering
- [x] Execute Trade workflow with confirmation dialogs
- [x] News Review with sentiment analysis
- [x] Active Positions display
- [x] AI Recommendations
- [x] Radial menu navigation
- [x] Theme system with UI components
- [x] Backend API with authentication
- [x] Vercel deployment pipeline

### ⏳ Placeholder Workflows (Coming Soon)
- [ ] Strategy Builder (visual editor)
- [ ] Backtesting (historical simulation)
- [ ] P&L Dashboard (performance analytics)

### 🔄 Recent Updates
- **2025-10-06**: Fixed backend authentication, added account balance filtering
- **Commit**: 7cd4c15 - Backend authentication fixes
- **Status**: Clean working tree, all changes pushed

---

## 🐛 Troubleshooting in VS Code

### Issue: Frontend won't start
```bash
# Clear caches and reinstall
cd frontend
rm -rf .next .swc node_modules/.cache
npm install
npm run dev
```

### Issue: Backend import errors
```bash
# Ensure Python virtual environment is active
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### Issue: Environment variables not loading
```bash
# Check .env files exist and are in correct locations
ls frontend/.env.local
ls backend/.env

# Restart VS Code terminal after changing .env files
```

### Issue: TypeScript errors in VS Code
```bash
# Reload VS Code TypeScript server
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Port already in use
```bash
# Windows: Find and kill process on port
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Additional Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **Vercel**: https://vercel.com/docs
- **lucide-react**: https://lucide.dev/

### Project Files
- **Theme System**: `frontend/styles/theme.ts`
- **UI Components**: `frontend/components/ui/`
- **API Proxy**: `frontend/pages/api/proxy/[...path].ts`
- **Backend Auth**: `backend/app/core/auth.py`

### Git Repository
```bash
# Clone repository
git clone https://github.com/SCPrime/ai-Trader.git

# View commit history
git log --oneline -10

# View file changes
git show 7cd4c15
```

---

## 💡 Tips for Efficient Development

### Multi-Cursor Editing
- `Alt+Click` - Add cursor
- `Ctrl+Alt+Up/Down` - Add cursor above/below
- `Ctrl+D` - Select next occurrence
- `Ctrl+Shift+L` - Select all occurrences

### Code Navigation
- `F12` - Go to definition
- `Alt+F12` - Peek definition
- `Shift+F12` - Find all references
- `Ctrl+Click` - Follow link

### Refactoring
- `F2` - Rename symbol
- `Ctrl+.` - Quick fix
- `Ctrl+Shift+R` - Refactor

### Zen Mode
- `Ctrl+K Z` - Enter zen mode (distraction-free)
- `Esc Esc` - Exit zen mode

---

## 🎯 Quick Reference

### Start Development
```bash
# Split terminal in VS Code
cd frontend && npm run dev  # Terminal 1
cd backend && python -m uvicorn app.main:app --reload --port 8000  # Terminal 2
```

### Test Endpoints
```bash
# Health
curl http://localhost:8000/api/health

# Opportunities
curl -H "Authorization: Bearer AKF6WG4GNJZWOSMX03EE" \
  "http://localhost:8000/api/screening/opportunities?max_price=250"
```

### Deploy
```bash
git add . && git commit -m "your message" && git push origin main
```

### View Logs
```bash
# Frontend console: Browser DevTools (F12)
# Backend logs: VS Code terminal running uvicorn
# Vercel logs: VS Code terminal → vercel logs
```

---

**Last Updated**: 2025-10-06
**Maintained By**: AI Trader Development Team
**Project Status**: Production Ready ✅

---

*This guide is designed to help you efficiently work with the AI Trader platform in VS Code. Keep it updated as the project evolves!*
