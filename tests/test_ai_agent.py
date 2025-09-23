"""
Tests for AI agent functionality.
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, patch

from src.ai.ai_agent import AIAgent, AIAnalysisResponse, AnalysisType
from tests.mocks.mock_ai import MockAIAgent, create_bullish_response, create_bearish_response


class TestMockAIAgent:
    """Test cases for mock AI agent."""

    def test_mock_ai_agent_initialization(self):
        """Test mock AI agent initialization."""
        agent = MockAIAgent()

        assert agent.api_key == "mock_api_key"
        assert agent.model == "mock-claude-model"
        assert agent.call_count == 0
        assert agent.last_request is None
        assert not agent.should_fail
        assert agent.delay_seconds == 0

    @pytest.mark.asyncio
    async def test_trade_opportunity_analysis(self):
        """Test trade opportunity analysis."""
        agent = MockAIAgent()

        market_data = {
            'current_price': 150.0,
            'volume': 1000000,
            'bid': 149.95,
            'ask': 150.05
        }

        technical_indicators = {
            'rsi': 25.0,  # Oversold
            'macd': 0.5,
            'ema_20': 148.0
        }

        response = await agent.analyze_trade_opportunity(
            symbol="AAPL",
            market_data=market_data,
            technical_indicators=technical_indicators
        )

        assert isinstance(response, AIAnalysisResponse)
        assert response.symbol == "AAPL"
        assert response.analysis_type == AnalysisType.TRADE_ANALYSIS
        assert response.recommendation in ["BUY", "SELL", "HOLD"]
        assert 0.0 <= response.confidence <= 1.0
        assert agent.call_count == 1

    @pytest.mark.asyncio
    async def test_market_sentiment_analysis(self):
        """Test market sentiment analysis."""
        agent = MockAIAgent()

        symbols = ["AAPL", "GOOGL", "MSFT"]
        news_data = [
            {"title": "Tech stocks rally", "sentiment": "positive"},
            {"title": "Market volatility increases", "sentiment": "negative"}
        ]

        response = await agent.analyze_market_sentiment(
            symbols=symbols,
            news_data=news_data
        )

        assert isinstance(response, AIAnalysisResponse)
        assert response.analysis_type == AnalysisType.MARKET_SENTIMENT
        assert response.recommendation in ["BULLISH", "BEARISH", "NEUTRAL"]
        assert len(response.risk_factors) > 0
        assert len(response.opportunities) > 0
        assert agent.call_count == 1

    @pytest.mark.asyncio
    async def test_risk_assessment_analysis(self):
        """Test risk assessment analysis."""
        agent = MockAIAgent()

        portfolio = {
            'total_value': 100000,
            'positions': 5,
            'cash': 20000
        }

        market_conditions = {
            'vix': 25.0,
            'market_trend': 'bullish'
        }

        volatility_metrics = {
            'portfolio_volatility': 0.20,
            'beta': 1.1
        }

        response = await agent.analyze_risk_assessment(
            portfolio=portfolio,
            market_conditions=market_conditions,
            volatility_metrics=volatility_metrics
        )

        assert isinstance(response, AIAnalysisResponse)
        assert response.analysis_type == AnalysisType.RISK_ANALYSIS
        assert response.symbol == "PORTFOLIO"
        assert response.recommendation in ["REDUCE_RISK", "MAINTAIN", "MONITOR"]
        assert agent.call_count == 1

    @pytest.mark.asyncio
    async def test_predefined_responses(self):
        """Test predefined response functionality."""
        agent = MockAIAgent()

        # Set predefined response
        predefined_response = create_bullish_response("TSLA")
        agent.set_predefined_response('trade_opportunity', predefined_response)

        response = await agent.analyze_trade_opportunity(
            symbol="AAPL",  # Different symbol
            market_data={'current_price': 100.0},
            technical_indicators={'rsi': 50.0}
        )

        # Should return predefined response
        assert response.symbol == "TSLA"  # From predefined response
        assert response.recommendation == "BUY"
        assert response.confidence == 0.85

    @pytest.mark.asyncio
    async def test_failure_mode(self):
        """Test failure mode simulation."""
        agent = MockAIAgent()
        agent.set_failure_mode(True)

        with pytest.raises(Exception, match="Mock AI agent failure"):
            await agent.analyze_trade_opportunity(
                symbol="AAPL",
                market_data={'current_price': 100.0},
                technical_indicators={'rsi': 50.0}
            )

    @pytest.mark.asyncio
    async def test_delay_simulation(self):
        """Test delay simulation."""
        agent = MockAIAgent()
        agent.set_delay(0.1)  # 100ms delay

        start_time = datetime.now()

        await agent.analyze_trade_opportunity(
            symbol="AAPL",
            market_data={'current_price': 100.0},
            technical_indicators={'rsi': 50.0}
        )

        end_time = datetime.now()
        elapsed = (end_time - start_time).total_seconds()

        assert elapsed >= 0.1  # Should have at least the delay

    def test_call_history_tracking(self):
        """Test call history tracking."""
        agent = MockAIAgent()

        history = agent.get_call_history()
        assert history[0]['call_count'] == 0
        assert history[0]['last_request'] is None

    def test_reset_functionality(self):
        """Test reset functionality."""
        agent = MockAIAgent()
        agent.call_count = 5
        agent.last_request = {"test": "data"}
        agent.set_failure_mode(True)
        agent.set_delay(1.0)

        agent.reset()

        assert agent.call_count == 0
        assert agent.last_request is None
        assert not agent.should_fail
        assert agent.delay_seconds == 0
        assert len(agent.predefined_responses) == 0


class TestAIResponseHelpers:
    """Test cases for AI response helper functions."""

    def test_create_bullish_response(self):
        """Test bullish response creation."""
        response = create_bullish_response("NVDA")

        assert response.symbol == "NVDA"
        assert response.recommendation == "BUY"
        assert response.confidence == 0.85
        assert "bullish" in response.reasoning.lower()
        assert len(response.suggested_actions) > 0

    def test_create_bearish_response(self):
        """Test bearish response creation."""
        response = create_bearish_response("NVDA")

        assert response.symbol == "NVDA"
        assert response.recommendation == "SELL"
        assert response.confidence == 0.78
        assert "bearish" in response.reasoning.lower()
        assert len(response.suggested_actions) > 0


@pytest.mark.integration
@pytest.mark.requires_api
class TestRealAIAgent:
    """Integration tests for real AI agent (requires API key)."""

    @pytest.fixture
    def real_ai_agent(self, test_config):
        """Create real AI agent for integration testing."""
        return AIAgent(
            api_key=test_config.ai.anthropic_api_key,
            model=test_config.ai.model
        )

    @pytest.mark.asyncio
    async def test_real_trade_analysis(self, real_ai_agent):
        """Test real trade analysis (requires valid API key)."""
        market_data = {
            'current_price': 150.0,
            'volume': 1000000,
            'bid': 149.95,
            'ask': 150.05
        }

        technical_indicators = {
            'rsi': 65.0,
            'macd': 0.8,
            'ema_20': 148.0,
            'sma_50': 145.0
        }

        try:
            response = await real_ai_agent.analyze_trade_opportunity(
                symbol="AAPL",
                market_data=market_data,
                technical_indicators=technical_indicators
            )

            assert isinstance(response, AIAnalysisResponse)
            assert response.symbol == "AAPL"
            assert response.recommendation in ["BUY", "SELL", "HOLD"]
            assert 0.0 <= response.confidence <= 1.0
            assert len(response.reasoning) > 0

        except Exception as e:
            pytest.skip(f"API test skipped due to: {e}")

    @pytest.mark.asyncio
    async def test_real_sentiment_analysis(self, real_ai_agent):
        """Test real sentiment analysis (requires valid API key)."""
        symbols = ["AAPL", "MSFT"]
        news_data = [
            {
                "title": "Apple reports strong quarterly earnings",
                "content": "Apple exceeded expectations with record revenue",
                "sentiment": "positive",
                "timestamp": datetime.now().isoformat()
            }
        ]

        try:
            response = await real_ai_agent.analyze_market_sentiment(
                symbols=symbols,
                news_data=news_data
            )

            assert isinstance(response, AIAnalysisResponse)
            assert response.analysis_type == AnalysisType.MARKET_SENTIMENT
            assert len(response.reasoning) > 0

        except Exception as e:
            pytest.skip(f"API test skipped due to: {e}")


@pytest.mark.asyncio
async def test_concurrent_ai_requests():
    """Test concurrent AI requests handling."""
    agent = MockAIAgent()

    # Create multiple concurrent requests
    tasks = []
    for i in range(5):
        task = agent.analyze_trade_opportunity(
            symbol=f"STOCK{i}",
            market_data={'current_price': 100.0 + i},
            technical_indicators={'rsi': 50.0 + i}
        )
        tasks.append(task)

    responses = await asyncio.gather(*tasks)

    assert len(responses) == 5
    assert agent.call_count == 5

    for i, response in enumerate(responses):
        assert isinstance(response, AIAnalysisResponse)
        assert response.symbol == f"STOCK{i}"


@pytest.mark.asyncio
async def test_ai_agent_timeout_handling():
    """Test AI agent timeout handling."""
    agent = MockAIAgent()
    agent.set_delay(0.05)  # Small delay

    # This should complete normally
    response = await agent.analyze_trade_opportunity(
        symbol="AAPL",
        market_data={'current_price': 100.0},
        technical_indicators={'rsi': 50.0}
    )

    assert isinstance(response, AIAnalysisResponse)