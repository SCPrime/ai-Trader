"""
Claude AI integration for intelligent trade analysis and decision support.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
import pandas as pd
from dataclasses import dataclass, asdict
from enum import Enum

import anthropic
from anthropic import AsyncAnthropic

from ..strategies.rsi_strategy import TradingSignal, SignalStrength
from ..strategies.strategy_engine import CombinedSignal

logger = logging.getLogger(__name__)


class AnalysisType(Enum):
    """AI analysis types."""

    TRADE_ANALYSIS = "trade_analysis"
    MARKET_SENTIMENT = "market_sentiment"
    RISK_ASSESSMENT = "risk_assessment"
    PORTFOLIO_REVIEW = "portfolio_review"
    STRATEGY_OPTIMIZATION = "strategy_optimization"


@dataclass
class AIAnalysisRequest:
    """AI analysis request structure."""

    analysis_type: AnalysisType
    symbol: str
    context: Dict[str, Any]
    market_data: Optional[pd.DataFrame] = None
    current_positions: Optional[List[Dict]] = None
    recent_signals: Optional[List[Dict]] = None


@dataclass
class AIAnalysisResponse:
    """AI analysis response structure."""

    analysis_type: AnalysisType
    symbol: str
    recommendation: str
    confidence: float
    reasoning: str
    risk_factors: List[str]
    opportunities: List[str]
    suggested_actions: List[str]
    market_outlook: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class AIAgent:
    """
    Claude AI agent for trading analysis and decision support.
    """

    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        """
        Initialize AI agent.

        Args:
            api_key: Anthropic API key
            model: Claude model to use
        """
        self.api_key = api_key
        self.model = model
        self.client = AsyncAnthropic(api_key=api_key)

        # Analysis cache
        self.analysis_cache: Dict[str, AIAnalysisResponse] = {}
        self.cache_timeout_minutes = 30

        # Request tracking
        self.request_count = 0
        self.last_request_time = None

    async def analyze_trade_signal(
        self,
        signal: Union[TradingSignal, CombinedSignal],
        market_data: pd.DataFrame,
        context: Optional[Dict[str, Any]] = None,
    ) -> AIAnalysisResponse:
        """
        Analyze a trading signal using AI.

        Args:
            signal: Trading signal to analyze
            market_data: Market data context
            context: Additional context information

        Returns:
            AI analysis response
        """
        try:
            # Prepare context
            analysis_context = {
                "signal_type": (
                    signal.signal.value
                    if hasattr(signal, "signal")
                    else signal.final_signal.value
                ),
                "confidence": signal.confidence,
                "price": signal.price,
                "timestamp": signal.timestamp.isoformat(),
                "reason": getattr(signal, "reason", ""),
                "indicators": getattr(signal, "indicators", {}),
                "current_market_conditions": self._extract_market_conditions(
                    market_data
                ),
                **(context or {}),
            }

            # Create analysis request
            request = AIAnalysisRequest(
                analysis_type=AnalysisType.TRADE_ANALYSIS,
                symbol=signal.symbol,
                context=analysis_context,
                market_data=market_data,
            )

            return await self._perform_analysis(request)

        except Exception as e:
            logger.error(f"Error analyzing trade signal: {e}")
            return self._create_error_response(
                signal.symbol, AnalysisType.TRADE_ANALYSIS, str(e)
            )

    async def analyze_market_sentiment(
        self,
        symbol: str,
        market_data: pd.DataFrame,
        news_sentiment: Optional[Dict[str, Any]] = None,
    ) -> AIAnalysisResponse:
        """
        Analyze market sentiment for a symbol.

        Args:
            symbol: Stock symbol
            market_data: Recent market data
            news_sentiment: Optional news sentiment data

        Returns:
            Market sentiment analysis
        """
        try:
            # Prepare context
            context = {
                "market_conditions": self._extract_market_conditions(market_data),
                "price_action": self._analyze_price_action(market_data),
                "volume_analysis": self._analyze_volume(market_data),
                "news_sentiment": news_sentiment or {},
            }

            request = AIAnalysisRequest(
                analysis_type=AnalysisType.MARKET_SENTIMENT,
                symbol=symbol,
                context=context,
                market_data=market_data,
            )

            return await self._perform_analysis(request)

        except Exception as e:
            logger.error(f"Error analyzing market sentiment for {symbol}: {e}")
            return self._create_error_response(
                symbol, AnalysisType.MARKET_SENTIMENT, str(e)
            )

    async def assess_portfolio_risk(
        self,
        positions: List[Dict[str, Any]],
        account_info: Dict[str, Any],
        market_conditions: Dict[str, Any],
    ) -> AIAnalysisResponse:
        """
        Assess portfolio risk using AI analysis.

        Args:
            positions: Current positions
            account_info: Account information
            market_conditions: Current market conditions

        Returns:
            Risk assessment analysis
        """
        try:
            context = {
                "portfolio_value": account_info.get("portfolio_value", 0),
                "cash": account_info.get("cash", 0),
                "positions_count": len(positions),
                "largest_position": (
                    max([abs(float(p.get("market_value", 0))) for p in positions])
                    if positions
                    else 0
                ),
                "total_exposure": sum(
                    [abs(float(p.get("market_value", 0))) for p in positions]
                ),
                "unrealized_pnl": sum(
                    [float(p.get("unrealized_pl", 0)) for p in positions]
                ),
                "market_conditions": market_conditions,
                "position_details": positions[:10],  # Limit to top 10 positions
            }

            request = AIAnalysisRequest(
                analysis_type=AnalysisType.RISK_ASSESSMENT,
                symbol="PORTFOLIO",
                context=context,
                current_positions=positions,
            )

            return await self._perform_analysis(request)

        except Exception as e:
            logger.error(f"Error assessing portfolio risk: {e}")
            return self._create_error_response(
                "PORTFOLIO", AnalysisType.RISK_ASSESSMENT, str(e)
            )

    async def optimize_strategy_parameters(
        self,
        strategy_name: str,
        performance_metrics: Dict[str, Any],
        recent_signals: List[Dict[str, Any]],
    ) -> AIAnalysisResponse:
        """
        Get AI suggestions for strategy optimization.

        Args:
            strategy_name: Name of strategy to optimize
            performance_metrics: Strategy performance data
            recent_signals: Recent trading signals

        Returns:
            Strategy optimization suggestions
        """
        try:
            context = {
                "strategy_name": strategy_name,
                "performance_metrics": performance_metrics,
                "signal_count": len(recent_signals),
                "recent_signals_summary": self._summarize_signals(recent_signals),
                "optimization_focus": "improve_win_rate_and_reduce_drawdown",
            }

            request = AIAnalysisRequest(
                analysis_type=AnalysisType.STRATEGY_OPTIMIZATION,
                symbol=strategy_name,
                context=context,
                recent_signals=recent_signals,
            )

            return await self._perform_analysis(request)

        except Exception as e:
            logger.error(f"Error optimizing strategy {strategy_name}: {e}")
            return self._create_error_response(
                strategy_name, AnalysisType.STRATEGY_OPTIMIZATION, str(e)
            )

    async def _perform_analysis(self, request: AIAnalysisRequest) -> AIAnalysisResponse:
        """
        Perform AI analysis using Claude.

        Args:
            request: Analysis request

        Returns:
            Analysis response
        """
        try:
            # Check cache first
            cache_key = self._get_cache_key(request)
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                logger.debug(f"Returning cached analysis for {request.symbol}")
                return cached_response

            # Rate limiting
            await self._apply_rate_limiting()

            # Generate prompt
            prompt = self._generate_prompt(request)

            # Call Claude API
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}],
            )

            # Parse response
            analysis_response = self._parse_ai_response(
                request, response.content[0].text
            )

            # Cache response
            self._cache_response(cache_key, analysis_response)

            # Update request tracking
            self.request_count += 1
            self.last_request_time = datetime.now()

            return analysis_response

        except Exception as e:
            logger.error(f"Error in AI analysis: {e}")
            return self._create_error_response(
                request.symbol, request.analysis_type, str(e)
            )

    def _generate_prompt(self, request: AIAnalysisRequest) -> str:
        """Generate prompt for Claude based on analysis type."""
        base_context = f"""
You are an expert financial analyst and trading advisor.

Analysis Type: {request.analysis_type.value}
Symbol: {request.symbol}
Timestamp: {datetime.now().isoformat()}

Context Information:
{json.dumps(request.context, indent=2, default=str)}
"""

        if request.analysis_type == AnalysisType.TRADE_ANALYSIS:
            specific_prompt = """
Please analyze this trading signal and provide:

1. **Recommendation**: STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL
2. **Confidence**: 0.0 to 1.0 confidence level
3. **Reasoning**: Detailed analysis of why this signal makes sense
4. **Risk Factors**: Potential risks to consider
5. **Opportunities**: Potential opportunities
6. **Suggested Actions**: Specific actionable recommendations
7. **Market Outlook**: Short-term market outlook for this symbol

Consider technical indicators, market conditions, volume, and any patterns you observe.
"""

        elif request.analysis_type == AnalysisType.MARKET_SENTIMENT:
            specific_prompt = """
Please analyze the market sentiment for this symbol and provide:

1. **Recommendation**: Current sentiment (BULLISH, BEARISH, NEUTRAL)
2. **Confidence**: 0.0 to 1.0 confidence in sentiment assessment
3. **Reasoning**: What factors are driving the current sentiment
4. **Risk Factors**: Potential negative catalysts
5. **Opportunities**: Potential positive catalysts
6. **Suggested Actions**: How to position for current sentiment
7. **Market Outlook**: Expected sentiment evolution

Focus on price action, volume trends, and overall market context.
"""

        elif request.analysis_type == AnalysisType.RISK_ASSESSMENT:
            specific_prompt = """
Please assess the portfolio risk and provide:

1. **Recommendation**: Overall risk level (LOW, MODERATE, HIGH, CRITICAL)
2. **Confidence**: 0.0 to 1.0 confidence in risk assessment
3. **Reasoning**: Key risk factors identified
4. **Risk Factors**: Specific risks requiring attention
5. **Opportunities**: Risk mitigation opportunities
6. **Suggested Actions**: Immediate risk management actions
7. **Market Outlook**: Risk outlook given current market conditions

Consider concentration risk, correlation risk, and market exposure.
"""

        elif request.analysis_type == AnalysisType.STRATEGY_OPTIMIZATION:
            specific_prompt = """
Please analyze the strategy performance and suggest optimizations:

1. **Recommendation**: Areas for improvement
2. **Confidence**: 0.0 to 1.0 confidence in recommendations
3. **Reasoning**: Analysis of current performance
4. **Risk Factors**: Strategy weaknesses
5. **Opportunities**: Optimization opportunities
6. **Suggested Actions**: Specific parameter adjustments
7. **Market Outlook**: Strategy fit for current market regime

Focus on improving win rate, reducing drawdown, and enhancing risk-adjusted returns.
"""

        else:
            specific_prompt = """
Please provide a general analysis with the standard format:
1. Recommendation
2. Confidence
3. Reasoning
4. Risk Factors
5. Opportunities
6. Suggested Actions
7. Market Outlook
"""

        format_instructions = """
Please respond in JSON format:
{
    "recommendation": "your recommendation",
    "confidence": 0.85,
    "reasoning": "detailed reasoning...",
    "risk_factors": ["risk 1", "risk 2"],
    "opportunities": ["opportunity 1", "opportunity 2"],
    "suggested_actions": ["action 1", "action 2"],
    "market_outlook": "outlook description"
}
"""

        return base_context + specific_prompt + format_instructions

    def _parse_ai_response(
        self, request: AIAnalysisRequest, response_text: str
    ) -> AIAnalysisResponse:
        """Parse Claude's response into structured format."""
        try:
            # Try to extract JSON from response
            response_text = response_text.strip()

            # Find JSON block
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1

            if start_idx != -1 and end_idx != -1:
                json_text = response_text[start_idx:end_idx]
                parsed_response = json.loads(json_text)
            else:
                # Fallback parsing
                parsed_response = self._fallback_parse(response_text)

            return AIAnalysisResponse(
                analysis_type=request.analysis_type,
                symbol=request.symbol,
                recommendation=parsed_response.get("recommendation", "HOLD"),
                confidence=float(parsed_response.get("confidence", 0.5)),
                reasoning=parsed_response.get("reasoning", "AI analysis completed"),
                risk_factors=parsed_response.get("risk_factors", []),
                opportunities=parsed_response.get("opportunities", []),
                suggested_actions=parsed_response.get("suggested_actions", []),
                market_outlook=parsed_response.get("market_outlook", "Neutral outlook"),
                timestamp=datetime.now(),
                metadata={
                    "raw_response": response_text[:500]
                },  # Store truncated raw response
            )

        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            return self._create_fallback_response(request, response_text)

    def _fallback_parse(self, response_text: str) -> Dict[str, Any]:
        """Fallback parsing when JSON extraction fails."""
        return {
            "recommendation": "HOLD",
            "confidence": 0.5,
            "reasoning": (
                response_text[:200] + "..."
                if len(response_text) > 200
                else response_text
            ),
            "risk_factors": ["Unable to parse detailed risk factors"],
            "opportunities": ["Unable to parse detailed opportunities"],
            "suggested_actions": ["Review raw AI response"],
            "market_outlook": "Analysis completed with parsing issues",
        }

    def _create_fallback_response(
        self, request: AIAnalysisRequest, response_text: str
    ) -> AIAnalysisResponse:
        """Create fallback response when parsing fails."""
        return AIAnalysisResponse(
            analysis_type=request.analysis_type,
            symbol=request.symbol,
            recommendation="HOLD",
            confidence=0.5,
            reasoning=f"AI analysis completed but response parsing failed. Raw response: {response_text[:200]}...",
            risk_factors=["Response parsing error"],
            opportunities=["Manual review recommended"],
            suggested_actions=["Check raw AI response", "Retry analysis"],
            market_outlook="Unable to determine due to parsing error",
            timestamp=datetime.now(),
            metadata={"parsing_error": True, "raw_response": response_text[:500]},
        )

    def _extract_market_conditions(self, market_data: pd.DataFrame) -> Dict[str, Any]:
        """Extract market conditions from data."""
        if market_data.empty:
            return {}

        try:
            recent_data = market_data.tail(20)

            return {
                "current_price": float(market_data["close"].iloc[-1]),
                "price_change_1d": float(
                    market_data["close"].iloc[-1] - market_data["close"].iloc[-2]
                ),
                "price_change_5d": (
                    float(market_data["close"].iloc[-1] - market_data["close"].iloc[-6])
                    if len(market_data) > 5
                    else 0
                ),
                "volatility": float(recent_data["close"].std()),
                "avg_volume": float(recent_data["volume"].mean()),
                "current_volume": float(market_data["volume"].iloc[-1]),
                "high_52w": (
                    float(market_data["high"].max())
                    if len(market_data) > 200
                    else float(recent_data["high"].max())
                ),
                "low_52w": (
                    float(market_data["low"].min())
                    if len(market_data) > 200
                    else float(recent_data["low"].min())
                ),
                "rsi_level": (
                    self._calculate_simple_rsi(market_data["close"])
                    if len(market_data) > 14
                    else None
                ),
            }
        except Exception as e:
            logger.error(f"Error extracting market conditions: {e}")
            return {}

    def _analyze_price_action(self, market_data: pd.DataFrame) -> Dict[str, Any]:
        """Analyze price action patterns."""
        if len(market_data) < 5:
            return {}

        try:
            recent_closes = market_data["close"].tail(5)
            return {
                "trend": (
                    "bullish"
                    if recent_closes.iloc[-1] > recent_closes.iloc[0]
                    else "bearish"
                ),
                "momentum": (
                    "increasing"
                    if recent_closes.diff().tail(3).mean() > 0
                    else "decreasing"
                ),
                "support_level": float(market_data["low"].tail(20).min()),
                "resistance_level": float(market_data["high"].tail(20).max()),
            }
        except Exception:
            return {}

    def _analyze_volume(self, market_data: pd.DataFrame) -> Dict[str, Any]:
        """Analyze volume patterns."""
        if len(market_data) < 10:
            return {}

        try:
            recent_volume = market_data["volume"].tail(10)
            avg_volume = recent_volume.mean()
            current_volume = market_data["volume"].iloc[-1]

            return {
                "volume_trend": (
                    "increasing"
                    if recent_volume.tail(3).mean() > recent_volume.head(3).mean()
                    else "decreasing"
                ),
                "volume_ratio": float(current_volume / avg_volume),
                "volume_spike": current_volume > avg_volume * 2,
            }
        except Exception:
            return {}

    def _calculate_simple_rsi(
        self, prices: pd.Series, period: int = 14
    ) -> Optional[float]:
        """Calculate simple RSI."""
        try:
            if len(prices) < period + 1:
                return None

            delta = prices.diff()
            gain = delta.where(delta > 0, 0).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            return float(rsi.iloc[-1])
        except Exception:
            return None

    def _summarize_signals(self, signals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize recent signals for AI context."""
        if not signals:
            return {}

        try:
            signal_types = [s.get("signal", "NEUTRAL") for s in signals]
            return {
                "total_signals": len(signals),
                "buy_signals": signal_types.count("BUY")
                + signal_types.count("STRONG_BUY"),
                "sell_signals": signal_types.count("SELL")
                + signal_types.count("STRONG_SELL"),
                "avg_confidence": sum([float(s.get("confidence", 0)) for s in signals])
                / len(signals),
                "most_recent_signal": signals[0] if signals else None,
            }
        except Exception:
            return {"summary_error": True}

    async def _apply_rate_limiting(self):
        """Apply rate limiting for API calls."""
        if self.last_request_time:
            time_since_last = (datetime.now() - self.last_request_time).total_seconds()
            if time_since_last < 1.0:  # Minimum 1 second between requests
                await asyncio.sleep(1.0 - time_since_last)

    def _get_cache_key(self, request: AIAnalysisRequest) -> str:
        """Generate cache key for request."""
        return f"{request.analysis_type.value}_{request.symbol}_{datetime.now().strftime('%Y%m%d_%H')}"

    def _get_cached_response(self, cache_key: str) -> Optional[AIAnalysisResponse]:
        """Get cached response if valid."""
        if cache_key in self.analysis_cache:
            cached_response = self.analysis_cache[cache_key]
            age_minutes = (
                datetime.now() - cached_response.timestamp
            ).total_seconds() / 60

            if age_minutes < self.cache_timeout_minutes:
                return cached_response
            else:
                # Remove expired cache entry
                del self.analysis_cache[cache_key]

        return None

    def _cache_response(self, cache_key: str, response: AIAnalysisResponse):
        """Cache analysis response."""
        self.analysis_cache[cache_key] = response

        # Clean up old cache entries
        if len(self.analysis_cache) > 100:
            oldest_key = min(
                self.analysis_cache.keys(),
                key=lambda k: self.analysis_cache[k].timestamp,
            )
            del self.analysis_cache[oldest_key]

    def _create_error_response(
        self, symbol: str, analysis_type: AnalysisType, error_msg: str
    ) -> AIAnalysisResponse:
        """Create error response."""
        return AIAnalysisResponse(
            analysis_type=analysis_type,
            symbol=symbol,
            recommendation="HOLD",
            confidence=0.0,
            reasoning=f"Analysis failed: {error_msg}",
            risk_factors=["Analysis error"],
            opportunities=[],
            suggested_actions=["Retry analysis", "Check AI service status"],
            market_outlook="Unable to determine due to error",
            timestamp=datetime.now(),
            metadata={"error": error_msg},
        )

    def get_analysis_stats(self) -> Dict[str, Any]:
        """Get AI analysis statistics."""
        return {
            "total_requests": self.request_count,
            "cached_responses": len(self.analysis_cache),
            "last_request": (
                self.last_request_time.isoformat() if self.last_request_time else None
            ),
            "cache_timeout_minutes": self.cache_timeout_minutes,
            "model": self.model,
        }

    def clear_cache(self):
        """Clear analysis cache."""
        self.analysis_cache.clear()
        logger.info("AI analysis cache cleared")


# Utility functions
async def quick_trade_analysis(
    ai_agent: AIAgent,
    signal: Union[TradingSignal, CombinedSignal],
    market_data: pd.DataFrame,
) -> str:
    """
    Quick trade analysis for immediate decision support.

    Args:
        ai_agent: AI agent instance
        signal: Trading signal
        market_data: Market data

    Returns:
        Quick analysis summary
    """
    try:
        analysis = await ai_agent.analyze_trade_signal(signal, market_data)

        return f"""
🤖 AI Analysis for {signal.symbol}
Recommendation: {analysis.recommendation}
Confidence: {analysis.confidence:.1%}
Key Reasoning: {analysis.reasoning[:100]}...
Risk Factors: {', '.join(analysis.risk_factors[:2])}
"""
    except Exception as e:
        return f"AI analysis failed: {e}"


def format_analysis_for_notification(analysis: AIAnalysisResponse) -> str:
    """Format AI analysis for notifications."""
    return f"""
📊 AI Analysis: {analysis.symbol}
🎯 Recommendation: {analysis.recommendation}
📈 Confidence: {analysis.confidence:.1%}
💡 Key Points: {analysis.reasoning[:150]}...
⚠️ Risks: {', '.join(analysis.risk_factors[:2])}
🚀 Actions: {', '.join(analysis.suggested_actions[:2])}
"""
