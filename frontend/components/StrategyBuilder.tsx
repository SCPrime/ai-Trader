"use client";
import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Save, AlertCircle, CheckCircle } from 'lucide-react';

type StrategyType = 'under4-multileg' | 'custom' | null;

interface Under4Config {
  price_ceiling: number;
  min_last_price: number;
  max_positions: number;
  max_new_positions_per_day: number;
  risk: {
    max_daily_loss_pct: number;
    max_pos_risk_pct_of_equity: number;
  };
  buy_call: {
    delta_target: number;
    profit_target_pct: number;
    stop_loss_pct: number;
  };
  sell_put: {
    delta_target: number;
    profit_take_pct: number;
  };
  sizing: {
    per_trade_cash_pct: number;
    max_contracts_per_leg: number;
  };
}

const defaultConfig: Under4Config = {
  price_ceiling: 4.00,
  min_last_price: 0.75,
  max_positions: 8,
  max_new_positions_per_day: 3,
  risk: {
    max_daily_loss_pct: 2.0,
    max_pos_risk_pct_of_equity: 2.0
  },
  buy_call: {
    delta_target: 0.60,
    profit_target_pct: 50,
    stop_loss_pct: 35
  },
  sell_put: {
    delta_target: 0.20,
    profit_take_pct: 50
  },
  sizing: {
    per_trade_cash_pct: 4,
    max_contracts_per_leg: 5
  }
};

export default function StrategyBuilder() {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>(null);
  const [config, setConfig] = useState<Under4Config>(defaultConfig);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveStrategy = async () => {
    try {
      const response = await fetch('/api/proxy/strategies/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        },
        body: JSON.stringify({
          strategy_type: selectedStrategy,
          config: config
        })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error('Failed to save strategy');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="text-teal-400" size={32} />
            Strategy Builder
          </h1>
          <p className="text-slate-400">Configure your trading strategies</p>
        </div>

        {/* Strategy Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            onClick={() => setSelectedStrategy('under4-multileg')}
            className={`p-6 rounded-xl cursor-pointer transition-all ${
              selectedStrategy === 'under4-multileg'
                ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-2 border-teal-400'
                : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-500/20 rounded-lg">
                <DollarSign className="text-teal-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Under-$4 Multileg</h3>
                <p className="text-slate-300 text-sm">
                  Scan stocks ≤$4.00 and execute Buy Call + Sell Put legs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        {selectedStrategy === 'under4-multileg' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Configure Under-$4 Multileg</h2>
              <button
                onClick={handleSaveStrategy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  saved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                {saved ? 'Saved!' : 'Save Strategy'}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-400" size={20} />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Settings */}
              <div>
                <h3 className="text-lg font-semibold text-teal-400 mb-4">Basic Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Price Ceiling ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.price_ceiling}
                      onChange={(e) => setConfig({...config, price_ceiling: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Positions</label>
                    <input
                      type="number"
                      value={config.max_positions}
                      onChange={(e) => setConfig({...config, max_positions: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Risk Settings */}
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-4">Risk Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Daily Loss (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.risk.max_daily_loss_pct}
                      onChange={(e) => setConfig({
                        ...config,
                        risk: {...config.risk, max_daily_loss_pct: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Position Risk (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.risk.max_pos_risk_pct_of_equity}
                      onChange={(e) => setConfig({
                        ...config,
                        risk: {...config.risk, max_pos_risk_pct_of_equity: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Call/Put Settings */}
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4">Buy Call Settings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Delta Target</label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.buy_call.delta_target}
                      onChange={(e) => setConfig({
                        ...config,
                        buy_call: {...config.buy_call, delta_target: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Profit Target (%)</label>
                    <input
                      type="number"
                      value={config.buy_call.profit_target_pct}
                      onChange={(e) => setConfig({
                        ...config,
                        buy_call: {...config.buy_call, profit_target_pct: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Stop Loss (%)</label>
                    <input
                      type="number"
                      value={config.buy_call.stop_loss_pct}
                      onChange={(e) => setConfig({
                        ...config,
                        buy_call: {...config.buy_call, stop_loss_pct: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
