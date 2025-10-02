import type { NextApiRequest, NextApiResponse } from 'next';
import type { PositionTracking, ActualMetrics, Greeks } from '@/types/pnl';

/**
 * Track Position P&L Endpoint
 *
 * POST /api/pnl/track-position
 *
 * Returns real-time P&L updates with variance from theoretical baseline
 * for an active position
 */

interface TrackPositionRequest {
  positionId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { positionId }: TrackPositionRequest = req.body;

  if (!positionId) {
    return res.status(400).json({ error: 'Missing required parameter: positionId' });
  }

  try {
    // In production, fetch from database
    const positionTracking = await fetchPositionTracking(positionId);

    if (!positionTracking) {
      return res.status(404).json({ error: 'Position not found' });
    }

    // Update current prices and P&L
    const updatedTracking = await updateRealTimePL(positionTracking);

    res.status(200).json(updatedTracking);
  } catch (error) {
    console.error('Position tracking error:', error);
    res.status(500).json({
      error: 'Failed to track position',
      detail: String(error),
    });
  }
}

/**
 * Fetch position tracking data from database (mock)
 */
async function fetchPositionTracking(positionId: string): Promise<PositionTracking | null> {
  // Mock data - in production, query database
  const mockPosition: PositionTracking = {
    positionId,
    symbol: 'AAPL',
    strategy: 'Iron Condor',
    legs: [
      {
        type: 'PUT',
        side: 'SELL',
        qty: 1,
        strike: 175,
        expiration: '2025-02-21',
        theoreticalPrice: 2.50,
        actualPrice: 2.45, // Slightly worse fill
        currentPrice: 2.30,
      },
      {
        type: 'PUT',
        side: 'BUY',
        qty: 1,
        strike: 170,
        expiration: '2025-02-21',
        theoreticalPrice: 1.20,
        actualPrice: 1.22,
        currentPrice: 1.15,
      },
      {
        type: 'CALL',
        side: 'SELL',
        qty: 1,
        strike: 195,
        expiration: '2025-02-21',
        theoreticalPrice: 2.40,
        actualPrice: 2.38,
        currentPrice: 2.25,
      },
      {
        type: 'CALL',
        side: 'BUY',
        qty: 1,
        strike: 200,
        expiration: '2025-02-21',
        theoreticalPrice: 1.15,
        actualPrice: 1.17,
        currentPrice: 1.10,
      },
    ],
    theoretical: {
      maxProfit: 350,
      maxLoss: 150,
      breakevens: [176.5, 193.5],
      pop: 67,
      expectedValue: 235,
      entryPrice: 3.55, // Net credit
      greeks: {
        delta: -2.5,
        gamma: 0.015,
        theta: 8.5,
        vega: -15.2,
      },
    },
    actual: {
      entryPrice: 3.46, // Actual net credit (worse than theoretical)
      entrySlippage: -9, // Lost $9 on entry
      currentPL: 28, // Mark-to-market
      unrealizedPL: 28,
      realizedPL: 0,
      greeks: {
        delta: -2.3,
        gamma: 0.014,
        theta: 8.2,
        vega: -14.8,
      },
    },
    lastUpdated: new Date(),
  };

  return mockPosition;
}

/**
 * Update position with real-time market data
 */
async function updateRealTimePL(position: PositionTracking): Promise<PositionTracking> {
  // In production, fetch current option prices from market data API
  // For now, simulate price movement

  let currentValue = 0;
  let entryValue = 0;

  for (const leg of position.legs) {
    const legMultiplier = leg.side === 'BUY' ? -1 : 1; // BUY = debit, SELL = credit

    // Entry value
    entryValue += legMultiplier * leg.actualPrice * leg.qty * 100;

    // Current value
    currentValue += legMultiplier * leg.currentPrice * leg.qty * 100;
  }

  // P&L = entry value - current value (for credit spreads)
  // For debit spreads, P&L = current value - entry value
  const unrealizedPL = entryValue - currentValue;

  // Update actual metrics
  position.actual.currentPL = unrealizedPL;
  position.actual.unrealizedPL = unrealizedPL;
  position.lastUpdated = new Date();

  // Recalculate greeks (in production, fetch from options API)
  position.actual.greeks = calculateCurrentGreeks(position.legs);

  return position;
}

/**
 * Calculate current greeks based on leg prices (simplified)
 */
function calculateCurrentGreeks(legs: any[]): Greeks {
  // Mock calculation - in production, fetch actual greeks
  let delta = 0;
  let gamma = 0;
  let theta = 0;
  let vega = 0;

  for (const leg of legs) {
    const multiplier = leg.side === 'BUY' ? 1 : -1;

    // Estimate greeks based on option type
    const legGreeks = estimateLegGreeks(leg);
    delta += multiplier * legGreeks.delta * leg.qty * 100;
    gamma += multiplier * legGreeks.gamma * leg.qty * 100;
    theta += multiplier * legGreeks.theta * leg.qty * 100;
    vega += multiplier * legGreeks.vega * leg.qty * 100;
  }

  return {
    delta: Math.round(delta * 100) / 100,
    gamma: Math.round(gamma * 1000) / 1000,
    theta: Math.round(theta * 100) / 100,
    vega: Math.round(vega * 100) / 100,
  };
}

/**
 * Estimate greeks for a single leg
 */
function estimateLegGreeks(leg: any): Greeks {
  // Simplified - in production, use Black-Scholes or fetch from API
  if (leg.type === 'CALL') {
    return {
      delta: 0.48,
      gamma: 0.018,
      theta: -0.12,
      vega: 0.14,
    };
  } else {
    return {
      delta: -0.48,
      gamma: 0.018,
      theta: -0.12,
      vega: 0.14,
    };
  }
}
