import type { NextApiRequest, NextApiResponse } from 'next';
import type { PLComparison } from '@/types/pnl';

/**
 * P&L Comparison Endpoint
 *
 * GET /api/pnl/comparison/[positionId]
 *
 * Returns full P&L comparison with theoretical vs actual metrics,
 * execution quality score, and historical data
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { positionId } = req.query;

  if (!positionId || typeof positionId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid positionId' });
  }

  try {
    // In production, fetch from database
    const comparison = await fetchPLComparison(positionId);

    if (!comparison) {
      return res.status(404).json({ error: 'Position comparison not found' });
    }

    res.status(200).json(comparison);
  } catch (error) {
    console.error('P&L comparison fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch P&L comparison',
      detail: String(error),
    });
  }
}

/**
 * Fetch P&L comparison from database (mock)
 */
async function fetchPLComparison(positionId: string): Promise<PLComparison | null> {
  // Mock data - in production, query database with full position history

  const proposedAt = new Date('2025-01-15T10:30:00Z');
  const enteredAt = new Date('2025-01-15T10:35:12Z');
  const closedAt = new Date('2025-02-18T15:45:30Z'); // Closed position

  const mockComparison: PLComparison = {
    positionId,
    symbol: 'AAPL',
    strategy: 'Iron Condor (175/170/195/200)',

    // Theoretical (pre-trade)
    theoretical: {
      maxProfit: 355,
      maxLoss: 145,
      breakevens: [176.45, 193.55],
      pop: 67.5,
      expectedValue: 240,
      entryPrice: 3.55, // Net credit at mid
      greeks: {
        delta: -2.5,
        gamma: 0.015,
        theta: 8.5,
        vega: -15.2,
      },
    },

    // Actual (execution)
    actual: {
      entryPrice: 3.46, // Actual fill (worse than mid)
      entrySlippage: -9, // Lost $9 on entry vs theoretical
      currentPL: 310, // Final P&L at close
      unrealizedPL: 0,
      realizedPL: 310,
      greeks: {
        delta: 0, // Closed position
        gamma: 0,
        theta: 0,
        vega: 0,
      },
    },

    // Greeks comparison (at entry)
    greeks: {
      theoretical: {
        delta: -2.5,
        gamma: 0.015,
        theta: 8.5,
        vega: -15.2,
      },
      actual: {
        delta: -2.3,
        gamma: 0.014,
        theta: 8.2,
        vega: -14.8,
      },
      variance: {
        delta: 0.2,
        gamma: -0.001,
        theta: -0.3,
        vega: 0.4,
      },
    },

    proposedAt,
    enteredAt,
    closedAt,

    // Execution quality metrics
    executionQuality: {
      score: 87.3, // 87.3% of theoretical captured
      entrySlippagePct: -2.5, // Lost 2.5% on entry
      exitSlippagePct: -1.2, // Lost 1.2% on exit
      totalSlippage: -45, // Total slippage cost
    },
  };

  return mockComparison;
}
