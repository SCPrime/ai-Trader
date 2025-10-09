import React from 'react';
import { paidTheme } from '../../../styles/paiid-theme';
import { MarketStatus } from './MarketStatus';
import { PortfolioSummary } from './PortfolioSummary';
import { TodaySchedule } from './TodaySchedule';
import { MarketAlerts } from './MarketAlerts';
import { PreMarketMovers } from './PreMarketMovers';

export const MorningRoutine: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: paidTheme.colors.background,
        color: paidTheme.colors.text,
        fontFamily: paidTheme.typography.fontFamily.main,
        padding: paidTheme.spacing.xl,
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: paidTheme.spacing.xl,
          paddingBottom: paidTheme.spacing.lg,
          borderBottom: `1px solid ${paidTheme.colors.glassBorder}`,
        }}
      >
        <h1
          style={{
            fontSize: paidTheme.typography.fontSize['3xl'],
            fontWeight: 700,
            margin: 0,
            marginBottom: paidTheme.spacing.xs,
            background: `linear-gradient(135deg, ${paidTheme.colors.text}, ${paidTheme.colors.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Morning Routine
        </h1>
        <p
          style={{
            fontSize: paidTheme.typography.fontSize.base,
            color: paidTheme.colors.textMuted,
            margin: 0,
          }}
        >
          Your daily market briefing and portfolio overview
        </p>
      </div>

      {/* Main Grid Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: paidTheme.spacing.lg,
        }}
      >
        {/* Left Column - Market Status + Alerts */}
        <div
          style={{
            gridColumn: 'span 3',
            display: 'flex',
            flexDirection: 'column',
            gap: paidTheme.spacing.lg,
          }}
        >
          <MarketStatus />
          <MarketAlerts />
        </div>

        {/* Middle Column - Portfolio + Schedule */}
        <div
          style={{
            gridColumn: 'span 6',
            display: 'flex',
            flexDirection: 'column',
            gap: paidTheme.spacing.lg,
          }}
        >
          <PortfolioSummary />
          <TodaySchedule />
        </div>

        {/* Right Column - Pre-Market Movers */}
        <div
          style={{
            gridColumn: 'span 3',
          }}
        >
          <PreMarketMovers />
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div
        style={{
          marginTop: paidTheme.spacing.xl,
          display: 'flex',
          gap: paidTheme.spacing.md,
          justifyContent: 'center',
        }}
      >
        {[
          { label: 'View Full Portfolio', icon: '📊' },
          { label: 'Trading Dashboard', icon: '📈' },
          { label: 'Research Tools', icon: '🔍' },
          { label: 'Settings', icon: '⚙️' },
        ].map((action) => (
          <button
            key={action.label}
            style={{
              background: paidTheme.colors.glass,
              border: `1px solid ${paidTheme.colors.glassBorder}`,
              borderRadius: paidTheme.borderRadius.md,
              padding: `${paidTheme.spacing.sm} ${paidTheme.spacing.lg}`,
              color: paidTheme.colors.text,
              fontSize: paidTheme.typography.fontSize.sm,
              fontWeight: 500,
              cursor: 'pointer',
              transition: `all ${paidTheme.animation.duration.normal}`,
              display: 'flex',
              alignItems: 'center',
              gap: paidTheme.spacing.sm,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = paidTheme.colors.glassHover;
              e.currentTarget.style.borderColor = paidTheme.colors.accent + '60';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = paidTheme.colors.glass;
              e.currentTarget.style.borderColor = paidTheme.colors.glassBorder;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MorningRoutine;
