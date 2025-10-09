"""
Tradier API Client - Production Integration
Handles: Account, Positions, Orders, Market Data, Options
"""

import os
import requests
from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class TradierClient:
    """Tradier API client for production trading"""

    def __init__(self):
        self.api_key = os.getenv("TRADIER_API_KEY")
        self.account_id = os.getenv("TRADIER_ACCOUNT_ID")
        self.base_url = os.getenv("TRADIER_API_BASE_URL", "https://api.tradier.com/v1")

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }

        if not self.api_key or not self.account_id:
            raise ValueError("TRADIER_API_KEY and TRADIER_ACCOUNT_ID must be set in .env")

        logger.info(f"Tradier client initialized for account {self.account_id}")

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make authenticated request to Tradier API"""
        url = f"{self.base_url}{endpoint}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                timeout=10,
                **kwargs
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            logger.error(f"Tradier API error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Tradier API error: {e.response.text}")

        except Exception as e:
            logger.error(f"Tradier request failed: {str(e)}")
            raise

    # ==================== ACCOUNT ====================

    def get_profile(self) -> Dict:
        """Get user profile"""
        return self._request("GET", "/user/profile")

    def get_account(self) -> Dict:
        """Get account balances"""
        result = self._request("GET", f"/accounts/{self.account_id}/balances")
        if "balances" in result:
            balances = result["balances"]
            return {
                "account_number": self.account_id,
                "cash": float(balances.get("total_cash", 0)),
                "buying_power": float(balances.get("option_buying_power", 0)),
                "portfolio_value": float(balances.get("total_equity", 0)),
                "equity": float(balances.get("total_equity", 0)),
                "long_market_value": float(balances.get("long_market_value", 0)),
                "short_market_value": float(balances.get("short_market_value", 0)),
                "status": "ACTIVE"
            }
        return result

    def get_positions(self) -> List[Dict]:
        """Get all positions"""
        response = self._request("GET", f"/accounts/{self.account_id}/positions")

        if "positions" in response and response["positions"] != "null":
            positions = response["positions"].get("position", [])

            # Normalize to list
            if isinstance(positions, dict):
                positions = [positions]

            return [self._normalize_position(p) for p in positions]

        return []

    def _normalize_position(self, pos: Dict) -> Dict:
        """Convert Tradier position to standard format"""
        quantity = float(pos.get("quantity", 0))
        cost_basis = float(pos.get("cost_basis", 0))

        return {
            "symbol": pos.get("symbol"),
            "qty": str(abs(quantity)),
            "side": "long" if quantity > 0 else "short",
            "avg_entry_price": str(cost_basis / abs(quantity) if quantity != 0 else 0),
            "market_value": pos.get("market_value"),
            "cost_basis": str(cost_basis),
            "unrealized_pl": pos.get("unrealized_pl"),
            "unrealized_plpc": pos.get("unrealized_plpc"),
            "current_price": pos.get("last"),
            "lastday_price": pos.get("prevclose"),
            "change_today": pos.get("change")
        }

    # ==================== ORDERS ====================

    def get_orders(self) -> List[Dict]:
        """Get all orders"""
        response = self._request("GET", f"/accounts/{self.account_id}/orders")

        if "orders" in response and response["orders"] != "null":
            orders = response["orders"].get("order", [])
            if isinstance(orders, dict):
                orders = [orders]
            return orders

        return []

    def place_order(self,
                   symbol: str,
                   side: str,
                   quantity: int,
                   order_type: str = "market",
                   duration: str = "day",
                   price: Optional[float] = None,
                   stop: Optional[float] = None) -> Dict:
        """
        Place an order

        Args:
            symbol: Stock symbol
            side: "buy", "sell", "buy_to_open", "sell_to_close", etc.
            quantity: Number of shares
            order_type: "market", "limit", "stop", "stop_limit"
            duration: "day", "gtc", "pre", "post"
            price: Limit price (for limit orders)
            stop: Stop price (for stop orders)
        """
        data = {
            "class": "equity",
            "symbol": symbol,
            "side": side,
            "quantity": quantity,
            "type": order_type,
            "duration": duration
        }

        if order_type in ["limit", "stop_limit"] and price:
            data["price"] = price

        if order_type in ["stop", "stop_limit"] and stop:
            data["stop"] = stop

        logger.info(f"Placing order: {data}")
        return self._request("POST", f"/accounts/{self.account_id}/orders", data=data)

    def cancel_order(self, order_id: str) -> Dict:
        """Cancel an order"""
        return self._request("DELETE", f"/accounts/{self.account_id}/orders/{order_id}")

    # ==================== MARKET DATA ====================

    def get_quotes(self, symbols: List[str]) -> Dict:
        """Get real-time quotes"""
        params = {"symbols": ",".join(symbols), "greeks": "false"}
        return self._request("GET", "/markets/quotes", params=params)

    def get_quote(self, symbol: str) -> Dict:
        """Get single quote"""
        response = self.get_quotes([symbol])
        if "quotes" in response and "quote" in response["quotes"]:
            quotes = response["quotes"]["quote"]
            return quotes if isinstance(quotes, dict) else quotes[0]
        return {}

    def get_market_clock(self) -> Dict:
        """Get market status"""
        return self._request("GET", "/markets/clock")

    def is_market_open(self) -> bool:
        """Check if market is open"""
        clock = self.get_market_clock()
        if "clock" in clock:
            return clock["clock"].get("state") == "open"
        return False

    # ==================== OPTIONS ====================

    def get_option_chains(self, symbol: str, expiration: Optional[str] = None) -> Dict:
        """Get option chains"""
        params = {"symbol": symbol, "greeks": "true"}
        if expiration:
            params["expiration"] = expiration
        return self._request("GET", "/markets/options/chains", params=params)

    def get_option_expirations(self, symbol: str) -> Dict:
        """Get option expiration dates"""
        params = {"symbol": symbol}
        return self._request("GET", "/markets/options/expirations", params=params)


# Singleton instance
_tradier_client = None

def get_tradier_client() -> TradierClient:
    """Get singleton Tradier client"""
    global _tradier_client
    if _tradier_client is None:
        _tradier_client = TradierClient()
    return _tradier_client
