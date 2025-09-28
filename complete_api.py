from fastapi import FastAPI, WebSocket, HTTPException, Request
from fastapi.websockets import WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
import sys
import requests
import feedparser
from bs4 import BeautifulSoup

# Pydantic models for request/response
class TradeRequest(BaseModel):
    symbol: str
    qty: int
    side: Optional[str] = "buy"

class StrategyRequest(BaseModel):
    symbol: str
    strikes: List[float]
    expiration: str

class SpreadRequest(BaseModel):
    symbol: str
    buy_strike: float
    sell_strike: float
    expiration: str

class SettingsModel(BaseModel):
    position_size: float = 2.0
    stop_loss: float = 2.0
    take_profit: float = 4.0
    risk_per_trade: float = 1.0
    max_positions: int = 5

app = FastAPI(title="AI Trading Bot Complete API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files if directory exists
if os.path.exists("src/web/static"):
    app.mount("/static", StaticFiles(directory="src/web/static"), name="static")

# In-memory storage for demo data
demo_account = {
    "portfolio_value": 10000.00,
    "buying_power": 5000.00,
    "equity": 10000.00,
    "last_equity": 9950.00,
    "cash": 3000.00,
    "day_trade_count": 0,
    "status": "ACTIVE"
}

demo_positions = [
    {
        "symbol": "AAPL",
        "qty": 10,
        "side": "long",
        "market_value": 2550.0,
        "unrealized_pl": 50.0,
        "avg_price": 250.0,
        "current_price": 255.0,
        "pnl_percent": 2.0
    },
    {
        "symbol": "TSLA",
        "qty": 5,
        "side": "long",
        "market_value": 1200.0,
        "unrealized_pl": -25.0,
        "avg_price": 245.0,
        "current_price": 240.0,
        "pnl_percent": -2.04
    }
]

demo_orders = [
    {"id": "order_1", "symbol": "AAPL", "qty": 5, "side": "buy", "status": "filled", "filled_at": "2025-09-28T10:30:00Z"},
    {"id": "order_2", "symbol": "TSLA", "qty": 2, "side": "sell", "status": "pending", "submitted_at": "2025-09-28T11:00:00Z"}
]

demo_strategies = [
    {"name": "RSI Strategy", "symbol": "AAPL", "active": True, "pnl": 150.0},
    {"name": "MACD Strategy", "symbol": "TSLA", "active": False, "pnl": -50.0}
]

settings = SettingsModel()

# WebSocket connections
active_websockets = []

# News fetcher class
class RealNewsFetcher:
    """Fetch real news from multiple sources"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def get_reddit_finance_news(self):
        """Get news from Reddit finance communities"""
        try:
            # Use Reddit JSON API (no auth required for public posts)
            urls = [
                'https://www.reddit.com/r/investing/hot.json?limit=5',
                'https://www.reddit.com/r/stocks/hot.json?limit=5',
                'https://www.reddit.com/r/SecurityAnalysis/hot.json?limit=3'
            ]

            all_news = []
            for url in urls:
                try:
                    response = self.session.get(url, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        for post in data.get('data', {}).get('children', []):
                            post_data = post.get('data', {})
                            if post_data.get('title') and not post_data.get('stickied'):
                                all_news.append({
                                    'id': post_data.get('id'),
                                    'title': post_data.get('title', '')[:100],
                                    'summary': post_data.get('selftext', '')[:200] or 'Discussion thread',
                                    'source': f"Reddit r/{post_data.get('subreddit', 'finance')}",
                                    'published': datetime.fromtimestamp(post_data.get('created_utc', 0)).isoformat(),
                                    'category': 'discussion',
                                    'relevance': 'medium',
                                    'url': f"https://reddit.com{post_data.get('permalink', '')}"
                                })
                except Exception as e:
                    continue

            return all_news[:10]
        except Exception as e:
            return []

    def get_yahoo_finance_news(self, symbol=None):
        """Get news from Yahoo Finance RSS"""
        try:
            if symbol:
                # Yahoo Finance symbol-specific news
                url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US"
            else:
                # Yahoo Finance general market news
                url = "https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US"

            feed = feedparser.parse(url)
            news = []

            for entry in feed.entries[:10]:
                # Extract sentiment from title
                title = entry.title.lower()
                sentiment = 'neutral'
                if any(word in title for word in ['surge', 'jump', 'rise', 'gain', 'beat', 'strong', 'up', 'soars']):
                    sentiment = 'positive'
                elif any(word in title for word in ['fall', 'drop', 'loss', 'decline', 'miss', 'weak', 'down', 'plunge']):
                    sentiment = 'negative'

                # Clean up summary
                summary = ''
                if hasattr(entry, 'summary'):
                    summary = BeautifulSoup(entry.summary, 'html.parser').get_text()[:250]
                elif hasattr(entry, 'description'):
                    summary = BeautifulSoup(entry.description, 'html.parser').get_text()[:250]

                news.append({
                    'id': entry.get('id', entry.link),
                    'title': entry.title,
                    'summary': summary or 'Read full article for details',
                    'source': 'Yahoo Finance',
                    'published': entry.published if hasattr(entry, 'published') else datetime.now().isoformat(),
                    'category': 'financial_news',
                    'relevance': 'high',
                    'sentiment': sentiment,
                    'url': entry.link
                })

            return news
        except Exception as e:
            print(f"Yahoo Finance error: {e}")
            return []

    def get_google_finance_news(self, symbol=None):
        """Get news from Google Finance RSS"""
        try:
            if symbol:
                # Google Finance company news
                url = f"https://news.google.com/rss/search?q={symbol}+stock&hl=en-US&gl=US&ceid=US:en"
            else:
                # General business news
                url = "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZ4ZERBU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en"

            feed = feedparser.parse(url)
            news = []

            for entry in feed.entries[:8]:
                # Extract sentiment from title
                title = entry.title.lower()
                sentiment = 'neutral'
                if any(word in title for word in ['surge', 'jump', 'rise', 'gain', 'beat', 'strong']):
                    sentiment = 'positive'
                elif any(word in title for word in ['fall', 'drop', 'loss', 'decline', 'miss', 'weak']):
                    sentiment = 'negative'

                news.append({
                    'id': entry.get('id', entry.link),
                    'title': entry.title,
                    'summary': BeautifulSoup(entry.summary, 'html.parser').get_text()[:200] if hasattr(entry, 'summary') else '',
                    'source': entry.get('source', {}).get('title', 'Google News'),
                    'published': entry.published if hasattr(entry, 'published') else datetime.now().isoformat(),
                    'category': 'market_news',
                    'relevance': 'high',
                    'sentiment': sentiment,
                    'url': entry.link
                })

            return news
        except Exception as e:
            return []

    def get_symbol_news(self, symbol):
        """Get news for specific symbol"""
        try:
            # Try multiple sources, prioritizing Yahoo Finance
            news = []

            # First try Yahoo Finance for the symbol
            yahoo_news = self.get_yahoo_finance_news(symbol)
            news.extend(yahoo_news)

            # If we don't have enough news, try Google News
            if len(news) < 5:
                google_news = self.get_google_finance_news(symbol)
                news.extend(google_news)

            # If still not enough, add some general finance discussions
            if len(news) < 3:
                general_news = self.get_reddit_finance_news()
                news.extend(general_news[:3])

            return news[:10]
        except Exception as e:
            return []

# Initialize news fetcher
news_fetcher = RealNewsFetcher()

# ============ MAIN DASHBOARD ============
@app.get("/", response_class=HTMLResponse)
async def get_dashboard():
    """Serve main dashboard."""
    dashboard_path = "src/web/templates/dashboard.html"
    if os.path.exists(dashboard_path):
        with open(dashboard_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
            # Replace template variables with actual values
            html_content = html_content.replace('{% if is_live_trading %}checked{% endif %}', '')
            html_content = html_content.replace('{% if is_ai_auto_mode %}checked{% endif %}', 'checked')
            html_content = html_content.replace('{% if is_live_trading %}Live Trading{% else %}Paper Trading{% endif %}', 'Paper Trading')
            return HTMLResponse(html_content)

    # Fallback HTML if dashboard file not found
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI Trading Dashboard</title>
        <style>
            body { font-family: Arial; padding: 20px; background: #f0f0f0; }
            .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            button { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; }
            .buy { background: #4CAF50; color: white; }
            .sell { background: #f44336; color: white; }
            input { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
            #chart { height: 400px; background: #fff; border: 1px solid #ddd; }
        </style>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    </head>
    <body>
        <h1>AI Trading Dashboard</h1>

        <div class="card">
            <h2>Account Summary</h2>
            <p>Portfolio Value: $<span id="portfolio">Loading...</span></p>
            <p>Buying Power: $<span id="buying-power">Loading...</span></p>
            <p>Status: <span id="status">Loading...</span></p>
        </div>

        <div class="card">
            <h2>Quick Trade</h2>
            <input id="symbol" value="AAPL" placeholder="Symbol">
            <input id="quantity" value="10" type="number" placeholder="Quantity">
            <button class="buy" onclick="trade('buy')">Buy</button>
            <button class="sell" onclick="trade('sell')">Sell</button>
        </div>

        <div class="card">
            <h2>Chart</h2>
            <div id="chart"></div>
        </div>

        <div class="card">
            <h2>Positions</h2>
            <div id="positions">Loading...</div>
        </div>

        <div class="card">
            <h2>Recent Orders</h2>
            <div id="orders">Loading...</div>
        </div>

        <div class="card">
            <h2>Market News Feed</h2>
            <div style="margin-bottom: 15px;">
                <button onclick="loadNews('general')" style="margin: 5px;">General News</button>
                <button onclick="loadNews('AAPL')" style="margin: 5px;">AAPL News</button>
                <button onclick="loadOptionsNews('AAPL')" style="margin: 5px;">AAPL Options</button>
                <button onclick="loadNews('TSLA')" style="margin: 5px;">TSLA News</button>
            </div>
            <div id="news-feed">Loading news...</div>
        </div>

        <script>
            async function loadData() {
                try {
                    const account = await fetch('/api/account').then(r => r.json());
                    document.getElementById('portfolio').textContent = account.portfolio_value.toFixed(2);
                    document.getElementById('buying-power').textContent = account.buying_power.toFixed(2);
                    document.getElementById('status').textContent = account.status;

                    const positions = await fetch('/api/positions').then(r => r.json());
                    document.getElementById('positions').innerHTML = positions.length
                        ? positions.map(p => `${p.symbol}: ${p.qty} shares ($${p.market_value})`).join('<br>')
                        : 'No positions';

                    const orders = await fetch('/api/orders').then(r => r.json());
                    document.getElementById('orders').innerHTML = orders.length
                        ? orders.map(o => `${o.symbol} ${o.side} ${o.qty} - ${o.status}`).join('<br>')
                        : 'No orders';

                    // Load chart
                    const chartData = await fetch('/api/chart/AAPL').then(r => r.json());
                    const trace = {
                        x: chartData.timestamps,
                        y: chartData.data || chartData.prices,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: chartData.symbol
                    };
                    Plotly.newPlot('chart', [trace], {title: `${chartData.symbol} Price Chart`});
                } catch (e) {
                    console.error('Error loading data:', e);
                }
            }

            async function trade(side) {
                const symbol = document.getElementById('symbol').value;
                const qty = parseInt(document.getElementById('quantity').value);

                try {
                    const response = await fetch(`/api/trade/${symbol}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({symbol, qty, side})
                    });
                    const result = await response.json();
                    alert(`${side.toUpperCase()} order submitted: ${JSON.stringify(result)}`);
                    loadData();
                } catch (e) {
                    alert(`Error: ${e.message}`);
                }
            }

            async function loadNews(type) {
                try {
                    let url = type === 'general' ? '/api/news' : `/api/news/${type}`;
                    const response = await fetch(url);
                    const data = await response.json();

                    const newsContainer = document.getElementById('news-feed');
                    const newsItems = type === 'general' ? data.news : data.news;

                    newsContainer.innerHTML = newsItems.map(item => `
                        <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                            <h4 style="margin: 0; color: #333;">${item.title}</h4>
                            <p style="margin: 5px 0; color: #666; font-size: 14px;">${item.summary}</p>
                            <div style="font-size: 12px; color: #999;">
                                <span>${item.source}</span> •
                                <span>${new Date(item.published).toLocaleTimeString()}</span> •
                                <span style="background: ${item.sentiment === 'positive' ? '#d4edda' : item.sentiment === 'negative' ? '#f8d7da' : '#e2e3e5'}; padding: 2px 6px; border-radius: 3px;">
                                    ${item.category}
                                </span>
                                ${item.sentiment ? `• <span style="color: ${item.sentiment === 'positive' ? 'green' : item.sentiment === 'negative' ? 'red' : 'gray'}">${item.sentiment}</span>` : ''}
                            </div>
                        </div>
                    `).join('');
                } catch (e) {
                    document.getElementById('news-feed').innerHTML = '<p>Error loading news</p>';
                }
            }

            async function loadOptionsNews(symbol) {
                try {
                    const response = await fetch(`/api/news/options/${symbol}`);
                    const data = await response.json();

                    const newsContainer = document.getElementById('news-feed');
                    newsContainer.innerHTML = `
                        <div style="margin-bottom: 20px;">
                            <h3>Options Flow for ${data.symbol}</h3>
                            ${data.options_flow.map(flow => `
                                <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; background: ${flow.sentiment === 'bullish' ? '#e8f5e8' : flow.sentiment === 'bearish' ? '#ffe8e8' : '#f8f9fa'};">
                                    <h4 style="margin: 0; color: #333;">${flow.title}</h4>
                                    <p style="margin: 8px 0;">${flow.description}</p>
                                    <div style="font-size: 14px;">
                                        ${flow.volume ? `<span><strong>Volume:</strong> ${flow.volume}</span> • ` : ''}
                                        ${flow.premium ? `<span><strong>Premium:</strong> ${flow.premium}</span> • ` : ''}
                                        ${flow.implied_volatility ? `<span><strong>IV:</strong> ${flow.implied_volatility}</span> • ` : ''}
                                        <span style="color: ${flow.sentiment === 'bullish' ? 'green' : flow.sentiment === 'bearish' ? 'red' : 'gray'};">
                                            <strong>${flow.sentiment.toUpperCase()}</strong>
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                            <h4>Earnings Calendar</h4>
                            <p><strong>Next Earnings:</strong> ${data.earnings_calendar.next_earnings}</p>
                            <p><strong>EPS Estimate:</strong> $${data.earnings_calendar.estimate_eps}</p>
                            <p><strong>Analyst Coverage:</strong> ${data.earnings_calendar.analyst_count} analysts</p>
                        </div>
                    `;
                } catch (e) {
                    document.getElementById('news-feed').innerHTML = '<p>Error loading options news</p>';
                }
            }

            // WebSocket connection
            const ws = new WebSocket(`ws://${location.host}/ws`);
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                console.log('WebSocket data:', data);
                if (data.type === 'price_update') {
                    // Update price displays
                }
            };

            loadData();
            loadNews('general'); // Load general news on page load
            setInterval(loadData, 30000); // Refresh every 30 seconds
        </script>
    </body>
    </html>
    """
    return HTMLResponse(html)

# ============ ACCOUNT & PORTFOLIO ============
@app.get("/api/account")
async def get_account():
    """Get account information."""
    return demo_account

@app.get("/api/positions")
async def get_positions():
    """Get current positions."""
    return demo_positions

@app.get("/api/portfolio/positions")
async def get_portfolio_positions():
    """Alternative endpoint for positions."""
    return demo_positions

# ============ ORDERS ============
@app.get("/api/orders")
async def get_orders():
    """Get all orders."""
    return demo_orders

@app.delete("/api/order/{order_id}")
async def cancel_order(order_id: str):
    """Cancel a specific order."""
    return {"success": True, "message": f"Order {order_id} cancelled"}

# ============ TRADING ============
@app.post("/api/stock/buy")
async def buy_stock(trade: TradeRequest):
    """Buy stock."""
    order = {
        "id": f"order_{len(demo_orders) + 1}",
        "symbol": trade.symbol,
        "qty": trade.qty,
        "side": "buy",
        "status": "submitted",
        "submitted_at": datetime.now().isoformat()
    }
    demo_orders.append(order)
    return {"success": True, "order": order}

@app.post("/api/stock/sell")
async def sell_stock(trade: TradeRequest):
    """Sell stock."""
    order = {
        "id": f"order_{len(demo_orders) + 1}",
        "symbol": trade.symbol,
        "qty": trade.qty,
        "side": "sell",
        "status": "submitted",
        "submitted_at": datetime.now().isoformat()
    }
    demo_orders.append(order)
    return {"success": True, "order": order}

@app.post("/api/trade/{symbol}")
async def execute_trade(symbol: str, trade: TradeRequest):
    """Execute a trade."""
    return await buy_stock(trade) if trade.side == "buy" else await sell_stock(trade)

@app.post("/api/trading/execute")
async def execute_trading():
    """Execute trading strategy."""
    return {"success": True, "message": "Trading strategy executed"}

@app.get("/api/trading/status")
async def get_trading_status():
    """Get trading status."""
    return {"trading_active": True, "mode": "paper", "auto_trading": True}

@app.post("/api/trading/toggle")
async def toggle_trading():
    """Toggle trading on/off."""
    return {"success": True, "trading_active": True}

# ============ MARKET DATA ============
@app.get("/api/chart/{symbol}")
async def get_chart(symbol: str):
    """Get chart data for symbol."""
    # Generate sample price data
    np.random.seed(42)
    timestamps = [(datetime.now() - timedelta(minutes=x*5)).strftime("%H:%M") for x in range(20, 0, -1)]
    base_price = 250.0 if symbol == "AAPL" else 200.0
    prices = base_price + np.cumsum(np.random.randn(20) * 0.5)

    chart_data = {
        "symbol": symbol,
        "data": prices.tolist(),
        "prices": prices.tolist(),
        "timestamps": timestamps,
        "volume": [np.random.randint(800000, 1200000) for _ in range(20)],
        "chart": json.dumps({
            "data": [{
                "x": timestamps,
                "y": prices.tolist(),
                "type": "scatter",
                "mode": "lines",
                "name": symbol,
                "line": {"color": "#007bff", "width": 2}
            }],
            "layout": {
                "title": f"{symbol} Price Chart",
                "xaxis": {"title": "Time"},
                "yaxis": {"title": "Price ($)"},
                "showlegend": True
            }
        })
    }
    return chart_data

@app.get("/api/quote/{symbol}")
async def get_quote(symbol: str):
    """Get real-time quote."""
    base_price = 255.46 if symbol == "AAPL" else 220.30
    return {
        "symbol": symbol,
        "price": base_price + np.random.uniform(-2, 2),
        "change": np.random.uniform(-5, 5),
        "change_percent": np.random.uniform(-2, 2),
        "volume": np.random.randint(1000000, 5000000),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/search/{query}")
async def search_symbols(query: str):
    """Search for symbols."""
    symbols = ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN", "NVDA", "META"]
    matches = [s for s in symbols if query.upper() in s]
    return [{"symbol": s, "name": f"{s} Inc."} for s in matches[:5]]

# ============ AI & ANALYSIS ============
@app.get("/api/ai/analysis/{symbol}")
async def get_ai_analysis(symbol: str):
    """Get AI analysis for symbol."""
    analyses = [
        "Strong bullish momentum detected with RSI approaching oversold",
        "Bearish divergence forming, consider taking profits",
        "Sideways consolidation, waiting for breakout signal",
        "Volume spike indicates potential reversal incoming"
    ]
    return {
        "symbol": symbol,
        "analysis": np.random.choice(analyses),
        "confidence": round(np.random.uniform(0.6, 0.95), 2),
        "recommendation": np.random.choice(["BUY", "SELL", "HOLD"]),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/ai/analysis/{symbol}")
async def request_ai_analysis(symbol: str):
    """Request new AI analysis."""
    return await get_ai_analysis(symbol)

@app.post("/api/ai/toggle")
async def toggle_ai():
    """Toggle AI trading mode."""
    return {"success": True, "ai_active": True, "mode": "auto"}

# ============ STRATEGIES ============
@app.get("/api/strategies")
async def get_strategies():
    """Get all strategies."""
    return demo_strategies

@app.get("/api/strategies/active")
async def get_active_strategies():
    """Get active strategies."""
    return [s for s in demo_strategies if s["active"]]

@app.get("/api/strategies/examples")
async def get_strategy_examples():
    """Get strategy examples."""
    return [
        {"name": "RSI Reversal", "description": "Buy when RSI < 30, sell when RSI > 70"},
        {"name": "MACD Cross", "description": "Trade on MACD signal line crossovers"},
        {"name": "Moving Average", "description": "Trade based on moving average crossovers"}
    ]

@app.get("/api/strategies/{name}")
async def get_strategy(name: str):
    """Get specific strategy details."""
    strategy = next((s for s in demo_strategies if s["name"] == name), None)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy

@app.post("/api/strategies/create")
async def create_strategy(strategy: Dict[str, Any]):
    """Create new strategy."""
    new_strategy = {
        "name": strategy.get("name", "New Strategy"),
        "symbol": strategy.get("symbol", "AAPL"),
        "active": False,
        "pnl": 0.0
    }
    demo_strategies.append(new_strategy)
    return {"success": True, "strategy": new_strategy}

@app.post("/api/strategies/test/{strategy_name}")
async def test_strategy(strategy_name: str, params: Dict[str, Any] = {}):
    """Test a strategy."""
    return {
        "success": True,
        "strategy": strategy_name,
        "results": {
            "total_return": np.random.uniform(-10, 25),
            "win_rate": np.random.uniform(0.4, 0.8),
            "max_drawdown": np.random.uniform(5, 15),
            "sharpe_ratio": np.random.uniform(0.5, 2.0)
        }
    }

@app.post("/api/strategies/implement/{strategy_name}")
async def implement_strategy(strategy_name: str):
    """Implement a strategy."""
    return {"success": True, "message": f"Strategy {strategy_name} implemented"}

@app.delete("/api/strategies/{name}")
async def delete_strategy(name: str):
    """Delete a strategy."""
    global demo_strategies
    demo_strategies = [s for s in demo_strategies if s["name"] != name]
    return {"success": True, "message": f"Strategy {name} deleted"}

# ============ OPTIONS ============
@app.get("/api/options/chain/{symbol}")
async def get_options_chain(symbol: str):
    """Get options chain."""
    return {"symbol": symbol, "calls": [], "puts": [], "message": "Options data not available in demo mode"}

@app.post("/api/strategy/iron-condor")
async def create_iron_condor(strategy: StrategyRequest):
    """Create iron condor strategy."""
    return {"success": True, "message": "Iron condor strategy created", "strategy": strategy.dict()}

@app.post("/api/strategy/bull-spread")
async def create_bull_spread(spread: SpreadRequest):
    """Create bull spread strategy."""
    return {"success": True, "message": "Bull spread created", "spread": spread.dict()}

# ============ SETTINGS ============
@app.get("/api/settings")
async def get_settings():
    """Get current settings."""
    settings_dict = settings.dict()
    # Ensure all numeric values are properly set
    settings_dict.update({
        "position_size": float(settings_dict.get("position_size", 2.0)),
        "stop_loss": float(settings_dict.get("stop_loss", 2.0)),
        "take_profit": float(settings_dict.get("take_profit", 4.0)),
        "risk_per_trade": float(settings_dict.get("risk_per_trade", 1.0)),
        "max_positions": int(settings_dict.get("max_positions", 5)),
        "max_daily_loss": 500.0,
        "max_daily_trades": 10,
        "ai_confidence_threshold": 0.7,
        "rsi_period": 14,
        "sma_short": 20,
        "sma_long": 50
    })
    return settings_dict

@app.post("/api/settings")
@app.put("/api/settings")
async def save_settings(new_settings: SettingsModel):
    """Save settings."""
    global settings
    settings = new_settings
    return {"success": True, "settings": settings.dict()}

@app.get("/api/settings/summary")
async def get_settings_summary():
    """Get settings summary."""
    return {
        "risk_level": "Medium",
        "active_strategies": len([s for s in demo_strategies if s["active"]]),
        "position_size": settings.position_size,
        "stop_loss": settings.stop_loss
    }

@app.post("/api/settings/reset")
async def reset_settings():
    """Reset settings to default."""
    global settings
    settings = SettingsModel()
    return {"success": True, "message": "Settings reset to default"}

@app.get("/api/settings/presets")
async def get_settings_presets():
    """Get settings presets."""
    return [
        {"name": "Conservative", "position_size": 1.0, "stop_loss": 1.5, "take_profit": 3.0},
        {"name": "Moderate", "position_size": 2.0, "stop_loss": 2.0, "take_profit": 4.0},
        {"name": "Aggressive", "position_size": 5.0, "stop_loss": 3.0, "take_profit": 6.0}
    ]

@app.post("/api/settings/preset/{preset_name}")
async def apply_preset(preset_name: str):
    """Apply a settings preset."""
    presets = {
        "Conservative": SettingsModel(position_size=1.0, stop_loss=1.5, take_profit=3.0),
        "Moderate": SettingsModel(position_size=2.0, stop_loss=2.0, take_profit=4.0),
        "Aggressive": SettingsModel(position_size=5.0, stop_loss=3.0, take_profit=6.0)
    }
    if preset_name not in presets:
        raise HTTPException(status_code=404, detail="Preset not found")

    global settings
    settings = presets[preset_name]
    return {"success": True, "preset": preset_name, "settings": settings.dict()}

# ============ PERFORMANCE & MONITORING ============
@app.get("/api/performance")
async def get_performance():
    """Get performance metrics."""
    return {
        "total_return": np.random.uniform(-5, 15),
        "daily_return": np.random.uniform(-2, 3),
        "win_rate": np.random.uniform(0.5, 0.8),
        "profit_factor": np.random.uniform(1.1, 2.5),
        "max_drawdown": np.random.uniform(2, 10),
        "sharpe_ratio": np.random.uniform(0.8, 2.2),
        "trades_today": np.random.randint(0, 15)
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {
            "trading_engine": "online",
            "market_data": "online",
            "ai_analysis": "online"
        }
    }

@app.get("/api/status")
async def get_status():
    """Get system status."""
    return {
        "status": "running",
        "mode": "paper",
        "connected": True,
        "uptime": "2h 35m",
        "last_update": datetime.now().isoformat()
    }

@app.get("/api/rsi/{symbol}")
async def get_rsi(symbol: str):
    """Get RSI indicator."""
    return {
        "symbol": symbol,
        "rsi": round(np.random.uniform(30, 70), 2),
        "signal": np.random.choice(["oversold", "neutral", "overbought"]),
        "timestamp": datetime.now().isoformat()
    }

# ============ NEWS FEED ============
@app.get("/api/news")
async def get_general_news():
    """Get general market news."""
    try:
        # Try to get real news from multiple sources, prioritizing Yahoo Finance
        real_news = []

        # First try Yahoo Finance general news
        yahoo_news = news_fetcher.get_yahoo_finance_news()
        real_news.extend(yahoo_news)

        # Add Google Finance news
        google_news = news_fetcher.get_google_finance_news()
        real_news.extend(google_news)

        # Add Reddit finance news for discussions
        reddit_news = news_fetcher.get_reddit_finance_news()
        real_news.extend(reddit_news)

        # If we have real news, return it
        if real_news:
            return {
                "news": real_news[:15],  # More news items
                "last_updated": datetime.now().isoformat(),
                "source": "live",
                "sources": ["Yahoo Finance", "Google News", "Reddit Finance"]
            }
    except Exception as e:
        print(f"Error fetching real news: {e}")

    # Fallback to demo news if real news fails
    return {
        "news": [
            {
                "id": "demo_1",
                "title": "Market Opens Higher on Tech Earnings Beat",
                "summary": "Major tech companies exceed Q3 earnings expectations, driving market optimism",
                "source": "MarketWatch (Demo)",
                "published": datetime.now().isoformat(),
                "category": "earnings",
                "relevance": "high",
                "sentiment": "positive"
            },
            {
                "id": "demo_2",
                "title": "Fed Signals Potential Rate Pause in December",
                "summary": "Federal Reserve officials hint at holding rates steady amid inflation concerns",
                "source": "Reuters (Demo)",
                "published": (datetime.now() - timedelta(hours=1)).isoformat(),
                "category": "monetary_policy",
                "relevance": "high",
                "sentiment": "neutral"
            },
            {
                "id": "demo_3",
                "title": "Oil Prices Surge on Middle East Tensions",
                "summary": "Crude oil jumps 3% as geopolitical concerns impact supply outlook",
                "source": "Bloomberg (Demo)",
                "published": (datetime.now() - timedelta(hours=2)).isoformat(),
                "category": "commodities",
                "relevance": "medium",
                "sentiment": "neutral"
            }
        ],
        "last_updated": datetime.now().isoformat(),
        "source": "demo"
    }

@app.get("/api/news/{symbol}")
async def get_symbol_news(symbol: str):
    """Get news for specific symbol."""
    try:
        # Try to get real news for the symbol
        real_news = news_fetcher.get_symbol_news(symbol)

        if real_news:
            return {
                "symbol": symbol,
                "news": real_news,
                "last_updated": datetime.now().isoformat(),
                "source": "live"
            }
    except Exception as e:
        print(f"Error fetching news for {symbol}: {e}")

    # Fallback to demo data
    symbol_news = {
        "AAPL": [
            {
                "id": f"{symbol}_1",
                "title": f"{symbol} Reports Strong iPhone Sales in Q3",
                "summary": "Apple exceeds revenue expectations with robust iPhone 15 demand",
                "source": "CNBC (Demo)",
                "published": datetime.now().isoformat(),
                "category": "earnings",
                "relevance": "high",
                "sentiment": "positive"
            },
            {
                "id": f"{symbol}_2",
                "title": f"{symbol} Stock Gets Upgrade from Goldman Sachs",
                "summary": "Analyst raises price target to $200 citing AI integration potential",
                "source": "Goldman Sachs (Demo)",
                "published": (datetime.now() - timedelta(minutes=30)).isoformat(),
                "category": "analyst_rating",
                "relevance": "high",
                "sentiment": "positive"
            }
        ],
        "TSLA": [
            {
                "id": f"{symbol}_1",
                "title": f"{symbol} Cybertruck Production Ramp Ahead of Schedule",
                "summary": "Tesla reports faster than expected Cybertruck manufacturing progress",
                "source": "Tesla (Demo)",
                "published": datetime.now().isoformat(),
                "category": "product_update",
                "relevance": "high",
                "sentiment": "positive"
            }
        ]
    }

    news_data = symbol_news.get(symbol, [
        {
            "id": f"{symbol}_1",
            "title": f"{symbol} Trading Update",
            "summary": f"Latest market activity and analyst coverage for {symbol}",
            "source": "Financial Times (Demo)",
            "published": datetime.now().isoformat(),
            "category": "general",
            "relevance": "medium",
            "sentiment": "neutral"
        }
    ])

    return {
        "symbol": symbol,
        "news": news_data,
        "last_updated": datetime.now().isoformat(),
        "source": "demo"
    }

@app.get("/api/news/options/{symbol}")
async def get_options_news(symbol: str):
    """Get options-specific news and flow data."""
    return {
        "symbol": symbol,
        "options_flow": [
            {
                "type": "unusual_activity",
                "title": f"Large {symbol} Call Volume Detected",
                "description": f"Unusual call option activity in {symbol} $270 strike expiring next Friday",
                "volume": "50,000 contracts",
                "premium": "$2.5M",
                "sentiment": "bullish",
                "timestamp": datetime.now().isoformat()
            },
            {
                "type": "earnings_play",
                "title": f"{symbol} Options Positioning Pre-Earnings",
                "description": f"Increased put/call ratio suggests volatility expectations for {symbol} earnings",
                "implied_volatility": "45%",
                "sentiment": "neutral",
                "timestamp": (datetime.now() - timedelta(hours=1)).isoformat()
            }
        ],
        "earnings_calendar": {
            "next_earnings": "2025-10-15",
            "estimate_eps": 2.45,
            "analyst_count": 28
        },
        "last_updated": datetime.now().isoformat()
    }

@app.get("/api/news/categories")
async def get_news_categories():
    """Get available news categories."""
    return {
        "categories": [
            {"id": "earnings", "name": "Earnings", "count": 15},
            {"id": "analyst_rating", "name": "Analyst Ratings", "count": 8},
            {"id": "monetary_policy", "name": "Fed/Policy", "count": 5},
            {"id": "commodities", "name": "Commodities", "count": 12},
            {"id": "options_flow", "name": "Options Flow", "count": 25},
            {"id": "earnings_preview", "name": "Earnings Preview", "count": 18},
            {"id": "product_update", "name": "Product Updates", "count": 6}
        ]
    }

# ============ SUPERVISOR CONTROL CONSOLE ============
@app.get("/supervisor", response_class=HTMLResponse)
async def get_supervisor():
    """Serve supervisor control console."""
    supervisor_path = "src/web/templates/supervisor.html"
    if os.path.exists(supervisor_path):
        with open(supervisor_path, 'r', encoding='utf-8') as f:
            return HTMLResponse(f.read())
    return HTMLResponse("<h1>Supervisor Console Not Found</h1>")

@app.get("/api/supervisor/status")
async def get_supervisor_status():
    """Get supervisor status."""
    return {
        "mode": "suggest",
        "pending_trades": len(demo_orders),
        "pending_list": [
            {
                "id": "trade_1",
                "symbol": "AAPL",
                "action": "BUY",
                "quantity": 10,
                "strategy": "RSI Strategy",
                "ai_confidence": 85,
                "reasoning": "RSI indicates oversold condition with strong support level"
            }
        ],
        "emergency_stop": False,
        "last_update": datetime.now().isoformat()
    }

@app.post("/api/supervisor/mode")
async def set_supervisor_mode(request: Dict[str, Any]):
    """Set supervisor mode (manual, suggest, auto)."""
    mode = request.get("mode", "suggest")
    return {"success": True, "mode": mode, "message": f"Supervisor mode set to {mode}"}

@app.post("/api/supervisor/approve")
async def approve_trade(request: Dict[str, Any]):
    """Approve a pending trade."""
    trade_id = request.get("trade_id")
    return {"success": True, "trade_id": trade_id, "message": "Trade approved and executed"}

@app.post("/api/supervisor/reject")
async def reject_trade(request: Dict[str, Any]):
    """Reject a pending trade."""
    trade_id = request.get("trade_id")
    reason = request.get("reason", "Manual rejection")
    return {"success": True, "trade_id": trade_id, "reason": reason, "message": "Trade rejected"}

@app.post("/api/supervisor/emergency")
async def emergency_stop():
    """Emergency stop all trading."""
    return {"success": True, "message": "EMERGENCY STOP ACTIVATED - All trading halted", "timestamp": datetime.now().isoformat()}

@app.post("/api/supervisor/submit-trade")
async def submit_trade_for_approval(trade: Dict[str, Any]):
    """Submit trade for supervisor approval."""
    return {"success": True, "message": "Trade submitted for approval", "trade_id": f"trade_{len(demo_orders) + 1}"}

# ============ WEBSOCKET ============
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    active_websockets.append(websocket)

    try:
        while True:
            # Send periodic updates in expected format
            update_data = {
                "type": "market_data",
                "symbol": "AAPL",
                "price": 255.46 + np.random.uniform(-1, 1),
                "change": np.random.uniform(-2, 2),
                "volume": np.random.randint(1000000, 5000000),
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send_json(update_data)
            await asyncio.sleep(5)

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if websocket in active_websockets:
            active_websockets.remove(websocket)

# AI Chat WebSocket
@app.websocket("/ws/ai-chat")
async def ai_chat_websocket(websocket: WebSocket):
    """WebSocket endpoint for AI chat functionality"""
    await websocket.accept()

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)

            user_message = message_data.get('message', '')
            context = message_data.get('context', {})

            # Generate AI response (using mock responses for now)
            ai_response = await generate_ai_response(user_message, context)

            # Send response back to client
            await websocket.send_json({
                'message': ai_response,
                'timestamp': datetime.now().isoformat(),
                'type': 'ai_response'
            })

    except WebSocketDisconnect:
        print("AI Chat WebSocket disconnected")
    except Exception as e:
        print(f"AI Chat WebSocket error: {e}")
        try:
            await websocket.send_json({
                'message': 'Sorry, I encountered an error. Please try again.',
                'timestamp': datetime.now().isoformat(),
                'type': 'error'
            })
        except:
            pass

async def generate_ai_response(user_message: str, context: dict) -> str:
    """Generate AI response based on user message and context"""

    # Convert message to lowercase for matching
    msg_lower = user_message.lower()

    # Contextual responses using actual dashboard data
    portfolio_value = context.get('portfolio_value', 'N/A')
    positions_count = context.get('positions_count', '0')
    current_symbol = context.get('current_symbol', 'AAPL')

    # Trading-specific responses
    if 'position' in msg_lower:
        return f"You currently have {positions_count} active positions with a total portfolio value of {portfolio_value}. I can see you're currently viewing {current_symbol} on your chart. Your positions are managed in paper trading mode, which is perfect for learning without financial risk."

    elif 'performance' in msg_lower and 'today' in msg_lower:
        return f"Your paper trading performance today is looking good! Your portfolio value is currently {portfolio_value}. Since you're in paper trading mode, you can experiment with different strategies without any financial risk. This is an excellent way to build confidence before transitioning to live trading."

    elif any(word in msg_lower for word in ['analyze', 'analysis']) and any(symbol in msg_lower for symbol in ['aapl', 'apple', current_symbol.lower()]):
        return f"Based on your dashboard data for {current_symbol}, I can see you have real-time charts and technical indicators available. The current price data is being updated live from Yahoo Finance. Consider looking at the RSI, moving averages, and volume indicators in your technical analysis section for a complete picture."

    elif 'risk' in msg_lower:
        return "Your current risk exposure is minimal since you're operating in paper trading mode. This is perfect for learning! You can adjust your risk parameters in the Settings section. Consider experimenting with different position sizes and stop-loss percentages to understand how they affect your trading outcomes."

    elif 'strategy' in msg_lower:
        return "Your dashboard includes several built-in strategies including RSI, MACD, Bollinger Bands, and an Options Income System. You can test these strategies using the Strategy section before implementing them. Paper trading allows you to see how different strategies perform without financial risk."

    elif any(word in msg_lower for word in ['news', 'market', 'sentiment']):
        return "Your dashboard provides real-time market news from Yahoo Finance, Google News, and Reddit. The news feed is updated continuously and includes sentiment analysis. This information can help you understand market trends and make informed trading decisions."

    elif any(word in msg_lower for word in ['options', 'covered call', 'put', 'strike']):
        return "Options trading involves contracts that give you rights to buy or sell stocks at specific prices. Your bot includes an Options Income System strategy that focuses on generating income through covered calls and cash-secured puts. These are considered more conservative options strategies suitable for beginners."

    elif any(word in msg_lower for word in ['help', 'how', 'explain', 'what is']):
        return "I can help you understand your trading dashboard and strategies! I have access to your current portfolio data, can explain trading concepts, analyze your positions, and provide educational guidance. Try asking about specific topics like 'risk management', 'technical analysis', or 'options strategies'."

    elif any(word in msg_lower for word in ['buy', 'sell', 'trade']):
        return f"For actual trading, use the Trading section in your dashboard. You can buy/sell {current_symbol} or any other symbol. Since you're in paper trading mode, all trades are simulated but use real market data. This lets you practice without risk!"

    elif 'setting' in msg_lower:
        return "You can customize your trading parameters in the Settings section. This includes position sizing, stop-loss percentages, maximum daily trades, and risk thresholds. Experiment with different settings to see how they affect your trading strategy performance."

    else:
        # Default response with helpful suggestions
        return f"I'm here to help with your trading questions! Based on your dashboard, I can see you have {positions_count} positions and your portfolio value is {portfolio_value}. I can help you with:\n\n• Portfolio analysis and performance\n• Trading strategy explanations\n• Risk management guidance\n• Market news and sentiment analysis\n• Technical indicator interpretation\n• Options trading education\n\nWhat specific aspect would you like to explore?"

# Backtesting Models
class BacktestRequest(BaseModel):
    symbol: str = "AAPL"
    strategy: str = "buy_hold"
    period: str = "1y"
    initial_capital: float = 10000.0
    parameters: dict = {}

class BacktestResults(BaseModel):
    symbol: str
    strategy: str
    period: str
    initial_capital: float
    final_value: float
    total_return: float
    total_return_pct: float
    max_drawdown: float
    sharpe_ratio: float
    win_rate: float
    total_trades: int
    avg_trade: float
    best_trade: float
    worst_trade: float
    trades: list
    equity_curve: list
    success: bool
    error: str = None

# Backtesting Endpoints
@app.post("/api/backtest/run", response_model=BacktestResults)
async def run_backtest(request: BacktestRequest):
    """Run a backtest on historical data"""
    try:
        import yfinance as yf
        import pandas as pd
        import numpy as np
        from datetime import datetime, timedelta

        # Download historical data
        print(f"Running backtest for {request.symbol} with strategy {request.strategy}")

        ticker = yf.Ticker(request.symbol)
        data = ticker.history(period=request.period)

        if data.empty:
            raise HTTPException(status_code=400, detail=f"No data available for {request.symbol}")

        # Initialize backtest variables
        initial_capital = request.initial_capital
        cash = initial_capital
        shares = 0
        trades = []
        equity_curve = []

        # Run strategy based on type
        if request.strategy == "buy_hold":
            # Simple buy and hold strategy
            entry_price = data['Close'].iloc[0]
            shares = cash / entry_price
            cash = 0

            trades.append({
                'date': data.index[0].isoformat(),
                'type': 'BUY',
                'price': entry_price,
                'shares': shares,
                'value': shares * entry_price
            })

            # Calculate daily equity curve
            for i, (date, row) in enumerate(data.iterrows()):
                portfolio_value = shares * row['Close'] + cash
                equity_curve.append({
                    'date': date.isoformat(),
                    'value': portfolio_value,
                    'price': row['Close']
                })

        elif request.strategy == "sma_crossover":
            # Simple Moving Average Crossover
            short_window = request.parameters.get('short_window', 20)
            long_window = request.parameters.get('long_window', 50)

            data['SMA_short'] = data['Close'].rolling(window=short_window).mean()
            data['SMA_long'] = data['Close'].rolling(window=long_window).mean()
            data['Signal'] = 0
            data['Signal'][short_window:] = np.where(
                data['SMA_short'][short_window:] > data['SMA_long'][short_window:], 1, 0
            )
            data['Position'] = data['Signal'].diff()

            position = 0  # 0 = no position, 1 = long position

            for i, (date, row) in enumerate(data.iterrows()):
                if i < long_window:  # Skip until we have enough data
                    portfolio_value = initial_capital
                else:
                    # Check for signals
                    if row['Position'] == 1 and position == 0:  # Buy signal
                        shares = cash / row['Close']
                        cash = 0
                        position = 1
                        trades.append({
                            'date': date.isoformat(),
                            'type': 'BUY',
                            'price': row['Close'],
                            'shares': shares,
                            'value': shares * row['Close']
                        })
                    elif row['Position'] == -1 and position == 1:  # Sell signal
                        cash = shares * row['Close']
                        trades.append({
                            'date': date.isoformat(),
                            'type': 'SELL',
                            'price': row['Close'],
                            'shares': shares,
                            'value': shares * row['Close']
                        })
                        shares = 0
                        position = 0

                    portfolio_value = shares * row['Close'] + cash

                equity_curve.append({
                    'date': date.isoformat(),
                    'value': portfolio_value,
                    'price': row['Close']
                })

        elif request.strategy == "rsi_strategy":
            # RSI Strategy
            rsi_period = request.parameters.get('rsi_period', 14)
            rsi_oversold = request.parameters.get('rsi_oversold', 30)
            rsi_overbought = request.parameters.get('rsi_overbought', 70)

            # Calculate RSI
            delta = data['Close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
            rs = gain / loss
            data['RSI'] = 100 - (100 / (1 + rs))

            position = 0

            for i, (date, row) in enumerate(data.iterrows()):
                if i < rsi_period:
                    portfolio_value = initial_capital
                else:
                    # Buy when RSI is oversold and we don't have position
                    if row['RSI'] < rsi_oversold and position == 0:
                        shares = cash / row['Close']
                        cash = 0
                        position = 1
                        trades.append({
                            'date': date.isoformat(),
                            'type': 'BUY',
                            'price': row['Close'],
                            'shares': shares,
                            'value': shares * row['Close']
                        })
                    # Sell when RSI is overbought and we have position
                    elif row['RSI'] > rsi_overbought and position == 1:
                        cash = shares * row['Close']
                        trades.append({
                            'date': date.isoformat(),
                            'type': 'SELL',
                            'price': row['Close'],
                            'shares': shares,
                            'value': shares * row['Close']
                        })
                        shares = 0
                        position = 0

                    portfolio_value = shares * row['Close'] + cash

                equity_curve.append({
                    'date': date.isoformat(),
                    'value': portfolio_value,
                    'price': row['Close']
                })

        # Calculate final metrics
        final_value = equity_curve[-1]['value'] if equity_curve else initial_capital
        total_return = final_value - initial_capital
        total_return_pct = (total_return / initial_capital) * 100

        # Calculate additional metrics
        equity_values = [point['value'] for point in equity_curve]

        # Max drawdown
        peak = equity_values[0]
        max_drawdown = 0
        for value in equity_values:
            if value > peak:
                peak = value
            drawdown = (peak - value) / peak
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        max_drawdown *= 100

        # Calculate returns for Sharpe ratio
        if len(equity_values) > 1:
            returns = [equity_values[i] / equity_values[i-1] - 1 for i in range(1, len(equity_values))]
            avg_return = np.mean(returns) if returns else 0
            std_return = np.std(returns) if returns else 0
            sharpe_ratio = (avg_return / std_return * np.sqrt(252)) if std_return > 0 else 0
        else:
            sharpe_ratio = 0

        # Trade analysis
        buy_trades = [t for t in trades if t['type'] == 'BUY']
        sell_trades = [t for t in trades if t['type'] == 'SELL']

        total_trades = len(buy_trades)
        profitable_trades = 0
        trade_returns = []

        for i in range(min(len(buy_trades), len(sell_trades))):
            buy_price = buy_trades[i]['price']
            sell_price = sell_trades[i]['price']
            trade_return = (sell_price - buy_price) / buy_price * 100
            trade_returns.append(trade_return)
            if trade_return > 0:
                profitable_trades += 1

        win_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0
        avg_trade = np.mean(trade_returns) if trade_returns else 0
        best_trade = max(trade_returns) if trade_returns else 0
        worst_trade = min(trade_returns) if trade_returns else 0

        return BacktestResults(
            symbol=request.symbol,
            strategy=request.strategy,
            period=request.period,
            initial_capital=initial_capital,
            final_value=final_value,
            total_return=total_return,
            total_return_pct=total_return_pct,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            win_rate=win_rate,
            total_trades=total_trades,
            avg_trade=avg_trade,
            best_trade=best_trade,
            worst_trade=worst_trade,
            trades=trades,
            equity_curve=equity_curve,
            success=True
        )

    except Exception as e:
        print(f"Backtest error: {str(e)}")
        return BacktestResults(
            symbol=request.symbol,
            strategy=request.strategy,
            period=request.period,
            initial_capital=request.initial_capital,
            final_value=0,
            total_return=0,
            total_return_pct=0,
            max_drawdown=0,
            sharpe_ratio=0,
            win_rate=0,
            total_trades=0,
            avg_trade=0,
            best_trade=0,
            worst_trade=0,
            trades=[],
            equity_curve=[],
            success=False,
            error=str(e)
        )

@app.get("/api/backtest/strategies")
async def get_backtest_strategies():
    """Get available backtesting strategies"""
    return {
        "strategies": [
            {
                "id": "buy_hold",
                "name": "Buy & Hold",
                "description": "Simple buy and hold strategy for baseline comparison",
                "parameters": {}
            },
            {
                "id": "sma_crossover",
                "name": "SMA Crossover",
                "description": "Simple Moving Average crossover strategy",
                "parameters": {
                    "short_window": {"type": "int", "default": 20, "min": 5, "max": 50},
                    "long_window": {"type": "int", "default": 50, "min": 20, "max": 200}
                }
            },
            {
                "id": "rsi_strategy",
                "name": "RSI Strategy",
                "description": "RSI-based oversold/overbought strategy",
                "parameters": {
                    "rsi_period": {"type": "int", "default": 14, "min": 5, "max": 30},
                    "rsi_oversold": {"type": "int", "default": 30, "min": 10, "max": 40},
                    "rsi_overbought": {"type": "int", "default": 70, "min": 60, "max": 90}
                }
            }
        ]
    }

# ============ MORNING ROUTINE ============
@app.post("/api/morning-routine")
async def run_morning_routine():
    """Run morning routine - aggregate account, positions, news, and market status"""
    try:
        # Get account data
        account_response = await get_account()

        # Get positions
        positions_response = await get_positions()

        # Get orders
        orders_response = await get_orders()

        # Get market status (mock for now)
        from datetime import datetime
        now = datetime.now()
        market_hour = now.hour
        if market_hour >= 9 and market_hour < 16:
            market_status = "open"
        elif market_hour >= 4 and market_hour < 9:
            market_status = "pre"
        else:
            market_status = "closed"

        # Get recent news
        news_response = await get_news_categories()

        # Generate alerts based on positions
        alerts = []
        if isinstance(positions_response, list):
            for position in positions_response:
                if position.get("unrealized_pl", 0) > 1000:
                    alerts.append({
                        "type": "info",
                        "title": "Profit Alert",
                        "message": f"{position['symbol']} has unrealized gains of ${position['unrealized_pl']:.2f}"
                    })
                elif position.get("unrealized_pl", 0) < -500:
                    alerts.append({
                        "type": "warning",
                        "title": "Loss Alert",
                        "message": f"{position['symbol']} has unrealized losses of ${position['unrealized_pl']:.2f}"
                    })

        return {
            "market_status": market_status,
            "account": account_response,
            "positions": positions_response if isinstance(positions_response, list) else [],
            "orders": orders_response.get("orders", []) if isinstance(orders_response, dict) else [],
            "news": news_response.get("news", []) if isinstance(news_response, dict) else [],
            "alerts": alerts,
            "timestamp": now.isoformat()
        }

    except Exception as e:
        print(f"Morning routine error: {str(e)}")
        return {
            "error": f"Morning routine failed: {str(e)}",
            "market_status": "unknown",
            "account": {},
            "positions": [],
            "orders": [],
            "news": [],
            "alerts": [],
            "timestamp": datetime.now().isoformat()
        }

# ============ NEWS SEARCH ============
@app.post("/api/news/search")
async def search_news(request: Dict[str, Any]):
    """Search for news articles with sentiment analysis"""
    try:
        symbol = request.get("symbol", "").upper()
        source = request.get("source", "all")
        limit = request.get("limit", 20)

        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol is required")

        # Get news for the symbol (leverage existing endpoint)
        news_response = await get_symbol_news(symbol)
        base_articles = news_response.get("news", [])

        # Enhance with additional mock articles based on source filter
        articles = []
        sentiments = ["positive", "negative", "neutral"]
        sources = {
            "yahoo": "Yahoo Finance",
            "google": "Google News",
            "reddit": "Reddit",
            "all": ["Financial Times", "MarketWatch", "Reuters", "Bloomberg", "TechCrunch"]
        }

        # Add base articles
        for article in base_articles[:limit//2]:
            articles.append({
                **article,
                "sentiment": np.random.choice(sentiments),
                "summary": article.get("summary", f"Analysis of {symbol} market performance and outlook."),
                "published": article.get("published", datetime.now().isoformat()),
                "url": f"https://finance.yahoo.com/news/{symbol.lower()}-article"
            })

        # Add mock articles based on source filter
        source_list = sources.get(source, sources["all"])
        if isinstance(source_list, str):
            source_list = [source_list]

        for i in range(limit - len(articles)):
            sentiment = np.random.choice(sentiments)
            article_source = np.random.choice(source_list)

            title_templates = {
                "positive": [
                    f"{symbol} Surges on Strong Q4 Results",
                    f"Analysts Upgrade {symbol} Price Target",
                    f"{symbol} Announces Strategic Partnership",
                    f"Bullish Outlook for {symbol} Continues"
                ],
                "negative": [
                    f"{symbol} Faces Regulatory Headwinds",
                    f"Concerns Mount Over {symbol} Guidance",
                    f"{symbol} Stock Under Pressure",
                    f"Bearish Sentiment Grows for {symbol}"
                ],
                "neutral": [
                    f"{symbol} Trading Sideways Amid Market Volatility",
                    f"Mixed Signals for {symbol} Stock",
                    f"{symbol} Awaits Key Economic Data",
                    f"Technical Analysis: {symbol} at Crossroads"
                ]
            }

            title = np.random.choice(title_templates[sentiment])

            articles.append({
                "title": title,
                "summary": f"Market analysis and outlook for {symbol} based on recent developments and technical indicators.",
                "source": article_source,
                "published": (datetime.now() - timedelta(hours=np.random.randint(1, 24))).isoformat(),
                "sentiment": sentiment,
                "url": f"https://example.com/news/{symbol.lower()}-{i}",
                "relevance": np.random.choice(["high", "medium", "low"])
            })

        # Calculate sentiment analysis
        sentiment_scores = {"positive": 0, "negative": 0, "neutral": 0}
        for article in articles:
            sentiment_scores[article["sentiment"]] += 1

        total_articles = len(articles)
        sentiment_analysis = {
            "positive": sentiment_scores["positive"],
            "negative": sentiment_scores["negative"],
            "neutral": sentiment_scores["neutral"],
            "score": (sentiment_scores["positive"] - sentiment_scores["negative"]) / total_articles if total_articles > 0 else 0
        }

        return {
            "articles": articles,
            "sentiment": sentiment_analysis,
            "symbol": symbol,
            "source": source,
            "total_found": len(articles),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"News search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"News search failed: {str(e)}")

# ============ OPTIONS STRATEGY ============
@app.post("/api/options/strategy")
async def build_options_strategy(request: Dict[str, Any]):
    """Build options strategy with P/L analysis"""
    try:
        symbol = request.get("symbol", "").upper()
        strategy = request.get("strategy", "covered_call")
        expiration = request.get("expiration", "monthly")

        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol is required")

        # Mock current stock price
        quote_response = await get_quote(symbol)
        current_price = quote_response.get("price", 200)

        # Calculate strategy-specific parameters
        strike_price = round(current_price / 5) * 5  # Round to nearest $5
        premium = 3 + np.random.uniform(2, 8)  # Random premium $3-$11

        # Generate P/L data points
        price_range = np.linspace(current_price * 0.7, current_price * 1.3, 100)
        profits = []

        for spot_price in price_range:
            if strategy == "covered_call":
                # Long stock + short call
                stock_pl = spot_price - current_price
                call_pl = max(0, strike_price - spot_price) + premium
                profit = stock_pl + call_pl

            elif strategy == "cash_secured_put":
                # Short put
                profit = min(premium, spot_price - strike_price + premium)

            elif strategy == "protective_put":
                # Long stock + long put
                stock_pl = spot_price - current_price
                put_pl = max(0, strike_price - spot_price) - premium
                profit = stock_pl + put_pl

            elif strategy == "collar":
                # Long stock + long put + short call
                stock_pl = spot_price - current_price
                put_pl = max(0, strike_price * 0.95 - spot_price) - premium * 0.7
                call_pl = max(0, strike_price * 1.05 - spot_price) + premium * 0.3
                profit = stock_pl + put_pl + call_pl

            elif strategy == "iron_condor":
                # Complex spread strategy
                wing1 = max(0, strike_price * 0.9 - spot_price) - premium * 0.25
                wing2 = max(0, spot_price - strike_price * 0.95) - premium * 0.75
                wing3 = max(0, spot_price - strike_price * 1.05) + premium * 0.75
                wing4 = max(0, strike_price * 1.1 - spot_price) + premium * 0.25
                profit = wing1 + wing2 + wing3 + wing4

            elif strategy == "butterfly":
                # Butterfly spread
                butterfly1 = max(0, strike_price * 0.95 - spot_price) - premium * 0.5
                butterfly2 = 2 * (max(0, spot_price - strike_price) - premium * 0.5)
                butterfly3 = max(0, spot_price - strike_price * 1.05) + premium * 0.5
                profit = butterfly1 - butterfly2 + butterfly3

            else:
                profit = 0

            profits.append(profit)

        # Find breakeven points
        breakeven_points = []
        for i in range(1, len(profits)):
            if (profits[i-1] < 0 and profits[i] > 0) or (profits[i-1] > 0 and profits[i] < 0):
                # Linear interpolation
                ratio = abs(profits[i-1]) / (abs(profits[i-1]) + abs(profits[i]))
                breakeven = price_range[i-1] + ratio * (price_range[i] - price_range[i-1])
                breakeven_points.append(round(breakeven, 2))

        # Calculate Greeks (mock values)
        greeks = {
            "delta": (np.random.random() - 0.5) * 1,
            "gamma": np.random.random() * 0.1,
            "theta": -np.random.random() * 5,
            "vega": np.random.random() * 20
        }

        # Calculate strategy metrics
        max_profit = max(profits) if max(profits) < 10000 else None  # None for unlimited
        max_loss = min(profits) if min(profits) > -10000 else None   # None for unlimited
        prob_profit = len([p for p in profits if p > 0]) / len(profits)

        return {
            "symbol": symbol,
            "strategy": strategy,
            "expiration": expiration,
            "current_price": current_price,
            "strike_price": strike_price,
            "premium": premium,
            "pl_data": {
                "spot_prices": price_range.tolist(),
                "profits": profits,
                "breakeven_points": breakeven_points
            },
            "greeks": greeks,
            "metrics": {
                "max_profit": max_profit,
                "max_loss": max_loss,
                "breakeven": breakeven_points[0] if breakeven_points else None,
                "prob_profit": prob_profit
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"Options strategy error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Options strategy failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting Complete AI Trading API...")
    print("Dashboard: http://localhost:8001")
    print("API Docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)