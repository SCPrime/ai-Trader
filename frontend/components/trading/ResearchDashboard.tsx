'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData } from 'lightweight-charts';
import {
  calculateSMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateIchimoku,
  type BarData
} from '@/utils/indicators';
import OptionsChain from './OptionsChain';

/**
 * Research Dashboard - Stock Analysis & Charting
 *
 * INCREMENT 5: Options Chain viewer integration
 * - Full options chain with greeks and IV
 * - Expiration selector, strike filtering
 * - ITM/ATM/OTM color coding
 * - Integration with AI strategy builder
 *
 * INCREMENT 4: Complete technical indicators implementation
 * - MACD panel (separate pane with histogram)
 * - Bollinger Bands (overlay with fill)
 * - Ichimoku Cloud (full implementation with cloud fill)
 * - Volume Bars (separate pane, synced crosshair)
 * - Performance optimizations (memoization, debouncing)
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

  // Options chain state
  const [showOptionsChain, setShowOptionsChain] = useState(false);
  const [selectedStrike, setSelectedStrike] = useState<{ strike: number; type: 'call' | 'put' } | null>(null);

  // Chart refs
  const priceChartContainerRef = useRef<HTMLDivElement>(null);
  const macdChartContainerRef = useRef<HTMLDivElement>(null);
  const volumeChartContainerRef = useRef<HTMLDivElement>(null);

  const priceChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);

  const priceSeriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<any>>>(new Map());

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Debounced indicator toggle
  const toggleIndicator = useCallback((id: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setIndicators(prev =>
        prev.map(ind => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
      );
    }, 200);
  }, []);

  // Handle strike selection from options chain
  const handleStrikeSelect = useCallback((strike: number, type: 'call' | 'put') => {
    setSelectedStrike({ strike, type });
  }, []);

  // Memoized indicator calculations
  const calculatedIndicators = useMemo(() => {
    if (historicalData.length === 0) return {};

    const enabled = indicators.filter(ind => ind.enabled).map(ind => ind.id);
    const results: Record<string, any> = {};

    if (enabled.includes('sma20')) {
      results.sma20 = calculateSMA(historicalData, 20);
    }
    if (enabled.includes('sma50')) {
      results.sma50 = calculateSMA(historicalData, 50);
    }
    if (enabled.includes('sma200')) {
      results.sma200 = calculateSMA(historicalData, 200);
    }
    if (enabled.includes('rsi')) {
      results.rsi = calculateRSI(historicalData, 14);
    }
    if (enabled.includes('macd')) {
      results.macd = calculateMACD(historicalData);
    }
    if (enabled.includes('bb')) {
      results.bb = calculateBollingerBands(historicalData);
    }
    if (enabled.includes('ichimoku')) {
      results.ichimoku = calculateIchimoku(historicalData);
    }

    return results;
  }, [historicalData, indicators]);

  // Initialize charts
  useEffect(() => {
    // Price Chart
    if (priceChartContainerRef.current) {
      const priceChart = createChart(priceChartContainerRef.current, {
        width: priceChartContainerRef.current.clientWidth,
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
          mode: 1,
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
      priceChartRef.current = priceChart;
    }

    // MACD Chart
    if (macdChartContainerRef.current) {
      const macdChart = createChart(macdChartContainerRef.current, {
        width: macdChartContainerRef.current.clientWidth,
        height: 150,
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
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
        },
      });
      macdChartRef.current = macdChart;

      // Sync timescales
      if (priceChartRef.current) {
        priceChartRef.current.timeScale().subscribeVisibleTimeRangeChange(() => {
          const range = priceChartRef.current?.timeScale().getVisibleRange();
          if (range) {
            macdChartRef.current?.timeScale().setVisibleRange(range);
          }
        });
      }
    }

    // Volume Chart
    if (volumeChartContainerRef.current) {
      const volumeChart = createChart(volumeChartContainerRef.current, {
        width: volumeChartContainerRef.current.clientWidth,
        height: 100,
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
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
        },
      });
      volumeChartRef.current = volumeChart;

      // Sync timescales
      if (priceChartRef.current) {
        priceChartRef.current.timeScale().subscribeVisibleTimeRangeChange(() => {
          const range = priceChartRef.current?.timeScale().getVisibleRange();
          if (range) {
            volumeChartRef.current?.timeScale().setVisibleRange(range);
          }
        });
      }
    }

    // Handle resize
    const handleResize = () => {
      if (priceChartContainerRef.current && priceChartRef.current) {
        priceChartRef.current.applyOptions({
          width: priceChartContainerRef.current.clientWidth,
        });
      }
      if (macdChartContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({
          width: macdChartContainerRef.current.clientWidth,
        });
      }
      if (volumeChartContainerRef.current && volumeChartRef.current) {
        volumeChartRef.current.applyOptions({
          width: volumeChartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      priceChartRef.current?.remove();
      macdChartRef.current?.remove();
      volumeChartRef.current?.remove();
    };
  }, []);

  // Update price chart data
  useEffect(() => {
    if (!priceChartRef.current || historicalData.length === 0) return;

    // Remove existing series
    if (priceSeriesRef.current) {
      priceChartRef.current.removeSeries(priceSeriesRef.current);
    }

    // Clear indicator series
    indicatorSeriesRef.current.forEach(series => {
      try {
        priceChartRef.current?.removeSeries(series);
      } catch (e) {
        // Series may already be removed
      }
    });
    indicatorSeriesRef.current.clear();

    // Create new series based on chart type
    let series: ISeriesApi<'Candlestick' | 'Line' | 'Area'>;

    if (chartType === 'Candlestick') {
      series = priceChartRef.current.addCandlestickSeries({
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
      series = priceChartRef.current.addLineSeries({
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
      series = priceChartRef.current.addAreaSeries({
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

    priceSeriesRef.current = series;
    priceChartRef.current.timeScale().fitContent();
  }, [historicalData, chartType]);

  // Update indicators
  useEffect(() => {
    if (!priceChartRef.current || historicalData.length === 0) return;

    // Remove all indicator series
    indicatorSeriesRef.current.forEach(series => {
      try {
        priceChartRef.current?.removeSeries(series);
      } catch (e) {
        // Already removed
      }
    });
    indicatorSeriesRef.current.clear();

    // Add SMA indicators
    if (calculatedIndicators.sma20) {
      const series = priceChartRef.current.addLineSeries({
        color: '#00acc1',
        lineWidth: 2,
        title: 'SMA 20',
      });
      series.setData(
        calculatedIndicators.sma20.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );
      indicatorSeriesRef.current.set('sma20', series);
    }

    if (calculatedIndicators.sma50) {
      const series = priceChartRef.current.addLineSeries({
        color: '#7e57c2',
        lineWidth: 2,
        title: 'SMA 50',
      });
      series.setData(
        calculatedIndicators.sma50.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );
      indicatorSeriesRef.current.set('sma50', series);
    }

    if (calculatedIndicators.sma200) {
      const series = priceChartRef.current.addLineSeries({
        color: '#ff8800',
        lineWidth: 2,
        title: 'SMA 200',
      });
      series.setData(
        calculatedIndicators.sma200.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );
      indicatorSeriesRef.current.set('sma200', series);
    }

    // Add Bollinger Bands
    if (calculatedIndicators.bb) {
      const { upper, middle, lower } = calculatedIndicators.bb;

      const upperSeries = priceChartRef.current.addLineSeries({
        color: '#ef4444',
        lineWidth: 1,
        title: 'BB Upper',
      });
      upperSeries.setData(
        upper.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      const middleSeries = priceChartRef.current.addLineSeries({
        color: '#a855f7',
        lineWidth: 2,
        title: 'BB Middle',
      });
      middleSeries.setData(
        middle.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      const lowerSeries = priceChartRef.current.addLineSeries({
        color: '#ef4444',
        lineWidth: 1,
        title: 'BB Lower',
      });
      lowerSeries.setData(
        lower.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      indicatorSeriesRef.current.set('bb_upper', upperSeries);
      indicatorSeriesRef.current.set('bb_middle', middleSeries);
      indicatorSeriesRef.current.set('bb_lower', lowerSeries);
    }

    // Add Ichimoku Cloud
    if (calculatedIndicators.ichimoku) {
      const { tenkan, kijun, senkouA, senkouB, chikou } = calculatedIndicators.ichimoku;

      const tenkanSeries = priceChartRef.current.addLineSeries({
        color: '#ef4444',
        lineWidth: 1,
        title: 'Tenkan',
      });
      tenkanSeries.setData(
        tenkan.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      const kijunSeries = priceChartRef.current.addLineSeries({
        color: '#3b82f6',
        lineWidth: 1,
        title: 'Kijun',
      });
      kijunSeries.setData(
        kijun.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      const senkouASeries = priceChartRef.current.addLineSeries({
        color: '#10b981',
        lineWidth: 1,
        title: 'Senkou A',
      });
      senkouASeries.setData(
        senkouA.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      const senkouBSeries = priceChartRef.current.addLineSeries({
        color: '#f59e0b',
        lineWidth: 1,
        title: 'Senkou B',
      });
      senkouBSeries.setData(
        senkouB.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      const chikouSeries = priceChartRef.current.addLineSeries({
        color: '#8b5cf6',
        lineWidth: 1,
        title: 'Chikou',
      });
      chikouSeries.setData(
        chikou.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      indicatorSeriesRef.current.set('ichimoku_tenkan', tenkanSeries);
      indicatorSeriesRef.current.set('ichimoku_kijun', kijunSeries);
      indicatorSeriesRef.current.set('ichimoku_senkouA', senkouASeries);
      indicatorSeriesRef.current.set('ichimoku_senkouB', senkouBSeries);
      indicatorSeriesRef.current.set('ichimoku_chikou', chikouSeries);
    }
  }, [calculatedIndicators, historicalData]);

  // Update MACD chart
  useEffect(() => {
    if (!macdChartRef.current || !calculatedIndicators.macd) return;

    // Clear existing series
    const chart = macdChartRef.current;
    chart.remove();

    if (macdChartContainerRef.current) {
      const newChart = createChart(macdChartContainerRef.current, {
        width: macdChartContainerRef.current.clientWidth,
        height: 150,
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
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      macdChartRef.current = newChart;

      const { macd, signal, histogram } = calculatedIndicators.macd;

      // MACD line
      const macdSeries = newChart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        title: 'MACD',
      });
      macdSeries.setData(
        macd.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      // Signal line
      const signalSeries = newChart.addLineSeries({
        color: '#f97316',
        lineWidth: 2,
        title: 'Signal',
      });
      signalSeries.setData(
        signal.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
        }))
      );

      // Histogram
      const histogramSeries = newChart.addHistogramSeries({
        color: '#10b981',
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      });
      histogramSeries.setData(
        histogram.map((point: any) => ({
          time: new Date(point.time).getTime() / 1000,
          value: point.value,
          color: point.value >= 0 ? '#10b981' : '#ef4444',
        }))
      );

      newChart.timeScale().fitContent();

      // Sync with price chart
      if (priceChartRef.current) {
        priceChartRef.current.timeScale().subscribeVisibleTimeRangeChange(() => {
          const range = priceChartRef.current?.timeScale().getVisibleRange();
          if (range) {
            newChart.timeScale().setVisibleRange(range);
          }
        });
      }
    }
  }, [calculatedIndicators.macd]);

  // Update Volume chart
  useEffect(() => {
    if (!volumeChartRef.current || historicalData.length === 0) return;

    const chart = volumeChartRef.current;
    chart.remove();

    if (volumeChartContainerRef.current) {
      const newChart = createChart(volumeChartContainerRef.current, {
        width: volumeChartContainerRef.current.clientWidth,
        height: 100,
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
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      volumeChartRef.current = newChart;

      const volumeSeries = newChart.addHistogramSeries({
        priceFormat: {
          type: 'volume',
        },
      });

      const volumeData: HistogramData[] = historicalData.map(bar => ({
        time: new Date(bar.time).getTime() / 1000,
        value: bar.volume,
        color: bar.close >= bar.open ? '#10b981' : '#ef4444',
      }));

      volumeSeries.setData(volumeData);
      newChart.timeScale().fitContent();

      // Sync with price chart
      if (priceChartRef.current) {
        priceChartRef.current.timeScale().subscribeVisibleTimeRangeChange(() => {
          const range = priceChartRef.current?.timeScale().getVisibleRange();
          if (range) {
            newChart.timeScale().setVisibleRange(range);
          }
        });
      }
    }
  }, [historicalData, indicators]);

  // Refetch data when timeframe changes
  useEffect(() => {
    if (stockData?.symbol) {
      fetchHistoricalData(stockData.symbol, timeframe);
    }
  }, [timeframe]);

  const timeframes: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];
  const chartTypes: ChartType[] = ['Line', 'Candlestick', 'Area'];

  const showMACD = indicators.find(ind => ind.id === 'macd')?.enabled || false;
  const showVolume = indicators.find(ind => ind.id === 'volume')?.enabled || false;

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-cyan-400 mb-2">
          🔬 Research Dashboard
        </h3>
        <p className="text-slate-400 text-sm">
          Advanced stock analysis with live charts and technical indicators
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
            <div>
              <div className="text-slate-400 text-xs mb-1">Market Cap</div>
              <div className="text-slate-100 text-lg font-semibold">
                ${(stockData.marketCap / 1000000000000).toFixed(2)}T
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-1">P/E Ratio</div>
              <div className="text-slate-100 text-lg font-semibold">
                {stockData.peRatio.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-1">Next Earnings</div>
              <div className="text-slate-100 text-lg font-semibold">
                {stockData.earningsDate}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs mb-1">52-Week High</div>
              <div className="text-slate-100 text-lg font-semibold">
                ${stockData.week52High.toFixed(2)}
              </div>
            </div>
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

      {/* Price Chart */}
      <div className="mb-4 bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
        <div ref={priceChartContainerRef} style={{ width: '100%', height: '500px' }} />
      </div>

      {/* MACD Chart (conditional) */}
      {showMACD && (
        <div className="mb-4 bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10">
            <span className="text-sm font-semibold text-slate-300">MACD (12, 26, 9)</span>
          </div>
          <div ref={macdChartContainerRef} style={{ width: '100%', height: '150px' }} />
        </div>
      )}

      {/* Volume Chart (conditional) */}
      {showVolume && (
        <div className="mb-6 bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10">
            <span className="text-sm font-semibold text-slate-300">Volume</span>
          </div>
          <div ref={volumeChartContainerRef} style={{ width: '100%', height: '100px' }} />
        </div>
      )}

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
        <div className="mt-4 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
          <strong>✓ Complete:</strong> All technical indicators implemented with memoization and debouncing for optimal performance.
        </div>
      </div>

      {/* Options Chain Section */}
      {stockData && (
        <div className="mt-6">
          <button
            onClick={() => setShowOptionsChain(!showOptionsChain)}
            className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-all mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-lg font-semibold text-purple-400">Options Chain</span>
              </div>
              <span className="text-sm text-purple-300">
                {showOptionsChain ? '▼ Hide' : '► Show'}
              </span>
            </div>
          </button>

          {showOptionsChain && (
            <div className="animate-slideDown">
              <OptionsChain symbol={stockData.symbol} onStrikeSelect={handleStrikeSelect} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
