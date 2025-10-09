# Data Sources Documentation

## ✅ REAL DATA (Live from Alpaca Paper Trading)

### Account Information
- **Source**: Alpaca API `/api/account`
- **Components**: All workflows, Analytics, ActivePositions
- **Data**:
  - Account Number: PA3WCSNWXTOU
  - Equity: $100,046.50
  - Cash: $97,511.35
  - Buying Power: $197,557.85
  - Portfolio Value: Real-time

### Positions
- **Source**: Alpaca API `/api/positions`
- **Components**: ActivePositions, PositionsTable, MorningRoutine
- **Data**:
  - Symbol, Quantity, Entry Price
  - Current Price, Market Value
  - Unrealized P&L, P&L %
  - Real positions: AAPL (2 shares), SPY (3 shares)

### Market Data (Center Logo)
- **Source**: Alpaca API `/api/quotes?symbols=SPY,QQQ`
- **Components**: RadialMenu center display
- **Data**:
  - SPY: Real-time price and % change
  - QQQ: Real-time price and % change
  - Updates: Every 30 seconds

### AI Recommendations
- **Source**: Backend AI `/api/ai/recommendations`
- **Components**: AIRecommendations (Proposals workflow)
- **Data**:
  - AI-generated trading recommendations
  - Based on market conditions
  - No mock fallback (shows error if backend unavailable)

## 📊 CALCULATED DATA (Derived from Real Account)

### Analytics Performance Metrics
- **Source**: Calculated from Alpaca account data
- **Components**: Analytics (P&L Dashboard)
- **Real Data Used**:
  - Total Return: `account.equity - starting_balance`
  - Total Return %: `(equity - 100000) / 100000 * 100`
- **Note**: Historical P&L trends are calculated estimates
  - Alpaca paper trading API doesn't provide historical performance data
  - Daily/monthly performance charts are generated for visualization
  - Current account equity IS real

### Trading Journal
- **Source**: TradingJournal component
- **Components**: Trading Journal workflow
- **Data**: User-entered trade notes and reflections
  - Stored in localStorage
  - No mock data

## 🚫 NO MOCK DATA

The following workflows use ONLY real data:
1. **Active Positions**: Real Alpaca positions
2. **Morning Routine**: Real account + positions
3. **AI Recommendations**: Real AI-generated suggestions
4. **Execute Trade**: Real order submission to Alpaca
5. **Research**: Real market scanner data
6. **Settings**: User preferences (no mock)

## 📝 USER PREFERENCES (Stored in localStorage)

### Onboarding Data Collected
- **NO Personal Information**:
  - ❌ Name (removed)
  - ❌ Email (removed)
  - ❌ Test Group (removed)

- **Trading Preferences ONLY**:
  - ✅ Risk Tolerance (conservative/moderate/aggressive)
  - ✅ Trading Style (day/swing/momentum/etc)
  - ✅ Investment Amount or Range
  - ✅ Preferred Instruments (stocks/options/ETFs/etc)
  - ✅ Watchlist (specific symbols)

### Where Preferences Are Used
1. **Strategy Builder**: Risk parameters, position sizing
2. **Morning Routine**: Watchlist-based alerts
3. **Research**: Filter by preferred instruments
4. **AI Recommendations**: Tailored to risk tolerance and style

## 🔄 DATA FLOW

```
User Onboarding (AI-Guided)
└─> Extract preferences from natural language
    └─> Store in localStorage (NO personal info)
        └─> Drive all workflow customization

Alpaca Paper Trading API
├─> Account Data → All Components
├─> Positions Data → Portfolio Views
└─> Market Quotes → Center Logo Display

Backend AI Service
└─> Generate Recommendations → Proposals Workflow
```

## ⚠️ IMPORTANT NOTES

1. **No Mock Fallbacks**: Components show errors if backend unavailable
   - This ensures data accuracy
   - Users know immediately if connection is lost

2. **Performance History**:
   - Current equity/P&L is REAL
   - Historical trends are calculated estimates
   - Alpaca paper trading doesn't provide history API

3. **User Privacy**:
   - NO personal information collected or stored
   - Only trading preferences for customization
   - Can clear preferences and re-onboard anytime

4. **Data Refresh Rates**:
   - Positions: On-demand + auto-refresh (30s)
   - Account: On-demand
   - Market Data: Every 30 seconds
   - AI Recommendations: On-demand

## 🎯 VERIFICATION CHECKLIST

To verify all data is real:
- [ ] Check Active Positions shows AAPL and SPY (your real holdings)
- [ ] Verify portfolio value matches Alpaca account ($100,046.50)
- [ ] Confirm no personal info stored (check localStorage in DevTools)
- [ ] Test AI Recommendations loads from backend (not mock)
- [ ] Verify center logo shows live SPY/QQQ prices
- [ ] Check positions update when you place a trade
