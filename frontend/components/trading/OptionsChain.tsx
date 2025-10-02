'use client';

import { useState, useEffect } from 'react';

/**
 * Options Chain Viewer
 *
 * Displays options chain with calls/puts, greeks, and IV
 * Features: Strike selection, expiration picker, ITM/ATM/OTM filtering
 */

interface OptionQuote {
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  last: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  impliedVolatility: number;
}

interface OptionsChainData {
  symbol: string;
  underlyingPrice: number;
  expirations: string[];
  chains: {
    strike: number;
    call: OptionQuote | null;
    put: OptionQuote | null;
  }[];
}

interface OptionsChainProps {
  symbol: string;
  onStrikeSelect?: (strike: number, type: 'call' | 'put') => void;
}

type MoneyFilter = 'all' | 'itm' | 'atm' | 'otm';
type SortBy = 'strike' | 'volume' | 'oi' | 'iv' | 'delta';

export default function OptionsChain({ symbol, onStrikeSelect }: OptionsChainProps) {
  const [loading, setLoading] = useState(false);
  const [chainData, setChainData] = useState<OptionsChainData | null>(null);
  const [selectedExpiration, setSelectedExpiration] = useState<string>('');
  const [selectedStrike, setSelectedStrike] = useState<{ strike: number; type: 'call' | 'put' } | null>(null);
  const [moneyFilter, setMoneyFilter] = useState<MoneyFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('strike');
  const [minOI, setMinOI] = useState(100);
  const [maxSpreadPct, setMaxSpreadPct] = useState(10);

  useEffect(() => {
    if (symbol) {
      fetchOptionsChain(symbol, selectedExpiration);
    }
  }, [symbol, selectedExpiration]);

  const fetchOptionsChain = async (sym: string, exp?: string) => {
    setLoading(true);
    try {
      const url = `/api/market/options-chain?symbol=${sym}${exp ? `&expiration=${exp}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch options chain: ${response.statusText}`);
      }
      const data: OptionsChainData = await response.json();
      setChainData(data);

      // Auto-select first expiration if not set
      if (!selectedExpiration && data.expirations.length > 0) {
        setSelectedExpiration(data.expirations[2] || data.expirations[0]);
      }
    } catch (error) {
      console.error('Options chain fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStrikeClick = (strike: number, type: 'call' | 'put') => {
    setSelectedStrike({ strike, type });
    onStrikeSelect?.(strike, type);
  };

  const getMoneyness = (strike: number): 'itm' | 'atm' | 'otm' => {
    if (!chainData) return 'otm';
    const diff = Math.abs(strike - chainData.underlyingPrice);
    if (diff < 2.5) return 'atm';
    if (strike < chainData.underlyingPrice) return 'itm'; // Call ITM
    return 'otm';
  };

  const getSpreadPct = (bid: number, ask: number): number => {
    const mid = (bid + ask) / 2;
    if (mid === 0) return 0;
    return ((ask - bid) / mid) * 100;
  };

  const filteredChains = chainData?.chains
    .filter(chain => {
      // Filter by OI
      const callOI = chain.call?.openInterest || 0;
      const putOI = chain.put?.openInterest || 0;
      if (callOI < minOI && putOI < minOI) return false;

      // Filter by spread
      const callSpread = chain.call ? getSpreadPct(chain.call.bid, chain.call.ask) : 0;
      const putSpread = chain.put ? getSpreadPct(chain.put.bid, chain.put.ask) : 0;
      if (callSpread > maxSpreadPct && putSpread > maxSpreadPct) return false;

      // Filter by moneyness
      if (moneyFilter !== 'all') {
        const moneyness = getMoneyness(chain.strike);
        if (moneyness !== moneyFilter) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return (b.call?.volume || 0) + (b.put?.volume || 0) - (a.call?.volume || 0) - (a.put?.volume || 0);
        case 'oi':
          return (b.call?.openInterest || 0) + (b.put?.openInterest || 0) - (a.call?.openInterest || 0) - (a.put?.openInterest || 0);
        case 'iv':
          return (b.call?.impliedVolatility || 0) - (a.call?.impliedVolatility || 0);
        case 'delta':
          return Math.abs(b.call?.delta || 0) - Math.abs(a.call?.delta || 0);
        case 'strike':
        default:
          return a.strike - b.strike;
      }
    }) || [];

  if (!chainData) {
    return (
      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-6 text-center">
        <div className="text-slate-400 text-sm">
          {loading ? 'Loading options chain...' : 'Enter a symbol to view options chain'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-slate-200">Options Chain</h4>
          <div className="text-sm text-slate-400">
            Underlying: <span className="text-cyan-400 font-bold">${chainData.underlyingPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Expiration Selector */}
        <div className="flex gap-2 mb-3">
          <select
            value={selectedExpiration}
            onChange={e => setSelectedExpiration(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-700/50 border border-white/20 rounded-lg text-slate-100 text-sm outline-none focus:border-cyan-400"
          >
            {chainData.expirations.map(exp => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Moneyness</label>
            <div className="flex gap-1">
              {(['all', 'itm', 'atm', 'otm'] as MoneyFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setMoneyFilter(filter)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    moneyFilter === filter
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="w-full px-2 py-1 bg-slate-700/50 border border-white/20 rounded text-slate-100 text-xs outline-none focus:border-cyan-400"
            >
              <option value="strike">Strike</option>
              <option value="volume">Volume</option>
              <option value="oi">Open Interest</option>
              <option value="iv">IV</option>
              <option value="delta">Delta</option>
            </select>
          </div>
        </div>

        {/* Min OI / Max Spread */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Min OI</label>
            <input
              type="number"
              value={minOI}
              onChange={e => setMinOI(parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 bg-slate-700/50 border border-white/20 rounded text-slate-100 text-xs outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Max Spread %</label>
            <input
              type="number"
              value={maxSpreadPct}
              onChange={e => setMaxSpreadPct(parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 bg-slate-700/50 border border-white/20 rounded text-slate-100 text-xs outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Options Table */}
      <div className="overflow-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="bg-slate-800/80 sticky top-0 z-10">
            <tr>
              <th colSpan={7} className="px-2 py-2 text-left text-green-400 border-r border-white/10">
                CALLS
              </th>
              <th className="px-2 py-2 text-center font-bold text-slate-200 bg-slate-700/50">Strike</th>
              <th colSpan={7} className="px-2 py-2 text-right text-red-400 border-l border-white/10">
                PUTS
              </th>
            </tr>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="px-2 py-1 text-right">Last</th>
              <th className="px-2 py-1 text-right">Bid/Ask</th>
              <th className="px-2 py-1 text-right">Vol</th>
              <th className="px-2 py-1 text-right">OI</th>
              <th className="px-2 py-1 text-right">Delta</th>
              <th className="px-2 py-1 text-right">IV</th>
              <th className="px-2 py-1 text-right border-r border-white/10">Theta</th>
              <th className="px-2 py-1 text-center font-bold bg-slate-700/50">$</th>
              <th className="px-2 py-1 text-left border-l border-white/10">Theta</th>
              <th className="px-2 py-1 text-left">IV</th>
              <th className="px-2 py-1 text-left">Delta</th>
              <th className="px-2 py-1 text-left">OI</th>
              <th className="px-2 py-1 text-left">Vol</th>
              <th className="px-2 py-1 text-left">Bid/Ask</th>
              <th className="px-2 py-1 text-left">Last</th>
            </tr>
          </thead>
          <tbody>
            {filteredChains.map(chain => {
              const moneyness = getMoneyness(chain.strike);
              const isSelected = selectedStrike?.strike === chain.strike;

              let rowBg = 'hover:bg-slate-800/50';
              if (moneyness === 'atm') rowBg = 'bg-yellow-500/10 hover:bg-yellow-500/20';
              else if (moneyness === 'itm') rowBg = 'bg-green-500/5 hover:bg-green-500/10';

              if (isSelected) rowBg += ' ring-2 ring-cyan-400';

              const callSpread = chain.call ? getSpreadPct(chain.call.bid, chain.call.ask) : 0;
              const putSpread = chain.put ? getSpreadPct(chain.put.bid, chain.put.ask) : 0;

              return (
                <tr key={chain.strike} className={`border-b border-white/5 ${rowBg} transition-colors`}>
                  {/* CALL DATA */}
                  <td
                    className="px-2 py-2 text-right text-slate-200 cursor-pointer hover:text-green-400"
                    onClick={() => chain.call && handleStrikeClick(chain.strike, 'call')}
                  >
                    {chain.call ? `$${chain.call.last.toFixed(2)}` : '-'}
                  </td>
                  <td className={`px-2 py-2 text-right text-xs ${callSpread > 10 ? 'text-red-400' : 'text-slate-400'}`}>
                    {chain.call ? `${chain.call.bid.toFixed(2)}/${chain.call.ask.toFixed(2)}` : '-'}
                  </td>
                  <td className={`px-2 py-2 text-right ${chain.call && chain.call.volume > 1000 ? 'font-bold text-slate-100' : 'text-slate-400'}`}>
                    {chain.call ? chain.call.volume.toLocaleString() : '-'}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-400">
                    {chain.call ? chain.call.openInterest.toLocaleString() : '-'}
                  </td>
                  <td className="px-2 py-2 text-right text-green-400 font-medium">
                    {chain.call ? chain.call.delta.toFixed(2) : '-'}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-300">
                    {chain.call ? (chain.call.impliedVolatility * 100).toFixed(1) + '%' : '-'}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-400 border-r border-white/10">
                    {chain.call ? chain.call.theta.toFixed(3) : '-'}
                  </td>

                  {/* STRIKE */}
                  <td className="px-2 py-2 text-center font-bold text-slate-100 bg-slate-700/50">
                    ${chain.strike.toFixed(2)}
                  </td>

                  {/* PUT DATA */}
                  <td className="px-2 py-2 text-left text-slate-400 border-l border-white/10">
                    {chain.put ? chain.put.theta.toFixed(3) : '-'}
                  </td>
                  <td className="px-2 py-2 text-left text-slate-300">
                    {chain.put ? (chain.put.impliedVolatility * 100).toFixed(1) + '%' : '-'}
                  </td>
                  <td className="px-2 py-2 text-left text-red-400 font-medium">
                    {chain.put ? chain.put.delta.toFixed(2) : '-'}
                  </td>
                  <td className="px-2 py-2 text-left text-slate-400">
                    {chain.put ? chain.put.openInterest.toLocaleString() : '-'}
                  </td>
                  <td className={`px-2 py-2 text-left ${chain.put && chain.put.volume > 1000 ? 'font-bold text-slate-100' : 'text-slate-400'}`}>
                    {chain.put ? chain.put.volume.toLocaleString() : '-'}
                  </td>
                  <td className={`px-2 py-2 text-left text-xs ${putSpread > 10 ? 'text-red-400' : 'text-slate-400'}`}>
                    {chain.put ? `${chain.put.bid.toFixed(2)}/${chain.put.ask.toFixed(2)}` : '-'}
                  </td>
                  <td
                    className="px-2 py-2 text-left text-slate-200 cursor-pointer hover:text-red-400"
                    onClick={() => chain.put && handleStrikeClick(chain.strike, 'put')}
                  >
                    {chain.put ? `$${chain.put.last.toFixed(2)}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Strike Info */}
      {selectedStrike && (
        <div className="px-4 py-3 border-t border-white/10 bg-cyan-500/10">
          <div className="text-xs text-slate-300">
            <strong className="text-cyan-400">Selected:</strong> ${selectedStrike.strike.toFixed(2)} {selectedStrike.type.toUpperCase()}
          </div>
          <button
            onClick={() => alert(`Build Strategy with ${selectedStrike.type} @ $${selectedStrike.strike}`)}
            className="mt-2 w-full px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-all"
          >
            Build Strategy with Selected Strike
          </button>
        </div>
      )}

      {/* Footer Stats */}
      <div className="px-4 py-2 border-t border-white/10 bg-slate-800/30 text-xs text-slate-400">
        Showing {filteredChains.length} strikes • Min OI: {minOI} • Max Spread: {maxSpreadPct}%
      </div>
    </div>
  );
}
