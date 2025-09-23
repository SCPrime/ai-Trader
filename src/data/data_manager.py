"""
Data management system with HDF5 and SQLite storage for efficient data handling.
"""

import asyncio
import sqlite3
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import numpy as np
import h5py
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    Boolean,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
import aiosqlite
from contextlib import asynccontextmanager
import json
import threading
from concurrent.futures import ThreadPoolExecutor
import lz4.frame
import pickle

logger = logging.getLogger(__name__)

# SQLAlchemy base
Base = declarative_base()


class TradeRecord(Base):
    """Trade record model."""

    __tablename__ = "trades"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    side = Column(String(10), nullable=False)  # buy/sell
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    order_id = Column(String(50), nullable=True)
    strategy = Column(String(50), nullable=True)
    signal_strength = Column(String(20), nullable=True)
    confidence = Column(Float, nullable=True)
    pnl = Column(Float, nullable=True)
    metadata = Column(Text, nullable=True)  # JSON string


class PositionRecord(Base):
    """Position record model."""

    __tablename__ = "positions"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    market_value = Column(Float, nullable=False)
    cost_basis = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    is_open = Column(Boolean, default=True, index=True)


class PerformanceRecord(Base):
    """Performance metrics record."""

    __tablename__ = "performance"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    portfolio_value = Column(Float, nullable=False)
    cash = Column(Float, nullable=False)
    daily_pnl = Column(Float, nullable=False)
    total_pnl = Column(Float, nullable=False)
    trades_count = Column(Integer, default=0)
    win_rate = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)
    metadata = Column(Text, nullable=True)  # JSON string


class MarketDataManager:
    """
    HDF5-based market data storage for efficient time-series operations.
    """

    def __init__(self, data_dir: str = "data"):
        """
        Initialize market data manager.

        Args:
            data_dir: Directory for data files
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.hdf5_file = self.data_dir / "market_data.h5"
        self.compression_level = 9
        self.chunk_size = 10000

        # Thread pool for I/O operations
        self.executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="data_io")
        self._lock = threading.RLock()

    def _get_hdf5_key(self, symbol: str, timeframe: str = "1min") -> str:
        """Generate HDF5 key for symbol and timeframe."""
        return f"/{symbol}/{timeframe}"

    async def store_bars(
        self,
        symbol: str,
        data: pd.DataFrame,
        timeframe: str = "1min",
        compress: bool = True,
    ):
        """
        Store bar data to HDF5.

        Args:
            symbol: Stock symbol
            data: DataFrame with OHLCV data
            timeframe: Data timeframe
            compress: Enable compression
        """
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self.executor, self._store_bars_sync, symbol, data, timeframe, compress
            )
        except Exception as e:
            logger.error(f"Error storing bars for {symbol}: {e}")
            raise

    def _store_bars_sync(
        self, symbol: str, data: pd.DataFrame, timeframe: str, compress: bool
    ):
        """Synchronous bar storage."""
        with self._lock:
            try:
                key = self._get_hdf5_key(symbol, timeframe)

                # Prepare data
                if data.index.name != "timestamp":
                    if "timestamp" in data.columns:
                        data.set_index("timestamp", inplace=True)
                    else:
                        data.index.name = "timestamp"

                # Ensure required columns exist
                required_cols = ["open", "high", "low", "close", "volume"]
                for col in required_cols:
                    if col not in data.columns:
                        logger.warning(f"Missing column {col} for {symbol}")
                        data[col] = 0.0

                # Store with compression
                with pd.HDFStore(
                    str(self.hdf5_file),
                    mode="a",
                    complevel=self.compression_level if compress else None,
                    complib="blosc:lz4" if compress else None,
                ) as store:
                    # Check if data exists
                    if key in store:
                        # Append new data
                        existing_data = store[key]
                        combined_data = pd.concat([existing_data, data])
                        combined_data = combined_data[
                            ~combined_data.index.duplicated(keep="last")
                        ]
                        combined_data.sort_index(inplace=True)

                        # Store updated data
                        store.put(key, combined_data, format="table", data_columns=True)
                    else:
                        # Store new data
                        store.put(key, data, format="table", data_columns=True)

                logger.debug(f"Stored {len(data)} bars for {symbol} ({timeframe})")

            except Exception as e:
                logger.error(f"Error in sync bar storage: {e}")
                raise

    async def get_bars(
        self,
        symbol: str,
        timeframe: str = "1min",
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        limit: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Retrieve bar data from HDF5.

        Args:
            symbol: Stock symbol
            timeframe: Data timeframe
            start: Start datetime
            end: End datetime
            limit: Maximum number of records

        Returns:
            DataFrame with OHLCV data
        """
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                self.executor, self._get_bars_sync, symbol, timeframe, start, end, limit
            )
        except Exception as e:
            logger.error(f"Error retrieving bars for {symbol}: {e}")
            return pd.DataFrame()

    def _get_bars_sync(
        self,
        symbol: str,
        timeframe: str,
        start: Optional[datetime],
        end: Optional[datetime],
        limit: Optional[int],
    ) -> pd.DataFrame:
        """Synchronous bar retrieval."""
        with self._lock:
            try:
                key = self._get_hdf5_key(symbol, timeframe)

                if not self.hdf5_file.exists():
                    return pd.DataFrame()

                with pd.HDFStore(str(self.hdf5_file), mode="r") as store:
                    if key not in store:
                        return pd.DataFrame()

                    # Build query conditions
                    conditions = []
                    if start:
                        conditions.append(f"index >= '{start.isoformat()}'")
                    if end:
                        conditions.append(f"index <= '{end.isoformat()}'")

                    where_clause = " & ".join(conditions) if conditions else None

                    # Retrieve data
                    data = store.select(key, where=where_clause)

                    # Apply limit
                    if limit and len(data) > limit:
                        data = data.tail(limit)

                    return data

            except Exception as e:
                logger.error(f"Error in sync bar retrieval: {e}")
                return pd.DataFrame()

    async def store_trades(self, symbol: str, trades: List[Dict[str, Any]]):
        """
        Store trade data.

        Args:
            symbol: Stock symbol
            trades: List of trade dictionaries
        """
        if not trades:
            return

        try:
            # Convert to DataFrame
            df = pd.DataFrame(trades)
            if "timestamp" in df.columns:
                df["timestamp"] = pd.to_datetime(df["timestamp"])
                df.set_index("timestamp", inplace=True)

            # Store as compressed pickle for flexibility
            trades_file = self.data_dir / f"trades_{symbol}.pkl.lz4"

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self.executor, self._store_compressed_data, trades_file, df
            )

        except Exception as e:
            logger.error(f"Error storing trades for {symbol}: {e}")

    def _store_compressed_data(self, file_path: Path, data: Any):
        """Store compressed data using LZ4."""
        try:
            serialized_data = pickle.dumps(data)
            compressed_data = lz4.frame.compress(serialized_data)

            with open(file_path, "wb") as f:
                f.write(compressed_data)

        except Exception as e:
            logger.error(f"Error storing compressed data: {e}")
            raise

    async def get_trades(
        self,
        symbol: str,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> pd.DataFrame:
        """
        Retrieve trade data.

        Args:
            symbol: Stock symbol
            start: Start datetime
            end: End datetime

        Returns:
            DataFrame with trade data
        """
        try:
            trades_file = self.data_dir / f"trades_{symbol}.pkl.lz4"

            if not trades_file.exists():
                return pd.DataFrame()

            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(
                self.executor, self._load_compressed_data, trades_file
            )

            # Filter by date range
            if start or end:
                if start:
                    data = data[data.index >= start]
                if end:
                    data = data[data.index <= end]

            return data

        except Exception as e:
            logger.error(f"Error retrieving trades for {symbol}: {e}")
            return pd.DataFrame()

    def _load_compressed_data(self, file_path: Path) -> Any:
        """Load compressed data using LZ4."""
        try:
            with open(file_path, "rb") as f:
                compressed_data = f.read()

            decompressed_data = lz4.frame.decompress(compressed_data)
            return pickle.loads(decompressed_data)

        except Exception as e:
            logger.error(f"Error loading compressed data: {e}")
            raise

    async def get_symbols(self, timeframe: str = "1min") -> List[str]:
        """Get list of available symbols."""
        try:
            if not self.hdf5_file.exists():
                return []

            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                self.executor, self._get_symbols_sync, timeframe
            )

        except Exception as e:
            logger.error(f"Error getting symbols: {e}")
            return []

    def _get_symbols_sync(self, timeframe: str) -> List[str]:
        """Synchronous symbol listing."""
        try:
            with pd.HDFStore(str(self.hdf5_file), mode="r") as store:
                keys = store.keys()
                symbols = []

                for key in keys:
                    # Parse key format: /SYMBOL/timeframe
                    parts = key.strip("/").split("/")
                    if len(parts) == 2 and parts[1] == timeframe:
                        symbols.append(parts[0])

                return sorted(symbols)

        except Exception as e:
            logger.error(f"Error in sync symbol listing: {e}")
            return []

    async def cleanup_old_data(self, days_to_keep: int = 365):
        """
        Clean up old data beyond specified days.

        Args:
            days_to_keep: Number of days to retain
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self.executor, self._cleanup_old_data_sync, cutoff_date
            )

        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")

    def _cleanup_old_data_sync(self, cutoff_date: datetime):
        """Synchronous data cleanup."""
        try:
            if not self.hdf5_file.exists():
                return

            with pd.HDFStore(str(self.hdf5_file), mode="a") as store:
                keys_to_process = store.keys()

                for key in keys_to_process:
                    try:
                        data = store[key]
                        if hasattr(data.index, "to_pydatetime"):
                            # Filter data after cutoff date
                            filtered_data = data[data.index >= cutoff_date]

                            if len(filtered_data) < len(data):
                                store.put(
                                    key,
                                    filtered_data,
                                    format="table",
                                    data_columns=True,
                                )
                                logger.info(
                                    f"Cleaned up {len(data) - len(filtered_data)} old records from {key}"
                                )

                    except Exception as e:
                        logger.error(f"Error cleaning up key {key}: {e}")

        except Exception as e:
            logger.error(f"Error in sync data cleanup: {e}")

    def close(self):
        """Close data manager and cleanup resources."""
        try:
            self.executor.shutdown(wait=True)
            logger.info("Market data manager closed")
        except Exception as e:
            logger.error(f"Error closing market data manager: {e}")


class DatabaseManager:
    """
    SQLite database manager for trade records and metadata.
    """

    def __init__(self, db_url: str = "sqlite:///data/trading_bot.db"):
        """
        Initialize database manager.

        Args:
            db_url: Database connection URL
        """
        self.db_url = db_url
        self.engine = create_engine(db_url, echo=False, pool_pre_ping=True)
        self.SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

        # Create tables
        self._create_tables()

    def _create_tables(self):
        """Create database tables."""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created/verified")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
            raise

    @asynccontextmanager
    async def get_async_session(self):
        """Get async database session."""
        # For SQLite, we'll use thread pool execution
        loop = asyncio.get_event_loop()
        session = await loop.run_in_executor(None, self.SessionLocal)
        try:
            yield session
        finally:
            await loop.run_in_executor(None, session.close)

    async def record_trade(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        order_id: Optional[str] = None,
        strategy: Optional[str] = None,
        signal_strength: Optional[str] = None,
        confidence: Optional[float] = None,
        pnl: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        Record a trade in the database.

        Args:
            symbol: Stock symbol
            side: buy or sell
            quantity: Number of shares
            price: Trade price
            order_id: Order ID
            strategy: Strategy name
            signal_strength: Signal strength
            confidence: Confidence level
            pnl: Profit/loss
            metadata: Additional metadata
        """
        try:
            async with self.get_async_session() as session:
                trade_record = TradeRecord(
                    timestamp=datetime.now(),
                    symbol=symbol,
                    side=side,
                    quantity=quantity,
                    price=price,
                    order_id=order_id,
                    strategy=strategy,
                    signal_strength=signal_strength,
                    confidence=confidence,
                    pnl=pnl,
                    metadata=json.dumps(metadata) if metadata else None,
                )

                await asyncio.get_event_loop().run_in_executor(
                    None, self._add_and_commit, session, trade_record
                )

        except Exception as e:
            logger.error(f"Error recording trade: {e}")
            raise

    def _add_and_commit(self, session: Session, record: Any):
        """Add record and commit transaction."""
        try:
            session.add(record)
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            raise

    async def get_trades(
        self,
        symbol: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        strategy: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get trade records.

        Args:
            symbol: Filter by symbol
            start_date: Start date filter
            end_date: End date filter
            strategy: Filter by strategy
            limit: Maximum number of records

        Returns:
            List of trade dictionaries
        """
        try:
            async with self.get_async_session() as session:
                return await asyncio.get_event_loop().run_in_executor(
                    None,
                    self._get_trades_sync,
                    session,
                    symbol,
                    start_date,
                    end_date,
                    strategy,
                    limit,
                )

        except Exception as e:
            logger.error(f"Error getting trades: {e}")
            return []

    def _get_trades_sync(
        self,
        session: Session,
        symbol: Optional[str],
        start_date: Optional[datetime],
        end_date: Optional[datetime],
        strategy: Optional[str],
        limit: Optional[int],
    ) -> List[Dict[str, Any]]:
        """Synchronous trade retrieval."""
        try:
            query = session.query(TradeRecord)

            # Apply filters
            if symbol:
                query = query.filter(TradeRecord.symbol == symbol)
            if start_date:
                query = query.filter(TradeRecord.timestamp >= start_date)
            if end_date:
                query = query.filter(TradeRecord.timestamp <= end_date)
            if strategy:
                query = query.filter(TradeRecord.strategy == strategy)

            # Order by timestamp descending
            query = query.order_by(TradeRecord.timestamp.desc())

            # Apply limit
            if limit:
                query = query.limit(limit)

            # Execute query and convert to dictionaries
            trades = []
            for trade in query.all():
                trade_dict = {
                    "id": trade.id,
                    "timestamp": trade.timestamp,
                    "symbol": trade.symbol,
                    "side": trade.side,
                    "quantity": trade.quantity,
                    "price": trade.price,
                    "order_id": trade.order_id,
                    "strategy": trade.strategy,
                    "signal_strength": trade.signal_strength,
                    "confidence": trade.confidence,
                    "pnl": trade.pnl,
                    "metadata": json.loads(trade.metadata) if trade.metadata else None,
                }
                trades.append(trade_dict)

            return trades

        except Exception as e:
            logger.error(f"Error in sync trade retrieval: {e}")
            return []

    async def record_performance(
        self,
        date: str,
        portfolio_value: float,
        cash: float,
        daily_pnl: float,
        total_pnl: float,
        trades_count: int = 0,
        win_rate: Optional[float] = None,
        sharpe_ratio: Optional[float] = None,
        max_drawdown: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Record daily performance metrics."""
        try:
            async with self.get_async_session() as session:
                # Check if record exists for this date
                existing = await asyncio.get_event_loop().run_in_executor(
                    None, self._get_performance_by_date, session, date
                )

                if existing:
                    # Update existing record
                    await asyncio.get_event_loop().run_in_executor(
                        None,
                        self._update_performance,
                        session,
                        existing,
                        portfolio_value,
                        cash,
                        daily_pnl,
                        total_pnl,
                        trades_count,
                        win_rate,
                        sharpe_ratio,
                        max_drawdown,
                        metadata,
                    )
                else:
                    # Create new record
                    performance_record = PerformanceRecord(
                        timestamp=datetime.now(),
                        date=date,
                        portfolio_value=portfolio_value,
                        cash=cash,
                        daily_pnl=daily_pnl,
                        total_pnl=total_pnl,
                        trades_count=trades_count,
                        win_rate=win_rate,
                        sharpe_ratio=sharpe_ratio,
                        max_drawdown=max_drawdown,
                        metadata=json.dumps(metadata) if metadata else None,
                    )

                    await asyncio.get_event_loop().run_in_executor(
                        None, self._add_and_commit, session, performance_record
                    )

        except Exception as e:
            logger.error(f"Error recording performance: {e}")
            raise

    def _get_performance_by_date(
        self, session: Session, date: str
    ) -> Optional[PerformanceRecord]:
        """Get performance record by date."""
        return (
            session.query(PerformanceRecord)
            .filter(PerformanceRecord.date == date)
            .first()
        )

    def _update_performance(
        self,
        session: Session,
        record: PerformanceRecord,
        portfolio_value: float,
        cash: float,
        daily_pnl: float,
        total_pnl: float,
        trades_count: int,
        win_rate: Optional[float],
        sharpe_ratio: Optional[float],
        max_drawdown: Optional[float],
        metadata: Optional[Dict[str, Any]],
    ):
        """Update existing performance record."""
        try:
            record.timestamp = datetime.now()
            record.portfolio_value = portfolio_value
            record.cash = cash
            record.daily_pnl = daily_pnl
            record.total_pnl = total_pnl
            record.trades_count = trades_count
            record.win_rate = win_rate
            record.sharpe_ratio = sharpe_ratio
            record.max_drawdown = max_drawdown
            record.metadata = json.dumps(metadata) if metadata else None

            session.commit()

        except SQLAlchemyError as e:
            session.rollback()
            raise

    async def get_performance_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get performance statistics for specified period."""
        try:
            start_date = datetime.now() - timedelta(days=days)

            async with self.get_async_session() as session:
                return await asyncio.get_event_loop().run_in_executor(
                    None, self._get_performance_stats_sync, session, start_date
                )

        except Exception as e:
            logger.error(f"Error getting performance stats: {e}")
            return {}

    def _get_performance_stats_sync(
        self, session: Session, start_date: datetime
    ) -> Dict[str, Any]:
        """Synchronous performance stats calculation."""
        try:
            # Get recent performance records
            records = (
                session.query(PerformanceRecord)
                .filter(PerformanceRecord.timestamp >= start_date)
                .order_by(PerformanceRecord.timestamp.asc())
                .all()
            )

            if not records:
                return {}

            # Calculate statistics
            portfolio_values = [r.portfolio_value for r in records]
            daily_pnls = [r.daily_pnl for r in records]

            total_trades = sum(r.trades_count for r in records)

            # Calculate returns
            if len(portfolio_values) > 1:
                returns = np.diff(portfolio_values) / portfolio_values[:-1]
                volatility = np.std(returns) * np.sqrt(252)  # Annualized

                # Sharpe ratio calculation
                risk_free_rate = 0.02  # Assume 2% risk-free rate
                excess_returns = returns - (risk_free_rate / 252)
                sharpe_ratio = (
                    np.mean(excess_returns) / np.std(returns) * np.sqrt(252)
                    if np.std(returns) > 0
                    else 0
                )
            else:
                volatility = 0
                sharpe_ratio = 0

            # Win rate calculation
            winning_days = len([pnl for pnl in daily_pnls if pnl > 0])
            win_rate = winning_days / len(daily_pnls) if daily_pnls else 0

            # Max drawdown
            peak = portfolio_values[0]
            max_drawdown = 0
            for value in portfolio_values:
                if value > peak:
                    peak = value
                drawdown = (peak - value) / peak
                if drawdown > max_drawdown:
                    max_drawdown = drawdown

            return {
                "period_days": len(records),
                "total_trades": total_trades,
                "total_pnl": sum(daily_pnls),
                "win_rate": win_rate,
                "volatility": volatility,
                "sharpe_ratio": sharpe_ratio,
                "max_drawdown": max_drawdown,
                "best_day": max(daily_pnls) if daily_pnls else 0,
                "worst_day": min(daily_pnls) if daily_pnls else 0,
                "avg_daily_pnl": np.mean(daily_pnls) if daily_pnls else 0,
                "start_portfolio_value": portfolio_values[0],
                "end_portfolio_value": portfolio_values[-1],
            }

        except Exception as e:
            logger.error(f"Error in sync performance stats calculation: {e}")
            return {}

    def close(self):
        """Close database connections."""
        try:
            self.engine.dispose()
            logger.info("Database manager closed")
        except Exception as e:
            logger.error(f"Error closing database manager: {e}")


class DataManager:
    """
    Unified data management interface combining market data and database managers.
    """

    def __init__(
        self, data_dir: str = "data", db_url: str = "sqlite:///data/trading_bot.db"
    ):
        """
        Initialize unified data manager.

        Args:
            data_dir: Directory for data files
            db_url: Database connection URL
        """
        self.market_data = MarketDataManager(data_dir)
        self.database = DatabaseManager(db_url)

    async def store_real_time_data(self, symbol: str, data_type: str, data: Any):
        """Store real-time market data."""
        try:
            if data_type == "bars":
                if isinstance(data, list):
                    # Convert list of bar objects to DataFrame
                    bar_data = []
                    for bar in data:
                        bar_data.append(
                            {
                                "timestamp": bar.timestamp,
                                "open": bar.open,
                                "high": bar.high,
                                "low": bar.low,
                                "close": bar.close,
                                "volume": bar.volume,
                            }
                        )
                    df = pd.DataFrame(bar_data)
                    df.set_index("timestamp", inplace=True)
                else:
                    df = data

                await self.market_data.store_bars(symbol, df)

            elif data_type == "trades":
                await self.market_data.store_trades(symbol, data)

        except Exception as e:
            logger.error(f"Error storing real-time data: {e}")

    async def record_trade_execution(self, trade_data: Dict[str, Any]):
        """Record executed trade."""
        await self.database.record_trade(**trade_data)

    async def update_daily_performance(self, performance_data: Dict[str, Any]):
        """Update daily performance metrics."""
        await self.database.record_performance(**performance_data)

    async def get_historical_data(
        self, symbol: str, timeframe: str = "1min", days: int = 30
    ) -> pd.DataFrame:
        """Get historical market data."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        return await self.market_data.get_bars(
            symbol=symbol, timeframe=timeframe, start=start_date, end=end_date
        )

    async def get_trading_summary(self, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive trading summary."""
        try:
            # Get performance stats
            performance_stats = await self.database.get_performance_stats(days)

            # Get recent trades
            start_date = datetime.now() - timedelta(days=days)
            recent_trades = await self.database.get_trades(
                start_date=start_date, limit=100
            )

            # Get available symbols
            symbols = await self.market_data.get_symbols()

            return {
                "performance": performance_stats,
                "recent_trades_count": len(recent_trades),
                "symbols_tracked": len(symbols),
                "summary_period_days": days,
            }

        except Exception as e:
            logger.error(f"Error getting trading summary: {e}")
            return {}

    async def cleanup_old_data(self, days_to_keep: int = 365):
        """Clean up old data from both systems."""
        await self.market_data.cleanup_old_data(days_to_keep)
        # Database cleanup would be implemented here if needed

    def close(self):
        """Close all data managers."""
        self.market_data.close()
        self.database.close()
