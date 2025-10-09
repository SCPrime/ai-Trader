import React, { useState } from 'react';
import { paidTheme } from '../../../styles/paiid-theme';

type AlertSeverity = 'critical' | 'warning' | 'info' | 'success' | 'neutral';

interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  symbol?: string;
}

const severityConfig = {
  critical: {
    color: paidTheme.colors.error,
    icon: '🚨',
    label: 'Critical',
  },
  warning: {
    color: paidTheme.colors.warning,
    icon: '⚠️',
    label: 'Warning',
  },
  info: {
    color: paidTheme.colors.info,
    icon: 'ℹ️',
    label: 'Info',
  },
  success: {
    color: paidTheme.colors.success,
    icon: '✅',
    label: 'Success',
  },
  neutral: {
    color: paidTheme.colors.textMuted,
    icon: '📌',
    label: 'Notice',
  },
};

export const MarketAlerts: React.FC = () => {
  // Mock alerts - in production, fetch from API/WebSocket
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      severity: 'critical',
      title: 'Stop Loss Triggered',
      message: 'TSLA position closed at $242.50, -2.5% loss',
      timestamp: new Date(Date.now() - 5 * 60000),
      symbol: 'TSLA',
    },
    {
      id: '2',
      severity: 'warning',
      title: 'High Volatility Alert',
      message: 'NVDA volatility spike detected, IV increased 35%',
      timestamp: new Date(Date.now() - 15 * 60000),
      symbol: 'NVDA',
    },
    {
      id: '3',
      severity: 'success',
      title: 'Profit Target Reached',
      message: 'AAPL position hit +15% target, consider scaling out',
      timestamp: new Date(Date.now() - 25 * 60000),
      symbol: 'AAPL',
    },
    {
      id: '4',
      severity: 'info',
      title: 'Earnings Reminder',
      message: 'MSFT reports earnings today after market close',
      timestamp: new Date(Date.now() - 45 * 60000),
      symbol: 'MSFT',
    },
    {
      id: '5',
      severity: 'neutral',
      title: 'Market Update',
      message: 'S&P 500 testing resistance at 4,500',
      timestamp: new Date(Date.now() - 60 * 60000),
    },
  ]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id));

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
          justifyContent: 'space-between',
        }}
      >
        <span>Market Alerts</span>
        <div
          style={{
            fontSize: paidTheme.typography.fontSize.xs,
            color: paidTheme.colors.textMuted,
            fontWeight: 400,
            background: `${paidTheme.colors.error}20`,
            border: `1px solid ${paidTheme.colors.error}40`,
            borderRadius: paidTheme.borderRadius.full,
            padding: `${paidTheme.spacing.xs} ${paidTheme.spacing.sm}`,
          }}
        >
          {visibleAlerts.length} active
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: paidTheme.spacing.sm,
          maxHeight: '400px',
          overflowY: 'auto',
          paddingRight: paidTheme.spacing.xs,
        }}
      >
        {visibleAlerts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: paidTheme.spacing.xl,
              color: paidTheme.colors.textMuted,
            }}
          >
            No active alerts
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const config = severityConfig[alert.severity];

            return (
              <div
                key={alert.id}
                style={{
                  background: `${config.color}10`,
                  border: `1px solid ${config.color}40`,
                  borderLeft: `4px solid ${config.color}`,
                  borderRadius: paidTheme.borderRadius.md,
                  padding: paidTheme.spacing.md,
                  transition: `all ${paidTheme.animation.duration.normal}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${config.color}20`;
                  e.currentTarget.style.borderColor = `${config.color}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${config.color}10`;
                  e.currentTarget.style.borderColor = `${config.color}40`;
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: paidTheme.spacing.md,
                  }}
                >
                  <div
                    style={{
                      fontSize: paidTheme.typography.fontSize.xl,
                      lineHeight: 1,
                    }}
                  >
                    {config.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: paidTheme.spacing.sm,
                        marginBottom: paidTheme.spacing.xs,
                      }}
                    >
                      <div
                        style={{
                          fontSize: paidTheme.typography.fontSize.base,
                          color: paidTheme.colors.text,
                          fontWeight: 600,
                        }}
                      >
                        {alert.title}
                      </div>
                      {alert.symbol && (
                        <div
                          style={{
                            fontSize: paidTheme.typography.fontSize.xs,
                            color: config.color,
                            fontFamily: paidTheme.typography.fontFamily.mono,
                            fontWeight: 600,
                            background: `${config.color}20`,
                            padding: `2px ${paidTheme.spacing.xs}`,
                            borderRadius: paidTheme.borderRadius.sm,
                          }}
                        >
                          {alert.symbol}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: paidTheme.typography.fontSize.sm,
                        color: paidTheme.colors.textMuted,
                        marginBottom: paidTheme.spacing.xs,
                      }}
                    >
                      {alert.message}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          fontSize: paidTheme.typography.fontSize.xs,
                          color: paidTheme.colors.textDim,
                          fontFamily: paidTheme.typography.fontFamily.mono,
                        }}
                      >
                        {formatTimestamp(alert.timestamp)}
                      </div>

                      <button
                        onClick={() => handleDismiss(alert.id)}
                        style={{
                          fontSize: paidTheme.typography.fontSize.xs,
                          color: paidTheme.colors.textMuted,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: `${paidTheme.spacing.xs} ${paidTheme.spacing.sm}`,
                          borderRadius: paidTheme.borderRadius.sm,
                          transition: `all ${paidTheme.animation.duration.fast}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            paidTheme.colors.glass;
                          e.currentTarget.style.color = paidTheme.colors.text;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color =
                            paidTheme.colors.textMuted;
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
