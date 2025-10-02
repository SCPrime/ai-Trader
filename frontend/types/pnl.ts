/**
 * P&L Comparison Types
 *
 * Tracks theoretical (pre-trade) vs actual (execution) performance
 * for analyzing execution quality and strategy effectiveness
 */

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface TheoreticalMetrics {
  maxProfit: number;
  maxLoss: number;
  breakevens: number[];
  pop: number; // probability of profit (0-100)
  expectedValue: number;
  entryPrice: number; // theoretical mid price
  greeks: Greeks;
}

export interface ActualMetrics {
  entryPrice: number; // actual fill price
  entrySlippage: number; // vs theoretical (negative = worse fill)
  currentPL: number;
  unrealizedPL: number;
  realizedPL: number;
  greeks: Greeks;
}

export interface GreeksComparison {
  theoretical: Greeks;
  actual: Greeks;
  variance: Greeks; // actual - theoretical
}

export interface PLComparison {
  positionId: string;
  symbol: string;
  strategy: string;

  // Pre-trade (theoretical)
  theoretical: TheoreticalMetrics;

  // Actual execution
  actual: ActualMetrics;

  // Greeks comparison
  greeks: GreeksComparison;

  // Timestamps
  proposedAt: Date;
  enteredAt: Date;
  closedAt?: Date;

  // Execution quality metrics
  executionQuality?: {
    score: number; // 0-100, percentage of theoretical captured
    entrySlippagePct: number;
    exitSlippagePct?: number;
    totalSlippage: number;
  };
}

export interface PayoffPoint {
  price: number; // underlying price
  pnl: number; // profit/loss at that price
}

export interface TheoreticalPayoff {
  symbol: string;
  underlyingPrice: number;
  payoffCurve: PayoffPoint[];
  breakevens: number[];
  maxProfit: number;
  maxLoss: number;
  pop: number;
  greeks: Greeks;
  probabilityDistribution?: PayoffPoint[]; // probability at each price
}

export interface PositionTracking {
  positionId: string;
  symbol: string;
  strategy: string;
  legs: PositionLeg[];
  theoretical: TheoreticalMetrics;
  actual: ActualMetrics;
  lastUpdated: Date;
}

export interface PositionLeg {
  type: 'STOCK' | 'CALL' | 'PUT';
  side: 'BUY' | 'SELL';
  qty: number;
  strike?: number;
  expiration?: string;
  theoreticalPrice: number;
  actualPrice: number;
  currentPrice: number;
}

export interface PLSummaryStats {
  totalTrades: number;
  avgExecutionQuality: number; // average score across all closed positions
  totalSlippage: number; // cumulative slippage cost
  totalTheoreticalPL: number;
  totalActualPL: number;
  performanceGap: number; // actual - theoretical
  bestCapture: {
    positionId: string;
    score: number;
    strategy: string;
  };
  worstCapture: {
    positionId: string;
    score: number;
    strategy: string;
  };
  cumulativeReturns: {
    date: Date;
    theoretical: number;
    actual: number;
  }[];
  slippageAttribution: {
    entrySlippage: number;
    exitSlippage: number;
    greeksVariance: number;
    marketMovement: number;
  };
}

export type PLViewMode = 'pre-trade' | 'live-position' | 'historical';
