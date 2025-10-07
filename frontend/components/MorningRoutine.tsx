"use client";
import React, { useState } from 'react';
import { Sun, Play, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

export default function MorningRoutine() {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('under4-multileg');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunRoutine = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/proxy/strategies/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        },
        body: JSON.stringify({
          strategy_type: selectedStrategy,
          dry_run: true
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results);

    } catch (err: any) {
      setError(err.message || 'Failed to run morning routine');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Sun className="text-amber-400" size={32} />
            Morning Routine
          </h1>
          <p className="text-slate-400">
            Execute your daily market analysis and trade setup
          </p>
        </div>

        {/* Strategy Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Strategy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedStrategy('under4-multileg')}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedStrategy === 'under4-multileg'
                  ? 'bg-teal-500/20 border-2 border-teal-400'
                  : 'bg-slate-700/30 border border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <DollarSign className="text-teal-400" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Under-$4 Multileg</h3>
                  <p className="text-sm text-slate-300">Scan stocks ≤$4 and execute Buy Call + Sell Put legs</p>
                </div>
                {selectedStrategy === 'under4-multileg' && (
                  <CheckCircle className="text-teal-400" size={20} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={handleRunRoutine}
            disabled={isRunning}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg text-white ${
              isRunning
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/30'
            }`}
          >
            <Play size={24} />
            {isRunning ? 'Running Morning Routine...' : 'Run Morning Routine (Dry Run)'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-red-400 mb-1">Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-400" size={24} />
                Scan Results
              </h2>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Top Candidates ({results.candidates?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.candidates?.map((symbol: string) => (
                    <span
                      key={symbol}
                      className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-mono"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {results.proposals && results.proposals.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Proposed Trades ({results.proposals.length})
                </h2>

                <div className="space-y-3">
                  {results.proposals.map((trade: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        trade.type === 'BUY_CALL'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-orange-500/10 border-orange-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.type === 'BUY_CALL'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-orange-500/20 text-orange-300'
                          }`}>
                            {trade.type.replace('_', ' ')}
                          </span>
                          <span className="text-white font-semibold font-mono">
                            {trade.symbol}
                          </span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-slate-300">
                            Strike: ${trade.strike} | Exp: {trade.expiry}
                          </div>
                          <div className="text-slate-400">
                            Δ {trade.delta} | Qty: {trade.qty}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
