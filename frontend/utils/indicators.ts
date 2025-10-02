/**
 * Technical Indicators Calculations
 *
 * Pure functions for calculating common technical indicators
 * used in chart overlays.
 */

export interface BarData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorPoint {
  time: string;
  value: number;
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param data - Array of bar data
 * @param period - Number of periods (e.g., 20, 50, 200)
 * @returns Array of SMA points
 */
export function calculateSMA(data: BarData[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const avg = sum / period;
    result.push({
      time: data[i].time,
      value: avg,
    });
  }

  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param data - Array of bar data
 * @param period - Number of periods (typically 14)
 * @returns Array of RSI points (0-100)
 */
export function calculateRSI(data: BarData[], period: number = 14): IndicatorPoint[] {
  if (data.length < period + 1) {
    return [];
  }

  const result: IndicatorPoint[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI using Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];

    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    result.push({
      time: data[i + 1].time,
      value: rsi,
    });
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param data - Array of bar data
 * @param fastPeriod - Fast EMA period (default 12)
 * @param slowPeriod - Slow EMA period (default 26)
 * @param signalPeriod - Signal line period (default 9)
 * @returns Object with MACD line, signal line, and histogram
 */
export function calculateMACD(
  data: BarData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: IndicatorPoint[];
  signal: IndicatorPoint[];
  histogram: IndicatorPoint[];
} {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  // Calculate MACD line
  const macdLine: IndicatorPoint[] = [];
  const minLength = Math.min(emaFast.length, emaSlow.length);

  for (let i = 0; i < minLength; i++) {
    macdLine.push({
      time: emaFast[i].time,
      value: emaFast[i].value - emaSlow[i].value,
    });
  }

  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMAFromPoints(macdLine, signalPeriod);

  // Calculate histogram
  const histogram: IndicatorPoint[] = [];
  const histMinLength = Math.min(macdLine.length, signalLine.length);

  for (let i = 0; i < histMinLength; i++) {
    histogram.push({
      time: macdLine[i].time,
      value: macdLine[i].value - signalLine[i].value,
    });
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param data - Array of bar data
 * @param period - Number of periods
 * @returns Array of EMA points
 */
export function calculateEMA(data: BarData[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for the first EMA value
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += data[i].close;
  }
  ema /= period;

  result.push({
    time: data[period - 1].time,
    value: ema,
  });

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({
      time: data[i].time,
      value: ema,
    });
  }

  return result;
}

/**
 * Calculate EMA from indicator points (used for MACD signal line)
 */
function calculateEMAFromPoints(points: IndicatorPoint[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  const multiplier = 2 / (period + 1);

  if (points.length < period) {
    return [];
  }

  // Start with SMA
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += points[i].value;
  }
  ema /= period;

  result.push({
    time: points[period - 1].time,
    value: ema,
  });

  // Calculate EMA
  for (let i = period; i < points.length; i++) {
    ema = (points[i].value - ema) * multiplier + ema;
    result.push({
      time: points[i].time,
      value: ema,
    });
  }

  return result;
}

/**
 * Calculate Bollinger Bands
 * @param data - Array of bar data
 * @param period - Number of periods (typically 20)
 * @param stdDev - Number of standard deviations (typically 2)
 * @returns Object with upper, middle, and lower bands
 */
export function calculateBollingerBands(
  data: BarData[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: IndicatorPoint[];
  middle: IndicatorPoint[];
  lower: IndicatorPoint[];
} {
  const middle = calculateSMA(data, period);
  const upper: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];

  for (let i = period - 1; i < data.length; i++) {
    // Calculate standard deviation
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, bar) => sum + bar.close, 0) / period;
    const variance = slice.reduce((sum, bar) => sum + Math.pow(bar.close - mean, 2), 0) / period;
    const std = Math.sqrt(variance);

    const idx = i - period + 1;
    upper.push({
      time: data[i].time,
      value: middle[idx].value + stdDev * std,
    });
    lower.push({
      time: data[i].time,
      value: middle[idx].value - stdDev * std,
    });
  }

  return { upper, middle, lower };
}
