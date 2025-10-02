'use client';

import { useState, useEffect } from 'react';
import { validateStrategy } from '@/strategies/validator';
import type { Strategy, ValidationResult, ValidationError, ValidationWarning } from '@/strategies/schema';

/**
 * Strategy Builder Component
 *
 * Complete UI for creating and editing Allessandra strategies.
 * Includes validation via validator.ts and save/load functionality.
 *
 * INCREMENT 9: Added validator integration, save flow, and version management
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
  strategyId?: string; // For editing existing strategies
}

interface StrategyVersion {
  version: number;
  updated_at: string;
  changes_summary?: string;
}

export default function StrategyBuilder({
  isOpen,
  onClose,
  initialData,
  strategyId,
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

  const [clientErrors, setClientErrors] = useState<ValidationErrors>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showWarnings, setShowWarnings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [versions, setVersions] = useState<StrategyVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    universe: false,
    structure: false,
    sizing: false,
    exits: false,
  });

  // Load versions when editing existing strategy
  useEffect(() => {
    if (strategyId) {
      loadVersions(strategyId);
    }
  }, [strategyId]);

  const loadVersions = async (id: string) => {
    try {
      const response = await fetch(`/api/strategies/${id}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const loadVersion = async (version: number) => {
    if (!strategyId) return;

    try {
      const response = await fetch(`/api/strategies/${strategyId}/versions`);
      if (response.ok) {
        const data = await response.json();
        const versionData = data.versions.find((v: any) => v.version === version);
        if (versionData) {
          // Convert Strategy JSON to form data
          convertStrategyToFormData(versionData.strategy_json);
          setSelectedVersion(version);
        }
      }
    } catch (error) {
      console.error('Failed to load version:', error);
    }
  };

  const convertStrategyToFormData = (strategy: Strategy) => {
    // Convert Strategy DSL to form data
    // This is a simplified version - full implementation would map all fields
    setFormData({
      name: strategy.name,
      goal: strategy.goal,
      template: 'custom',
      priceMin: strategy.universe.filters.price_between?.[0] || 0,
      priceMax: strategy.universe.filters.price_between?.[1] || 1000,
      minStockVolume: strategy.universe.filters.min_stock_adv || 1000000,
      minOptionOI: strategy.universe.filters.min_option_oi_per_strike || 100,
      maxOptionSpread: strategy.universe.filters.max_option_spread || 0.10,
      excludeOTC: strategy.universe.filters.exclude_otc ?? true,
      earningsBlackoutDays: strategy.universe.filters.earnings_within_days || 7,
      legs: strategy.position.legs.map((leg, idx) => ({
        id: `leg_${idx}`,
        type: leg.type,
        side: leg.side,
        dte: leg.dte,
        delta: leg.delta,
        quantity: leg.qty || 1,
      })),
      allocationType: strategy.sizing.allocation_type,
      perTradeCash: strategy.sizing.per_trade_cash || 5000,
      maxConcurrentPositions: strategy.sizing.max_concurrent_positions,
      portfolioHeatMax: (strategy.sizing.portfolio_heat_max || 0) * 100,
      profitTargetPct: (strategy.exits.profit_target_pct || 0) * 100,
      maxLossPct: (strategy.exits.max_loss_pct || 0) * 100,
      timeExitDTE: strategy.exits.time_exit_dte || 7,
      useOCOBrackets: strategy.exits.oco_brackets ?? false,
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateField = (field: keyof StrategyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear client error for this field
    if (clientErrors[field]) {
      setClientErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear validation result when form changes
    setValidationResult(null);
    setSaveSuccess(false);
    setSaveError(null);
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
    updateField(
      'legs',
      formData.legs.filter(leg => leg.id !== id)
    );
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
        { id: 'leg_2', type: 'PUT', side: 'BUY', dte: 35, delta: -0.2, quantity: 1 },
        { id: 'leg_3', type: 'CALL', side: 'SELL', dte: 14, delta: 0.3, quantity: 1 },
      ],
      put_spread: [
        { id: 'leg_1', type: 'PUT', side: 'SELL', dte: 28, delta: -0.25, quantity: 1 },
        { id: 'leg_2', type: 'PUT', side: 'BUY', dte: 28, delta: -0.1, quantity: 1 },
      ],
      call_spread: [
        { id: 'leg_1', type: 'CALL', side: 'SELL', dte: 28, delta: 0.25, quantity: 1 },
        { id: 'leg_2', type: 'CALL', side: 'BUY', dte: 28, delta: 0.1, quantity: 1 },
      ],
      iron_condor: [
        { id: 'leg_1', type: 'PUT', side: 'SELL', dte: 30, delta: -0.2, quantity: 1 },
        { id: 'leg_2', type: 'PUT', side: 'BUY', dte: 30, delta: -0.1, quantity: 1 },
        { id: 'leg_3', type: 'CALL', side: 'SELL', dte: 30, delta: 0.2, quantity: 1 },
        { id: 'leg_4', type: 'CALL', side: 'BUY', dte: 30, delta: 0.1, quantity: 1 },
      ],
      csp: [{ id: 'leg_1', type: 'PUT', side: 'SELL', dte: 28, delta: -0.25, quantity: 1 }],
      covered_call: [
        { id: 'leg_1', type: 'STOCK', side: 'BUY', quantity: 100 },
        { id: 'leg_2', type: 'CALL', side: 'SELL', dte: 14, delta: 0.3, quantity: 1 },
      ],
      custom: [],
    };

    updateField('legs', templates[template]);
  };

  const clientValidate = (): boolean => {
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

    setClientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Convert form data to Strategy DSL JSON
   */
  const convertToStrategyJSON = (): Strategy => {
    return {
      strategy_id: strategyId || `strat_${Date.now()}`,
      name: formData.name,
      goal: formData.goal,
      universe: {
        filters: {
          price_between: [formData.priceMin, formData.priceMax],
          min_stock_adv: formData.minStockVolume,
          min_option_oi_per_strike: formData.minOptionOI,
          max_option_spread: formData.maxOptionSpread,
          exclude_otc: formData.excludeOTC,
          earnings_within_days: formData.earningsBlackoutDays,
          halted: false,
        },
      },
      entry: {
        time_window: {
          start: '09:35',
          end: '10:30',
          tz: 'America/New_York',
        },
        liquidity_checks: true,
      },
      position: {
        legs: formData.legs.map(leg => ({
          type: leg.type,
          side: leg.side,
          qty: leg.quantity,
          dte: leg.dte,
          delta: leg.delta,
        })),
      },
      sizing: {
        allocation_type: formData.allocationType,
        per_trade_cash: formData.perTradeCash,
        max_concurrent_positions: formData.maxConcurrentPositions,
        portfolio_heat_max: formData.portfolioHeatMax / 100,
      },
      exits: {
        profit_target_pct: formData.profitTargetPct / 100,
        max_loss_pct: formData.maxLossPct / 100,
        time_exit_dte: formData.timeExitDTE,
        oco_brackets: formData.useOCOBrackets,
      },
      risk: {
        circuit_breakers: {
          market: {
            vix_gt: 28,
            suspend_new_trades: true,
          },
        },
        slippage_budget_pct: 0.4,
        max_order_reprices: 4,
      },
      automation: {
        scan_time: '09:20',
        propose_time: '09:40',
        approval_deadline: '09:58',
        execution_mode: 'requires_approval',
      },
      broker_routing: {
        order_type: 'NET_MULTI',
        limit_price: 'mid_with_tolerance',
        tolerance: 0.03,
        time_in_force: 'DAY',
      },
    };
  };

  /**
   * Validate using the DSL validator
   */
  const handleValidate = () => {
    // First run client-side validation
    if (!clientValidate()) {
      return;
    }

    // Convert to Strategy JSON
    const strategyJSON = convertToStrategyJSON();

    // Run validator
    const result = validateStrategy(strategyJSON);
    setValidationResult(result);

    if (result.warnings.length > 0) {
      setShowWarnings(true);
    }

    if (!result.valid) {
      alert(
        `❌ Validation Failed\n\n${result.errors.length} error(s) found:\n${result.errors
          .map(e => `• ${e.field}: ${e.message}`)
          .join('\n')}`
      );
    } else if (result.warnings.length > 0) {
      alert(
        `⚠️ Validation Passed with Warnings\n\n${result.warnings
          .map(w => `• ${w.field}: ${w.message}`)
          .join('\n')}\n\nYou can still save, but consider addressing these warnings.`
      );
    } else {
      alert('✅ Validation Passed!\n\nNo errors or warnings found. Ready to save.');
    }
  };

  /**
   * Save strategy via API
   */
  const handleSave = async (forceWithWarnings = false) => {
    // Validate first
    if (!validationResult) {
      handleValidate();
      return;
    }

    // Block save if there are errors
    if (!validationResult.valid) {
      alert('Cannot save strategy with validation errors. Please fix all errors first.');
      return;
    }

    // Show warnings if not forcing
    if (!forceWithWarnings && validationResult.warnings.length > 0) {
      const proceed = confirm(
        `⚠️ Save with Warnings?\n\n${validationResult.warnings
          .map(w => `• ${w.field}: ${w.message}`)
          .join('\n')}\n\nDo you want to save anyway?`
      );
      if (!proceed) return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const strategyJSON = convertToStrategyJSON();

      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategyJSON),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveSuccess(true);
        alert(
          `✅ Strategy Saved!\n\nStrategy ID: ${data.strategyId}\nVersion: ${data.version}\n\nYou can now use this strategy for backtesting or live trading.`
        );

        // Reload versions if editing
        if (strategyId) {
          loadVersions(strategyId);
        }

        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSaveError(data.error || 'Failed to save strategy');
        alert(`❌ Save Failed\n\n${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setSaveError(String(error));
      alert(`❌ Save Failed\n\n${String(error)}`);
    } finally {
      setIsSaving(false);
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
              <h2 className="text-2xl font-bold text-white mb-1">🛠️ Strategy Builder</h2>
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

          {/* Version Selector */}
          {versions.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-slate-400">Load Version:</span>
              <select
                value={selectedVersion || ''}
                onChange={e => loadVersion(Number(e.target.value))}
                className="px-3 py-1 bg-slate-900 border border-white/20 rounded text-sm text-white"
              >
                <option value="">Current</option>
                {versions.map(v => (
                  <option key={v.version} value={v.version}>
                    v{v.version} - {new Date(v.updated_at).toLocaleDateString()}
                    {v.changes_summary && ` (${v.changes_summary})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Validation Status */}
          {validationResult && (
            <div className="mt-3 flex items-center gap-2">
              {validationResult.valid ? (
                <span className="text-sm text-green-400">✓ Validation Passed</span>
              ) : (
                <span className="text-sm text-red-400">
                  ✗ {validationResult.errors.length} Error(s)
                </span>
              )}
              {validationResult.warnings.length > 0 && (
                <span className="text-sm text-yellow-400">
                  ⚠ {validationResult.warnings.length} Warning(s)
                </span>
              )}
            </div>
          )}

          {saveSuccess && (
            <div className="mt-3 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded text-sm text-green-400">
              ✓ Strategy saved successfully!
            </div>
          )}

          {saveError && (
            <div className="mt-3 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-400">
              ✗ {saveError}
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Validation Errors Display */}
          {validationResult && !validationResult.valid && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="text-sm font-semibold text-red-400 mb-2">Validation Errors:</div>
              <ul className="space-y-1 text-xs text-red-300">
                {validationResult.errors.map((err, idx) => (
                  <li key={idx}>
                    • <span className="font-semibold">{err.field}</span>: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation Warnings Display */}
          {validationResult && validationResult.warnings.length > 0 && showWarnings && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-yellow-400">Validation Warnings:</div>
                <button
                  onClick={() => setShowWarnings(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Hide
                </button>
              </div>
              <ul className="space-y-1 text-xs text-yellow-300">
                {validationResult.warnings.map((warn, idx) => (
                  <li key={idx}>
                    • <span className="font-semibold">{warn.field}</span>: {warn.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                      clientErrors.name
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-white/20 focus:ring-cyan-500/50'
                    }`}
                  />
                  {clientErrors.name && (
                    <p className="mt-1 text-sm text-red-400">{clientErrors.name}</p>
                  )}
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
                      clientErrors.goal
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-white/20 focus:ring-cyan-500/50'
                    }`}
                  />
                  {clientErrors.goal && (
                    <p className="mt-1 text-sm text-red-400">{clientErrors.goal}</p>
                  )}
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
            errors={clientErrors}
          />

          {/* C) Position Structure Section */}
          <PositionStructureSection
            expanded={expandedSections.structure}
            onToggle={() => toggleSection('structure')}
            legs={formData.legs}
            addLeg={addLeg}
            removeLeg={removeLeg}
            updateLeg={updateLeg}
            errors={clientErrors}
          />

          {/* D) Sizing Section */}
          <SizingSection
            expanded={expandedSections.sizing}
            onToggle={() => toggleSection('sizing')}
            formData={formData}
            updateField={updateField}
            errors={clientErrors}
          />

          {/* E) Exits Section */}
          <ExitsSection
            expanded={expandedSections.exits}
            onToggle={() => toggleSection('exits')}
            formData={formData}
            updateField={updateField}
            errors={clientErrors}
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {Object.keys(clientErrors).length > 0 && (
              <span className="text-red-400">
                ⚠️ {Object.keys(clientErrors).length} validation error
                {Object.keys(clientErrors).length !== 1 ? 's' : ''}
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
              onClick={handleValidate}
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all"
            >
              🔍 Validate
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '💾 Saving...' : '💾 Save Strategy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for each section (unchanged from INCREMENT 8)

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
            {errors.minStockVolume && (
              <p className="mt-1 text-sm text-red-400">{errors.minStockVolume}</p>
            )}
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
              {errors.minOptionOI && (
                <p className="mt-1 text-sm text-red-400">{errors.minOptionOI}</p>
              )}
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
              {errors.maxOptionSpread && (
                <p className="mt-1 text-sm text-red-400">{errors.maxOptionSpread}</p>
              )}
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
            {errors.perTradeCash && (
              <p className="mt-1 text-sm text-red-400">{errors.perTradeCash}</p>
            )}
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
            {errors.maxConcurrentPositions && (
              <p className="mt-1 text-sm text-red-400">{errors.maxConcurrentPositions}</p>
            )}
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
            {errors.portfolioHeatMax && (
              <p className="mt-1 text-sm text-red-400">{errors.portfolioHeatMax}</p>
            )}
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
            {errors.profitTargetPct && (
              <p className="mt-1 text-sm text-red-400">{errors.profitTargetPct}</p>
            )}
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
            {errors.maxLossPct && (
              <p className="mt-1 text-sm text-red-400">{errors.maxLossPct}</p>
            )}
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
            {errors.timeExitDTE && (
              <p className="mt-1 text-sm text-red-400">{errors.timeExitDTE}</p>
            )}
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
