"""
AI Recommendations Router
Provides AI-generated trading recommendations based on market analysis
"""

from fastapi import APIRouter, HTTPException
from typing import List, Literal
from pydantic import BaseModel
import random
from datetime import datetime

router = APIRouter(prefix="/ai", tags=["ai"])

class Recommendation(BaseModel):
    symbol: str
    action: Literal["BUY", "SELL", "HOLD"]
    confidence: float  # 0-100
    reason: str
    targetPrice: float
    currentPrice: float
    timeframe: str = "1-3 months"
    risk: Literal["Low", "Medium", "High"] = "Medium"

class RecommendationsResponse(BaseModel):
    recommendations: List[Recommendation]
    generated_at: str
    model_version: str = "v1.0.0"

@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations():
    """
    Generate AI-powered trading recommendations

    In production, this would:
    1. Analyze current market conditions
    2. Review technical indicators
    3. Process news sentiment
    4. Run ML models for prediction
    5. Generate recommendations with confidence scores

    For now, returns mock data with realistic patterns and rotating stock universe
    """

    # Expanded stock universe - randomly select 5 each time
    stock_universe = [
        # Tech
        {"symbol": "AAPL", "action": "BUY", "confidence": 87.5, "reason": "Strong bullish momentum with breakout above 200-day MA. Positive earnings surprise expected.", "target": 195.50, "current": 182.30, "timeframe": "1-2 months", "risk": "Low"},
        {"symbol": "MSFT", "action": "BUY", "confidence": 84.2, "reason": "Azure cloud revenue growth accelerating. Strong institutional buying. Breaking resistance.", "target": 425.00, "current": 405.20, "timeframe": "1-3 months", "risk": "Low"},
        {"symbol": "GOOGL", "action": "BUY", "confidence": 79.8, "reason": "AI integration driving ad revenue. Undervalued vs peers. Positive analyst upgrades.", "target": 155.00, "current": 142.50, "timeframe": "2-3 months", "risk": "Medium"},
        {"symbol": "META", "action": "BUY", "confidence": 88.3, "reason": "Metaverse investments paying off. Strong user growth. Cost-cutting boosting margins.", "target": 520.00, "current": 485.00, "timeframe": "1-2 months", "risk": "Medium"},
        {"symbol": "NVDA", "action": "BUY", "confidence": 91.2, "reason": "Semiconductor sector showing strength. AI chip demand accelerating. Technical breakout.", "target": 525.00, "current": 485.20, "timeframe": "1-3 months", "risk": "Medium"},
        {"symbol": "AMD", "action": "BUY", "confidence": 78.4, "reason": "Positive divergence forming. Strong support. Market share gains in data center.", "target": 155.00, "current": 142.60, "timeframe": "1-2 months", "risk": "Medium"},
        {"symbol": "TSLA", "action": "SELL", "confidence": 72.3, "reason": "Overbought conditions. RSI divergence suggests weakening momentum. High volatility risk.", "target": 220.00, "current": 238.90, "timeframe": "2-4 weeks", "risk": "High"},

        # Financial
        {"symbol": "JPM", "action": "BUY", "confidence": 81.5, "reason": "Rising interest rates benefiting margins. Strong balance sheet. Dividend growth.", "target": 175.00, "current": 162.30, "timeframe": "2-3 months", "risk": "Low"},
        {"symbol": "BAC", "action": "BUY", "confidence": 76.2, "reason": "Credit quality improving. Trading desk performing well. Attractive valuation.", "target": 36.50, "current": 33.80, "timeframe": "1-2 months", "risk": "Medium"},
        {"symbol": "GS", "action": "HOLD", "confidence": 68.9, "reason": "M&A activity picking up but near-term headwinds from bond trading. Wait for pullback.", "target": 395.00, "current": 388.20, "timeframe": "3-4 weeks", "risk": "Medium"},

        # Healthcare
        {"symbol": "UNH", "action": "BUY", "confidence": 85.7, "reason": "Healthcare demand steady. Optum growth strong. Defensive play in uncertain market.", "target": 580.00, "current": 545.00, "timeframe": "2-3 months", "risk": "Low"},
        {"symbol": "JNJ", "action": "BUY", "confidence": 74.8, "reason": "Dividend aristocrat. Pharmaceutical pipeline strong. Legal issues priced in.", "target": 168.00, "current": 158.50, "timeframe": "3-6 months", "risk": "Low"},
        {"symbol": "PFE", "action": "HOLD", "confidence": 62.3, "reason": "Post-COVID transition challenging. Pipeline needs time to develop. Wait for clarity.", "target": 32.00, "current": 30.50, "timeframe": "2-3 months", "risk": "Medium"},

        # Energy
        {"symbol": "XOM", "action": "BUY", "confidence": 83.1, "reason": "Oil prices stabilizing. Strong cash flow. Share buybacks accelerating.", "target": 125.00, "current": 115.20, "timeframe": "1-2 months", "risk": "Medium"},
        {"symbol": "CVX", "action": "BUY", "confidence": 80.4, "reason": "Integrated model performing well. Dividend yield attractive. Capex discipline.", "target": 175.00, "current": 162.80, "timeframe": "2-3 months", "risk": "Medium"},

        # Consumer
        {"symbol": "AMZN", "action": "BUY", "confidence": 86.9, "reason": "AWS growth reaccelerating. Retail margins improving. AI investments strategic.", "target": 195.00, "current": 178.50, "timeframe": "1-3 months", "risk": "Medium"},
        {"symbol": "WMT", "action": "BUY", "confidence": 77.5, "reason": "Defensive play. E-commerce gaining share. Grocery inflation moderating.", "target": 72.00, "current": 67.80, "timeframe": "2-4 months", "risk": "Low"},
        {"symbol": "HD", "action": "HOLD", "confidence": 66.2, "reason": "Housing market mixed. DIY demand softening. Wait for better entry point.", "target": 385.00, "current": 378.50, "timeframe": "1-2 months", "risk": "Medium"},

        # ETFs
        {"symbol": "SPY", "action": "HOLD", "confidence": 65.8, "reason": "Market at key resistance level. Mixed signals from economic data. Wait for direction.", "target": 462.00, "current": 458.20, "timeframe": "2-3 weeks", "risk": "Low"},
        {"symbol": "QQQ", "action": "BUY", "confidence": 82.1, "reason": "Tech leadership continuing. Rate cut expectations supportive. Momentum strong.", "target": 425.00, "current": 408.50, "timeframe": "1-2 months", "risk": "Medium"},
        {"symbol": "IWM", "action": "BUY", "confidence": 75.6, "reason": "Small caps oversold. Rate cuts benefit smaller companies. Rotation opportunity.", "target": 215.00, "current": 198.30, "timeframe": "2-3 months", "risk": "High"},
    ]

    # Randomly select 5 stocks from the universe
    selected = random.sample(stock_universe, min(5, len(stock_universe)))

    mock_recommendations = []
    for stock in selected:
        # Add randomization to make it more realistic
        confidence = max(50, min(95, stock["confidence"] + random.uniform(-5, 5)))
        price_var = random.uniform(-0.02, 0.02)
        current_price = round(stock["current"] * (1 + price_var), 2)
        target_price = round(stock["target"] * (1 + price_var), 2)

        mock_recommendations.append(Recommendation(
            symbol=stock["symbol"],
            action=stock["action"],
            confidence=confidence,
            reason=stock["reason"],
            targetPrice=target_price,
            currentPrice=current_price,
            timeframe=stock["timeframe"],
            risk=stock["risk"]
        ))

    return RecommendationsResponse(
        recommendations=mock_recommendations,
        generated_at=datetime.utcnow().isoformat() + "Z"
    )

@router.get("/recommendations/{symbol}", response_model=Recommendation)
async def get_symbol_recommendation(symbol: str):
    """
    Get AI recommendation for a specific symbol
    """
    # In production, generate recommendation for specific symbol
    # For now, return mock data

    symbol = symbol.upper()

    mock_rec = Recommendation(
        symbol=symbol,
        action="BUY",
        confidence=75.0 + random.uniform(-10, 15),
        reason=f"AI analysis suggests favorable risk/reward for {symbol}. Technical indicators show potential upside.",
        targetPrice=150.00 + random.uniform(-20, 50),
        currentPrice=140.00 + random.uniform(-10, 10),
        timeframe="1-2 months",
        risk=random.choice(["Low", "Medium", "High"])
    )

    return mock_rec
