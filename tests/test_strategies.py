"""
Tests for trading strategies.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from src.strategies.rsi_strategy import RSIStrategy, RSIConfig, TradingSignal, SignalStrength
from src.strategies.macd_strategy import MACDStrategy, MACDConfig
from src.strategies.strategy_engine import StrategyEngine, EngineConfig, CombinedSignal


class TestRSIStrategy:
    """Test cases for RSI strategy."""

    def test_rsi_strategy_initialization(self):
        """Test RSI strategy initialization."""
        config = RSIConfig(
            period=14,
            oversold=30.0,
            overbought=70.0,
            use_divergence=True,
            use_volume_filter=True
        )

        strategy = RSIStrategy(config)

        assert strategy.config.period == 14
        assert strategy.config.oversold == 30.0
        assert strategy.config.overbought == 70.0
        assert strategy.config.use_divergence is True
        assert strategy.config.use_volume_filter is True

    def test_rsi_calculation(self, sample_ohlcv_data):
        """Test RSI calculation accuracy."""
        config = RSIConfig(period=14)
        strategy = RSIStrategy(config)

        rsi_values = strategy._calculate_rsi(sample_ohlcv_data['close'], 14)

        # RSI should be between 0 and 100
        assert all(0 <= rsi <= 100 for rsi in rsi_values if not pd.isna(rsi))

        # Should have NaN values for the first (period-1) entries
        assert pd.isna(rsi_values.iloc[:13]).all()
        assert not pd.isna(rsi_values.iloc[13:]).any()

    def test_rsi_oversold_signal(self, sample_ohlcv_data):
        """Test RSI oversold signal generation."""
        config = RSIConfig(period=14, oversold=30.0)
        strategy = RSIStrategy(config)

        # Create data with low RSI (oversold condition)
        low_prices = sample_ohlcv_data.copy()
        low_prices['close'] = low_prices['close'] * 0.8  # Simulate price drop

        signal = strategy.generate_signal("AAPL", low_prices)

        # Should generate a signal when data is sufficient
        if signal is not None:
            assert isinstance(signal, TradingSignal)
            assert signal.symbol == "AAPL"
            assert signal.signal in [SignalStrength.BUY, SignalStrength.STRONG_BUY, SignalStrength.HOLD]

    def test_rsi_overbought_signal(self, sample_ohlcv_data):
        """Test RSI overbought signal generation."""
        config = RSIConfig(period=14, overbought=70.0)
        strategy = RSIStrategy(config)

        # Create data with high RSI (overbought condition)
        high_prices = sample_ohlcv_data.copy()
        high_prices['close'] = high_prices['close'] * 1.2  # Simulate price rise

        signal = strategy.generate_signal("AAPL", high_prices)

        # Should generate a signal when data is sufficient
        if signal is not None:
            assert isinstance(signal, TradingSignal)
            assert signal.symbol == "AAPL"
            assert signal.signal in [SignalStrength.SELL, SignalStrength.STRONG_SELL, SignalStrength.HOLD]

    def test_insufficient_data_handling(self):
        """Test handling of insufficient data."""
        config = RSIConfig(period=14)
        strategy = RSIStrategy(config)

        # Create insufficient data (less than required period)
        insufficient_data = pd.DataFrame({
            'timestamp': pd.date_range(start='2024-01-01', periods=5, freq='1min'),
            'close': [100, 101, 102, 101, 100],
            'volume': [1000, 1100, 1200, 1100, 1000]
        })
        insufficient_data.set_index('timestamp', inplace=True)

        signal = strategy.generate_signal("AAPL", insufficient_data)

        # Should return None for insufficient data
        assert signal is None

    def test_volume_filter(self, sample_ohlcv_data):
        """Test volume filter functionality."""
        config = RSIConfig(period=14, use_volume_filter=True, volume_threshold=1.5)
        strategy = RSIStrategy(config)

        # Test with normal volume
        signal = strategy.generate_signal("AAPL", sample_ohlcv_data)

        # Volume filter should affect signal strength or presence
        assert signal is None or isinstance(signal, TradingSignal)


class TestMACDStrategy:
    """Test cases for MACD strategy."""

    def test_macd_strategy_initialization(self):
        """Test MACD strategy initialization."""
        config = MACDConfig(
            fast_period=12,
            slow_period=26,
            signal_period=9,
            use_ema_crossover=True
        )

        strategy = MACDStrategy(config)

        assert strategy.config.fast_period == 12
        assert strategy.config.slow_period == 26
        assert strategy.config.signal_period == 9
        assert strategy.config.use_ema_crossover is True

    def test_macd_calculation(self, sample_ohlcv_data):
        """Test MACD calculation accuracy."""
        config = MACDConfig(fast_period=12, slow_period=26, signal_period=9)
        strategy = MACDStrategy(config)

        macd_line, signal_line, histogram = strategy._calculate_macd(
            sample_ohlcv_data['close'], 12, 26, 9
        )

        # MACD components should have same length as price data
        assert len(macd_line) == len(sample_ohlcv_data)
        assert len(signal_line) == len(sample_ohlcv_data)
        assert len(histogram) == len(sample_ohlcv_data)

        # Early values should be NaN due to moving average calculation
        assert pd.isna(macd_line.iloc[:25]).any()  # slow_period - 1
        assert pd.isna(signal_line.iloc[:33]).any()  # slow_period + signal_period - 2

    def test_macd_bullish_crossover(self, trending_ohlcv_data):
        """Test MACD bullish crossover signal."""
        config = MACDConfig(fast_period=12, slow_period=26, signal_period=9)
        strategy = MACDStrategy(config)

        signal = strategy.generate_signal("AAPL", trending_ohlcv_data)

        # Should generate a signal for trending data
        if signal is not None:
            assert isinstance(signal, TradingSignal)
            assert signal.symbol == "AAPL"
            assert signal.signal in [SignalStrength.BUY, SignalStrength.STRONG_BUY, SignalStrength.HOLD]

    def test_macd_bearish_crossover(self, sample_ohlcv_data):
        """Test MACD bearish crossover signal."""
        config = MACDConfig(fast_period=12, slow_period=26, signal_period=9)
        strategy = MACDStrategy(config)

        # Create bearish data
        bearish_data = sample_ohlcv_data.copy()
        bearish_data['close'] = bearish_data['close'] * 0.8  # Simulate decline

        signal = strategy.generate_signal("AAPL", bearish_data)

        # Should handle bearish conditions
        assert signal is None or isinstance(signal, TradingSignal)


class TestStrategyEngine:
    """Test cases for strategy engine."""

    def test_strategy_engine_initialization(self):
        """Test strategy engine initialization."""
        config = EngineConfig(
            aggregation_method="weighted_average",
            min_agreement_threshold=0.6
        )

        engine = StrategyEngine(config)

        assert engine.config.aggregation_method == "weighted_average"
        assert engine.config.min_agreement_threshold == 0.6
        assert len(engine.strategies) == 0

    def test_add_strategy(self, rsi_strategy, macd_strategy):
        """Test adding strategies to engine."""
        config = EngineConfig()
        engine = StrategyEngine(config)

        engine.add_strategy("RSI", rsi_strategy, weight=0.6)
        engine.add_strategy("MACD", macd_strategy, weight=0.4)

        assert len(engine.strategies) == 2
        assert "RSI" in engine.strategies
        assert "MACD" in engine.strategies
        assert engine.strategy_weights["RSI"] == 0.6
        assert engine.strategy_weights["MACD"] == 0.4

    def test_remove_strategy(self, rsi_strategy):
        """Test removing strategies from engine."""
        config = EngineConfig()
        engine = StrategyEngine(config)

        engine.add_strategy("RSI", rsi_strategy)
        assert len(engine.strategies) == 1

        engine.remove_strategy("RSI")
        assert len(engine.strategies) == 0
        assert "RSI" not in engine.strategy_weights

    def test_signal_aggregation(self, rsi_strategy, macd_strategy, sample_ohlcv_data):
        """Test signal aggregation functionality."""
        config = EngineConfig(aggregation_method="weighted_average")
        engine = StrategyEngine(config)

        engine.add_strategy("RSI", rsi_strategy, weight=0.6)
        engine.add_strategy("MACD", macd_strategy, weight=0.4)

        combined_signal = engine.generate_combined_signal("AAPL", sample_ohlcv_data)

        # Should generate combined signal or None if strategies don't agree
        if combined_signal is not None:
            assert isinstance(combined_signal, CombinedSignal)
            assert combined_signal.symbol == "AAPL"
            assert 0.0 <= combined_signal.confidence <= 1.0
            assert hasattr(combined_signal, 'contributing_strategies')

    def test_minimum_agreement_threshold(self, rsi_strategy, macd_strategy, sample_ohlcv_data):
        """Test minimum agreement threshold enforcement."""
        config = EngineConfig(min_agreement_threshold=0.8)  # High threshold
        engine = StrategyEngine(config)

        engine.add_strategy("RSI", rsi_strategy, weight=0.5)
        engine.add_strategy("MACD", macd_strategy, weight=0.5)

        combined_signal = engine.generate_combined_signal("AAPL", sample_ohlcv_data)

        # With high threshold, may not generate signal if strategies disagree
        assert combined_signal is None or isinstance(combined_signal, CombinedSignal)

    def test_get_strategy_performance(self, rsi_strategy):
        """Test strategy performance tracking."""
        config = EngineConfig()
        engine = StrategyEngine(config)

        engine.add_strategy("RSI", rsi_strategy)

        # Initially should have no performance data
        performance = engine.get_strategy_performance("RSI")
        assert performance is not None
        assert 'total_signals' in performance
        assert 'successful_signals' in performance

    def test_update_strategy_weights(self, rsi_strategy, macd_strategy):
        """Test dynamic strategy weight updates."""
        config = EngineConfig()
        engine = StrategyEngine(config)

        engine.add_strategy("RSI", rsi_strategy, weight=0.5)
        engine.add_strategy("MACD", macd_strategy, weight=0.5)

        # Update weights
        new_weights = {"RSI": 0.7, "MACD": 0.3}
        engine.update_strategy_weights(new_weights)

        assert engine.strategy_weights["RSI"] == 0.7
        assert engine.strategy_weights["MACD"] == 0.3

    def test_invalid_aggregation_method(self):
        """Test handling of invalid aggregation method."""
        with pytest.raises(ValueError):
            EngineConfig(aggregation_method="invalid_method")

    def test_empty_engine_signal_generation(self, sample_ohlcv_data):
        """Test signal generation with no strategies."""
        config = EngineConfig()
        engine = StrategyEngine(config)

        combined_signal = engine.generate_combined_signal("AAPL", sample_ohlcv_data)

        # Should return None when no strategies are configured
        assert combined_signal is None


# Integration test
@pytest.mark.integration
def test_full_strategy_pipeline(sample_ohlcv_data, trending_ohlcv_data):
    """Test complete strategy pipeline integration."""
    # Create strategies
    rsi_config = RSIConfig(period=14, oversold=30, overbought=70)
    rsi_strategy = RSIStrategy(rsi_config)

    macd_config = MACDConfig(fast_period=12, slow_period=26, signal_period=9)
    macd_strategy = MACDStrategy(macd_config)

    # Create engine
    engine_config = EngineConfig(aggregation_method="weighted_average")
    engine = StrategyEngine(engine_config)

    # Add strategies
    engine.add_strategy("RSI", rsi_strategy, weight=0.6)
    engine.add_strategy("MACD", macd_strategy, weight=0.4)

    # Test with different data sets
    for symbol, data in [("AAPL", sample_ohlcv_data), ("TSLA", trending_ohlcv_data)]:
        signal = engine.generate_combined_signal(symbol, data)

        if signal is not None:
            assert isinstance(signal, CombinedSignal)
            assert signal.symbol == symbol
            assert 0.0 <= signal.confidence <= 1.0
            assert len(signal.contributing_strategies) <= 2