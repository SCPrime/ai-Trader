'use client';

import { useState } from 'react';

/**
 * Strategy Suggestions Modal
 *
 * Displays AI-generated strategy recommendations with:
 * - Side-by-side comparison
 * - Confidence scores and reasoning
 * - Risk metrics and breakevens
 * - One-click approval to create proposal
 */

interface StrategyLeg {
  type: 'STOCK' | 'CALL' | 'PUT';
  side: 'BUY' | 'SELL';
  qty?: number;
  strike?: number;
  dte?: number;
  delta?: number;
}

interface StrategySuggestion {
  strategyId: string;
  strategyName: string;
  confidence: number;
  reasoning: string;
  proposedLegs: StrategyLeg[];
  maxRisk: number;
  maxProfit: number;
  breakevens: number[];
  riskRewardRatio: number;
}

interface StrategySuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  suggestions: StrategySuggestion[];
  analysis: {
    technicalSetup: string;
    ivEnvironment: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  onApprove: (strategyId: string) => void;
}

export default function StrategySuggestionsModal({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  suggestions,
  analysis,
  onApprove,
}: StrategySuggestionsModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  if (!isOpen) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-400';
    if (confidence >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-white/20 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-cyan-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                🤖 AI Strategy Recommendations
              </h2>
              <p className="text-sm text-slate-300">
                {symbol} @ ${currentPrice.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="px-6 py-4 bg-slate-900/50 border-b border-white/10">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Technical Setup</div>
              <div className="text-sm font-medium text-cyan-400">{analysis.technicalSetup}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">IV Environment</div>
              <div className="text-sm font-medium text-purple-400">{analysis.ivEnvironment}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Risk Level</div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(analysis.riskLevel)}`}>
                {analysis.riskLevel.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions Grid */}
        <div className="flex-1 overflow-auto p-6">
          {suggestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🤔</div>
              <div className="text-lg text-slate-300 mb-2">No suitable strategies found</div>
              <div className="text-sm text-slate-400">
                Current market conditions don't align well with available strategies.
                Try adjusting your filters or checking back later.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.strategyId}
                  className={`bg-slate-900/60 border rounded-xl p-4 transition-all cursor-pointer ${
                    selectedStrategy === suggestion.strategyId
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  onClick={() => setSelectedStrategy(suggestion.strategyId)}
                >
                  {/* Strategy Name & Confidence */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white pr-2">
                        {suggestion.strategyName}
                      </h3>
                      <div className={`text-2xl font-bold ${getConfidenceColor(suggestion.confidence)}`}>
                        {suggestion.confidence}%
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {suggestion.strategyId}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-white/5">
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {suggestion.reasoning}
                    </div>
                  </div>

                  {/* Proposed Legs */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-slate-400 mb-2">Proposed Legs:</div>
                    <div className="space-y-1">
                      {suggestion.proposedLegs.map((leg, idx) => (
                        <div
                          key={idx}
                          className="text-xs px-2 py-1 bg-slate-800/50 rounded flex items-center justify-between"
                        >
                          <span className={leg.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                            {leg.side} {leg.type}
                          </span>
                          <span className="text-slate-300">
                            {leg.strike ? `$${leg.strike.toFixed(0)}` : ''}
                            {leg.dte ? ` ${leg.dte}DTE` : ''}
                            {leg.delta ? ` Δ${leg.delta.toFixed(2)}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Metrics */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                      <div className="text-xs text-red-400 mb-1">Max Risk</div>
                      <div className="text-sm font-bold text-red-300">
                        ${suggestion.maxRisk.toFixed(0)}
                      </div>
                    </div>
                    <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
                      <div className="text-xs text-green-400 mb-1">Max Profit</div>
                      <div className="text-sm font-bold text-green-300">
                        ${suggestion.maxProfit.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* Breakevens */}
                  <div className="mb-3">
                    <div className="text-xs text-slate-400 mb-1">Breakeven(s):</div>
                    <div className="text-xs text-cyan-400 font-mono">
                      {suggestion.breakevens.map(be => `$${be.toFixed(2)}`).join(', ')}
                    </div>
                  </div>

                  {/* Risk/Reward Ratio */}
                  <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded">
                    <div className="text-xs text-purple-400 mb-1">Risk/Reward Ratio</div>
                    <div className="text-sm font-bold text-purple-300">
                      1:{suggestion.riskRewardRatio.toFixed(2)}
                    </div>
                  </div>

                  {/* Use This Strategy Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(suggestion.strategyId);
                    }}
                    className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all"
                  >
                    ✓ Use This Strategy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
