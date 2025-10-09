# PaiiD APP STATE REFERENCE

**Last Updated:** October 8, 2025
**Status:** Phase 1 - UI/UX Complete, Phase 2 - Live Trading Integration Pending

---

## 🎨 DESIGN SYSTEM (CORRECT STATE)

### Theme Colors
```typescript
// Location: frontend/styles/theme.ts
{
  primary: '#16a394',      // Teal accent (borders, buttons)
  aiGlow: '#45f0c0',       // AI logo cyan glow ← CORRECT COLOR
  background: 'rgba(30, 41, 59, 0.8)', // Dark navy with transparency
  border: 'rgba(22, 163, 148, 0.3)',   // Subtle teal border
  text: '#f1f5f9',         // Primary text (bright)
  textMuted: '#cbd5e1',    // Secondary text (muted)
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b'
}
```

### Logo Specification
```typescript
// PaiiD Logo Structure
P    → Blue gradient (#1a7560 to #0d5a4a)
aii  → Cyan #45f0c0 with animated glow (clickable for AI chat)
D    → Blue gradient (#1a7560 to #0d5a4a)
```

**Animation:**
```css
@keyframes glow-ai {
  0%, 100% {
    text-shadow: 0 0 15px rgba(69, 240, 192, 0.6),
                 0 0 30px rgba(69, 240, 192, 0.4);
  }
  50% {
    text-shadow: 0 0 25px rgba(69, 240, 192, 0.9),
                 0 0 50px rgba(69, 240, 192, 0.6),
                 0 0 75px rgba(69, 240, 192, 0.3);
  }
}
```

---

## 📁 PROJECT STRUCTURE

```
ai-Trader/
├── frontend/
│   ├── components/
│   │   ├── RadialMenu.tsx        ← Main navigation wheel
│   │   ├── Settings.tsx          ← Settings panel
│   │   ├── MorningRoutineAI.tsx  ← Morning routine component
│   │   ├── UserSetup.tsx         ← Onboarding flow
│   │   └── [other components]
│   ├── styles/
│   │   └── theme.ts              ← Theme configuration
│   ├── lib/
│   │   ├── aiAdapter.ts          ← AI integration (backend proxy)
│   │   └── alpaca.ts             ← Trading API client
│   ├── .env.local                ← Environment variables
│   ├── package.json
│   └── next.config.js
├── backend/
│   ├── app.py                    ← FastAPI backend
│   ├── requirements.txt
│   └── .env                      ← Backend environment variables
├── CLAUDE_PROTOCOL.md            ← Execution standards
├── TASK_TEMPLATE.md              ← Task format
└── PAIID_APP_STATE.md            ← This file
```

---

## 🔧 ENVIRONMENT CONFIGURATION

### Frontend (.env.local)
```bash
# AI Integration
NEXT_PUBLIC_ANTHROPIC_API_KEY=[not used - goes through backend]
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001

# Alpaca Trading (Paper Trading)
NEXT_PUBLIC_ALPACA_API_KEY=[your paper key]
NEXT_PUBLIC_ALPACA_SECRET_KEY=[your paper secret]
NEXT_PUBLIC_ALPACA_PAPER=true

# App Configuration
NEXT_PUBLIC_APP_NAME=PaiiD
NODE_ENV=development
```

### Backend (.env)
```bash
# Anthropic API
ANTHROPIC_API_KEY=[your key]

# CORS Settings
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=8001
HOST=127.0.0.1
```

---

## 🚀 CORRECT STARTUP SEQUENCE

### 1. Backend Server
```bash
cd backend
source venv/bin/activate  # or: venv\Scripts\activate on Windows
python app.py

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8001
# INFO:     Application startup complete
```

### 2. Frontend Server
```bash
cd frontend
npm run dev

# Expected output:
# ▲ Next.js 14.2.33
# - Local: http://localhost:3000
# ✓ Ready in [time]
```

### 3. Verification
```bash
# Check backend
curl http://127.0.0.1:8001/health
# Expected: {"status":"ok"}

# Check frontend
curl http://localhost:3000
# Expected: HTML response (200)
```

---

## ✅ WORKING FEATURES (Phase 1 Complete)

### UI Components
- [x] Radial menu with 10 wedges
- [x] PaiiD logo with cyan "aii" glow
- [x] AI chat modal (click "aii" logo)
- [x] Settings panel with tabs
- [x] Morning Routine scheduler
- [x] Onboarding flow (UserSetup)
- [x] Glassmorphic design system
- [x] Responsive layout

### Navigation
- [x] Wedge selection/highlighting
- [x] Workflow routing
- [x] Back/forward navigation
- [x] Center circle info display

### AI Integration (Backend Proxy)
- [x] aiAdapter.ts calls backend at http://127.0.0.1:8001
- [x] Backend forwards to Anthropic API
- [x] Chat functionality working
- [x] Character encoding fixed

---

## 🚧 PENDING FEATURES (Phase 2)

### Live Trading Integration
- [ ] Alpaca paper trading connection
- [ ] Real-time quote data
- [ ] Position management
- [ ] Order execution (with dry-run mode)
- [ ] Portfolio tracking

### AI Features
- [ ] Strategy generation
- [ ] Market analysis
- [ ] Trade recommendations
- [ ] Morning briefing automation

### Advanced UI
- [ ] Real-time charts
- [ ] Notification system
- [ ] Performance analytics
- [ ] News feed integration

---

## 🐛 KNOWN ISSUES

### Resolved
- ✅ Logo color (was purple, now cyan)
- ✅ AI adapter 401 errors (now uses backend proxy)
- ✅ Character encoding in Claude responses
- ✅ Settings theme matching

### Current Issues
- ⚠️ Server occasionally needs hard restart
- ⚠️ Browser cache requires frequent clearing
- ⚠️ Multiple dev server instances can run simultaneously

### Not Yet Implemented
- ❌ Alpaca WebSocket for real-time data
- ❌ News API integration
- ❌ Options chain data
- ❌ Multi-account support

---

## 🔍 VERIFICATION COMMANDS

### Quick Health Check
```bash
# Backend status
curl http://127.0.0.1:8001/health

# Frontend status
curl http://localhost:3000

# Check for multiple servers
netstat -ano | findstr :3000
netstat -ano | findstr :8001

# Check recent changes
cd frontend
git log --oneline -5

# Check current logo color
grep -n "#45f0c0" components/RadialMenu.tsx
# Should return: Line 558, Line 639
```

### Full System Check
```bash
# 1. Kill all Node processes
taskkill /F /IM node.exe

# 2. Check git status
git status

# 3. Check for uncommitted changes
git diff --name-only

# 4. Verify environment files
ls -la frontend/.env.local
ls -la backend/.env

# 5. Restart services
cd backend && python app.py &
cd frontend && npm run dev
```

---

## 📊 PERFORMANCE BENCHMARKS

### Expected Load Times
- Initial page load: < 2s
- Wedge navigation: < 300ms
- AI chat response: 2-5s
- Settings panel: < 200ms

### Build Times
- Next.js dev compile: < 2s
- Production build: < 30s

---

## 🎯 PHASE 2 OBJECTIVES

### Immediate Next Steps (In Order)

1. **Complete live trading connection**
   - Test Alpaca paper trading API
   - Implement position fetching
   - Add order execution (dry-run first)

2. **Add real-time data**
   - WebSocket for quote streaming
   - Portfolio value updates
   - Market status indicators

3. **Enhance AI features**
   - Strategy builder UI
   - Morning routine automation
   - News analysis integration

4. **Testing & Polish**
   - Error handling improvements
   - Loading states
   - User feedback

---

## 🚨 CRITICAL FILES (DO NOT BREAK)

These files are core and verified working:
- `frontend/components/RadialMenu.tsx` - Main navigation
- `frontend/styles/theme.ts` - Design system
- `frontend/lib/aiAdapter.ts` - AI integration
- `backend/app.py` - Backend server

**Before modifying these:**
1. Create git branch
2. Backup current version
3. Test changes thoroughly
4. Verify all features still work

---

## 📝 CHANGE LOG

### October 8, 2025
- Fixed logo color: purple → cyan (#45f0c0)
- Updated glow animation to use cyan
- Cleared multiple cache issues
- Documented correct startup sequence

### Previous Updates
- Backend proxy for AI integration
- Settings component theme matching
- Morning routine scheduler
- Onboarding flow completion

---

**REFERENCE THIS FILE BEFORE MAKING ANY CHANGES**
**UPDATE THIS FILE WHEN STATE CHANGES**
