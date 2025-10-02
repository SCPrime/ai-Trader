import type { NextApiRequest, NextApiResponse } from 'next';

const ALPACA_API_KEY = process.env.ALPACA_API_KEY!;
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET!;
const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://data.alpaca.markets';

interface OptionQuote {
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  last: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVolatility: number;
}

interface OptionsChainResponse {
  symbol: string;
  underlyingPrice: number;
  expirations: string[];
  chains: {
    strike: number;
    call: OptionQuote | null;
    put: OptionQuote | null;
  }[];
}

/**
 * Options Chain API
 *
 * GET /api/market/options-chain?symbol=AAPL&expiration=2025-02-21
 *
 * Returns options chain data with greeks and IV
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, expiration } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol parameter' });
  }

  try {
    // Fetch options snapshots from Alpaca
    const url = new URL(`${ALPACA_BASE_URL}/v1beta1/options/snapshots/${symbol.toUpperCase()}`);
    if (expiration && typeof expiration === 'string') {
      url.searchParams.set('expiration_date', expiration);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca options API error:', response.status, errorText);

      // If no options data available, return mock data for demo
      if (response.status === 404 || response.status === 422) {
        return res.status(200).json(generateMockOptionsChain(symbol.toUpperCase(), expiration as string | undefined));
      }

      return res.status(response.status).json({
        error: 'Failed to fetch options data from Alpaca',
        detail: errorText
      });
    }

    const data = await response.json();

    // Transform Alpaca data to our format
    const result = transformAlpacaOptions(data, symbol.toUpperCase());

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(result);
  } catch (error) {
    console.error('Options chain fetch error:', error);

    // Fallback to mock data on error
    res.status(200).json(generateMockOptionsChain(symbol.toUpperCase(), expiration as string | undefined));
  }
}

/**
 * Transform Alpaca options data to our format
 */
function transformAlpacaOptions(alpacaData: any, symbol: string): OptionsChainResponse {
  // Parse Alpaca response and transform to our schema
  // This is a placeholder - actual Alpaca response format may vary
  const snapshots = alpacaData.snapshots || {};
  const chains = new Map<number, { call: OptionQuote | null; put: OptionQuote | null }>();
  const expirations = new Set<string>();

  Object.entries(snapshots).forEach(([optionSymbol, snapshot]: [string, any]) => {
    const quote = snapshot.latestQuote || {};
    const greeks = snapshot.greeks || {};

    // Parse option symbol (format: AAPL250221C00150000)
    const match = optionSymbol.match(/([A-Z]+)(\d{6})([CP])(\d{8})/);
    if (!match) return;

    const [, , dateStr, type, strikeStr] = match;
    const strike = parseInt(strikeStr) / 1000;
    const expiration = `20${dateStr.slice(0, 2)}-${dateStr.slice(2, 4)}-${dateStr.slice(4, 6)}`;

    expirations.add(expiration);

    if (!chains.has(strike)) {
      chains.set(strike, { call: null, put: null });
    }

    const optionQuote: OptionQuote = {
      strike,
      expiration,
      type: type === 'C' ? 'call' : 'put',
      last: quote.ap || 0,
      bid: quote.bp || 0,
      ask: quote.ap || 0,
      volume: snapshot.dailyVolume || 0,
      openInterest: snapshot.openInterest || 0,
      delta: greeks.delta || 0,
      gamma: greeks.gamma || 0,
      theta: greeks.theta || 0,
      vega: greeks.vega || 0,
      impliedVolatility: greeks.impliedVolatility || 0,
    };

    const chain = chains.get(strike)!;
    if (type === 'C') {
      chain.call = optionQuote;
    } else {
      chain.put = optionQuote;
    }
  });

  return {
    symbol,
    underlyingPrice: 184.10, // TODO: Get from quote API
    expirations: Array.from(expirations).sort(),
    chains: Array.from(chains.entries())
      .map(([strike, { call, put }]) => ({ strike, call, put }))
      .sort((a, b) => a.strike - b.strike),
  };
}

/**
 * Generate mock options chain data for demo purposes
 */
function generateMockOptionsChain(symbol: string, expiration?: string): OptionsChainResponse {
  const underlyingPrice = 184.10;
  const expirations = [
    '2025-01-17',
    '2025-01-24',
    '2025-02-21',
    '2025-03-21',
    '2025-06-20',
    '2026-01-16',
  ];

  const selectedExpiration = expiration || expirations[2];
  const atmStrike = Math.round(underlyingPrice / 5) * 5;
  const strikes = [];

  // Generate strikes ATM ± 10 strikes ($5 intervals)
  for (let i = -10; i <= 10; i++) {
    strikes.push(atmStrike + i * 5);
  }

  const chains = strikes.map(strike => {
    const isITM_Call = strike < underlyingPrice;
    const isITM_Put = strike > underlyingPrice;
    const distanceFromATM = Math.abs(strike - underlyingPrice);

    // Calculate mock greeks based on moneyness
    const callDelta = Math.max(0.05, Math.min(0.95, 0.5 + (underlyingPrice - strike) / 100));
    const putDelta = -Math.max(0.05, Math.min(0.95, 0.5 + (strike - underlyingPrice) / 100));
    const gamma = 0.01 * Math.exp(-Math.pow(distanceFromATM / 20, 2));
    const theta = -0.05 - 0.02 * Math.exp(-Math.pow(distanceFromATM / 20, 2));
    const vega = 0.15 + 0.10 * Math.exp(-Math.pow(distanceFromATM / 20, 2));
    const iv = 0.25 + 0.10 * Math.exp(-Math.pow(distanceFromATM / 30, 2));

    // Calculate intrinsic and extrinsic value
    const callIntrinsic = Math.max(0, underlyingPrice - strike);
    const putIntrinsic = Math.max(0, strike - underlyingPrice);
    const extrinsicValue = 2.0 + 5.0 * Math.exp(-Math.pow(distanceFromATM / 15, 2));

    const callLast = callIntrinsic + extrinsicValue;
    const putLast = putIntrinsic + extrinsicValue;

    // Mock volume and OI (higher near ATM)
    const volumeFactor = Math.exp(-Math.pow(distanceFromATM / 15, 2));
    const callVolume = Math.floor(500 + 3000 * volumeFactor);
    const putVolume = Math.floor(400 + 2500 * volumeFactor);
    const callOI = Math.floor(1000 + 10000 * volumeFactor);
    const putOI = Math.floor(800 + 8000 * volumeFactor);

    const call: OptionQuote = {
      strike,
      expiration: selectedExpiration,
      type: 'call',
      last: callLast,
      bid: callLast * 0.98,
      ask: callLast * 1.02,
      volume: callVolume,
      openInterest: callOI,
      delta: callDelta,
      gamma,
      theta,
      vega,
      impliedVolatility: iv,
    };

    const put: OptionQuote = {
      strike,
      expiration: selectedExpiration,
      type: 'put',
      last: putLast,
      bid: putLast * 0.98,
      ask: putLast * 1.02,
      volume: putVolume,
      openInterest: putOI,
      delta: putDelta,
      gamma,
      theta,
      vega,
      impliedVolatility: iv,
    };

    return { strike, call, put };
  });

  return {
    symbol,
    underlyingPrice,
    expirations,
    chains,
  };
}
