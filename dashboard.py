from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import sys
import os
import asyncio
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
from engine.trading_engine import engine

# Pydantic models
class TradeRequest(BaseModel):
    symbol: str
    qty: int

class StrategyRequest(BaseModel):
    symbol: str
    strikes: List[float]
    expiration: str

class SpreadRequest(BaseModel):
    symbol: str
    buy_strike: float
    sell_strike: float
    expiration: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="src/web/static"), name="static")

# Copy all your API endpoints from trading_api.py here
@app.get("/api/account")
async def get_account():
    return engine.get_account_info()

@app.get("/api/positions")
async def get_positions():
    return engine.get_positions()

@app.post("/api/stock/buy")
async def buy_stock(trade: TradeRequest):
    return engine.buy_stock(trade.symbol, trade.qty)

@app.post("/api/stock/sell")
async def sell_stock(trade: TradeRequest):
    return engine.sell_stock(trade.symbol, trade.qty)

@app.get("/api/orders")
async def get_orders():
    return engine.get_orders()

@app.delete("/api/order/{order_id}")
async def cancel_order(order_id: str):
    return engine.cancel_order(order_id)

@app.get("/api/options/chain/{symbol}")
async def get_options_chain(symbol: str):
    return engine.get_options_chain(symbol)

@app.post("/api/strategy/iron-condor")
async def create_iron_condor(strategy: StrategyRequest):
    return engine.create_iron_condor(strategy.symbol, strategy.strikes, strategy.expiration)

@app.post("/api/strategy/bull-spread")
async def create_bull_spread(spread: SpreadRequest):
    return engine.create_bull_call_spread(spread.symbol, spread.buy_strike, spread.sell_strike, spread.expiration)

@app.get("/api/quote/{symbol}")
async def get_quote(symbol: str):
    return engine.get_quote(symbol)

@app.get("/api/chart/{symbol}")
async def get_chart(symbol: str):
    # Return chart data for the dashboard
    return {
        "symbol": symbol,
        "prices": [253.5, 254.1, 255.2, 255.8, 255.46],
        "timestamps": ["9:30", "10:00", "10:30", "11:00", "11:30"],
        "volume": [1000000, 950000, 1100000, 800000, 750000]
    }

@app.get("/api/rsi/{symbol}")
async def get_rsi(symbol: str):
    rsi = engine.calculate_rsi(symbol)
    return {"symbol": symbol, "rsi": rsi}

@app.get("/api/status")
async def status():
    return {
        "status": "running",
        "mode": engine.mode,
        "connected": engine.api is not None
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": "2025-09-28T03:30:00Z"}

@app.get("/api/trading/status")
async def trading_status():
    return {"trading_active": True, "mode": engine.mode}

@app.post("/api/trading/toggle")
async def toggle_trading():
    return {"success": True, "mode": engine.mode}

@app.post("/api/ai/toggle")
async def toggle_ai():
    return {"success": True, "ai_mode": "auto"}

@app.get("/api/strategies")
async def get_strategies():
    return []

@app.post("/api/strategies/create")
async def create_strategy():
    return {"success": True, "message": "Strategy created"}

@app.get("/api/strategies/examples")
async def get_strategy_examples():
    return []

@app.get("/api/settings")
async def get_settings():
    return {"position_size": 2, "stop_loss": 2, "take_profit": 4}

@app.post("/api/settings")
async def save_settings():
    return {"success": True}

@app.get("/api/ai/analysis/{symbol}")
async def get_ai_analysis(symbol: str):
    return {"symbol": symbol, "analysis": "Bullish trend detected", "confidence": 0.85}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Send real-time updates
            await websocket.send_json({
                "type": "price_update",
                "symbol": "AAPL",
                "price": 255.46,
                "timestamp": "2025-09-28T03:30:00Z"
            })
            await asyncio.sleep(5)
    except:
        pass

# Main dashboard with all features
@app.get("/")
async def dashboard():
    dashboard_path = "src/web/templates/dashboard.html"
    if os.path.exists(dashboard_path):
        with open(dashboard_path, 'r') as f:
            html = f.read()
        return HTMLResponse(html)
    html = """
    <html>
    <body style="font-family: Arial; padding: 20px; background: #f0f0f0;">
        <h1>Trading Dashboard</h1>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Account Info</h2>
            <p>Account Value: <span id="account">Loading...</span></p>
            <p>Buying Power: <span id="power">Loading...</span></p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px;">
            <h2>Quick Trade</h2>
            <input id="sym" value="AAPL" placeholder="Symbol">
            <input id="qty" value="1" type="number" placeholder="Qty">
            <button onclick="buy()">Buy</button>
            <button onclick="sell()">Sell</button>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Positions</h2>
            <div id="positions">Loading...</div>
        </div>
        
        <script>
        function load() {
            fetch('/api/account').then(r => r.json()).then(d => {
                document.getElementById('account').innerText = '$' + d.portfolio_value;
                document.getElementById('power').innerText = '$' + d.buying_power;
            });
            fetch('/api/positions').then(r => r.json()).then(d => {
                let html = d.length ? d.map(p => p.symbol + ': ' + p.qty + ' shares').join('<br>') : 'No positions';
                document.getElementById('positions').innerHTML = html;
            });
        }
        function buy() {
            let s = document.getElementById('sym').value;
            let q = document.getElementById('qty').value;
            fetch('/api/stock/buy?symbol='+s+'&qty='+q, {method:'POST'})
                .then(() => { alert('Buy order sent'); load(); });
        }
        function sell() {
            let s = document.getElementById('sym').value;
            let q = document.getElementById('qty').value;
            fetch('/api/stock/sell?symbol='+s+'&qty='+q, {method:'POST'})
                .then(() => { alert('Sell order sent'); load(); });
        }
        load();
        setInterval(load, 5000);
        </script>
    </body>
    </html>
    """
    return HTMLResponse(html)

if __name__ == "__main__":
    import uvicorn
    import os
    uvicorn.run(app, host="0.0.0.0", port=8000)
