'use client';

import { useState } from 'react';

/**
 * Research Dashboard - Stock Analysis & AI Strategy Handoff
 *
 * Features:
 * - Stock lookup with candlestick charts
 * - Technical indicators (SMA, RSI, MACD, Bollinger Bands, Ichimoku, Volume)
 * - Options chain viewer
 * - AI handoff buttons: Suggest Strategy, Monitor Position, Convert to Automated
 * - Theoretical vs Actual P&L comparison charts
 */

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: number;
}

interface IndicatorConfig {
  name: string;
  enabled: boolean;
  color: string;
  params?: Record<string, number>;
}

export default function ResearchDashboard() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { name: 'SMA 20', enabled: true, color: '#00ACC1', params: { period: 20 } },
    { name: 'SMA 50', enabled: true, color: '#7E57C2', params: { period: 50 } },
    { name: 'SMA 200', enabled: false, color: '#FF8800', params: { period: 200 } },
    { name: 'RSI', enabled: true, color: '#00C851', params: { period: 14 } },
    { name: 'MACD', enabled: true, color: '#0097A7' },
    { name: 'Bollinger Bands', enabled: false, color: '#5E35B1' },
    { name: 'Ichimoku Cloud', enabled: false, color: '#00BCD4' },
    { name: 'Volume', enabled: true, color: '#94a3b8' },
  ]);

  const toggleIndicator = (name: string) => {
    setIndicators(prev =>
      prev.map(ind => (ind.name === name ? { ...ind, enabled: !ind.enabled } : ind))
    );
  };

  const handleSymbolSearch = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setStockData({
        symbol: symbol.toUpperCase(),
        price: 184.10,
        change: 1.60,
        changePct: 0.88,
        volume: 45000000,
        marketCap: 2800000000000,
      });
    } catch (e) {
      console.error('Failed to fetch stock data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestStrategy = () => {
    alert(`AI Suggest Strategy for ${symbol}\n\nThis will analyze:\n- Current price action\n- IV percentile\n- Upcoming earnings\n- News sentiment\n\nAnd recommend optimal strategy from Allessandra library.`);
  };

  const handleAIMonitorPosition = () => {
    alert(`AI Monitor Position for ${symbol}\n\nThis will:\n- Track position P&L in real-time\n- Alert on profit target / stop loss hits\n- Suggest adjustments based on Greeks\n- Auto-roll near expiration if enabled`);
  };

  const handleConvertToAutomated = () => {
    alert(`Convert to Automated Strategy for ${symbol}\n\nThis will:\n- Create new strategy JSON from current position\n- Set approval/autopilot rules\n- Enable for future scans\n- Add to watchlist (current/invested/future)`);
  };

  return (
    <div
      style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            color: '#00ACC1',
            fontSize: '1.5rem',
            margin: 0,
            marginBottom: '8px',
          }}
        >
          📊 Research Dashboard
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Stock analysis, options chain, and AI strategy recommendations
        </p>
      </div>

      {/* Symbol Search */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          onKeyPress={e => e.key === 'Enter' && handleSymbolSearch()}
          placeholder="Enter symbol..."
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '1rem',
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSymbolSearch}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#00ACC1',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {/* Stock Info Card */}
      {stockData && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ color: '#e2e8f0', fontSize: '1.8rem', margin: 0, marginBottom: '8px' }}>
                {stockData.symbol}
              </h4>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ color: '#e2e8f0', fontSize: '2rem', fontWeight: 700 }}>
                  ${stockData.price.toFixed(2)}
                </span>
                <span
                  style={{
                    color: stockData.change >= 0 ? '#10b981' : '#ef4444',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                  }}
                >
                  {stockData.change >= 0 ? '+' : ''}
                  {stockData.change.toFixed(2)} ({stockData.changePct.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Volume</div>
              <div style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 600 }}>
                {(stockData.volume / 1000000).toFixed(1)}M
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>Market Cap</div>
              <div style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 600 }}>
                ${(stockData.marketCap / 1000000000000).toFixed(2)}T
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Chart Section */}
        <div>
          {/* Chart Placeholder */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📈</div>
              <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Candlestick Chart</div>
              <div style={{ fontSize: '0.9rem' }}>Chart integration coming soon</div>
              <div style={{ fontSize: '0.8rem', marginTop: '12px', color: '#64748b' }}>
                Will use: TradingView Widget, Chart.js, or D3.js
              </div>
            </div>
          </div>

          {/* Indicators Toggles */}
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {indicators.map(ind => (
              <button
                key={ind.name}
                onClick={() => toggleIndicator(ind.name)}
                style={{
                  padding: '8px 16px',
                  background: ind.enabled ? ind.color : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${ind.enabled ? ind.color : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  color: ind.enabled ? '#fff' : '#94a3b8',
                  fontSize: '0.85rem',
                  fontWeight: ind.enabled ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {ind.name}
              </button>
            ))}
          </div>
        </div>

        {/* Options Chain Section */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '400px',
          }}
        >
          <h4 style={{ color: '#7E57C2', fontSize: '1.2rem', margin: 0, marginBottom: '16px' }}>
            Options Chain
          </h4>
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '100px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎯</div>
            <div style={{ fontSize: '0.9rem' }}>Options chain viewer</div>
            <div style={{ fontSize: '0.8rem', marginTop: '8px', color: '#64748b' }}>
              Coming soon: Strike, Delta, IV, OI, Volume
            </div>
          </div>
        </div>
      </div>

      {/* AI Handoff Buttons */}
      <div
        style={{
          background: 'rgba(126, 87, 194, 0.1)',
          border: '1px solid rgba(126, 87, 194, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h4 style={{ color: '#7E57C2', fontSize: '1.2rem', margin: 0, marginBottom: '16px' }}>
          🤖 AI Strategy Assistant
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <button
            onClick={handleAISuggestStrategy}
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #00ACC1, #0097A7)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💡</div>
            <div>Suggest Strategy</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '4px' }}>
              Analyze & recommend
            </div>
          </button>

          <button
            onClick={handleAIMonitorPosition}
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #7E57C2, #5E35B1)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👁️</div>
            <div>Monitor Position</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '4px' }}>
              Track & alert
            </div>
          </button>

          <button
            onClick={handleConvertToAutomated}
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #00C851, #00A344)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚡</div>
            <div>Convert to Automated</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '4px' }}>
              Autopilot strategy
            </div>
          </button>
        </div>
      </div>

      {/* Theoretical vs Actual P&L Section */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h4 style={{ color: '#FF8800', fontSize: '1.2rem', margin: 0, marginBottom: '16px' }}>
          📊 Theoretical vs Actual P&L
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {['Pre-Trade Analysis', 'During Trade', 'Post-Trade Review'].map((phase, idx) => (
            <div
              key={phase}
              style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>
                {phase}
              </div>
              <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {idx === 0 && '📉 Expected vs Max Loss'}
                  {idx === 1 && '📊 Real-time Greek shifts'}
                  {idx === 2 && '📈 Actual vs Projection'}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(0, 200, 81, 0.1)',
            border: '1px solid rgba(0, 200, 81, 0.3)',
            borderRadius: '8px',
            color: '#94a3b8',
            fontSize: '0.85rem',
          }}
        >
          <strong style={{ color: '#00C851' }}>Coming Soon:</strong> Interactive P&L comparison charts showing theoretical payoff diagrams
          overlaid with actual fills, Greeks evolution, and variance analysis.
        </div>
      </div>
    </div>
  );
}
