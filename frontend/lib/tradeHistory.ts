/**
 * Trade History Tracking System
 *
 * Provides performance tracking for strategies in autopilot mode.
 * All tracking is informational only - no enforcement or blocking.
 * User has full control over autopilot settings.
 */

export interface TradeRecord {
  id: string;
  userId: string; // Track which user made this trade
  strategy_id: string;
  strategy_version: number;
  ticker: string;
  entered_at: string;
  closed_at?: string;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  realized_pnl?: number;
  max_drawdown?: number;
  duration_days?: number;
  was_winner: boolean;
}

export interface StrategyPerformance {
  strategy_id: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_return: number;
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  avg_duration_days: number;
  last_updated: string;
}

/**
 * Mock trade history storage (in production, use database)
 */
let mockTradeHistory: TradeRecord[] = [];
let mockPerformanceCache: Record<string, StrategyPerformance> = {};

/**
 * Record a new trade
 */
export function recordTrade(trade: Omit<TradeRecord, 'id'>): TradeRecord {
  const newTrade: TradeRecord = {
    id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...trade,
  };

  mockTradeHistory.push(newTrade);

  // Invalidate performance cache for this strategy
  delete mockPerformanceCache[trade.strategy_id];

  return newTrade;
}

/**
 * Get all trades for a strategy
 */
export function getTradesForStrategy(strategyId: string, userId?: string): TradeRecord[] {
  let trades = mockTradeHistory.filter(trade => trade.strategy_id === strategyId);

  // Optionally filter by userId
  if (userId) {
    trades = trades.filter(trade => trade.userId === userId);
  }

  return trades;
}

/**
 * Get all trades for a user
 */
export function getTradesForUser(userId: string): TradeRecord[] {
  return mockTradeHistory.filter(trade => trade.userId === userId);
}

/**
 * Calculate performance metrics for a strategy
 */
export function getStrategyPerformance(strategyId: string): StrategyPerformance | null {
  // Check cache first
  if (mockPerformanceCache[strategyId]) {
    return mockPerformanceCache[strategyId];
  }

  const trades = getTradesForStrategy(strategyId);

  if (trades.length === 0) {
    return null;
  }

  // Filter to closed trades only
  const closedTrades = trades.filter(t => t.closed_at && t.realized_pnl !== undefined);

  if (closedTrades.length === 0) {
    return null;
  }

  // Calculate metrics
  const winningTrades = closedTrades.filter(t => t.was_winner).length;
  const losingTrades = closedTrades.length - winningTrades;
  const winRate = (winningTrades / closedTrades.length) * 100;

  const totalReturn = closedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
  const avgReturn = totalReturn / closedTrades.length;

  // Calculate Sharpe ratio (simplified - assumes risk-free rate = 0)
  const returns = closedTrades.map(t => t.realized_pnl || 0);
  const mean = avgReturn;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? mean / stdDev : 0;

  // Max drawdown
  const maxDrawdown = Math.min(...closedTrades.map(t => t.max_drawdown || 0), 0);

  // Average duration
  const avgDuration =
    closedTrades.reduce((sum, t) => sum + (t.duration_days || 0), 0) / closedTrades.length;

  const performance: StrategyPerformance = {
    strategy_id: strategyId,
    total_trades: closedTrades.length,
    winning_trades: winningTrades,
    losing_trades: losingTrades,
    win_rate: winRate,
    avg_return: avgReturn,
    total_return: totalReturn,
    sharpe_ratio: sharpeRatio,
    max_drawdown: maxDrawdown,
    avg_duration_days: avgDuration,
    last_updated: new Date().toISOString(),
  };

  // Cache the result
  mockPerformanceCache[strategyId] = performance;

  return performance;
}

/**
 * Check if strategy meets informational performance thresholds
 * Returns info object - does NOT block execution
 */
export function checkPerformanceInfo(
  strategyId: string,
  autopilotSettings?: {
    autopilot_if_win_rate_gt?: number;
    autopilot_if_sharpe_gt?: number;
    autopilot_max_dd_lt?: number;
  }
): {
  hasEnoughData: boolean;
  meetsThresholds: boolean;
  info: string[];
} {
  const performance = getStrategyPerformance(strategyId);

  if (!performance || performance.total_trades < 10) {
    return {
      hasEnoughData: false,
      meetsThresholds: false,
      info: [
        `Insufficient trade history (${performance?.total_trades || 0} trades). Recommend at least 10 closed trades for reliable performance data.`,
      ],
    };
  }

  const info: string[] = [];
  let meetsThresholds = true;

  if (autopilotSettings?.autopilot_if_win_rate_gt !== undefined) {
    if (performance.win_rate < autopilotSettings.autopilot_if_win_rate_gt) {
      meetsThresholds = false;
      info.push(
        `Win rate (${performance.win_rate.toFixed(1)}%) is below suggested threshold (${autopilotSettings.autopilot_if_win_rate_gt}%)`
      );
    } else {
      info.push(
        `Win rate (${performance.win_rate.toFixed(1)}%) meets suggested threshold (${autopilotSettings.autopilot_if_win_rate_gt}%)`
      );
    }
  }

  if (autopilotSettings?.autopilot_if_sharpe_gt !== undefined) {
    if (performance.sharpe_ratio < autopilotSettings.autopilot_if_sharpe_gt) {
      meetsThresholds = false;
      info.push(
        `Sharpe ratio (${performance.sharpe_ratio.toFixed(2)}) is below suggested threshold (${autopilotSettings.autopilot_if_sharpe_gt})`
      );
    } else {
      info.push(
        `Sharpe ratio (${performance.sharpe_ratio.toFixed(2)}) meets suggested threshold (${autopilotSettings.autopilot_if_sharpe_gt})`
      );
    }
  }

  if (autopilotSettings?.autopilot_max_dd_lt !== undefined) {
    if (Math.abs(performance.max_drawdown) > Math.abs(autopilotSettings.autopilot_max_dd_lt)) {
      meetsThresholds = false;
      info.push(
        `Max drawdown (${performance.max_drawdown.toFixed(2)}) exceeds suggested limit (${autopilotSettings.autopilot_max_dd_lt})`
      );
    } else {
      info.push(
        `Max drawdown (${performance.max_drawdown.toFixed(2)}) within suggested limit (${autopilotSettings.autopilot_max_dd_lt})`
      );
    }
  }

  return {
    hasEnoughData: true,
    meetsThresholds,
    info,
  };
}

/**
 * Seed mock data for testing (optional)
 */
export function seedMockTradeData(strategyId: string, userId: string) {
  // Generate 20 mock trades
  for (let i = 0; i < 20; i++) {
    const enteredAt = new Date(Date.now() - (20 - i) * 7 * 24 * 60 * 60 * 1000); // Weekly trades
    const closedAt = new Date(enteredAt.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 day hold
    const isWinner = Math.random() > 0.35; // 65% win rate
    const pnl = isWinner ? Math.random() * 500 + 100 : -(Math.random() * 300 + 50);

    recordTrade({
      userId,
      strategy_id: strategyId,
      strategy_version: 1,
      ticker: ['AAPL', 'MSFT', 'GOOGL', 'SPY', 'QQQ'][Math.floor(Math.random() * 5)],
      entered_at: enteredAt.toISOString(),
      closed_at: closedAt.toISOString(),
      entry_price: 100 + Math.random() * 50,
      exit_price: 100 + Math.random() * 50,
      quantity: 100,
      realized_pnl: pnl,
      max_drawdown: -Math.abs(Math.random() * 100),
      duration_days: 5,
      was_winner: isWinner,
    });
  }

  console.log(`Seeded ${strategyId} with 20 mock trades for user ${userId}`);
}

/**
 * Clear all trade history (for testing)
 */
export function clearTradeHistory() {
  mockTradeHistory = [];
  mockPerformanceCache = {};
}

/**
 * Export all trade history (for backup/analysis)
 */
export function exportTradeHistory(): TradeRecord[] {
  return [...mockTradeHistory];
}
