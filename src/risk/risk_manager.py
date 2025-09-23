"""
Comprehensive risk management system with multiple safety layers.
"""

import logging
import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, date
from enum import Enum
import numpy as np
import pandas as pd
from src.utils.logger import log_risk

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """Risk level enumeration."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class RiskLimits:
    """Risk limits configuration."""

    max_position_size: float = 10000.0  # Maximum dollar value per position
    max_portfolio_risk: float = 0.02  # Maximum portfolio risk percentage (2%)
    max_daily_loss: float = 0.05  # Maximum daily loss percentage (5%)
    max_positions: int = 10  # Maximum number of open positions
    max_correlation: float = 0.7  # Maximum correlation between positions
    stop_loss_percentage: float = 0.02  # Automatic stop loss level (2%)
    take_profit_percentage: float = 0.06  # Automatic take profit level (6%)
    max_sector_exposure: float = 0.3  # Maximum exposure to single sector
    max_single_position_pct: float = 0.1  # Maximum single position as % of portfolio


@dataclass
class PositionRisk:
    """Position risk assessment."""

    symbol: str
    current_value: float
    risk_amount: float
    stop_loss_price: float
    take_profit_price: float
    risk_level: RiskLevel
    sector: Optional[str] = None
    correlation_risk: float = 0.0


@dataclass
class PortfolioRisk:
    """Portfolio-level risk metrics."""

    total_exposure: float
    value_at_risk: float  # VaR at 95% confidence
    expected_shortfall: float
    max_drawdown: float
    current_drawdown: float
    risk_level: RiskLevel
    daily_pnl: float
    positions_at_risk: List[str]


class RiskManager:
    """
    Comprehensive risk management system with multiple safety layers.
    """

    def __init__(self, risk_limits: Optional[RiskLimits] = None):
        """
        Initialize risk manager.

        Args:
            risk_limits: Risk limits configuration
        """
        self.risk_limits = risk_limits or RiskLimits()
        self.daily_trades: Dict[date, int] = {}
        self.daily_pnl: Dict[date, float] = {}
        self.position_history: Dict[str, List[Dict]] = {}
        self.emergency_stop: bool = False

        # Sector mappings (simplified - in production use external data)
        self.sector_mapping = {
            "AAPL": "Technology",
            "MSFT": "Technology",
            "GOOGL": "Technology",
            "AMZN": "Technology",
            "TSLA": "Automotive",
            "META": "Technology",
            "NVDA": "Technology",
            "NFLX": "Technology",
            "JPM": "Finance",
            "BAC": "Finance",
            "WFC": "Finance",
            "GS": "Finance",
            "JNJ": "Healthcare",
            "PFE": "Healthcare",
            "UNH": "Healthcare",
            "SPY": "ETF",
            "QQQ": "ETF",
            "IWM": "ETF",
            "VTI": "ETF",
        }

    def validate_trade(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        account_info: Dict[str, Any],
        positions: List[Dict[str, Any]],
    ) -> Tuple[bool, str, RiskLevel]:
        """
        Validate if a trade meets all risk management criteria.

        Args:
            symbol: Stock symbol
            side: 'buy' or 'sell'
            quantity: Number of shares
            price: Price per share
            account_info: Account information
            positions: Current positions

        Returns:
            Tuple of (is_valid, reason, risk_level)
        """
        try:
            if self.emergency_stop:
                return False, "Emergency stop activated", RiskLevel.CRITICAL

            portfolio_value = float(account_info.get("portfolio_value", 0))
            cash = float(account_info.get("cash", 0))
            trade_value = quantity * price

            # Check 1: Daily loss limit
            today = date.today()
            current_daily_pnl = float(account_info.get("portfolio_value", 0)) - float(
                account_info.get("last_equity", 0)
            )
            max_daily_loss = portfolio_value * self.risk_limits.max_daily_loss

            if current_daily_pnl < -max_daily_loss:
                log_risk(
                    "DAILY_LOSS_LIMIT_EXCEEDED",
                    current_value=abs(current_daily_pnl),
                    threshold=max_daily_loss,
                    action_taken="BLOCK_TRADE",
                )
                return (
                    False,
                    f"Daily loss limit exceeded: ${abs(current_daily_pnl):.2f} > ${max_daily_loss:.2f}",
                    RiskLevel.CRITICAL,
                )

            # Check 2: Position size limits
            if side.lower() == "buy":
                if trade_value > self.risk_limits.max_position_size:
                    return (
                        False,
                        f"Position size too large: ${trade_value:.2f} > ${self.risk_limits.max_position_size:.2f}",
                        RiskLevel.HIGH,
                    )

                # Check percentage of portfolio
                position_pct = trade_value / portfolio_value
                if position_pct > self.risk_limits.max_single_position_pct:
                    return (
                        False,
                        f"Position exceeds portfolio limit: {position_pct:.1%} > {self.risk_limits.max_single_position_pct:.1%}",
                        RiskLevel.HIGH,
                    )

            # Check 3: Maximum positions
            if (
                side.lower() == "buy"
                and len(positions) >= self.risk_limits.max_positions
            ):
                # Check if we already have a position in this symbol
                existing_position = next(
                    (p for p in positions if p["symbol"] == symbol), None
                )
                if not existing_position:
                    return (
                        False,
                        f"Maximum positions reached: {len(positions)} >= {self.risk_limits.max_positions}",
                        RiskLevel.MEDIUM,
                    )

            # Check 4: Available cash for buy orders
            if side.lower() == "buy" and trade_value > cash:
                return (
                    False,
                    f"Insufficient cash: ${trade_value:.2f} > ${cash:.2f}",
                    RiskLevel.MEDIUM,
                )

            # Check 5: Sector concentration
            if side.lower() == "buy":
                sector_risk = self._check_sector_concentration(
                    symbol, trade_value, positions, portfolio_value
                )
                if not sector_risk[0]:
                    return False, sector_risk[1], RiskLevel.MEDIUM

            # Check 6: Correlation risk
            if side.lower() == "buy" and len(positions) > 1:
                correlation_risk = self._check_correlation_risk(symbol, positions)
                if correlation_risk > self.risk_limits.max_correlation:
                    return (
                        False,
                        f"High correlation risk: {correlation_risk:.2f} > {self.risk_limits.max_correlation:.2f}",
                        RiskLevel.MEDIUM,
                    )

            # Determine overall risk level
            risk_level = self._calculate_trade_risk_level(
                trade_value, portfolio_value, positions
            )

            return True, "Trade approved", risk_level

        except Exception as e:
            logger.error(f"Error validating trade: {e}")
            return False, f"Risk validation error: {str(e)}", RiskLevel.CRITICAL

    def calculate_position_size(
        self,
        symbol: str,
        entry_price: float,
        stop_loss_price: float,
        account_info: Dict[str, Any],
        confidence: float = 1.0,
    ) -> Tuple[int, float]:
        """
        Calculate optimal position size using Kelly Criterion and risk management rules.

        Args:
            symbol: Stock symbol
            entry_price: Entry price
            stop_loss_price: Stop loss price
            account_info: Account information
            confidence: Signal confidence (0.0 to 1.0)

        Returns:
            Tuple of (shares, dollar_amount)
        """
        try:
            portfolio_value = float(account_info.get("portfolio_value", 0))

            # Calculate risk per share
            risk_per_share = abs(entry_price - stop_loss_price)

            # Maximum risk amount (percentage of portfolio)
            max_risk_amount = portfolio_value * self.risk_limits.max_portfolio_risk

            # Calculate base position size
            base_shares = max_risk_amount / risk_per_share if risk_per_share > 0 else 0

            # Apply confidence adjustment
            adjusted_shares = int(base_shares * confidence)

            # Apply maximum position size limit
            max_shares_by_value = int(self.risk_limits.max_position_size / entry_price)
            final_shares = min(adjusted_shares, max_shares_by_value)

            # Apply maximum percentage of portfolio limit
            max_shares_by_pct = int(
                (portfolio_value * self.risk_limits.max_single_position_pct)
                / entry_price
            )
            final_shares = min(final_shares, max_shares_by_pct)

            dollar_amount = final_shares * entry_price

            logger.info(
                f"Position sizing for {symbol}: {final_shares} shares (${dollar_amount:.2f}) "
                f"Risk per share: ${risk_per_share:.2f}, Confidence: {confidence:.2f}"
            )

            return max(1, final_shares), dollar_amount

        except Exception as e:
            logger.error(f"Error calculating position size: {e}")
            return 1, entry_price

    def assess_position_risk(self, position: Dict[str, Any]) -> PositionRisk:
        """
        Assess risk for a single position.

        Args:
            position: Position information

        Returns:
            Position risk assessment
        """
        try:
            symbol = position["symbol"]
            current_price = float(position["current_price"])
            market_value = float(position["market_value"])
            unrealized_pl = float(position["unrealized_pl"])

            # Calculate stop loss and take profit prices
            if float(position["qty"]) > 0:  # Long position
                stop_loss_price = current_price * (
                    1 - self.risk_limits.stop_loss_percentage
                )
                take_profit_price = current_price * (
                    1 + self.risk_limits.take_profit_percentage
                )
            else:  # Short position
                stop_loss_price = current_price * (
                    1 + self.risk_limits.stop_loss_percentage
                )
                take_profit_price = current_price * (
                    1 - self.risk_limits.take_profit_percentage
                )

            # Calculate risk amount
            risk_amount = abs(market_value * self.risk_limits.stop_loss_percentage)

            # Determine risk level
            risk_level = RiskLevel.LOW
            unrealized_pct = (
                unrealized_pl / abs(market_value) if market_value != 0 else 0
            )

            if unrealized_pct < -0.10:  # More than 10% loss
                risk_level = RiskLevel.CRITICAL
            elif unrealized_pct < -0.05:  # More than 5% loss
                risk_level = RiskLevel.HIGH
            elif unrealized_pct < -0.02:  # More than 2% loss
                risk_level = RiskLevel.MEDIUM

            return PositionRisk(
                symbol=symbol,
                current_value=market_value,
                risk_amount=risk_amount,
                stop_loss_price=stop_loss_price,
                take_profit_price=take_profit_price,
                risk_level=risk_level,
                sector=self.sector_mapping.get(symbol),
                correlation_risk=0.0,  # Would need historical data to calculate
            )

        except Exception as e:
            logger.error(f"Error assessing position risk for {symbol}: {e}")
            return PositionRisk(
                symbol=position["symbol"],
                current_value=0.0,
                risk_amount=0.0,
                stop_loss_price=0.0,
                take_profit_price=0.0,
                risk_level=RiskLevel.CRITICAL,
            )

    def assess_portfolio_risk(
        self, account_info: Dict[str, Any], positions: List[Dict[str, Any]]
    ) -> PortfolioRisk:
        """
        Assess overall portfolio risk.

        Args:
            account_info: Account information
            positions: Current positions

        Returns:
            Portfolio risk assessment
        """
        try:
            portfolio_value = float(account_info.get("portfolio_value", 0))
            last_equity = float(account_info.get("last_equity", portfolio_value))

            # Calculate total exposure
            total_exposure = sum(abs(float(pos["market_value"])) for pos in positions)

            # Calculate daily P&L
            daily_pnl = portfolio_value - last_equity

            # Calculate Value at Risk (simplified)
            position_risks = [self.assess_position_risk(pos) for pos in positions]
            total_risk = sum(pr.risk_amount for pr in position_risks)
            var_95 = total_risk * 1.65  # 95% confidence interval

            # Expected shortfall (simplified)
            expected_shortfall = var_95 * 1.5

            # Current drawdown
            max_equity = max(portfolio_value, last_equity)  # Simplified
            current_drawdown = (
                (max_equity - portfolio_value) / max_equity if max_equity > 0 else 0
            )

            # Determine portfolio risk level
            risk_level = RiskLevel.LOW
            if current_drawdown > 0.15:  # More than 15% drawdown
                risk_level = RiskLevel.CRITICAL
            elif current_drawdown > 0.10:  # More than 10% drawdown
                risk_level = RiskLevel.HIGH
            elif current_drawdown > 0.05:  # More than 5% drawdown
                risk_level = RiskLevel.MEDIUM
            elif daily_pnl < -portfolio_value * 0.02:  # Daily loss > 2%
                risk_level = RiskLevel.MEDIUM

            # Identify positions at risk
            positions_at_risk = [
                pr.symbol
                for pr in position_risks
                if pr.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
            ]

            return PortfolioRisk(
                total_exposure=total_exposure,
                value_at_risk=var_95,
                expected_shortfall=expected_shortfall,
                max_drawdown=current_drawdown,  # Simplified
                current_drawdown=current_drawdown,
                risk_level=risk_level,
                daily_pnl=daily_pnl,
                positions_at_risk=positions_at_risk,
            )

        except Exception as e:
            logger.error(f"Error assessing portfolio risk: {e}")
            return PortfolioRisk(
                total_exposure=0.0,
                value_at_risk=0.0,
                expected_shortfall=0.0,
                max_drawdown=0.0,
                current_drawdown=0.0,
                risk_level=RiskLevel.CRITICAL,
                daily_pnl=0.0,
                positions_at_risk=[],
            )

    def should_trigger_stop_loss(self, position: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check if position should trigger stop loss.

        Args:
            position: Position information

        Returns:
            Tuple of (should_stop, reason)
        """
        try:
            current_price = float(position["current_price"])
            avg_price = (
                float(position["cost_basis"]) / float(position["qty"])
                if float(position["qty"]) != 0
                else 0
            )
            qty = float(position["qty"])

            # Calculate stop loss price
            if qty > 0:  # Long position
                stop_loss_price = avg_price * (
                    1 - self.risk_limits.stop_loss_percentage
                )
                if current_price <= stop_loss_price:
                    return (
                        True,
                        f"Stop loss triggered: ${current_price:.2f} <= ${stop_loss_price:.2f}",
                    )
            else:  # Short position
                stop_loss_price = avg_price * (
                    1 + self.risk_limits.stop_loss_percentage
                )
                if current_price >= stop_loss_price:
                    return (
                        True,
                        f"Stop loss triggered: ${current_price:.2f} >= ${stop_loss_price:.2f}",
                    )

            return False, ""

        except Exception as e:
            logger.error(f"Error checking stop loss for {position['symbol']}: {e}")
            return False, str(e)

    def should_trigger_take_profit(self, position: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check if position should trigger take profit.

        Args:
            position: Position information

        Returns:
            Tuple of (should_profit, reason)
        """
        try:
            current_price = float(position["current_price"])
            avg_price = (
                float(position["cost_basis"]) / float(position["qty"])
                if float(position["qty"]) != 0
                else 0
            )
            qty = float(position["qty"])

            # Calculate take profit price
            if qty > 0:  # Long position
                take_profit_price = avg_price * (
                    1 + self.risk_limits.take_profit_percentage
                )
                if current_price >= take_profit_price:
                    return (
                        True,
                        f"Take profit triggered: ${current_price:.2f} >= ${take_profit_price:.2f}",
                    )
            else:  # Short position
                take_profit_price = avg_price * (
                    1 - self.risk_limits.take_profit_percentage
                )
                if current_price <= take_profit_price:
                    return (
                        True,
                        f"Take profit triggered: ${current_price:.2f} <= ${take_profit_price:.2f}",
                    )

            return False, ""

        except Exception as e:
            logger.error(f"Error checking take profit for {position['symbol']}: {e}")
            return False, str(e)

    def _check_sector_concentration(
        self,
        symbol: str,
        trade_value: float,
        positions: List[Dict[str, Any]],
        portfolio_value: float,
    ) -> Tuple[bool, str]:
        """Check sector concentration risk."""
        sector = self.sector_mapping.get(symbol, "Unknown")

        # Calculate current sector exposure
        current_sector_value = sum(
            abs(float(pos["market_value"]))
            for pos in positions
            if self.sector_mapping.get(pos["symbol"]) == sector
        )

        # Add new trade value
        new_sector_value = current_sector_value + trade_value
        sector_pct = new_sector_value / portfolio_value if portfolio_value > 0 else 0

        if sector_pct > self.risk_limits.max_sector_exposure:
            return (
                False,
                f"Sector concentration too high: {sector} {sector_pct:.1%} > {self.risk_limits.max_sector_exposure:.1%}",
            )

        return True, ""

    def _check_correlation_risk(
        self, symbol: str, positions: List[Dict[str, Any]]
    ) -> float:
        """
        Check correlation risk (simplified implementation).
        In production, this would use historical price correlations.
        """
        # Simplified: assume high correlation within same sector
        symbol_sector = self.sector_mapping.get(symbol, "Unknown")

        same_sector_positions = [
            pos
            for pos in positions
            if self.sector_mapping.get(pos["symbol"]) == symbol_sector
        ]

        if len(same_sector_positions) >= 3:  # Multiple positions in same sector
            return 0.8  # High correlation
        elif len(same_sector_positions) >= 1:
            return 0.5  # Medium correlation
        else:
            return 0.2  # Low correlation

    def _calculate_trade_risk_level(
        self,
        trade_value: float,
        portfolio_value: float,
        positions: List[Dict[str, Any]],
    ) -> RiskLevel:
        """Calculate risk level for a trade."""
        if portfolio_value == 0:
            return RiskLevel.CRITICAL

        position_pct = trade_value / portfolio_value

        if position_pct > 0.08:  # More than 8% of portfolio
            return RiskLevel.HIGH
        elif position_pct > 0.05:  # More than 5% of portfolio
            return RiskLevel.MEDIUM
        elif (
            len(positions) >= self.risk_limits.max_positions * 0.8
        ):  # Near position limit
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def enable_emergency_stop(self, reason: str) -> None:
        """Enable emergency stop."""
        self.emergency_stop = True
        log_risk(
            "EMERGENCY_STOP_ACTIVATED",
            action_taken="ALL_TRADING_STOPPED",
            symbol=None,
            current_value=0,
            threshold=0,
        )
        logger.critical(f"Emergency stop activated: {reason}")

    def disable_emergency_stop(self, reason: str) -> None:
        """Disable emergency stop."""
        self.emergency_stop = False
        logger.warning(f"Emergency stop disabled: {reason}")

    def get_risk_summary(
        self, account_info: Dict[str, Any], positions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get comprehensive risk summary.

        Args:
            account_info: Account information
            positions: Current positions

        Returns:
            Risk summary dictionary
        """
        portfolio_risk = self.assess_portfolio_risk(account_info, positions)
        position_risks = [self.assess_position_risk(pos) for pos in positions]

        return {
            "emergency_stop": self.emergency_stop,
            "portfolio_risk_level": portfolio_risk.risk_level.value,
            "daily_pnl": portfolio_risk.daily_pnl,
            "current_drawdown": portfolio_risk.current_drawdown,
            "value_at_risk": portfolio_risk.value_at_risk,
            "total_exposure": portfolio_risk.total_exposure,
            "positions_at_risk": portfolio_risk.positions_at_risk,
            "position_count": len(positions),
            "max_positions": self.risk_limits.max_positions,
            "sector_concentration": self._get_sector_breakdown(positions),
            "risk_limits": {
                "max_daily_loss_pct": self.risk_limits.max_daily_loss * 100,
                "max_position_size": self.risk_limits.max_position_size,
                "stop_loss_pct": self.risk_limits.stop_loss_percentage * 100,
                "take_profit_pct": self.risk_limits.take_profit_percentage * 100,
            },
        }

    def _get_sector_breakdown(
        self, positions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Get sector breakdown of portfolio."""
        sector_values = {}
        total_value = sum(abs(float(pos["market_value"])) for pos in positions)

        for pos in positions:
            sector = self.sector_mapping.get(pos["symbol"], "Unknown")
            value = abs(float(pos["market_value"]))
            sector_values[sector] = sector_values.get(sector, 0) + value

        # Convert to percentages
        if total_value > 0:
            sector_pcts = {
                sector: (value / total_value) * 100
                for sector, value in sector_values.items()
            }
        else:
            sector_pcts = {}

        return sector_pcts
