"""
Strategy-based opportunity screening endpoints
"""
from fastapi import APIRouter, Depends
from typing import List, Literal
from pydantic import BaseModel
from ..core.auth import require_bearer

router = APIRouter(tags=["screening"])


class Opportunity(BaseModel):
    symbol: str
    type: Literal["stock", "option", "multileg"]
    strategy: str
    reason: str
    currentPrice: float
    targetPrice: float | None = None
    confidence: int  # 0-100
    risk: Literal["low", "medium", "high"]


@router.get("/screening/opportunities", dependencies=[Depends(require_bearer)])
async def get_opportunities(max_price: float | None = None) -> dict:
    """
    Get strategy-based trading opportunities

    Args:
        max_price: Optional maximum price to filter opportunities (based on available account balance)

    TODO: Implement real screening logic based on:
    - User's selected strategies from settings
    - Technical indicators (moving averages, RSI, MACD)
    - Volume analysis
    - Options data (IV, Greeks)
    - Risk parameters from user settings
    """

    # Mock opportunities - replace with real screening logic
    all_opportunities: List[Opportunity] = [
        Opportunity(
            symbol="AAPL",
            type="stock",
            strategy="Momentum Breakout",
            reason="Breaking above 20-day MA with strong volume. RSI at 62 (bullish but not overbought). MACD showing positive crossover.",
            currentPrice=184.10,
            targetPrice=192.50,
            confidence=85,
            risk="medium"
        ),
        Opportunity(
            symbol="SPY 450C 30DTE",
            type="option",
            strategy="Bullish Trend Following",
            reason="Market in clear uptrend, low IV (18th percentile), good risk/reward ratio. Delta 0.65, Theta -0.08.",
            currentPrice=5.20,
            targetPrice=8.50,
            confidence=72,
            risk="medium"
        ),
        Opportunity(
            symbol="TSLA Iron Condor 240/250/270/280",
            type="multileg",
            strategy="Range-Bound Premium Collection",
            reason="High IV rank (75th percentile), stock consolidating between $250-$265. Theta decay favorable, max profit at current price.",
            currentPrice=250.00,
            targetPrice=None,
            confidence=68,
            risk="low"
        ),
        Opportunity(
            symbol="NVDA",
            type="stock",
            strategy="Mean Reversion",
            reason="Oversold on daily timeframe (RSI 28), holding support at 200-day MA. High probability bounce setup.",
            currentPrice=485.20,
            targetPrice=515.00,
            confidence=78,
            risk="medium"
        ),
        Opportunity(
            symbol="QQQ Put Credit Spread 420/415",
            type="multileg",
            strategy="High Probability Income",
            reason="30 delta put spread, 85% probability of profit. Market trending up, selling premium at support level.",
            currentPrice=425.50,
            targetPrice=None,
            confidence=82,
            risk="low"
        )
    ]

    # Filter by max price if provided
    opportunities = all_opportunities
    if max_price is not None:
        opportunities = [opp for opp in all_opportunities if opp.currentPrice <= max_price]

    # Ensure we have diverse investment types in the results
    # Group by type to show variety
    type_groups = {"stock": [], "option": [], "multileg": []}
    for opp in opportunities:
        type_groups[opp.type].append(opp)

    # Build diverse list: at least one of each type if available
    diverse_opportunities = []
    for opp_type in ["stock", "option", "multileg"]:
        if type_groups[opp_type]:
            diverse_opportunities.extend(type_groups[opp_type])

    return {
        "opportunities": [opp.model_dump() for opp in diverse_opportunities],
        "timestamp": "2025-10-06T00:00:00Z",
        "strategyCount": len(set(opp.strategy for opp in diverse_opportunities)),
        "filteredByPrice": max_price is not None,
        "maxPrice": max_price
    }


@router.get("/screening/strategies", dependencies=[Depends(require_bearer)])
async def get_available_strategies() -> dict:
    """
    Get list of available screening strategies

    Users can enable/disable these in settings
    """
    strategies = [
        {
            "id": "momentum-breakout",
            "name": "Momentum Breakout",
            "description": "Stocks breaking above key resistance levels with strong volume",
            "assetTypes": ["stock"],
            "enabled": True
        },
        {
            "id": "mean-reversion",
            "name": "Mean Reversion",
            "description": "Oversold stocks at support levels with bounce potential",
            "assetTypes": ["stock"],
            "enabled": True
        },
        {
            "id": "bullish-trend-following",
            "name": "Bullish Trend Following",
            "description": "Call options in uptrending markets with favorable IV",
            "assetTypes": ["option"],
            "enabled": True
        },
        {
            "id": "range-bound-premium",
            "name": "Range-Bound Premium Collection",
            "description": "Iron condors and credit spreads in consolidating stocks",
            "assetTypes": ["multileg"],
            "enabled": True
        },
        {
            "id": "high-probability-income",
            "name": "High Probability Income",
            "description": "Put credit spreads with 80%+ probability of profit",
            "assetTypes": ["multileg"],
            "enabled": True
        }
    ]

    return {"strategies": strategies}
