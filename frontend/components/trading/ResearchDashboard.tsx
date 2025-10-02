'use client';

import { useState } from 'react';

/**
 * Research Dashboard - Stock Analysis & Charting
 *
 * INCREMENT 2: Basic structure with stock lookup, timeframe selector,
 * chart type toggle, and indicator checkboxes
 */

type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y';
type ChartType = 'Line' | 'Candlestick' | 'Area';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  marketCap: number;
  peRatio: number;
  earningsDate: string;
  week52High: number;
  week52Low: number;
}

interface Indicator {
  id: string;
  label: string;
  enabled: boolean;
}

export default function ResearchDashboard() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [chartType, setChartType] = useState<ChartType>('Candlestick');
  const [indicators, setIndicators] = useState<Indicator[]>([
    { id: 'sma20', label: 'SMA 20', enabled: false },
    { id: 'sma50', label: 'SMA 50', enabled: false },
    { id: 'sma200', label: 'SMA 200', enabled: false },
    { id: 'rsi', label: 'RSI (14)', enabled: false },
    { id: 'macd', label: 'MACD', enabled: false },
    { id: 'bb', label: 'Bollinger Bands', enabled: false },
    { id: 'ichimoku', label: 'Ichimoku Cloud', enabled: false },
    { id: 'volume', label: 'Volume Bars', enabled: false },
  ]);

  const handleSearch = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      // TODO: Replace with actual API call in INCREMENT 3
      await new Promise(resolve => setTimeout(resolve, 500));
      setStockData({
        symbol: symbol.toUpperCase(),
        price: 184.10,
        change: 1.60,
        changePct: 0.88,
        marketCap: 2800000000000,
        peRatio: 28.5,
        earningsDate: '2025-01-30',
        week52High: 199.62,
        week52Low: 164.08,
      });
    } catch (e) {
      console.error('Failed to fetch stock data', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleIndicator = (id: string) => {
    setIndicators(prev =>
      prev.map(ind => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  };

  const timeframes: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];
  const chartTypes: ChartType[] = ['Line', 'Candlestick', 'Area'];

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-cyan-400 mb-2">
          🔬 Research Dashboard
        </h3>
        <p className="text-slate-400 text-sm">
          Stock analysis with charts, indicators, and AI recommendations
        </p>
      </div>

      {/* Stock Lookup Section */}
      <div className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            placeholder="Enter ticker symbol (e.g., AAPL)"
            className="flex-1 px-4 py-3 bg-slate-900/60 border border-white/20 rounded-lg text-slate-100 text-base font-mono outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Stock Fundamentals Card */}
      {stockData && (
        <div className="mb-6 bg-slate-900/60 border border-white/10 rounded-xl p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Current Price */}
            <div>
              <div className="text-slate-400 text-xs mb-1">Current Price</div>
              <div className="text-slate-100 text-2xl font-bold">
                ${stockData.price.toFixed(2)}
              </div>
              <div className={`text-sm font-semibold ${stockData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stockData.change >= 0 ? '+' : ''}
                {stockData.change.toFixed(2)} ({stockData.changePct.toFixed(2)}%)
              </div>
            </div>

            {/* Market Cap */}
            <div>
              <div className="text-slate-400 text-xs mb-1">Market Cap</div>
              <div className="text-slate-100 text-lg font-semibold">
                ${(stockData.marketCap / 1000000000000).toFixed(2)}T
              </div>
            </div>

            {/* P/E Ratio */}
            <div>
              <div className="text-slate-400 text-xs mb-1">P/E Ratio</div>
              <div className="text-slate-100 text-lg font-semibold">
                {stockData.peRatio.toFixed(2)}
              </div>
            </div>

            {/* Next Earnings */}
            <div>
              <div className="text-slate-400 text-xs mb-1">Next Earnings</div>
              <div className="text-slate-100 text-lg font-semibold">
                {stockData.earningsDate}
              </div>
            </div>

            {/* 52-Week High */}
            <div>
              <div className="text-slate-400 text-xs mb-1">52-Week High</div>
              <div className="text-slate-100 text-lg font-semibold">
                ${stockData.week52High.toFixed(2)}
              </div>
            </div>

            {/* 52-Week Low */}
            <div>
              <div className="text-slate-400 text-xs mb-1">52-Week Low</div>
              <div className="text-slate-100 text-lg font-semibold">
                ${stockData.week52Low.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeframe Selector */}
      <div className="mb-4">
        <div className="flex gap-2">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                timeframe === tf
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type Toggle */}
      <div className="mb-6">
        <div className="flex gap-2">
          {chartTypes.map(ct => (
            <button
              key={ct}
              onClick={() => setChartType(ct)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                chartType === ct
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {ct}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="mb-6 bg-slate-900/60 border border-white/10 rounded-xl p-8 flex items-center justify-center" style={{ height: '500px' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">📈</div>
          <div className="text-slate-300 text-xl font-semibold mb-2">
            Chart will render here
          </div>
          <div className="text-slate-500 text-sm">
            Selected: {chartType} · Timeframe: {timeframe}
          </div>
          <div className="text-slate-600 text-xs mt-3">
            Chart library integration in INCREMENT 3
          </div>
        </div>
      </div>

      {/* Indicator Toggles Section */}
      <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5">
        <h4 className="text-lg font-semibold text-slate-200 mb-4">
          Technical Indicators
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {indicators.map(ind => (
            <label
              key={ind.id}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-all"
            >
              <input
                type="checkbox"
                checked={ind.enabled}
                onChange={() => toggleIndicator(ind.id)}
                className="w-4 h-4 text-cyan-500 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
              />
              <span className={`text-sm font-medium ${ind.enabled ? 'text-cyan-400' : 'text-slate-400'}`}>
                {ind.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
