# AI Trading Platform - Development Roadmap

This roadmap details the implementation specifications for the 5 remaining workflow components. Each workflow is a standalone React component that integrates with the existing D3.js radial menu navigation.

## 🎯 Implementation Priority

1. **P&L Dashboard** (High Priority) - Essential for portfolio monitoring
2. **News Review** (High Priority) - Market awareness critical for trading
3. **AI Recommendations** (Medium Priority) - Competitive advantage feature
4. **Strategy Builder** (Medium Priority) - Advanced user feature
5. **Backtesting** (Low Priority) - Power user feature

---

## 1. P&L Dashboard (💰)

### Overview
Real-time portfolio performance analytics with historical tracking, risk metrics, and visual charts.

### Features

#### Core Metrics Display
- **Total Portfolio Value**: Current value, daily/weekly/monthly change
- **Realized P&L**: Closed position profits/losses
- **Unrealized P&L**: Open position mark-to-market gains/losses
- **Cash Balance**: Available buying power
- **Equity**: Total account equity

#### Performance Charts
- **Equity Curve**: Historical account value over time (line chart)
- **Daily P&L Bar Chart**: Daily profit/loss bars (green/red)
- **Win/Loss Distribution**: Histogram of trade outcomes
- **Monthly Performance Heatmap**: Calendar view of P&L by day

#### Risk Metrics
- **Sharpe Ratio**: Risk-adjusted returns
- **Max Drawdown**: Largest peak-to-trough decline
- **Win Rate**: Percentage of profitable trades
- **Average Win/Loss**: Mean profit vs mean loss
- **Profit Factor**: Gross profit / Gross loss

#### Time Period Filters
- Today, This Week, This Month, This Year, All Time
- Custom date range picker

### Technical Implementation

#### Component Structure
```tsx
// frontend/components/PnLDashboard.tsx
interface PnLData {
  totalValue: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  cashBalance: number;
  equity: number;
}

interface PerformanceMetrics {
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

interface HistoricalData {
  date: string;
  equity: number;
  dailyPnL: number;
}
```

#### Required Libraries
```bash
npm install recharts date-fns
```

Use **Recharts** for all visualizations:
- `LineChart` for equity curve
- `BarChart` for daily P&L
- `AreaChart` for cumulative returns

#### API Endpoints Needed

**GET /api/portfolio/summary**
```json
{
  "totalValue": 125430.50,
  "dailyPnL": 1250.30,
  "weeklyPnL": 3450.75,
  "monthlyPnL": 8920.40,
  "realizedPnL": 15430.20,
  "unrealizedPnL": 2340.80,
  "cashBalance": 50000.00,
  "equity": 125430.50,
  "timestamp": "2025-10-01T14:30:00Z"
}
```

**GET /api/portfolio/history?period=1M**
```json
{
  "data": [
    {
      "date": "2025-09-01",
      "equity": 120000.00,
      "dailyPnL": 500.00
    },
    {
      "date": "2025-09-02",
      "equity": 120300.00,
      "dailyPnL": 300.00
    }
  ]
}
```

**GET /api/analytics/performance**
```json
{
  "sharpeRatio": 1.85,
  "maxDrawdown": -8.5,
  "winRate": 62.5,
  "avgWin": 450.30,
  "avgLoss": -280.50,
  "profitFactor": 1.95,
  "totalTrades": 145,
  "winningTrades": 91,
  "losingTrades": 54
}
```

**GET /api/analytics/trades?period=1M**
```json
{
  "trades": [
    {
      "id": "trade_123",
      "symbol": "AAPL",
      "side": "buy",
      "qty": 100,
      "entryPrice": 180.50,
      "exitPrice": 184.10,
      "pnl": 360.00,
      "entryTime": "2025-09-15T09:30:00Z",
      "exitTime": "2025-09-16T15:45:00Z"
    }
  ]
}
```

#### Backend Implementation Tasks
1. Create `PortfolioService` to aggregate account data
2. Implement historical data storage (PostgreSQL/MongoDB)
3. Calculate performance metrics using `numpy` and `pandas`
4. Cache frequently accessed data (Redis)
5. Schedule daily equity snapshots

### UI Layout
```
┌─────────────────────────────────────────────┐
│ 💰 P&L Dashboard                            │
├─────────────────────────────────────────────┤
│ [Today] [Week] [Month] [Year] [All] [Custom]│
├─────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │Value │ │Daily │ │Unreal│ │Cash  │        │
│ │$125K │ │+$1.2K│ │+$2.3K│ │$50K  │        │
│ └──────┘ └──────┘ └──────┘ └──────┘        │
├─────────────────────────────────────────────┤
│         Equity Curve (Line Chart)           │
│         ╱╲    ╱╲                            │
│        ╱  ╲  ╱  ╲╱╲                         │
├─────────────────────────────────────────────┤
│ Risk Metrics:                               │
│ Sharpe: 1.85 | Max DD: -8.5% | Win: 62.5%  │
└─────────────────────────────────────────────┘
```

---

## 2. News Review (📰)

### Overview
Real-time market news aggregation with AI-powered sentiment analysis and filtering by portfolio symbols.

### Features

#### News Feed
- **Real-time headlines**: Latest market news
- **Sentiment indicators**: Bullish/Bearish/Neutral badges
- **Symbol tagging**: Link news to specific tickers
- **Time sorting**: Most recent first
- **Infinite scroll**: Load more on scroll

#### Filtering & Search
- **By Symbol**: Show news only for portfolio positions
- **By Sentiment**: Filter bullish/bearish/neutral
- **By Source**: Filter by news provider
- **Date Range**: Custom time period
- **Search**: Keyword/ticker search

#### Breaking News Alerts
- **Real-time notifications**: WebSocket updates
- **Priority tagging**: Market-moving events highlighted
- **Audio/visual alerts**: Optional notification sounds

#### News Sources
- Alpha Vantage News API
- Finnhub News API
- NewsAPI.org (general market news)
- Twitter/X sentiment (optional)

### Technical Implementation

#### Component Structure
```tsx
// frontend/components/NewsReview.tsx
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  symbols: string[];
  category: string;
}

interface NewsFilters {
  symbols: string[];
  sentiment: string[];
  sources: string[];
  dateFrom: string;
  dateTo: string;
  search: string;
}
```

#### Required Libraries
```bash
npm install react-infinite-scroll-component
```

#### API Endpoints Needed

**GET /api/news/feed?limit=50&offset=0**
```json
{
  "articles": [
    {
      "id": "news_123",
      "title": "Apple Announces Q4 Earnings Beat Expectations",
      "summary": "Apple Inc. reported quarterly earnings that exceeded analyst expectations...",
      "source": "Bloomberg",
      "url": "https://example.com/article",
      "publishedAt": "2025-10-01T14:00:00Z",
      "sentiment": "bullish",
      "sentimentScore": 0.75,
      "symbols": ["AAPL"],
      "category": "earnings"
    }
  ],
  "total": 1250,
  "hasMore": true
}
```

**GET /api/news/sentiment?symbol=AAPL**
```json
{
  "symbol": "AAPL",
  "overallSentiment": "bullish",
  "sentimentScore": 0.65,
  "articleCount": 45,
  "bullishCount": 30,
  "bearishCount": 10,
  "neutralCount": 5,
  "lastUpdated": "2025-10-01T14:30:00Z"
}
```

**WebSocket /ws/news**
```json
{
  "type": "breaking",
  "article": {
    "id": "news_456",
    "title": "Fed Announces Rate Cut",
    "sentiment": "bullish",
    "priority": "high"
  }
}
```

#### Backend Implementation Tasks
1. Integrate Alpha Vantage News API
2. Integrate Finnhub News API
3. Implement sentiment analysis (FinBERT model or API)
4. Create news aggregation service
5. Set up WebSocket server for real-time updates
6. Cache news data (Redis with 15-min TTL)
7. Implement rate limiting for API calls

### UI Layout
```
┌─────────────────────────────────────────────┐
│ 📰 News Review                   [🔔 Alerts]│
├─────────────────────────────────────────────┤
│ [All] [Portfolio] [Bullish] [Bearish]       │
│ [Search: AAPL_______________] [Filters ▼]   │
├─────────────────────────────────────────────┤
│ 🟢 AAPL | Apple Q4 Earnings Beat...         │
│    Bloomberg • 2h ago • Bullish (0.75)      │
│    Apple Inc. reported quarterly earnings...│
├─────────────────────────────────────────────┤
│ 🔴 TSLA | Tesla Misses Delivery Targets     │
│    Reuters • 4h ago • Bearish (-0.60)       │
│    Tesla's Q3 deliveries fell short of...   │
├─────────────────────────────────────────────┤
│           [Load More News...]               │
└─────────────────────────────────────────────┘
```

---

## 3. AI Recommendations (🤖)

### Overview
Machine learning-generated trade signals with confidence scores, entry/exit prices, and risk assessments.

### Features

#### Signal Display
- **Active Signals**: Current AI-generated recommendations
- **Confidence Score**: ML model confidence (0-100%)
- **Entry/Exit Prices**: Suggested price levels
- **Stop Loss**: Risk management level
- **Target Price**: Profit target
- **Time Horizon**: Short/Medium/Long term

#### Signal Types
- **Mean Reversion**: Overbought/oversold signals
- **Trend Following**: Momentum-based signals
- **Pattern Recognition**: Chart pattern alerts
- **Volatility Breakout**: Range expansion signals

#### Risk Assessment
- **Risk/Reward Ratio**: Expected R:R
- **Win Probability**: Historical accuracy
- **Position Size Suggestion**: Risk-adjusted sizing
- **Correlation Check**: Portfolio diversification impact

#### Historical Performance
- **Signal Accuracy**: Historical win rate per strategy
- **Average Return**: Mean profit per signal type
- **Best/Worst Trades**: Top performers

### Technical Implementation

#### Component Structure
```tsx
// frontend/components/AIRecommendations.tsx
interface TradeSignal {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  strategy: string;
  confidence: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  expectedReturn: number;
  riskRewardRatio: number;
  timeHorizon: 'short' | 'medium' | 'long';
  reasoning: string;
  generatedAt: string;
  expiresAt: string;
}

interface SignalPerformance {
  strategy: string;
  totalSignals: number;
  winRate: number;
  avgReturn: number;
  sharpeRatio: number;
}
```

#### Required Libraries
```bash
# No new libraries required
```

#### API Endpoints Needed

**GET /api/ai/signals?active=true**
```json
{
  "signals": [
    {
      "id": "signal_123",
      "symbol": "AAPL",
      "side": "buy",
      "strategy": "mean_reversion",
      "confidence": 78,
      "entryPrice": 182.50,
      "targetPrice": 188.00,
      "stopLoss": 179.00,
      "expectedReturn": 3.01,
      "riskRewardRatio": 1.57,
      "timeHorizon": "short",
      "reasoning": "RSI oversold (28) with support at $180. Historical bounce probability 78%.",
      "generatedAt": "2025-10-01T14:00:00Z",
      "expiresAt": "2025-10-02T16:00:00Z"
    }
  ]
}
```

**GET /api/ai/performance?strategy=all**
```json
{
  "strategies": [
    {
      "strategy": "mean_reversion",
      "totalSignals": 145,
      "winRate": 68.5,
      "avgReturn": 2.3,
      "sharpeRatio": 1.85
    },
    {
      "strategy": "trend_following",
      "totalSignals": 89,
      "winRate": 55.0,
      "avgReturn": 4.5,
      "sharpeRatio": 1.42
    }
  ]
}
```

**POST /api/ai/execute-signal**
```json
{
  "signalId": "signal_123",
  "qty": 100,
  "orderType": "limit",
  "limitPrice": 182.50
}
```

**GET /api/ai/backtest-results?strategy=mean_reversion**
```json
{
  "strategy": "mean_reversion",
  "period": "2024-01-01 to 2025-09-30",
  "totalTrades": 145,
  "winningTrades": 99,
  "losingTrades": 46,
  "winRate": 68.3,
  "avgReturn": 2.3,
  "totalReturn": 334.5,
  "sharpeRatio": 1.85,
  "maxDrawdown": -12.5,
  "equityCurve": [...]
}
```

#### Backend Implementation Tasks
1. Integrate ML model (scikit-learn, TensorFlow, or external API)
2. Implement signal generation strategies:
   - RSI mean reversion
   - Moving average crossovers
   - MACD divergence
   - Pattern recognition (head & shoulders, double top/bottom)
3. Create backtesting engine
4. Store signal history for performance tracking
5. Implement confidence scoring system
6. Set up scheduled signal generation (cron job)

#### ML Model Considerations
- **Option 1**: Rule-based strategies (RSI, MACD, MA crossovers)
- **Option 2**: Scikit-learn classifiers (RandomForest, XGBoost)
- **Option 3**: External AI API (OpenAI, Alpaca AI, custom model)
- **Option 4**: Simple statistical models (z-score, percentile-based)

### UI Layout
```
┌─────────────────────────────────────────────┐
│ 🤖 AI Recommendations          [Refresh ↻]  │
├─────────────────────────────────────────────┤
│ Active Signals (3)                          │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ AAPL • BUY • 78% Confidence             │ │
│ │ Mean Reversion Strategy                 │ │
│ │ Entry: $182.50 | Target: $188 | SL: $179│ │
│ │ R:R 1.57 | Expected: +3.0%              │ │
│ │ "RSI oversold at support level..."      │ │
│ │ [Execute Trade →]                       │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Strategy Performance                        │
│ Mean Reversion: 68.5% win rate (145 signals)│
│ Trend Following: 55.0% win rate (89 signals)│
└─────────────────────────────────────────────┘
```

---

## 4. Strategy Builder (🎯)

### Overview
Visual rule designer for creating custom trading strategies with if/then logic, technical indicators, and position sizing rules.

### Features

#### Strategy Configuration
- **Name & Description**: User-defined strategy metadata
- **Entry Rules**: Conditions to enter a trade
- **Exit Rules**: Conditions to exit a trade
- **Position Sizing**: Fixed amount, % of portfolio, or volatility-based
- **Risk Management**: Stop loss, take profit, trailing stops

#### Rule Builder Components
- **Technical Indicators**: RSI, MACD, MA, Bollinger Bands, etc.
- **Price Conditions**: Above/below price level, % change
- **Volume Conditions**: Volume > average, unusual volume
- **Time Conditions**: Time of day, day of week
- **Logical Operators**: AND, OR, NOT

#### Strategy Management
- **Save Strategy**: Persist to database
- **Load Strategy**: Retrieve saved strategies
- **Test Strategy**: Paper trade or backtest
- **Deploy Strategy**: Activate for live trading

### Technical Implementation

#### Component Structure
```tsx
// frontend/components/StrategyBuilder.tsx
interface Strategy {
  id: string;
  name: string;
  description: string;
  entryRules: Rule[];
  exitRules: Rule[];
  positionSizing: PositionSizing;
  riskManagement: RiskManagement;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Rule {
  id: string;
  type: 'indicator' | 'price' | 'volume' | 'time';
  indicator?: string; // 'RSI', 'MACD', 'MA_50', etc.
  operator: '>' | '<' | '=' | '>=' | '<=' | 'crosses_above' | 'crosses_below';
  value: number;
  logicalOperator?: 'AND' | 'OR';
}

interface PositionSizing {
  method: 'fixed' | 'percentage' | 'volatility';
  value: number;
}

interface RiskManagement {
  stopLossType: 'fixed' | 'percentage' | 'trailing';
  stopLossValue: number;
  takeProfitType: 'fixed' | 'percentage';
  takeProfitValue: number;
}
```

#### Required Libraries
```bash
npm install react-flow-renderer  # Visual node-based editor (optional)
```

#### API Endpoints Needed

**GET /api/strategies/list**
```json
{
  "strategies": [
    {
      "id": "strat_123",
      "name": "RSI Mean Reversion",
      "description": "Buy oversold, sell overbought",
      "active": true,
      "createdAt": "2025-09-01T10:00:00Z"
    }
  ]
}
```

**POST /api/strategies/save**
```json
{
  "name": "RSI Mean Reversion",
  "description": "Buy when RSI < 30, sell when RSI > 70",
  "entryRules": [
    {
      "type": "indicator",
      "indicator": "RSI",
      "operator": "<",
      "value": 30
    }
  ],
  "exitRules": [
    {
      "type": "indicator",
      "indicator": "RSI",
      "operator": ">",
      "value": 70
    }
  ],
  "positionSizing": {
    "method": "percentage",
    "value": 5
  },
  "riskManagement": {
    "stopLossType": "percentage",
    "stopLossValue": 2.0,
    "takeProfitType": "percentage",
    "takeProfitValue": 5.0
  }
}
```

**POST /api/strategies/execute**
```json
{
  "strategyId": "strat_123",
  "symbols": ["AAPL", "TSLA", "MSFT"],
  "mode": "paper" | "live"
}
```

**DELETE /api/strategies/{id}**

#### Backend Implementation Tasks
1. Create strategy storage (PostgreSQL/MongoDB)
2. Implement rule evaluation engine
3. Integrate technical indicator library (`ta-lib` or `pandas-ta`)
4. Create strategy execution service
5. Implement paper trading mode
6. Set up strategy monitoring and logging

### UI Layout
```
┌─────────────────────────────────────────────┐
│ 🎯 Strategy Builder                         │
├─────────────────────────────────────────────┤
│ Strategy Name: [RSI Mean Reversion_______]  │
│ Description: [Buy oversold, sell overbought]│
├─────────────────────────────────────────────┤
│ Entry Rules:                                │
│ ┌─────────────────────────────────────────┐ │
│ │ IF [RSI ▼] [< ▼] [30____] [+ Add Rule] │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Exit Rules:                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ IF [RSI ▼] [> ▼] [70____] [+ Add Rule] │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Position Sizing: [Percentage ▼] [5____%]   │
│ Stop Loss: [Percentage ▼] [2____%]         │
│ Take Profit: [Percentage ▼] [5____%]       │
├─────────────────────────────────────────────┤
│ [Save Strategy] [Test Strategy] [Deploy]   │
└─────────────────────────────────────────────┘
```

---

## 5. Backtesting (📈)

### Overview
Historical strategy simulation engine to validate performance before live deployment with detailed analytics and optimization.

### Features

#### Backtest Configuration
- **Strategy Selection**: Choose saved strategy or AI signal
- **Symbol Selection**: Single or multiple symbols
- **Date Range**: Historical period to test
- **Initial Capital**: Starting account balance
- **Commission**: Broker fees per trade

#### Simulation Engine
- **Bar-by-bar replay**: Tick-by-tick or daily/hourly bars
- **Realistic fills**: Slippage and market impact modeling
- **Position tracking**: Track all open/closed positions
- **Cash management**: Account for buying power constraints

#### Performance Metrics
- **Total Return**: % gain/loss
- **Sharpe Ratio**: Risk-adjusted returns
- **Max Drawdown**: Worst peak-to-trough decline
- **Win Rate**: % profitable trades
- **Profit Factor**: Gross profit / Gross loss
- **Trade Statistics**: Total trades, avg win/loss

#### Visualization
- **Equity Curve**: Account value over time
- **Drawdown Chart**: Underwater curve
- **Trade Markers**: Entry/exit points on price chart
- **Monthly Returns**: Heatmap of returns by month

#### Optimization
- **Parameter Sweeping**: Test multiple parameter combinations
- **Walk-Forward Analysis**: Out-of-sample validation
- **Monte Carlo Simulation**: Randomized trade order testing

### Technical Implementation

#### Component Structure
```tsx
// frontend/components/Backtesting.tsx
interface BacktestConfig {
  strategyId: string;
  symbols: string[];
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  slippage: number;
}

interface BacktestResult {
  id: string;
  config: BacktestConfig;
  performance: PerformanceMetrics;
  trades: Trade[];
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  completedAt: string;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  entryPrice: number;
  entryTime: string;
  exitPrice: number;
  exitTime: string;
  pnl: number;
  pnlPercent: number;
}
```

#### Required Libraries
```bash
npm install recharts  # Already installed for P&L Dashboard
```

#### API Endpoints Needed

**POST /api/backtest/run**
```json
{
  "strategyId": "strat_123",
  "symbols": ["AAPL", "TSLA"],
  "startDate": "2024-01-01",
  "endDate": "2025-09-30",
  "initialCapital": 100000,
  "commission": 0.005,
  "slippage": 0.01
}
```

**Response:**
```json
{
  "backtestId": "bt_456",
  "status": "running",
  "estimatedTime": 30
}
```

**GET /api/backtest/results/{id}**
```json
{
  "id": "bt_456",
  "status": "completed",
  "performance": {
    "totalReturn": 25.5,
    "sharpeRatio": 1.85,
    "maxDrawdown": -12.3,
    "winRate": 62.5,
    "profitFactor": 1.95,
    "totalTrades": 145
  },
  "trades": [...],
  "equityCurve": [
    { "date": "2024-01-01", "equity": 100000 },
    { "date": "2024-01-02", "equity": 100500 }
  ],
  "drawdownCurve": [
    { "date": "2024-01-01", "drawdown": 0 },
    { "date": "2024-01-02", "drawdown": -2.5 }
  ]
}
```

**GET /api/market/historical?symbol=AAPL&start=2024-01-01&end=2025-09-30**
```json
{
  "symbol": "AAPL",
  "bars": [
    {
      "date": "2024-01-01",
      "open": 180.50,
      "high": 182.30,
      "low": 179.80,
      "close": 181.20,
      "volume": 45000000
    }
  ]
}
```

**POST /api/backtest/optimize**
```json
{
  "strategyId": "strat_123",
  "parameterRanges": {
    "rsi_period": [10, 14, 20],
    "rsi_oversold": [20, 25, 30],
    "rsi_overbought": [70, 75, 80]
  },
  "symbols": ["AAPL"],
  "startDate": "2024-01-01",
  "endDate": "2025-09-30"
}
```

#### Backend Implementation Tasks
1. Integrate historical data provider (Alpaca, Alpha Vantage, Yahoo Finance)
2. Implement backtesting engine:
   - Event-driven architecture
   - Bar-by-bar simulation
   - Position tracking
   - Order execution simulation
3. Calculate performance metrics
4. Store backtest results
5. Implement parameter optimization (grid search, genetic algorithm)
6. Add Monte Carlo simulation
7. Create report generation (PDF export optional)

#### Backtesting Libraries
- **Python**: `backtrader`, `zipline`, `bt` (behavioral tree)
- **Custom**: Build simple event-driven engine with `pandas`

### UI Layout
```
┌─────────────────────────────────────────────┐
│ 📈 Backtesting                   [Run Test] │
├─────────────────────────────────────────────┤
│ Strategy: [RSI Mean Reversion ▼]           │
│ Symbols: [AAPL, TSLA, MSFT______________]  │
│ Period: [2024-01-01] to [2025-09-30]       │
│ Capital: [$100,000] Commission: [0.005]    │
├─────────────────────────────────────────────┤
│ Performance:                                │
│ Total Return: +25.5% | Sharpe: 1.85        │
│ Max Drawdown: -12.3% | Win Rate: 62.5%     │
├─────────────────────────────────────────────┤
│         Equity Curve (Line Chart)           │
│         ╱╲    ╱╲      ╱╲                    │
│        ╱  ╲  ╱  ╲    ╱  ╲                   │
├─────────────────────────────────────────────┤
│ Trade History (145 trades)                  │
│ AAPL | BUY 100 @ $180.50 → SELL @ $184.10  │
│ P&L: +$360 (+2.0%) • 2024-09-15            │
└─────────────────────────────────────────────┘
```

---

## 🔧 Implementation Notes

### Shared Components
These components can be reused across workflows:

1. **Card Component**: Glassmorphism panel with consistent styling
2. **MetricCard**: Display single metric with label/value/change
3. **LoadingSpinner**: Consistent loading indicator
4. **ErrorBoundary**: Graceful error handling
5. **DateRangePicker**: Reusable date selection
6. **SymbolAutocomplete**: Symbol search/selection

### State Management
- Use React Context for global state (optional)
- Local component state for UI interactions
- React Query for API data fetching and caching (recommended)

```bash
npm install @tanstack/react-query
```

### API Integration Pattern
All workflows follow the same API integration pattern:

```tsx
// Example: Fetching data in a workflow component
const [data, setData] = useState<DataType | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/api/endpoint');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
```

### Testing Strategy
1. **Unit Tests**: Jest for component logic
2. **Integration Tests**: Test API endpoints with mock data
3. **E2E Tests**: Playwright for full workflow testing
4. **Visual Tests**: Storybook for component gallery

---

## 📅 Development Timeline Estimate

| Workflow | Backend (days) | Frontend (days) | Testing (days) | Total |
|----------|----------------|-----------------|----------------|-------|
| P&L Dashboard | 5 | 4 | 2 | 11 days |
| News Review | 7 | 5 | 2 | 14 days |
| AI Recommendations | 10 | 4 | 3 | 17 days |
| Strategy Builder | 8 | 6 | 3 | 17 days |
| Backtesting | 12 | 5 | 4 | 21 days |
| **TOTAL** | **42 days** | **24 days** | **14 days** | **80 days** |

*Assumes 1 developer working full-time. Can be parallelized with multiple developers.*

---

## 🚀 Getting Started

To implement a workflow:

1. Create component file: `frontend/components/{WorkflowName}.tsx`
2. Add backend endpoints to `backend/main.py`
3. Test locally with mock data first
4. Integrate with real API
5. Add to radial menu switch statement in `pages/index.tsx`
6. Deploy and verify in production

See [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md) for detailed implementation guide.
