import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Proposals API - Get pending proposals
 *
 * GET /api/proposals?status=pending
 * Returns AI-generated trade proposals awaiting approval
 */

interface OptionLeg {
  strike: number;
  expiration: string;
  option_type: 'call' | 'put';
  side: 'buy' | 'sell';
  quantity: number;
}

interface Proposal {
  id: string;
  ticker: string;
  strategy_name: string;
  strategy_id: string;
  legs: OptionLeg[];
  entry_price: number;
  entry_tolerance: number;
  max_risk: number;
  max_profit: number;
  pop: number;
  breakevens: number[];
  ivp: number;
  approval_deadline: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  budget_required: number;
}

// Mock database (in production, use PostgreSQL)
let mockProposals: Proposal[] = [
  {
    id: 'prop_1',
    ticker: 'SPY',
    strategy_name: 'Iron Condor',
    strategy_id: 'strat_ic_001',
    legs: [
      { strike: 580, expiration: '2025-11-15', option_type: 'put', side: 'sell', quantity: 1 },
      { strike: 575, expiration: '2025-11-15', option_type: 'put', side: 'buy', quantity: 1 },
      { strike: 600, expiration: '2025-11-15', option_type: 'call', side: 'sell', quantity: 1 },
      { strike: 605, expiration: '2025-11-15', option_type: 'call', side: 'buy', quantity: 1 },
    ],
    entry_price: 1.25,
    entry_tolerance: 0.10,
    max_risk: -375,
    max_profit: 125,
    pop: 68.5,
    breakevens: [578.75, 601.25],
    ivp: 45.2,
    approval_deadline: new Date(Date.now() + 15 * 60000).toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
    budget_required: 375,
  },
  {
    id: 'prop_2',
    ticker: 'AAPL',
    strategy_name: 'Bull Put Spread',
    strategy_id: 'strat_bps_002',
    legs: [
      { strike: 230, expiration: '2025-10-20', option_type: 'put', side: 'sell', quantity: 2 },
      { strike: 225, expiration: '2025-10-20', option_type: 'put', side: 'buy', quantity: 2 },
    ],
    entry_price: 1.50,
    entry_tolerance: 0.15,
    max_risk: -700,
    max_profit: 300,
    pop: 72.3,
    breakevens: [228.50],
    ivp: 38.7,
    approval_deadline: new Date(Date.now() + 10 * 60000).toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
    budget_required: 700,
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { status } = req.query;

    let proposals = mockProposals;

    // Filter by status
    if (status) {
      proposals = proposals.filter((p) => p.status === status);
    }

    // Filter out expired proposals
    const now = new Date();
    proposals = proposals.filter((p) => new Date(p.approval_deadline) > now);

    return res.status(200).json({
      success: true,
      proposals,
      count: proposals.length,
    });
  }

  // Method not allowed
  res.setHeader('Allow', ['GET']);
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`,
  });
}
