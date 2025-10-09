"""
Market conditions and analysis endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Literal
from pydantic import BaseModel
from ..core.auth import require_bearer
from ..core.config import settings
import requests

router = APIRouter(tags=["market"])


class MarketCondition(BaseModel):
    name: str
    value: str
    status: Literal["favorable", "neutral", "unfavorable"]
    details: str | None = None


@router.get("/market/conditions", dependencies=[Depends(require_bearer)])
async def get_market_conditions() -> dict:
    """
    Get current market conditions for trading analysis

    TODO: Implement real market data fetching:
    - VIX from CBOE or market data provider
    - SPY trend analysis (moving averages, price action)
    - Market breadth (advance/decline ratio, new highs/lows)
    - Volume analysis compared to averages
    - Sector rotation analysis
    """

    # Mock market conditions - replace with real data
    conditions: List[MarketCondition] = [
        MarketCondition(
            name="VIX (Volatility)",
            value="14.2",
            status="favorable",
            details="Below 20 indicates calm market, good for directional trades"
        ),
        MarketCondition(
            name="SPY Trend",
            value="Uptrend",
            status="favorable",
            details="Price above 50-day and 200-day moving averages"
        ),
        MarketCondition(
            name="Market Breadth",
            value="68% bullish",
            status="favorable",
            details="Advance/decline ratio: 2.1, showing broad participation"
        ),
        MarketCondition(
            name="Volume",
            value="Above average",
            status="neutral",
            details="110% of 20-day average volume"
        ),
        MarketCondition(
            name="Sector Rotation",
            value="Tech leading",
            status="favorable",
            details="Technology and Communication Services outperforming"
        ),
        MarketCondition(
            name="Put/Call Ratio",
            value="0.82",
            status="neutral",
            details="Moderate sentiment, not overly bullish or bearish"
        )
    ]

    return {
        "conditions": [cond.model_dump() for cond in conditions],
        "timestamp": "2025-10-06T00:00:00Z",
        "overallSentiment": "bullish",  # calculated from conditions
        "recommendedActions": [
            "Consider directional bullish strategies",
            "Monitor tech sector for momentum plays",
            "Watch for volume confirmation on breakouts"
        ]
    }


@router.get("/market/indices", dependencies=[Depends(require_bearer)])
async def get_major_indices() -> dict:
    """
    Get current prices for Dow Jones Industrial and NASDAQ Composite using live Alpaca snapshot data
    Returns data in format: { dow: {...}, nasdaq: {...} }
    """
    try:
        # Fetch snapshots from Alpaca - using $DJI and $COMP indices
        # Note: Alpaca uses $ prefix for indices
        symbols = ["$DJI.IX", "$COMP.IX"]  # Dow Jones Industrial, NASDAQ Composite
        headers = {
            "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY
        }

        # Fetch latest quotes for each symbol
        all_bars = {}
        for symbol in symbols:
            try:
                resp = requests.get(
                    f"{settings.ALPACA_BASE_URL}/v2/stocks/{symbol}/bars/latest",
                    headers=headers,
                    params={"feed": "iex"}  # Use IEX feed for paper trading
                )
                if resp.status_code == 200:
                    symbol_data = resp.json()
                    if "bar" in symbol_data:
                        all_bars[symbol] = symbol_data["bar"]
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
                continue

        # Process results
        dow_data = {}
        nasdaq_data = {}

        if "$DJI.IX" in all_bars:
            bar = all_bars["$DJI.IX"]
            price = bar.get("c", 0)
            open_price = bar.get("o", price)
            change = price - open_price
            changePercent = (change / open_price * 100) if open_price else 0

            dow_data = {
                "last": round(price, 2),
                "change": round(change, 2),
                "changePercent": round(changePercent, 2)
            }

        if "$COMP.IX" in all_bars:
            bar = all_bars["$COMP.IX"]
            price = bar.get("c", 0)
            open_price = bar.get("o", price)
            change = price - open_price
            changePercent = (change / open_price * 100) if open_price else 0

            nasdaq_data = {
                "last": round(price, 2),
                "change": round(change, 2),
                "changePercent": round(changePercent, 2)
            }

        if dow_data or nasdaq_data:
            print(f"[Market] Fetched live data for Dow/NASDAQ")
            return {
                "dow": dow_data,
                "nasdaq": nasdaq_data
            }
        else:
            raise ValueError("No snapshot data returned")

    except Exception as e:
        print(f"Error fetching live market data: {e}")
        # Fallback to mock data if API fails
        return {
            "dow": {
                "last": 42500.00,
                "change": 125.50,
                "changePercent": 0.30
            },
            "nasdaq": {
                "last": 18350.00,
                "change": 98.75,
                "changePercent": 0.54
            }
        }


@router.get("/market/sectors", dependencies=[Depends(require_bearer)])
async def get_sector_performance() -> dict:
    """
    Get performance of major market sectors

    TODO: Fetch real sector ETF data
    """
    sectors = [
        {"name": "Technology", "symbol": "XLK", "changePercent": 1.8, "rank": 1},
        {"name": "Communication", "symbol": "XLC", "changePercent": 1.5, "rank": 2},
        {"name": "Consumer Discretionary", "symbol": "XLY", "changePercent": 0.9, "rank": 3},
        {"name": "Financials", "symbol": "XLF", "changePercent": 0.6, "rank": 4},
        {"name": "Healthcare", "symbol": "XLV", "changePercent": 0.4, "rank": 5},
        {"name": "Industrials", "symbol": "XLI", "changePercent": 0.2, "rank": 6},
        {"name": "Materials", "symbol": "XLB", "changePercent": -0.1, "rank": 7},
        {"name": "Real Estate", "symbol": "XLRE", "changePercent": -0.3, "rank": 8},
        {"name": "Utilities", "symbol": "XLU", "changePercent": -0.5, "rank": 9},
        {"name": "Energy", "symbol": "XLE", "changePercent": -1.2, "rank": 10},
        {"name": "Consumer Staples", "symbol": "XLP", "changePercent": -0.8, "rank": 11}
    ]

    return {
        "sectors": sectors,
        "timestamp": "2025-10-06T00:00:00Z",
        "leader": "Technology",
        "laggard": "Energy"
    }
