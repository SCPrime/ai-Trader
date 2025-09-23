"""
Application state management for the trading bot.
"""

import json
import threading
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class BotState(Enum):
    """Bot state enumeration."""

    STOPPED = "STOPPED"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPING = "STOPPING"
    ERROR = "ERROR"


@dataclass
class TradingSession:
    """Trading session data."""

    session_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    trades_count: int = 0
    total_pnl: float = 0.0
    strategy: str = "unknown"
    symbols: List[str] = None
    mode: str = "paper"

    def __post_init__(self):
        if self.symbols is None:
            self.symbols = []


@dataclass
class SystemMetrics:
    """System performance metrics."""

    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    disk_usage: float = 0.0
    network_latency: float = 0.0
    api_calls_per_minute: int = 0
    last_update: datetime = None

    def __post_init__(self):
        if self.last_update is None:
            self.last_update = datetime.now()


class StateManager:
    """
    Thread-safe application state manager.
    """

    def __init__(self, state_file: str = "data/bot_state.json"):
        """
        Initialize state manager.

        Args:
            state_file: Path to state persistence file
        """
        self.state_file = Path(state_file)
        self.state_file.parent.mkdir(parents=True, exist_ok=True)

        self._lock = threading.RLock()
        self._state: Dict[str, Any] = {}
        self._current_session: Optional[TradingSession] = None
        self._bot_state: BotState = BotState.STOPPED
        self._system_metrics: SystemMetrics = SystemMetrics()

        # Load persisted state
        self._load_state()

        # Initialize default values
        self._initialize_defaults()

    def _initialize_defaults(self):
        """Initialize default state values."""
        with self._lock:
            defaults = {
                "bot_started_at": None,
                "total_runtime_seconds": 0,
                "lifetime_trades": 0,
                "lifetime_pnl": 0.0,
                "last_error": None,
                "configuration_version": "1.0.0",
                "positions": {},
                "active_orders": {},
                "daily_stats": {},
                "risk_metrics": {},
                "performance_stats": {},
            }

            for key, value in defaults.items():
                if key not in self._state:
                    self._state[key] = value

    def _load_state(self):
        """Load state from persistence file."""
        try:
            if self.state_file.exists():
                with open(self.state_file, "r") as f:
                    data = json.load(f)
                    self._state = data.get("state", {})

                    # Load current session if exists
                    session_data = data.get("current_session")
                    if session_data:
                        # Convert string datetime back to datetime object
                        if "start_time" in session_data:
                            session_data["start_time"] = datetime.fromisoformat(
                                session_data["start_time"]
                            )
                        if "end_time" in session_data and session_data["end_time"]:
                            session_data["end_time"] = datetime.fromisoformat(
                                session_data["end_time"]
                            )

                        self._current_session = TradingSession(**session_data)

                    # Load bot state
                    self._bot_state = BotState(
                        data.get("bot_state", BotState.STOPPED.value)
                    )

                logger.info("State loaded successfully")
        except Exception as e:
            logger.error(f"Error loading state: {e}")
            self._state = {}

    def _save_state(self):
        """Save state to persistence file."""
        try:
            data = {
                "state": self._state,
                "bot_state": self._bot_state.value,
                "current_session": None,
                "last_saved": datetime.now().isoformat(),
            }

            # Convert current session to dict
            if self._current_session:
                session_dict = asdict(self._current_session)
                # Convert datetime objects to ISO strings
                if session_dict["start_time"]:
                    session_dict["start_time"] = session_dict["start_time"].isoformat()
                if session_dict["end_time"]:
                    session_dict["end_time"] = session_dict["end_time"].isoformat()
                data["current_session"] = session_dict

            with open(self.state_file, "w") as f:
                json.dump(data, f, indent=2, default=str)

        except Exception as e:
            logger.error(f"Error saving state: {e}")

    def get_bot_state(self) -> BotState:
        """Get current bot state."""
        with self._lock:
            return self._bot_state

    def set_bot_state(self, state: BotState):
        """Set bot state."""
        with self._lock:
            old_state = self._bot_state
            self._bot_state = state

            logger.info(f"Bot state changed: {old_state.value} -> {state.value}")

            # Update timestamps based on state
            if state == BotState.RUNNING and old_state != BotState.RUNNING:
                self._state["bot_started_at"] = datetime.now().isoformat()

            self._save_state()

    def start_session(
        self, strategy: str, symbols: List[str], mode: str = "paper"
    ) -> str:
        """
        Start a new trading session.

        Args:
            strategy: Trading strategy name
            symbols: List of symbols to trade
            mode: Trading mode (paper/live)

        Returns:
            Session ID
        """
        with self._lock:
            # End current session if exists
            if self._current_session:
                self.end_session()

            # Create new session
            session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self._current_session = TradingSession(
                session_id=session_id,
                start_time=datetime.now(),
                strategy=strategy,
                symbols=symbols,
                mode=mode,
            )

            self.set_bot_state(BotState.RUNNING)
            logger.info(f"Started new trading session: {session_id}")
            self._save_state()

            return session_id

    def end_session(self) -> Optional[TradingSession]:
        """
        End current trading session.

        Returns:
            Ended session data or None
        """
        with self._lock:
            if not self._current_session:
                return None

            # Update session end time
            self._current_session.end_time = datetime.now()

            # Calculate session duration
            duration = (
                self._current_session.end_time - self._current_session.start_time
            ).total_seconds()
            self._state["total_runtime_seconds"] = (
                self._state.get("total_runtime_seconds", 0) + duration
            )

            # Archive session data
            today = date.today().isoformat()
            if "daily_stats" not in self._state:
                self._state["daily_stats"] = {}

            if today not in self._state["daily_stats"]:
                self._state["daily_stats"][today] = {
                    "sessions": 0,
                    "total_trades": 0,
                    "total_pnl": 0.0,
                    "runtime_seconds": 0,
                }

            daily_stats = self._state["daily_stats"][today]
            daily_stats["sessions"] += 1
            daily_stats["total_trades"] += self._current_session.trades_count
            daily_stats["total_pnl"] += self._current_session.total_pnl
            daily_stats["runtime_seconds"] += duration

            ended_session = self._current_session
            self._current_session = None

            self.set_bot_state(BotState.STOPPED)
            logger.info(f"Ended trading session: {ended_session.session_id}")
            self._save_state()

            return ended_session

    def get_current_session(self) -> Optional[TradingSession]:
        """Get current trading session."""
        with self._lock:
            return self._current_session

    def update_session_stats(self, trades_count: int = None, pnl: float = None):
        """
        Update current session statistics.

        Args:
            trades_count: Number of trades to add
            pnl: P&L amount to add
        """
        with self._lock:
            if not self._current_session:
                return

            if trades_count is not None:
                self._current_session.trades_count += trades_count
                self._state["lifetime_trades"] = (
                    self._state.get("lifetime_trades", 0) + trades_count
                )

            if pnl is not None:
                self._current_session.total_pnl += pnl
                self._state["lifetime_pnl"] = self._state.get("lifetime_pnl", 0.0) + pnl

            self._save_state()

    def set_position(self, symbol: str, position_data: Dict[str, Any]):
        """
        Set position data for a symbol.

        Args:
            symbol: Stock symbol
            position_data: Position information
        """
        with self._lock:
            if "positions" not in self._state:
                self._state["positions"] = {}

            self._state["positions"][symbol] = {
                **position_data,
                "updated_at": datetime.now().isoformat(),
            }
            self._save_state()

    def remove_position(self, symbol: str):
        """Remove position data for a symbol."""
        with self._lock:
            if "positions" in self._state and symbol in self._state["positions"]:
                del self._state["positions"][symbol]
                self._save_state()

    def get_position(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get position data for a symbol."""
        with self._lock:
            return self._state.get("positions", {}).get(symbol)

    def get_all_positions(self) -> Dict[str, Any]:
        """Get all position data."""
        with self._lock:
            return self._state.get("positions", {}).copy()

    def set_order(self, order_id: str, order_data: Dict[str, Any]):
        """
        Set active order data.

        Args:
            order_id: Order ID
            order_data: Order information
        """
        with self._lock:
            if "active_orders" not in self._state:
                self._state["active_orders"] = {}

            self._state["active_orders"][order_id] = {
                **order_data,
                "updated_at": datetime.now().isoformat(),
            }
            self._save_state()

    def remove_order(self, order_id: str):
        """Remove order data."""
        with self._lock:
            if (
                "active_orders" in self._state
                and order_id in self._state["active_orders"]
            ):
                del self._state["active_orders"][order_id]
                self._save_state()

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Get order data by ID."""
        with self._lock:
            return self._state.get("active_orders", {}).get(order_id)

    def get_all_orders(self) -> Dict[str, Any]:
        """Get all active order data."""
        with self._lock:
            return self._state.get("active_orders", {}).copy()

    def set_risk_metrics(self, metrics: Dict[str, Any]):
        """Set risk management metrics."""
        with self._lock:
            self._state["risk_metrics"] = {
                **metrics,
                "updated_at": datetime.now().isoformat(),
            }
            self._save_state()

    def get_risk_metrics(self) -> Dict[str, Any]:
        """Get current risk metrics."""
        with self._lock:
            return self._state.get("risk_metrics", {}).copy()

    def set_performance_stats(self, stats: Dict[str, Any]):
        """Set performance statistics."""
        with self._lock:
            self._state["performance_stats"] = {
                **stats,
                "updated_at": datetime.now().isoformat(),
            }
            self._save_state()

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics."""
        with self._lock:
            return self._state.get("performance_stats", {}).copy()

    def set_error(self, error_message: str, error_type: str = "ERROR"):
        """
        Record an error.

        Args:
            error_message: Error message
            error_type: Error type/category
        """
        with self._lock:
            error_data = {
                "message": error_message,
                "type": error_type,
                "timestamp": datetime.now().isoformat(),
            }

            self._state["last_error"] = error_data

            if error_type == "CRITICAL":
                self.set_bot_state(BotState.ERROR)

            self._save_state()
            logger.error(f"State error recorded: {error_type} - {error_message}")

    def get_last_error(self) -> Optional[Dict[str, Any]]:
        """Get last recorded error."""
        with self._lock:
            return self._state.get("last_error")

    def clear_error(self):
        """Clear last error."""
        with self._lock:
            self._state["last_error"] = None
            if self._bot_state == BotState.ERROR:
                self.set_bot_state(BotState.STOPPED)
            self._save_state()

    def update_system_metrics(self, metrics: SystemMetrics):
        """Update system performance metrics."""
        with self._lock:
            self._system_metrics = metrics

    def get_system_metrics(self) -> SystemMetrics:
        """Get current system metrics."""
        with self._lock:
            return self._system_metrics

    def get_daily_stats(self, date_str: Optional[str] = None) -> Dict[str, Any]:
        """
        Get daily statistics.

        Args:
            date_str: Date string (YYYY-MM-DD), defaults to today

        Returns:
            Daily statistics dictionary
        """
        with self._lock:
            if date_str is None:
                date_str = date.today().isoformat()

            return self._state.get("daily_stats", {}).get(date_str, {})

    def get_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive state summary.

        Returns:
            State summary dictionary
        """
        with self._lock:
            summary = {
                "bot_state": self._bot_state.value,
                "current_session": (
                    asdict(self._current_session) if self._current_session else None
                ),
                "lifetime_stats": {
                    "total_trades": self._state.get("lifetime_trades", 0),
                    "total_pnl": self._state.get("lifetime_pnl", 0.0),
                    "total_runtime_seconds": self._state.get(
                        "total_runtime_seconds", 0
                    ),
                },
                "today_stats": self.get_daily_stats(),
                "active_positions_count": len(self._state.get("positions", {})),
                "active_orders_count": len(self._state.get("active_orders", {})),
                "last_error": self._state.get("last_error"),
                "system_metrics": asdict(self._system_metrics),
            }

            # Convert datetime objects to strings for JSON serialization
            if summary["current_session"]:
                session = summary["current_session"]
                if session["start_time"]:
                    session["start_time"] = (
                        session["start_time"].isoformat()
                        if isinstance(session["start_time"], datetime)
                        else session["start_time"]
                    )
                if session["end_time"]:
                    session["end_time"] = (
                        session["end_time"].isoformat()
                        if isinstance(session["end_time"], datetime)
                        else session["end_time"]
                    )

            return summary

    def reset_state(self, keep_lifetime_stats: bool = True):
        """
        Reset application state.

        Args:
            keep_lifetime_stats: Whether to preserve lifetime statistics
        """
        with self._lock:
            # End current session
            if self._current_session:
                self.end_session()

            # Backup lifetime stats if requested
            lifetime_backup = {}
            if keep_lifetime_stats:
                lifetime_backup = {
                    "lifetime_trades": self._state.get("lifetime_trades", 0),
                    "lifetime_pnl": self._state.get("lifetime_pnl", 0.0),
                    "total_runtime_seconds": self._state.get(
                        "total_runtime_seconds", 0
                    ),
                }

            # Reset state
            self._state = {}
            self._bot_state = BotState.STOPPED
            self._system_metrics = SystemMetrics()

            # Restore lifetime stats if requested
            if keep_lifetime_stats:
                self._state.update(lifetime_backup)

            # Initialize defaults
            self._initialize_defaults()
            self._save_state()

            logger.info("Application state reset")


# Global state manager instance
_state_manager: Optional[StateManager] = None


def get_state_manager() -> StateManager:
    """Get global state manager instance."""
    global _state_manager
    if _state_manager is None:
        _state_manager = StateManager()
    return _state_manager


def initialize_state_manager(state_file: str = None) -> StateManager:
    """Initialize global state manager with custom settings."""
    global _state_manager
    _state_manager = StateManager(state_file) if state_file else StateManager()
    return _state_manager
