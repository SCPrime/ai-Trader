"use client";
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Filter, Search, TrendingUp, TrendingDown, Tag } from 'lucide-react';
import { Card, Button, Input, Select } from './ui';
import { theme } from '../styles/theme';

interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  side: 'buy' | 'sell';
  entry_price: number;
  exit_price?: number;
  quantity: number;
  pnl?: number;
  strategy: string;
  setup: string;
  reasoning: string;
  emotions: string[];
  mistakes?: string;
  lessons?: string;
  outcome: 'win' | 'loss' | 'breakeven' | 'open';
  tags: string[];
}

export default function TradingJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'open'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadJournal();
  }, []);

  const loadJournal = () => {
    // Mock data - in production, load from localStorage or API
    const mockEntries: JournalEntry[] = [
      {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        symbol: 'AAPL',
        side: 'buy',
        entry_price: 178.50,
        exit_price: 182.30,
        quantity: 50,
        pnl: 190.00,
        strategy: 'Breakout',
        setup: 'Breaking above 20-day MA with volume',
        reasoning: 'Strong earnings report + bullish technical pattern',
        emotions: ['confident', 'patient'],
        lessons: 'Waiting for confirmation paid off',
        outcome: 'win',
        tags: ['tech', 'earnings', 'breakout'],
      },
      {
        id: '2',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        symbol: 'TSLA',
        side: 'buy',
        entry_price: 245.30,
        exit_price: 238.90,
        quantity: 25,
        pnl: -160.00,
        strategy: 'Mean Reversion',
        setup: 'Oversold RSI at support',
        reasoning: 'Expected bounce from support level',
        emotions: ['anxious', 'impatient'],
        mistakes: 'Didn\'t wait for confirmation, support broke',
        lessons: 'Always wait for reversal confirmation at support',
        outcome: 'loss',
        tags: ['tech', 'support-break'],
      },
      {
        id: '3',
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        symbol: 'SPY',
        side: 'buy',
        entry_price: 458.20,
        quantity: 100,
        strategy: 'Trend Following',
        setup: 'Higher highs and higher lows on daily',
        reasoning: 'Strong market momentum, riding the trend',
        emotions: ['calm', 'disciplined'],
        outcome: 'open',
        tags: ['spy', 'trend'],
      },
    ];

    setEntries(mockEntries);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesFilter = filter === 'all' || entry.outcome === filter || (filter === 'wins' && entry.outcome === 'win') || (filter === 'losses' && entry.outcome === 'loss');
    const matchesSearch = !searchTerm ||
      entry.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: entries.length,
    wins: entries.filter(e => e.outcome === 'win').length,
    losses: entries.filter(e => e.outcome === 'loss').length,
    open: entries.filter(e => e.outcome === 'open').length,
    totalPnL: entries.reduce((sum, e) => sum + (e.pnl || 0), 0),
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <BookOpen size={32} color={theme.colors.secondary} />
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            color: theme.colors.text,
            textShadow: `0 0 20px ${theme.colors.secondary}40`,
          }}>
            Trading Journal
          </h1>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setIsEditing(true);
            setSelectedEntry(null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <Plus size={20} />
            New Entry
          </div>
        </Button>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
      }}>
        <StatCard label="Total Entries" value={stats.total.toString()} color={theme.colors.text} />
        <StatCard label="Wins" value={stats.wins.toString()} color={theme.colors.primary} />
        <StatCard label="Losses" value={stats.losses.toString()} color={theme.colors.danger} />
        <StatCard label="Open" value={stats.open.toString()} color={theme.colors.warning} />
        <StatCard
          label="Total P&L"
          value={`${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toFixed(2)}`}
          color={stats.totalPnL >= 0 ? theme.colors.primary : theme.colors.danger}
        />
      </div>

      {/* Filters and Search */}
      <Card style={{ marginBottom: theme.spacing.md, padding: theme.spacing.md }}>
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              placeholder="Search by symbol, strategy, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.xs }}>
            {(['all', 'wins', 'losses', 'open'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Journal Entries */}
      {filteredEntries.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: theme.colors.textMuted }}>
            {searchTerm || filter !== 'all' ? 'No entries match your filter' : 'No journal entries yet. Click "New Entry" to start!'}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {filteredEntries.map((entry) => (
            <Card key={entry.id} glow={entry.outcome === 'win' ? 'green' : entry.outcome === 'loss' ? 'red' : undefined}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: theme.colors.text }}>
                      {entry.symbol}
                    </h3>
                    <span style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '12px',
                      fontWeight: '600',
                      background: entry.side === 'buy' ? `${theme.colors.primary}20` : `${theme.colors.danger}20`,
                      color: entry.side === 'buy' ? theme.colors.primary : theme.colors.danger,
                    }}>
                      {entry.side.toUpperCase()}
                    </span>
                    {entry.pnl !== undefined && (
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: entry.pnl >= 0 ? theme.colors.primary : theme.colors.danger,
                      }}>
                        {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: theme.colors.textMuted }}>
                    {entry.date} · {entry.strategy}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                  <Button variant="secondary" size="sm" onClick={() => {
                    setSelectedEntry(entry);
                    setIsEditing(true);
                  }}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => {
                    if (confirm(`Delete entry for ${entry.symbol}?`)) {
                      setEntries(entries.filter(e => e.id !== entry.id));
                    }
                  }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.md,
              }}>
                <Field label="Entry Price" value={`$${entry.entry_price.toFixed(2)}`} />
                {entry.exit_price && <Field label="Exit Price" value={`$${entry.exit_price.toFixed(2)}`} />}
                <Field label="Quantity" value={entry.quantity.toString()} />
                <Field label="Setup" value={entry.setup} />
              </div>

              <div style={{ marginBottom: theme.spacing.md }}>
                <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.xs} 0`, fontWeight: '600' }}>Reasoning</p>
                <p style={{ fontSize: '14px', color: theme.colors.text, margin: 0 }}>{entry.reasoning}</p>
              </div>

              {entry.emotions.length > 0 && (
                <div style={{ marginBottom: theme.spacing.md }}>
                  <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.xs} 0`, fontWeight: '600' }}>Emotions</p>
                  <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                    {entry.emotions.map((emotion, idx) => (
                      <span key={idx} style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        background: theme.background.input,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '12px',
                        color: theme.colors.text,
                      }}>
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {entry.mistakes && (
                <div style={{ marginBottom: theme.spacing.md }}>
                  <p style={{ fontSize: '12px', color: theme.colors.danger, margin: `0 0 ${theme.spacing.xs} 0`, fontWeight: '600' }}>Mistakes</p>
                  <p style={{ fontSize: '14px', color: theme.colors.text, margin: 0 }}>{entry.mistakes}</p>
                </div>
              )}

              {entry.lessons && (
                <div style={{ marginBottom: theme.spacing.md }}>
                  <p style={{ fontSize: '12px', color: theme.colors.primary, margin: `0 0 ${theme.spacing.xs} 0`, fontWeight: '600' }}>Lessons Learned</p>
                  <p style={{ fontSize: '14px', color: theme.colors.text, margin: 0 }}>{entry.lessons}</p>
                </div>
              )}

              {entry.tags.length > 0 && (
                <div style={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                  {entry.tags.map((tag, idx) => (
                    <span key={idx} style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      background: `${theme.colors.secondary}20`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '12px',
                      color: theme.colors.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                    }}>
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New/Edit Entry Modal */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: theme.spacing.lg,
        }}>
          <Card style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: `0 0 ${theme.spacing.lg} 0`, color: theme.colors.text }}>
              {selectedEntry ? 'Edit Entry' : 'New Entry'}
            </h2>

            <div style={{ marginBottom: theme.spacing.lg, fontSize: '14px', color: theme.colors.textMuted }}>
              Journal entry form would go here with fields for symbol, prices, reasoning, emotions, etc.
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => {
                // Save logic here
                setIsEditing(false);
              }}>
                Save Entry
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.xs} 0` }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: '700', color, margin: 0 }}>{value}</p>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.xs} 0` }}>{label}</p>
      <p style={{ fontSize: '14px', color: theme.colors.text, margin: 0 }}>{value}</p>
    </div>
  );
}
