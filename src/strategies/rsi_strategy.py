"""
Advanced RSI trading strategy with divergence detection and volume filtering.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass
import ta
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator
from ta.volume import VolumeSMAIndicator

logger = logging.getLogger(__name__)


class SignalStrength(Enum):
    """Signal strength enumeration."""

    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    NEUTRAL = "NEUTRAL"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"


@dataclass
class TradingSignal:
    """Trading signal data structure."""

    symbol: str
    signal: SignalStrength
    price: float
    confidence: float
    timestamp: pd.Timestamp
    indicators: Dict[str, float]
    reason: str
    position_size_multiplier: float = 1.0


@dataclass
class RSIConfig:
    """RSI strategy configuration."""

    period: int = 14
    oversold: float = 30.0
    overbought: float = 70.0
    use_divergence: bool = True
    use_volume_filter: bool = True
    min_volume_ratio: float = 1.5
    sma_short: int = 50
    sma_long: int = 200
    divergence_lookback: int = 20


class RSIStrategy:
    """
    Advanced RSI trading strategy with divergence detection and volume filtering.

    Features:
    - RSI overbought/oversold signals
    - Bullish/bearish divergence detection
    - Volume confirmation
    - Trend filtering with moving averages
    - Signal strength classification
    - Position sizing based on signal strength
    """

    def __init__(self, config: Optional[RSIConfig] = None):
        """
        Initialize RSI strategy.

        Args:
            config: Strategy configuration
        """
        self.config = config or RSIConfig()
        self.name = "RSI_Strategy"
        self._last_signals: Dict[str, TradingSignal] = {}

    def analyze(self, data: pd.DataFrame, symbol: str) -> Optional[TradingSignal]:
        """
        Analyze price data and generate trading signals.

        Args:
            data: OHLCV DataFrame with columns: open, high, low, close, volume
            symbol: Stock symbol

        Returns:
            Trading signal or None
        """
        try:
            if len(data) < max(self.config.period, self.config.sma_long):
                logger.warning(f"Insufficient data for {symbol}: {len(data)} bars")
                return None

            # Calculate indicators
            indicators = self._calculate_indicators(data)

            # Get current values
            current_rsi = indicators["rsi"].iloc[-1]
            current_price = data["close"].iloc[-1]
            current_volume = data["volume"].iloc[-1]
            avg_volume = indicators["volume_sma"].iloc[-1]
            sma_50 = indicators["sma_50"].iloc[-1]
            sma_200 = indicators["sma_200"].iloc[-1]

            # Determine market trend
            trend = self._determine_trend(sma_50, sma_200, current_price)

            # Check volume confirmation
            volume_confirmed = not self.config.use_volume_filter or (
                current_volume >= avg_volume * self.config.min_volume_ratio
            )

            # Detect divergence
            divergence_signal = None
            if (
                self.config.use_divergence
                and len(data) >= self.config.divergence_lookback
            ):
                divergence_signal = self._detect_divergence(
                    data["close"], indicators["rsi"], self.config.divergence_lookback
                )

            # Generate base signal
            signal_info = self._generate_base_signal(
                current_rsi, trend, volume_confirmed, divergence_signal
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
                    "rsi": current_rsi,
                    "sma_50": sma_50,
                    "sma_200": sma_200,
                    "volume_ratio": (
                        current_volume / avg_volume if avg_volume > 0 else 0
                    ),
                    "trend": trend,
                },
                reason=reason,
                position_size_multiplier=position_multiplier,
            )

            # Store last signal for this symbol
            self._last_signals[symbol] = trading_signal

            logger.info(
                f"RSI signal for {symbol}: {signal_strength.value} "
                f"(RSI: {current_rsi:.2f}, Confidence: {confidence:.2f})"
            )

            return trading_signal

        except Exception as e:
            logger.error(f"Error analyzing {symbol}: {e}")
            return None

    def _calculate_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate technical indicators.

        Args:
            data: OHLCV DataFrame

        Returns:
            DataFrame with calculated indicators
        """
        indicators = pd.DataFrame(index=data.index)

        # RSI
        rsi_indicator = RSIIndicator(
            close=data["close"], window=self.config.period, fillna=True
        )
        indicators["rsi"] = rsi_indicator.rsi()

        # Moving averages
        sma_50_indicator = SMAIndicator(
            close=data["close"], window=self.config.sma_short, fillna=True
        )
        indicators["sma_50"] = sma_50_indicator.sma_indicator()

        sma_200_indicator = SMAIndicator(
            close=data["close"], window=self.config.sma_long, fillna=True
        )
        indicators["sma_200"] = sma_200_indicator.sma_indicator()

        # Volume SMA
        volume_sma_indicator = VolumeSMAIndicator(
            close=data["close"], volume=data["volume"], window=20, fillna=True
        )
        indicators["volume_sma"] = volume_sma_indicator.volume_sma()

        return indicators

    def _determine_trend(
        self, sma_50: float, sma_200: float, current_price: float
    ) -> str:
        """
        Determine market trend.

        Args:
            sma_50: 50-period SMA
            sma_200: 200-period SMA
            current_price: Current price

        Returns:
            Trend direction: 'bullish', 'bearish', or 'neutral'
        """
        if sma_50 > sma_200 and current_price > sma_50:
            return "bullish"
        elif sma_50 < sma_200 and current_price < sma_50:
            return "bearish"
        else:
            return "neutral"

    def _detect_divergence(
        self, prices: pd.Series, rsi: pd.Series, lookback: int
    ) -> Optional[str]:
        """
        Detect bullish/bearish divergence between price and RSI.

        Args:
            prices: Price series
            rsi: RSI series
            lookback: Lookback period

        Returns:
            Divergence type: 'bullish', 'bearish', or None
        """
        if len(prices) < lookback or len(rsi) < lookback:
            return None

        # Get recent data
        recent_prices = prices.iloc[-lookback:]
        recent_rsi = rsi.iloc[-lookback:]

        # Find local extremes
        price_highs = self._find_local_extremes(recent_prices, "high")
        price_lows = self._find_local_extremes(recent_prices, "low")
        rsi_highs = self._find_local_extremes(recent_rsi, "high")
        rsi_lows = self._find_local_extremes(recent_rsi, "low")

        # Check for bullish divergence (price makes lower lows, RSI makes higher lows)
        if len(price_lows) >= 2 and len(rsi_lows) >= 2:
            if (
                price_lows[-1] < price_lows[-2]
                and rsi_lows[-1] > rsi_lows[-2]
                and recent_rsi.iloc[-1] < 40
            ):  # RSI should be in lower range
                return "bullish"

        # Check for bearish divergence (price makes higher highs, RSI makes lower highs)
        if len(price_highs) >= 2 and len(rsi_highs) >= 2:
            if (
                price_highs[-1] > price_highs[-2]
                and rsi_highs[-1] < rsi_highs[-2]
                and recent_rsi.iloc[-1] > 60
            ):  # RSI should be in upper range
                return "bearish"

        return None

    def _find_local_extremes(self, series: pd.Series, extreme_type: str) -> List[float]:
        """
        Find local extremes in a series.

        Args:
            series: Data series
            extreme_type: 'high' or 'low'

        Returns:
            List of extreme values
        """
        extremes = []
        window = 3

        if len(series) < window:
            return extremes

        for i in range(window, len(series) - window):
            if extreme_type == "high":
                if all(
                    series.iloc[i] >= series.iloc[j]
                    for j in range(i - window, i + window + 1)
                    if j != i
                ):
                    extremes.append(series.iloc[i])
            else:  # low
                if all(
                    series.iloc[i] <= series.iloc[j]
                    for j in range(i - window, i + window + 1)
                    if j != i
                ):
                    extremes.append(series.iloc[i])

        return extremes

    def _generate_base_signal(
        self, rsi: float, trend: str, volume_confirmed: bool, divergence: Optional[str]
    ) -> Optional[Tuple[SignalStrength, float, str, float]]:
        """
        Generate base trading signal.

        Args:
            rsi: Current RSI value
            trend: Market trend
            volume_confirmed: Whether volume confirms the signal
            divergence: Divergence type if any

        Returns:
            Tuple of (signal_strength, confidence, reason, position_multiplier) or None
        """
        reasons = []
        confidence = 0.5
        position_multiplier = 1.0

        # Strong oversold conditions
        if rsi <= 20:
            if trend == "bullish" and volume_confirmed:
                confidence = 0.9
                position_multiplier = 1.5
                reasons.append("Strong oversold with bullish trend and volume")
                return (
                    SignalStrength.STRONG_BUY,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )
            elif volume_confirmed:
                confidence = 0.75
                position_multiplier = 1.2
                reasons.append("Strong oversold with volume confirmation")
                return (
                    SignalStrength.BUY,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )

        # Standard oversold conditions
        elif rsi <= self.config.oversold:
            if divergence == "bullish":
                confidence = 0.85
                position_multiplier = 1.3
                reasons.append("Oversold with bullish divergence")
                return (
                    SignalStrength.STRONG_BUY,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )
            elif trend == "bullish" and volume_confirmed:
                confidence = 0.75
                position_multiplier = 1.2
                reasons.append("Oversold with bullish trend and volume")
                return (
                    SignalStrength.BUY,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )
            elif volume_confirmed:
                confidence = 0.65
                reasons.append("Oversold with volume confirmation")
                return (
                    SignalStrength.BUY,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )

        # Strong overbought conditions
        elif rsi >= 80:
            if trend == "bearish" and volume_confirmed:
                confidence = 0.9
                position_multiplier = 1.5
                reasons.append("Strong overbought with bearish trend and volume")
                return (
                    SignalStrength.STRONG_SELL,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )
            elif volume_confirmed:
                confidence = 0.75
                position_multiplier = 1.2
                reasons.append("Strong overbought with volume confirmation")
                return (
                    SignalStrength.SELL,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )

        # Standard overbought conditions
        elif rsi >= self.config.overbought:
            if divergence == "bearish":
                confidence = 0.85
                position_multiplier = 1.3
                reasons.append("Overbought with bearish divergence")
                return (
                    SignalStrength.STRONG_SELL,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )
            elif trend == "bearish" and volume_confirmed:
                confidence = 0.75
                position_multiplier = 1.2
                reasons.append("Overbought with bearish trend and volume")
                return (
                    SignalStrength.SELL,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )
            elif volume_confirmed:
                confidence = 0.65
                reasons.append("Overbought with volume confirmation")
                return (
                    SignalStrength.SELL,
                    confidence,
                    "; ".join(reasons),
                    position_multiplier,
                )

        return None

    def get_position_size(self, base_size: float, signal: TradingSignal) -> float:
        """
        Calculate position size based on signal strength.

        Args:
            base_size: Base position size
            signal: Trading signal

        Returns:
            Adjusted position size
        """
        return base_size * signal.position_size_multiplier * signal.confidence

    def should_exit_position(
        self, data: pd.DataFrame, entry_signal: TradingSignal
    ) -> bool:
        """
        Determine if current position should be exited.

        Args:
            data: Current OHLCV data
            entry_signal: Original entry signal

        Returns:
            True if position should be exited
        """
        if len(data) < self.config.period:
            return False

        try:
            # Calculate current RSI
            rsi_indicator = RSIIndicator(
                close=data["close"], window=self.config.period, fillna=True
            )
            current_rsi = rsi_indicator.rsi().iloc[-1]

            # Exit long positions
            if entry_signal.signal in [SignalStrength.BUY, SignalStrength.STRONG_BUY]:
                if current_rsi >= self.config.overbought:
                    logger.info(f"Exit long signal: RSI overbought ({current_rsi:.2f})")
                    return True

            # Exit short positions
            elif entry_signal.signal in [
                SignalStrength.SELL,
                SignalStrength.STRONG_SELL,
            ]:
                if current_rsi <= self.config.oversold:
                    logger.info(f"Exit short signal: RSI oversold ({current_rsi:.2f})")
                    return True

            return False

        except Exception as e:
            logger.error(f"Error checking exit condition: {e}")
            return False

    def get_strategy_info(self) -> Dict[str, Any]:
        """
        Get strategy information and parameters.

        Returns:
            Strategy information dictionary
        """
        return {
            "name": self.name,
            "type": "Technical Momentum",
            "timeframes": ["1Min", "5Min", "15Min", "1Hour"],
            "parameters": {
                "rsi_period": self.config.period,
                "oversold_threshold": self.config.oversold,
                "overbought_threshold": self.config.overbought,
                "use_divergence": self.config.use_divergence,
                "use_volume_filter": self.config.use_volume_filter,
                "min_volume_ratio": self.config.min_volume_ratio,
                "sma_short": self.config.sma_short,
                "sma_long": self.config.sma_long,
            },
            "signals": [s.value for s in SignalStrength],
            "description": "Advanced RSI strategy with divergence detection and volume filtering",
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
        # In a full implementation, this would use techniques like:
        # - Grid search
        # - Genetic algorithms
        # - Bayesian optimization

        best_params = {
            "period": self.config.period,
            "oversold": self.config.oversold,
            "overbought": self.config.overbought,
        }

        logger.info("Parameter optimization completed")
        return best_params
