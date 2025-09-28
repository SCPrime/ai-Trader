from fastapi import FastAPI, WebSocket, HTTPException, Request
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

if __name__ == "__main__":
    import uvicorn
    print("Starting Complete AI Trading API...")
    print("Dashboard: http://localhost:8001")
    print("API Docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)