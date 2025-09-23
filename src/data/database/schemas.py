"""
Database schema definitions and migrations.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    Index,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()


class Account(Base):
    """Account information table."""

    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True)
    account_number = Column(String(50), unique=True, nullable=False)
    account_type = Column(String(20), nullable=False)  # paper/live
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    trades = relationship("Trade", back_populates="account")
    positions = relationship("Position", back_populates="account")


class Strategy(Base):
    """Trading strategy definitions."""

    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    parameters = Column(Text)  # JSON string of strategy parameters
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    trades = relationship("Trade", back_populates="strategy")


class Symbol(Base):
    """Symbol master table."""

    __tablename__ = "symbols"

    id = Column(Integer, primary_key=True)
    symbol = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(200))
    exchange = Column(String(10))
    asset_class = Column(String(20))
    sector = Column(String(50))
    industry = Column(String(100))
    market_cap = Column(Float)
    is_tradable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    trades = relationship("Trade", back_populates="symbol_ref")
    positions = relationship("Position", back_populates="symbol_ref")
    market_data = relationship("MarketData", back_populates="symbol_ref")


class Trade(Base):
    """Enhanced trade records table."""

    __tablename__ = "trades"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Foreign keys
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    symbol_id = Column(Integer, ForeignKey("symbols.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)

    # Trade details
    side = Column(String(10), nullable=False)  # buy/sell/short/cover
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    commission = Column(Float, default=0.0)

    # Order information
    order_id = Column(String(50), nullable=True, index=True)
    order_type = Column(String(20))  # market/limit/stop/stop_limit
    time_in_force = Column(String(10))  # day/gtc/ioc/fok

    # Signal information
    signal_strength = Column(String(20))  # STRONG_BUY/BUY/NEUTRAL/SELL/STRONG_SELL
    confidence = Column(Float)
    entry_reason = Column(Text)

    # P&L calculation
    realized_pnl = Column(Float)
    fees = Column(Float, default=0.0)

    # Position tracking
    position_id = Column(String(50))  # Link related trades
    is_opening = Column(Boolean, default=True)  # Opening or closing position

    # Metadata
    metadata = Column(Text)  # JSON string for additional data
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    account = relationship("Account", back_populates="trades")
    symbol_ref = relationship("Symbol", back_populates="trades")
    strategy = relationship("Strategy", back_populates="trades")

    # Indexes
    __table_args__ = (
        Index("idx_trade_timestamp", "timestamp"),
        Index("idx_trade_symbol_timestamp", "symbol_id", "timestamp"),
        Index("idx_trade_strategy_timestamp", "strategy_id", "timestamp"),
    )


class Position(Base):
    """Position tracking table."""

    __tablename__ = "positions"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Foreign keys
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    symbol_id = Column(Integer, ForeignKey("symbols.id"), nullable=False)

    # Position details
    quantity = Column(Float, nullable=False)
    market_value = Column(Float, nullable=False)
    cost_basis = Column(Float, nullable=False)
    avg_entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)

    # P&L tracking
    unrealized_pnl = Column(Float, nullable=False)
    unrealized_pnl_percent = Column(Float, nullable=False)
    day_change = Column(Float, default=0.0)
    day_change_percent = Column(Float, default=0.0)

    # Position metadata
    position_id = Column(String(50), nullable=False, index=True)
    is_open = Column(Boolean, default=True, index=True)
    opened_at = Column(DateTime, nullable=False)
    closed_at = Column(DateTime)

    # Risk metrics
    stop_loss_price = Column(Float)
    take_profit_price = Column(Float)
    max_unrealized_pnl = Column(Float, default=0.0)
    min_unrealized_pnl = Column(Float, default=0.0)

    # Metadata
    metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    account = relationship("Account", back_populates="positions")
    symbol_ref = relationship("Symbol", back_populates="positions")

    # Indexes
    __table_args__ = (
        Index("idx_position_symbol_open", "symbol_id", "is_open"),
        Index("idx_position_timestamp", "timestamp"),
    )


class PerformanceMetrics(Base):
    """Enhanced performance metrics table."""

    __tablename__ = "performance_metrics"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD

    # Account information
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)

    # Portfolio metrics
    portfolio_value = Column(Float, nullable=False)
    cash = Column(Float, nullable=False)
    buying_power = Column(Float, nullable=False)
    equity = Column(Float, nullable=False)

    # P&L metrics
    daily_pnl = Column(Float, nullable=False)
    total_pnl = Column(Float, nullable=False)
    realized_pnl = Column(Float, default=0.0)
    unrealized_pnl = Column(Float, default=0.0)

    # Trading metrics
    trades_count = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    losing_trades = Column(Integer, default=0)
    win_rate = Column(Float)

    # Risk metrics
    max_drawdown = Column(Float)
    current_drawdown = Column(Float)
    value_at_risk = Column(Float)
    sharpe_ratio = Column(Float)
    sortino_ratio = Column(Float)
    beta = Column(Float)

    # Volume metrics
    total_volume = Column(Float, default=0.0)
    avg_position_size = Column(Float)

    # Position counts
    long_positions = Column(Integer, default=0)
    short_positions = Column(Integer, default=0)
    total_positions = Column(Integer, default=0)

    # Metadata
    metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index("idx_performance_date", "date"),
        Index("idx_performance_timestamp", "timestamp"),
    )


class MarketData(Base):
    """Market data metadata table (actual data stored in HDF5)."""

    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True)
    symbol_id = Column(Integer, ForeignKey("symbols.id"), nullable=False)
    timeframe = Column(String(10), nullable=False)  # 1min, 5min, 1hour, 1day
    data_source = Column(String(20), nullable=False)  # alpaca, polygon, etc.

    # Data range information
    first_timestamp = Column(DateTime, nullable=False)
    last_timestamp = Column(DateTime, nullable=False)
    record_count = Column(Integer, nullable=False)

    # Data quality metrics
    missing_data_points = Column(Integer, default=0)
    data_quality_score = Column(Float, default=1.0)

    # Storage information
    hdf5_path = Column(String(500))  # Path to HDF5 file
    compression_ratio = Column(Float)
    file_size_bytes = Column(Integer)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    symbol_ref = relationship("Symbol", back_populates="market_data")

    # Indexes
    __table_args__ = (
        Index("idx_market_data_symbol_timeframe", "symbol_id", "timeframe"),
        Index("idx_market_data_timestamp_range", "first_timestamp", "last_timestamp"),
    )


class Signal(Base):
    """Trading signals table."""

    __tablename__ = "signals"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Signal source
    symbol_id = Column(Integer, ForeignKey("symbols.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)

    # Signal details
    signal_type = Column(String(20), nullable=False)  # BUY/SELL/HOLD
    strength = Column(
        String(20), nullable=False
    )  # STRONG_BUY/BUY/NEUTRAL/SELL/STRONG_SELL
    confidence = Column(Float, nullable=False)
    price = Column(Float, nullable=False)

    # Signal reasoning
    reason = Column(Text)
    indicators = Column(Text)  # JSON string of indicator values

    # Execution tracking
    executed = Column(Boolean, default=False)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=True)
    execution_price = Column(Float)
    execution_delay_seconds = Column(Float)

    # Performance tracking
    signal_pnl = Column(Float)  # P&L attributed to this signal
    signal_duration_minutes = Column(Integer)

    # Metadata
    metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index("idx_signal_symbol_timestamp", "symbol_id", "timestamp"),
        Index("idx_signal_strategy_timestamp", "strategy_id", "timestamp"),
        Index("idx_signal_executed", "executed"),
    )


class SystemEvent(Base):
    """System events and error tracking."""

    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Event classification
    event_type = Column(
        String(50), nullable=False, index=True
    )  # ERROR/WARNING/INFO/TRADE/SYSTEM
    severity = Column(String(10), nullable=False)  # LOW/MEDIUM/HIGH/CRITICAL
    source = Column(String(50), nullable=False)  # Module that generated the event

    # Event details
    message = Column(Text, nullable=False)
    details = Column(Text)  # JSON string with additional details
    error_code = Column(String(20))

    # Context information
    symbol = Column(String(10))
    strategy = Column(String(50))
    order_id = Column(String(50))

    # Resolution tracking
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index("idx_system_event_type_timestamp", "event_type", "timestamp"),
        Index("idx_system_event_severity", "severity"),
        Index("idx_system_event_resolved", "resolved"),
    )


class Configuration(Base):
    """Configuration settings table."""

    __tablename__ = "configuration"

    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    value_type = Column(String(20), default="string")  # string/int/float/bool/json
    description = Column(Text)
    category = Column(String(50), index=True)  # trading/risk/notifications/etc.

    # Validation
    min_value = Column(Float)
    max_value = Column(Float)
    allowed_values = Column(Text)  # JSON array of allowed values

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_sensitive = Column(Boolean, default=False)  # For API keys, passwords, etc.


class AuditLog(Base):
    """Audit trail for all system changes."""

    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Action details
    action = Column(
        String(50), nullable=False, index=True
    )  # CREATE/UPDATE/DELETE/EXECUTE
    entity_type = Column(
        String(50), nullable=False
    )  # trade/position/configuration/etc.
    entity_id = Column(String(50))

    # Change details
    old_values = Column(Text)  # JSON string of old values
    new_values = Column(Text)  # JSON string of new values
    changes_summary = Column(Text)

    # Context
    source = Column(String(50))  # API/CLI/SCHEDULER/etc.
    user_id = Column(String(50))
    session_id = Column(String(100))

    # Metadata
    metadata = Column(Text)

    # Indexes
    __table_args__ = (
        Index("idx_audit_action_timestamp", "action", "timestamp"),
        Index("idx_audit_entity", "entity_type", "entity_id"),
    )


# Helper functions for schema operations
def get_all_tables():
    """Get list of all table classes."""
    return [
        Account,
        Strategy,
        Symbol,
        Trade,
        Position,
        PerformanceMetrics,
        MarketData,
        Signal,
        SystemEvent,
        Configuration,
        AuditLog,
    ]


def create_indexes(engine):
    """Create additional indexes for performance."""
    from sqlalchemy import text

    additional_indexes = [
        # Performance optimization indexes
        "CREATE INDEX IF NOT EXISTS idx_trades_symbol_timestamp ON trades(symbol_id, timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_trades_pnl ON trades(realized_pnl) WHERE realized_pnl IS NOT NULL;",
        "CREATE INDEX IF NOT EXISTS idx_positions_open_timestamp ON positions(is_open, timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_performance_metrics_date_desc ON performance_metrics(date DESC);",
        "CREATE INDEX IF NOT EXISTS idx_signals_confidence ON signals(confidence DESC);",
        "CREATE INDEX IF NOT EXISTS idx_system_events_unresolved ON system_events(resolved, severity, timestamp DESC);",
        # Composite indexes for common queries
        "CREATE INDEX IF NOT EXISTS idx_trades_symbol_strategy_timestamp ON trades(symbol_id, strategy_id, timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_positions_symbol_open ON positions(symbol_id, is_open, timestamp DESC);",
    ]

    with engine.connect() as conn:
        for index_sql in additional_indexes:
            try:
                conn.execute(text(index_sql))
                conn.commit()
            except Exception as e:
                print(f"Warning: Could not create index: {e}")


def get_table_stats(engine):
    """Get statistics about table sizes and record counts."""
    from sqlalchemy import text

    stats = {}
    tables = [cls.__tablename__ for cls in get_all_tables()]

    with engine.connect() as conn:
        for table in tables:
            try:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).fetchone()
                stats[table] = result[0] if result else 0
            except Exception as e:
                stats[table] = f"Error: {e}"

    return stats
