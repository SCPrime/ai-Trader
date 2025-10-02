'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { calculateSMA, calculateRSI, type BarData } from '@/utils/indicators';

/**
 * Research Dashboard - Stock Analysis & Charting
 *
 * INCREMENT 3: Live chart rendering with lightweight-charts
 * - Fetches historical data from Alpaca via API
 * - Renders candlestick/line/area charts
 * - Overlays SMA and RSI indicators
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

interface HistoricalResponse {
  symbol: string;
  timeframe: string;
  bars: BarData[];
  count: number;
}

export default function ResearchDashboard() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [chartType, setChartType] = useState<ChartType>('Candlestick');
  const [historicalData, setHistoricalData] = useState<BarData[]>([]);
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

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  const handleSearch = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      // Fetch stock fundamentals (mock for now)
      await new Promise(resolve => setTimeout(resolve, 300));
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

      // Fetch historical data
      await fetchHistoricalData(symbol, timeframe);
    } catch (e) {
      console.error('Failed to fetch stock data', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async (sym: string, tf: Timeframe) => {
    try {
      const response = await fetch(`/api/market/historical?symbol=${sym}&timeframe=${tf}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch historical data: ${response.statusText}`);
      }
      const data: HistoricalResponse = await response.json();
      setHistoricalData(data.bars);
    } catch (error) {
      console.error('Historical data fetch error:', error);
      setHistoricalData([]);
    }
  };

  const toggleIndicator = (id: string) => {
    setIndicators(prev =>
      prev.map(ind => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 1, // Normal crosshair
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart data when historicalData or chartType changes
  useEffect(() => {
    if (!chartRef.current || historicalData.length === 0) return;

    // Remove existing series
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }

    // Clear indicator series
    indicatorSeriesRef.current.forEach(series => {
      chartRef.current?.removeSeries(series);
    });
    indicatorSeriesRef.current.clear();

    // Create new series based on chart type
    let series: ISeriesApi<'Candlestick' | 'Line' | 'Area'>;

    if (chartType === 'Candlestick') {
      series = chartRef.current.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      const candlestickData: CandlestickData[] = historicalData.map(bar => ({
        time: new Date(bar.time).getTime() / 1000,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      }));

      series.setData(candlestickData);
    } else if (chartType === 'Line') {
      series = chartRef.current.addLineSeries({
        color: '#00acc1',
        lineWidth: 2,
      });

      const lineData: LineData[] = historicalData.map(bar => ({
        time: new Date(bar.time).getTime() / 1000,
        value: bar.close,
      }));

      series.setData(lineData);
    } else {
      // Area
      series = chartRef.current.addAreaSeries({
        topColor: 'rgba(0, 172, 193, 0.4)',
        bottomColor: 'rgba(0, 172, 193, 0.0)',
        lineColor: '#00acc1',
        lineWidth: 2,
      });

      const areaData: LineData[] = historicalData.map(bar => ({
        time: new Date(bar.time).getTime() / 1000,
        value: bar.close,
      }));

      series.setData(areaData);
    }

    seriesRef.current = series;

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, [historicalData, chartType]);

  // Update indicators when toggled
  useEffect(() => {
    if (!chartRef.current || historicalData.length === 0) return;

    // Remove all indicator series
    indicatorSeriesRef.current.forEach(series => {
      chartRef.current?.removeSeries(series);
    });
    indicatorSeriesRef.current.clear();

    // Add enabled indicators
    indicators.forEach(ind => {
      if (!ind.enabled || !chartRef.current) return;

      if (ind.id === 'sma20') {
        const sma20Data = calculateSMA(historicalData, 20);
        const series = chartRef.current.addLineSeries({
          color: '#00acc1',
          lineWidth: 2,
          title: 'SMA 20',
        });
        series.setData(
          sma20Data.map(point => ({
            time: new Date(point.time).getTime() / 1000,
            value: point.value,
          }))
        );
        indicatorSeriesRef.current.set('sma20', series);
      } else if (ind.id === 'sma50') {
        const sma50Data = calculateSMA(historicalData, 50);
        const series = chartRef.current.addLineSeries({
          color: '#7e57c2',
          lineWidth: 2,
          title: 'SMA 50',
        });
        series.setData(
          sma50Data.map(point => ({
            time: new Date(point.time).getTime() / 1000,
            value: point.value,
          }))
        );
        indicatorSeriesRef.current.set('sma50', series);
      } else if (ind.id === 'sma200') {
        const sma200Data = calculateSMA(historicalData, 200);
        const series = chartRef.current.addLineSeries({
          color: '#ff8800',
          lineWidth: 2,
          title: 'SMA 200',
        });
        series.setData(
          sma200Data.map(point => ({
            time: new Date(point.time).getTime() / 1000,
            value: point.value,
          }))
        );
        indicatorSeriesRef.current.set('sma200', series);
      }
      // RSI, MACD, Bollinger Bands, Ichimoku will be added in INCREMENT 4
    });
  }, [indicators, historicalData]);

  // Refetch data when timeframe changes
  useEffect(() => {
    if (stockData?.symbol) {
      fetchHistoricalData(stockData.symbol, timeframe);
    }
  }, [timeframe]);

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
          Stock analysis with live charts, indicators, and AI recommendations
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

      {/* Chart Container */}
      <div className="mb-6 bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
        <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />
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
        <div className="mt-4 px-3 py-2 bg-slate-800/50 rounded-lg text-xs text-slate-500">
          <strong className="text-slate-400">Note:</strong> SMA 20/50/200 indicators are active. MACD, Bollinger Bands, Ichimoku Cloud, and Volume Bars will be added in INCREMENT 4.
        </div>
      </div>
    </div>
  );
}
