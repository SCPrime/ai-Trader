import React from 'react';
import { paidTheme } from '../../../styles/paiid-theme';

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changePercent?: string;
  isPositive?: boolean;
  icon?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changePercent,
  isPositive,
  icon,
}) => {
  return (
    <div
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
        e.currentTarget.style.borderColor = paidTheme.colors.accent + '40';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = paidTheme.colors.glass;
        e.currentTarget.style.borderColor = paidTheme.colors.glassBorder;
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: paidTheme.spacing.sm,
        }}
      >
        <div
          style={{
            fontSize: paidTheme.typography.fontSize.xs,
            color: paidTheme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </div>
        {icon && (
          <div
            style={{
              fontSize: paidTheme.typography.fontSize.lg,
              opacity: 0.5,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: paidTheme.typography.fontSize['2xl'],
          color: paidTheme.colors.text,
          fontWeight: 600,
          fontFamily: paidTheme.typography.fontFamily.mono,
          marginBottom: paidTheme.spacing.xs,
        }}
      >
        {value}
      </div>

      {change && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: paidTheme.spacing.xs,
            fontSize: paidTheme.typography.fontSize.sm,
            color: isPositive
              ? paidTheme.colors.success
              : paidTheme.colors.error,
          }}
        >
          <span>{isPositive ? '↑' : '↓'}</span>
          <span>{change}</span>
          {changePercent && <span>({changePercent})</span>}
        </div>
      )}
    </div>
  );
};

export const PortfolioSummary: React.FC = () => {
  // Mock data - in production, this would come from your API/state
  const metrics = [
    {
      label: 'Total Value',
      value: '$125,432.18',
      change: '+$3,284.92',
      changePercent: '+2.69%',
      isPositive: true,
      icon: '💰',
    },
    {
      label: 'Day P&L',
      value: '+$1,847.23',
      change: '+$1,847.23',
      changePercent: '+1.49%',
      isPositive: true,
      icon: '📈',
    },
    {
      label: 'Buying Power',
      value: '$42,891.50',
      change: '-$5,200.00',
      changePercent: '-10.8%',
      isPositive: false,
      icon: '💵',
    },
    {
      label: 'Open Positions',
      value: '14',
      icon: '📊',
    },
    {
      label: 'Win Rate',
      value: '68.4%',
      change: '+2.1%',
      isPositive: true,
      icon: '🎯',
    },
    {
      label: 'Sharpe Ratio',
      value: '1.87',
      change: '+0.12',
      isPositive: true,
      icon: '📉',
    },
  ];

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
          display: 'flex',
          alignItems: 'center',
          gap: paidTheme.spacing.sm,
        }}
      >
        <span>Portfolio Summary</span>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: paidTheme.colors.success,
            boxShadow: paidTheme.effects.glow(paidTheme.colors.success),
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: paidTheme.spacing.md,
        }}
      >
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div
        style={{
          marginTop: paidTheme.spacing.lg,
          padding: paidTheme.spacing.md,
          background: `${paidTheme.colors.info}10`,
          border: `1px solid ${paidTheme.colors.info}30`,
          borderRadius: paidTheme.borderRadius.md,
          display: 'flex',
          alignItems: 'center',
          gap: paidTheme.spacing.md,
        }}
      >
        <div
          style={{
            fontSize: paidTheme.typography.fontSize.xl,
          }}
        >
          ℹ️
        </div>
        <div>
          <div
            style={{
              fontSize: paidTheme.typography.fontSize.sm,
              color: paidTheme.colors.text,
              fontWeight: 500,
            }}
          >
            Market conditions are favorable
          </div>
          <div
            style={{
              fontSize: paidTheme.typography.fontSize.xs,
              color: paidTheme.colors.textMuted,
              marginTop: '2px',
            }}
          >
            VIX at 14.2 • Low volatility environment
          </div>
        </div>
      </div>
    </div>
  );
};
