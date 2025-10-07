"use client";
import { useState } from 'react';
import { Target, Plus, X, AlertTriangle } from 'lucide-react';
import { Card, Button, Input, Select } from './ui';
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
  quantity: string;
}

export default function StrategyBuilder() {
  const [strategyName, setStrategyName] = useState('');
  const [symbol, setSymbol] = useState('SPY');
  const [activeTab, setActiveTab] = useState<'entry' | 'exit' | 'risk'>('entry');

  const [entryConditions, setEntryConditions] = useState<Condition[]>([
    { id: '1', indicator: 'RSI', operator: '>', value: '30' }
  ]);
  const [entryActions, setEntryActions] = useState<Action[]>([
    { id: '1', type: 'buy', quantity: '100' }
  ]);

  const [exitConditions, setExitConditions] = useState<Condition[]>([
    { id: '1', indicator: 'RSI', operator: '<', value: '70' }
  ]);
  const [exitActions, setExitActions] = useState<Action[]>([
    { id: '1', type: 'sell', quantity: '100' }
  ]);

  const [positionSize, setPositionSize] = useState('1000');
  const [stopLoss, setStopLoss] = useState('2');
  const [takeProfit, setTakeProfit] = useState('5');
  const [loading, setLoading] = useState(false);

  const indicatorOptions = [
    { value: 'RSI', label: 'RSI - Relative Strength Index' },
    { value: 'MACD', label: 'MACD - Moving Average Convergence Divergence' },
    { value: 'SMA', label: 'SMA - Simple Moving Average' },
    { value: 'EMA', label: 'EMA - Exponential Moving Average' },
    { value: 'BB', label: 'Bollinger Bands' },
    { value: 'PRICE', label: 'Price' },
  ];

  const operatorOptions = [
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<=', label: 'Less than or equal' },
    { value: '==', label: 'Equal to' },
    { value: 'crosses_above', label: 'Crosses above' },
    { value: 'crosses_below', label: 'Crosses below' },
  ];

  const actionTypeOptions = [
    { value: 'buy', label: 'Buy' },
    { value: 'sell', label: 'Sell' },
    { value: 'sell_short', label: 'Sell Short' },
    { value: 'buy_to_cover', label: 'Buy to Cover' },
  ];

  const addCondition = (type: 'entry' | 'exit') => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      indicator: 'RSI',
      operator: '>',
      value: '50'
    };
    if (type === 'entry') {
      setEntryConditions([...entryConditions, newCondition]);
    } else {
      setExitConditions([...exitConditions, newCondition]);
    }
  };

  const removeCondition = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setEntryConditions(entryConditions.filter(c => c.id !== id));
    } else {
      setExitConditions(exitConditions.filter(c => c.id !== id));
    }
  };

  const addAction = (type: 'entry' | 'exit') => {
    const newAction: Action = {
      id: Date.now().toString(),
      type: 'buy',
      quantity: '100'
    };
    if (type === 'entry') {
      setEntryActions([...entryActions, newAction]);
    } else {
      setExitActions([...exitActions, newAction]);
    }
  };

  const removeAction = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setEntryActions(entryActions.filter(a => a.id !== id));
    } else {
      setExitActions(exitActions.filter(a => a.id !== id));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    alert('Strategy saved successfully!');
  };

  const handleTest = () => {
    alert('Strategy testing feature coming soon!');
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

      {/* Strategy Configuration */}
      <Card glow="purple" style={{ marginBottom: theme.spacing.lg }}>
        <h2 style={{
          margin: 0,
          marginBottom: theme.spacing.md,
          fontSize: '20px',
          fontWeight: '600',
          color: theme.colors.text
        }}>
          Strategy Configuration
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
          <Input
            label="Strategy Name"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            placeholder="My Trading Strategy"
          />
          <Input
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="SPY"
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
              background: activeTab === tab ? theme.colors.accent : theme.background.card,
              color: activeTab === tab ? '#fff' : theme.colors.text,
              border: `1px solid ${activeTab === tab ? theme.colors.accent : theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: theme.transitions.normal,
              boxShadow: activeTab === tab ? theme.glow.purple : 'none',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab !== 'risk' ? 'Rules' : 'Management'}
          </button>
        ))}
      </div>

      {/* Entry Rules */}
      {activeTab === 'entry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.colors.text }}>
                Entry Conditions
              </h3>
              <Button variant="secondary" size="sm" onClick={() => addCondition('entry')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Plus size={16} />
                  Add Condition
                </div>
              </Button>
            </div>
            {entryConditions.map((condition, index) => (
              <div key={condition.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.sm
              }}>
                <Select
                  options={indicatorOptions}
                  value={condition.indicator}
                  onChange={(e) => {
                    const updated = [...entryConditions];
                    updated[index].indicator = e.target.value;
                    setEntryConditions(updated);
                  }}
                />
                <Select
                  options={operatorOptions}
                  value={condition.operator}
                  onChange={(e) => {
                    const updated = [...entryConditions];
                    updated[index].operator = e.target.value;
                    setEntryConditions(updated);
                  }}
                />
                <Input
                  value={condition.value}
                  onChange={(e) => {
                    const updated = [...entryConditions];
                    updated[index].value = e.target.value;
                    setEntryConditions(updated);
                  }}
                  placeholder="Value"
                />
                {entryConditions.length > 1 && (
                  <button
                    onClick={() => removeCondition('entry', condition.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.danger,
                      cursor: 'pointer',
                      padding: theme.spacing.sm,
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.colors.text }}>
                Entry Actions
              </h3>
              <Button variant="secondary" size="sm" onClick={() => addAction('entry')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Plus size={16} />
                  Add Action
                </div>
              </Button>
            </div>
            {entryActions.map((action, index) => (
              <div key={action.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr auto',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.sm
              }}>
                <Select
                  options={actionTypeOptions}
                  value={action.type}
                  onChange={(e) => {
                    const updated = [...entryActions];
                    updated[index].type = e.target.value;
                    setEntryActions(updated);
                  }}
                />
                <Input
                  value={action.quantity}
                  onChange={(e) => {
                    const updated = [...entryActions];
                    updated[index].quantity = e.target.value;
                    setEntryActions(updated);
                  }}
                  placeholder="Quantity"
                />
                {entryActions.length > 1 && (
                  <button
                    onClick={() => removeAction('entry', action.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.danger,
                      cursor: 'pointer',
                      padding: theme.spacing.sm,
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Exit Rules */}
      {activeTab === 'exit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.colors.text }}>
                Exit Conditions
              </h3>
              <Button variant="secondary" size="sm" onClick={() => addCondition('exit')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Plus size={16} />
                  Add Condition
                </div>
              </Button>
            </div>
            {exitConditions.map((condition, index) => (
              <div key={condition.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.sm
              }}>
                <Select
                  options={indicatorOptions}
                  value={condition.indicator}
                  onChange={(e) => {
                    const updated = [...exitConditions];
                    updated[index].indicator = e.target.value;
                    setExitConditions(updated);
                  }}
                />
                <Select
                  options={operatorOptions}
                  value={condition.operator}
                  onChange={(e) => {
                    const updated = [...exitConditions];
                    updated[index].operator = e.target.value;
                    setExitConditions(updated);
                  }}
                />
                <Input
                  value={condition.value}
                  onChange={(e) => {
                    const updated = [...exitConditions];
                    updated[index].value = e.target.value;
                    setExitConditions(updated);
                  }}
                  placeholder="Value"
                />
                {exitConditions.length > 1 && (
                  <button
                    onClick={() => removeCondition('exit', condition.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.danger,
                      cursor: 'pointer',
                      padding: theme.spacing.sm,
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: theme.colors.text }}>
                Exit Actions
              </h3>
              <Button variant="secondary" size="sm" onClick={() => addAction('exit')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Plus size={16} />
                  Add Action
                </div>
              </Button>
            </div>
            {exitActions.map((action, index) => (
              <div key={action.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr auto',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.sm
              }}>
                <Select
                  options={actionTypeOptions}
                  value={action.type}
                  onChange={(e) => {
                    const updated = [...exitActions];
                    updated[index].type = e.target.value;
                    setExitActions(updated);
                  }}
                />
                <Input
                  value={action.quantity}
                  onChange={(e) => {
                    const updated = [...exitActions];
                    updated[index].quantity = e.target.value;
                    setExitActions(updated);
                  }}
                  placeholder="Quantity"
                />
                {exitActions.length > 1 && (
                  <button
                    onClick={() => removeAction('exit', action.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: theme.colors.danger,
                      cursor: 'pointer',
                      padding: theme.spacing.sm,
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Risk Management */}
      {activeTab === 'risk' && (
        <Card>
          <h3 style={{ margin: 0, marginBottom: theme.spacing.md, fontSize: '18px', fontWeight: '600', color: theme.colors.text }}>
            Risk Management Parameters
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            <Input
              label="Position Size ($)"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
              placeholder="1000"
            />
            <Input
              label="Stop Loss (%)"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="2"
            />
            <Input
              label="Take Profit (%)"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="5"
            />
            <div style={{
              padding: theme.spacing.md,
              background: 'rgba(255, 136, 0, 0.1)',
              border: `1px solid ${theme.colors.warning}`,
              borderRadius: theme.borderRadius.sm,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}>
              <AlertTriangle size={20} color={theme.colors.warning} />
              <p style={{ margin: 0, fontSize: '14px', color: theme.colors.text }}>
                Risk-reward ratio: 1:{(parseFloat(takeProfit) / parseFloat(stopLoss)).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
        <Button variant="primary" size="lg" loading={loading} onClick={handleSave} style={{ flex: 1 }}>
          Save Strategy
        </Button>
        <Button variant="secondary" size="lg" onClick={handleTest} style={{ flex: 1 }}>
          Test Strategy
        </Button>
      </div>
    </div>
  );
}
