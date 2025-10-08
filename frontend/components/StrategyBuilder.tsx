"use client";

import { useState } from 'react';
import { Settings, Plus, Trash2, Save, Play, Code2, AlertTriangle } from 'lucide-react';
import { GlassCard, GlassInput } from './GlassmorphicComponents';
import { theme } from '../styles/theme';

interface Condition {
  id: string;
  indicator: string;
  operator: string;
  value: string;
}

interface Action {
  id: string;
  type: string;
  symbol: string;
  quantity: string;
}

export default function StrategyBuilder() {
  const [strategyName, setStrategyName] = useState('My New Strategy');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([
    { id: '1', indicator: 'RSI', operator: '<', value: '30' },
  ]);
  const [actions, setActions] = useState<Action[]>([
    { id: '1', type: 'buy', symbol: 'SPY', quantity: '100' },
  ]);

  const addCondition = () => {
    setConditions([...conditions, {
      id: Date.now().toString(),
      indicator: 'RSI',
      operator: '>',
      value: '70'
    }]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const addAction = () => {
    setActions([...actions, {
      id: Date.now().toString(),
      type: 'buy',
      symbol: 'SPY',
      quantity: '100'
    }]);
  };

  const removeAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const updateAction = (id: string, field: keyof Action, value: string) => {
    setActions(actions.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const saveStrategy = () => {
    console.log('Saving strategy:', { strategyName, description, conditions, actions });
    alert('Strategy saved successfully!');
  };

  const accentColor = theme.workflow.strategyBuilder;
  const secondaryColor = theme.workflow.backtesting;

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
              boxShadow: theme.glow.darkPurple,
            }}>
              <Code2 style={{ width: '32px', height: '32px', color: accentColor }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: theme.colors.text,
                margin: 0,
              }}>
                Strategy Builder
              </h1>
              <p style={{
                color: theme.colors.textMuted,
                margin: '4px 0 0 0',
                fontSize: '14px',
              }}>
                Create custom trading strategies with conditions and actions
              </p>
            </div>
          </div>
          <button
            onClick={saveStrategy}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              background: `linear-gradient(to right, ${theme.colors.primary}, #00C851)`,
              color: '#ffffff',
              fontWeight: '600',
              borderRadius: theme.borderRadius.lg,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              transition: theme.transitions.fast,
              boxShadow: theme.glow.green,
            }}
          >
            <Save style={{ width: '20px', height: '20px' }} />
            Save Strategy
          </button>
        </div>

        {/* Strategy Info */}
        <GlassCard>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.colors.text,
            margin: `0 0 ${theme.spacing.md} 0`,
          }}>
            Strategy Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: theme.colors.textMuted,
                marginBottom: theme.spacing.sm,
              }}>
                Strategy Name
              </label>
              <GlassInput
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="e.g., RSI Momentum Strategy"
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: theme.colors.textMuted,
                marginBottom: theme.spacing.sm,
              }}>
                Description
              </label>
              <GlassInput
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your strategy..."
                multiline
                rows={3}
              />
            </div>
          </div>
        </GlassCard>

        {/* Entry Conditions */}
        <GlassCard glow="darkPurple">
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
              <Settings style={{ width: '20px', height: '20px', color: secondaryColor }} />
              Entry Conditions
            </h3>
            <button
              onClick={addCondition}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: `${secondaryColor}20`,
                border: `1px solid ${secondaryColor}50`,
                color: secondaryColor,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                transition: theme.transitions.fast,
                fontWeight: '600',
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Add Condition
            </button>
          </div>

          {conditions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: `${theme.spacing.xl} ${theme.spacing.lg}`,
              color: theme.colors.textMuted,
              background: theme.background.input,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: theme.colors.textMuted }} />
              <p style={{ margin: 0 }}>No conditions added yet. Click "Add Condition" to start.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {conditions.map((condition) => (
                <div key={condition.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  background: theme.background.input,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                }}>
                  <select
                    value={condition.indicator}
                    onChange={(e) => updateCondition(condition.id, 'indicator', e.target.value)}
                    style={{
                      flex: 1,
                      padding: theme.spacing.sm,
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="RSI">RSI</option>
                    <option value="MACD">MACD</option>
                    <option value="SMA_20">SMA (20)</option>
                    <option value="SMA_50">SMA (50)</option>
                    <option value="EMA_12">EMA (12)</option>
                    <option value="EMA_26">EMA (26)</option>
                    <option value="Volume">Volume</option>
                    <option value="Price">Price</option>
                  </select>

                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                    style={{
                      width: '96px',
                      padding: theme.spacing.sm,
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value=">">{'>'}</option>
                    <option value="<">{'<'}</option>
                    <option value="=">{'='}</option>
                    <option value=">=">≥</option>
                    <option value="<=">≤</option>
                    <option value="!=">≠</option>
                  </select>

                  <input
                    type="number"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                    style={{
                      width: '128px',
                      padding: theme.spacing.sm,
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    placeholder="Value"
                  />

                  <button
                    onClick={() => removeCondition(condition.id)}
                    style={{
                      padding: theme.spacing.sm,
                      color: theme.colors.danger,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      transition: theme.transitions.fast,
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Actions */}
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
              <Play style={{ width: '20px', height: '20px', color: accentColor }} />
              Actions (What to Execute)
            </h3>
            <button
              onClick={addAction}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}50`,
                color: accentColor,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                transition: theme.transitions.fast,
                fontWeight: '600',
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Add Action
            </button>
          </div>

          {actions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: `${theme.spacing.xl} ${theme.spacing.lg}`,
              color: theme.colors.textMuted,
              background: theme.background.input,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: theme.colors.textMuted }} />
              <p style={{ margin: 0 }}>No actions added yet. Click "Add Action" to define what happens.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {actions.map((action) => (
                <div key={action.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  background: theme.background.input,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                }}>
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(action.id, 'type', e.target.value)}
                    style={{
                      width: '128px',
                      padding: theme.spacing.sm,
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                    <option value="short">Short</option>
                    <option value="cover">Cover</option>
                    <option value="close">Close Position</option>
                  </select>

                  <input
                    type="text"
                    value={action.symbol}
                    onChange={(e) => updateAction(action.id, 'symbol', e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: theme.spacing.sm,
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    placeholder="Symbol (e.g., AAPL)"
                  />

                  <input
                    type="number"
                    value={action.quantity}
                    onChange={(e) => updateAction(action.id, 'quantity', e.target.value)}
                    style={{
                      width: '128px',
                      padding: theme.spacing.sm,
                      background: theme.background.input,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      color: theme.colors.text,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    placeholder="Quantity"
                  />

                  <button
                    onClick={() => removeAction(action.id)}
                    style={{
                      padding: theme.spacing.sm,
                      color: theme.colors.danger,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      cursor: 'pointer',
                      transition: theme.transitions.fast,
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Strategy Logic Preview */}
        <GlassCard>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.colors.text,
            margin: `0 0 ${theme.spacing.md} 0`,
          }}>
            Strategy Logic Preview
          </h3>
          <div style={{
            background: theme.background.input,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            fontFamily: 'monospace',
            fontSize: '14px',
            color: theme.colors.textMuted,
          }}>
            <div style={{ color: secondaryColor, marginBottom: theme.spacing.sm }}>IF</div>
            {conditions.map((cond, idx) => (
              <div key={cond.id} style={{ marginLeft: theme.spacing.md, marginBottom: '4px' }}>
                {idx > 0 && <span style={{ color: accentColor }}>AND </span>}
                <span style={{ color: theme.colors.text }}>{cond.indicator}</span>
                <span style={{ color: theme.colors.warning }}> {cond.operator} </span>
                <span style={{ color: theme.colors.primary }}>{cond.value}</span>
              </div>
            ))}
            <div style={{ color: secondaryColor, margin: `${theme.spacing.md} 0 ${theme.spacing.sm} 0` }}>THEN</div>
            {actions.map((action) => (
              <div key={action.id} style={{ marginLeft: theme.spacing.md, marginBottom: '4px' }}>
                <span style={{ color: accentColor }}>{action.type.toUpperCase()}</span>
                <span style={{ color: theme.colors.text }}> {action.quantity} shares of </span>
                <span style={{ color: theme.colors.primary }}>{action.symbol}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
          <button
            onClick={() => alert('Testing strategy on historical data...')}
            style={{
              padding: theme.spacing.lg,
              background: `${secondaryColor}20`,
              border: `1px solid ${secondaryColor}50`,
              color: secondaryColor,
              fontWeight: '600',
              fontSize: '16px',
              borderRadius: theme.borderRadius.lg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              transition: theme.transitions.fast,
            }}
          >
            <Play style={{ width: '20px', height: '20px' }} />
            Test Strategy (Backtest)
          </button>
          <button
            onClick={saveStrategy}
            style={{
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
          >
            <Save style={{ width: '20px', height: '20px' }} />
            Save & Deploy Strategy
          </button>
        </div>
      </div>
    </div>
  );
}
