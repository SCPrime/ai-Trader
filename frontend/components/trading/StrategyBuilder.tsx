'use client';

import { useState } from 'react';

/**
 * Strategy Builder Component
 *
 * Form-only UI for creating and editing Allessandra strategies.
 * Includes Basic Info, Universe Filters, Position Structure, Sizing, and Exits.
 *
 * INCREMENT 8: UI only - no save logic
 */

type TemplateType =
  | 'collar'
  | 'put_spread'
  | 'call_spread'
  | 'iron_condor'
  | 'csp'
  | 'covered_call'
  | 'custom';

type AllocationType = 'cash' | 'cash_max_loss' | 'max_loss';

interface Leg {
  id: string;
  type: 'STOCK' | 'CALL' | 'PUT';
  side: 'BUY' | 'SELL';
  dte?: number;
  delta?: number;
  quantity: number;
}

interface StrategyFormData {
  // Basic Info
  name: string;
  goal: string;
  template: TemplateType;

  // Universe Filters
  priceMin: number;
  priceMax: number;
  minStockVolume: number;
  minOptionOI: number;
  maxOptionSpread: number;
  excludeOTC: boolean;
  earningsBlackoutDays: number;

  // Position Structure
  legs: Leg[];

  // Sizing
  allocationType: AllocationType;
  perTradeCash: number;
  maxConcurrentPositions: number;
  portfolioHeatMax: number;

  // Exits
  profitTargetPct: number;
  maxLossPct: number;
  timeExitDTE: number;
  useOCOBrackets: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

interface StrategyBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<StrategyFormData>;
}

export default function StrategyBuilder({
  isOpen,
  onClose,
  initialData,
}: StrategyBuilderProps) {
  const [formData, setFormData] = useState<StrategyFormData>({
    // Basic Info
    name: initialData?.name || '',
    goal: initialData?.goal || '',
    template: initialData?.template || 'custom',

    // Universe Filters
    priceMin: initialData?.priceMin || 0,
    priceMax: initialData?.priceMax || 1000,
    minStockVolume: initialData?.minStockVolume || 1000000,
    minOptionOI: initialData?.minOptionOI || 100,
    maxOptionSpread: initialData?.maxOptionSpread || 0.10,
    excludeOTC: initialData?.excludeOTC ?? true,
    earningsBlackoutDays: initialData?.earningsBlackoutDays || 7,

    // Position Structure
    legs: initialData?.legs || [],

    // Sizing
    allocationType: initialData?.allocationType || 'cash',
    perTradeCash: initialData?.perTradeCash || 5000,
    maxConcurrentPositions: initialData?.maxConcurrentPositions || 5,
    portfolioHeatMax: initialData?.portfolioHeatMax || 20,

    // Exits
    profitTargetPct: initialData?.profitTargetPct || 50,
    maxLossPct: initialData?.maxLossPct || 100,
    timeExitDTE: initialData?.timeExitDTE || 7,
    useOCOBrackets: initialData?.useOCOBrackets ?? false,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    universe: false,
    structure: false,
    sizing: false,
    exits: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateField = (field: keyof StrategyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addLeg = () => {
    const newLeg: Leg = {
      id: `leg_${Date.now()}`,
      type: 'CALL',
      side: 'BUY',
      dte: 30,
      delta: 0.50,
      quantity: 1,
    };
    updateField('legs', [...formData.legs, newLeg]);
  };

  const removeLeg = (id: string) => {
    updateField('legs', formData.legs.filter(leg => leg.id !== id));
  };

  const updateLeg = (id: string, field: keyof Leg, value: any) => {
    updateField(
      'legs',
      formData.legs.map(leg => (leg.id === id ? { ...leg, [field]: value } : leg))
    );
  };

  const loadTemplate = (template: TemplateType) => {
    updateField('template', template);

    // Load template-specific legs
    const templates: Record<TemplateType, Leg[]> = {
      collar: [
        { id: 'leg_1', type: 'STOCK', side: 'BUY', quantity: 100 },
        { id: 'leg_2', type: 'PUT', side: 'BUY', dte: 35, delta: -0.20, quantity: 1 },
        { id: 'leg_3', type: 'CALL', side: 'SELL', dte: 14, delta: 0.30, quantity: 1 },
      ],
      put_spread: [
        { id: 'leg_1', type: 'PUT', side: 'SELL', dte: 28, delta: -0.25, quantity: 1 },
        { id: 'leg_2', type: 'PUT', side: 'BUY', dte: 28, delta: -0.10, quantity: 1 },
      ],
      call_spread: [
        { id: 'leg_1', type: 'CALL', side: 'SELL', dte: 28, delta: 0.25, quantity: 1 },
        { id: 'leg_2', type: 'CALL', side: 'BUY', dte: 28, delta: 0.10, quantity: 1 },
      ],
      iron_condor: [
        { id: 'leg_1', type: 'PUT', side: 'SELL', dte: 30, delta: -0.20, quantity: 1 },
        { id: 'leg_2', type: 'PUT', side: 'BUY', dte: 30, delta: -0.10, quantity: 1 },
        { id: 'leg_3', type: 'CALL', side: 'SELL', dte: 30, delta: 0.20, quantity: 1 },
        { id: 'leg_4', type: 'CALL', side: 'BUY', dte: 30, delta: 0.10, quantity: 1 },
      ],
      csp: [
        { id: 'leg_1', type: 'PUT', side: 'SELL', dte: 28, delta: -0.25, quantity: 1 },
      ],
      covered_call: [
        { id: 'leg_1', type: 'STOCK', side: 'BUY', quantity: 100 },
        { id: 'leg_2', type: 'CALL', side: 'SELL', dte: 14, delta: 0.30, quantity: 1 },
      ],
      custom: [],
    };

    updateField('legs', templates[template]);
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Basic Info validation
    if (!formData.name.trim()) {
      newErrors.name = 'Strategy name is required';
    }
    if (!formData.goal.trim()) {
      newErrors.goal = 'Goal/description is required';
    }

    // Universe Filters validation
    if (formData.priceMin < 0) {
      newErrors.priceMin = 'Minimum price must be >= 0';
    }
    if (formData.priceMax <= formData.priceMin) {
      newErrors.priceMax = 'Maximum price must be > minimum price';
    }
    if (formData.minStockVolume < 0) {
      newErrors.minStockVolume = 'Stock volume must be >= 0';
    }
    if (formData.minOptionOI < 0) {
      newErrors.minOptionOI = 'Option OI must be >= 0';
    }
    if (formData.maxOptionSpread < 0 || formData.maxOptionSpread > 1) {
      newErrors.maxOptionSpread = 'Spread must be between 0 and 1';
    }

    // Position Structure validation
    if (formData.legs.length === 0) {
      newErrors.legs = 'At least one leg is required';
    }

    // Sizing validation
    if (formData.perTradeCash <= 0) {
      newErrors.perTradeCash = 'Per trade cash must be > 0';
    }
    if (formData.maxConcurrentPositions <= 0) {
      newErrors.maxConcurrentPositions = 'Max concurrent positions must be > 0';
    }
    if (formData.portfolioHeatMax <= 0 || formData.portfolioHeatMax > 100) {
      newErrors.portfolioHeatMax = 'Portfolio heat must be between 0 and 100';
    }

    // Exits validation
    if (formData.profitTargetPct < 0) {
      newErrors.profitTargetPct = 'Profit target must be >= 0';
    }
    if (formData.maxLossPct < 0) {
      newErrors.maxLossPct = 'Max loss must be >= 0';
    }
    if (formData.timeExitDTE < 0) {
      newErrors.timeExitDTE = 'Time exit DTE must be >= 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      alert('✓ Strategy validation passed!\n\nSave logic will be implemented in next increment.');
      console.log('Strategy data:', formData);
    } else {
      alert('❌ Please fix validation errors before saving.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-800 border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                🛠️ Strategy Builder
              </h2>
              <p className="text-sm text-slate-300">
                Design custom options strategies with Allessandra DSL
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* A) Basic Info Section */}
          <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('basicInfo')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📋</span>
                <span className="text-lg font-semibold text-white">Basic Info</span>
              </div>
              <span className="text-slate-400">{expandedSections.basicInfo ? '▼' : '►'}</span>
            </button>

            {expandedSections.basicInfo && (
              <div className="px-5 py-4 space-y-4 border-t border-white/10">
                {/* Strategy Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Strategy Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                    placeholder="e.g., Iron Condor SPY 30DTE"
                    className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                      errors.name
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-white/20 focus:ring-cyan-500/50'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                {/* Goal/Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Goal / Description *
                  </label>
                  <textarea
                    value={formData.goal}
                    onChange={e => updateField('goal', e.target.value)}
                    placeholder="Describe the strategy's objective and ideal market conditions..."
                    rows={3}
                    className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all resize-none ${
                      errors.goal
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-white/20 focus:ring-cyan-500/50'
                    }`}
                  />
                  {errors.goal && <p className="mt-1 text-sm text-red-400">{errors.goal}</p>}
                </div>

                {/* Template Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Template
                    <span className="ml-2 text-xs text-slate-500">(loads pre-configured legs)</span>
                  </label>
                  <select
                    value={formData.template}
                    onChange={e => loadTemplate(e.target.value as TemplateType)}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  >
                    <option value="custom">Custom</option>
                    <option value="collar">Protective Collar</option>
                    <option value="put_spread">Put Credit Spread</option>
                    <option value="call_spread">Call Debit Spread</option>
                    <option value="iron_condor">Iron Condor</option>
                    <option value="csp">Cash-Secured Put</option>
                    <option value="covered_call">Covered Call</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* B) Universe Filters Section */}
          <UniverseFiltersSection
            expanded={expandedSections.universe}
            onToggle={() => toggleSection('universe')}
            formData={formData}
            updateField={updateField}
            errors={errors}
          />

          {/* C) Position Structure Section */}
          <PositionStructureSection
            expanded={expandedSections.structure}
            onToggle={() => toggleSection('structure')}
            legs={formData.legs}
            addLeg={addLeg}
            removeLeg={removeLeg}
            updateLeg={updateLeg}
            errors={errors}
          />

          {/* D) Sizing Section */}
          <SizingSection
            expanded={expandedSections.sizing}
            onToggle={() => toggleSection('sizing')}
            formData={formData}
            updateField={updateField}
            errors={errors}
          />

          {/* E) Exits Section */}
          <ExitsSection
            expanded={expandedSections.exits}
            onToggle={() => toggleSection('exits')}
            formData={formData}
            updateField={updateField}
            errors={errors}
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {Object.keys(errors).length > 0 && (
              <span className="text-red-400">
                ⚠️ {Object.keys(errors).length} validation error{Object.keys(errors).length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all"
            >
              Validate Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for each section

function UniverseFiltersSection({
  expanded,
  onToggle,
  formData,
  updateField,
  errors,
}: {
  expanded: boolean;
  onToggle: () => void;
  formData: StrategyFormData;
  updateField: (field: keyof StrategyFormData, value: any) => void;
  errors: ValidationErrors;
}) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🎯</span>
          <span className="text-lg font-semibold text-white">Universe Filters</span>
        </div>
        <span className="text-slate-400">{expanded ? '▼' : '►'}</span>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-4 border-t border-white/10">
          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Min Price ($)
              </label>
              <input
                type="number"
                value={formData.priceMin}
                onChange={e => updateField('priceMin', Number(e.target.value))}
                className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                  errors.priceMin ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {errors.priceMin && <p className="mt-1 text-sm text-red-400">{errors.priceMin}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Price ($)
              </label>
              <input
                type="number"
                value={formData.priceMax}
                onChange={e => updateField('priceMax', Number(e.target.value))}
                className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                  errors.priceMax ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {errors.priceMax && <p className="mt-1 text-sm text-red-400">{errors.priceMax}</p>}
            </div>
          </div>

          {/* Stock Volume */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Min Stock Volume
            </label>
            <input
              type="number"
              value={formData.minStockVolume}
              onChange={e => updateField('minStockVolume', Number(e.target.value))}
              className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.minStockVolume ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.minStockVolume && <p className="mt-1 text-sm text-red-400">{errors.minStockVolume}</p>}
          </div>

          {/* Option Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Min Option OI
              </label>
              <input
                type="number"
                value={formData.minOptionOI}
                onChange={e => updateField('minOptionOI', Number(e.target.value))}
                className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                  errors.minOptionOI ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {errors.minOptionOI && <p className="mt-1 text-sm text-red-400">{errors.minOptionOI}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Spread (decimal)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.maxOptionSpread}
                onChange={e => updateField('maxOptionSpread', Number(e.target.value))}
                className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                  errors.maxOptionSpread ? 'border-red-500' : 'border-white/20'
                }`}
              />
              {errors.maxOptionSpread && <p className="mt-1 text-sm text-red-400">{errors.maxOptionSpread}</p>}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.excludeOTC}
                onChange={e => updateField('excludeOTC', e.target.checked)}
                className="w-4 h-4 bg-slate-800 border-white/20 rounded"
              />
              <span className="text-sm text-slate-300">Exclude OTC</span>
            </label>
          </div>

          {/* Earnings Blackout */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Earnings Blackout (days before)
            </label>
            <input
              type="number"
              value={formData.earningsBlackoutDays}
              onChange={e => updateField('earningsBlackoutDays', Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PositionStructureSection({
  expanded,
  onToggle,
  legs,
  addLeg,
  removeLeg,
  updateLeg,
  errors,
}: {
  expanded: boolean;
  onToggle: () => void;
  legs: Leg[];
  addLeg: () => void;
  removeLeg: (id: string) => void;
  updateLeg: (id: string, field: keyof Leg, value: any) => void;
  errors: ValidationErrors;
}) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🏗️</span>
          <span className="text-lg font-semibold text-white">Position Structure</span>
          <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-300">
            {legs.length} leg{legs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-slate-400">{expanded ? '▼' : '►'}</span>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-4 border-t border-white/10">
          {errors.legs && <p className="text-sm text-red-400">{errors.legs}</p>}

          {legs.map((leg, index) => (
            <div key={leg.id} className="p-4 bg-slate-800/50 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-cyan-400">Leg {index + 1}</span>
                <button
                  onClick={() => removeLeg(leg.id)}
                  className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs rounded transition-all"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Type */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={leg.type}
                    onChange={e => updateLeg(leg.id, 'type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded text-white text-sm"
                  >
                    <option value="STOCK">STOCK</option>
                    <option value="CALL">CALL</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>

                {/* Side */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Side</label>
                  <select
                    value={leg.side}
                    onChange={e => updateLeg(leg.id, 'side', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded text-white text-sm"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={leg.quantity}
                    onChange={e => updateLeg(leg.id, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded text-white text-sm"
                  />
                </div>

                {/* DTE (for options only) */}
                {leg.type !== 'STOCK' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">DTE</label>
                    <input
                      type="number"
                      value={leg.dte || ''}
                      onChange={e => updateLeg(leg.id, 'dte', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                )}

                {/* Delta (for options only) */}
                {leg.type !== 'STOCK' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Delta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={leg.delta || ''}
                      onChange={e => updateLeg(leg.id, 'delta', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addLeg}
            className="w-full px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 font-semibold rounded-lg transition-all"
          >
            + Add Leg
          </button>
        </div>
      )}
    </div>
  );
}

function SizingSection({
  expanded,
  onToggle,
  formData,
  updateField,
  errors,
}: {
  expanded: boolean;
  onToggle: () => void;
  formData: StrategyFormData;
  updateField: (field: keyof StrategyFormData, value: any) => void;
  errors: ValidationErrors;
}) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💰</span>
          <span className="text-lg font-semibold text-white">Sizing</span>
        </div>
        <span className="text-slate-400">{expanded ? '▼' : '►'}</span>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-4 border-t border-white/10">
          {/* Allocation Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Allocation Type
            </label>
            <select
              value={formData.allocationType}
              onChange={e => updateField('allocationType', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            >
              <option value="cash">Fixed Cash</option>
              <option value="cash_max_loss">Cash Based on Max Loss</option>
              <option value="max_loss">Risk-Based (% of Portfolio)</option>
            </select>
          </div>

          {/* Per Trade Cash */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Per Trade Cash ($)
            </label>
            <input
              type="number"
              value={formData.perTradeCash}
              onChange={e => updateField('perTradeCash', Number(e.target.value))}
              className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.perTradeCash ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.perTradeCash && <p className="mt-1 text-sm text-red-400">{errors.perTradeCash}</p>}
          </div>

          {/* Max Concurrent Positions */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Concurrent Positions
            </label>
            <input
              type="number"
              value={formData.maxConcurrentPositions}
              onChange={e => updateField('maxConcurrentPositions', Number(e.target.value))}
              className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.maxConcurrentPositions ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.maxConcurrentPositions && <p className="mt-1 text-sm text-red-400">{errors.maxConcurrentPositions}</p>}
          </div>

          {/* Portfolio Heat Max */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Portfolio Heat Max (%)
            </label>
            <input
              type="number"
              value={formData.portfolioHeatMax}
              onChange={e => updateField('portfolioHeatMax', Number(e.target.value))}
              className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.portfolioHeatMax ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.portfolioHeatMax && <p className="mt-1 text-sm text-red-400">{errors.portfolioHeatMax}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ExitsSection({
  expanded,
  onToggle,
  formData,
  updateField,
  errors,
}: {
  expanded: boolean;
  onToggle: () => void;
  formData: StrategyFormData;
  updateField: (field: keyof StrategyFormData, value: any) => void;
  errors: ValidationErrors;
}) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🚪</span>
          <span className="text-lg font-semibold text-white">Exits</span>
        </div>
        <span className="text-slate-400">{expanded ? '▼' : '►'}</span>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-4 border-t border-white/10">
          {/* Profit Target */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profit Target (%)
            </label>
            <input
              type="number"
              value={formData.profitTargetPct}
              onChange={e => updateField('profitTargetPct', Number(e.target.value))}
              className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.profitTargetPct ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.profitTargetPct && <p className="mt-1 text-sm text-red-400">{errors.profitTargetPct}</p>}
          </div>

          {/* Max Loss */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Loss (%)
            </label>
            <input
              type="number"
              value={formData.maxLossPct}
              onChange={e => updateField('maxLossPct', Number(e.target.value))}
              className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.maxLossPct ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.maxLossPct && <p className="mt-1 text-sm text-red-400">{errors.maxLossPct}</p>}
          </div>

          {/* Time Exit DTE */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time Exit (DTE)
            </label>
            <input
              type="number"
              value={formData.timeExitDTE}
              onChange={e => updateField('timeExitDTE', Number(e.target.value))}
              className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white outline-none focus:ring-2 transition-all ${
                errors.timeExitDTE ? 'border-red-500' : 'border-white/20'
              }`}
            />
            {errors.timeExitDTE && <p className="mt-1 text-sm text-red-400">{errors.timeExitDTE}</p>}
          </div>

          {/* OCO Brackets */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.useOCOBrackets}
              onChange={e => updateField('useOCOBrackets', e.target.checked)}
              className="w-4 h-4 bg-slate-800 border-white/20 rounded"
            />
            <label className="text-sm text-slate-300">
              Use OCO Brackets (One-Cancels-Other)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
