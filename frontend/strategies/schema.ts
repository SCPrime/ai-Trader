/**
 * Allessandra Strategy DSL - TypeScript Schema
 *
 * Complete type definitions for the multi-leg options strategy JSON specification.
 * Used for strategy creation, validation, backtesting, and live execution.
 */

// ============================================================================
// Core Strategy Interface
// ============================================================================

export interface Strategy {
  strategy_id: string;
  name: string;
  goal: string;
  universe: Universe;
  entry: Entry;
  position: Position;
  sizing: Sizing;
  exits: Exits;
  risk: Risk;
  automation: Automation;
  user_overrides?: UserOverrides;
  broker_routing: BrokerRouting;
}

// ============================================================================
// Universe & Filtering
// ============================================================================

export type TargetClass = 'current' | 'invested' | 'future';

export interface Universe {
  tickers?: string[];
  filters: UniverseFilters;
  ranking?: RankingRule[];
  max_candidates?: number;
  target_classes?: TargetClass[];
}

export interface UniverseFilters {
  price_between?: [number, number];
  min_stock_adv?: number;
  min_option_oi_per_strike?: number;
  max_option_spread?: number;
  exclude_otc?: boolean;
  exclude_hard_to_borrow?: boolean;
  earnings_within_days?: number;
  halted?: boolean;
}

export interface RankingRule {
  feature: string;
  weight: number;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Entry Conditions
// ============================================================================

export interface Entry {
  time_window: TimeWindow;
  indicators?: Record<string, any>;
  liquidity_checks: boolean;
}

export interface TimeWindow {
  start: string;
  end: string;
  tz: string;
}

// ============================================================================
// Position Structure (Multi-Leg)
// ============================================================================

export type LegType = 'STOCK' | 'CALL' | 'PUT';
export type LegSide = 'BUY' | 'SELL';

export interface Position {
  legs: Leg[];
  roll_rules?: RollRules;
}

export interface Leg {
  type: LegType;
  side: LegSide;
  qty?: number;
  dte?: number;
  delta?: number;
  strike?: number;
  offset_strikes?: number;
}

export interface RollRules {
  short_call?: RollRule;
  short_put?: RollRule;
  long_put?: RollRule;
}

export interface RollRule {
  roll_if_dte_lt?: number;
  roll_if_delta_gt?: number;
  target_delta?: number;
  target_dte?: number;
  same_exp_weekly?: boolean;
  max_rolls_per_position?: number;
}

// ============================================================================
// Position Sizing
// ============================================================================

export type AllocationType = 'cash' | 'cash_max_loss' | 'max_loss';

export interface Sizing {
  allocation_type: AllocationType;
  per_trade_cash?: number;
  risk_per_trade_pct?: number;
  max_concurrent_positions: number;
  portfolio_heat_max?: number;
}

// ============================================================================
// Exit Rules
// ============================================================================

export interface Exits {
  profit_target_pct?: number;
  max_loss_pct?: number;
  time_exit_dte?: number;
  time_exit_before_earnings_days?: number;
  oco_brackets?: boolean;
  adjustment_triggers?: AdjustmentTriggers;
}

export interface AdjustmentTriggers {
  assignment_to_cc?: boolean;
  cc_delta?: number;
  cc_dte?: number;
  delta_breach?: number;
  gamma_risk_threshold?: number;
}

// ============================================================================
// Risk Management & Circuit Breakers
// ============================================================================

export interface Risk {
  circuit_breakers: CircuitBreakers;
  slippage_budget_pct: number;
  max_order_reprices: number;
}

export interface CircuitBreakers {
  market?: MarketBreaker;
  news?: NewsBreaker;
  liq?: LiquidityBreaker;
}

export interface MarketBreaker {
  vix_gt?: number;
  index_gap_pct_gt?: number;
  suspend_new_trades: boolean;
}

export interface NewsBreaker {
  rating_at_or_below?: number;
  novelty_gt?: number;
  cooldown_min?: number;
}

export interface LiquidityBreaker {
  spread_widen_gt?: number;
  cancel_unfilled?: boolean;
}

// ============================================================================
// Automation & Execution
// ============================================================================

export type ExecutionMode = 'requires_approval' | 'autopilot';

export interface Automation {
  scan_time: string;
  propose_time: string;
  approval_deadline: string;
  execution_mode: ExecutionMode;
  autopilot_if_win_rate_gt?: number;
  autopilot_if_sharpe_gt?: number;
  autopilot_max_dd_lt?: number;
}

// ============================================================================
// User Overrides
// ============================================================================

export interface UserOverrides {
  editable_fields: string[];
  allow_override_strikes: boolean;
  allow_override_qty: boolean;
  allow_override_dte: boolean;
  allow_risk_param_edits: boolean; // Allow editing circuit breakers, slippage, reprices
  show_advisory_warnings: boolean; // Show warnings when exceeding recommended thresholds
}

// ============================================================================
// Broker Routing
// ============================================================================

export type OrderType = 'NET_MULTI' | 'NET_DEBIT_OR_CREDIT_MULTI';
export type LimitPriceStrategy = 'mid_with_tolerance' | 'bid' | 'ask' | 'last';
export type TimeInForce = 'DAY' | 'IOC' | 'FOK' | 'GTC';

export interface BrokerRouting {
  order_type: OrderType;
  limit_price: LimitPriceStrategy;
  tolerance: number;
  time_in_force?: TimeInForce;
}

// ============================================================================
// Portfolio Policy (Stability Sleeve)
// ============================================================================

export interface PortfolioPolicy {
  policy_id: string;
  siphon_realized_pnl_weekly_pct: number;
  target_allocations: TargetAllocation[];
  rebalance_threshold_pct: number;
  max_option_utilization_pct_of_portfolio: number;
  autopilot: boolean;
}

export interface TargetAllocation {
  instrument: string;
  pct: number;
  overlay?: CoveredCallOverlay;
}

export interface CoveredCallOverlay {
  covered_call_delta: number;
  dte: number;
  roll_if_dte_lt?: number;
}

// ============================================================================
// Proposal & Order Types
// ============================================================================

export interface Proposal {
  id: string;
  strategy_ref: string;
  strategy_version: number;
  user_id: string;
  as_of: string;
  ticker: string;
  payload: ProposalPayload;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approval_deadline: string;
  reason?: string;
}

export interface ProposalPayload {
  legs: ProposalLeg[];
  pricing: Pricing;
  risk: RiskMetrics;
  greeks: Greeks;
  indicators: Indicators;
  charts: Charts;
}

export interface ProposalLeg {
  type: LegType;
  side: LegSide;
  qty: number;
  strike?: number;
  expiry?: string;
  delta?: number;
  dte?: number;
}

export interface Pricing {
  net_debit_credit: number;
  net_type: 'DEBIT' | 'CREDIT';
  mid_price: number;
  bid_price: number;
  ask_price: number;
  spread: number;
  spread_pct: number;
}

export interface RiskMetrics {
  max_risk: number;
  max_profit: number;
  breakevens: number[];
  pop: number;
  risk_reward_ratio: number;
  capital_required: number;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho?: number;
}

export interface Indicators {
  ivp?: number;
  ivr?: number;
  hv_20?: number;
  hv_30?: number;
  iv_hv_ratio?: number;
  oi_total?: number;
  volume_total?: number;
  liquidity_score?: number;
}

export interface Charts {
  payoff_diagram_url: string;
  iv_hv_chart_url: string;
  oi_heatmap_url: string;
}

// ============================================================================
// Order Execution
// ============================================================================

export interface Order {
  id: string;
  proposal_id: string;
  broker_order_id?: string;
  route: string;
  status: 'staged' | 'submitted' | 'partial' | 'filled' | 'rejected' | 'canceled';
  legs: OrderLeg[];
  pricing: OrderPricing;
  risk: RiskMetrics;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export interface OrderLeg {
  type: LegType;
  side: LegSide;
  qty: number;
  strike?: number;
  expiry?: string;
  symbol?: string;
}

export interface OrderPricing {
  limit_price: number;
  net_type: 'DEBIT' | 'CREDIT';
  tif: TimeInForce;
  slippage_budget_pct: number;
  max_reprices: number;
  current_attempt: number;
}

// ============================================================================
// Execution & Fill
// ============================================================================

export interface Execution {
  id: string;
  order_id: string;
  fill_qty: number;
  fill_price: number;
  leg_fills: LegFill[];
  timestamp: string;
  broker_execution_id?: string;
}

export interface LegFill {
  leg_index: number;
  qty: number;
  price: number;
  timestamp: string;
}

// ============================================================================
// Position Management
// ============================================================================

export interface PositionRecord {
  id: string;
  user_id: string;
  ticker: string;
  type: 'stock' | 'option_combo' | 'option_single';
  legs: PositionLeg[];
  cost_basis: number;
  qty: number;
  greeks: Greeks;
  mtm: number;
  unrealized_pnl: number;
  opened_at: string;
  closed_at?: string;
}

export interface PositionLeg {
  type: LegType;
  side: LegSide;
  qty: number;
  strike?: number;
  expiry?: string;
  entry_price: number;
  current_price?: number;
}

// ============================================================================
// Risk Events
// ============================================================================

export type RiskEventKind = 'market_vix' | 'market_gap' | 'news_sentiment' | 'liquidity_spread' | 'position_breach';

export interface RiskEvent {
  id: string;
  user_id: string;
  kind: RiskEventKind;
  payload: RiskEventPayload;
  triggered_at: string;
  resolved_at?: string;
}

export interface RiskEventPayload {
  ticker?: string;
  strategy_id?: string;
  threshold: number;
  actual: number;
  message: string;
  action: 'pause_entries' | 'close_position' | 'alert_only';
  cooldown_min?: number;
}

// ============================================================================
// Reports
// ============================================================================

export type ReportKind = 'pre' | 'mid' | 'post';

export interface Report {
  id: string;
  user_id: string;
  kind: ReportKind;
  generated_at: string;
  payload: ReportPayload;
}

export interface ReportPayload {
  as_of: string;
  portfolio: PortfolioSnapshot;
  market: MarketSnapshot;
  news: NewsItem[];
  candidates: CandidateSummary[];
  positions: PositionSummary[];
  actions: string[];
  pnl?: PnLSummary;
}

export interface PortfolioSnapshot {
  equity: number;
  cash: number;
  buying_power: number;
  heat: number;
  var_1d_pct: number;
  portfolio_delta: number;
  portfolio_theta: number;
}

export interface MarketSnapshot {
  vix: number;
  futures: Record<string, number>;
  events: string[];
  index_gap_pct?: number;
}

export interface NewsItem {
  ticker: string;
  headline: string;
  sentiment: number;
  novelty: number;
  action?: string;
  source?: string;
  published_at: string;
}

export interface CandidateSummary {
  strategy_id: string;
  ticker: string;
  credit_or_debit: 'credit' | 'debit';
  pop: number;
  max_risk: number;
  max_profit: number;
  ivp?: number;
  oi_ok: boolean;
  spread_ok: boolean;
}

export interface PositionSummary {
  id: string;
  ticker: string;
  type: string;
  mtm: number;
  unrealized_pnl: number;
  greeks: Greeks;
  dte?: number;
  roll_due?: boolean;
}

export interface PnLSummary {
  realized_today: number;
  unrealized_today: number;
  realized_week: number;
  realized_month: number;
  siphoned_to_sleeve: number;
}

// ============================================================================
// News & Research
// ============================================================================

export interface NewsArticle {
  id: string;
  ticker?: string;
  tickers?: string[];
  source: string;
  headline: string;
  url: string;
  published_at: string;
  sentiment: number;
  novelty: number;
  relevance: number;
  time_to_impact?: 'immediate' | 'short' | 'mid' | 'long';
  raw: Record<string, any>;
}

// ============================================================================
// Watchlist Targets
// ============================================================================

export interface Target {
  id: string;
  user_id: string;
  ticker: string;
  class: TargetClass;
  notes?: string;
  active: boolean;
  created_at: string;
}

// ============================================================================
// Notification
// ============================================================================

export type NotificationChannel = 'sms' | 'email' | 'push';
export type NotificationKind =
  | 'proposals_ready'
  | 'approval_deadline'
  | 'fill_complete'
  | 'risk_breaker'
  | 'profit_target'
  | 'stop_loss'
  | 'roll_due'
  | 'report_ready';

export interface Notification {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  kind: NotificationKind;
  message: string;
  payload: Record<string, any>;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
}

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// Broker Adapter Interfaces
// ============================================================================

export interface MultiLegOrderLeg {
  type: LegType;
  side: LegSide;
  qty: number;
  strike?: number;
  expiry?: string;
  symbol?: string;
}

export interface MultiLegOrder {
  legs: MultiLegOrderLeg[];
  netType: 'DEBIT' | 'CREDIT';
  limit: number;
  tif: TimeInForce;
  clientOrderId: string;
}

export interface BrokerAdapter {
  place(order: MultiLegOrder): Promise<{ brokerOrderId: string }>;
  cancel(brokerOrderId: string): Promise<void>;
  getPositions(): Promise<any[]>;
  onExecutionWebhook(payload: any): void;
}

// ============================================================================
// Market Data Adapter Interface
// ============================================================================

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: string;
}

export interface OptionChain {
  underlying: string;
  expiries: string[];
  strikes: Record<string, OptionStrike>;
}

export interface OptionStrike {
  strike: number;
  call: OptionQuote;
  put: OptionQuote;
}

export interface OptionQuote {
  bid: number;
  ask: number;
  last: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

// ============================================================================
// Backtest Types
// ============================================================================

export interface BacktestConfig {
  strategy: Strategy;
  start_date: string;
  end_date: string;
  initial_capital: number;
  commission_per_contract: number;
  slippage_model: 'fixed' | 'dynamic';
  include_events: boolean;
}

export interface BacktestResult {
  strategy_id: string;
  period: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_return: number;
  total_return: number;
  cagr: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  max_drawdown_date: string;
  profit_factor: number;
  avg_time_in_trade_days: number;
  liquidity_failure_rate: number;
  avg_slippage_pct: number;
  tail_loss_95: number;
  tail_loss_99: number;
  equity_curve: EquityPoint[];
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdown_pct: number;
}

// All types are already exported above with export interface/export type
