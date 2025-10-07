"use client";
import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity, DollarSign, Percent, Play } from 'lucide-react';
import { Card, Button, Input, Select } from './ui';
import { theme } from '../styles/theme';

interface BacktestConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: string;
  strategyName: string;
}

interface BacktestResults {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  equityCurve: { date: string; value: number }[];
  tradeHistory: {
    date: string;
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
    pnl: number;
  }[];
}

export default function Backtesting() {
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: 'SPY',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: '10000',
    strategyName: 'Select Strategy',
  });

  const [results, setResults] = useState<BacktestResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runBacktest = async () => {
    setIsRunning(true);

    // Simulate backtest
    setTimeout(() => {
      const mockResults: BacktestResults = {
        totalReturn: 1847.32,
        totalReturnPercent: 18.47,
        annualizedReturn: 18.47,
        sharpeRatio: 1.42,
        maxDrawdown: -12.3,
        winRate: 58.5,
        totalTrades: 47,
        winningTrades: 27,
        losingTrades: 20,
        avgWin: 142.50,
        avgLoss: -87.30,
        profitFactor: 2.13,
        equityCurve: generateEquityCurve(),
        tradeHistory: generateTradeHistory(),
      };

      setResults(mockResults);
      setIsRunning(false);
    }, 2000);
  };

  const generateEquityCurve = () => {
    const curve = [];
    let value = 10000;
    const startDate = new Date('2024-01-01');

    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const change = (Math.random() - 0.45) * 150;
      value += change;
      curve.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(8000, value),
      });
    }
    return curve;
  };

  const generateTradeHistory = () => {
    const trades = [];
    const types: ('buy' | 'sell')[] = ['buy', 'sell'];

    for (let i = 0; i < 10; i++) {
      const date = new Date('2024-01-01');
      date.setDate(date.getDate() + i * 36);
      trades.push({
        date: date.toISOString().split('T')[0],
        type: types[i % 2],
        price: 450 + Math.random() * 50,
        quantity: Math.floor(Math.random() * 20) + 1,
        pnl: (Math.random() - 0.4) * 300,
      });
    }
    return trades;
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <BarChart3 size={32} color={theme.colors.info} />
        <h1 style={{
          margin: 0,
          fontSize: '32px',
          fontWeight: '700',
          color: theme.colors.text,
          textShadow: `0 0 20px ${theme.colors.info}40`,
        }}>
          Backtesting
        </h1>
      </div>

      {/* Configuration */}
      <Card glow="teal" style={{ marginBottom: theme.spacing.lg }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, color: theme.colors.text, fontSize: '18px' }}>
          Configuration
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <Select
            label="Strategy"
            options={[
              { value: 'Select Strategy', label: 'Select Strategy' },
              { value: 'rsi', label: 'RSI Reversal' },
              { value: 'ma', label: 'Moving Average Crossover' },
              { value: 'breakout', label: 'Breakout Strategy' },
            ]}
            value={config.strategyName}
            onChange={(e) => setConfig({ ...config, strategyName: e.target.value })}
          />
          <Input
            label="Symbol"
            value={config.symbol}
            onChange={(e) => setConfig({ ...config, symbol: e.target.value.toUpperCase() })}
          />
          <Input
            label="Start Date"
            type="date"
            value={config.startDate}
            onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={config.endDate}
            onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
          />
          <Input
            label="Initial Capital"
            type="number"
            value={config.initialCapital}
            onChange={(e) => setConfig({ ...config, initialCapital: e.target.value })}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          loading={isRunning}
          onClick={runBacktest}
          style={{ margin: '0 auto', display: 'block' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <Play size={20} />
            {isRunning ? 'Running...' : 'Run Backtest'}
          </div>
        </Button>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}>
            <MetricCard
              icon={<DollarSign size={20} color={results.totalReturn >= 0 ? theme.colors.primary : theme.colors.danger} />}
              label="Total Return"
              value={`${results.totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              subValue={`${results.totalReturnPercent >= 0 ? '+' : ''}${results.totalReturnPercent.toFixed(2)}%`}
              valueColor={results.totalReturn >= 0 ? theme.colors.primary : theme.colors.danger}
            />
            <MetricCard
              icon={<TrendingUp size={20} color={theme.colors.primary} />}
              label="Annualized Return"
              value={`${results.annualizedReturn >= 0 ? '+' : ''}${results.annualizedReturn.toFixed(2)}%`}
              valueColor={results.annualizedReturn >= 0 ? theme.colors.primary : theme.colors.danger}
            />
            <MetricCard
              icon={<Activity size={20} color={theme.colors.info} />}
              label="Sharpe Ratio"
              value={results.sharpeRatio.toFixed(2)}
            />
            <MetricCard
              icon={<TrendingDown size={20} color={theme.colors.danger} />}
              label="Max Drawdown"
              value={`${results.maxDrawdown.toFixed(2)}%`}
              valueColor={theme.colors.danger}
            />
            <MetricCard
              icon={<Percent size={20} color={theme.colors.secondary} />}
              label="Win Rate"
              value={`${results.winRate.toFixed(1)}%`}
            />
            <MetricCard
              icon={<BarChart3 size={20} color={theme.colors.primary} />}
              label="Profit Factor"
              value={results.profitFactor.toFixed(2)}
              valueColor={results.profitFactor > 1 ? theme.colors.primary : theme.colors.danger}
            />
          </div>

          {/* Equity Curve */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, color: theme.colors.text, fontSize: '18px' }}>
              Equity Curve
            </h3>
            <div style={{
              height: '300px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2px',
              padding: theme.spacing.md,
              background: theme.background.input,
              borderRadius: theme.borderRadius.sm,
            }}>
              {results.equityCurve.filter((_, i) => i % 10 === 0).map((point, index) => {
                const height = ((point.value - 8000) / 4000) * 100;
                return (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      height: `${height}%`,
                      background: point.value > 10000 ? theme.colors.primary : theme.colors.danger,
                      borderRadius: '2px 2px 0 0',
                      transition: theme.transitions.fast,
                    }}
                    title={`${point.date}: ${point.value.toFixed(2)}`}
                  />
                );
              })}
            </div>
          </Card>

          {/* Trade Statistics */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, color: theme.colors.text, fontSize: '18px' }}>
              Trade Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: theme.spacing.md }}>
              <StatItem label="Total Trades" value={results.totalTrades.toString()} />
              <StatItem label="Winning" value={results.winningTrades.toString()} color={theme.colors.primary} />
              <StatItem label="Losing" value={results.losingTrades.toString()} color={theme.colors.danger} />
              <StatItem label="Avg Win" value={`${results.avgWin.toFixed(2)}`} color={theme.colors.primary} />
              <StatItem label="Avg Loss" value={`${Math.abs(results.avgLoss).toFixed(2)}`} color={theme.colors.danger} />
            </div>
          </Card>

          {/* Trade History */}
          <Card>
            <h3 style={{ margin: `0 0 ${theme.spacing.md} 0`, color: theme.colors.text, fontSize: '18px' }}>
              Recent Trades
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                    <th style={{ padding: theme.spacing.sm, textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>Date</th>
                    <th style={{ padding: theme.spacing.sm, textAlign: 'left', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>Type</th>
                    <th style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>Price</th>
                    <th style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>Qty</th>
                    <th style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', fontWeight: '600', color: theme.colors.textMuted }}>P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {results.tradeHistory.map((trade, index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${theme.colors.border}40` }}>
                      <td style={{ padding: theme.spacing.sm, fontSize: '14px', color: theme.colors.text }}>{trade.date}</td>
                      <td style={{ padding: theme.spacing.sm }}>
                        <span style={{
                          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: '12px',
                          fontWeight: '600',
                          background: trade.type === 'buy' ? `${theme.colors.primary}20` : `${theme.colors.danger}20`,
                          color: trade.type === 'buy' ? theme.colors.primary : theme.colors.danger,
                        }}>
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', color: theme.colors.text }}>
                        ${trade.price.toFixed(2)}
                      </td>
                      <td style={{ padding: theme.spacing.sm, textAlign: 'right', fontSize: '14px', color: theme.colors.text }}>
                        {trade.quantity}
                      </td>
                      <td style={{
                        padding: theme.spacing.sm,
                        textAlign: 'right',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: trade.pnl >= 0 ? theme.colors.primary : theme.colors.danger,
                      }}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

function StatItem({ label, value, color }: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>{label}</p>
      <p style={{ fontSize: '20px', fontWeight: '600', color: color || theme.colors.text, margin: `${theme.spacing.xs} 0 0 0` }}>
        {value}
      </p>
    </div>
  );
}
