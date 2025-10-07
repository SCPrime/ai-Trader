"use client";
import { useState } from 'react';
import { Target, Plus, Trash2, Save, Play, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Select } from './ui';
import { theme } from '../styles/theme';

interface Condition {
  id: string;
  type: 'price' | 'indicator' | 'time' | 'volume';
  operator: 'greater' | 'less' | 'equal' | 'between';
  value: string;
}

interface Action {
  id: string;
  type: 'buy' | 'sell' | 'notify';
  quantity: string;
  orderType: 'market' | 'limit';
}

interface Strategy {
  name: string;
  description: string;
  symbol: string;
  entryConditions: Condition[];
  exitConditions: Condition[];
  entryActions: Action[];
  exitActions: Action[];
  riskManagement: {
    maxPositionSize: string;
    stopLoss: string;
    takeProfit: string;
  };
}

export default function StrategyBuilder() {
  const [strategy, setStrategy] = useState<Strategy>({
    name: 'New Strategy',
    description: '',
    symbol: '',
    entryConditions: [],
    exitConditions: [],
    entryActions: [],
    exitActions: [],
    riskManagement: {
      maxPositionSize: '100',
      stopLoss: '2',
      takeProfit: '5',
    },
  });

  const [activeTab, setActiveTab] = useState<'entry' | 'exit' | 'risk'>('entry');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const addCondition = (type: 'entry' | 'exit') => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      type: 'price',
      operator: 'greater',
      value: '',
    };
    if (type === 'entry') {
      setStrategy({ ...strategy, entryConditions: [...strategy.entryConditions, newCondition] });
    } else {
      setStrategy({ ...strategy, exitConditions: [...strategy.exitConditions, newCondition] });
    }
  };

  const removeCondition = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setStrategy({
        ...strategy,
        entryConditions: strategy.entryConditions.filter(c => c.id !== id),
      });
    } else {
      setStrategy({
        ...strategy,
        exitConditions: strategy.exitConditions.filter(c => c.id !== id),
      });
    }
  };

  const addAction = (type: 'entry' | 'exit') => {
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: type === 'entry' ? 'buy' : 'sell',
      quantity: '10',
      orderType: 'market',
    };
    if (type === 'entry') {
      setStrategy({ ...strategy, entryActions: [...strategy.entryActions, newAction] });
    } else {
      setStrategy({ ...strategy, exitActions: [...strategy.exitActions, newAction] });
    }
  };

  const removeAction = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setStrategy({
        ...strategy,
        entryActions: strategy.entryActions.filter(a => a.id !== id),
      });
    } else {
      setStrategy({
        ...strategy,
        exitActions: strategy.exitActions.filter(a => a.id !== id),
      });
    }
  };

  const saveStrategy = async () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <Target size={32} color={theme.colors.accent} />
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            color: theme.colors.text,
            textShadow: theme.glow.purple,
          }}>
            Strategy Builder
          </h1>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <Button variant="secondary" size="sm" onClick={() => alert('Test strategy')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <Play size={16} />
              Test
            </div>
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saveStatus === 'saving'}
            onClick={saveStrategy}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <Save size={16} />
              {saveStatus === 'saved' ? 'Saved!' : 'Save'}
            </div>
          </Button>
        </div>
      </div>

      {/* Strategy Info */}
      <Card glow="purple" style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing.md }}>
          <Input
            label="Strategy Name"
            value={strategy.name}
            onChange={(e) => setStrategy({ ...strategy, name: e.target.value })}
          />
          <Input
            label="Symbol"
            value={strategy.symbol}
            onChange={(e) => setStrategy({ ...strategy, symbol: e.target.value.toUpperCase() })}
            placeholder="SPY, AAPL, etc."
          />
        </div>
        <div style={{ marginTop: theme.spacing.md }}>
          <label style={{
            display: 'block',
            marginBottom: theme.spacing.xs,
            color: theme.colors.text,
            fontSize: '14px',
            fontWeight: '500',
          }}>
            Description
          </label>
          <textarea
            value={strategy.description}
            onChange={(e) => setStrategy({ ...strategy, description: e.target.value })}
            placeholder="Describe your strategy..."
            rows={2}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: theme.background.input,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              color: theme.colors.text,
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        {(['entry', 'exit', 'risk'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              background: activeTab === tab ? theme.colors.primary : theme.background.card,
              color: activeTab === tab ? '#fff' : theme.colors.text,
              borderRadius: theme.borderRadius.sm,
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              transition: theme.transitions.fast,
              boxShadow: activeTab === tab ? theme.glow.green : 'none',
            }}
          >
            {tab === 'entry' ? 'Entry Rules' : tab === 'exit' ? 'Exit Rules' : 'Risk Management'}
          </button>
        ))}
      </div>

      {/* Entry Tab */}
      {activeTab === 'entry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '18px' }}>Entry Conditions</h3>
              <Button variant="secondary" size="sm" onClick={() => addCondition('entry')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Plus size={16} />
                  Add
                </div>
              </Button>
            </div>
            {strategy.entryConditions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.lg, color: theme.colors.textMuted }}>
                No conditions. Click "Add" to start.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {strategy.entryConditions.map((condition) => (
                  <ConditionRow
                    key={condition.id}
                    condition={condition}
                    onRemove={() => removeCondition('entry', condition.id)}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '18px' }}>Entry Actions</h3>
              <Button variant="primary" size="sm" onClick={() => addAction('entry')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Plus size={16} />
                  Add
                </div>
              </Button>
            </div>
            {strategy.entryActions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.lg, color: theme.colors.textMuted }}>
                No actions. Click "Add" to start.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {strategy.entryActions.map((action) => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    onRemove={() => removeAction('entry', action.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Exit Tab */}
      {activeTab === 'exit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '18px' }}>Exit Conditions</h3>
              <Button variant="secondary" size="sm" onClick={() => addCondition('exit')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Plus size={16} />
                  Add
                </div>
              </Button>
            </div>
            {strategy.exitConditions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.lg, color: theme.colors.textMuted }}>
                No conditions. Click "Add" to start.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {strategy.exitConditions.map((condition) => (
                  <ConditionRow
                    key={condition.id}
                    condition={condition}
                    onRemove={() => removeCondition('exit', condition.id)}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '18px' }}>Exit Actions</h3>
              <Button variant="danger" size="sm" onClick={() => addAction('exit')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Plus size={16} />
                  Add
                </div>
              </Button>
            </div>
            {strategy.exitActions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: theme.spacing.lg, color: theme.colors.textMuted }}>
                No actions. Click "Add" to start.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {strategy.exitActions.map((action) => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    onRemove={() => removeAction('exit', action.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Risk Tab */}
      {activeTab === 'risk' && (
        <Card glow="orange">
          <h3 style={{ margin: `0 0 ${theme.spacing.lg} 0`, color: theme.colors.text, fontSize: '18px' }}>
            Risk Management
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md }}>
            <Input
              label="Max Position Size (shares)"
              type="number"
              value={strategy.riskManagement.maxPositionSize}
              onChange={(e) => setStrategy({
                ...strategy,
                riskManagement: { ...strategy.riskManagement, maxPositionSize: e.target.value }
              })}
            />
            <Input
              label="Stop Loss (%)"
              type="number"
              step="0.1"
              value={strategy.riskManagement.stopLoss}
              onChange={(e) => setStrategy({
                ...strategy,
                riskManagement: { ...strategy.riskManagement, stopLoss: e.target.value }
              })}
            />
            <Input
              label="Take Profit (%)"
              type="number"
              step="0.1"
              value={strategy.riskManagement.takeProfit}
              onChange={(e) => setStrategy({
                ...strategy,
                riskManagement: { ...strategy.riskManagement, takeProfit: e.target.value }
              })}
            />
          </div>
          <div style={{
            marginTop: theme.spacing.lg,
            padding: theme.spacing.md,
            background: `${theme.colors.warning}20`,
            border: `1px solid ${theme.colors.warning}40`,
            borderRadius: theme.borderRadius.sm,
            display: 'flex',
            gap: theme.spacing.sm,
          }}>
            <AlertCircle size={20} color={theme.colors.warning} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.colors.warning }}>
                Risk Warning
              </p>
              <p style={{ margin: `${theme.spacing.xs} 0 0 0`, fontSize: '12px', color: theme.colors.textMuted }}>
                Always test strategies with historical data before deploying with real capital.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ConditionRow({ condition, onRemove }: {
  condition: Condition;
  onRemove: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      background: theme.background.input,
      borderRadius: theme.borderRadius.sm,
      border: `1px solid ${theme.colors.border}`,
    }}>
      <select style={{
        flex: 1,
        padding: theme.spacing.sm,
        background: theme.background.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.sm,
        color: theme.colors.text,
        outline: 'none',
      }}>
        <option>Price</option>
        <option>Indicator</option>
        <option>Time</option>
        <option>Volume</option>
      </select>
      <select style={{
        flex: 1,
        padding: theme.spacing.sm,
        background: theme.background.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.sm,
        color: theme.colors.text,
        outline: 'none',
      }}>
        <option>Greater Than</option>
        <option>Less Than</option>
        <option>Equal To</option>
      </select>
      <input
        type="text"
        placeholder="Value"
        style={{
          flex: 1,
          padding: theme.spacing.sm,
          background: theme.background.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.sm,
          color: theme.colors.text,
          outline: 'none',
        }}
      />
      <button
        onClick={onRemove}
        style={{
          padding: theme.spacing.sm,
          background: `${theme.colors.danger}20`,
          border: `1px solid ${theme.colors.danger}40`,
          borderRadius: theme.borderRadius.sm,
          color: theme.colors.danger,
          cursor: 'pointer',
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function ActionRow({ action, onRemove }: {
  action: Action;
  onRemove: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      background: theme.background.input,
      borderRadius: theme.borderRadius.sm,
      border: `1px solid ${theme.colors.border}`,
    }}>
      <select style={{
        flex: 1,
        padding: theme.spacing.sm,
        background: theme.background.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.sm,
        color: theme.colors.text,
        outline: 'none',
      }}>
        <option>Buy</option>
        <option>Sell</option>
        <option>Notify</option>
      </select>
      <input
        type="number"
        placeholder="Quantity"
        style={{
          flex: 1,
          padding: theme.spacing.sm,
          background: theme.background.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.sm,
          color: theme.colors.text,
          outline: 'none',
        }}
      />
      <select style={{
        flex: 1,
        padding: theme.spacing.sm,
        background: theme.background.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.sm,
        color: theme.colors.text,
        outline: 'none',
      }}>
        <option>Market</option>
        <option>Limit</option>
      </select>
      <button
        onClick={onRemove}
        style={{
          padding: theme.spacing.sm,
          background: `${theme.colors.danger}20`,
          border: `1px solid ${theme.colors.danger}40`,
          borderRadius: theme.borderRadius.sm,
          color: theme.colors.danger,
          cursor: 'pointer',
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
