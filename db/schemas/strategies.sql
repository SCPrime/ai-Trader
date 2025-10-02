-- ============================================================================
-- Strategies Table Schema
-- ============================================================================
-- Stores user-defined Allessandra strategies with version management
-- Each strategy can have multiple versions, with the latest version being active

CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,

  -- Strategy identification
  strategy_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,

  -- User ownership
  user_id VARCHAR(255) NOT NULL,

  -- Strategy metadata
  name VARCHAR(500) NOT NULL,
  goal TEXT,

  -- Full strategy JSON (Strategy DSL)
  strategy_json JSONB NOT NULL,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),

  -- Change tracking
  changes_summary TEXT,

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Indexes
  CONSTRAINT unique_strategy_version UNIQUE (strategy_id, version)
);

-- Create indexes for common queries
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_strategy_id ON strategies(strategy_id);
CREATE INDEX idx_strategies_active ON strategies(active) WHERE active = true;
CREATE INDEX idx_strategies_updated_at ON strategies(updated_at DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_strategies_json ON strategies USING GIN (strategy_json);

-- ============================================================================
-- Strategy Templates Table
-- ============================================================================
-- Stores pre-built strategy templates (seed strategies)

CREATE TABLE IF NOT EXISTS strategy_templates (
  id SERIAL PRIMARY KEY,

  -- Template identification
  template_id VARCHAR(255) NOT NULL UNIQUE,

  -- Template metadata
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'collar', 'spread', 'condor', 'wheel', etc.
  difficulty VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'

  -- Template strategy JSON
  template_json JSONB NOT NULL,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Display order
  display_order INTEGER DEFAULT 0,

  -- Visibility
  visible BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_templates_category ON strategy_templates(category);
CREATE INDEX idx_templates_display_order ON strategy_templates(display_order);

-- ============================================================================
-- Strategy Performance Table
-- ============================================================================
-- Tracks backtest and live performance metrics for strategies

CREATE TABLE IF NOT EXISTS strategy_performance (
  id SERIAL PRIMARY KEY,

  -- Strategy reference
  strategy_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,

  -- Performance type
  performance_type VARCHAR(50) NOT NULL, -- 'backtest' | 'live' | 'paper'

  -- Time period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Performance metrics
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2),

  -- Returns
  total_return DECIMAL(10,2),
  avg_return DECIMAL(10,2),
  cagr DECIMAL(10,2),

  -- Risk metrics
  sharpe_ratio DECIMAL(10,4),
  sortino_ratio DECIMAL(10,4),
  max_drawdown DECIMAL(10,4),
  max_drawdown_date DATE,

  -- Execution quality
  avg_slippage_pct DECIMAL(10,4),
  liquidity_failure_rate DECIMAL(10,4),

  -- Full metrics JSON
  metrics_json JSONB,

  -- Audit
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (strategy_id, version) REFERENCES strategies(strategy_id, version)
);

CREATE INDEX idx_performance_strategy ON strategy_performance(strategy_id, version);
CREATE INDEX idx_performance_type ON strategy_performance(performance_type);
CREATE INDEX idx_performance_date ON strategy_performance(end_date DESC);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get latest version of a strategy
CREATE OR REPLACE FUNCTION get_latest_strategy_version(p_strategy_id VARCHAR)
RETURNS TABLE (
  strategy_id VARCHAR,
  version INTEGER,
  name VARCHAR,
  strategy_json JSONB,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.strategy_id, s.version, s.name, s.strategy_json, s.updated_at
  FROM strategies s
  WHERE s.strategy_id = p_strategy_id
    AND s.active = true
  ORDER BY s.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get all versions of a strategy
CREATE OR REPLACE FUNCTION get_strategy_versions(p_strategy_id VARCHAR)
RETURNS TABLE (
  version INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by VARCHAR,
  changes_summary TEXT,
  strategy_json JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.version, s.updated_at, s.updated_by, s.changes_summary, s.strategy_json
  FROM strategies s
  WHERE s.strategy_id = p_strategy_id
  ORDER BY s.version DESC;
END;
$$ LANGUAGE plpgsql;

-- Increment strategy version
CREATE OR REPLACE FUNCTION increment_strategy_version(
  p_strategy_id VARCHAR,
  p_user_id VARCHAR,
  p_name VARCHAR,
  p_goal TEXT,
  p_strategy_json JSONB,
  p_changes_summary TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_new_version INTEGER;
  v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current max version
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_new_version
  FROM strategies
  WHERE strategy_id = p_strategy_id;

  -- Get original created_at if updating
  SELECT created_at INTO v_created_at
  FROM strategies
  WHERE strategy_id = p_strategy_id
  ORDER BY version ASC
  LIMIT 1;

  -- If new strategy, use current timestamp
  IF v_created_at IS NULL THEN
    v_created_at := CURRENT_TIMESTAMP;
  END IF;

  -- Insert new version
  INSERT INTO strategies (
    strategy_id,
    version,
    user_id,
    name,
    goal,
    strategy_json,
    created_at,
    updated_at,
    updated_by,
    changes_summary,
    active
  ) VALUES (
    p_strategy_id,
    v_new_version,
    p_user_id,
    p_name,
    p_goal,
    p_strategy_json,
    v_created_at,
    CURRENT_TIMESTAMP,
    p_user_id,
    p_changes_summary,
    true
  );

  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Seed Data (Strategy Templates)
-- ============================================================================

INSERT INTO strategy_templates (template_id, name, description, category, difficulty, template_json, display_order, visible)
VALUES
  (
    'collar_template',
    'Protective Collar',
    'Buy stock, buy protective put, sell covered call for income',
    'collar',
    'beginner',
    '{"template": "collar"}'::jsonb,
    1,
    true
  ),
  (
    'put_spread_template',
    'Put Credit Spread',
    'Sell higher strike put, buy lower strike put for defined risk',
    'spread',
    'beginner',
    '{"template": "put_credit_spread"}'::jsonb,
    2,
    true
  ),
  (
    'call_spread_template',
    'Call Credit Spread',
    'Sell lower strike call, buy higher strike call for defined risk',
    'spread',
    'beginner',
    '{"template": "call_credit_spread"}'::jsonb,
    3,
    true
  ),
  (
    'iron_condor_template',
    'Iron Condor',
    'Sell OTM put spread + sell OTM call spread for range-bound profit',
    'condor',
    'intermediate',
    '{"template": "iron_condor"}'::jsonb,
    4,
    true
  ),
  (
    'csp_template',
    'Cash-Secured Put',
    'Sell put with cash collateral to potentially acquire stock',
    'wheel',
    'beginner',
    '{"template": "csp"}'::jsonb,
    5,
    true
  ),
  (
    'covered_call_template',
    'Covered Call',
    'Own stock, sell call for income',
    'wheel',
    'beginner',
    '{"template": "covered_call"}'::jsonb,
    6,
    true
  )
ON CONFLICT (template_id) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE strategies IS 'User-defined trading strategies with version management';
COMMENT ON TABLE strategy_templates IS 'Pre-built strategy templates for users to start from';
COMMENT ON TABLE strategy_performance IS 'Backtest and live performance metrics for strategies';

COMMENT ON COLUMN strategies.strategy_id IS 'Unique identifier for the strategy across all versions';
COMMENT ON COLUMN strategies.version IS 'Version number, increments with each update';
COMMENT ON COLUMN strategies.strategy_json IS 'Full Strategy DSL JSON document';
COMMENT ON COLUMN strategies.active IS 'Whether this version is active (soft delete)';

COMMENT ON FUNCTION get_latest_strategy_version IS 'Retrieve the most recent active version of a strategy';
COMMENT ON FUNCTION get_strategy_versions IS 'Get all versions of a strategy in descending order';
COMMENT ON FUNCTION increment_strategy_version IS 'Create a new version of an existing strategy';
