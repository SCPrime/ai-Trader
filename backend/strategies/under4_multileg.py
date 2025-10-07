"""
Under-$4 Multileg Strategy
Scans for stocks <= $4.00 and executes Buy Call + Sell Put legs
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class Under4MultilegConfig(BaseModel):
    """Configuration for Under-$4 Multileg strategy"""

    name: str = "Under-$4 Multileg"
    universe: List[str] = ["*"]
    price_ceiling: float = 4.00
    min_last_price: float = 0.75
    min_avg_volume: int = 2_000_000
    cash_buffer_pct: float = 0.15
    max_positions: int = 8
    max_new_positions_per_day: int = 3

    class Risk(BaseModel):
        max_daily_loss_pct: float = 2.0
        max_pos_risk_pct_of_equity: float = 2.0
        max_notional_short_put_collateral_pct: float = 35.0

    class OptionsFilters(BaseModel):
        min_days_to_expiry: int = 14
        max_days_to_expiry: int = 60
        max_bid_ask_spread_pct: float = 12.0
        min_open_interest: int = 1000
        min_volume: int = 300
        min_iv_percentile: int = 50

    class BuyCall(BaseModel):
        delta_target: float = 0.60
        profit_target_pct: float = 50.0
        stop_loss_pct: float = 35.0

    class SellPut(BaseModel):
        delta_target: float = 0.20
        min_credit_pct_of_strike: float = 1.5
        profit_take_pct: float = 50.0
        defensive_buyback_widen_pct: float = 60.0
        roll_if_itm_days_to_expiry: int = 7

    class Sizing(BaseModel):
        per_trade_cash_pct: float = 4.0
        min_cash_reserve_usd: float = 500.0
        max_contracts_per_leg: int = 5

    class Notifications(BaseModel):
        morning_report_time_local: str = "08:20"
        sms_on_fills: bool = True
        sms_on_exceptions: bool = True

    risk: Risk = Field(default_factory=Risk)
    options_filters: OptionsFilters = Field(default_factory=OptionsFilters)
    buy_call: BuyCall = Field(default_factory=BuyCall)
    sell_put: SellPut = Field(default_factory=SellPut)
    sizing: Sizing = Field(default_factory=Sizing)
    notifications: Notifications = Field(default_factory=Notifications)


class Under4MultilegStrategy:
    """
    Under-$4 Multileg Strategy Implementation

    Workflow:
    1. Morning scan for stocks <= $4.00
    2. Filter by volume and liquidity
    3. Select options with strict criteria
    4. Execute Buy Call + Sell Put legs with GTC orders
    5. Manage positions with profit targets and stops
    """

    def __init__(self, config: Under4MultilegConfig):
        self.config = config

    async def morning_routine(self, alpaca_client) -> Dict:
        """
        Execute morning routine (07:45-09:45 ET)

        Returns:
            Dict with scan results and proposed trades
        """
        # A) Sync account data
        account = await self._sync_account(alpaca_client)

        # B) Build ≤$4 universe
        candidates = await self._build_universe(alpaca_client)

        # C) Options chain scan
        proposals = []
        for symbol in candidates:
            legs = await self._scan_options(symbol, alpaca_client)
            if legs:
                proposals.extend(legs)

        # D) Risk checks and sizing
        approved_trades = []
        for proposal in proposals:
            if await self._check_risk(proposal, account):
                sized_trade = await self._calculate_size(proposal, account)
                if sized_trade:
                    approved_trades.append(sized_trade)

        return {
            "account": account,
            "candidates": candidates,
            "proposals": proposals,
            "approved_trades": approved_trades[:self.config.max_new_positions_per_day]
        }

    async def _sync_account(self, client) -> Dict:
        """Pull account data and calculate risk budget"""
        account = await client.get_account()
        equity = float(account.equity)

        return {
            "equity": equity,
            "cash": float(account.cash),
            "buying_power": float(account.buying_power),
            "daily_risk_budget": equity * (self.config.risk.max_daily_loss_pct / 100)
        }

    async def _build_universe(self, client) -> List[str]:
        """
        Build universe of stocks <= $4.00

        Filters:
        - Price range: $0.75 - $4.00
        - 20-day avg volume >= 2M
        - Score by range potential
        """
        # TODO: Implement actual screener logic
        # For now, return example list
        return ["SNDL", "NOK", "SOFI", "PLUG"]

    async def _scan_options(self, symbol: str, client) -> List[Dict]:
        """
        Scan options chain for symbol

        Returns both Buy Call and Sell Put opportunities
        """
        proposals = []

        # TODO: Implement actual options chain scanning
        # This would check:
        # - DTE range (14-60)
        # - Bid-ask spread <= 12%
        # - Open interest >= 1000
        # - Volume >= 300
        # - IV percentile >= 50 for puts

        return proposals

    async def _check_risk(self, proposal: Dict, account: Dict) -> bool:
        """
        Verify trade passes risk checks

        Checks:
        - Won't exceed max positions
        - Won't exceed collateral limits
        - Won't breach cash reserves
        """
        # TODO: Implement actual risk checks
        return True

    async def _calculate_size(self, proposal: Dict, account: Dict) -> Optional[Dict]:
        """
        Calculate position size based on risk parameters

        Returns None if size would be < 1 contract
        """
        equity = account["equity"]
        cash = account["cash"]

        # Calculate usable cash
        min_reserve = self.config.sizing.min_cash_reserve_usd
        buffer = equity * (self.config.cash_buffer_pct / 100)
        usable_cash = max(0, cash - min_reserve - buffer)

        # Per-trade cap
        per_trade_cap = equity * (self.config.sizing.per_trade_cash_pct / 100)
        size_cash = min(per_trade_cap, usable_cash)

        if proposal["type"] == "BUY_CALL":
            contracts = int(size_cash / (proposal["price"] * 100))
            contracts = min(contracts, self.config.sizing.max_contracts_per_leg)

            if contracts >= 1:
                return {
                    **proposal,
                    "qty": contracts,
                    "cost": contracts * proposal["price"] * 100
                }

        elif proposal["type"] == "SELL_PUT":
            # Calculate collateral available
            max_collateral = equity * (self.config.risk.max_notional_short_put_collateral_pct / 100)
            # TODO: Subtract existing collateral in use
            contracts = int(max_collateral / (proposal["strike"] * 100))
            contracts = min(contracts, self.config.sizing.max_contracts_per_leg)

            if contracts >= 1:
                return {
                    **proposal,
                    "qty": contracts,
                    "collateral": contracts * proposal["strike"] * 100
                }

        return None

    async def execute_trades(self, trades: List[Dict], client) -> List[Dict]:
        """
        Execute approved trades with GTC orders

        For each trade:
        1. Submit entry order (Limit + GTC)
        2. On fill, submit exit order (Limit + GTC)
        """
        results = []

        for trade in trades:
            try:
                # Submit entry order
                entry_order = await self._submit_entry_order(trade, client)
                results.append({
                    "trade": trade,
                    "entry_order": entry_order,
                    "status": "submitted"
                })

            except Exception as e:
                results.append({
                    "trade": trade,
                    "error": str(e),
                    "status": "failed"
                })

        return results

    async def _submit_entry_order(self, trade: Dict, client):
        """Submit entry order to broker"""
        # TODO: Implement actual order submission
        pass

    async def manage_positions(self, client) -> Dict:
        """
        Intraday position management

        - Adjust stops on calls
        - Defensive buybacks on puts
        - Roll ITM puts if needed
        """
        # TODO: Implement position management logic
        pass


def create_under4_multileg_strategy(config_dict: Optional[Dict] = None) -> Under4MultilegStrategy:
    """
    Create Under-$4 Multileg strategy instance

    Args:
        config_dict: Optional config overrides

    Returns:
        Configured strategy instance
    """
    if config_dict:
        config = Under4MultilegConfig(**config_dict)
    else:
        config = Under4MultilegConfig()

    return Under4MultilegStrategy(config)
