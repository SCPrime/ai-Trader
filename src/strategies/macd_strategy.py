"""
MACD (Moving Average Convergence Divergence) trading strategy implementation.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass
import ta
from ta.trend import MACD
from ta.trend import SMAIndicator, EMAIndicator
from ta.volume import VolumeSMAIndicator

from .rsi_strategy import SignalStrength, TradingSignal

logger = logging.getLogger(__name__)


@dataclass
class MACDConfig:
    """MACD strategy configuration."""

    fast_period: int = 12
    slow_period: int = 26
    signal_period: int = 9
    use_ema_crossover: bool = True
    ema_short: int = 20
    ema_long: int = 50
    use_volume_filter: bool = True
    min_volume_ratio: float = 1.5
    use_divergence: bool = True
    divergence_lookback: int = 20
    histogram_threshold: float = 0.001  # Minimum histogram value for signals


class MACDStrategy:
    """
    MACD-based trading strategy with crossover signals and divergence detection.

    Features:
    - MACD line and signal line crossovers
    - MACD histogram analysis
    - Bullish/bearish divergence detection
    - EMA trend confirmation
    - Volume filtering
    - Signal strength classification
    """

    def __init__(self, config: Optional[MACDConfig] = None):
        """
        Initialize MACD strategy.

        Args:
            config: Strategy configuration
        """
        self.config = config or MACDConfig()
        self.name = "MACD_Strategy"
        self._last_signals: Dict[str, TradingSignal] = {}

    def analyze(self, data: pd.DataFrame, symbol: str) -> Optional[TradingSignal]:
        """
        Analyze price data and generate MACD-based trading signals.

        Args:
            data: OHLCV DataFrame with columns: open, high, low, close, volume
            symbol: Stock symbol

        Returns:
            Trading signal or None
        """
        try:
            min_required_length = max(
                self.config.slow_period + self.config.signal_period,
                self.config.ema_long,
                self.config.divergence_lookback,
            )

            if len(data) < min_required_length:
                logger.warning(f"Insufficient data for {symbol}: {len(data)} bars")
                return None

            # Calculate MACD indicators
            indicators = self._calculate_indicators(data)

            # Get current values
            current_macd = indicators["macd"].iloc[-1]
            current_signal = indicators["macd_signal"].iloc[-1]
            current_histogram = indicators["macd_histogram"].iloc[-1]
            current_price = data["close"].iloc[-1]
            current_volume = data["volume"].iloc[-1]

            # Previous values for crossover detection
            prev_macd = indicators["macd"].iloc[-2]
            prev_signal = indicators["macd_signal"].iloc[-2]
            prev_histogram = indicators["macd_histogram"].iloc[-2]

            # Volume confirmation
            avg_volume = indicators["volume_sma"].iloc[-1]
            volume_confirmed = not self.config.use_volume_filter or (
                current_volume >= avg_volume * self.config.min_volume_ratio
            )

            # Trend confirmation
            trend = self._determine_trend(indicators, current_price)

            # Detect crossovers
            crossover_signal = self._detect_crossovers(
                current_macd,
                current_signal,
                prev_macd,
                prev_signal,
                current_histogram,
                prev_histogram,
            )

            # Detect divergence
            divergence_signal = None
            if (
                self.config.use_divergence
                and len(data) >= self.config.divergence_lookback
            ):
                divergence_signal = self._detect_divergence(
                    data["close"], indicators["macd"], self.config.divergence_lookback
                )

            # Generate signal
            signal_info = self._generate_signal(
                crossover_signal,
                trend,
                volume_confirmed,
                divergence_signal,
                current_histogram,
                current_macd,
                current_signal,
            )

            if signal_info is None:
                return None

            signal_strength, confidence, reason, position_multiplier = signal_info

            # Create trading signal
            trading_signal = TradingSignal(
                symbol=symbol,
                signal=signal_strength,
                price=current_price,
                confidence=confidence,
                timestamp=data.index[-1],
                indicators={
                    "macd": current_macd,
                    "macd_signal": current_signal,
                    "macd_histogram": current_histogram,
                    "ema_short": indicators["ema_short"].iloc[-1],
                    "ema_long": indicators["ema_long"].iloc[-1],
                    "volume_ratio": (
                        current_volume / avg_volume if avg_volume > 0 else 0
                    ),
                    "trend": trend,
                    "crossover": crossover_signal,
                },
                reason=reason,
                position_size_multiplier=position_multiplier,
            )

            # Store last signal
            self._last_signals[symbol] = trading_signal

            logger.info(
                f"MACD signal for {symbol}: {signal_strength.value} "
                f"(MACD: {current_macd:.4f}, Signal: {current_signal:.4f}, "
                f"Histogram: {current_histogram:.4f}, Confidence: {confidence:.2f})"
            )

            return trading_signal

        except Exception as e:
            logger.error(f"Error analyzing {symbol} with MACD strategy: {e}")
            return None

    def _calculate_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate MACD and supporting indicators.

        Args:
            data: OHLCV DataFrame

        Returns:
            DataFrame with calculated indicators
        """
        indicators = pd.DataFrame(index=data.index)

        # MACD calculation
        macd_indicator = MACD(
            close=data["close"],
            window_fast=self.config.fast_period,
            window_slow=self.config.slow_period,
            window_sign=self.config.signal_period,
            fillna=True,
        )

        indicators["macd"] = macd_indicator.macd()
        indicators["macd_signal"] = macd_indicator.macd_signal()
        indicators["macd_histogram"] = macd_indicator.macd_diff()

        # EMA indicators for trend confirmation
        if self.config.use_ema_crossover:
            ema_short_indicator = EMAIndicator(
                close=data["close"], window=self.config.ema_short, fillna=True
            )
            indicators["ema_short"] = ema_short_indicator.ema_indicator()

            ema_long_indicator = EMAIndicator(
                close=data["close"], window=self.config.ema_long, fillna=True
            )
            indicators["ema_long"] = ema_long_indicator.ema_indicator()

        # Volume SMA for volume filtering
        if self.config.use_volume_filter:
            volume_sma_indicator = VolumeSMAIndicator(
                close=data["close"], volume=data["volume"], window=20, fillna=True
            )
            indicators["volume_sma"] = volume_sma_indicator.volume_sma()

        return indicators

    def _determine_trend(self, indicators: pd.DataFrame, current_price: float) -> str:
        """
        Determine market trend using EMA crossover.

        Args:
            indicators: DataFrame with calculated indicators
            current_price: Current price

        Returns:
            Trend direction: 'bullish', 'bearish', or 'neutral'
        """
        if not self.config.use_ema_crossover:
            return "neutral"

        ema_short = indicators["ema_short"].iloc[-1]
        ema_long = indicators["ema_long"].iloc[-1]

        if ema_short > ema_long and current_price > ema_short:
            return "bullish"
        elif ema_short < ema_long and current_price < ema_short:
            return "bearish"
        else:
            return "neutral"

    def _detect_crossovers(
        self,
        current_macd: float,
        current_signal: float,
        prev_macd: float,
        prev_signal: float,
        current_histogram: float,
        prev_histogram: float,
    ) -> Optional[str]:
        """
        Detect MACD line and signal line crossovers.

        Args:
            current_macd: Current MACD line value
            current_signal: Current signal line value
            prev_macd: Previous MACD line value
            prev_signal: Previous signal line value
            current_histogram: Current histogram value
            prev_histogram: Previous histogram value

        Returns:
            Crossover type: 'bullish_crossover', 'bearish_crossover', or None
        """
        # MACD line crossing above signal line (bullish)
        if (
            prev_macd <= prev_signal
            and current_macd > current_signal
            and abs(current_histogram) > self.config.histogram_threshold
        ):
            return "bullish_crossover"

        # MACD line crossing below signal line (bearish)
        elif (
            prev_macd >= prev_signal
            and current_macd < current_signal
            and abs(current_histogram) > self.config.histogram_threshold
        ):
            return "bearish_crossover"

        # Histogram momentum signals
        elif (
            prev_histogram < 0
            and current_histogram > 0
            and current_histogram > self.config.histogram_threshold
        ):
            return "histogram_bullish"

        elif (
            prev_histogram > 0
            and current_histogram < 0
            and current_histogram < -self.config.histogram_threshold
        ):
            return "histogram_bearish"

        return None

    def _detect_divergence(
        self, prices: pd.Series, macd: pd.Series, lookback: int
    ) -> Optional[str]:
        """
        Detect bullish/bearish divergence between price and MACD.

        Args:
            prices: Price series
            macd: MACD series
            lookback: Lookback period

        Returns:
            Divergence type: 'bullish', 'bearish', or None
        """
        if len(prices) < lookback or len(macd) < lookback:
            return None

        try:
            # Get recent data
            recent_prices = prices.iloc[-lookback:]
            recent_macd = macd.iloc[-lookback:]

            # Find local extremes
            price_highs = self._find_local_extremes(recent_prices, "high", window=3)
            price_lows = self._find_local_extremes(recent_prices, "low", window=3)
            macd_highs = self._find_local_extremes(recent_macd, "high", window=3)
            macd_lows = self._find_local_extremes(recent_macd, "low", window=3)

            # Check for bullish divergence (price makes lower lows, MACD makes higher lows)
            if (
                len(price_lows) >= 2
                and len(macd_lows) >= 2
                and price_lows[-1] < price_lows[-2]
                and macd_lows[-1] > macd_lows[-2]
            ):
                return "bullish"

            # Check for bearish divergence (price makes higher highs, MACD makes lower highs)
            if (
                len(price_highs) >= 2
                and len(macd_highs) >= 2
                and price_highs[-1] > price_highs[-2]
                and macd_highs[-1] < macd_highs[-2]
            ):
                return "bearish"

            return None

        except Exception as e:
            logger.error(f"Error detecting divergence: {e}")
            return None

    def _find_local_extremes(
        self, series: pd.Series, extreme_type: str, window: int = 3
    ) -> List[float]:
        """
        Find local extremes in a series.

        Args:
            series: Data series
            extreme_type: 'high' or 'low'
            window: Window size for local extreme detection

        Returns:
            List of extreme values
        """
        extremes = []

        if len(series) < window * 2 + 1:
            return extremes

        for i in range(window, len(series) - window):
            is_extreme = True

            if extreme_type == "high":
                # Check if current point is higher than all points in window
                for j in range(i - window, i + window + 1):
                    if j != i and series.iloc[i] <= series.iloc[j]:
                        is_extreme = False
                        break
            else:  # low
                # Check if current point is lower than all points in window
                for j in range(i - window, i + window + 1):
                    if j != i and series.iloc[i] >= series.iloc[j]:
                        is_extreme = False
                        break

            if is_extreme:
                extremes.append(series.iloc[i])

        return extremes

    def _generate_signal(
        self,
        crossover_signal: Optional[str],
        trend: str,
        volume_confirmed: bool,
        divergence: Optional[str],
        current_histogram: float,
        current_macd: float,
        current_signal: float,
    ) -> Optional[Tuple[SignalStrength, float, str, float]]:
        """
        Generate trading signal based on MACD analysis.

        Args:
            crossover_signal: Type of crossover detected
            trend: Market trend
            volume_confirmed: Whether volume confirms the signal
            divergence: Divergence type if any
            current_histogram: Current histogram value
            current_macd: Current MACD value
            current_signal: Current signal value

        Returns:
            Tuple of (signal_strength, confidence, reason, position_multiplier) or None
        """
        reasons = []
        confidence = 0.5
        position_multiplier = 1.0

        # Bullish signals
        if crossover_signal in ["bullish_crossover", "histogram_bullish"]:
            base_strength = SignalStrength.BUY
            confidence = 0.6
            position_multiplier = 1.0

            if crossover_signal == "bullish_crossover":
                reasons.append("MACD bullish crossover")
            else:
                reasons.append("MACD histogram turning positive")

            # Enhance signal strength with confirmations
            confirmations = 0

            if trend == "bullish":
                confirmations += 1
                confidence += 0.15
                reasons.append("bullish trend confirmation")

            if volume_confirmed:
                confirmations += 1
                confidence += 0.1
                reasons.append("volume confirmation")

            if divergence == "bullish":
                confirmations += 2
                confidence += 0.2
                position_multiplier = 1.3
                reasons.append("bullish divergence")

            if (
                current_macd > 0
                and current_histogram > self.config.histogram_threshold * 2
            ):
                confirmations += 1
                confidence += 0.1
                reasons.append("strong momentum")

            # Determine final signal strength
            if confirmations >= 3:
                base_strength = SignalStrength.STRONG_BUY
                position_multiplier = max(position_multiplier, 1.5)
            elif confirmations >= 2:
                position_multiplier = max(position_multiplier, 1.2)

            return (
                base_strength,
                min(confidence, 0.95),
                "; ".join(reasons),
                position_multiplier,
            )

        # Bearish signals
        elif crossover_signal in ["bearish_crossover", "histogram_bearish"]:
            base_strength = SignalStrength.SELL
            confidence = 0.6
            position_multiplier = 1.0

            if crossover_signal == "bearish_crossover":
                reasons.append("MACD bearish crossover")
            else:
                reasons.append("MACD histogram turning negative")

            # Enhance signal strength with confirmations
            confirmations = 0

            if trend == "bearish":
                confirmations += 1
                confidence += 0.15
                reasons.append("bearish trend confirmation")

            if volume_confirmed:
                confirmations += 1
                confidence += 0.1
                reasons.append("volume confirmation")

            if divergence == "bearish":
                confirmations += 2
                confidence += 0.2
                position_multiplier = 1.3
                reasons.append("bearish divergence")

            if (
                current_macd < 0
                and current_histogram < -self.config.histogram_threshold * 2
            ):
                confirmations += 1
                confidence += 0.1
                reasons.append("strong downward momentum")

            # Determine final signal strength
            if confirmations >= 3:
                base_strength = SignalStrength.STRONG_SELL
                position_multiplier = max(position_multiplier, 1.5)
            elif confirmations >= 2:
                position_multiplier = max(position_multiplier, 1.2)

            return (
                base_strength,
                min(confidence, 0.95),
                "; ".join(reasons),
                position_multiplier,
            )

        return None

    def should_exit_position(
        self, data: pd.DataFrame, entry_signal: TradingSignal
    ) -> bool:
        """
        Determine if current position should be exited based on MACD.

        Args:
            data: Current OHLCV data
            entry_signal: Original entry signal

        Returns:
            True if position should be exited
        """
        if len(data) < max(self.config.slow_period + self.config.signal_period, 20):
            return False

        try:
            # Calculate current MACD
            indicators = self._calculate_indicators(data)
            current_macd = indicators["macd"].iloc[-1]
            current_signal = indicators["macd_signal"].iloc[-1]
            current_histogram = indicators["macd_histogram"].iloc[-1]

            # Exit long positions
            if entry_signal.signal in [SignalStrength.BUY, SignalStrength.STRONG_BUY]:
                # Exit on bearish crossover or negative momentum
                if current_macd < current_signal and current_histogram < 0:
                    logger.info(f"Exit long signal: MACD bearish crossover")
                    return True

            # Exit short positions
            elif entry_signal.signal in [
                SignalStrength.SELL,
                SignalStrength.STRONG_SELL,
            ]:
                # Exit on bullish crossover or positive momentum
                if current_macd > current_signal and current_histogram > 0:
                    logger.info(f"Exit short signal: MACD bullish crossover")
                    return True

            return False

        except Exception as e:
            logger.error(f"Error checking MACD exit condition: {e}")
            return False

    def get_position_size(self, base_size: float, signal: TradingSignal) -> float:
        """
        Calculate position size based on MACD signal strength.

        Args:
            base_size: Base position size
            signal: Trading signal

        Returns:
            Adjusted position size
        """
        return base_size * signal.position_size_multiplier * signal.confidence

    def get_strategy_info(self) -> Dict[str, Any]:
        """
        Get strategy information and parameters.

        Returns:
            Strategy information dictionary
        """
        return {
            "name": self.name,
            "type": "Technical Momentum - MACD",
            "timeframes": ["5Min", "15Min", "30Min", "1Hour", "4Hour", "1Day"],
            "parameters": {
                "fast_period": self.config.fast_period,
                "slow_period": self.config.slow_period,
                "signal_period": self.config.signal_period,
                "use_ema_crossover": self.config.use_ema_crossover,
                "ema_short": self.config.ema_short,
                "ema_long": self.config.ema_long,
                "use_volume_filter": self.config.use_volume_filter,
                "use_divergence": self.config.use_divergence,
                "histogram_threshold": self.config.histogram_threshold,
            },
            "signals": [s.value for s in SignalStrength],
            "description": "MACD crossover strategy with divergence detection and trend confirmation",
        }

    def optimize_parameters(
        self, historical_data: Dict[str, pd.DataFrame]
    ) -> Dict[str, Any]:
        """
        Optimize strategy parameters using historical data.

        Args:
            historical_data: Dictionary of symbol -> OHLCV DataFrame

        Returns:
            Optimized parameters
        """
        # This is a placeholder for parameter optimization
        # In production, this would use techniques like:
        # - Grid search over fast/slow/signal periods
        # - Genetic algorithms for multi-parameter optimization
        # - Walk-forward analysis for robust optimization

        best_params = {
            "fast_period": self.config.fast_period,
            "slow_period": self.config.slow_period,
            "signal_period": self.config.signal_period,
            "histogram_threshold": self.config.histogram_threshold,
        }

        logger.info("MACD parameter optimization completed")
        return best_params

    def get_performance_metrics(
        self, signals: List[TradingSignal], prices: pd.DataFrame
    ) -> Dict[str, float]:
        """
        Calculate strategy performance metrics.

        Args:
            signals: List of generated signals
            prices: Price data

        Returns:
            Performance metrics dictionary
        """
        if not signals or prices.empty:
            return {}

        try:
            # Calculate signal accuracy and performance
            total_signals = len(signals)
            buy_signals = len(
                [
                    s
                    for s in signals
                    if s.signal in [SignalStrength.BUY, SignalStrength.STRONG_BUY]
                ]
            )
            sell_signals = len(
                [
                    s
                    for s in signals
                    if s.signal in [SignalStrength.SELL, SignalStrength.STRONG_SELL]
                ]
            )

            avg_confidence = np.mean([s.confidence for s in signals])

            return {
                "total_signals": total_signals,
                "buy_signals": buy_signals,
                "sell_signals": sell_signals,
                "buy_ratio": buy_signals / total_signals if total_signals > 0 else 0,
                "avg_confidence": avg_confidence,
                "strategy_name": self.name,
            }

        except Exception as e:
            logger.error(f"Error calculating performance metrics: {e}")
            return {}
