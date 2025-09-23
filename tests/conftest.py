"""
Pytest configuration and fixtures for the AI Trading Bot test suite.
"""

import pytest
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any
from unittest.mock import Mock, AsyncMock
import tempfile
import os
from pathlib import Path

# Import test modules
from tests.mocks.mock_alpaca import MockAlpacaClient
from tests.mocks.mock_ai import MockAIAgent
from src.strategies.rsi_strategy import RSIStrategy, RSIConfig
from src.strategies.macd_strategy import MACDStrategy, MACDConfig
from src.strategies.strategy_engine import StrategyEngine, EngineConfig
from src.risk.risk_manager import RiskManager, RiskLimits
from src.data.data_manager import DataManager
from config.config import Config, AlpacaConfig, TradingConfig, AIConfig


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_data_dir():
    """Create temporary directory for test data."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir


@pytest.fixture
def sample_ohlcv_data():
    """Generate sample OHLCV data for testing."""
    np.random.seed(42)  # For reproducible tests

    dates = pd.date_range(start='2024-01-01', periods=100, freq='1min')
    base_price = 100.0

    # Generate realistic price movement
    returns = np.random.normal(0, 0.01, len(dates))
    prices = [base_price]

    for ret in returns[1:]:
        prices.append(prices[-1] * (1 + ret))

    # Create OHLCV data
    data = pd.DataFrame({
        'timestamp': dates,
        'open': prices,
        'close': prices,
        'high': [p * (1 + abs(np.random.normal(0, 0.005))) for p in prices],
        'low': [p * (1 - abs(np.random.normal(0, 0.005))) for p in prices],
        'volume': np.random.randint(1000, 10000, len(dates)),
        'trade_count': np.random.randint(10, 100, len(dates)),
        'vwap': prices
    })

    data.set_index('timestamp', inplace=True)
    return data


@pytest.fixture
def trending_ohlcv_data():
    """Generate trending OHLCV data for strategy testing."""
    np.random.seed(42)

    dates = pd.date_range(start='2024-01-01', periods=100, freq='5min')
    base_price = 100.0

    # Create upward trending data
    trend = np.linspace(0, 0.2, len(dates))  # 20% upward trend
    noise = np.random.normal(0, 0.005, len(dates))

    prices = base_price * (1 + trend + noise)

    data = pd.DataFrame({
        'timestamp': dates,
        'open': prices,
        'close': prices,
        'high': prices * 1.01,
        'low': prices * 0.99,
        'volume': np.random.randint(5000, 50000, len(dates)),
        'trade_count': np.random.randint(50, 500, len(dates)),
        'vwap': prices
    })

    data.set_index('timestamp', inplace=True)
    return data


@pytest.fixture
def volatile_ohlcv_data():
    """Generate volatile OHLCV data for risk testing."""
    np.random.seed(123)

    dates = pd.date_range(start='2024-01-01', periods=50, freq='15min')
    base_price = 100.0

    # Create high volatility data
    returns = np.random.normal(0, 0.03, len(dates))  # 3% volatility
    prices = [base_price]

    for ret in returns[1:]:
        prices.append(prices[-1] * (1 + ret))

    data = pd.DataFrame({
        'timestamp': dates,
        'open': prices,
        'close': prices,
        'high': [p * (1 + abs(np.random.normal(0, 0.02))) for p in prices],
        'low': [p * (1 - abs(np.random.normal(0, 0.02))) for p in prices],
        'volume': np.random.randint(10000, 100000, len(dates)),
        'trade_count': np.random.randint(100, 1000, len(dates)),
        'vwap': prices
    })

    data.set_index('timestamp', inplace=True)
    return data


@pytest.fixture
def mock_alpaca_client():
    """Create mock Alpaca client for testing."""
    return MockAlpacaClient()


@pytest.fixture
def mock_ai_agent():
    """Create mock AI agent for testing."""
    return MockAIAgent()


@pytest.fixture
def test_config():
    """Create test configuration."""
    return Config(
        alpaca=AlpacaConfig(
            api_key="test_api_key",
            secret_key="test_secret_key",
            paper_trading=True
        ),
        trading=TradingConfig(
            max_positions=3,
            position_size=0.01,
            stop_loss_pct=0.02,
            take_profit_pct=0.04
        ),
        ai=AIConfig(
            anthropic_api_key="test_ai_key",
            model="claude-3-sonnet-20240229"
        )
    )


@pytest.fixture
def rsi_strategy():
    """Create RSI strategy for testing."""
    config = RSIConfig(
        period=14,
        oversold=30.0,
        overbought=70.0,
        use_divergence=True,
        use_volume_filter=True
    )
    return RSIStrategy(config)


@pytest.fixture
def macd_strategy():
    """Create MACD strategy for testing."""
    config = MACDConfig(
        fast_period=12,
        slow_period=26,
        signal_period=9,
        use_ema_crossover=True
    )
    return MACDStrategy(config)


@pytest.fixture
def strategy_engine():
    """Create strategy engine for testing."""
    config = EngineConfig(
        aggregation_method="weighted_average",
        min_agreement_threshold=0.6
    )
    return StrategyEngine(config)


@pytest.fixture
def risk_manager():
    """Create risk manager for testing."""
    limits = RiskLimits(
        max_position_size=1000.0,
        max_daily_loss=0.05,
        max_positions=5,
        stop_loss_percentage=0.02
    )
    return RiskManager(limits)


@pytest.fixture
def mock_account_info():
    """Create mock account information."""
    return {
        'id': 'test_account_id',
        'account_number': '123456789',
        'status': 'ACTIVE',
        'currency': 'USD',
        'buying_power': 10000.0,
        'cash': 5000.0,
        'portfolio_value': 15000.0,
        'equity': 15000.0,
        'last_equity': 14800.0,
        'multiplier': 4,
        'day_trade_count': 0,
        'created_at': datetime.now()
    }


@pytest.fixture
def mock_positions():
    """Create mock position data."""
    return [
        {
            'asset_id': 'test_asset_1',
            'symbol': 'AAPL',
            'qty': 10.0,
            'market_value': 1500.0,
            'cost_basis': 1450.0,
            'unrealized_pl': 50.0,
            'unrealized_plpc': 0.0345,
            'current_price': 150.0,
            'lastday_price': 148.0,
            'change_today': 2.0
        },
        {
            'asset_id': 'test_asset_2',
            'symbol': 'TSLA',
            'qty': 5.0,
            'market_value': 1000.0,
            'cost_basis': 1050.0,
            'unrealized_pl': -50.0,
            'unrealized_plpc': -0.0476,
            'current_price': 200.0,
            'lastday_price': 205.0,
            'change_today': -5.0
        }
    ]


@pytest.fixture
def mock_orders():
    """Create mock order data."""
    return [
        {
            'id': 'order_1',
            'client_order_id': 'test_order_1',
            'created_at': datetime.now(),
            'symbol': 'AAPL',
            'qty': 10.0,
            'filled_qty': 10.0,
            'type': 'market',
            'side': 'buy',
            'status': 'filled',
            'limit_price': None,
            'stop_price': None
        }
    ]


@pytest.fixture
def sample_trade_data():
    """Create sample trade data for testing."""
    return {
        'symbol': 'AAPL',
        'side': 'buy',
        'quantity': 10.0,
        'price': 150.0,
        'order_id': 'test_order_123',
        'strategy': 'RSI',
        'signal_strength': 'BUY',
        'confidence': 0.75,
        'metadata': {'test': True}
    }


@pytest.fixture
def data_manager(temp_data_dir):
    """Create data manager for testing."""
    db_url = f"sqlite:///{temp_data_dir}/test.db"
    return DataManager(data_dir=temp_data_dir, db_url=db_url)


@pytest.fixture
async def async_data_manager(temp_data_dir):
    """Create async data manager for testing."""
    db_url = f"sqlite:///{temp_data_dir}/test_async.db"
    manager = DataManager(data_dir=temp_data_dir, db_url=db_url)
    yield manager
    manager.close()


@pytest.fixture
def mock_websocket_data():
    """Create mock WebSocket data."""
    return {
        'trade': {
            'T': 't',
            'S': 'AAPL',
            't': '2024-01-01T10:00:00Z',
            'p': 150.0,
            's': 100,
            'c': [],
            'i': 'trade_123'
        },
        'quote': {
            'T': 'q',
            'S': 'AAPL',
            't': '2024-01-01T10:00:00Z',
            'bp': 149.95,
            'bs': 100,
            'ap': 150.05,
            'as': 200
        },
        'bar': {
            'T': 'b',
            'S': 'AAPL',
            't': '2024-01-01T10:00:00Z',
            'o': 149.50,
            'h': 150.50,
            'l': 149.00,
            'c': 150.00,
            'v': 10000,
            'vw': 149.75,
            'n': 50
        }
    }


@pytest.fixture
def performance_metrics():
    """Create sample performance metrics."""
    return {
        'total_trades': 50,
        'winning_trades': 32,
        'losing_trades': 18,
        'win_rate': 0.64,
        'total_pnl': 1250.50,
        'avg_trade': 25.01,
        'best_trade': 150.00,
        'worst_trade': -75.25,
        'sharpe_ratio': 1.45,
        'max_drawdown': 0.08,
        'volatility': 0.15
    }


@pytest.fixture
def ai_analysis_response():
    """Create sample AI analysis response."""
    from src.ai.ai_agent import AIAnalysisResponse, AnalysisType

    return AIAnalysisResponse(
        analysis_type=AnalysisType.TRADE_ANALYSIS,
        symbol='AAPL',
        recommendation='BUY',
        confidence=0.85,
        reasoning='Strong technical indicators support bullish outlook',
        risk_factors=['Market volatility', 'Sector rotation risk'],
        opportunities=['Earnings catalyst', 'Technical breakout'],
        suggested_actions=['Enter position', 'Set stop loss at $145'],
        market_outlook='Bullish short-term outlook',
        timestamp=datetime.now()
    )


# Utility functions for tests
def create_test_signal(symbol: str = "AAPL", signal_type: str = "BUY", confidence: float = 0.75):
    """Create a test trading signal."""
    from src.strategies.rsi_strategy import TradingSignal, SignalStrength

    return TradingSignal(
        symbol=symbol,
        signal=SignalStrength.BUY,
        price=150.0,
        confidence=confidence,
        timestamp=datetime.now(),
        indicators={'rsi': 25.0, 'volume_ratio': 1.5},
        reason="Test signal for unit testing"
    )


def create_test_combined_signal(symbol: str = "AAPL"):
    """Create a test combined signal."""
    from src.strategies.strategy_engine import CombinedSignal
    from src.strategies.rsi_strategy import SignalStrength

    return CombinedSignal(
        symbol=symbol,
        final_signal=SignalStrength.BUY,
        confidence=0.8,
        timestamp=datetime.now(),
        price=150.0,
        contributing_strategies={'rsi': create_test_signal(symbol)},
        aggregation_method='weighted_average',
        reason='Test combined signal'
    )


# Async test utilities
@pytest.fixture
def async_mock():
    """Create async mock for testing."""
    return AsyncMock()


# Test markers
def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "requires_api: mark test as requiring external API"
    )
    config.addinivalue_line(
        "markers", "requires_data: mark test as requiring historical data"
    )


# Test collection hooks
def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on test names."""
    for item in items:
        # Mark tests as unit tests by default
        if not any(marker.name in ['integration', 'slow', 'requires_api', 'requires_data']
                  for marker in item.iter_markers()):
            item.add_marker(pytest.mark.unit)

        # Mark slow tests
        if 'slow' in item.nodeid or 'backtest' in item.nodeid:
            item.add_marker(pytest.mark.slow)

        # Mark API tests
        if 'api' in item.nodeid or 'client' in item.nodeid:
            item.add_marker(pytest.mark.requires_api)

        # Mark data tests
        if 'data' in item.nodeid or 'historical' in item.nodeid:
            item.add_marker(pytest.mark.requires_data)


# Cleanup functions
@pytest.fixture(autouse=True)
def cleanup_test_files():
    """Automatically cleanup test files after each test."""
    yield

    # Clean up any temporary files created during tests
    temp_patterns = ['test_*.db', 'test_*.h5', 'test_*.log']

    for pattern in temp_patterns:
        for file_path in Path('.').glob(pattern):
            try:
                file_path.unlink()
            except (OSError, PermissionError):
                pass  # Ignore cleanup errors


# Custom assertions
class CustomAssertions:
    """Custom assertion helpers for trading tests."""

    @staticmethod
    def assert_valid_signal(signal):
        """Assert that a trading signal is valid."""
        assert signal is not None
        assert hasattr(signal, 'symbol')
        assert hasattr(signal, 'signal')
        assert hasattr(signal, 'confidence')
        assert 0.0 <= signal.confidence <= 1.0
        assert signal.price > 0

    @staticmethod
    def assert_valid_trade_data(trade_data):
        """Assert that trade data is valid."""
        required_fields = ['symbol', 'side', 'quantity', 'price']
        for field in required_fields:
            assert field in trade_data

        assert trade_data['quantity'] > 0
        assert trade_data['price'] > 0
        assert trade_data['side'] in ['buy', 'sell']

    @staticmethod
    def assert_risk_within_limits(risk_assessment, limits):
        """Assert that risk is within specified limits."""
        if hasattr(risk_assessment, 'daily_pnl'):
            max_loss = limits.max_daily_loss * 10000  # Assuming $10k portfolio
            assert risk_assessment.daily_pnl >= -max_loss


@pytest.fixture
def assert_helpers():
    """Provide custom assertion helpers."""
    return CustomAssertions()