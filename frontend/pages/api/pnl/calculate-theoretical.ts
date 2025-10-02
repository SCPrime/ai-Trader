import type { NextApiRequest, NextApiResponse } from 'next';
import type { TheoreticalPayoff, PayoffPoint, Greeks, PositionLeg } from '@/types/pnl';

/**
 * Calculate Theoretical P&L Endpoint
 *
 * POST /api/pnl/calculate-theoretical
 *
 * Calculates theoretical payoff diagram, max profit/loss, breakevens,
 * and greeks for a given multi-leg options strategy
 */

interface CalculateTheoreticalRequest {
  symbol: string;
  underlyingPrice: number;
  legs: PositionLeg[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, underlyingPrice, legs }: CalculateTheoreticalRequest = req.body;

  if (!symbol || !underlyingPrice || !legs || legs.length === 0) {
    return res.status(400).json({ error: 'Missing required parameters: symbol, underlyingPrice, legs' });
  }

  try {
    // Calculate payoff curve
    const payoffCurve = calculatePayoffCurve(underlyingPrice, legs);

    // Find breakevens
    const breakevens = findBreakevens(payoffCurve);

    // Calculate max profit/loss
    const { maxProfit, maxLoss } = calculateMaxProfitLoss(payoffCurve);

    // Calculate probability of profit
    const pop = calculatePOP(payoffCurve, underlyingPrice);

    // Calculate aggregate greeks
    const greeks = calculateAggregateGreeks(legs);

    const result: TheoreticalPayoff = {
      symbol,
      underlyingPrice,
      payoffCurve,
      breakevens,
      maxProfit,
      maxLoss,
      pop,
      greeks,
      probabilityDistribution: generateProbabilityDistribution(underlyingPrice),
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Theoretical P&L calculation error:', error);
    res.status(500).json({
      error: 'Failed to calculate theoretical P&L',
      detail: String(error),
    });
  }
}

/**
 * Calculate payoff curve across price range
 */
function calculatePayoffCurve(underlyingPrice: number, legs: PositionLeg[]): PayoffPoint[] {
  const priceRange = underlyingPrice * 0.4; // ±40% from current price
  const minPrice = underlyingPrice - priceRange;
  const maxPrice = underlyingPrice + priceRange;
  const step = (maxPrice - minPrice) / 100;

  const payoffCurve: PayoffPoint[] = [];

  for (let price = minPrice; price <= maxPrice; price += step) {
    let totalPnl = 0;

    for (const leg of legs) {
      const legPnl = calculateLegPnL(leg, price);
      totalPnl += legPnl;
    }

    payoffCurve.push({ price, pnl: totalPnl });
  }

  return payoffCurve;
}

/**
 * Calculate P&L for a single leg at a given underlying price
 */
function calculateLegPnL(leg: PositionLeg, underlyingPrice: number): number {
  const multiplier = leg.side === 'BUY' ? 1 : -1;

  if (leg.type === 'STOCK') {
    // Stock: P&L = (current price - entry price) * qty
    const priceDiff = underlyingPrice - leg.theoreticalPrice;
    return multiplier * priceDiff * leg.qty;
  }

  // Options: intrinsic value at expiration - premium paid
  const strike = leg.strike || 0;
  let intrinsicValue = 0;

  if (leg.type === 'CALL') {
    intrinsicValue = Math.max(0, underlyingPrice - strike);
  } else if (leg.type === 'PUT') {
    intrinsicValue = Math.max(0, strike - underlyingPrice);
  }

  // P&L = (intrinsic value - premium paid) * qty * 100 (options multiplier)
  const pnl = (intrinsicValue - leg.theoreticalPrice) * leg.qty * 100;
  return multiplier * pnl;
}

/**
 * Find breakeven points where P&L crosses zero
 */
function findBreakevens(payoffCurve: PayoffPoint[]): number[] {
  const breakevens: number[] = [];

  for (let i = 1; i < payoffCurve.length; i++) {
    const prev = payoffCurve[i - 1];
    const curr = payoffCurve[i];

    // Check if P&L crosses zero between these two points
    if ((prev.pnl <= 0 && curr.pnl >= 0) || (prev.pnl >= 0 && curr.pnl <= 0)) {
      // Linear interpolation to find exact breakeven
      const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
      const breakeven = prev.price + ratio * (curr.price - prev.price);
      breakevens.push(breakeven);
    }
  }

  return breakevens;
}

/**
 * Calculate max profit and max loss from payoff curve
 */
function calculateMaxProfitLoss(payoffCurve: PayoffPoint[]): { maxProfit: number; maxLoss: number } {
  let maxProfit = -Infinity;
  let maxLoss = Infinity;

  for (const point of payoffCurve) {
    if (point.pnl > maxProfit) maxProfit = point.pnl;
    if (point.pnl < maxLoss) maxLoss = point.pnl;
  }

  return { maxProfit, maxLoss };
}

/**
 * Calculate probability of profit (simplified using normal distribution)
 */
function calculatePOP(payoffCurve: PayoffPoint[], underlyingPrice: number): number {
  // Count points where P&L > 0
  const profitablePoints = payoffCurve.filter(p => p.pnl > 0).length;
  const totalPoints = payoffCurve.length;

  // Simple approximation: percentage of profitable price points
  // In production, use options pricing model with IV
  const pop = (profitablePoints / totalPoints) * 100;

  return Math.round(pop * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate aggregate greeks for the position
 */
function calculateAggregateGreeks(legs: PositionLeg[]): Greeks {
  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;

  for (const leg of legs) {
    const multiplier = leg.side === 'BUY' ? 1 : -1;

    if (leg.type === 'STOCK') {
      // Stock has delta of 1 per share
      totalDelta += multiplier * leg.qty;
    } else {
      // Options: use mock greeks based on moneyness
      // In production, fetch actual greeks from options API
      const greeks = estimateGreeks(leg);
      totalDelta += multiplier * greeks.delta * leg.qty * 100;
      totalGamma += multiplier * greeks.gamma * leg.qty * 100;
      totalTheta += multiplier * greeks.theta * leg.qty * 100;
      totalVega += multiplier * greeks.vega * leg.qty * 100;
    }
  }

  return {
    delta: Math.round(totalDelta * 100) / 100,
    gamma: Math.round(totalGamma * 1000) / 1000,
    theta: Math.round(totalTheta * 100) / 100,
    vega: Math.round(totalVega * 100) / 100,
  };
}

/**
 * Estimate greeks for an option (simplified)
 */
function estimateGreeks(leg: PositionLeg): Greeks {
  // Mock greeks - in production, use Black-Scholes or fetch from API
  if (leg.type === 'CALL') {
    return {
      delta: 0.50,
      gamma: 0.02,
      theta: -0.05,
      vega: 0.15,
    };
  } else {
    return {
      delta: -0.50,
      gamma: 0.02,
      theta: -0.05,
      vega: 0.15,
    };
  }
}

/**
 * Generate probability distribution curve (normal distribution)
 */
function generateProbabilityDistribution(underlyingPrice: number): PayoffPoint[] {
  const priceRange = underlyingPrice * 0.4;
  const minPrice = underlyingPrice - priceRange;
  const maxPrice = underlyingPrice + priceRange;
  const step = (maxPrice - minPrice) / 100;

  const distribution: PayoffPoint[] = [];
  const sigma = underlyingPrice * 0.15; // 15% volatility assumption

  for (let price = minPrice; price <= maxPrice; price += step) {
    // Normal distribution probability density
    const z = (price - underlyingPrice) / sigma;
    const probability = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));

    distribution.push({
      price,
      pnl: probability * 1000, // Scale for visibility
    });
  }

  return distribution;
}
