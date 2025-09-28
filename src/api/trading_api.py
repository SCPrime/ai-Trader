from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ STOCK ENDPOINTS ============

@app.post("/api/stock/buy")
async def buy_stock(trade: TradeRequest):
    result = engine.buy_stock(trade.symbol, trade.qty)
    return result

@app.post("/api/stock/sell")
async def sell_stock(trade: TradeRequest):
    result = engine.sell_stock(trade.symbol, trade.qty)
    return result

@app.get("/api/positions")
async def get_positions():
    return engine.get_positions()

@app.get("/api/orders")
async def get_orders():
    return engine.get_orders()

@app.delete("/api/order/{order_id}")
async def cancel_order(order_id: str):
    return engine.cancel_order(order_id)

# ============ OPTIONS ENDPOINTS ============

@app.get("/api/options/chain/{symbol}")
async def get_options_chain(symbol: str):
    return engine.get_options_chain(symbol)

@app.post("/api/strategy/iron-condor")
async def create_iron_condor(strategy: StrategyRequest):
    return engine.create_iron_condor(strategy.symbol, strategy.strikes, strategy.expiration)

@app.post("/api/strategy/bull-spread")
async def create_bull_spread(spread: SpreadRequest):
    return engine.create_bull_call_spread(spread.symbol, spread.buy_strike, spread.sell_strike, spread.expiration)

# ============ MARKET DATA ============

@app.get("/api/quote/{symbol}")
async def get_quote(symbol: str):
    return engine.get_quote(symbol)

@app.get("/api/account")
async def get_account():
    return engine.get_account_info()

@app.get("/api/rsi/{symbol}")
async def get_rsi(symbol: str):
    rsi = engine.calculate_rsi(symbol)
    return {"symbol": symbol, "rsi": rsi}

# ============ SYSTEM ============

@app.get("/api/status")
async def status():
    return {
        "status": "running",
        "mode": engine.mode,
        "connected": engine.api is not None
    }

@app.get("/")
async def dashboard():
    return HTMLResponse("""
    <html>
        <body>
            <h1>Trading Dashboard</h1>
            <div id="status">Loading...</div>
            <script>
                fetch('/api/account').then(r => r.json()).then(data => {
                    document.getElementById('status').innerHTML =
                        'Account: $' + data.portfolio_value;
                });
            </script>
        </body>
    </html>
    """)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)