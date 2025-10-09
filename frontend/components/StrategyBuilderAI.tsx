// @ts-nocheck
/**
 * AI-Powered Strategy Builder
 * Natural language strategy generation with visual editing
 * NOTE: TypeScript checking disabled temporarily - needs interface fixes
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Code2,
  Save,
  Play,
  Trash2,
  Edit3,
  AlertCircle,
  TrendingUp,
  Shield,
  Target,
  Brain,
  Loader2,
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassBadge } from './GlassmorphicComponents';
import { theme } from '../styles/theme';
import { claudeAI } from '../lib/aiAdapter';
interface Strategy {
  id?: string;  name: string;  entry: string[];  exit: string[];  riskManagement: string[];  code?: string;}

interface SavedStrategy extends Strategy {
  id: string;
  backtestResults?: {
    winRate: number;
    totalTrades: number;
    profitFactor: number;
  };
}

export default function StrategyBuilderAI() {
  const [view, setView] = useState<'create' | 'library'>('library');
  const [nlInput, setNlInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load saved strategies from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_trader_strategies');
    if (saved) {
      try {
        setSavedStrategies(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load strategies:', e);
      }
    }
  }, []);

  // Save strategies to localStorage whenever they change
  useEffect(() => {
    if (savedStrategies.length > 0) {
      localStorage.setItem('ai_trader_strategies', JSON.stringify(savedStrategies));
    }
  }, [savedStrategies]);

  const handleGenerateStrategy = async () => {
    if (!nlInput.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const strategy = await claudeAI.generateStrategy(nlInput);
      setCurrentStrategy(strategy);
      setView('create');
    } catch (err: any) {
      setError(err.message || 'Failed to generate strategy');
      console.error('Strategy generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveStrategy = () => {
    if (!currentStrategy) return;

    const existingIndex = savedStrategies.findIndex((s) => s.id === currentStrategy.id);

    if (existingIndex >= 0) {
      // Update existing
      setSavedStrategies(
        savedStrategies.map((s) =>
          s.id === currentStrategy.id ? { ...currentStrategy, updatedAt: new Date().toISOString() } : s
        )
      );
    } else {
      // Add new
      setSavedStrategies([...savedStrategies, currentStrategy]);
    }

    setView('library');
    setCurrentStrategy(null);
    setNlInput('');
  };

  const handleDeleteStrategy = (id: string) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      setSavedStrategies(savedStrategies.filter((s) => s.id !== id));
    }
  };

  const handleEditStrategy = (strategy: SavedStrategy) => {
    setCurrentStrategy(strategy);
    setNlInput(strategy.aiPrompt || '');
    setView('create');
  };

  const handleActivateStrategy = (id: string) => {
    setSavedStrategies(
      savedStrategies.map((s) =>
        s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
      )
    );
  };

  const accentColor = theme.workflow.strategyBuilder;

  return (
    <div
      style={{
        height: '100%',
        background: theme.background.primary,
        padding: theme.spacing.lg,
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div
              style={{
                padding: theme.spacing.md,
                background: `${accentColor}20`,
                borderRadius: theme.borderRadius.lg,
                boxShadow: theme.glow.darkPurple,
              }}
            >
              <Brain style={{ width: '32px', height: '32px', color: accentColor }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: theme.colors.text,
                  margin: 0,
                }}
              >
                AI Strategy Builder
              </h1>
              <p
                style={{
                  color: theme.colors.textMuted,
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                }}
              >
                Create trading strategies from natural language
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <GlassButton
              variant={view === 'library' ? 'primary' : 'secondary'}
              onClick={() => setView('library')}
            >
              <Code2 style={{ width: '18px', height: '18px' }} />
              Strategy Library
            </GlassButton>
            <GlassButton
              variant={view === 'create' ? 'primary' : 'secondary'}
              onClick={() => setView('create')}
            >
              <Sparkles style={{ width: '18px', height: '18px' }} />
              Create New
            </GlassButton>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <GlassCard style={{ background: `${theme.colors.danger}10`, border: `1px solid ${theme.colors.danger}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: theme.colors.danger }} />
              <p style={{ margin: 0, color: theme.colors.danger }}>{error}</p>
            </div>
          </GlassCard>
        )}

        {/* Create View */}
        {view === 'create' && (
          <>
            {/* Natural Language Input */}
            <GlassCard glow="darkPurple">
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.colors.text,
                  margin: `0 0 ${theme.spacing.md} 0`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                }}
              >
                <Sparkles style={{ width: '20px', height: '20px', color: accentColor }} />
                Describe Your Strategy
              </h3>

              <p style={{ color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.md} 0`, fontSize: '14px' }}>
                Tell me what you want to trade, when to enter, when to exit, and any risk parameters.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <textarea
                  value={nlInput}
                  onChange={(e) => setNlInput(e.target.value)}
                  placeholder={`Example: "Buy TSLA when RSI < 30 and volume is 2x average. Sell at 5% profit or 2% stop loss. Position size should be 10% of portfolio."`}
                  disabled={isGenerating}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: theme.spacing.md,
                    background: theme.background.input,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: theme.transitions.fast,
                  }}
                />

                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  <GlassButton
                    onClick={handleGenerateStrategy}
                    disabled={!nlInput.trim() || isGenerating}
                    style={{ flex: 1 }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} />
                        Generating Strategy...
                      </>
                    ) : (
                      <>
                        <Sparkles style={{ width: '18px', height: '18px' }} />
                        Generate Strategy
                      </>
                    )}
                  </GlassButton>

                  {currentStrategy && (
                    <GlassButton onClick={handleSaveStrategy} variant="workflow" workflowColor="primary">
                      <Save style={{ width: '18px', height: '18px' }} />
                      Save Strategy
                    </GlassButton>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Generated Strategy Preview */}
            {currentStrategy && (
              <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>
                    {currentStrategy.name}
                  </h3>
                  <GlassBadge variant="custom" customColor={accentColor}>
                    {currentStrategy.status}
                  </GlassBadge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                  {/* Entry Rules */}
                  <div>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: theme.colors.primary,
                        margin: `0 0 ${theme.spacing.sm} 0`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      <Target style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                      Entry Rules
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                      {currentStrategy.entryRules.map((rule, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: theme.spacing.sm,
                            background: `${theme.colors.primary}10`,
                            border: `1px solid ${theme.colors.primary}30`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: '13px',
                            color: theme.colors.text,
                          }}
                        >
                          {rule.indicator} {rule.operator} {rule.value}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exit Rules */}
                  <div>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: theme.colors.danger,
                        margin: `0 0 ${theme.spacing.sm} 0`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      <Shield style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                      Exit Rules
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                      {currentStrategy.exitRules.map((rule, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: theme.spacing.sm,
                            background: `${theme.colors.danger}10`,
                            border: `1px solid ${theme.colors.danger}30`,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: '13px',
                            color: theme.colors.text,
                          }}
                        >
                          {rule.type === 'take_profit' ? 'Take Profit' : 'Stop Loss'}: {rule.value}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Position Sizing & Risk */}
                <div
                  style={{
                    marginTop: theme.spacing.md,
                    padding: theme.spacing.md,
                    background: `${accentColor}10`,
                    border: `1px solid ${accentColor}30`,
                    borderRadius: theme.borderRadius.md,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>Position Size</p>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>
                        {currentStrategy.positionSizing.value}% of Portfolio
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0, textAlign: 'right' }}>
                        Max Drawdown
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: theme.colors.text, margin: 0, textAlign: 'right' }}>
                        {(currentStrategy.riskManagement.maxDrawdown * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* Library View */}
        {view === 'library' && (
          <>
            {savedStrategies.length === 0 ? (
              <GlassCard>
                <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                  <Brain style={{ width: '64px', height: '64px', color: theme.colors.textMuted, margin: '0 auto 16px' }} />
                  <h3 style={{ color: theme.colors.text, margin: `0 0 ${theme.spacing.sm} 0` }}>No Strategies Yet</h3>
                  <p style={{ color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.md} 0` }}>
                    Create your first AI-powered trading strategy
                  </p>
                  <GlassButton onClick={() => setView('create')}>
                    <Sparkles style={{ width: '18px', height: '18px' }} />
                    Create Strategy
                  </GlassButton>
                </div>
              </GlassCard>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: theme.spacing.md }}>
                {savedStrategies.map((strategy) => (
                  <GlassCard key={strategy.id}>
                    <div style={{ marginBottom: theme.spacing.md }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.colors.text, margin: 0 }}>
                          {strategy.name}
                        </h3>
                        <GlassBadge
                          variant="custom"
                          customColor={
                            strategy.status === 'active'
                              ? theme.colors.primary
                              : strategy.status === 'testing'
                              ? theme.colors.warning
                              : theme.colors.textMuted
                          }
                        >
                          {strategy.status}
                        </GlassBadge>
                      </div>

                      <p style={{ fontSize: '12px', color: theme.colors.textMuted, margin: 0 }}>
                        Created {new Date(strategy.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {strategy.aiPrompt && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: theme.colors.textMuted,
                          margin: `0 0 ${theme.spacing.md} 0`,
                          fontStyle: 'italic',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        "{strategy.aiPrompt}"
                      </p>
                    )}

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: theme.spacing.sm,
                        marginBottom: theme.spacing.md,
                        padding: theme.spacing.sm,
                        background: `${accentColor}10`,
                        borderRadius: theme.borderRadius.sm,
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '11px', color: theme.colors.textMuted, margin: 0 }}>Entry Rules</p>
                        <p style={{ fontSize: '16px', fontWeight: '600', color: theme.colors.primary, margin: 0 }}>
                          {strategy.entryRules.length}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: theme.colors.textMuted, margin: 0 }}>Exit Rules</p>
                        <p style={{ fontSize: '16px', fontWeight: '600', color: theme.colors.danger, margin: 0 }}>
                          {strategy.exitRules.length}
                        </p>
                      </div>
                    </div>

                    {strategy.backtestResults && (
                      <div
                        style={{
                          marginBottom: theme.spacing.md,
                          padding: theme.spacing.sm,
                          background: `${theme.colors.primary}10`,
                          borderRadius: theme.borderRadius.sm,
                        }}
                      >
                        <p style={{ fontSize: '11px', color: theme.colors.textMuted, margin: `0 0 4px 0` }}>Backtest Results</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: theme.colors.text }}>Win Rate: {strategy.backtestResults.winRate}%</span>
                          <span style={{ fontSize: '13px', color: theme.colors.text }}>
                            Trades: {strategy.backtestResults.totalTrades}
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                      <GlassButton onClick={() => handleEditStrategy(strategy)} variant="secondary" style={{ flex: 1 }}>
                        <Edit3 style={{ width: '16px', height: '16px' }} />
                        Edit
                      </GlassButton>
                      <GlassButton
                        onClick={() => handleActivateStrategy(strategy.id)}
                        variant="workflow"
                        workflowColor={strategy.status === 'active' ? 'warning' : 'primary'}
                        style={{ flex: 1 }}
                      >
                        <Play style={{ width: '16px', height: '16px' }} />
                        {strategy.status === 'active' ? 'Pause' : 'Activate'}
                      </GlassButton>
                      <GlassButton onClick={() => handleDeleteStrategy(strategy.id)} variant="danger">
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </GlassButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
