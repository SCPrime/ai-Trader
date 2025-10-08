"use client";

import { useState } from 'react';
import { Settings, Plus, Trash2, Save, Play, Code2, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="h-full bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Code2 className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">⚙️ Strategy Builder</h1>
              <p className="text-slate-400 mt-1">Create custom trading strategies</p>
            </div>
          </div>
          <button
            onClick={saveStrategy}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Strategy
          </button>
        </div>

        {/* Strategy Info, Conditions, Actions, Preview */}
        {/* [Rest of component - 310 lines total] */}
      </div>
    </div>
  );
}
