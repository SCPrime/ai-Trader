"""
Real-time stock data service using Yahoo Finance.
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class StockDataService:
    """Service for fetching real stock market data."""

    def __init__(self):
        self.cache = {}
        self.cache_expiry = {}
        self.cache_duration = 300  # 5 minutes

    def get_stock_data(
        self, symbol: str, period: str = "5d", interval: str = "30m"
    ) -> pd.DataFrame:
        """
        Get real stock data from Yahoo Finance.

        Args:
            symbol: Stock symbol (e.g., 'AAPL', 'TSLA')
            period: Data period ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max')
            interval: Data interval ('1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo')

        Returns:
            DataFrame with OHLCV data
        """
        cache_key = f"{symbol}_{period}_{interval}"

        # Check cache
        if self._is_cached(cache_key):
            logger.info(f"Using cached data for {symbol}")
            return self.cache[cache_key]

        try:
            logger.info(
                f"Fetching real data for {symbol} with period={period}, interval={interval}"
            )

            # Create yfinance ticker object
            ticker = yf.Ticker(symbol)

            # Get historical data
            data = ticker.history(period=period, interval=interval)

            if data.empty:
                logger.warning(f"No data returned for {symbol}")
                return self._get_fallback_data(symbol)

            # Clean the data
            data = data.dropna()

            # Ensure we have the required columns
            required_columns = ["Open", "High", "Low", "Close", "Volume"]
            if not all(col in data.columns for col in required_columns):
                logger.warning(f"Missing required columns for {symbol}")
                return self._get_fallback_data(symbol)

            # Rename columns to lowercase
            data.columns = data.columns.str.lower()

            # Cache the data
            self.cache[cache_key] = data
            self.cache_expiry[cache_key] = datetime.now() + timedelta(
                seconds=self.cache_duration
            )

            logger.info(f"Successfully fetched {len(data)} data points for {symbol}")
            return data

        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {e}")
            return self._get_fallback_data(symbol)

    def get_current_price(self, symbol: str) -> Dict[str, Any]:
        """
        Get current price and basic info for a stock.

        Args:
            symbol: Stock symbol

        Returns:
            Dict with current price info
        """
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            # Get fast info (current price)
            fast_info = ticker.fast_info

            return {
                "symbol": symbol,
                "current_price": fast_info.get("lastPrice", 0),
                "previous_close": fast_info.get("previousClose", 0),
                "open": fast_info.get("open", 0),
                "day_high": fast_info.get("dayHigh", 0),
                "day_low": fast_info.get("dayLow", 0),
                "volume": fast_info.get("regularMarketVolume", 0),
                "market_cap": fast_info.get("marketCap", 0),
                "fifty_two_week_high": fast_info.get("fiftyTwoWeekHigh", 0),
                "fifty_two_week_low": fast_info.get("fiftyTwoWeekLow", 0),
                "currency": fast_info.get("currency", "USD"),
                "exchange": fast_info.get("exchange", "NASDAQ"),
                "company_name": info.get("longName", symbol),
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown"),
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error fetching current price for {symbol}: {e}")
            return {
                "symbol": symbol,
                "current_price": 0,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }

    def get_multiple_quotes(self, symbols: list) -> Dict[str, Dict[str, Any]]:
        """
        Get current quotes for multiple symbols.

        Args:
            symbols: List of stock symbols

        Returns:
            Dict mapping symbols to their quote data
        """
        quotes = {}
        for symbol in symbols:
            quotes[symbol] = self.get_current_price(symbol)
        return quotes

    def search_symbols(self, query: str) -> list:
        """
        Search for stock symbols based on company name or symbol.

        Args:
            query: Search query

        Returns:
            List of matching symbols and company names
        """
        try:
            # This is a simple implementation - in production you'd want a more robust search
            # For now, we'll return some common symbols based on the query
            common_symbols = {
                "apple": [{"symbol": "AAPL", "name": "Apple Inc."}],
                "tesla": [{"symbol": "TSLA", "name": "Tesla, Inc."}],
                "microsoft": [{"symbol": "MSFT", "name": "Microsoft Corporation"}],
                "amazon": [{"symbol": "AMZN", "name": "Amazon.com, Inc."}],
                "google": [{"symbol": "GOOGL", "name": "Alphabet Inc."}],
                "meta": [{"symbol": "META", "name": "Meta Platforms, Inc."}],
                "nvidia": [{"symbol": "NVDA", "name": "NVIDIA Corporation"}],
                "spy": [{"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust"}],
                "qqq": [{"symbol": "QQQ", "name": "Invesco QQQ Trust"}],
            }

            query_lower = query.lower()

            # First try exact match or partial match
            for key, value in common_symbols.items():
                if query_lower in key or key in query_lower:
                    return value

            # If not found in common symbols, try to validate the symbol directly
            if len(query) <= 5 and query.isalpha():
                try:
                    ticker = yf.Ticker(query.upper())
                    info = ticker.info
                    if info and "longName" in info:
                        return [{"symbol": query.upper(), "name": info["longName"]}]
                except:
                    pass

            return []

        except Exception as e:
            logger.error(f"Error searching symbols for query '{query}': {e}")
            return []

    def _is_cached(self, cache_key: str) -> bool:
        """Check if data is cached and not expired."""
        if cache_key not in self.cache:
            return False

        if cache_key not in self.cache_expiry:
            return False

        return datetime.now() < self.cache_expiry[cache_key]

    def _get_fallback_data(self, symbol: str) -> pd.DataFrame:
        """Generate fallback mock data when real data is unavailable."""
        logger.info(f"Generating fallback data for {symbol}")

        # Generate realistic mock data
        dates = pd.date_range(
            start=datetime.now() - timedelta(days=5), periods=200, freq="30min"
        )
        np.random.seed(hash(symbol) % 2**32)  # Consistent data for same symbol

        base_price = {
            "AAPL": 150,
            "TSLA": 200,
            "MSFT": 300,
            "GOOGL": 2500,
            "AMZN": 3000,
            "META": 250,
            "NVDA": 400,
            "SPY": 400,
            "QQQ": 350,
        }.get(symbol.upper(), 100)

        returns = np.random.normal(0, 0.02, len(dates))
        prices = [base_price]
        for ret in returns[1:]:
            prices.append(prices[-1] * (1 + ret))

        data = pd.DataFrame(
            {
                "open": prices,
                "close": prices,
                "high": [p * (1 + abs(np.random.normal(0, 0.01))) for p in prices],
                "low": [p * (1 - abs(np.random.normal(0, 0.01))) for p in prices],
                "volume": np.random.randint(100000, 10000000, len(dates)),
            },
            index=dates,
        )

        return data


# Global instance
stock_data_service = StockDataService()
