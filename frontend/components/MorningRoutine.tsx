"use client";

import { useState, useEffect } from 'react';
import { Sun, Clock, AlertCircle, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import { GlassCard, GlassBadge } from './GlassmorphicComponents';
import { theme } from '../styles/theme';

interface MarketHours {
  isOpen: boolean;
  nextEvent: string;
  currentTime: string;
}

interface PortfolioMetrics {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  buyingPower: number;
}

interface SystemCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

interface NewsItem {
  title: string;
  impact: 'high' | 'medium' | 'low';
  time: string;
}

export default function MorningRoutine() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [systemChecks] = useState<SystemCheck[]>([
    { name: 'API Connection', status: 'pass', message: 'Connected to Alpaca' },
    { name: 'Market Data', status: 'pass', message: 'Real-time feed active' },
    { name: 'Account Status', status: 'pass', message: 'Paper trading account active' },
    { name: 'Risk Limits', status: 'warning', message: 'Daily loss at 75%' },
  ]);

  const [portfolio] = useState<PortfolioMetrics>({
    totalValue: 18234.56,
    dayChange: 156.23,
    dayChangePercent: 0.86,
    buyingPower: 8500.00,
  });

  const [todaysNews] = useState<NewsItem[]>([
    { title: 'Fed Interest Rate Decision', impact: 'high', time: '2:00 PM ET' },
    { title: 'Tech Earnings: AAPL, MSFT', impact: 'high', time: 'After Close' },
    { title: 'Unemployment Claims', impact: 'medium', time: '8:30 AM ET' },
    { title: 'Oil Inventory Report', impact: 'low', time: '10:30 AM ET' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getMarketStatus = (): MarketHours => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = hour >= 9 && hour < 16;

    return {
      isOpen: isWeekday && isMarketHours,
      nextEvent: isWeekday && !isMarketHours ? 'Opens at 9:30 AM ET' : 'Closes at 4:00 PM ET',
      currentTime: now.toLocaleTimeString('en-US'),
    };
  };

  const runMorningChecks = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const market = getMarketStatus();
  const accentColor = theme.workflow.morningRoutine;

  return (
    <div style={{
      height: '100%',
      background: theme.background.primary,
      padding: theme.spacing.lg,
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div style={{
              padding: theme.spacing.md,
              background: `${accentColor}20`,
              borderRadius: theme.borderRadius.lg,
              boxShadow: theme.glow.teal,
            }}>
              <Sun style={{ width: '32px', height: '32px', color: accentColor }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: theme.colors.text,
                margin: 0,
              }}>
                Morning Routine
              </h1>
              <p style={{
                color: theme.colors.textMuted,
                margin: '4px 0 0 0',
                fontSize: '14px',
              }}>
                Pre-market analysis and system checks
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>Current Time</div>
            <div style={{
              fontSize: '24px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: accentColor,
              marginTop: '4px',
            }}>
              {market.currentTime}
            </div>
          </div>
        </div>

        {/* Market Status Card */}
        <GlassCard glow="teal">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <Clock style={{ width: '24px', height: '24px', color: accentColor }} />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>
                  Market Status
                </h3>
                <p style={{ fontSize: '14px', color: theme.colors.textMuted, margin: '4px 0 0 0' }}>
                  {market.nextEvent}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: market.isOpen ? theme.colors.primary : theme.colors.danger,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: market.isOpen ? theme.colors.primary : theme.colors.danger,
              }}>
                {market.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Portfolio Summary */}
        <GlassCard>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.colors.text,
            margin: `0 0 ${theme.spacing.md} 0`,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}>
            <DollarSign style={{ width: '20px', height: '20px', color: accentColor }} />
            Portfolio Overview
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.md,
          }}>
            {[
              { label: 'Total Value', value: `$${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: theme.colors.text },
              { label: 'Day Change', value: `${portfolio.dayChange >= 0 ? '+' : ''}$${Math.abs(portfolio.dayChange).toFixed(2)}`, color: portfolio.dayChange >= 0 ? theme.colors.primary : theme.colors.danger },
              { label: 'Day Change %', value: `${portfolio.dayChangePercent >= 0 ? '+' : ''}${portfolio.dayChangePercent.toFixed(2)}%`, color: portfolio.dayChangePercent >= 0 ? theme.colors.primary : theme.colors.danger },
              { label: 'Buying Power', value: `$${portfolio.buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: accentColor },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: theme.background.input,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
              }}>
                <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* System Checks */}
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.colors.text,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: accentColor }} />
              System Health Checks
            </h3>
            <button
              onClick={runMorningChecks}
              disabled={loading}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}50`,
                color: accentColor,
                borderRadius: theme.borderRadius.md,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: theme.transitions.fast,
                fontWeight: '600',
              }}
            >
              {loading ? 'Checking...' : 'Re-run Checks'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {systemChecks.map((check, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.spacing.md,
                background: theme.background.input,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  {check.status === 'pass' && <CheckCircle style={{ width: '20px', height: '20px', color: theme.colors.primary }} />}
                  {check.status === 'fail' && <XCircle style={{ width: '20px', height: '20px', color: theme.colors.danger }} />}
                  {check.status === 'warning' && <AlertCircle style={{ width: '20px', height: '20px', color: theme.colors.warning }} />}
                  <div>
                    <div style={{ color: theme.colors.text, fontWeight: '500' }}>{check.name}</div>
                    <div style={{ fontSize: '14px', color: theme.colors.textMuted }}>{check.message}</div>
                  </div>
                </div>
                <GlassBadge
                  variant={check.status === 'pass' ? 'success' : check.status === 'fail' ? 'danger' : 'warning'}
                >
                  {check.status}
                </GlassBadge>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Today's Economic Events */}
        <GlassCard>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.colors.text,
            margin: `0 0 ${theme.spacing.md} 0`,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}>
            <Calendar style={{ width: '20px', height: '20px', color: accentColor }} />
            Today's Economic Calendar
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {todaysNews.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.spacing.md,
                background: theme.background.input,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                transition: theme.transitions.fast,
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  <GlassBadge
                    variant={item.impact === 'high' ? 'danger' : item.impact === 'medium' ? 'warning' : 'info'}
                  >
                    {item.impact}
                  </GlassBadge>
                  <span style={{ color: theme.colors.text }}>{item.title}</span>
                </div>
                <span style={{ fontSize: '14px', color: theme.colors.textMuted }}>{item.time}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Action Button */}
        <button
          style={{
            width: '100%',
            padding: theme.spacing.lg,
            background: `linear-gradient(to right, ${theme.colors.primary}, #00C851)`,
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '16px',
            borderRadius: theme.borderRadius.lg,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            transition: theme.transitions.fast,
            boxShadow: theme.glow.green,
          }}
          onClick={() => alert('Morning routine complete!')}
        >
          <CheckCircle style={{ width: '20px', height: '20px' }} />
          Complete Morning Routine
        </button>
      </div>
    </div>
  );
}
