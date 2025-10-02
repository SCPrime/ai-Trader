'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData } from 'lightweight-charts';
import type { TheoreticalPayoff, PLComparison, PositionTracking, PLViewMode } from '@/types/pnl';

/**
 * P&L Comparison Chart
 *
 * Displays theoretical vs actual P&L with three view modes:
 * - Pre-Trade: Theoretical payoff diagram with breakevens and probability
 * - Live Position: Side-by-side comparison of theoretical vs current actual
 * - Post-Trade: Final comparison with execution quality analysis
 */

interface PLComparisonChartProps {
  mode: PLViewMode;
  theoreticalPayoff?: TheoreticalPayoff;
  positionTracking?: PositionTracking;
  comparison?: PLComparison;
  onSaveBaseline?: () => void;
}

export default function PLComparisonChart({
  mode,
  theoreticalPayoff,
  positionTracking,
  comparison,
  onSaveBaseline,
}: PLComparisonChartProps) {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Auto-refresh for live positions
  useEffect(() => {
    if (mode === 'live-position' && autoRefresh) {
      const interval = setInterval(() => {
        // Trigger refresh - in production, refetch position data
        console.log('Refreshing live position data...');
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [mode, autoRefresh]);

  // Render chart based on mode
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    if (mode === 'pre-trade' && theoreticalPayoff) {
      renderPreTradeView(chartContainerRef.current, theoreticalPayoff);
    } else if (mode === 'live-position' && positionTracking) {
      renderLivePositionView(chartContainerRef.current, positionTracking);
    } else if (mode === 'historical' && comparison) {
      renderPostTradeView(chartContainerRef.current, comparison);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [mode, theoreticalPayoff, positionTracking, comparison]);

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-cyan-400">
          {mode === 'pre-trade' && '📊 Theoretical Payoff Diagram'}
          {mode === 'live-position' && '⚡ Live Position Tracking'}
          {mode === 'historical' && '📈 Post-Trade Analysis'}
        </h4>
        <div className="flex gap-2">
          {mode === 'live-position' && (
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                autoRefresh
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {autoRefresh ? '🔄 Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </button>
          )}
          {mode === 'pre-trade' && onSaveBaseline && (
            <button
              onClick={onSaveBaseline}
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-all"
            >
              💾 Save as Baseline
            </button>
          )}
        </div>
      </div>

      {/* Pre-Trade Metrics */}
      {mode === 'pre-trade' && theoreticalPayoff && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-xs text-green-400 mb-1">Max Profit</div>
            <div className="text-lg font-bold text-green-300">
              ${theoreticalPayoff.maxProfit.toFixed(0)}
            </div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-xs text-red-400 mb-1">Max Loss</div>
            <div className="text-lg font-bold text-red-300">
              ${Math.abs(theoreticalPayoff.maxLoss).toFixed(0)}
            </div>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <div className="text-xs text-cyan-400 mb-1">Breakevens</div>
            <div className="text-sm font-bold text-cyan-300">
              {theoreticalPayoff.breakevens.map(be => `$${be.toFixed(2)}`).join(', ')}
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="text-xs text-purple-400 mb-1">P.O.P.</div>
            <div className="text-lg font-bold text-purple-300">
              {theoreticalPayoff.pop.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Live Position Metrics */}
      {mode === 'live-position' && positionTracking && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-800/50 border border-white/10 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Entry Fill</div>
            <div className="text-lg font-bold text-white">
              ${positionTracking.actual.entryPrice.toFixed(2)}
            </div>
            <div className={`text-xs ${positionTracking.actual.entrySlippage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {positionTracking.actual.entrySlippage >= 0 ? '+' : ''}
              ${positionTracking.actual.entrySlippage.toFixed(0)} slippage
            </div>
          </div>
          <div className={`p-3 border rounded-lg ${
            positionTracking.actual.currentPL >= 0
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className={`text-xs mb-1 ${positionTracking.actual.currentPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Current P&L
            </div>
            <div className={`text-lg font-bold ${positionTracking.actual.currentPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              ${positionTracking.actual.currentPL.toFixed(0)}
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-white/10 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Delta</div>
            <div className="text-lg font-bold text-white">
              {positionTracking.actual.greeks.delta.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">
              Θ: {positionTracking.actual.greeks.theta.toFixed(2)}
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-white/10 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">vs Theoretical</div>
            <div className="text-sm font-bold text-cyan-300">
              {((positionTracking.actual.currentPL / positionTracking.theoretical.expectedValue) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">captured</div>
          </div>
        </div>
      )}

      {/* Post-Trade Metrics */}
      {mode === 'historical' && comparison && comparison.executionQuality && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="text-xs text-purple-400 mb-1">Execution Score</div>
            <div className="text-xl font-bold text-purple-300">
              {comparison.executionQuality.score.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-white/10 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Theoretical</div>
            <div className="text-lg font-bold text-white">
              ${comparison.theoretical.maxProfit.toFixed(0)}
            </div>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-xs text-green-400 mb-1">Actual P&L</div>
            <div className="text-lg font-bold text-green-300">
              ${comparison.actual.realizedPL.toFixed(0)}
            </div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-xs text-red-400 mb-1">Total Slippage</div>
            <div className="text-lg font-bold text-red-300">
              ${Math.abs(comparison.executionQuality.totalSlippage).toFixed(0)}
            </div>
          </div>
          <div className="p-3 bg-slate-800/50 border border-white/10 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Duration</div>
            <div className="text-sm font-bold text-white">
              {comparison.closedAt &&
                Math.floor((new Date(comparison.closedAt).getTime() - new Date(comparison.enteredAt).getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />

      {/* Greeks Comparison (Live/Post-Trade) */}
      {(mode === 'live-position' || mode === 'historical') && (
        <div className="mt-4 p-4 bg-slate-800/50 border border-white/10 rounded-lg">
          <h5 className="text-sm font-semibold text-slate-300 mb-3">Greeks Variance</h5>
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-slate-400 mb-1">Delta</div>
              <div className="font-mono text-cyan-400">
                {mode === 'live-position' && positionTracking
                  ? (positionTracking.actual.greeks.delta - positionTracking.theoretical.greeks.delta).toFixed(2)
                  : comparison?.greeks.variance.delta.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Gamma</div>
              <div className="font-mono text-cyan-400">
                {mode === 'live-position' && positionTracking
                  ? (positionTracking.actual.greeks.gamma - positionTracking.theoretical.greeks.gamma).toFixed(3)
                  : comparison?.greeks.variance.gamma.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Theta</div>
              <div className="font-mono text-cyan-400">
                {mode === 'live-position' && positionTracking
                  ? (positionTracking.actual.greeks.theta - positionTracking.theoretical.greeks.theta).toFixed(2)
                  : comparison?.greeks.variance.theta.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Vega</div>
              <div className="font-mono text-cyan-400">
                {mode === 'live-position' && positionTracking
                  ? (positionTracking.actual.greeks.vega - positionTracking.theoretical.greeks.vega).toFixed(2)
                  : comparison?.greeks.variance.vega.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Render pre-trade theoretical payoff diagram
 */
function renderPreTradeView(container: HTMLDivElement, payoff: TheoreticalPayoff) {
  const chart = createChart(container, {
    width: container.clientWidth,
    height: 400,
    layout: {
      background: { color: '#0f172a' },
      textColor: '#94a3b8',
    },
    grid: {
      vertLines: { color: '#1e293b' },
      horzLines: { color: '#1e293b' },
    },
    rightPriceScale: {
      borderColor: '#334155',
    },
    timeScale: {
      visible: false,
    },
  });

  // Payoff curve
  const payoffSeries = chart.addLineSeries({
    color: '#06b6d4',
    lineWidth: 3,
    title: 'Payoff at Expiration',
  });

  const payoffData: LineData[] = payoff.payoffCurve.map((point, index) => ({
    time: index as any,
    value: point.pnl,
  }));

  payoffSeries.setData(payoffData);

  // Zero line
  const zeroSeries = chart.addLineSeries({
    color: '#64748b',
    lineWidth: 1,
    lineStyle: 2, // Dashed
  });

  zeroSeries.setData(
    payoffData.map(point => ({
      time: point.time,
      value: 0,
    }))
  );

  // Probability distribution (if available)
  if (payoff.probabilityDistribution) {
    const probSeries = chart.addAreaSeries({
      topColor: 'rgba(139, 92, 246, 0.4)',
      bottomColor: 'rgba(139, 92, 246, 0.0)',
      lineColor: 'rgba(139, 92, 246, 0.8)',
      lineWidth: 1,
    });

    const probData: LineData[] = payoff.probabilityDistribution.map((point, index) => ({
      time: index as any,
      value: point.pnl * 100, // Scale probability
    }));

    probSeries.setData(probData);
  }

  chart.timeScale().fitContent();
}

/**
 * Render live position view (theoretical vs actual)
 */
function renderLivePositionView(container: HTMLDivElement, position: PositionTracking) {
  // For live view, show simple P&L comparison bars
  // In production, render side-by-side payoff curves
  const mockData = `
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="text-slate-400 mb-2">Live position tracking chart</div>
        <div class="text-sm text-slate-500">Shows real-time P&L vs theoretical baseline</div>
      </div>
    </div>
  `;
  container.innerHTML = mockData;
}

/**
 * Render post-trade analysis view
 */
function renderPostTradeView(container: HTMLDivElement, comparison: PLComparison) {
  // Render bar chart showing theoretical vs actual breakdown
  const mockData = `
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="text-slate-400 mb-2">Post-trade analysis chart</div>
        <div class="text-sm text-slate-500">Final P&L breakdown with slippage attribution</div>
      </div>
    </div>
  `;
  container.innerHTML = mockData;
}
