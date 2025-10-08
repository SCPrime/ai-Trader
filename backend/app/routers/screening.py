"""
Strategy-based opportunity screening endpoints
"""
from fastapi import APIRouter, Depends
from typing import List, Literal
from pydantic import BaseModel
from ..core.auth import require_bearer
import random

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

    # Expanded opportunity universe - randomly select from each type
    stock_opportunities = [
        {"symbol": "AAPL", "strategy": "Momentum Breakout", "reason": "Breaking above 20-day MA with strong volume. RSI at 62 (bullish but not overbought). MACD showing positive crossover.", "current": 184.10, "target": 192.50, "confidence": 85, "risk": "medium"},
        {"symbol": "NVDA", "strategy": "Mean Reversion", "reason": "Oversold on daily timeframe (RSI 28), holding support at 200-day MA. High probability bounce setup.", "current": 485.20, "target": 515.00, "confidence": 78, "risk": "medium"},
        {"symbol": "MSFT", "strategy": "Momentum Breakout", "reason": "Cloud earnings beat expectations. Breaking out of consolidation with strong institutional buying.", "current": 405.50, "target": 425.00, "confidence": 82, "risk": "low"},
        {"symbol": "GOOGL", "strategy": "Mean Reversion", "reason": "Oversold after sell-off. RSI 31, holding key support. Search revenue stable.", "current": 142.30, "target": 155.00, "confidence": 75, "risk": "medium"},
        {"symbol": "AMD", "strategy": "Momentum Breakout", "reason": "Chip sector strength. Breaking resistance at $145. Data center growth accelerating.", "current": 143.80, "target": 158.00, "confidence": 80, "risk": "medium"},
        {"symbol": "JPM", "strategy": "Value Play", "reason": "Trading below fair value. Strong financials. Interest rate environment favorable.", "current": 162.50, "target": 175.00, "confidence": 77, "risk": "low"},
        {"symbol": "UNH", "strategy": "Defensive Breakout", "reason": "Healthcare demand steady. Breaking all-time highs. Optum growth strong.", "current": 545.00, "target": 580.00, "confidence": 83, "risk": "low"},
        {"symbol": "XOM", "strategy": "Energy Momentum", "reason": "Oil prices stabilizing. Strong cash flow. Share buyback program.", "current": 115.20, "target": 125.00, "confidence": 79, "risk": "medium"},
    ]

    option_opportunities = [
        {"symbol": "SPY 450C 30DTE", "strategy": "Bullish Trend Following", "reason": "Market in clear uptrend, low IV (18th percentile), good risk/reward ratio. Delta 0.65, Theta -0.08.", "current": 5.20, "target": 8.50, "confidence": 72, "risk": "medium"},
        {"symbol": "QQQ 425C 45DTE", "strategy": "Tech Momentum Play", "reason": "Tech leadership strong. IV at 22nd percentile. Delta 0.70, clean chart pattern.", "current": 6.80, "target": 10.50, "confidence": 75, "risk": "medium"},
        {"symbol": "AAPL 190C 60DTE", "strategy": "Earnings Play", "reason": "IV spike expected before earnings. Current IV rank low at 25%. Delta 0.55.", "current": 3.40, "target": 6.20, "confidence": 68, "risk": "high"},
        {"symbol": "IWM 210C 30DTE", "strategy": "Small Cap Rotation", "reason": "Small caps breaking out. Rate cut expectations. IV at 30th percentile.", "current": 4.10, "target": 7.00, "confidence": 70, "risk": "high"},
        {"symbol": "XLE 95C 45DTE", "strategy": "Energy Sector Play", "reason": "Energy stabilizing. Geopolitical premium. Delta 0.62, low IV.", "current": 2.80, "target": 4.50, "confidence": 73, "risk": "medium"},
    ]

    multileg_opportunities = [
        {"symbol": "TSLA Iron Condor 240/250/270/280", "strategy": "Range-Bound Premium Collection", "reason": "High IV rank (75th percentile), stock consolidating between $250-$265. Theta decay favorable, max profit at current price.", "current": 250.00, "target": None, "confidence": 68, "risk": "low"},
        {"symbol": "QQQ Put Credit Spread 420/415", "strategy": "High Probability Income", "reason": "30 delta put spread, 85% probability of profit. Market trending up, selling premium at support level.", "current": 425.50, "target": None, "confidence": 82, "risk": "low"},
        {"symbol": "SPY Iron Butterfly 455/460/465", "strategy": "Neutral Income Play", "reason": "Market consolidating at 460. High IV (65th percentile). Max profit at current level.", "current": 460.00, "target": None, "confidence": 76, "risk": "low"},
        {"symbol": "NVDA Strangle 460/520", "strategy": "Earnings Volatility Play", "reason": "Earnings next week. IV expansion expected. Current IV rank 45%. Profit from big move either direction.", "current": 485.00, "target": None, "confidence": 65, "risk": "high"},
        {"symbol": "AAPL Call Debit Spread 180/190", "strategy": "Defined Risk Bullish", "reason": "Limiting upside for lower cost. Breakout setup. 70% probability of profit.", "current": 182.50, "target": 190.00, "confidence": 74, "risk": "medium"},
        {"symbol": "META Put Credit Spread 500/495", "strategy": "Support Level Defense", "reason": "Selling puts at strong support. 20 delta, 80% PoP. Collecting premium on dips.", "current": 510.00, "target": None, "confidence": 79, "risk": "low"},
    ]

    # Randomly select opportunities from each category
    selected_stocks = random.sample(stock_opportunities, min(2, len(stock_opportunities)))
    selected_options = random.sample(option_opportunities, min(2, len(option_opportunities)))
    selected_multileg = random.sample(multileg_opportunities, min(2, len(multileg_opportunities)))

    all_opportunities: List[Opportunity] = []

    # Add stocks
    for stock in selected_stocks:
        price_var = random.uniform(-0.02, 0.02)
        all_opportunities.append(Opportunity(
            symbol=stock["symbol"],
            type="stock",
            strategy=stock["strategy"],
            reason=stock["reason"],
            currentPrice=round(stock["current"] * (1 + price_var), 2),
            targetPrice=round(stock["target"] * (1 + price_var), 2) if stock["target"] else None,
            confidence=max(60, min(95, stock["confidence"] + random.randint(-5, 5))),
            risk=stock["risk"]
        ))

    # Add options
    for option in selected_options:
        price_var = random.uniform(-0.03, 0.03)
        all_opportunities.append(Opportunity(
            symbol=option["symbol"],
            type="option",
            strategy=option["strategy"],
            reason=option["reason"],
            currentPrice=round(option["current"] * (1 + price_var), 2),
            targetPrice=round(option["target"] * (1 + price_var), 2) if option["target"] else None,
            confidence=max(60, min(95, option["confidence"] + random.randint(-5, 5))),
            risk=option["risk"]
        ))

    # Add multileg
    for multileg in selected_multileg:
        price_var = random.uniform(-0.01, 0.01)
        all_opportunities.append(Opportunity(
            symbol=multileg["symbol"],
            type="multileg",
            strategy=multileg["strategy"],
            reason=multileg["reason"],
            currentPrice=round(multileg["current"] * (1 + price_var), 2),
            targetPrice=round(multileg["target"] * (1 + price_var), 2) if multileg["target"] else None,
            confidence=max(60, min(95, multileg["confidence"] + random.randint(-5, 5))),
            risk=multileg["risk"]
        ))

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
