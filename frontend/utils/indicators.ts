/**
 * Technical Indicators Utility
 *
 * Provides calculation functions for technical analysis indicators
 * Used by ResearchDashboard for chart overlays
 */

export interface BarData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LinePoint {
  time: string;
  value: number;
}

/**
 * Simple Moving Average (SMA)
 * Calculates the average price over a specified period
 */
export function calculateSMA(data: BarData[], period: number): LinePoint[] {
  if (data.length < period) return [];

  const result: LinePoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, bar) => acc + bar.close, 0);
    result.push({
      time: data[i].time,
      value: sum / period
    });
  }
  return result;
}

/**
 * Relative Strength Index (RSI)
 * Momentum oscillator measuring speed and magnitude of price changes
 */
export function calculateRSI(data: BarData[], period: number = 14): LinePoint[] {
  if (data.length < period + 1) return [];

  const result: LinePoint[] = [];
  const changes: number[] = [];

  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }

  for (let i = period; i < changes.length; i++) {
    const gains = changes.slice(i - period, i).filter(c => c > 0);
    const losses = changes.slice(i - period, i).filter(c => c < 0).map(Math.abs);

    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    result.push({
      time: data[i + 1].time,
      value: rsi
    });
  }

  return result;
}

/**
 * Moving Average Convergence Divergence (MACD)
 * Trend-following momentum indicator
 */
export function calculateMACD(
  data: BarData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) {
  const ema = (values: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const result: number[] = [values[0]];
    for (let i = 1; i < values.length; i++) {
      result.push(values[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  };

  const closes = data.map(d => d.close);
  const fastEMA = ema(closes, fastPeriod);
  const slowEMA = ema(closes, slowPeriod);

  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signalLine = ema(macdLine, signalPeriod);
  const histogram = macdLine.map((macd, i) => macd - signalLine[i]);

  return {
    macd: macdLine.map((val, i) => ({ time: data[i].time, value: val })),
    signal: signalLine.map((val, i) => ({ time: data[i].time, value: val })),
    histogram: histogram.map((val, i) => ({ time: data[i].time, value: val }))
  };
}

/**
 * Bollinger Bands
 * Volatility bands placed above and below a moving average
 */
export function calculateBollingerBands(
  data: BarData[],
  period: number = 20,
  stdDev: number = 2
) {
  const sma = calculateSMA(data, period);
  const result: { upper: LinePoint[], middle: LinePoint[], lower: LinePoint[] } = {
    upper: [],
    middle: sma,
    lower: []
  };

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, bar) => acc + bar.close, 0) / period;
    const variance = slice.reduce((acc, bar) => acc + Math.pow(bar.close - mean, 2), 0) / period;
    const std = Math.sqrt(variance);

    result.upper.push({ time: data[i].time, value: mean + stdDev * std });
    result.lower.push({ time: data[i].time, value: mean - stdDev * std });
  }

  return result;
}

/**
 * Ichimoku Cloud
 * Comprehensive indicator showing support/resistance, trend direction, and momentum
 */
export function calculateIchimoku(data: BarData[]) {
  const highLow = (period: number, index: number): number => {
    const slice = data.slice(Math.max(0, index - period + 1), index + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    return (high + low) / 2;
  };

  const tenkan: LinePoint[] = [];
  const kijun: LinePoint[] = [];
  const senkouA: LinePoint[] = [];
  const senkouB: LinePoint[] = [];
  const chikou: LinePoint[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i >= 8) tenkan.push({ time: data[i].time, value: highLow(9, i) });
    if (i >= 25) kijun.push({ time: data[i].time, value: highLow(26, i) });
    if (i >= 25 && tenkan.length > 0 && kijun.length > 0) {
      const senkou = (tenkan[tenkan.length - 1].value + kijun[kijun.length - 1].value) / 2;
      senkouA.push({ time: data[i].time, value: senkou });
    }
    if (i >= 51) senkouB.push({ time: data[i].time, value: highLow(52, i) });
    if (i >= 26) chikou.push({ time: data[i - 26].time, value: data[i].close });
  }

  return { tenkan, kijun, senkouA, senkouB, chikou };
}

/**
 * Exponential Moving Average (EMA)
 * Weighted moving average that gives more importance to recent data
 */
export function calculateEMA(data: BarData[], period: number): LinePoint[] {
  if (data.length < period) return [];

  const k = 2 / (period + 1);
  const result: LinePoint[] = [];

  // Start with SMA for first value
  const firstSMA = data.slice(0, period).reduce((acc, bar) => acc + bar.close, 0) / period;
  result.push({ time: data[period - 1].time, value: firstSMA });

  for (let i = period; i < data.length; i++) {
    const ema = data[i].close * k + result[result.length - 1].value * (1 - k);
    result.push({ time: data[i].time, value: ema });
  }

  return result;
}

/**
 * Average True Range (ATR)
 * Volatility indicator measuring market volatility
 */
export function calculateATR(data: BarData[], period: number = 14): LinePoint[] {
  if (data.length < period + 1) return [];

  const trueRanges: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const result: LinePoint[] = [];

  // First ATR is simple average
  const firstATR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push({ time: data[period].time, value: firstATR });

  // Subsequent ATRs use smoothing
  for (let i = period; i < trueRanges.length; i++) {
    const atr = (result[result.length - 1].value * (period - 1) + trueRanges[i]) / period;
    result.push({ time: data[i + 1].time, value: atr });
  }

  return result;
}

/**
 * Stochastic Oscillator
 * Momentum indicator comparing closing price to price range
 */
export function calculateStochastic(
  data: BarData[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: LinePoint[], d: LinePoint[] } {
  if (data.length < kPeriod) return { k: [], d: [] };

  const kValues: LinePoint[] = [];

  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const close = data[i].close;

    const k = ((close - low) / (high - low)) * 100;
    kValues.push({ time: data[i].time, value: k });
  }

  const dValues: LinePoint[] = [];

  for (let i = dPeriod - 1; i < kValues.length; i++) {
    const sum = kValues.slice(i - dPeriod + 1, i + 1).reduce((acc, val) => acc + val.value, 0);
    dValues.push({ time: kValues[i].time, value: sum / dPeriod });
  }

  return { k: kValues, d: dValues };
}
