# Allessandra Implementation Status & Roadmap

**Allessandra** is the automated, multi-leg options strategy executor with strict risk controls, news-aware scanning, and approval/autopilot workflow capabilities.

## ✅ Phase 1: Foundation (COMPLETED)

### Created Files

#### 1. Strategy DSL Schema (`frontend/strategies/schema.ts`)
- **676 lines** of TypeScript interfaces
- Complete type definitions for all Allessandra components
- Includes: Strategy, Universe, Entry, Position, Sizing, Exits, Risk, Automation
- Proposal, Order, Execution, Position tracking types
- Report, News, Risk Event, Notification types
- Broker and Market Data adapter interfaces
- Backtest configuration and result types

#### 2. Strategy Validator (`frontend/strategies/validator.ts`)
- **587 lines** of comprehensive validation logic
- Validates all required fields and data types
- Business rule enforcement:
  - Capital discipline: sub-$4 names must be cash-collateralized or defined-risk
  - Autopilot requires performance gates
  - Liquidity checks for penny stocks
- Detailed error and warning messages with field-level reporting
- Range validations (deltas, percentages, dates)

#### 3. Seven Seed Strategy JSON Files (`frontend/strategies/seeds/`)

| File | Strategy | Description |
|------|----------|-------------|
| `1_micro_collar_sub4.json` | Micro Protective Collar | Stock + long put + short call (fully funded) |
| `2_pc_spread_sub4.json` | Put Credit Spread | Defined-risk premium capture |
| `3_csp_wheel_sub4.json` | Cash-Secured Put Wheel | Premium income → covered calls on assignment |
| `4_spy_condor_45dte.json` | SPY Iron Condor | Systematic theta with 15Δ/5Δ wings |
| `5_earnings_butterfly.json` | Earnings Butterfly | Volatility contraction debit spread |
| `6_core_cc_sleeve.json` | Core Covered Call Sleeve | Stability sleeve with autopilot |
| `7_tbill_ladder.json` | T-Bill/TIPS Ladder | Cash parking, no options |

All strategies are production-ready JSON files matching the DSL schema perfectly.

---

## 🚧 Phase 2: Components & UI (TO BE IMPLEMENTED)

### Priority 1: Strategy Builder UI

**File:** `frontend/components/trading/StrategyBuilder.tsx`

**Features:**
- JSON-driven form matching Strategy DSL
- Real-time validation with error highlighting
- Version management (save new versions)
- Enable/disable and autopilot toggles
- Import/export JSON
- Preview mode showing computed risk metrics

**Implementation Estimate:** 8-12 hours

**Key Sub-components:**
```
StrategyBuilder/
  ├── UniverseFilters.tsx
  ├── EntryRules.tsx
  ├── PositionLegs.tsx
  ├── SizingConfig.tsx
  ├── ExitRules.tsx
  ├── RiskBreakers.tsx
  ├── AutomationSettings.tsx
  └── ValidationPanel.tsx
```

### Priority 2: Proposal Review UI

**File:** `frontend/components/trading/ProposalReview.tsx`

**Features:**
- Cards showing ticker, greeks, IVR, credit/debit, POP
- Max risk/profit display
- Inline editors for Δ/DTE/strikes/per-trade cash
- Instant recalculation on edits
- Approve / Reject / Edit / Autopilot toggle buttons
- Countdown timer to approval deadline
- Batch approve with budget limit

**Implementation Estimate:** 6-8 hours

### Priority 3: Position Management UI

**File:** `frontend/components/trading/PositionManager.tsx`

**Features:**
- Live P/L tracking
- Greeks aggregation
- Roll due badges
- Earnings calendar integration
- One-click roll (pre-filled per roll rules)
- Manual close/adjust options

**Implementation Estimate:** 5-7 hours

### Priority 4: Reports Dashboard

**File:** `frontend/components/trading/ReportsDashboard.tsx`

**Features:**
- Pre/Mid/Post market tabs
- SMS notification preview
- Export CSV/PDF
- Historical report archive
- "Send SMS Now" manual trigger

**Implementation Estimate:** 4-6 hours

---

## 🔌 Phase 3: Backend API (TO BE IMPLEMENTED)

### Database Migration

**File:** `backend/migrations/001_allessandra_schema.sql`

**Tables to create:**
```sql
users, strategies, strategy_versions, targets, news_items,
proposals, orders, executions, positions, rolls, risk_events,
reports, notifications
```

**Status:** SQL schema provided in original spec (section 2)

**Implementation Estimate:** 2-3 hours

### Core Services

#### 1. StrategyService (`backend/src/modules/strategy/`)
- `POST /strategies` - Create/update with validation
- `GET /strategies` - List with version history
- `GET /strategies/{id}` - Get specific version
- `POST /strategies/{id}/toggle` - Enable/disable
- `POST /strategies/{id}/autopilot` - Toggle autopilot mode

#### 2. ScanService (`backend/src/modules/scan/`)
- `POST /scan` - Execute strategy scans
- Universe building
- Indicator checks
- Liquidity gating
- Candidate construction
- Risk calculation

#### 3. ProposalService (`backend/src/modules/proposal/`)
- `GET /proposals?status=pending` - List proposals
- `POST /proposals/{id}/approve` - Approve proposal
- `POST /proposals/{id}/reject` - Reject proposal
- `POST /proposals/{id}/reprice` - Recompute mid ± tolerance

#### 4. OrderService (`backend/src/modules/order/`)
- Multi-leg order composition
- Retry ladder within slippage budget
- TIF management
- Fill webhook ingestion

#### 5. RiskService (`backend/src/modules/risk/`)
- Circuit breaker evaluation
- `GET /risk/circuit` - Current status
- `POST /risk/circuit/pause` - Pause entries
- `POST /risk/circuit/resume` - Resume

#### 6. NewsService (`backend/src/modules/news/`)
- Feed ingestion
- Sentiment/novelty scoring
- Ticker mapping
- Risk event raising

#### 7. ReportService (`backend/src/modules/report/`)
- Pre/mid/post generation
- SMS template rendering
- `GET /reports/daily?kind=pre|mid|post`
- `POST /reports/generate` - On-demand

#### 8. AccountingService (`backend/src/modules/accounting/`)
- Cost basis tracking
- P/L calculation
- Greeks aggregation
- Weekly siphon to Stability Sleeve
- `GET /accounting/ledger`
- `GET /accounting/pnl?period=...`

### Adapter Interfaces

#### BrokerAdapter
```typescript
interface BrokerAdapter {
  place(order: MultiLegOrder): Promise<{brokerOrderId: string}>;
  cancel(brokerOrderId: string): Promise<void>;
  getPositions(): Promise<any[]>;
  onExecutionWebhook(payload: any): void;
}
```

**Implementations needed:**
- `IBKRAdapter`
- `TradierAdapter`
- `AlpacaAdapter` (current)

#### MarketDataAdapter
```typescript
interface MarketDataAdapter {
  getQuote(symbol: string): Promise<Quote>;
  getChain(symbol: string, expiry?: string): Promise<OptionChain>;
  getGreeks(symbol: string, strike: number, expiry: string): Promise<Greeks>;
}
```

#### NewsAdapter
```typescript
interface NewsAdapter {
  fetchFeed(tickers: string[], limit: number): Promise<NewsArticle[]>;
  scoreSentiment(article: NewsArticle): Promise<number>;
  computeNovelty(article: NewsArticle): Promise<number>;
}
```

#### SmsAdapter
```typescript
interface SmsAdapter {
  send(phone: string, message: string): Promise<{id: string}>;
  onDeliveryCallback(payload: any): void;
}
```

---

## 📅 Phase 4: Workflow Automation (TO BE IMPLEMENTED)

### BullMQ Job Schedulers

#### 1. Pre-Market Job (`/workers/jobs/scan_premarket.ts`)
**Schedule:** 07:30 ET daily
- Ingest overnight news
- Fetch market data
- Build universes
- Check circuit breakers

#### 2. Scan Job (`/workers/jobs/scan_strategies.ts`)
**Schedule:** 09:20 ET daily
- Execute strategy scans
- Generate candidates
- Apply filters

#### 3. Proposal Job (`/workers/jobs/create_proposals.ts`)
**Schedule:** 09:40 ET daily
- Price at mid
- Compute risk metrics
- Generate charts
- Persist proposals
- Send SMS notifications

#### 4. Execution Job (`/workers/jobs/execute_orders.ts`)
**Schedule:** 09:58 ET (autopilot) or on-demand
- Place orders with retry ladder
- Monitor fills
- Update positions

#### 5. Monitor Job (`/workers/jobs/monitor_positions.ts`)
**Schedule:** Every 5 minutes during market hours
- Check profit targets / stop losses
- Evaluate roll windows
- Trigger adjustments

#### 6. Mid-Day Report (`/workers/jobs/report_mid.ts`)
**Schedule:** 12:15 ET daily
- Generate mid-day report
- Send SMS summary

#### 7. EOD Report (`/workers/jobs/report_post.ts`)
**Schedule:** 16:20 ET daily
- Recalc Greeks/PNL
- Update OCO levels
- Generate post-market report
- Execute portfolio policy

#### 8. Portfolio Policy Job (`/workers/jobs/policy_stability.ts`)
**Schedule:** Weekly (Saturdays 10:00 ET)
- Calculate realized P/L
- Siphon to Stability Sleeve
- Rebalance allocations

---

## 📊 Phase 5: Charts & Visualizations (TO BE IMPLEMENTED)

### Chart Generation Service

**File:** `backend/src/services/ChartGenerator.ts`

**Charts to generate:**

1. **Payoff Diagram** (`/plots/{date}/{ticker}_{strategy_id}_payoff.png`)
   - Multi-leg P/L at expiration
   - Breakeven annotations
   - Max profit/loss markers

2. **IV vs HV Chart** (`/plots/{date}/{ticker}_{strategy_id}_iv_hv.png`)
   - Last 60 sessions
   - IV percentile annotation
   - Current IVR marker

3. **OI Heatmap** (`/plots/{date}/{ticker}_{strategy_id}_oi.png`)
   - Open interest by strike
   - Chosen DTE ±2 strikes highlighted
   - Volume overlay

4. **Risk Cone** (optional, Monte Carlo)
   - Probabilistic P/L distribution
   - Confidence intervals

**Technology:** Python (matplotlib/seaborn) or Node.js (Chart.js/D3.js)

**Implementation Estimate:** 8-10 hours

---

## 🔔 Phase 6: SMS Notifications (TO BE IMPLEMENTED)

### SMS Message Templates

**File:** `backend/src/templates/sms.ts`

#### 1. Proposals Ready (09:40 ET)
```
Allessandra: 3 proposals ready (XYZ collar, QRS CSP, TUV spread).
Approve by 09:58 ET: https://app.com/proposals
```

#### 2. Approval Deadline Warning (09:48 ET)
```
Allessandra: Approval window closes 09:58 ET. Remaining: 2 proposals.
Reply 'PAUSE' to halt entries today.
```

#### 3. Major Fill
```
Allessandra: FILLED XYZ Micro Collar @ net $298.
Max risk $98, POP 63%.
```

#### 4. Risk Breaker Tripped
```
Allessandra: NEWS BREAK on ABC (sentiment -0.82, novelty 0.71).
Suspended new entries for 60m.
```

#### 5. Profit Target Hit
```
Allessandra: Target hit on XYZ CSP (50% capture). Closing...
```

#### 6. Mid-Day Adjustments
```
Allessandra: 1 roll due (short call Δ=0.45).
Review: https://app.com/positions/123
```

#### 7. Post-Market Summary (16:20 ET)
```
Allessandra: +$312 realized, -$58 unrealized today.
Siphoned $109 to Stability Sleeve.
Report: https://app.com/reports/post
```

### SMS Features
- Throttling (max 10/hour per user)
- Quiet hours (22:00 - 07:00 ET)
- Delivery tracking
- Reply parsing (`PAUSE`, `RESUME`, `STATUS`)

**Implementation Estimate:** 4-6 hours

---

## 🧪 Phase 7: Backtesting Engine (TO BE IMPLEMENTED)

### BacktestService

**File:** `backend/src/modules/backtest/BacktestService.ts`

**Features:**
- Event-driven architecture
- Bar-by-bar simulation
- NBBO slippage model
- Earnings/halt event integration
- Position tracking
- Order execution simulation

**Metrics to calculate:**
- CAGR, Max Drawdown, Sharpe, Sortino
- Win rate, Profit factor
- Avg time in trade
- Tail loss (95th/99th percentile)
- Liquidity failure rate
- Average slippage

**Autopilot Gating:**
Require **live** (not backtest) trailing 6-month metrics:
- Win rate ≥ threshold (e.g., 58%)
- Max DD ≤ policy limit (e.g., -12%)
- Sharpe ratio ≥ threshold (e.g., 1.2)

**Implementation Estimate:** 20-25 hours

---

## 📋 Phase 8: Documentation Updates (TO BE COMPLETED)

### Update ROADMAP.md

**Section to add:** "Allessandra: Automated Strategy Execution System"

**Content:**
- Overview of 8-stage workflow
- Execution pipeline (07:30 → 16:20 ET)
- News-aware scanning
- Approval/autopilot workflow
- Portfolio policy & siphoning
- SMS prompt specifications
- Circuit breaker rules

### Update API_DOCUMENTATION.md

**New Endpoints Section:** "Allessandra Strategy Management"

**Endpoints to document:**
```
POST   /strategies
GET    /strategies
GET    /strategies/{id}
POST   /strategies/{id}/toggle
POST   /strategies/{id}/autopilot
POST   /scan
GET    /proposals
POST   /proposals/{id}/approve
POST   /proposals/{id}/reject
POST   /proposals/{id}/reprice
POST   /orders/{id}/submit
POST   /orders/{id}/cancel
GET    /risk/circuit
POST   /risk/circuit/pause
POST   /risk/circuit/resume
GET    /watchlists/targets
POST   /watchlists/targets
DELETE /watchlists/targets/{id}
GET    /reports/daily
POST   /reports/generate
GET    /accounting/ledger
GET    /accounting/pnl
```

---

## 🚀 Implementation Timeline Estimate

| Phase | Component | Hours | Priority |
|-------|-----------|-------|----------|
| Phase 1 | Foundation (schema, validator, seeds) | ✅ 8 | Complete |
| Phase 2 | Strategy Builder UI | 10 | High |
| Phase 2 | Proposal Review UI | 8 | High |
| Phase 2 | Position Manager UI | 6 | High |
| Phase 2 | Reports Dashboard | 5 | Medium |
| Phase 3 | Database Migration | 3 | High |
| Phase 3 | StrategyService | 6 | High |
| Phase 3 | ScanService | 12 | High |
| Phase 3 | ProposalService | 8 | High |
| Phase 3 | OrderService | 10 | High |
| Phase 3 | RiskService | 6 | High |
| Phase 3 | NewsService | 8 | Medium |
| Phase 3 | ReportService | 6 | Medium |
| Phase 3 | AccountingService | 8 | Medium |
| Phase 3 | Adapter Implementations | 12 | High |
| Phase 4 | BullMQ Job Schedulers (8 jobs) | 16 | High |
| Phase 5 | Chart Generation | 10 | Medium |
| Phase 6 | SMS Integration | 6 | Medium |
| Phase 7 | Backtesting Engine | 24 | Low |
| Phase 8 | Documentation Updates | 4 | High |
| **TOTAL** | | **174 hours** | |

**Estimated completion time:** 4-5 weeks (1 full-time developer)

---

## 🔐 Security & Compliance Considerations

### Capital Discipline (Non-Negotiable)
- ✅ Validator enforces: sub-$4 names must be cash-collateralized or defined-risk
- ✅ No naked short premium on penny stocks
- ⚠️ Need runtime enforcement in OrderService

### Liquidity Gates
- ⚠️ Need implementation: min OI, max spread, earnings/halts checks
- ⚠️ Do not force fills if gates fail

### Kill Switches
- ⚠️ Need implementation: VIX/gap breaker, news sentiment breaker, liquidity breaker
- ⚠️ Pause new entries when tripped

### Idempotency & Audit
- ⚠️ Need implementation: immutable proposal/order/fill records
- ⚠️ Versioned strategy JSON stored with every proposal
- ⚠️ Market snapshots (compressed JSON) for forensic replay

### Autopilot Gating
- ✅ Validator checks for performance thresholds
- ⚠️ Need implementation: live performance tracking
- ⚠️ Require 6-month live win rate, Sharpe, max DD checks

---

## 📁 File Structure Summary

```
frontend/
├── strategies/
│   ├── schema.ts                        ✅ COMPLETE (676 lines)
│   ├── validator.ts                     ✅ COMPLETE (587 lines)
│   └── seeds/
│       ├── 1_micro_collar_sub4.json     ✅ COMPLETE
│       ├── 2_pc_spread_sub4.json        ✅ COMPLETE
│       ├── 3_csp_wheel_sub4.json        ✅ COMPLETE
│       ├── 4_spy_condor_45dte.json      ✅ COMPLETE
│       ├── 5_earnings_butterfly.json    ✅ COMPLETE
│       ├── 6_core_cc_sleeve.json        ✅ COMPLETE
│       └── 7_tbill_ladder.json          ✅ COMPLETE
├── components/
│   └── trading/
│       ├── StrategyBuilder.tsx          ⚠️ TODO
│       ├── ProposalReview.tsx           ⚠️ TODO
│       ├── PositionManager.tsx          ⚠️ TODO
│       └── ReportsDashboard.tsx         ⚠️ TODO
backend/
├── migrations/
│   └── 001_allessandra_schema.sql       ⚠️ TODO (SQL provided)
├── src/
│   ├── modules/
│   │   ├── strategy/                    ⚠️ TODO
│   │   ├── scan/                        ⚠️ TODO
│   │   ├── proposal/                    ⚠️ TODO
│   │   ├── order/                       ⚠️ TODO
│   │   ├── risk/                        ⚠️ TODO
│   │   ├── news/                        ⚠️ TODO
│   │   ├── report/                      ⚠️ TODO
│   │   └── accounting/                  ⚠️ TODO
│   ├── adapters/
│   │   ├── broker/                      ⚠️ TODO
│   │   ├── marketdata/                  ⚠️ TODO
│   │   ├── news/                        ⚠️ TODO
│   │   └── sms/                         ⚠️ TODO
│   ├── services/
│   │   └── ChartGenerator.ts            ⚠️ TODO
│   └── templates/
│       └── sms.ts                       ⚠️ TODO
├── workers/
│   └── jobs/
│       ├── scan_premarket.ts            ⚠️ TODO
│       ├── scan_strategies.ts           ⚠️ TODO
│       ├── create_proposals.ts          ⚠️ TODO
│       ├── execute_orders.ts            ⚠️ TODO
│       ├── monitor_positions.ts         ⚠️ TODO
│       ├── report_mid.ts                ⚠️ TODO
│       ├── report_post.ts               ⚠️ TODO
│       └── policy_stability.ts          ⚠️ TODO
docs/
├── ALLESSANDRA_IMPLEMENTATION.md        ✅ COMPLETE (this file)
├── ROADMAP.md                           ⚠️ TODO (update needed)
└── API_DOCUMENTATION.md                 ⚠️ TODO (update needed)
```

---

## 🎯 Next Steps (Recommended Order)

1. **Commit Phase 1 files** (schema, validator, 7 seeds)
2. **Update ROADMAP.md** with Allessandra section
3. **Update API_DOCUMENTATION.md** with strategy endpoints
4. **Implement database migration** (`001_allessandra_schema.sql`)
5. **Build StrategyService** (CRUD for strategies)
6. **Build Strategy Builder UI** (most visible feature)
7. **Implement ScanService** (core logic)
8. **Build ProposalService** and **Proposal Review UI**
9. **Implement OrderService** with retry ladder
10. **Add BullMQ schedulers** for automation
11. **Implement RiskService** with circuit breakers
12. **Add chart generation** for proposals
13. **Integrate SMS notifications**
14. **Build backtesting engine** (can be deferred)

---

## 🤝 Integration with Existing Codebase

### Current Working State (as of commit 5855bb5)
- ✅ D3.js radial menu with 8 workflows
- ✅ Active Positions table
- ✅ Morning Routine health checks
- ✅ Execute Trade form
- ✅ API proxy pattern

### Integration Points

#### Add Strategy Builder to Radial Menu
```tsx
// frontend/components/RadialMenu.tsx
const workflows: Workflow[] = [
  // ... existing workflows
  {
    id: 'strategy-builder',
    name: 'Strategy\nBuilder',
    icon: '🎯',
    color: '#5E35B1',
    description: 'Design and manage automated trading strategies'
  }
];
```

#### Add to Dashboard Switch Statement
```tsx
// frontend/pages/index.tsx
case 'strategy-builder':
  return <StrategyBuilder />;
```

#### Proxy Strategy Endpoints
```tsx
// frontend/pages/api/proxy/[...path].ts
// Already supports all /api/strategies/* routes
```

---

## 📞 Support & Questions

For implementation questions or clarifications:
1. Review this document and the Strategy DSL schema
2. Check seed strategy JSON files for examples
3. Refer to original Allessandra spec in requirements doc

**Built with Claude Code** 🤖
