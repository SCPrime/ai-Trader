import React, { useState } from 'react';
import { paidTheme } from '../../../styles/paiid-theme';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

type ViewMode = 'gainers' | 'losers';

export const PreMarketMovers: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('gainers');

  // Mock data - in production, fetch from API
  const gainers: Stock[] = [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp',
      price: 487.32,
      change: 18.45,
      changePercent: 3.94,
      volume: '8.2M',
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      price: 142.18,
      change: 5.23,
      changePercent: 3.82,
      volume: '4.1M',
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc',
      price: 248.92,
      change: 8.14,
      changePercent: 3.38,
      volume: '12.5M',
    },
    {
      symbol: 'META',
      name: 'Meta Platforms',
      price: 389.45,
      change: 10.87,
      changePercent: 2.87,
      volume: '3.8M',
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc',
      price: 178.24,
      change: 4.32,
      changePercent: 2.48,
      volume: '15.3M',
    },
  ];

  const losers: Stock[] = [
    {
      symbol: 'NFLX',
      name: 'Netflix Inc',
      price: 412.35,
      change: -14.28,
      changePercent: -3.35,
      volume: '5.6M',
    },
    {
      symbol: 'BA',
      name: 'Boeing Co',
      price: 189.76,
      change: -5.92,
      changePercent: -3.03,
      volume: '2.9M',
    },
    {
      symbol: 'DIS',
      name: 'Walt Disney Co',
      price: 92.14,
      change: -2.48,
      changePercent: -2.62,
      volume: '4.2M',
    },
    {
      symbol: 'PYPL',
      name: 'PayPal Holdings',
      price: 61.83,
      change: -1.54,
      changePercent: -2.43,
      volume: '3.1M',
    },
    {
      symbol: 'INTC',
      name: 'Intel Corp',
      price: 35.29,
      change: -0.82,
      changePercent: -2.27,
      volume: '6.8M',
    },
  ];

  const currentStocks = viewMode === 'gainers' ? gainers : losers;
  const isGainers = viewMode === 'gainers';

  return (
    <div
      style={{
        background: paidTheme.colors.glass,
        backdropFilter: paidTheme.effects.blur,
        border: `1px solid ${paidTheme.colors.glassBorder}`,
        borderRadius: paidTheme.borderRadius.lg,
        padding: paidTheme.spacing.lg,
      }}
    >
      <div
        style={{
          fontSize: paidTheme.typography.fontSize.xl,
          color: paidTheme.colors.text,
          fontWeight: 600,
          marginBottom: paidTheme.spacing.lg,
        }}
      >
        Pre-Market Movers
      </div>

      <div
        style={{
          display: 'flex',
          gap: paidTheme.spacing.sm,
          marginBottom: paidTheme.spacing.lg,
          background: paidTheme.colors.glass,
          padding: paidTheme.spacing.xs,
          borderRadius: paidTheme.borderRadius.md,
          border: `1px solid ${paidTheme.colors.glassBorder}`,
        }}
      >
        <button
          onClick={() => setViewMode('gainers')}
          style={{
            flex: 1,
            padding: paidTheme.spacing.sm,
            background:
              viewMode === 'gainers'
                ? `${paidTheme.colors.success}20`
                : 'transparent',
            border:
              viewMode === 'gainers'
                ? `1px solid ${paidTheme.colors.success}60`
                : '1px solid transparent',
            borderRadius: paidTheme.borderRadius.sm,
            color:
              viewMode === 'gainers'
                ? paidTheme.colors.success
                : paidTheme.colors.textMuted,
            fontSize: paidTheme.typography.fontSize.sm,
            fontWeight: 600,
            cursor: 'pointer',
            transition: `all ${paidTheme.animation.duration.normal}`,
          }}
        >
          Top Gainers
        </button>
        <button
          onClick={() => setViewMode('losers')}
          style={{
            flex: 1,
            padding: paidTheme.spacing.sm,
            background:
              viewMode === 'losers'
                ? `${paidTheme.colors.error}20`
                : 'transparent',
            border:
              viewMode === 'losers'
                ? `1px solid ${paidTheme.colors.error}60`
                : '1px solid transparent',
            borderRadius: paidTheme.borderRadius.sm,
            color:
              viewMode === 'losers'
                ? paidTheme.colors.error
                : paidTheme.colors.textMuted,
            fontSize: paidTheme.typography.fontSize.sm,
            fontWeight: 600,
            cursor: 'pointer',
            transition: `all ${paidTheme.animation.duration.normal}`,
          }}
        >
          Top Losers
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: paidTheme.spacing.xs,
        }}
      >
        {currentStocks.map((stock, index) => (
          <div
            key={stock.symbol}
            style={{
              background: paidTheme.colors.glass,
              border: `1px solid ${paidTheme.colors.glassBorder}`,
              borderRadius: paidTheme.borderRadius.md,
              padding: paidTheme.spacing.md,
              transition: `all ${paidTheme.animation.duration.normal}`,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = paidTheme.colors.glassHover;
              e.currentTarget.style.borderColor = isGainers
                ? `${paidTheme.colors.success}40`
                : `${paidTheme.colors.error}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = paidTheme.colors.glass;
              e.currentTarget.style.borderColor = paidTheme.colors.glassBorder;
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: paidTheme.spacing.md }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: paidTheme.borderRadius.sm,
                    background: isGainers
                      ? `${paidTheme.colors.success}20`
                      : `${paidTheme.colors.error}20`,
                    border: `1px solid ${
                      isGainers
                        ? paidTheme.colors.success
                        : paidTheme.colors.error
                    }40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: paidTheme.typography.fontSize.xs,
                    color: isGainers
                      ? paidTheme.colors.success
                      : paidTheme.colors.error,
                    fontWeight: 600,
                    fontFamily: paidTheme.typography.fontFamily.mono,
                  }}
                >
                  {index + 1}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: paidTheme.typography.fontSize.base,
                      color: paidTheme.colors.text,
                      fontWeight: 600,
                      fontFamily: paidTheme.typography.fontFamily.mono,
                    }}
                  >
                    {stock.symbol}
                  </div>
                  <div
                    style={{
                      fontSize: paidTheme.typography.fontSize.xs,
                      color: paidTheme.colors.textMuted,
                    }}
                  >
                    {stock.name}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: paidTheme.typography.fontSize.lg,
                    color: paidTheme.colors.text,
                    fontWeight: 600,
                    fontFamily: paidTheme.typography.fontFamily.mono,
                  }}
                >
                  ${stock.price.toFixed(2)}
                </div>
                <div
                  style={{
                    fontSize: paidTheme.typography.fontSize.sm,
                    color: isGainers
                      ? paidTheme.colors.success
                      : paidTheme.colors.error,
                    fontFamily: paidTheme.typography.fontFamily.mono,
                    fontWeight: 600,
                  }}
                >
                  {isGainers ? '+' : ''}
                  {stock.change.toFixed(2)} ({isGainers ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%)
                </div>
              </div>

              <div
                style={{
                  fontSize: paidTheme.typography.fontSize.xs,
                  color: paidTheme.colors.textMuted,
                  fontFamily: paidTheme.typography.fontFamily.mono,
                  background: `${paidTheme.colors.textMuted}10`,
                  padding: `${paidTheme.spacing.xs} ${paidTheme.spacing.sm}`,
                  borderRadius: paidTheme.borderRadius.sm,
                }}
              >
                Vol: {stock.volume}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
