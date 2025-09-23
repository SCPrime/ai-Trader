"""
Natural language strategy processing for AI trading bot.
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class NaturalLanguageStrategy:
    """Natural language trading strategy definition."""

    name: str
    description: str
    natural_language_rules: str
    structured_rules: Dict[str, Any]
    entry_conditions: List[str]
    exit_conditions: List[str]
    risk_parameters: Dict[str, float]
    ai_interpretation: str
    created_at: datetime
    updated_at: datetime
    active: bool = True
    success_rate: float = 0.0
    total_trades: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert strategy to dictionary for JSON serialization."""
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "NaturalLanguageStrategy":
        """Create strategy from dictionary."""
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        return cls(**data)


class StrategyManager:
    """Manages natural language trading strategies."""

    def __init__(self, strategies_dir: str = "strategies"):
        """
        Initialize strategy manager.

        Args:
            strategies_dir: Directory to store strategy files
        """
        self.strategies_dir = Path(strategies_dir)
        self.strategies_dir.mkdir(exist_ok=True)
        self.strategies: Dict[str, NaturalLanguageStrategy] = {}
        self.load_strategies()

    def create_strategy_from_natural_language(
        self, name: str, description: str, natural_language_rules: str, ai_agent=None
    ) -> NaturalLanguageStrategy:
        """
        Create a trading strategy from natural language description.

        Args:
            name: Strategy name
            description: Brief description
            natural_language_rules: Natural language strategy description
            ai_agent: AI agent for interpretation

        Returns:
            Created strategy
        """
        # Parse natural language into structured rules
        structured_rules = self._parse_natural_language(
            natural_language_rules, ai_agent
        )

        # Extract entry and exit conditions
        entry_conditions = self._extract_entry_conditions(structured_rules)
        exit_conditions = self._extract_exit_conditions(structured_rules)

        # Extract risk parameters
        risk_parameters = self._extract_risk_parameters(structured_rules)

        # Get AI interpretation
        ai_interpretation = self._get_ai_interpretation(
            natural_language_rules, ai_agent
        )

        strategy = NaturalLanguageStrategy(
            name=name,
            description=description,
            natural_language_rules=natural_language_rules,
            structured_rules=structured_rules,
            entry_conditions=entry_conditions,
            exit_conditions=exit_conditions,
            risk_parameters=risk_parameters,
            ai_interpretation=ai_interpretation,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        self.strategies[name] = strategy
        self.save_strategy(strategy)
        return strategy

    def _parse_natural_language(self, text: str, ai_agent=None) -> Dict[str, Any]:
        """Parse natural language into structured trading rules."""
        # Default parsing without AI
        structured_rules = {
            "indicators": self._extract_indicators(text),
            "conditions": self._extract_conditions(text),
            "timeframes": self._extract_timeframes(text),
            "symbols": self._extract_symbols(text),
            "risk_management": self._extract_risk_management(text),
        }

        # Enhanced parsing with AI if available
        if ai_agent:
            try:
                # This would use the AI agent to better interpret the strategy
                ai_parsed = self._ai_parse_strategy(text, ai_agent)
                structured_rules.update(ai_parsed)
            except Exception as e:
                logger.warning(f"AI parsing failed, using basic parsing: {e}")

        return structured_rules

    def _extract_indicators(self, text: str) -> List[str]:
        """Extract technical indicators from text."""
        indicators = []
        text_lower = text.lower()

        indicator_map = {
            "rsi": ["rsi", "relative strength index"],
            "macd": ["macd", "moving average convergence divergence"],
            "sma": ["sma", "simple moving average"],
            "ema": ["ema", "exponential moving average"],
            "bollinger": ["bollinger", "bollinger bands"],
            "stochastic": ["stochastic", "stoch"],
            "williams": ["williams", "%r"],
            "adx": ["adx", "directional index"],
            "atr": ["atr", "average true range"],
            "vwap": ["vwap", "volume weighted average price"],
        }

        for indicator, keywords in indicator_map.items():
            if any(keyword in text_lower for keyword in keywords):
                indicators.append(indicator)

        return indicators

    def _extract_conditions(self, text: str) -> List[str]:
        """Extract trading conditions from text."""
        conditions = []
        text_lower = text.lower()

        # Buy conditions
        buy_keywords = ["buy when", "enter long", "go long", "purchase when"]
        for keyword in buy_keywords:
            if keyword in text_lower:
                start = text_lower.find(keyword)
                end = text_lower.find(".", start)
                if end == -1:
                    end = len(text_lower)
                condition = text[start:end].strip()
                conditions.append(f"BUY: {condition}")

        # Sell conditions
        sell_keywords = ["sell when", "exit when", "close position", "take profit"]
        for keyword in sell_keywords:
            if keyword in text_lower:
                start = text_lower.find(keyword)
                end = text_lower.find(".", start)
                if end == -1:
                    end = len(text_lower)
                condition = text[start:end].strip()
                conditions.append(f"SELL: {condition}")

        return conditions

    def _extract_timeframes(self, text: str) -> List[str]:
        """Extract timeframes from text."""
        timeframes = []
        text_lower = text.lower()

        timeframe_map = {
            "1m": ["1 minute", "1min", "1m"],
            "5m": ["5 minute", "5min", "5m"],
            "15m": ["15 minute", "15min", "15m"],
            "1h": ["1 hour", "1hr", "1h", "hourly"],
            "4h": ["4 hour", "4hr", "4h"],
            "1d": ["daily", "1 day", "1d"],
            "1w": ["weekly", "1 week", "1w"],
        }

        for timeframe, keywords in timeframe_map.items():
            if any(keyword in text_lower for keyword in keywords):
                timeframes.append(timeframe)

        return timeframes if timeframes else ["5m"]  # Default to 5 minute

    def _extract_symbols(self, text: str) -> List[str]:
        """Extract stock symbols from text."""
        import re

        # Find potential stock symbols (3-5 uppercase letters)
        symbols = re.findall(r"\b[A-Z]{2,5}\b", text)

        # Common symbols to look for specifically
        common_symbols = ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN", "SPY", "QQQ"]
        text_upper = text.upper()

        for symbol in common_symbols:
            if symbol in text_upper:
                symbols.append(symbol)

        return list(set(symbols)) if symbols else ["*"]  # * means all symbols

    def _extract_risk_management(self, text: str) -> Dict[str, float]:
        """Extract risk management parameters from text."""
        import re

        risk_params = {}

        # Extract percentages
        percentages = re.findall(r"(\d+(?:\.\d+)?)%", text)

        text_lower = text.lower()

        # Stop loss
        if "stop loss" in text_lower or "stoploss" in text_lower:
            for pct in percentages:
                risk_params["stop_loss"] = float(pct) / 100
                break

        # Take profit
        if "take profit" in text_lower or "profit target" in text_lower:
            for pct in percentages:
                if "stop_loss" not in risk_params:
                    risk_params["take_profit"] = float(pct) / 100
                elif float(pct) != risk_params["stop_loss"] * 100:
                    risk_params["take_profit"] = float(pct) / 100
                break

        # Position size
        if "position size" in text_lower or "risk per trade" in text_lower:
            for pct in percentages:
                risk_params["position_size"] = float(pct) / 100
                break

        # Set defaults if not found
        risk_params.setdefault("stop_loss", 0.02)  # 2%
        risk_params.setdefault("take_profit", 0.04)  # 4%
        risk_params.setdefault("position_size", 0.01)  # 1%

        return risk_params

    def _extract_entry_conditions(self, structured_rules: Dict[str, Any]) -> List[str]:
        """Extract entry conditions from structured rules."""
        conditions = []

        for condition in structured_rules.get("conditions", []):
            if condition.startswith("BUY:"):
                conditions.append(condition[4:].strip())

        if not conditions:
            conditions = ["Default buy condition based on selected indicators"]

        return conditions

    def _extract_exit_conditions(self, structured_rules: Dict[str, Any]) -> List[str]:
        """Extract exit conditions from structured rules."""
        conditions = []

        for condition in structured_rules.get("conditions", []):
            if condition.startswith("SELL:"):
                conditions.append(condition[5:].strip())

        if not conditions:
            conditions = ["Stop loss or take profit triggered"]

        return conditions

    def _extract_risk_parameters(
        self, structured_rules: Dict[str, Any]
    ) -> Dict[str, float]:
        """Extract risk parameters from structured rules."""
        return structured_rules.get(
            "risk_management",
            {"stop_loss": 0.02, "take_profit": 0.04, "position_size": 0.01},
        )

    def _get_ai_interpretation(self, text: str, ai_agent=None) -> str:
        """Get AI interpretation of the strategy."""
        if not ai_agent:
            return "Basic interpretation: Strategy parsed using rule-based system"

        try:
            # This would use the AI agent to provide interpretation
            interpretation = f"AI Analysis: The strategy '{text[:100]}...' focuses on "
            interpretation += "trend-following with technical indicator confirmation."
            return interpretation
        except Exception as e:
            logger.warning(f"AI interpretation failed: {e}")
            return "AI interpretation unavailable"

    def _ai_parse_strategy(self, text: str, ai_agent) -> Dict[str, Any]:
        """Use AI agent to parse strategy more intelligently."""
        # This would be implemented with actual AI agent calls
        return {
            "ai_confidence": 0.8,
            "complexity_score": "medium",
            "suggested_improvements": [
                "Consider adding volume confirmation",
                "Define clear exit strategy",
            ],
        }

    def save_strategy(self, strategy: NaturalLanguageStrategy):
        """Save strategy to file."""
        filename = f"{strategy.name.replace(' ', '_').lower()}.json"
        filepath = self.strategies_dir / filename

        try:
            with open(filepath, "w") as f:
                json.dump(strategy.to_dict(), f, indent=2)
            logger.info(f"Strategy saved: {filepath}")
        except Exception as e:
            logger.error(f"Failed to save strategy {strategy.name}: {e}")

    def load_strategies(self):
        """Load all strategies from files."""
        try:
            for filepath in self.strategies_dir.glob("*.json"):
                try:
                    with open(filepath, "r") as f:
                        data = json.load(f)

                    strategy = NaturalLanguageStrategy.from_dict(data)
                    self.strategies[strategy.name] = strategy
                    logger.info(f"Loaded strategy: {strategy.name}")

                except Exception as e:
                    logger.error(f"Failed to load strategy from {filepath}: {e}")

        except Exception as e:
            logger.error(f"Failed to load strategies: {e}")

    def get_strategy(self, name: str) -> Optional[NaturalLanguageStrategy]:
        """Get strategy by name."""
        return self.strategies.get(name)

    def list_strategies(self) -> List[NaturalLanguageStrategy]:
        """Get list of all strategies."""
        return list(self.strategies.values())

    def delete_strategy(self, name: str) -> bool:
        """Delete a strategy."""
        if name not in self.strategies:
            return False

        try:
            filename = f"{name.replace(' ', '_').lower()}.json"
            filepath = self.strategies_dir / filename
            if filepath.exists():
                filepath.unlink()

            del self.strategies[name]
            logger.info(f"Deleted strategy: {name}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete strategy {name}: {e}")
            return False

    def update_strategy_performance(self, name: str, success: bool):
        """Update strategy performance metrics."""
        strategy = self.strategies.get(name)
        if not strategy:
            return

        strategy.total_trades += 1
        if success:
            strategy.success_rate = (
                (strategy.success_rate * (strategy.total_trades - 1)) + 1
            ) / strategy.total_trades
        else:
            strategy.success_rate = (
                strategy.success_rate * (strategy.total_trades - 1)
            ) / strategy.total_trades

        strategy.updated_at = datetime.now()
        self.save_strategy(strategy)

    def get_strategy_examples(self) -> List[Dict[str, str]]:
        """Get example strategies for users."""
        return [
            {
                "name": "RSI Oversold Bounce",
                "description": "Buy when RSI is oversold and bounces back",
                "example": "Buy AAPL when RSI drops below 30 and then crosses back above 35. Take profit at 3% gain. Stop loss at 2% loss. Use 2% position size.",
            },
            {
                "name": "MACD Bullish Crossover",
                "description": "Enter long positions on MACD bullish signals",
                "example": "Buy when MACD line crosses above signal line and both are below zero. Exit when MACD crosses below signal line. 2% stop loss, 4% take profit.",
            },
            {
                "name": "Moving Average Trend Following",
                "description": "Follow trends using moving average crossovers",
                "example": "Buy when 20-day EMA crosses above 50-day EMA on daily timeframe. Hold until EMA crossover reverses. Risk 1.5% per trade.",
            },
            {
                "name": "Bollinger Band Mean Reversion",
                "description": "Buy at lower band, sell at upper band",
                "example": "Buy when price touches lower Bollinger Band and RSI is below 30. Sell when price reaches upper band or RSI above 70. 2.5% stop loss.",
            },
            {
                "name": "Volume Breakout Strategy",
                "description": "Trade breakouts confirmed by volume",
                "example": "Buy on price breakout above resistance with volume 2x above average. Take profit at 5%. Stop loss if volume drops and price falls 1.5%.",
            },
        ]
