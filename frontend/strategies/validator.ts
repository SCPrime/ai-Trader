/**
 * Allessandra Strategy Validator
 *
 * Validates Strategy JSON against the DSL schema with detailed error reporting.
 */

import type {
  Strategy,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './schema';

// ============================================================================
// Main Validation Function
// ============================================================================

export function validateStrategy(strategy: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!strategy.strategy_id) {
    errors.push({
      field: 'strategy_id',
      message: 'strategy_id is required',
      code: 'REQUIRED_FIELD',
    });
  }

  if (!strategy.name) {
    errors.push({
      field: 'name',
      message: 'name is required',
      code: 'REQUIRED_FIELD',
    });
  }

  if (!strategy.goal) {
    errors.push({
      field: 'goal',
      message: 'goal is required',
      code: 'REQUIRED_FIELD',
    });
  }

  // Validate universe
  if (!strategy.universe) {
    errors.push({
      field: 'universe',
      message: 'universe is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    validateUniverse(strategy.universe, errors, warnings);
  }

  // Validate entry
  if (!strategy.entry) {
    errors.push({
      field: 'entry',
      message: 'entry is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    validateEntry(strategy.entry, errors, warnings);
  }

  // Validate position
  if (!strategy.position) {
    errors.push({
      field: 'position',
      message: 'position is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    validatePosition(strategy.position, errors, warnings);
  }

  // Validate sizing
  if (!strategy.sizing) {
    errors.push({
      field: 'sizing',
      message: 'sizing is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    validateSizing(strategy.sizing, errors, warnings);
  }

  // Validate exits
  if (!strategy.exits) {
    errors.push({
      field: 'exits',
      message: 'exits is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    validateExits(strategy.exits, errors, warnings);
  }

  // Validate risk
  if (!strategy.risk) {
    errors.push({
      field: 'risk',
      message: 'risk is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    validateRisk(strategy.risk, errors, warnings);
  }

  // Validate automation
  if (!strategy.automation) {
    errors.push({
      field: 'automation',
      message: 'automation is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    validateAutomation(strategy.automation, errors, warnings);
  }

  // Validate broker_routing
  if (!strategy.broker_routing) {
    errors.push({
      field: 'broker_routing',
      message: 'broker_routing is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    validateBrokerRouting(strategy.broker_routing, errors, warnings);
  }

  // Business logic validations
  validateBusinessRules(strategy, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Universe Validation
// ============================================================================

function validateUniverse(
  universe: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!universe.filters) {
    errors.push({
      field: 'universe.filters',
      message: 'universe.filters is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    const filters = universe.filters;

    if (filters.price_between) {
      if (
        !Array.isArray(filters.price_between) ||
        filters.price_between.length !== 2
      ) {
        errors.push({
          field: 'universe.filters.price_between',
          message: 'price_between must be [min, max] array',
          code: 'INVALID_FORMAT',
        });
      } else if (filters.price_between[0] >= filters.price_between[1]) {
        errors.push({
          field: 'universe.filters.price_between',
          message: 'min price must be less than max price',
          code: 'INVALID_RANGE',
        });
      }
    }

    if (
      filters.max_option_spread !== undefined &&
      filters.max_option_spread < 0
    ) {
      errors.push({
        field: 'universe.filters.max_option_spread',
        message: 'max_option_spread must be positive',
        code: 'INVALID_VALUE',
      });
    }

    if (
      filters.min_option_oi_per_strike !== undefined &&
      filters.min_option_oi_per_strike < 0
    ) {
      errors.push({
        field: 'universe.filters.min_option_oi_per_strike',
        message: 'min_option_oi_per_strike must be positive',
        code: 'INVALID_VALUE',
      });
    }
  }

  if (universe.target_classes) {
    const validClasses = ['current', 'invested', 'future'];
    for (const cls of universe.target_classes) {
      if (!validClasses.includes(cls)) {
        errors.push({
          field: 'universe.target_classes',
          message: `Invalid target class: ${cls}. Must be one of: ${validClasses.join(', ')}`,
          code: 'INVALID_VALUE',
        });
      }
    }
  }
}

// ============================================================================
// Entry Validation
// ============================================================================

function validateEntry(
  entry: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!entry.time_window) {
    errors.push({
      field: 'entry.time_window',
      message: 'time_window is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    const tw = entry.time_window;
    if (!tw.start || !tw.end || !tw.tz) {
      errors.push({
        field: 'entry.time_window',
        message: 'time_window must have start, end, and tz',
        code: 'REQUIRED_FIELD',
      });
    }
  }

  if (entry.liquidity_checks === undefined) {
    warnings.push({
      field: 'entry.liquidity_checks',
      message: 'liquidity_checks not specified, defaulting to false',
      code: 'MISSING_OPTIONAL',
    });
  }
}

// ============================================================================
// Position Validation
// ============================================================================

function validatePosition(
  position: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!position.legs || !Array.isArray(position.legs)) {
    errors.push({
      field: 'position.legs',
      message: 'legs must be an array',
      code: 'INVALID_FORMAT',
    });
    return;
  }

  if (position.legs.length === 0) {
    errors.push({
      field: 'position.legs',
      message: 'At least one leg is required',
      code: 'EMPTY_ARRAY',
    });
    return;
  }

  const validTypes = ['STOCK', 'CALL', 'PUT'];
  const validSides = ['BUY', 'SELL'];

  position.legs.forEach((leg: any, idx: number) => {
    if (!leg.type) {
      errors.push({
        field: `position.legs[${idx}].type`,
        message: 'leg type is required',
        code: 'REQUIRED_FIELD',
      });
    } else if (!validTypes.includes(leg.type)) {
      errors.push({
        field: `position.legs[${idx}].type`,
        message: `Invalid leg type: ${leg.type}. Must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_VALUE',
      });
    }

    if (!leg.side) {
      errors.push({
        field: `position.legs[${idx}].side`,
        message: 'leg side is required',
        code: 'REQUIRED_FIELD',
      });
    } else if (!validSides.includes(leg.side)) {
      errors.push({
        field: `position.legs[${idx}].side`,
        message: `Invalid leg side: ${leg.side}. Must be one of: ${validSides.join(', ')}`,
        code: 'INVALID_VALUE',
      });
    }

    // Options require DTE or expiry
    if (leg.type === 'CALL' || leg.type === 'PUT') {
      if (leg.dte === undefined && leg.strike === undefined && leg.delta === undefined) {
        warnings.push({
          field: `position.legs[${idx}]`,
          message: 'Option leg should specify dte/delta or explicit strike',
          code: 'MISSING_OPTIONAL',
        });
      }

      if (leg.delta !== undefined && (leg.delta < -1 || leg.delta > 1)) {
        errors.push({
          field: `position.legs[${idx}].delta`,
          message: 'delta must be between -1 and 1',
          code: 'INVALID_RANGE',
        });
      }
    }

    // Stock requires qty
    if (leg.type === 'STOCK' && leg.qty === undefined) {
      errors.push({
        field: `position.legs[${idx}].qty`,
        message: 'Stock leg must specify qty',
        code: 'REQUIRED_FIELD',
      });
    }
  });
}

// ============================================================================
// Sizing Validation
// ============================================================================

function validateSizing(
  sizing: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  const validTypes = ['cash', 'cash_max_loss', 'max_loss'];
  if (!sizing.allocation_type) {
    errors.push({
      field: 'sizing.allocation_type',
      message: 'allocation_type is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!validTypes.includes(sizing.allocation_type)) {
    errors.push({
      field: 'sizing.allocation_type',
      message: `Invalid allocation_type: ${sizing.allocation_type}. Must be one of: ${validTypes.join(', ')}`,
      code: 'INVALID_VALUE',
    });
  }

  if (sizing.allocation_type === 'cash' && sizing.per_trade_cash === undefined) {
    errors.push({
      field: 'sizing.per_trade_cash',
      message: 'per_trade_cash required when allocation_type is "cash"',
      code: 'REQUIRED_FIELD',
    });
  }

  if (
    (sizing.allocation_type === 'cash_max_loss' ||
      sizing.allocation_type === 'max_loss') &&
    sizing.risk_per_trade_pct === undefined
  ) {
    errors.push({
      field: 'sizing.risk_per_trade_pct',
      message: 'risk_per_trade_pct required for risk-based allocation',
      code: 'REQUIRED_FIELD',
    });
  }

  if (!sizing.max_concurrent_positions) {
    errors.push({
      field: 'sizing.max_concurrent_positions',
      message: 'max_concurrent_positions is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (sizing.max_concurrent_positions < 1) {
    errors.push({
      field: 'sizing.max_concurrent_positions',
      message: 'max_concurrent_positions must be at least 1',
      code: 'INVALID_VALUE',
    });
  }

  if (
    sizing.portfolio_heat_max !== undefined &&
    (sizing.portfolio_heat_max < 0 || sizing.portfolio_heat_max > 1)
  ) {
    errors.push({
      field: 'sizing.portfolio_heat_max',
      message: 'portfolio_heat_max must be between 0 and 1',
      code: 'INVALID_RANGE',
    });
  }
}

// ============================================================================
// Exits Validation
// ============================================================================

function validateExits(
  exits: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (
    exits.profit_target_pct !== undefined &&
    (exits.profit_target_pct < 0 || exits.profit_target_pct > 1)
  ) {
    errors.push({
      field: 'exits.profit_target_pct',
      message: 'profit_target_pct must be between 0 and 1',
      code: 'INVALID_RANGE',
    });
  }

  if (
    exits.max_loss_pct !== undefined &&
    (exits.max_loss_pct < 0 || exits.max_loss_pct > 1)
  ) {
    errors.push({
      field: 'exits.max_loss_pct',
      message: 'max_loss_pct must be between 0 and 1',
      code: 'INVALID_RANGE',
    });
  }

  if (exits.time_exit_dte !== undefined && exits.time_exit_dte < 0) {
    errors.push({
      field: 'exits.time_exit_dte',
      message: 'time_exit_dte must be positive',
      code: 'INVALID_VALUE',
    });
  }
}

// ============================================================================
// Risk Validation
// ============================================================================

function validateRisk(
  risk: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!risk.circuit_breakers) {
    errors.push({
      field: 'risk.circuit_breakers',
      message: 'circuit_breakers is required',
      code: 'REQUIRED_FIELD',
    });
  }

  if (risk.slippage_budget_pct === undefined) {
    errors.push({
      field: 'risk.slippage_budget_pct',
      message: 'slippage_budget_pct is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (risk.slippage_budget_pct < 0 || risk.slippage_budget_pct > 1) {
    errors.push({
      field: 'risk.slippage_budget_pct',
      message: 'slippage_budget_pct must be between 0 and 1',
      code: 'INVALID_RANGE',
    });
  }

  if (risk.max_order_reprices === undefined) {
    errors.push({
      field: 'risk.max_order_reprices',
      message: 'max_order_reprices is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (risk.max_order_reprices < 1) {
    errors.push({
      field: 'risk.max_order_reprices',
      message: 'max_order_reprices must be at least 1',
      code: 'INVALID_VALUE',
    });
  }
}

// ============================================================================
// Automation Validation
// ============================================================================

function validateAutomation(
  automation: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  const requiredTimes = ['scan_time', 'propose_time', 'approval_deadline'];
  for (const field of requiredTimes) {
    if (!automation[field]) {
      errors.push({
        field: `automation.${field}`,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD',
      });
    }
  }

  const validModes = ['requires_approval', 'autopilot'];
  if (!automation.execution_mode) {
    errors.push({
      field: 'automation.execution_mode',
      message: 'execution_mode is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!validModes.includes(automation.execution_mode)) {
    errors.push({
      field: 'automation.execution_mode',
      message: `Invalid execution_mode: ${automation.execution_mode}. Must be one of: ${validModes.join(', ')}`,
      code: 'INVALID_VALUE',
    });
  }

  if (
    automation.execution_mode === 'autopilot' &&
    automation.autopilot_if_win_rate_gt === undefined
  ) {
    warnings.push({
      field: 'automation.autopilot_if_win_rate_gt',
      message: 'Autopilot enabled without win_rate gate - consider setting threshold',
      code: 'MISSING_GATE',
    });
  }
}

// ============================================================================
// Broker Routing Validation
// ============================================================================

function validateBrokerRouting(
  routing: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  const validOrderTypes = ['NET_MULTI', 'NET_DEBIT_OR_CREDIT_MULTI'];
  if (!routing.order_type) {
    errors.push({
      field: 'broker_routing.order_type',
      message: 'order_type is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!validOrderTypes.includes(routing.order_type)) {
    errors.push({
      field: 'broker_routing.order_type',
      message: `Invalid order_type: ${routing.order_type}`,
      code: 'INVALID_VALUE',
    });
  }

  if (!routing.limit_price) {
    errors.push({
      field: 'broker_routing.limit_price',
      message: 'limit_price is required',
      code: 'REQUIRED_FIELD',
    });
  }

  if (routing.tolerance === undefined) {
    errors.push({
      field: 'broker_routing.tolerance',
      message: 'tolerance is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (routing.tolerance < 0 || routing.tolerance > 1) {
    errors.push({
      field: 'broker_routing.tolerance',
      message: 'tolerance must be between 0 and 1',
      code: 'INVALID_RANGE',
    });
  }
}

// ============================================================================
// Business Rules Validation
// ============================================================================

function validateBusinessRules(
  strategy: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  // Capital discipline: sub-$4 names must be cash-collateralized or defined-risk
  if (
    strategy.universe?.filters?.price_between &&
    strategy.universe.filters.price_between[1] <= 4.0
  ) {
    const hasNakedShortOption = strategy.position?.legs?.some(
      (leg: any) =>
        (leg.type === 'CALL' || leg.type === 'PUT') && leg.side === 'SELL'
    );

    if (hasNakedShortOption) {
      const hasProtection = strategy.position?.legs?.some(
        (leg: any) =>
          (leg.type === 'CALL' || leg.type === 'PUT') && leg.side === 'BUY'
      );

      if (!hasProtection) {
        errors.push({
          field: 'position.legs',
          message:
            'Sub-$4 strategies with short options must be cash-secured or have defined risk',
          code: 'CAPITAL_DISCIPLINE',
        });
      }
    }
  }

  // Environment-aware autopilot validation
  if (strategy.automation?.execution_mode === 'autopilot') {
    const tradingMode = typeof window !== 'undefined'
      ? localStorage.getItem('tradingMode') || 'paper'
      : 'paper';

    if (tradingMode === 'live') {
      // Get trade history from localStorage
      const history = JSON.parse(localStorage.getItem('tradeHistory') || '[]');
      const strategyTrades = history.filter((t: any) => t.strategyId === strategy.strategy_id);

      const daysSinceLaunch = strategyTrades.length > 0
        ? (Date.now() - new Date(strategyTrades[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      const winRate = strategyTrades.length > 0
        ? strategyTrades.filter((t: any) => t.pnl > 0).length / strategyTrades.length
        : 0;

      if (daysSinceLaunch < 90) {
        errors.push({
          field: 'automation.execution_mode',
          message: 'Autopilot requires 90+ days of trade history in live mode',
          code: 'AUTOPILOT_INSUFFICIENT_HISTORY',
        });
      }

      if (winRate < (strategy.automation.autopilot_if_win_rate_gt || 0.58)) {
        errors.push({
          field: 'automation.execution_mode',
          message: `Win rate ${(winRate*100).toFixed(1)}% below required ${((strategy.automation.autopilot_if_win_rate_gt || 0.58)*100).toFixed(1)}%`,
          code: 'AUTOPILOT_WIN_RATE_TOO_LOW',
        });
      }
    } else {
      // Paper mode: Allow but warn
      warnings.push({
        field: 'automation.execution_mode',
        message: '⚠️ PAPER TRADING: Autopilot enabled for testing. This strategy will execute trades without approval.',
        code: 'AUTOPILOT_PAPER_MODE',
      });
    }

    const hasGates =
      strategy.automation.autopilot_if_win_rate_gt !== undefined ||
      strategy.automation.autopilot_if_sharpe_gt !== undefined ||
      strategy.automation.autopilot_max_dd_lt !== undefined;

    if (!hasGates) {
      warnings.push({
        field: 'automation',
        message: 'Consider setting performance thresholds (win rate, Sharpe, max DD) for autopilot mode',
        code: 'AUTOPILOT_NO_GATES',
      });
    }
  }

  // Liquidity checks recommended for sub-$4
  if (
    strategy.universe?.filters?.price_between &&
    strategy.universe.filters.price_between[1] <= 4.0 &&
    !strategy.entry?.liquidity_checks
  ) {
    warnings.push({
      field: 'entry.liquidity_checks',
      message: 'Liquidity checks strongly recommended for sub-$4 names',
      code: 'LIQUIDITY_WARNING',
    });
  }
}

// ============================================================================
// Helper: Validate JSON Structure
// ============================================================================

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Export
// ============================================================================

export { validateStrategy as default };
