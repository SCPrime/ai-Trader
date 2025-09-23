"""
Comprehensive technical indicators library.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class IndicatorResult:
    """Container for indicator calculation results."""

    name: str
    values: pd.Series
    signals: Optional[pd.Series] = None
    metadata: Dict[str, Any] = None


class TechnicalIndicators:
    """
    Comprehensive technical indicators calculator.
    """

    @staticmethod
    def sma(data: pd.Series, period: int) -> IndicatorResult:
        """
        Simple Moving Average.

        Args:
            data: Price series
            period: SMA period

        Returns:
            IndicatorResult with SMA values
        """
        sma_values = data.rolling(window=period).mean()

        return IndicatorResult(
            name=f"SMA_{period}", values=sma_values, metadata={"period": period}
        )

    @staticmethod
    def ema(data: pd.Series, period: int) -> IndicatorResult:
        """
        Exponential Moving Average.

        Args:
            data: Price series
            period: EMA period

        Returns:
            IndicatorResult with EMA values
        """
        ema_values = data.ewm(span=period).mean()

        return IndicatorResult(
            name=f"EMA_{period}", values=ema_values, metadata={"period": period}
        )

    @staticmethod
    def rsi(data: pd.Series, period: int = 14) -> IndicatorResult:
        """
        Relative Strength Index.

        Args:
            data: Price series
            period: RSI period

        Returns:
            IndicatorResult with RSI values and signals
        """
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi_values = 100 - (100 / (1 + rs))

        # Generate signals
        signals = pd.Series(index=data.index, dtype="object")
        signals[rsi_values < 30] = "oversold"
        signals[rsi_values > 70] = "overbought"
        signals[(rsi_values >= 30) & (rsi_values <= 70)] = "neutral"

        return IndicatorResult(
            name=f"RSI_{period}",
            values=rsi_values,
            signals=signals,
            metadata={"period": period, "oversold": 30, "overbought": 70},
        )

    @staticmethod
    def macd(
        data: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
    ) -> IndicatorResult:
        """
        MACD (Moving Average Convergence Divergence).

        Args:
            data: Price series
            fast: Fast EMA period
            slow: Slow EMA period
            signal: Signal line EMA period

        Returns:
            IndicatorResult with MACD line, signal line, and histogram
        """
        ema_fast = data.ewm(span=fast).mean()
        ema_slow = data.ewm(span=slow).mean()

        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal).mean()
        histogram = macd_line - signal_line

        # Combine into DataFrame for easier handling
        macd_data = pd.DataFrame(
            {"macd": macd_line, "signal": signal_line, "histogram": histogram},
            index=data.index,
        )

        # Generate signals
        signals = pd.Series(index=data.index, dtype="object")
        signals[macd_line > signal_line] = "bullish"
        signals[macd_line < signal_line] = "bearish"

        return IndicatorResult(
            name=f"MACD_{fast}_{slow}_{signal}",
            values=macd_data,
            signals=signals,
            metadata={"fast": fast, "slow": slow, "signal": signal},
        )

    @staticmethod
    def bollinger_bands(
        data: pd.Series, period: int = 20, std_dev: float = 2.0
    ) -> IndicatorResult:
        """
        Bollinger Bands.

        Args:
            data: Price series
            period: Moving average period
            std_dev: Standard deviation multiplier

        Returns:
            IndicatorResult with upper, middle, and lower bands
        """
        sma = data.rolling(window=period).mean()
        std = data.rolling(window=period).std()

        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)

        # Combine bands
        bb_data = pd.DataFrame(
            {"upper": upper_band, "middle": sma, "lower": lower_band}, index=data.index
        )

        # Generate signals
        signals = pd.Series(index=data.index, dtype="object")
        signals[data <= lower_band] = "oversold"
        signals[data >= upper_band] = "overbought"
        signals[(data > lower_band) & (data < upper_band)] = "neutral"

        return IndicatorResult(
            name=f"BB_{period}_{std_dev}",
            values=bb_data,
            signals=signals,
            metadata={"period": period, "std_dev": std_dev},
        )

    @staticmethod
    def stochastic(
        high: pd.Series,
        low: pd.Series,
        close: pd.Series,
        k_period: int = 14,
        d_period: int = 3,
    ) -> IndicatorResult:
        """
        Stochastic Oscillator.

        Args:
            high: High price series
            low: Low price series
            close: Close price series
            k_period: %K period
            d_period: %D period

        Returns:
            IndicatorResult with %K and %D values
        """
        lowest_low = low.rolling(window=k_period).min()
        highest_high = high.rolling(window=k_period).max()

        k_percent = 100 * ((close - lowest_low) / (highest_high - lowest_low))
        d_percent = k_percent.rolling(window=d_period).mean()

        stoch_data = pd.DataFrame({"k": k_percent, "d": d_percent}, index=close.index)

        # Generate signals
        signals = pd.Series(index=close.index, dtype="object")
        signals[k_percent < 20] = "oversold"
        signals[k_percent > 80] = "overbought"
        signals[(k_percent >= 20) & (k_percent <= 80)] = "neutral"

        return IndicatorResult(
            name=f"STOCH_{k_period}_{d_period}",
            values=stoch_data,
            signals=signals,
            metadata={"k_period": k_period, "d_period": d_period},
        )

    @staticmethod
    def williams_r(
        high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
    ) -> IndicatorResult:
        """
        Williams %R.

        Args:
            high: High price series
            low: Low price series
            close: Close price series
            period: Lookback period

        Returns:
            IndicatorResult with Williams %R values
        """
        highest_high = high.rolling(window=period).max()
        lowest_low = low.rolling(window=period).min()

        williams_r = -100 * ((highest_high - close) / (highest_high - lowest_low))

        # Generate signals
        signals = pd.Series(index=close.index, dtype="object")
        signals[williams_r < -80] = "oversold"
        signals[williams_r > -20] = "overbought"
        signals[(williams_r >= -80) & (williams_r <= -20)] = "neutral"

        return IndicatorResult(
            name=f"WILLIAMS_R_{period}",
            values=williams_r,
            signals=signals,
            metadata={"period": period},
        )

    @staticmethod
    def atr(
        high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
    ) -> IndicatorResult:
        """
        Average True Range.

        Args:
            high: High price series
            low: Low price series
            close: Close price series
            period: ATR period

        Returns:
            IndicatorResult with ATR values
        """
        prev_close = close.shift(1)

        tr1 = high - low
        tr2 = abs(high - prev_close)
        tr3 = abs(low - prev_close)

        true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr_values = true_range.rolling(window=period).mean()

        return IndicatorResult(
            name=f"ATR_{period}", values=atr_values, metadata={"period": period}
        )

    @staticmethod
    def adx(
        high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
    ) -> IndicatorResult:
        """
        Average Directional Index.

        Args:
            high: High price series
            low: Low price series
            close: Close price series
            period: ADX period

        Returns:
            IndicatorResult with ADX, +DI, and -DI values
        """
        # Calculate True Range
        prev_close = close.shift(1)
        tr1 = high - low
        tr2 = abs(high - prev_close)
        tr3 = abs(low - prev_close)
        true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

        # Calculate Directional Movement
        up_move = high - high.shift(1)
        down_move = low.shift(1) - low

        plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
        minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0)

        plus_dm = pd.Series(plus_dm, index=high.index)
        minus_dm = pd.Series(minus_dm, index=high.index)

        # Calculate smoothed averages
        atr = true_range.rolling(window=period).mean()
        plus_di = 100 * (plus_dm.rolling(window=period).mean() / atr)
        minus_di = 100 * (minus_dm.rolling(window=period).mean() / atr)

        # Calculate ADX
        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
        adx_values = dx.rolling(window=period).mean()

        adx_data = pd.DataFrame(
            {"adx": adx_values, "plus_di": plus_di, "minus_di": minus_di},
            index=close.index,
        )

        # Generate signals
        signals = pd.Series(index=close.index, dtype="object")
        signals[adx_values > 25] = "trending"
        signals[adx_values <= 25] = "ranging"

        return IndicatorResult(
            name=f"ADX_{period}",
            values=adx_data,
            signals=signals,
            metadata={"period": period},
        )

    @staticmethod
    def vwap(
        high: pd.Series, low: pd.Series, close: pd.Series, volume: pd.Series
    ) -> IndicatorResult:
        """
        Volume Weighted Average Price.

        Args:
            high: High price series
            low: Low price series
            close: Close price series
            volume: Volume series

        Returns:
            IndicatorResult with VWAP values
        """
        typical_price = (high + low + close) / 3
        vwap_values = (typical_price * volume).cumsum() / volume.cumsum()

        # Generate signals
        signals = pd.Series(index=close.index, dtype="object")
        signals[close > vwap_values] = "above_vwap"
        signals[close < vwap_values] = "below_vwap"

        return IndicatorResult(
            name="VWAP", values=vwap_values, signals=signals, metadata={}
        )

    @staticmethod
    def momentum(data: pd.Series, period: int = 10) -> IndicatorResult:
        """
        Price Momentum.

        Args:
            data: Price series
            period: Momentum period

        Returns:
            IndicatorResult with momentum values
        """
        momentum_values = data - data.shift(period)

        # Generate signals
        signals = pd.Series(index=data.index, dtype="object")
        signals[momentum_values > 0] = "positive"
        signals[momentum_values < 0] = "negative"
        signals[momentum_values == 0] = "neutral"

        return IndicatorResult(
            name=f"MOM_{period}",
            values=momentum_values,
            signals=signals,
            metadata={"period": period},
        )

    @staticmethod
    def roc(data: pd.Series, period: int = 10) -> IndicatorResult:
        """
        Rate of Change.

        Args:
            data: Price series
            period: ROC period

        Returns:
            IndicatorResult with ROC values
        """
        roc_values = ((data - data.shift(period)) / data.shift(period)) * 100

        # Generate signals
        signals = pd.Series(index=data.index, dtype="object")
        signals[roc_values > 0] = "positive"
        signals[roc_values < 0] = "negative"
        signals[roc_values == 0] = "neutral"

        return IndicatorResult(
            name=f"ROC_{period}",
            values=roc_values,
            signals=signals,
            metadata={"period": period},
        )

    @classmethod
    def calculate_all_indicators(
        cls, ohlcv_data: pd.DataFrame
    ) -> Dict[str, IndicatorResult]:
        """
        Calculate all available indicators for OHLCV data.

        Args:
            ohlcv_data: DataFrame with OHLCV columns

        Returns:
            Dictionary of all calculated indicators
        """
        indicators = {}

        # Price series
        high = ohlcv_data["high"]
        low = ohlcv_data["low"]
        close = ohlcv_data["close"]
        volume = ohlcv_data["volume"]

        # Moving Averages
        indicators["sma_20"] = cls.sma(close, 20)
        indicators["sma_50"] = cls.sma(close, 50)
        indicators["ema_12"] = cls.ema(close, 12)
        indicators["ema_26"] = cls.ema(close, 26)

        # Oscillators
        indicators["rsi_14"] = cls.rsi(close, 14)
        indicators["macd"] = cls.macd(close)
        indicators["stoch"] = cls.stochastic(high, low, close)
        indicators["williams_r"] = cls.williams_r(high, low, close)

        # Volatility
        indicators["bollinger_bands"] = cls.bollinger_bands(close)
        indicators["atr"] = cls.atr(high, low, close)

        # Trend
        indicators["adx"] = cls.adx(high, low, close)

        # Volume
        indicators["vwap"] = cls.vwap(high, low, close, volume)

        # Momentum
        indicators["momentum"] = cls.momentum(close)
        indicators["roc"] = cls.roc(close)

        return indicators
