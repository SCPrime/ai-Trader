import type { NextApiRequest, NextApiResponse } from 'next';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY!;
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET!;
const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://data.alpaca.markets';

type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y';

interface BarData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AlpacaBar {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

interface AlpacaResponse {
  bars: AlpacaBar[];
  symbol: string;
  next_page_token?: string;
}

/**
 * Map timeframe to Alpaca API parameters
 */
function getAlpacaParams(timeframe: Timeframe): { timeframe: string; limit: number } {
  const map: Record<Timeframe, { timeframe: string; limit: number }> = {
    '1D': { timeframe: '5Min', limit: 78 },   // 6.5 trading hours
    '5D': { timeframe: '15Min', limit: 130 }, // 5 days of 15min bars
    '1M': { timeframe: '1Hour', limit: 156 }, // ~1 month of hourly bars
    '3M': { timeframe: '1Day', limit: 90 },   // ~3 months of daily bars
    '6M': { timeframe: '1Day', limit: 180 },  // ~6 months of daily bars
    '1Y': { timeframe: '1Day', limit: 365 },  // 1 year of daily bars
    '5Y': { timeframe: '1Week', limit: 260 }, // 5 years of weekly bars
  };
  return map[timeframe];
}

/**
 * Historical Market Data API
 *
 * GET /api/market/historical?symbol=AAPL&timeframe=3M
 *
 * Returns candlestick data for charting
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, timeframe } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol parameter' });
  }

  if (!timeframe || typeof timeframe !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid timeframe parameter' });
  }

  const validTimeframes: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];
  if (!validTimeframes.includes(timeframe as Timeframe)) {
    return res.status(400).json({ error: 'Invalid timeframe. Must be one of: 1D, 5D, 1M, 3M, 6M, 1Y, 5Y' });
  }

  try {
    const params = getAlpacaParams(timeframe as Timeframe);

    // Build Alpaca API URL
    const url = new URL(`${ALPACA_BASE_URL}/v2/stocks/${symbol.toUpperCase()}/bars`);
    url.searchParams.set('timeframe', params.timeframe);
    url.searchParams.set('limit', params.limit.toString());
    url.searchParams.set('adjustment', 'split'); // Adjust for stock splits

    // Fetch from Alpaca
    const response = await fetch(url.toString(), {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to fetch data from Alpaca',
        detail: errorText
      });
    }

    const data: AlpacaResponse = await response.json();

    if (!data.bars || data.bars.length === 0) {
      return res.status(404).json({
        error: 'No data found for symbol',
        symbol: symbol.toUpperCase()
      });
    }

    // Transform Alpaca format to our format
    const bars: BarData[] = data.bars.map(bar => ({
      time: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.status(200).json({
      symbol: symbol.toUpperCase(),
      timeframe,
      bars,
      count: bars.length,
    });
  } catch (error) {
    console.error('Historical data fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      detail: String(error)
    });
  }
}
