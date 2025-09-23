"""
Mock AI agent for testing purposes.
"""

import asyncio
import random
from typing import Dict, List, Any, Optional
from datetime import datetime
from unittest.mock import AsyncMock

from src.ai.ai_agent import AIAgent, AIAnalysisResponse, AnalysisType


class MockAIAgent:
    """
    Mock AI agent that simulates Claude AI responses for testing.
    """

    def __init__(self):
        """Initialize mock AI agent."""
        self.api_key = "mock_api_key"
        self.model = "mock-claude-model"
        self.call_count = 0
        self.last_request = None
        self.predefined_responses = {}
        self.should_fail = False
        self.delay_seconds = 0

    def set_predefined_response(self, analysis_type: str, response: AIAnalysisResponse):
        """Set a predefined response for a specific analysis type."""
        self.predefined_responses[analysis_type] = response

    def set_failure_mode(self, should_fail: bool = True):
        """Configure the mock to simulate failures."""
        self.should_fail = should_fail

    def set_delay(self, seconds: float):
        """Set artificial delay for testing timeout scenarios."""
        self.delay_seconds = seconds

    async def analyze_trade_opportunity(
        self,
        symbol: str,
        market_data: Dict[str, Any],
        technical_indicators: Dict[str, float],
        current_positions: List[Dict[str, Any]] = None
    ) -> AIAnalysisResponse:
        """
        Mock trade opportunity analysis.

        Args:
            symbol: Stock symbol
            market_data: Current market data
            technical_indicators: Technical analysis indicators
            current_positions: Current portfolio positions

        Returns:
            Mock AI analysis response
        """
        self.call_count += 1
        self.last_request = {
            'type': 'trade_opportunity',
            'symbol': symbol,
            'market_data': market_data,
            'technical_indicators': technical_indicators,
            'current_positions': current_positions
        }

        if self.delay_seconds > 0:
            await asyncio.sleep(self.delay_seconds)

        if self.should_fail:
            raise Exception("Mock AI agent failure")

        # Return predefined response if available
        if 'trade_opportunity' in self.predefined_responses:
            return self.predefined_responses['trade_opportunity']

        # Generate realistic mock response
        rsi = technical_indicators.get('rsi', 50.0)
        price = market_data.get('current_price', 100.0)

        # Generate recommendation based on RSI
        if rsi < 30:
            recommendation = "BUY"
            confidence = 0.75 + random.random() * 0.2
        elif rsi > 70:
            recommendation = "SELL"
            confidence = 0.75 + random.random() * 0.2
        else:
            recommendation = "HOLD"
            confidence = 0.5 + random.random() * 0.3

        return AIAnalysisResponse(
            analysis_type=AnalysisType.TRADE_ANALYSIS,
            symbol=symbol,
            recommendation=recommendation,
            confidence=confidence,
            reasoning=f"Mock analysis for {symbol}: RSI at {rsi:.1f}, price at ${price:.2f}. "
                     f"Technical indicators suggest {recommendation.lower()} signal.",
            risk_factors=self._generate_mock_risk_factors(symbol, rsi),
            opportunities=self._generate_mock_opportunities(symbol, recommendation),
            suggested_actions=self._generate_mock_actions(recommendation, price),
            market_outlook=self._generate_mock_outlook(rsi),
            timestamp=datetime.now()
        )

    async def analyze_market_sentiment(
        self,
        symbols: List[str],
        news_data: Optional[List[Dict[str, Any]]] = None,
        market_indicators: Optional[Dict[str, float]] = None
    ) -> AIAnalysisResponse:
        """
        Mock market sentiment analysis.

        Args:
            symbols: List of symbols to analyze
            news_data: Recent news data
            market_indicators: Broad market indicators

        Returns:
            Mock sentiment analysis response
        """
        self.call_count += 1
        self.last_request = {
            'type': 'market_sentiment',
            'symbols': symbols,
            'news_data': news_data,
            'market_indicators': market_indicators
        }

        if self.delay_seconds > 0:
            await asyncio.sleep(self.delay_seconds)

        if self.should_fail:
            raise Exception("Mock AI agent failure")

        # Return predefined response if available
        if 'market_sentiment' in self.predefined_responses:
            return self.predefined_responses['market_sentiment']

        # Generate mock sentiment
        sentiment_score = random.uniform(-1, 1)

        if sentiment_score > 0.3:
            outlook = "Bullish"
        elif sentiment_score < -0.3:
            outlook = "Bearish"
        else:
            outlook = "Neutral"

        return AIAnalysisResponse(
            analysis_type=AnalysisType.MARKET_SENTIMENT,
            symbol=",".join(symbols[:3]) if symbols else "MARKET",
            recommendation=outlook.upper(),
            confidence=0.6 + abs(sentiment_score) * 0.3,
            reasoning=f"Mock market sentiment analysis shows {outlook.lower()} sentiment "
                     f"with score {sentiment_score:.2f}. Based on {len(symbols)} symbols analyzed.",
            risk_factors=["Mock market volatility", "Economic uncertainty"],
            opportunities=["Mock sector rotation", "Earnings season catalyst"],
            suggested_actions=[f"Monitor {outlook.lower()} trends", "Adjust position sizing"],
            market_outlook=f"{outlook} market outlook based on sentiment analysis",
            timestamp=datetime.now()
        )

    async def analyze_risk_assessment(
        self,
        portfolio: Dict[str, Any],
        market_conditions: Dict[str, Any],
        volatility_metrics: Dict[str, float]
    ) -> AIAnalysisResponse:
        """
        Mock risk assessment analysis.

        Args:
            portfolio: Current portfolio state
            market_conditions: Current market conditions
            volatility_metrics: Volatility measurements

        Returns:
            Mock risk analysis response
        """
        self.call_count += 1
        self.last_request = {
            'type': 'risk_assessment',
            'portfolio': portfolio,
            'market_conditions': market_conditions,
            'volatility_metrics': volatility_metrics
        }

        if self.delay_seconds > 0:
            await asyncio.sleep(self.delay_seconds)

        if self.should_fail:
            raise Exception("Mock AI agent failure")

        # Return predefined response if available
        if 'risk_assessment' in self.predefined_responses:
            return self.predefined_responses['risk_assessment']

        # Generate mock risk assessment
        portfolio_value = portfolio.get('total_value', 10000)
        volatility = volatility_metrics.get('portfolio_volatility', 0.15)

        if volatility > 0.25:
            risk_level = "HIGH"
            recommendation = "REDUCE_RISK"
        elif volatility < 0.10:
            risk_level = "LOW"
            recommendation = "MAINTAIN"
        else:
            risk_level = "MODERATE"
            recommendation = "MONITOR"

        return AIAnalysisResponse(
            analysis_type=AnalysisType.RISK_ANALYSIS,
            symbol="PORTFOLIO",
            recommendation=recommendation,
            confidence=0.8,
            reasoning=f"Mock risk assessment: Portfolio value ${portfolio_value:,.2f}, "
                     f"volatility {volatility:.1%}. Risk level: {risk_level}",
            risk_factors=[f"{risk_level.lower()} volatility", "Concentration risk", "Market correlation"],
            opportunities=["Diversification potential", "Hedging opportunities"],
            suggested_actions=self._generate_risk_actions(risk_level),
            market_outlook=f"Risk-adjusted outlook considering {risk_level.lower()} volatility environment",
            timestamp=datetime.now()
        )

    def _generate_mock_risk_factors(self, symbol: str, rsi: float) -> List[str]:
        """Generate realistic mock risk factors."""
        base_risks = ["Market volatility", "Sector-specific risks"]

        if rsi > 70:
            base_risks.append("Overbought conditions")
        elif rsi < 30:
            base_risks.append("Oversold momentum risk")

        return base_risks

    def _generate_mock_opportunities(self, symbol: str, recommendation: str) -> List[str]:
        """Generate realistic mock opportunities."""
        opportunities = ["Technical breakout potential"]

        if recommendation == "BUY":
            opportunities.extend(["Oversold bounce", "Support level hold"])
        elif recommendation == "SELL":
            opportunities.extend(["Resistance test", "Profit taking level"])

        return opportunities

    def _generate_mock_actions(self, recommendation: str, price: float) -> List[str]:
        """Generate realistic mock suggested actions."""
        actions = []

        if recommendation == "BUY":
            stop_loss = price * 0.98
            take_profit = price * 1.04
            actions.extend([
                f"Enter long position",
                f"Set stop loss at ${stop_loss:.2f}",
                f"Target profit at ${take_profit:.2f}"
            ])
        elif recommendation == "SELL":
            actions.extend([
                "Exit long positions",
                "Consider short entry",
                "Implement profit protection"
            ])
        else:
            actions.extend([
                "Maintain current position",
                "Monitor for breakout",
                "Prepare for directional move"
            ])

        return actions

    def _generate_mock_outlook(self, rsi: float) -> str:
        """Generate realistic mock market outlook."""
        if rsi < 30:
            return "Short-term oversold conditions suggest potential bounce"
        elif rsi > 70:
            return "Overbought levels indicate possible correction ahead"
        else:
            return "Neutral technical setup with range-bound expectations"

    def _generate_risk_actions(self, risk_level: str) -> List[str]:
        """Generate risk management actions based on risk level."""
        if risk_level == "HIGH":
            return [
                "Reduce position sizes",
                "Implement hedging strategies",
                "Increase cash allocation"
            ]
        elif risk_level == "LOW":
            return [
                "Consider increasing exposure",
                "Look for growth opportunities",
                "Maintain current allocation"
            ]
        else:
            return [
                "Monitor position sizing",
                "Maintain balanced exposure",
                "Prepare for volatility changes"
            ]

    def get_call_history(self) -> List[Dict[str, Any]]:
        """Get history of all mock API calls."""
        return [{
            'call_count': self.call_count,
            'last_request': self.last_request
        }]

    def reset(self):
        """Reset mock state for clean testing."""
        self.call_count = 0
        self.last_request = None
        self.predefined_responses = {}
        self.should_fail = False
        self.delay_seconds = 0


# Utility functions for creating test AI responses
def create_bullish_response(symbol: str = "AAPL") -> AIAnalysisResponse:
    """Create a bullish AI analysis response for testing."""
    return AIAnalysisResponse(
        analysis_type=AnalysisType.TRADE_ANALYSIS,
        symbol=symbol,
        recommendation="BUY",
        confidence=0.85,
        reasoning=f"Strong bullish indicators for {symbol}. RSI oversold, MACD bullish crossover.",
        risk_factors=["Market volatility", "Sector rotation risk"],
        opportunities=["Technical breakout", "Earnings catalyst"],
        suggested_actions=["Enter long position", "Set stop loss at support"],
        market_outlook="Bullish short-term outlook with upside potential",
        timestamp=datetime.now()
    )


def create_bearish_response(symbol: str = "AAPL") -> AIAnalysisResponse:
    """Create a bearish AI analysis response for testing."""
    return AIAnalysisResponse(
        analysis_type=AnalysisType.TRADE_ANALYSIS,
        symbol=symbol,
        recommendation="SELL",
        confidence=0.78,
        reasoning=f"Bearish signals detected for {symbol}. Overbought RSI, weakening momentum.",
        risk_factors=["Downtrend continuation", "Support break risk"],
        opportunities=["Short selling opportunity", "Profit taking"],
        suggested_actions=["Exit long positions", "Consider short entry"],
        market_outlook="Bearish outlook with potential for further decline",
        timestamp=datetime.now()
    )


def create_neutral_response(symbol: str = "AAPL") -> AIAnalysisResponse:
    """Create a neutral AI analysis response for testing."""
    return AIAnalysisResponse(
        analysis_type=AnalysisType.TRADE_ANALYSIS,
        symbol=symbol,
        recommendation="HOLD",
        confidence=0.65,
        reasoning=f"Mixed signals for {symbol}. Consolidating within range, waiting for breakout.",
        risk_factors=["Range-bound trading", "Low volatility risk"],
        opportunities=["Breakout potential", "Range trading"],
        suggested_actions=["Maintain position", "Monitor for breakout"],
        market_outlook="Neutral outlook pending directional catalyst",
        timestamp=datetime.now()
    )