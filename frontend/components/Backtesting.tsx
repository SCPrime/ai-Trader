"use client";
import { useState } from 'react';
import { TrendingUp, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { Card, Button, Input, Select } from './ui';
import { theme } from '../styles/theme';

interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  equityCurve: { date: string; value: number }[];
  trades: Trade[];
}

interface Trade {
  date: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  pnl: number;
  pnlPercent: number;
}

export default function Backtesting() {
  const [strategy, setStrategy] = useState('rsi-mean-reversion');
  const [symbol, setSymbol] = useState('SPY');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [initialCapital, setInitialCapital] = useState('10000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const strategyOptions = [
    { value: 'rsi-mean-reversion', label: 'RSI Mean Reversion' },
    { value: 'macd-trend-following', label: 'MACD Trend Following' },
    { value: 'bollinger-breakout', label: 'Bollinger Band Breakout' },
    { value: 'moving-average-cross', label: 'Moving Average Crossover' },
    { value: 'custom-strategy', label: 'Custom Strategy' },
  ];

  const runBacktest = async () => {
    setLoading(true);

    // Simulate backtest - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock results
    const mockResult: BacktestResult = {
      totalReturn: 24.5,
      annualizedReturn: 18.3,
      sharpeRatio: 1.45,
      maxDrawdown: -8.2,
      winRate: 58.3,
      totalTrades: 127,
      profitableTrades: 74,
      averageWin: 2.8,
      averageLoss: -1.9,
      profitFactor: 1.62,
      equityCurve: generateMockEquityCurve(),
      trades: generateMockTrades(),
    };

    setResult(mockResult);
    setLoading(false);
  };

  const generateMockEquityCurve = () => {
    const curve = [];
    let value = parseFloat(initialCapital);
    const days = 252; // Trading days in a year
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      value *= (1 + (Math.random() * 0.02 - 0.008)); // Random daily returns
      curve.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
      });
    }
    return curve;
  };

  const generateMockTrades = (): Trade[] => {
    return [
      {
        date: '2023-02-15',
        symbol: 'SPY',
        side: 'buy',
        quantity: 10,
        price: 412.50,
        pnl: 125.00,
        pnlPercent: 3.03,
      },
      {
        date: '2023-03-22',
        symbol: 'SPY',
        side: 'sell',
        quantity: 10,
        price: 405.30,
        pnl: -72.00,
        pnlPercent: -1.75,
      },
      {
        date: '2023-04-10',
        symbol: 'SPY',
        side: 'buy',
        quantity: 10,
        price: 418.75,
        pnl: 218.50,
        pnlPercent: 5.22,
      },
      {
        date: '2023-05-18',
        symbol: 'SPY',
        side: 'buy',
        quantity: 10,
        price: 422.90,
        pnl: 164.00,
        pnlPercent: 3.88,
      },
      {
        date: '2023-06-25',
        symbol: 'SPY',
        side: 'sell',
        quantity: 10,
        price: 415.60,
        pnl: -91.00,
        pnlPercent: -2.15,
      },
    ];
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg
      }}>
        <BarChart3 size={32} color={theme.colors.info} />
        <h1 style={{
          margin: 0,
          fontSize: '32px',
          fontWeight: '700',
          color: theme.colors.text,
          textShadow: theme.glow.teal,
        }}>
          Backtesting
        </h1>
      </div>

      {/* Configuration */}
      <Card glow="teal" style={{ marginBottom: theme.spacing.lg }}>
        <h2 style={{
          margin: 0,
          marginBottom: theme.spacing.md,
          fontSize: '20px',
          fontWeight: '600',
          color: theme.colors.text
        }}>
          Backtest Configuration
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.md }}>
          <Select
            label="Strategy"
            options={strategyOptions}
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          />
          <Input
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="SPY"
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Input
            label="Initial Capital ($)"
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            placeholder="10000"
          />
        </div>
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onClick={runBacktest}
          style={{ marginTop: theme.spacing.md, width: '100%' }}
        >
          {loading ? 'Running Backtest...' : 'Run Backtest'}
        </Button>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Performance Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}>
            <MetricCard
              icon={<TrendingUp size={20} color={theme.colors.primary} />}
              label="Total Return"
              value={`${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(2)}%`}
              valueColor={result.totalReturn >= 0 ? theme.colors.primary : theme.colors.danger}
            />
            <MetricCard
              icon={<TrendingUp size={20} color={theme.colors.secondary} />}
              label="Annualized Return"
              value={`${result.annualizedReturn >= 0 ? '+' : ''}${result.annualizedReturn.toFixed(2)}%`}
              valueColor={result.annualizedReturn >= 0 ? theme.colors.secondary : theme.colors.danger}
            />
            <MetricCard
              icon={<BarChart3 size={20} color={theme.colors.info} />}
              label="Sharpe Ratio"
              value={result.sharpeRatio.toFixed(2)}
            />
            <MetricCard
              icon={<TrendingUp size={20} color={theme.colors.danger} />}
              label="Max Drawdown"
              value={`${result.maxDrawdown.toFixed(2)}%`}
              valueColor={theme.colors.danger}
            />
            <MetricCard
              icon={<DollarSign size={20} color={theme.colors.accent} />}
              label="Win Rate"
              value={`${result.winRate.toFixed(1)}%`}
            />
            <MetricCard
              icon={<BarChart3 size={20} color={theme.colors.primary} />}
              label="Profit Factor"
              value={result.profitFactor.toFixed(2)}
            />
          </div>

          {/* Equity Curve */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <h3 style={{
              margin: 0,
              marginBottom: theme.spacing.md,
              fontSize: '18px',
              fontWeight: '600',
              color: theme.colors.text
            }}>
              Equity Curve
            </h3>
            <div style={{
              height: '300px',
              background: theme.background.input,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              position: 'relative',
            }}>
              {/* Simple SVG line chart */}
              <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                <polyline
                  points={result.equityCurve.map((point, i) => {
                    const x = (i / (result.equityCurve.length - 1)) * 100;
                    const minVal = Math.min(...result.equityCurve.map(p => p.value));
                    const maxVal = Math.max(...result.equityCurve.map(p => p.value));
                    const y = 90 - ((point.value - minVal) / (maxVal - minVal)) * 80;
                    return `${x}%,${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke={theme.colors.primary}
                  strokeWidth="2"
                />
              </svg>
              <div style={{
                position: 'absolute',
                bottom: theme.spacing.sm,
                left: theme.spacing.sm,
                fontSize: '12px',
                color: theme.colors.textMuted,
              }}>
                {result.equityCurve[0].date}
              </div>
              <div style={{
                position: 'absolute',
                bottom: theme.spacing.sm,
                right: theme.spacing.sm,
                fontSize: '12px',
                color: theme.colors.textMuted,
              }}>
                {result.equityCurve[result.equityCurve.length - 1].date}
              </div>
            </div>
          </Card>

          {/* Trade Statistics */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <h3 style={{
              margin: 0,
              marginBottom: theme.spacing.md,
              fontSize: '18px',
              fontWeight: '600',
              color: theme.colors.text
            }}>
              Trade Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Total Trades</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.text, margin: `${theme.spacing.xs} 0 0 0` }}>
                  {result.totalTrades}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Profitable Trades</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.primary, margin: `${theme.spacing.xs} 0 0 0` }}>
                  {result.profitableTrades}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Losing Trades</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.danger, margin: `${theme.spacing.xs} 0 0 0` }}>
                  {result.totalTrades - result.profitableTrades}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Average Win</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.primary, margin: `${theme.spacing.xs} 0 0 0` }}>
                  +{result.averageWin.toFixed(2)}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Average Loss</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.danger, margin: `${theme.spacing.xs} 0 0 0` }}>
                  {result.averageLoss.toFixed(2)}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Expectancy</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: theme.colors.text, margin: `${theme.spacing.xs} 0 0 0` }}>
                  {((result.averageWin * (result.winRate / 100)) + (result.averageLoss * (1 - result.winRate / 100))).toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Trade History */}
          <Card>
            <h3 style={{
              margin: 0,
              marginBottom: theme.spacing.md,
              fontSize: '18px',
              fontWeight: '600',
              color: theme.colors.text
            }}>
              Recent Trades
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                    {['Date', 'Symbol', 'Side', 'Quantity', 'Price', 'P&L', 'P&L %'].map((header) => (
                      <th key={header} style={{
                        textAlign: 'left',
                        padding: theme.spacing.sm,
                        fontSize: '12px',
                        fontWeight: '600',
                        color: theme.colors.textMuted,
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.trades.map((trade, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                      <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{trade.date}</td>
                      <td style={{ padding: theme.spacing.sm, color: theme.colors.text, fontWeight: '600' }}>{trade.symbol}</td>
                      <td style={{
                        padding: theme.spacing.sm,
                        color: trade.side === 'buy' ? theme.colors.primary : theme.colors.danger,
                        textTransform: 'uppercase',
                        fontWeight: '600',
                      }}>
                        {trade.side}
                      </td>
                      <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>{trade.quantity}</td>
                      <td style={{ padding: theme.spacing.sm, color: theme.colors.text }}>${trade.price.toFixed(2)}</td>
                      <td style={{
                        padding: theme.spacing.sm,
                        color: trade.pnl >= 0 ? theme.colors.primary : theme.colors.danger,
                        fontWeight: '600',
                      }}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </td>
                      <td style={{
                        padding: theme.spacing.sm,
                        color: trade.pnlPercent >= 0 ? theme.colors.primary : theme.colors.danger,
                        fontWeight: '600',
                      }}>
                        {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
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

function MetricCard({ icon, label, value, valueColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
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
        margin: 0
      }}>
        {value}
      </p>
    </Card>
  );
}
