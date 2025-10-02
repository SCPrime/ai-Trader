'use client';

import { useState, useEffect } from 'react';
import type { PLSummaryStats } from '@/types/pnl';

/**
 * P&L Summary Dashboard
 *
 * Displays aggregate execution quality statistics across all positions:
 * - Average execution quality score
 * - Total slippage costs
 * - Best/worst captures
 * - Cumulative returns comparison
 * - Slippage attribution breakdown
 */

export default function PLSummaryDashboard() {
  const [stats, setStats] = useState<PLSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchSummaryStats(timeframe);
  }, [timeframe]);

  const fetchSummaryStats = async (period: string) => {
    setLoading(true);
    try {
      // In production, fetch from API
      // const response = await fetch(`/api/pnl/summary?period=${period}`);
      // const data = await response.json();

      // Mock data
      const mockStats: PLSummaryStats = {
        totalTrades: 23,
        avgExecutionQuality: 84.6,
        totalSlippage: -1247,
        totalTheoreticalPL: 8950,
        totalActualPL: 7703,
        performanceGap: -1247,
        bestCapture: {
          positionId: 'pos_123',
          score: 96.8,
          strategy: 'Iron Condor',
        },
        worstCapture: {
          positionId: 'pos_456',
          score: 62.3,
          strategy: 'Put Credit Spread',
        },
        cumulativeReturns: [
          { date: new Date('2025-01-01'), theoretical: 0, actual: 0 },
          { date: new Date('2025-01-08'), theoretical: 1200, actual: 1050 },
          { date: new Date('2025-01-15'), theoretical: 2800, actual: 2400 },
          { date: new Date('2025-01-22'), theoretical: 4500, actual: 3850 },
          { date: new Date('2025-01-29'), theoretical: 6200, actual: 5300 },
          { date: new Date('2025-02-05'), theoretical: 7400, actual: 6350 },
          { date: new Date('2025-02-12'), theoretical: 8950, actual: 7703 },
        ],
        slippageAttribution: {
          entrySlippage: -687,
          exitSlippage: -423,
          greeksVariance: -95,
          marketMovement: -42,
        },
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch summary stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-6">
        <div className="text-center text-slate-400">Loading summary statistics...</div>
      </div>
    );
  }

  const captureRate = (stats.totalActualPL / stats.totalTheoreticalPL) * 100;

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-cyan-400">📊 Execution Quality Summary</h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeframe === period
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {period === 'all' ? 'All Time' : period.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <div className="text-xs text-purple-400 mb-1">Avg Execution Score</div>
          <div className="text-2xl font-bold text-purple-300">
            {stats.avgExecutionQuality.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">{stats.totalTrades} trades</div>
        </div>

        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="text-xs text-green-400 mb-1">Theoretical P&L</div>
          <div className="text-2xl font-bold text-green-300">
            ${stats.totalTheoreticalPL.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">100% capture</div>
        </div>

        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <div className="text-xs text-cyan-400 mb-1">Actual P&L</div>
          <div className="text-2xl font-bold text-cyan-300">
            ${stats.totalActualPL.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">{captureRate.toFixed(1)}% capture</div>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="text-xs text-red-400 mb-1">Total Slippage</div>
          <div className="text-2xl font-bold text-red-300">
            ${Math.abs(stats.totalSlippage).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">cost</div>
        </div>
      </div>

      {/* Best/Worst Captures */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-800/50 border border-green-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-green-400">🏆 Best Capture</div>
            <div className="text-xl font-bold text-green-300">{stats.bestCapture.score.toFixed(1)}%</div>
          </div>
          <div className="text-xs text-slate-400">
            {stats.bestCapture.strategy} • {stats.bestCapture.positionId}
          </div>
        </div>

        <div className="p-4 bg-slate-800/50 border border-red-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-red-400">📉 Worst Capture</div>
            <div className="text-xl font-bold text-red-300">{stats.worstCapture.score.toFixed(1)}%</div>
          </div>
          <div className="text-xs text-slate-400">
            {stats.worstCapture.strategy} • {stats.worstCapture.positionId}
          </div>
        </div>
      </div>

      {/* Cumulative Returns Chart */}
      <div className="mb-6 p-4 bg-slate-800/50 border border-white/10 rounded-xl">
        <h4 className="text-sm font-semibold text-slate-300 mb-4">
          Cumulative Returns: Theoretical vs Actual
        </h4>
        <div className="relative h-48">
          {/* Simple line chart representation */}
          <svg className="w-full h-full" viewBox="0 0 600 180">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 45}
                x2="600"
                y2={i * 45}
                stroke="#1e293b"
                strokeWidth="1"
              />
            ))}

            {/* Theoretical line (green) */}
            <polyline
              points={stats.cumulativeReturns
                .map((point, index) => {
                  const x = (index / (stats.cumulativeReturns.length - 1)) * 600;
                  const y = 180 - (point.theoretical / stats.totalTheoreticalPL) * 160;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />

            {/* Actual line (cyan) */}
            <polyline
              points={stats.cumulativeReturns
                .map((point, index) => {
                  const x = (index / (stats.cumulativeReturns.length - 1)) * 600;
                  const y = 180 - (point.actual / stats.totalTheoreticalPL) * 160;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          </svg>

          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500" />
              <span className="text-slate-400">Theoretical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-cyan-500 border-dashed" />
              <span className="text-slate-400">Actual</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slippage Attribution */}
      <div className="p-4 bg-slate-800/50 border border-white/10 rounded-xl">
        <h4 className="text-sm font-semibold text-slate-300 mb-4">
          Performance Gap Attribution (${Math.abs(stats.performanceGap).toLocaleString()})
        </h4>
        <div className="space-y-3">
          {Object.entries(stats.slippageAttribution).map(([key, value]) => {
            const percentage = (Math.abs(value) / Math.abs(stats.performanceGap)) * 100;
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());

            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-red-400">
                    ${Math.abs(value).toLocaleString()} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <div className="text-sm font-semibold text-yellow-400 mb-1">Insights</div>
            <div className="text-xs text-slate-300">
              Your average execution quality of {stats.avgExecutionQuality.toFixed(1)}% is{' '}
              {stats.avgExecutionQuality >= 85 ? 'excellent' : stats.avgExecutionQuality >= 75 ? 'good' : 'below target'}.
              Entry slippage accounts for {((Math.abs(stats.slippageAttribution.entrySlippage) / Math.abs(stats.performanceGap)) * 100).toFixed(0)}%
              of the performance gap. Consider using limit orders or trading during higher liquidity hours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
