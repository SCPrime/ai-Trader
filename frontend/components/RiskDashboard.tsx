"use client";
import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingDown, DollarSign, Percent, Clock, Activity } from 'lucide-react';
import { Card, Button } from './ui';
import { theme } from '../styles/theme';
import { alpaca } from '../lib/alpaca';

interface RiskMetrics {
  portfolioValue: number;
  buyingPower: number;
  dayTradeBuyingPower: number;
  cashBalance: number;
  portfolioRisk: number;
  maxDailyLoss: number;
  currentDailyLoss: number;
  maxPositionSize: number;
  openPositions: number;
  maxPositions: number;
  marginUsed: number;
  marginAvailable: number;
}

interface RiskAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
}

interface PositionRisk {
  symbol: string;
  exposure: number;
  riskPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  riskRewardRatio?: number;
}

export default function RiskDashboard() {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [positionRisks, setPositionRisks] = useState<PositionRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiskMetrics();
    const interval = setInterval(loadRiskMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRiskMetrics = async () => {
    setLoading(true);

    try {
      const [account, positions] = await Promise.all([
        alpaca.getAccount(),
        alpaca.getPositions(),
      ]);

      const portfolioValue = parseFloat(account.equity);
      const cashBalance = parseFloat(account.cash);
      const buyingPower = parseFloat(account.buying_power);

      // Calculate risk metrics
      const maxDailyLoss = portfolioValue * 0.02; // 2% max daily loss
      const currentDayPL = parseFloat(account.equity) - parseFloat(account.last_equity);
      const currentDailyLoss = currentDayPL < 0 ? Math.abs(currentDayPL) : 0;

      const marginUsed = parseFloat(account.initial_margin);
      const marginAvailable = buyingPower - portfolioValue;

      const calculatedMetrics: RiskMetrics = {
        portfolioValue,
        buyingPower,
        dayTradeBuyingPower: buyingPower, // Use buying_power as fallback
        cashBalance,
        portfolioRisk: (marginUsed / portfolioValue) * 100,
        maxDailyLoss,
        currentDailyLoss,
        maxPositionSize: portfolioValue * 0.1, // 10% max per position
        openPositions: positions.length,
        maxPositions: 10,
        marginUsed,
        marginAvailable,
      };

      // Calculate position-level risk
      const posRisks: PositionRisk[] = positions.map(pos => ({
        symbol: pos.symbol,
        exposure: parseFloat(pos.market_value),
        riskPercent: (parseFloat(pos.market_value) / portfolioValue) * 100,
        // Mock stop loss/take profit - in production, get from orders
        stopLoss: parseFloat(pos.avg_entry_price) * 0.98,
        takeProfit: parseFloat(pos.avg_entry_price) * 1.05,
        riskRewardRatio: 2.5,
      }));

      // Generate risk alerts
      const newAlerts: RiskAlert[] = [];

      if (currentDailyLoss > maxDailyLoss * 0.5) {
        newAlerts.push({
          id: '1',
          type: currentDailyLoss > maxDailyLoss ? 'critical' : 'warning',
          message: `Daily loss at ${((currentDailyLoss / maxDailyLoss) * 100).toFixed(0)}% of max limit`,
          timestamp: new Date().toISOString(),
        });
      }

      if (positions.length >= 8) {
        newAlerts.push({
          id: '2',
          type: positions.length >= 10 ? 'critical' : 'warning',
          message: `${positions.length} open positions (max: 10)`,
          timestamp: new Date().toISOString(),
        });
      }

      posRisks.forEach(pos => {
        if (pos.riskPercent > 10) {
          newAlerts.push({
            id: `risk-${pos.symbol}`,
            type: 'warning',
            message: `${pos.symbol} position exceeds 10% portfolio limit (${pos.riskPercent.toFixed(1)}%)`,
            timestamp: new Date().toISOString(),
          });
        }
      });

      setMetrics(calculatedMetrics);
      setPositionRisks(posRisks);
      setAlerts(newAlerts);
    } catch (error) {
      console.error('Failed to load risk metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Card>
          <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textMuted }}>
            Loading risk metrics...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Shield size={32} color={theme.colors.warning} />
        <h1 style={{
          margin: 0,
          fontSize: '32px',
          fontWeight: '700',
          color: theme.colors.text,
          textShadow: `0 0 20px ${theme.colors.warning}40`,
        }}>
          Risk Management Dashboard
        </h1>
      </div>

      {/* Risk Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          {alerts.map(alert => (
            <Card key={alert.id} style={{
              marginBottom: theme.spacing.sm,
              borderLeft: `4px solid ${alert.type === 'critical' ? theme.colors.danger : alert.type === 'warning' ? theme.colors.warning : theme.colors.info}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <AlertTriangle size={20} color={alert.type === 'critical' ? theme.colors.danger : theme.colors.warning} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.colors.text }}>
                    {alert.message}
                  </p>
                  <p style={{ margin: `${theme.spacing.xs} 0 0 0`, fontSize: '12px', color: theme.colors.textMuted }}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Risk Metrics */}
      {metrics && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}>
            <MetricCard
              icon={<DollarSign size={20} color={theme.colors.secondary} />}
              label="Portfolio Value"
              value={`$${metrics.portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            />
            <MetricCard
              icon={<DollarSign size={20} color={theme.colors.info} />}
              label="Buying Power"
              value={`$${metrics.buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            />
            <MetricCard
              icon={<Percent size={20} color={theme.colors.warning} />}
              label="Portfolio Risk"
              value={`${metrics.portfolioRisk.toFixed(2)}%`}
              valueColor={metrics.portfolioRisk > 50 ? theme.colors.danger : theme.colors.warning}
            />
            <MetricCard
              icon={<TrendingDown size={20} color={theme.colors.danger} />}
              label="Daily Loss"
              value={`$${metrics.currentDailyLoss.toFixed(2)}`}
              subValue={`Max: $${metrics.maxDailyLoss.toFixed(2)}`}
              valueColor={metrics.currentDailyLoss > metrics.maxDailyLoss * 0.5 ? theme.colors.danger : theme.colors.warning}
            />
          </div>

          {/* Position Limits */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Card>
              <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, color: theme.colors.text, fontSize: '18px' }}>
                Position Limits
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <LimitBar
                  label="Open Positions"
                  current={metrics.openPositions}
                  max={metrics.maxPositions}
                  unit=""
                />
                <LimitBar
                  label="Daily Loss"
                  current={metrics.currentDailyLoss}
                  max={metrics.maxDailyLoss}
                  unit="$"
                />
                <LimitBar
                  label="Max Position Size"
                  current={metrics.maxPositionSize}
                  max={metrics.portfolioValue}
                  unit="$"
                  info
                />
              </div>
            </Card>

            <Card>
              <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, color: theme.colors.text, fontSize: '18px' }}>
                Margin Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <StatRow label="Margin Used" value={`$${metrics.marginUsed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <StatRow label="Margin Available" value={`$${metrics.marginAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <StatRow label="Day Trade BP" value={`$${metrics.dayTradeBuyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <StatRow label="Cash Balance" value={`$${metrics.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
              </div>
            </Card>
          </div>

          {/* Position Risk Breakdown */}
          {positionRisks.length > 0 && (
            <Card>
              <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, color: theme.colors.text, fontSize: '18px' }}>
                Position Risk Analysis
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                      <th style={{ padding: theme.spacing.sm, textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>Symbol</th>
                      <th style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>Exposure</th>
                      <th style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>% Portfolio</th>
                      <th style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>Stop Loss</th>
                      <th style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>Take Profit</th>
                      <th style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>R:R Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionRisks.map((pos, index) => (
                      <tr key={index} style={{ borderBottom: `1px solid ${theme.colors.border}40` }}>
                        <td style={{ padding: theme.spacing.sm, fontSize: '14px', fontWeight: '600', color: theme.colors.text }}>{pos.symbol}</td>
                        <td style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', color: theme.colors.text }}>
                          ${pos.exposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: pos.riskPercent > 10 ? theme.colors.danger : theme.colors.primary }}>
                          {pos.riskPercent.toFixed(2)}%
                        </td>
                        <td style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', color: theme.colors.danger }}>
                          {pos.stopLoss ? `$${pos.stopLoss.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', color: theme.colors.primary }}>
                          {pos.takeProfit ? `$${pos.takeProfit.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.secondary }}>
                          {pos.riskRewardRatio ? `1:${pos.riskRewardRatio.toFixed(1)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Risk Guidelines */}
          <Card style={{ marginTop: theme.spacing.lg }}>
            <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, color: theme.colors.text, fontSize: '18px' }}>
              Risk Management Guidelines
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing.md }}>
              <GuidelineItem
                title="Maximum Daily Loss"
                value="2% of portfolio"
                description="Auto-stop trading if reached"
              />
              <GuidelineItem
                title="Position Size Limit"
                value="10% per position"
                description="Diversify across multiple positions"
              />
              <GuidelineItem
                title="Maximum Positions"
                value="10 simultaneous"
                description="Maintain manageable portfolio"
              />
              <GuidelineItem
                title="Risk:Reward Ratio"
                value="Minimum 1:2"
                description="Ensure favorable risk/reward"
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, subValue, valueColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
}) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.xs }}>
        {icon}
        <p style={{ fontSize: '14px', color: theme.colors.textMuted, margin: 0 }}>{label}</p>
      </div>
      <p style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: valueColor || theme.colors.text,
        margin: 0,
      }}>
        {value}
      </p>
      {subValue && (
        <p style={{ fontSize: '14px', color: theme.colors.textMuted, margin: `${theme.spacing.xs} 0 0 0` }}>
          {subValue}
        </p>
      )}
    </Card>
  );
}

function LimitBar({ label, current, max, unit, info }: {
  label: string;
  current: number;
  max: number;
  unit: string;
  info?: boolean;
}) {
  const percent = (current / max) * 100;
  const color = info ? theme.colors.info : percent > 80 ? theme.colors.danger : percent > 60 ? theme.colors.warning : theme.colors.primary;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
        <span style={{ fontSize: '14px', color: theme.colors.text }}>{label}</span>
        <span style={{ fontSize: '14px', fontWeight: '600', color }}>
          {unit}{current.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / {unit}{max.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
      <div style={{
        height: '8px',
        background: theme.background.input,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(percent, 100)}%`,
          height: '100%',
          background: color,
          transition: theme.transitions.fast,
        }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: theme.colors.textMuted }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: '600', color: color || theme.colors.text }}>{value}</span>
    </div>
  );
}

function GuidelineItem({ title, value, description }: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div style={{
      padding: theme.spacing.md,
      background: theme.background.input,
      borderRadius: theme.borderRadius.md,
    }}>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.colors.text }}>{title}</p>
      <p style={{ margin: `${theme.spacing.xs} 0`, fontSize: '20px', fontWeight: '700', color: theme.colors.primary }}>{value}</p>
      <p style={{ margin: 0, fontSize: '12px', color: theme.colors.textMuted }}>{description}</p>
    </div>
  );
}
