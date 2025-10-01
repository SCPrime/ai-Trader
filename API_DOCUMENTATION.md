# API Documentation

Complete reference for all backend API endpoints, including working endpoints and planned endpoints for future workflows.

## 🌐 Base URLs

- **Production Backend**: `https://ai-trader-86a1.onrender.com`
- **Local Backend**: `http://localhost:8000`
- **Frontend Proxy**: `/api/proxy/` (all frontend requests use this prefix)

## 🔐 Authentication

Currently using Alpaca API keys configured in backend environment variables. Future authentication system TBD.

---

## ✅ Current Working Endpoints

These endpoints are currently implemented and functional in production.

### Health Check

#### GET `/api/health`

Check backend API health status.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T14:30:00Z",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is down

**Frontend Usage:**
```tsx
const res = await fetch('/api/proxy/api/health');
const data = await res.json();
```

---

### Settings

#### GET `/api/settings`

Retrieve trading account settings and configuration.

**Request:**
```http
GET /api/settings
```

**Response:**
```json
{
  "accountId": "abc123",
  "tradingEnabled": true,
  "marginMultiplier": 4,
  "buyingPower": 100000.00,
  "daytradingBuyingPower": 400000.00,
  "currency": "USD",
  "patternDayTrader": false
}
```

**Status Codes:**
- `200 OK`: Settings retrieved successfully
- `401 Unauthorized`: Invalid API credentials
- `500 Internal Server Error`: Backend error

---

### Portfolio Positions

#### GET `/api/portfolio/positions`

Retrieve all current open positions.

**Request:**
```http
GET /api/portfolio/positions
```

**Response:**
```json
{
  "positions": [
    {
      "symbol": "AAPL",
      "qty": 100,
      "side": "long",
      "avgEntryPrice": 182.50,
      "marketPrice": 184.10,
      "marketValue": 18410.00,
      "costBasis": 18250.00,
      "unrealizedPnL": 160.00,
      "unrealizedPnLPercent": 0.877,
      "currentPrice": 184.10,
      "lastdayPrice": 183.00,
      "changeToday": 0.006
    }
  ]
}
```

**Field Descriptions:**
- `symbol`: Stock ticker symbol
- `qty`: Number of shares (positive for long, negative for short)
- `side`: Position direction (`"long"` or `"short"`)
- `avgEntryPrice`: Average cost basis per share
- `marketPrice`: Current market price per share
- `marketValue`: Current total position value (`qty * marketPrice`)
- `costBasis`: Total cost of position (`qty * avgEntryPrice`)
- `unrealizedPnL`: Profit/loss in dollars
- `unrealizedPnLPercent`: Profit/loss as percentage (0.877 = 0.877%)
- `currentPrice`: Same as `marketPrice` (redundant field)
- `lastdayPrice`: Previous day's closing price
- `changeToday`: Today's price change as percentage

**Status Codes:**
- `200 OK`: Positions retrieved successfully
- `401 Unauthorized`: Invalid API credentials
- `500 Internal Server Error`: Backend error

**Frontend Usage:**
```tsx
const res = await fetch('/api/proxy/api/portfolio/positions');
const { positions } = await res.json();
```

---

### Execute Trade

#### POST `/api/trades/execute`

Submit a new order for execution.

**Request:**
```http
POST /api/trades/execute
Content-Type: application/json

{
  "symbol": "AAPL",
  "qty": 10,
  "side": "buy",
  "type": "market",
  "timeInForce": "day"
}
```

**Request Body Fields:**
- `symbol` (string, required): Stock ticker symbol
- `qty` (number, required): Number of shares
- `side` (string, required): `"buy"` or `"sell"`
- `type` (string, required): Order type (`"market"`, `"limit"`, `"stop"`, `"stop_limit"`)
- `timeInForce` (string, optional): `"day"`, `"gtc"`, `"ioc"`, `"fok"` (default: `"day"`)
- `limitPrice` (number, optional): Limit price (required if `type` is `"limit"` or `"stop_limit"`)
- `stopPrice` (number, optional): Stop price (required if `type` is `"stop"` or `"stop_limit"`)

**Response:**
```json
{
  "orderId": "order_123abc",
  "symbol": "AAPL",
  "qty": 10,
  "side": "buy",
  "type": "market",
  "status": "accepted",
  "submittedAt": "2025-10-01T14:30:00Z"
}
```

**Status Codes:**
- `200 OK`: Order submitted successfully
- `400 Bad Request`: Invalid order parameters
- `401 Unauthorized`: Invalid API credentials
- `403 Forbidden`: Trading not enabled or insufficient buying power
- `500 Internal Server Error`: Order submission failed

**Frontend Usage:**
```tsx
const order = {
  symbol: 'AAPL',
  qty: 10,
  side: 'buy',
  type: 'market',
  timeInForce: 'day'
};

const res = await fetch('/api/proxy/api/trades/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(order)
});

const result = await res.json();
```

---

## 🚧 Planned Endpoints

These endpoints need to be implemented for future workflows.

### P&L Dashboard Endpoints

#### GET `/api/portfolio/summary`

Get portfolio summary with P&L metrics.

**Request:**
```http
GET /api/portfolio/summary
```

**Response:**
```json
{
  "totalValue": 125430.50,
  "dailyPnL": 1250.30,
  "dailyPnLPercent": 1.01,
  "weeklyPnL": 3450.75,
  "weeklyPnLPercent": 2.83,
  "monthlyPnL": 8920.40,
  "monthlyPnLPercent": 7.66,
  "realizedPnL": 15430.20,
  "unrealizedPnL": 2340.80,
  "cashBalance": 50000.00,
  "equity": 125430.50,
  "buyingPower": 200000.00,
  "timestamp": "2025-10-01T14:30:00Z"
}
```

---

#### GET `/api/portfolio/history`

Get historical portfolio equity values.

**Request:**
```http
GET /api/portfolio/history?period=1M&interval=1D
```

**Query Parameters:**
- `period` (string, required): Time period (`1D`, `1W`, `1M`, `3M`, `1Y`, `ALL`)
- `interval` (string, optional): Data granularity (`1m`, `5m`, `1H`, `1D`) (default: `1D`)

**Response:**
```json
{
  "data": [
    {
      "date": "2025-09-01",
      "equity": 120000.00,
      "dailyPnL": 500.00,
      "dailyPnLPercent": 0.42
    },
    {
      "date": "2025-09-02",
      "equity": 120300.00,
      "dailyPnL": 300.00,
      "dailyPnLPercent": 0.25
    }
  ],
  "startDate": "2025-09-01",
  "endDate": "2025-09-30",
  "totalReturn": 5430.50,
  "totalReturnPercent": 4.52
}
```

---

#### GET `/api/analytics/performance`

Get performance metrics and risk statistics.

**Request:**
```http
GET /api/analytics/performance?period=1Y
```

**Query Parameters:**
- `period` (string, optional): Time period (`1M`, `3M`, `1Y`, `ALL`) (default: `ALL`)

**Response:**
```json
{
  "sharpeRatio": 1.85,
  "sortinoRatio": 2.15,
  "maxDrawdown": -8.5,
  "maxDrawdownDate": "2025-06-15",
  "winRate": 62.5,
  "avgWin": 450.30,
  "avgLoss": -280.50,
  "profitFactor": 1.95,
  "totalTrades": 145,
  "winningTrades": 91,
  "losingTrades": 54,
  "avgTradeDuration": "2.5 days",
  "bestTrade": 1250.00,
  "worstTrade": -850.00
}
```

---

#### GET `/api/analytics/trades`

Get trade history with P&L details.

**Request:**
```http
GET /api/analytics/trades?period=1M&limit=50&offset=0
```

**Query Parameters:**
- `period` (string, optional): Time period (`1D`, `1W`, `1M`, `3M`, `1Y`, `ALL`)
- `limit` (number, optional): Max number of trades to return (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)
- `symbol` (string, optional): Filter by symbol

**Response:**
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
      "pnlPercent": 1.99,
      "entryTime": "2025-09-15T09:30:00Z",
      "exitTime": "2025-09-16T15:45:00Z",
      "duration": "1 day 6 hours",
      "commission": 2.00
    }
  ],
  "total": 145,
  "hasMore": true
}
```

---

### News Review Endpoints

#### GET `/api/news/feed`

Get market news feed with sentiment analysis.

**Request:**
```http
GET /api/news/feed?limit=50&offset=0&sentiment=bullish&symbols=AAPL,TSLA
```

**Query Parameters:**
- `limit` (number, optional): Max articles to return (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)
- `sentiment` (string, optional): Filter by sentiment (`bullish`, `bearish`, `neutral`)
- `symbols` (string, optional): Comma-separated list of symbols
- `sources` (string, optional): Comma-separated news sources
- `dateFrom` (string, optional): Start date (ISO 8601)
- `dateTo` (string, optional): End date (ISO 8601)
- `search` (string, optional): Keyword search

**Response:**
```json
{
  "articles": [
    {
      "id": "news_123",
      "title": "Apple Announces Q4 Earnings Beat Expectations",
      "summary": "Apple Inc. reported quarterly earnings that exceeded analyst expectations...",
      "source": "Bloomberg",
      "author": "John Doe",
      "url": "https://example.com/article",
      "publishedAt": "2025-10-01T14:00:00Z",
      "sentiment": "bullish",
      "sentimentScore": 0.75,
      "symbols": ["AAPL"],
      "category": "earnings",
      "imageUrl": "https://example.com/image.jpg"
    }
  ],
  "total": 1250,
  "hasMore": true
}
```

**Sentiment Score:**
- `1.0` to `0.5`: Bullish
- `0.5` to `-0.5`: Neutral
- `-0.5` to `-1.0`: Bearish

---

#### GET `/api/news/sentiment`

Get aggregated sentiment for a specific symbol.

**Request:**
```http
GET /api/news/sentiment?symbol=AAPL&period=1W
```

**Query Parameters:**
- `symbol` (string, required): Stock ticker symbol
- `period` (string, optional): Time period (`1D`, `1W`, `1M`) (default: `1D`)

**Response:**
```json
{
  "symbol": "AAPL",
  "overallSentiment": "bullish",
  "sentimentScore": 0.65,
  "articleCount": 45,
  "bullishCount": 30,
  "bearishCount": 10,
  "neutralCount": 5,
  "lastUpdated": "2025-10-01T14:30:00Z",
  "trend": "increasing"
}
```

---

#### WebSocket `/ws/news`

Real-time news updates via WebSocket.

**Connection:**
```javascript
const ws = new WebSocket('wss://ai-trader-86a1.onrender.com/ws/news');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New article:', data);
};
```

**Message Format:**
```json
{
  "type": "breaking",
  "article": {
    "id": "news_456",
    "title": "Fed Announces Rate Cut",
    "symbol": ["SPY"],
    "sentiment": "bullish",
    "sentimentScore": 0.85,
    "priority": "high",
    "publishedAt": "2025-10-01T14:30:00Z"
  }
}
```

---

### AI Recommendations Endpoints

#### GET `/api/ai/signals`

Get active AI-generated trade signals.

**Request:**
```http
GET /api/ai/signals?active=true&strategy=all&minConfidence=70
```

**Query Parameters:**
- `active` (boolean, optional): Filter active signals only (default: true)
- `strategy` (string, optional): Filter by strategy type (default: `all`)
- `minConfidence` (number, optional): Minimum confidence score (0-100) (default: 0)
- `symbols` (string, optional): Comma-separated symbols

**Response:**
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
      "expectedReturnPercent": 3.01,
      "riskRewardRatio": 1.57,
      "timeHorizon": "short",
      "reasoning": "RSI oversold (28) with support at $180. Historical bounce probability 78%.",
      "indicators": {
        "RSI": 28,
        "MACD": -1.2,
        "support": 180.00,
        "resistance": 190.00
      },
      "generatedAt": "2025-10-01T14:00:00Z",
      "expiresAt": "2025-10-02T16:00:00Z",
      "status": "active"
    }
  ],
  "total": 5
}
```

**Time Horizons:**
- `short`: 1-5 days
- `medium`: 1-4 weeks
- `long`: 1-6 months

---

#### GET `/api/ai/performance`

Get historical performance of AI strategies.

**Request:**
```http
GET /api/ai/performance?strategy=mean_reversion&period=6M
```

**Query Parameters:**
- `strategy` (string, optional): Strategy type (default: `all`)
- `period` (string, optional): Time period (`1M`, `3M`, `6M`, `1Y`, `ALL`)

**Response:**
```json
{
  "strategies": [
    {
      "strategy": "mean_reversion",
      "totalSignals": 145,
      "activeSignals": 3,
      "executedSignals": 142,
      "winRate": 68.5,
      "avgReturn": 2.3,
      "totalReturn": 334.5,
      "sharpeRatio": 1.85,
      "maxDrawdown": -5.2,
      "bestTrade": 15.5,
      "worstTrade": -8.2,
      "avgDuration": "3.2 days"
    },
    {
      "strategy": "trend_following",
      "totalSignals": 89,
      "activeSignals": 2,
      "executedSignals": 87,
      "winRate": 55.0,
      "avgReturn": 4.5,
      "totalReturn": 391.5,
      "sharpeRatio": 1.42,
      "maxDrawdown": -8.7,
      "bestTrade": 22.3,
      "worstTrade": -12.5,
      "avgDuration": "8.5 days"
    }
  ]
}
```

---

#### POST `/api/ai/execute-signal`

Execute a trade based on an AI signal.

**Request:**
```http
POST /api/ai/execute-signal
Content-Type: application/json

{
  "signalId": "signal_123",
  "qty": 100,
  "orderType": "limit",
  "limitPrice": 182.50
}
```

**Request Body:**
- `signalId` (string, required): ID of the signal to execute
- `qty` (number, required): Number of shares
- `orderType` (string, optional): Order type (`market` or `limit`) (default: `market`)
- `limitPrice` (number, optional): Limit price (required if `orderType` is `limit`)

**Response:**
```json
{
  "orderId": "order_789",
  "signalId": "signal_123",
  "symbol": "AAPL",
  "qty": 100,
  "side": "buy",
  "status": "accepted",
  "submittedAt": "2025-10-01T14:35:00Z"
}
```

---

#### GET `/api/ai/backtest-results`

Get backtesting results for a specific strategy.

**Request:**
```http
GET /api/ai/backtest-results?strategy=mean_reversion&period=1Y
```

**Query Parameters:**
- `strategy` (string, required): Strategy type
- `period` (string, optional): Time period (default: `1Y`)

**Response:**
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
  "profitFactor": 2.15,
  "equityCurve": [
    { "date": "2024-01-01", "equity": 100000 },
    { "date": "2024-01-02", "equity": 100230 }
  ]
}
```

---

### Strategy Builder Endpoints

#### GET `/api/strategies/list`

Get all saved strategies.

**Request:**
```http
GET /api/strategies/list?active=true
```

**Query Parameters:**
- `active` (boolean, optional): Filter active strategies only

**Response:**
```json
{
  "strategies": [
    {
      "id": "strat_123",
      "name": "RSI Mean Reversion",
      "description": "Buy oversold, sell overbought",
      "active": true,
      "createdAt": "2025-09-01T10:00:00Z",
      "updatedAt": "2025-09-15T12:00:00Z",
      "totalTrades": 45,
      "winRate": 68.5,
      "totalReturn": 125.30
    }
  ],
  "total": 12
}
```

---

#### POST `/api/strategies/save`

Create or update a strategy.

**Request:**
```http
POST /api/strategies/save
Content-Type: application/json

{
  "id": "strat_123",
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

**Response:**
```json
{
  "id": "strat_123",
  "name": "RSI Mean Reversion",
  "status": "saved",
  "createdAt": "2025-10-01T14:40:00Z"
}
```

---

#### POST `/api/strategies/execute`

Activate a strategy for live trading.

**Request:**
```http
POST /api/strategies/execute
Content-Type: application/json

{
  "strategyId": "strat_123",
  "symbols": ["AAPL", "TSLA", "MSFT"],
  "mode": "paper"
}
```

**Request Body:**
- `strategyId` (string, required): Strategy ID
- `symbols` (string[], required): List of symbols to trade
- `mode` (string, required): Trading mode (`paper` or `live`)

**Response:**
```json
{
  "strategyId": "strat_123",
  "status": "active",
  "mode": "paper",
  "symbols": ["AAPL", "TSLA", "MSFT"],
  "activatedAt": "2025-10-01T14:45:00Z"
}
```

---

#### DELETE `/api/strategies/{id}`

Delete a strategy.

**Request:**
```http
DELETE /api/strategies/strat_123
```

**Response:**
```json
{
  "id": "strat_123",
  "status": "deleted",
  "deletedAt": "2025-10-01T14:50:00Z"
}
```

---

### Backtesting Endpoints

#### POST `/api/backtest/run`

Run a backtest for a strategy.

**Request:**
```http
POST /api/backtest/run
Content-Type: application/json

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

**Request Body:**
- `strategyId` (string, required): Strategy to backtest
- `symbols` (string[], required): Symbols to trade
- `startDate` (string, required): Start date (ISO 8601)
- `endDate` (string, required): End date (ISO 8601)
- `initialCapital` (number, optional): Starting capital (default: 100000)
- `commission` (number, optional): Commission per trade (default: 0)
- `slippage` (number, optional): Slippage percent (default: 0)

**Response:**
```json
{
  "backtestId": "bt_456",
  "status": "running",
  "estimatedTime": 30,
  "startedAt": "2025-10-01T14:55:00Z"
}
```

---

#### GET `/api/backtest/results/{id}`

Get backtest results.

**Request:**
```http
GET /api/backtest/results/bt_456
```

**Response:**
```json
{
  "id": "bt_456",
  "status": "completed",
  "completedAt": "2025-10-01T15:00:00Z",
  "config": {
    "strategyId": "strat_123",
    "symbols": ["AAPL", "TSLA"],
    "startDate": "2024-01-01",
    "endDate": "2025-09-30",
    "initialCapital": 100000
  },
  "performance": {
    "totalReturn": 25.5,
    "totalReturnPercent": 25.5,
    "annualizedReturn": 28.3,
    "sharpeRatio": 1.85,
    "sortinoRatio": 2.15,
    "maxDrawdown": -12.3,
    "maxDrawdownDate": "2025-06-15",
    "winRate": 62.5,
    "profitFactor": 1.95,
    "totalTrades": 145,
    "winningTrades": 91,
    "losingTrades": 54,
    "avgWin": 450.30,
    "avgLoss": -280.50,
    "bestTrade": 1250.00,
    "worstTrade": -850.00
  },
  "trades": [
    {
      "id": "trade_1",
      "symbol": "AAPL",
      "side": "buy",
      "qty": 100,
      "entryPrice": 180.50,
      "entryTime": "2024-01-15T09:30:00Z",
      "exitPrice": 184.10,
      "exitTime": "2024-01-16T15:45:00Z",
      "pnl": 360.00,
      "pnlPercent": 1.99,
      "duration": "1 day 6 hours"
    }
  ],
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

---

#### GET `/api/market/historical`

Get historical market data for backtesting.

**Request:**
```http
GET /api/market/historical?symbol=AAPL&start=2024-01-01&end=2025-09-30&interval=1D
```

**Query Parameters:**
- `symbol` (string, required): Stock ticker symbol
- `start` (string, required): Start date (ISO 8601)
- `end` (string, required): End date (ISO 8601)
- `interval` (string, optional): Bar interval (`1m`, `5m`, `1H`, `1D`) (default: `1D`)

**Response:**
```json
{
  "symbol": "AAPL",
  "interval": "1D",
  "bars": [
    {
      "date": "2024-01-01",
      "open": 180.50,
      "high": 182.30,
      "low": 179.80,
      "close": 181.20,
      "volume": 45000000
    },
    {
      "date": "2024-01-02",
      "open": 181.20,
      "high": 183.50,
      "low": 180.90,
      "close": 182.80,
      "volume": 48000000
    }
  ],
  "total": 252
}
```

---

#### POST `/api/backtest/optimize`

Run parameter optimization for a strategy.

**Request:**
```http
POST /api/backtest/optimize
Content-Type: application/json

{
  "strategyId": "strat_123",
  "parameterRanges": {
    "rsi_period": [10, 14, 20],
    "rsi_oversold": [20, 25, 30],
    "rsi_overbought": [70, 75, 80]
  },
  "symbols": ["AAPL"],
  "startDate": "2024-01-01",
  "endDate": "2025-09-30",
  "optimizationMetric": "sharpe_ratio"
}
```

**Request Body:**
- `strategyId` (string, required): Strategy to optimize
- `parameterRanges` (object, required): Parameter values to test
- `symbols` (string[], required): Symbols to trade
- `startDate` (string, required): Start date
- `endDate` (string, required): End date
- `optimizationMetric` (string, optional): Metric to optimize (default: `sharpe_ratio`)

**Response:**
```json
{
  "optimizationId": "opt_789",
  "status": "running",
  "totalCombinations": 27,
  "estimatedTime": 180,
  "startedAt": "2025-10-01T15:05:00Z"
}
```

---

## 🔧 Error Handling

All endpoints follow a consistent error response format:

**Error Response:**
```json
{
  "error": {
    "code": "INVALID_SYMBOL",
    "message": "Symbol 'XYZ' not found",
    "details": {
      "symbol": "XYZ",
      "validSymbols": ["AAPL", "TSLA", "MSFT"]
    }
  },
  "timestamp": "2025-10-01T15:10:00Z"
}
```

**Common Error Codes:**
- `INVALID_REQUEST`: Malformed request body
- `INVALID_SYMBOL`: Symbol not found
- `INSUFFICIENT_BUYING_POWER`: Not enough funds
- `MARKET_CLOSED`: Trading not allowed (market closed)
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `UNAUTHORIZED`: Invalid API credentials
- `INTERNAL_ERROR`: Backend server error

**HTTP Status Codes:**
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Action not allowed
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Backend error
- `503 Service Unavailable`: Service down

---

## 🔄 Rate Limiting

To prevent abuse and stay within Alpaca API limits:

- **Per IP**: 200 requests per minute
- **Per User**: 1000 requests per hour
- **Burst**: 10 requests per second

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1633024800
```

---

## 📚 Additional Resources

- **Alpaca API Docs**: https://alpaca.markets/docs/api-references/trading-api/
- **Alpha Vantage News API**: https://www.alphavantage.co/documentation/#news-sentiment
- **Finnhub News API**: https://finnhub.io/docs/api/market-news

---

## 🧪 Testing Endpoints

Use `curl` or Postman to test endpoints locally:

**Example: Health Check**
```bash
curl http://localhost:8000/api/health
```

**Example: Get Positions**
```bash
curl http://localhost:8000/api/portfolio/positions
```

**Example: Execute Trade**
```bash
curl -X POST http://localhost:8000/api/trades/execute \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "qty": 10,
    "side": "buy",
    "type": "market"
  }'
```

---

## 📝 Implementation Checklist

When implementing a new endpoint:

- [ ] Define request/response TypeScript interfaces
- [ ] Add endpoint to FastAPI backend (`main.py`)
- [ ] Implement business logic and error handling
- [ ] Add input validation (Pydantic models)
- [ ] Test with `curl` or Postman
- [ ] Document in this file
- [ ] Update frontend component to use endpoint
- [ ] Test integration with frontend
- [ ] Deploy to production
- [ ] Verify in production environment

See [ROADMAP.md](./ROADMAP.md) for workflow implementation plans and [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md) for frontend integration guide.
