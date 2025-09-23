"""
Strategy engine for orchestrating multiple trading strategies.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Type, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor

from .rsi_strategy import RSIStrategy, RSIConfig, TradingSignal, SignalStrength
from .macd_strategy import MACDStrategy, MACDConfig

logger = logging.getLogger(__name__)


class StrategyType(Enum):
    """Strategy type enumeration."""

    RSI = "rsi"
    MACD = "macd"
    COMBINED = "combined"


@dataclass
class StrategyWeight:
    """Strategy weight configuration."""

    strategy_type: StrategyType
    weight: float
    enabled: bool = True
    min_confidence: float = 0.5


@dataclass
class EngineConfig:
    """Strategy engine configuration."""

    strategies: List[StrategyWeight] = field(default_factory=list)
    aggregation_method: str = (
        "weighted_average"  # weighted_average, consensus, strongest
    )
    min_agreement_threshold: float = 0.6  # For consensus method
    signal_timeout_minutes: int = 30  # Signal validity timeout
    max_signals_per_symbol: int = 1  # Maximum signals per symbol per period
    enable_signal_filtering: bool = True
    volume_filter_enabled: bool = True
    trend_filter_enabled: bool = True


@dataclass
class CombinedSignal:
    """Combined signal from multiple strategies."""

    symbol: str
    final_signal: SignalStrength
    confidence: float
    timestamp: datetime
    price: float
    contributing_strategies: Dict[str, TradingSignal]
    aggregation_method: str
    reason: str
    position_size_multiplier: float = 1.0


class StrategyEngine:
    """
    Strategy engine that orchestrates multiple trading strategies and combines their signals.
    """

    def __init__(self, config: Optional[EngineConfig] = None):
        """
        Initialize strategy engine.

        Args:
            config: Engine configuration
        """
        self.config = config or EngineConfig()
        self.strategies: Dict[StrategyType, Any] = {}
        self.recent_signals: Dict[str, List[CombinedSignal]] = {}
        self.performance_stats: Dict[str, Dict[str, float]] = {}

        # Thread pool for parallel strategy execution
        self.executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="strategy")

        # Initialize default strategies if none configured
        if not self.config.strategies:
            self._initialize_default_strategies()

        # Initialize strategies
        self._initialize_strategies()

    def _initialize_default_strategies(self):
        """Initialize default strategy configuration."""
        self.config.strategies = [
            StrategyWeight(
                StrategyType.RSI, weight=0.4, enabled=True, min_confidence=0.6
            ),
            StrategyWeight(
                StrategyType.MACD, weight=0.6, enabled=True, min_confidence=0.6
            ),
        ]

    def _initialize_strategies(self):
        """Initialize strategy instances."""
        try:
            for strategy_weight in self.config.strategies:
                if not strategy_weight.enabled:
                    continue

                if strategy_weight.strategy_type == StrategyType.RSI:
                    self.strategies[StrategyType.RSI] = RSIStrategy()
                elif strategy_weight.strategy_type == StrategyType.MACD:
                    self.strategies[StrategyType.MACD] = MACDStrategy()

            logger.info(f"Initialized {len(self.strategies)} trading strategies")

        except Exception as e:
            logger.error(f"Error initializing strategies: {e}")
            raise

    async def analyze_symbol(
        self, symbol: str, data: pd.DataFrame
    ) -> Optional[CombinedSignal]:
        """
        Analyze symbol using all enabled strategies and combine signals.

        Args:
            symbol: Stock symbol
            data: OHLCV DataFrame

        Returns:
            Combined trading signal or None
        """
        try:
            if data.empty:
                logger.warning(f"No data provided for {symbol}")
                return None

            # Check for recent signals to avoid duplicates
            if self._has_recent_signal(symbol):
                logger.debug(f"Recent signal exists for {symbol}, skipping")
                return None

            # Run strategies in parallel
            strategy_signals = await self._run_strategies_parallel(symbol, data)

            # Filter valid signals
            valid_signals = self._filter_signals(strategy_signals)

            if not valid_signals:
                logger.debug(f"No valid signals generated for {symbol}")
                return None

            # Combine signals
            combined_signal = self._combine_signals(
                symbol, valid_signals, data["close"].iloc[-1]
            )

            if combined_signal:
                # Store signal
                self._store_signal(symbol, combined_signal)

                logger.info(
                    f"Combined signal for {symbol}: {combined_signal.final_signal.value} "
                    f"(confidence: {combined_signal.confidence:.2f}, "
                    f"strategies: {len(combined_signal.contributing_strategies)})"
                )

            return combined_signal

        except Exception as e:
            logger.error(f"Error analyzing {symbol}: {e}")
            return None

    async def _run_strategies_parallel(
        self, symbol: str, data: pd.DataFrame
    ) -> Dict[StrategyType, Optional[TradingSignal]]:
        """
        Run all strategies in parallel for a symbol.

        Args:
            symbol: Stock symbol
            data: OHLCV DataFrame

        Returns:
            Dictionary of strategy results
        """
        tasks = []
        strategy_types = []

        for strategy_type, strategy in self.strategies.items():
            task = asyncio.get_event_loop().run_in_executor(
                self.executor, strategy.analyze, data.copy(), symbol
            )
            tasks.append(task)
            strategy_types.append(strategy_type)

        # Execute all strategies in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect results
        strategy_signals = {}
        for i, result in enumerate(results):
            strategy_type = strategy_types[i]
            if isinstance(result, Exception):
                logger.error(
                    f"Error in {strategy_type.value} strategy for {symbol}: {result}"
                )
                strategy_signals[strategy_type] = None
            else:
                strategy_signals[strategy_type] = result

        return strategy_signals

    def _filter_signals(
        self, strategy_signals: Dict[StrategyType, Optional[TradingSignal]]
    ) -> Dict[StrategyType, TradingSignal]:
        """
        Filter valid signals based on confidence and other criteria.

        Args:
            strategy_signals: Raw strategy signals

        Returns:
            Filtered valid signals
        """
        valid_signals = {}

        for strategy_weight in self.config.strategies:
            if not strategy_weight.enabled:
                continue

            strategy_type = strategy_weight.strategy_type
            signal = strategy_signals.get(strategy_type)

            if signal is None:
                continue

            # Check minimum confidence
            if signal.confidence < strategy_weight.min_confidence:
                logger.debug(
                    f"Signal from {strategy_type.value} filtered due to low confidence: "
                    f"{signal.confidence:.2f} < {strategy_weight.min_confidence:.2f}"
                )
                continue

            # Additional filtering
            if self.config.enable_signal_filtering:
                if not self._passes_signal_filters(signal):
                    continue

            valid_signals[strategy_type] = signal

        return valid_signals

    def _passes_signal_filters(self, signal: TradingSignal) -> bool:
        """
        Apply additional signal filters.

        Args:
            signal: Trading signal to filter

        Returns:
            True if signal passes filters
        """
        try:
            # Volume filter
            if self.config.volume_filter_enabled:
                volume_ratio = signal.indicators.get("volume_ratio", 0)
                if volume_ratio < 1.0:  # Below average volume
                    logger.debug(
                        f"Signal filtered due to low volume: {volume_ratio:.2f}"
                    )
                    return False

            # Trend filter (require some trend alignment for stronger signals)
            if self.config.trend_filter_enabled:
                trend = signal.indicators.get("trend", "neutral")
                if (
                    signal.signal
                    in [SignalStrength.STRONG_BUY, SignalStrength.STRONG_SELL]
                    and trend == "neutral"
                ):
                    logger.debug(f"Strong signal filtered due to neutral trend")
                    return False

            return True

        except Exception as e:
            logger.error(f"Error in signal filtering: {e}")
            return True  # Default to allowing signal on error

    def _combine_signals(
        self,
        symbol: str,
        valid_signals: Dict[StrategyType, TradingSignal],
        current_price: float,
    ) -> Optional[CombinedSignal]:
        """
        Combine multiple strategy signals into a single signal.

        Args:
            symbol: Stock symbol
            valid_signals: Valid signals from strategies
            current_price: Current stock price

        Returns:
            Combined signal or None
        """
        if not valid_signals:
            return None

        try:
            if self.config.aggregation_method == "weighted_average":
                return self._weighted_average_aggregation(
                    symbol, valid_signals, current_price
                )
            elif self.config.aggregation_method == "consensus":
                return self._consensus_aggregation(symbol, valid_signals, current_price)
            elif self.config.aggregation_method == "strongest":
                return self._strongest_signal_aggregation(
                    symbol, valid_signals, current_price
                )
            else:
                logger.error(
                    f"Unknown aggregation method: {self.config.aggregation_method}"
                )
                return None

        except Exception as e:
            logger.error(f"Error combining signals for {symbol}: {e}")
            return None

    def _weighted_average_aggregation(
        self,
        symbol: str,
        valid_signals: Dict[StrategyType, TradingSignal],
        current_price: float,
    ) -> Optional[CombinedSignal]:
        """Combine signals using weighted average."""
        # Map signal strengths to numeric values
        signal_values = {
            SignalStrength.STRONG_SELL: -2,
            SignalStrength.SELL: -1,
            SignalStrength.NEUTRAL: 0,
            SignalStrength.BUY: 1,
            SignalStrength.STRONG_BUY: 2,
        }

        value_to_signal = {v: k for k, v in signal_values.items()}

        total_weighted_value = 0
        total_weight = 0
        total_confidence = 0
        total_position_multiplier = 0
        reasons = []

        # Get strategy weights
        strategy_weights = {
            sw.strategy_type: sw.weight for sw in self.config.strategies if sw.enabled
        }

        for strategy_type, signal in valid_signals.items():
            weight = strategy_weights.get(strategy_type, 1.0)
            signal_value = signal_values.get(signal.signal, 0)

            # Weight by both configured weight and signal confidence
            effective_weight = weight * signal.confidence

            total_weighted_value += signal_value * effective_weight
            total_weight += effective_weight
            total_confidence += signal.confidence * weight
            total_position_multiplier += signal.position_size_multiplier * weight

            reasons.append(
                f"{strategy_type.value}({signal.signal.value}, {signal.confidence:.2f})"
            )

        if total_weight == 0:
            return None

        # Calculate final values
        avg_signal_value = total_weighted_value / total_weight
        avg_confidence = total_confidence / sum(strategy_weights.values())
        avg_position_multiplier = total_position_multiplier / sum(
            strategy_weights.values()
        )

        # Round to nearest signal strength
        final_signal_value = round(avg_signal_value)
        final_signal = value_to_signal.get(final_signal_value, SignalStrength.NEUTRAL)

        # Require minimum threshold for non-neutral signals
        if abs(avg_signal_value) < 0.5:
            final_signal = SignalStrength.NEUTRAL

        return CombinedSignal(
            symbol=symbol,
            final_signal=final_signal,
            confidence=avg_confidence,
            timestamp=datetime.now(),
            price=current_price,
            contributing_strategies={k.value: v for k, v in valid_signals.items()},
            aggregation_method="weighted_average",
            reason=f"Weighted average of: {'; '.join(reasons)}",
            position_size_multiplier=avg_position_multiplier,
        )

    def _consensus_aggregation(
        self,
        symbol: str,
        valid_signals: Dict[StrategyType, TradingSignal],
        current_price: float,
    ) -> Optional[CombinedSignal]:
        """Combine signals using consensus method."""
        # Count signal types
        signal_counts = {}
        total_confidence = 0
        total_position_multiplier = 0
        reasons = []

        for strategy_type, signal in valid_signals.items():
            signal_type = signal.signal
            if signal_type not in signal_counts:
                signal_counts[signal_type] = 0

            signal_counts[signal_type] += signal.confidence  # Weight by confidence
            total_confidence += signal.confidence
            total_position_multiplier += signal.position_size_multiplier
            reasons.append(f"{strategy_type.value}({signal.signal.value})")

        if not signal_counts:
            return None

        # Find consensus signal
        max_weighted_count = max(signal_counts.values())
        consensus_signals = [
            signal
            for signal, count in signal_counts.items()
            if count == max_weighted_count
        ]

        # Require clear consensus (above threshold)
        agreement_ratio = max_weighted_count / total_confidence
        if agreement_ratio < self.config.min_agreement_threshold:
            final_signal = SignalStrength.NEUTRAL
            reasons.append(f"no consensus (agreement: {agreement_ratio:.2f})")
        else:
            final_signal = consensus_signals[0]  # Take the first if multiple

        avg_confidence = total_confidence / len(valid_signals)
        avg_position_multiplier = total_position_multiplier / len(valid_signals)

        return CombinedSignal(
            symbol=symbol,
            final_signal=final_signal,
            confidence=avg_confidence,
            timestamp=datetime.now(),
            price=current_price,
            contributing_strategies={k.value: v for k, v in valid_signals.items()},
            aggregation_method="consensus",
            reason=f"Consensus from: {'; '.join(reasons)}",
            position_size_multiplier=avg_position_multiplier,
        )

    def _strongest_signal_aggregation(
        self,
        symbol: str,
        valid_signals: Dict[StrategyType, TradingSignal],
        current_price: float,
    ) -> Optional[CombinedSignal]:
        """Take the strongest signal (highest confidence)."""
        if not valid_signals:
            return None

        # Find signal with highest confidence
        best_signal = None
        best_confidence = 0
        best_strategy = None

        for strategy_type, signal in valid_signals.items():
            if signal.confidence > best_confidence:
                best_confidence = signal.confidence
                best_signal = signal
                best_strategy = strategy_type

        if best_signal is None:
            return None

        reasons = [
            f"strongest: {best_strategy.value}({best_signal.signal.value}, {best_confidence:.2f})"
        ]

        return CombinedSignal(
            symbol=symbol,
            final_signal=best_signal.signal,
            confidence=best_signal.confidence,
            timestamp=datetime.now(),
            price=current_price,
            contributing_strategies={k.value: v for k, v in valid_signals.items()},
            aggregation_method="strongest",
            reason=f"Strongest signal: {'; '.join(reasons)}",
            position_size_multiplier=best_signal.position_size_multiplier,
        )

    def _has_recent_signal(self, symbol: str) -> bool:
        """Check if symbol has recent signal within timeout period."""
        if symbol not in self.recent_signals:
            return False

        cutoff_time = datetime.now() - timedelta(
            minutes=self.config.signal_timeout_minutes
        )
        recent_signals = [
            s for s in self.recent_signals[symbol] if s.timestamp > cutoff_time
        ]

        # Update recent signals list
        self.recent_signals[symbol] = recent_signals

        return len(recent_signals) >= self.config.max_signals_per_symbol

    def _store_signal(self, symbol: str, signal: CombinedSignal):
        """Store signal in recent signals cache."""
        if symbol not in self.recent_signals:
            self.recent_signals[symbol] = []

        self.recent_signals[symbol].append(signal)

        # Keep only recent signals
        cutoff_time = datetime.now() - timedelta(
            minutes=self.config.signal_timeout_minutes * 2
        )
        self.recent_signals[symbol] = [
            s for s in self.recent_signals[symbol] if s.timestamp > cutoff_time
        ]

    def get_recent_signals(
        self, symbol: Optional[str] = None, hours: int = 24
    ) -> List[CombinedSignal]:
        """
        Get recent signals for analysis.

        Args:
            symbol: Optional symbol filter
            hours: Hours to look back

        Returns:
            List of recent signals
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)
        signals = []

        if symbol:
            # Get signals for specific symbol
            if symbol in self.recent_signals:
                signals.extend(
                    [
                        s
                        for s in self.recent_signals[symbol]
                        if s.timestamp > cutoff_time
                    ]
                )
        else:
            # Get signals for all symbols
            for symbol_signals in self.recent_signals.values():
                signals.extend([s for s in symbol_signals if s.timestamp > cutoff_time])

        return sorted(signals, key=lambda x: x.timestamp, reverse=True)

    def get_strategy_performance(self) -> Dict[str, Dict[str, float]]:
        """Get performance statistics for each strategy."""
        performance = {}

        for strategy_type, strategy in self.strategies.items():
            try:
                if hasattr(strategy, "get_performance_metrics"):
                    # This would require historical signal tracking
                    strategy_performance = {
                        "total_signals": 0,
                        "avg_confidence": 0.0,
                        "strategy_type": strategy_type.value,
                    }
                else:
                    strategy_performance = {
                        "strategy_type": strategy_type.value,
                        "status": "active",
                    }

                performance[strategy_type.value] = strategy_performance

            except Exception as e:
                logger.error(
                    f"Error getting performance for {strategy_type.value}: {e}"
                )
                performance[strategy_type.value] = {"error": str(e)}

        return performance

    def get_engine_stats(self) -> Dict[str, Any]:
        """Get engine statistics and status."""
        total_signals = sum(len(signals) for signals in self.recent_signals.values())

        # Count signals by type
        signal_counts = {}
        for signals in self.recent_signals.values():
            for signal in signals:
                signal_type = signal.final_signal.value
                signal_counts[signal_type] = signal_counts.get(signal_type, 0) + 1

        return {
            "active_strategies": len(self.strategies),
            "total_recent_signals": total_signals,
            "symbols_with_signals": len(self.recent_signals),
            "signal_distribution": signal_counts,
            "aggregation_method": self.config.aggregation_method,
            "min_agreement_threshold": self.config.min_agreement_threshold,
            "signal_timeout_minutes": self.config.signal_timeout_minutes,
        }

    def update_strategy_weights(self, new_weights: Dict[str, float]):
        """
        Update strategy weights dynamically.

        Args:
            new_weights: Dictionary of strategy_name -> weight
        """
        try:
            for strategy_weight in self.config.strategies:
                strategy_name = strategy_weight.strategy_type.value
                if strategy_name in new_weights:
                    old_weight = strategy_weight.weight
                    strategy_weight.weight = new_weights[strategy_name]
                    logger.info(
                        f"Updated {strategy_name} weight: {old_weight} -> {strategy_weight.weight}"
                    )

            logger.info("Strategy weights updated successfully")

        except Exception as e:
            logger.error(f"Error updating strategy weights: {e}")

    def add_strategy(
        self, strategy_type: StrategyType, weight: float, min_confidence: float = 0.5
    ):
        """
        Add a new strategy to the engine.

        Args:
            strategy_type: Type of strategy to add
            weight: Strategy weight
            min_confidence: Minimum confidence threshold
        """
        try:
            # Check if strategy already exists
            if strategy_type in self.strategies:
                logger.warning(f"Strategy {strategy_type.value} already exists")
                return

            # Add to configuration
            strategy_weight = StrategyWeight(
                strategy_type=strategy_type,
                weight=weight,
                min_confidence=min_confidence,
                enabled=True,
            )
            self.config.strategies.append(strategy_weight)

            # Initialize strategy
            if strategy_type == StrategyType.RSI:
                self.strategies[strategy_type] = RSIStrategy()
            elif strategy_type == StrategyType.MACD:
                self.strategies[strategy_type] = MACDStrategy()

            logger.info(f"Added strategy: {strategy_type.value}")

        except Exception as e:
            logger.error(f"Error adding strategy {strategy_type.value}: {e}")

    def remove_strategy(self, strategy_type: StrategyType):
        """Remove a strategy from the engine."""
        try:
            # Remove from strategies
            if strategy_type in self.strategies:
                del self.strategies[strategy_type]

            # Remove from configuration
            self.config.strategies = [
                sw for sw in self.config.strategies if sw.strategy_type != strategy_type
            ]

            logger.info(f"Removed strategy: {strategy_type.value}")

        except Exception as e:
            logger.error(f"Error removing strategy {strategy_type.value}: {e}")

    def close(self):
        """Close strategy engine and cleanup resources."""
        try:
            self.executor.shutdown(wait=True)
            self.recent_signals.clear()
            logger.info("Strategy engine closed")
        except Exception as e:
            logger.error(f"Error closing strategy engine: {e}")


# Utility functions
def create_default_engine() -> StrategyEngine:
    """Create strategy engine with default configuration."""
    config = EngineConfig(
        strategies=[
            StrategyWeight(
                StrategyType.RSI, weight=0.4, enabled=True, min_confidence=0.6
            ),
            StrategyWeight(
                StrategyType.MACD, weight=0.6, enabled=True, min_confidence=0.6
            ),
        ],
        aggregation_method="weighted_average",
        min_agreement_threshold=0.6,
        signal_timeout_minutes=30,
    )
    return StrategyEngine(config)


def create_consensus_engine() -> StrategyEngine:
    """Create strategy engine with consensus-based aggregation."""
    config = EngineConfig(
        strategies=[
            StrategyWeight(
                StrategyType.RSI, weight=1.0, enabled=True, min_confidence=0.7
            ),
            StrategyWeight(
                StrategyType.MACD, weight=1.0, enabled=True, min_confidence=0.7
            ),
        ],
        aggregation_method="consensus",
        min_agreement_threshold=0.8,
        signal_timeout_minutes=45,
    )
    return StrategyEngine(config)
