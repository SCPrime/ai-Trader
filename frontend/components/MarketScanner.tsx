"use client";
import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Zap, RefreshCw, Filter, Star } from 'lucide-react';
import { Card, Button, Input, Select } from './ui';
import { theme } from '../styles/theme';

interface ScanResult {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  indicators: {
    rsi: number;
    macd: 'bullish' | 'bearish' | 'neutral';
    movingAverage: '50_above' | '50_below' | '200_above' | '200_below';
    volumeProfile: 'high' | 'normal' | 'low';
  };
  pattern?: string;
  reason: string;
}

interface ScanFilter {
  minPrice: number;
  maxPrice: number;
  minVolume: number;
  sector?: string;
  signalType: 'all' | 'buy' | 'sell';
}

export default function MarketScanner() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ScanFilter>({
    minPrice: 1,
    maxPrice: 1000,
    minVolume: 100000,
    signalType: 'all',
  });
  const [scanType, setScanType] = useState<'momentum' | 'breakout' | 'reversal' | 'custom'>('momentum');

  useEffect(() => {
    runScan();
  }, [scanType]);

  const runScan = async () => {
    setLoading(true);

    // Simulate scan - in production, call backend API
    setTimeout(() => {
      const mockResults: ScanResult[] = [
        {
          symbol: 'AAPL',
          price: 182.30,
          change: 2.80,
          changePercent: 1.56,
          volume: 52340000,
          avgVolume: 48200000,
          signal: 'buy' as const,
          indicators: {
            rsi: 62.5,
            macd: 'bullish' as const,
            movingAverage: '50_above' as const,
            volumeProfile: 'high' as const,
          },
          pattern: 'Bull Flag',
          reason: 'Breaking above 20-day MA with strong volume. RSI bullish but not overbought.',
        },
        {
          symbol: 'MSFT',
          price: 378.45,
          change: 5.65,
          changePercent: 1.52,
          volume: 24150000,
          avgVolume: 22800000,
          signal: 'strong_buy' as const,
          indicators: {
            rsi: 68.2,
            macd: 'bullish' as const,
            movingAverage: '200_above' as const,
            volumeProfile: 'high' as const,
          },
          pattern: 'Ascending Triangle',
          reason: 'Strong uptrend with increasing volume. MACD crossover confirmed.',
        },
        {
          symbol: 'TSLA',
          price: 238.90,
          change: -6.40,
          changePercent: -2.61,
          volume: 135200000,
          avgVolume: 98500000,
          signal: 'sell' as const,
          indicators: {
            rsi: 32.8,
            macd: 'bearish' as const,
            movingAverage: '50_below' as const,
            volumeProfile: 'high' as const,
          },
          pattern: 'Head and Shoulders',
          reason: 'Breaking down from support with elevated volume. Bearish trend confirmed.',
        },
        {
          symbol: 'NVDA',
          price: 485.20,
          change: 12.40,
          changePercent: 2.62,
          volume: 42800000,
          avgVolume: 38500000,
          signal: 'strong_buy' as const,
          indicators: {
            rsi: 71.5,
            macd: 'bullish' as const,
            movingAverage: '50_above' as const,
            volumeProfile: 'high' as const,
          },
          pattern: 'Cup and Handle',
          reason: 'Breakout from consolidation pattern. Strong momentum with institutional buying.',
        },
        {
          symbol: 'AMD',
          price: 142.60,
          change: -1.20,
          changePercent: -0.83,
          volume: 45200000,
          avgVolume: 52000000,
          signal: 'neutral' as const,
          indicators: {
            rsi: 48.5,
            macd: 'neutral' as const,
            movingAverage: '50_above' as const,
            volumeProfile: 'normal' as const,
          },
          reason: 'Consolidating near key support. Waiting for directional confirmation.',
        },
      ].filter(result => {
        // Apply filters
        if (filter.signalType !== 'all') {
          if (filter.signalType === 'buy' && !['buy', 'strong_buy'].includes(result.signal)) return false;
          if (filter.signalType === 'sell' && !['sell', 'strong_sell'].includes(result.signal)) return false;
        }
        if (result.price < filter.minPrice || result.price > filter.maxPrice) return false;
        if (result.volume < filter.minVolume) return false;
        return true;
      });

      setResults(mockResults);
      setLoading(false);
    }, 1500);
  };

  const getSignalColor = (signal: ScanResult['signal']) => {
    switch (signal) {
      case 'strong_buy': return theme.colors.primary;
      case 'buy': return theme.colors.secondary;
      case 'neutral': return theme.colors.textMuted;
      case 'sell': return theme.colors.warning;
      case 'strong_sell': return theme.colors.danger;
    }
  };

  const getSignalLabel = (signal: ScanResult['signal']) => {
    return signal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <Search size={32} color={theme.colors.info} />
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            color: theme.colors.text,
            textShadow: `0 0 20px ${theme.colors.info}40`,
          }}>
            Market Scanner
          </h1>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={runScan}
          loading={loading}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <RefreshCw size={20} />
            Scan Market
          </div>
        </Button>
      </div>

      {/* Scan Type Selection */}
      <Card style={{ marginBottom: theme.spacing.md, padding: theme.spacing.md }}>
        <div style={{ marginBottom: theme.spacing.md }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.sm} 0` }}>
            Scan Type
          </p>
          <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
            {(['momentum', 'breakout', 'reversal', 'custom'] as const).map((type) => (
              <Button
                key={type}
                variant={scanType === type ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setScanType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md }}>
          <div>
            <Input
              label="Min Price"
              type="number"
              value={filter.minPrice.toString()}
              onChange={(e) => setFilter({ ...filter, minPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Input
              label="Max Price"
              type="number"
              value={filter.maxPrice.toString()}
              onChange={(e) => setFilter({ ...filter, maxPrice: parseFloat(e.target.value) || 1000 })}
            />
          </div>
          <div>
            <Input
              label="Min Volume"
              type="number"
              value={filter.minVolume.toString()}
              onChange={(e) => setFilter({ ...filter, minVolume: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Select
              label="Signal Type"
              options={[
                { value: 'all', label: 'All Signals' },
                { value: 'buy', label: 'Buy Signals' },
                { value: 'sell', label: 'Sell Signals' },
              ]}
              value={filter.signalType}
              onChange={(e) => setFilter({ ...filter, signalType: e.target.value as 'all' | 'buy' | 'sell' })}
            />
          </div>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textMuted }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: theme.spacing.md }}>Scanning market...</p>
          </div>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textMuted }}>
            No opportunities found matching your criteria. Try adjusting the filters.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {results.map((result) => (
            <Card key={result.symbol} glow={result.signal.includes('buy') ? 'green' : result.signal.includes('sell') ? 'red' : undefined}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: theme.colors.text }}>
                      {result.symbol}
                    </h3>
                    <span style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '12px',
                      fontWeight: '600',
                      background: `${getSignalColor(result.signal)}20`,
                      color: getSignalColor(result.signal),
                    }}>
                      {getSignalLabel(result.signal)}
                    </span>
                    {result.pattern && (
                      <span style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '12px',
                        background: theme.background.input,
                        color: theme.colors.textMuted,
                      }}>
                        {result.pattern}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: theme.colors.textMuted }}>
                    ${result.price.toFixed(2)} · {result.change >= 0 ? '+' : ''}{result.change.toFixed(2)} ({result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%)
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => {
                  // Navigate to execute trade with this symbol
                  alert(`Execute trade for ${result.symbol}`);
                }}>
                  Trade
                </Button>
              </div>

              {/* Indicators */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.md,
                padding: theme.spacing.md,
                background: theme.background.input,
                borderRadius: theme.borderRadius.md,
              }}>
                <Indicator label="RSI" value={result.indicators.rsi.toFixed(1)} />
                <Indicator label="MACD" value={result.indicators.macd.charAt(0).toUpperCase() + result.indicators.macd.slice(1)} />
                <Indicator label="MA" value={result.indicators.movingAverage.replace('_', ' ')} />
                <Indicator label="Volume" value={`${(result.volume / 1000000).toFixed(1)}M`} subValue={result.indicators.volumeProfile} />
              </div>

              {/* Reason */}
              <div style={{
                padding: theme.spacing.md,
                background: `${getSignalColor(result.signal)}10`,
                borderLeft: `4px solid ${getSignalColor(result.signal)}`,
                borderRadius: theme.borderRadius.sm,
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: theme.colors.text }}>
                  <strong>Analysis:</strong> {result.reason}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Indicator({ label, value, subValue }: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div>
      <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.xs} 0` }}>{label}</p>
      <p style={{ fontSize: '16px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>{value}</p>
      {subValue && (
        <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: `${theme.spacing.xs} 0 0 0` }}>{subValue}</p>
      )}
    </div>
  );
}
