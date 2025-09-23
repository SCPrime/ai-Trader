# RSI Strategy Implementation

## File: src/strategies/rsi_strategy.py

Complete RSI-based trading strategy with:
- Advanced signal generation
- Divergence detection
- Volume filtering
- Trend confirmation
- Vectorized calculations for performance

## Key Features:
- Configurable RSI parameters (period, oversold/overbought levels)
- Bullish/bearish divergence detection
- Volume confirmation filters
- Moving average trend filters
- Signal strength classification (STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL)
- Position sizing based on signal strength

## Parameters:
- period: RSI calculation period (default: 14)
- oversold: Oversold threshold (default: 30)
- overbought: Overbought threshold (default: 70)
- use_divergence: Enable divergence detection (default: True)
- use_volume_filter: Enable volume confirmation (default: True)

## Signal Generation Logic:
1. Calculate RSI and supporting indicators
2. Detect trend using 50/200 SMA crossover
3. Check volume conditions (1.5x average volume)
4. Identify divergence patterns
5. Generate signals with strength classification
6. Apply position sizing multipliers