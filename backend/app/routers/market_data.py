from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import require_bearer
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockLatestQuoteRequest, StockBarsRequest
from alpaca.data.timeframe import TimeFrame
import os
from datetime import datetime, timedelta

router = APIRouter()

# Initialize Alpaca data client (lazy to avoid CI failures)
data_client = None

def get_data_client():
    """Lazy initialization of Alpaca client"""
    global data_client
    if data_client is None:
        api_key = os.getenv("APCA_API_KEY_ID") or os.getenv("ALPACA_API_KEY")
        secret_key = os.getenv("APCA_API_SECRET_KEY") or os.getenv("ALPACA_SECRET_KEY")
        if not api_key or not secret_key:
            raise HTTPException(status_code=500, detail="Alpaca API credentials not configured")
        data_client = StockHistoricalDataClient(api_key=api_key, secret_key=secret_key)
    return data_client

@router.get("/market/quote/{symbol}")
async def get_quote(symbol: str):
    """Get real-time quote for a symbol"""
    try:
        client = get_data_client()
        request = StockLatestQuoteRequest(symbol_or_symbols=symbol)
        quotes = client.get_stock_latest_quote(request)

        quote = quotes[symbol]
        return {
            "symbol": symbol,
            "bid": float(quote.bid_price),
            "ask": float(quote.ask_price),
            "last": float(quote.bid_price),  # Use bid as approximation
            "volume": int(quote.bid_size + quote.ask_size),
            "timestamp": quote.timestamp.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market/quotes")
async def get_quotes(symbols: str):
    """Get quotes for multiple symbols (comma-separated)"""
    try:
        client = get_data_client()
        symbol_list = symbols.upper().split(',')
        request = StockLatestQuoteRequest(symbol_or_symbols=symbol_list)
        quotes = client.get_stock_latest_quote(request)

        result = {}
        for symbol in symbol_list:
            if symbol in quotes:
                q = quotes[symbol]
                result[symbol] = {
                    "bid": float(q.bid_price),
                    "ask": float(q.ask_price),
                    "last": float(q.bid_price),
                    "timestamp": q.timestamp.isoformat()
                }

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market/bars/{symbol}")
async def get_bars(symbol: str, timeframe: str = "1Day", limit: int = 100):
    """Get historical price bars"""
    try:
        # Map timeframe string to Alpaca TimeFrame
        tf_map = {
            "1Min": TimeFrame.Minute,
            "5Min": TimeFrame(5, "Min"),
            "1Hour": TimeFrame.Hour,
            "1Day": TimeFrame.Day
        }

        tf = tf_map.get(timeframe, TimeFrame.Day)

        client = get_data_client()
        request = StockBarsRequest(
            symbol_or_symbols=symbol,
            timeframe=tf,
            limit=limit
        )

        bars = client.get_stock_bars(request)

        result = []
        for bar in bars[symbol]:
            result.append({
                "timestamp": bar.timestamp.isoformat(),
                "open": float(bar.open),
                "high": float(bar.high),
                "low": float(bar.low),
                "close": float(bar.close),
                "volume": int(bar.volume)
            })

        return {"symbol": symbol, "bars": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market/scanner/under4")
async def scan_under_4():
    """Scan for stocks under $4 with volume"""
    try:
        # Pre-defined list of liquid stocks that trade near/under $4
        candidates = [
            "SOFI", "PLUG", "RIOT", "NIO", "F", "VALE",
            "BTG", "GOLD", "SIRI", "TLRY", "SNAP", "BBD"
        ]

        client = get_data_client()
        request = StockLatestQuoteRequest(symbol_or_symbols=candidates)
        quotes = client.get_stock_latest_quote(request)

        results = []
        for symbol in candidates:
            if symbol in quotes:
                q = quotes[symbol]
                price = float(q.ask_price)

                if price < 4.00 and price > 0.50:  # Filter under $4, above $0.50
                    results.append({
                        "symbol": symbol,
                        "price": price,
                        "bid": float(q.bid_price),
                        "ask": float(q.ask_price),
                        "timestamp": q.timestamp.isoformat()
                    })

        # Sort by price ascending
        results.sort(key=lambda x: x["price"])

        return {"candidates": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market/indices")
async def get_indices():
    """Get major market indices (SPY, QQQ, DIA, IWM)"""
    try:
        client = get_data_client()
        symbols = ["SPY", "QQQ", "DIA", "IWM"]
        request = StockLatestQuoteRequest(symbol_or_symbols=symbols)
        quotes = client.get_stock_latest_quote(request)

        result = {}
        for symbol in symbols:
            if symbol in quotes:
                q = quotes[symbol]
                price = float(q.ask_price)

                # Get previous close for % change calculation
                bars_request = StockBarsRequest(
                    symbol_or_symbols=symbol,
                    timeframe=TimeFrame.Day,
                    limit=2
                )
                bars = client.get_stock_bars(bars_request)

                prev_close = float(bars[symbol][0].close) if len(bars[symbol]) > 0 else price
                pct_change = ((price - prev_close) / prev_close) * 100

                result[symbol] = {
                    "price": price,
                    "prev_close": prev_close,
                    "change": price - prev_close,
                    "change_pct": round(pct_change, 2)
                }

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
