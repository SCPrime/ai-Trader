import os
import json
from typing import Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv
import asyncio

load_dotenv()

class UnifiedTradingAI:
    """
    Central AI engine that powers all interfaces:
    - FastAPI dashboard chat
    - Streamlit interface
    - API endpoints
    """

    def __init__(self):
        self.setup_ai_providers()
        self.conversation_history = []
        self.trading_context = {}

    def setup_ai_providers(self):
        """Setup multiple AI providers for fallback"""
        self.providers = {}

        # Claude API
        if os.getenv("ANTHROPIC_API_KEY"):
            from anthropic import Anthropic
            self.providers['claude'] = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        # OpenAI API
        if os.getenv("OPENAI_API_KEY"):
            from openai import OpenAI
            self.providers['openai'] = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # Local fallback
        self.providers['local'] = self.local_ai_response

    async def process_query(self,
                           query: str,
                           context: Dict = None,
                           interface: str = "dashboard") -> Dict:
        """
        Process queries from any interface
        Returns structured response with text, charts, and actions
        """

        # Update context
        self.trading_context = context or self.get_current_context()

        # Determine query type
        query_type = self.classify_query(query)

        # Get AI response based on available providers
        response = await self.get_ai_response(query, query_type)

        # Add to history
        self.conversation_history.append({
            "timestamp": datetime.now(),
            "query": query,
            "response": response,
            "interface": interface
        })

        return response

    def classify_query(self, query: str) -> str:
        """Classify the type of query for better routing"""
        query_lower = query.lower()

        if any(word in query_lower for word in ['position', 'portfolio', 'holding']):
            return 'portfolio'
        elif any(word in query_lower for word in ['performance', 'profit', 'loss', 'pnl']):
            return 'performance'
        elif any(word in query_lower for word in ['strategy', 'signal', 'indicator']):
            return 'strategy'
        elif any(word in query_lower for word in ['market', 'spy', 'qqq', 'stock']):
            return 'market'
        elif any(word in query_lower for word in ['risk', 'stop', 'limit']):
            return 'risk'
        else:
            return 'general'

    async def get_ai_response(self, query: str, query_type: str) -> Dict:
        """Get response from best available AI provider"""

        # Try Claude first
        if 'claude' in self.providers:
            try:
                return await self.claude_response(query, query_type)
            except Exception as e:
                print(f"Claude error: {e}")

        # Fallback to OpenAI
        if 'openai' in self.providers:
            try:
                return await self.openai_response(query, query_type)
            except Exception as e:
                print(f"OpenAI error: {e}")

        # Fallback to local
        return await self.local_ai_response(query, query_type)

    async def claude_response(self, query: str, query_type: str) -> Dict:
        """Get response from Claude"""
        client = self.providers['claude']

        system_prompt = f"""
        You are an AI trading assistant helping with paper trading.
        Current context: {json.dumps(self.trading_context, indent=2)}
        Query type: {query_type}

        Provide helpful, accurate trading insights.
        Always remind users this is paper trading when discussing risk.
        Format responses with clear sections when appropriate.
        """

        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": query}]
        )

        return {
            "text": response.content[0].text,
            "type": query_type,
            "provider": "claude",
            "suggestions": self.extract_suggestions(response.content[0].text),
            "charts": self.determine_charts_needed(query_type)
        }

    async def openai_response(self, query: str, query_type: str) -> Dict:
        """Get response from OpenAI"""
        client = self.providers['openai']

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": f"You are a trading assistant. Context: {self.trading_context}"},
                {"role": "user", "content": query}
            ]
        )

        return {
            "text": response.choices[0].message.content,
            "type": query_type,
            "provider": "openai",
            "suggestions": [],
            "charts": self.determine_charts_needed(query_type)
        }

    async def local_ai_response(self, query: str, query_type: str) -> Dict:
        """Local response without external AI"""

        responses = {
            'portfolio': self.get_portfolio_summary(),
            'performance': self.get_performance_summary(),
            'strategy': self.get_strategy_summary(),
            'market': self.get_market_summary(),
            'risk': self.get_risk_summary(),
            'general': "I can help you with portfolio analysis, performance metrics, strategy insights, and risk management. What would you like to know?"
        }

        return {
            "text": responses.get(query_type, responses['general']),
            "type": query_type,
            "provider": "local",
            "suggestions": self.get_suggestions(query_type),
            "charts": self.determine_charts_needed(query_type)
        }

    def get_portfolio_summary(self) -> str:
        """Generate portfolio summary"""
        positions = self.trading_context.get('positions', [])
        if not positions:
            return "No open positions currently. Your paper trading account is ready to execute trades based on your configured strategies."

        summary = "Current Portfolio:\n"
        for pos in positions:
            summary += f"- {pos['symbol']}: {pos['quantity']} shares @ ${pos['avg_price']}\n"

        return summary

    def get_performance_summary(self) -> str:
        """Generate performance summary"""
        context = self.trading_context
        return f"""
Performance Summary (Paper Trading):
- Account Value: ${context.get('account_value', 100000):,.2f}
- Daily P/L: ${context.get('daily_pnl', 0):+,.2f}
- Win Rate: {context.get('win_rate', 0):.1f}%
- Total Trades Today: {context.get('trades_today', 0)}
        """

    def get_strategy_summary(self) -> str:
        """Generate strategy summary"""
        return """
Active Strategies:
- RSI Strategy: Buy when RSI < 30, Sell when RSI > 70
- MACD Strategy: Trade on MACD crossovers
- Risk Management: 2% stop loss on all positions
- Position Sizing: Max $10,000 per trade
All strategies running in paper trading mode.
        """

    def get_market_summary(self) -> str:
        """Generate market summary"""
        return "Market analysis would require real-time data connection. Currently monitoring SPY for trading signals."

    def get_risk_summary(self) -> str:
        """Generate risk summary"""
        return """
Risk Management Settings:
- Stop Loss: 2% per position
- Daily Loss Limit: $1000
- Max Position Size: $10,000
- Max Open Positions: 5
Paper trading mode - no real money at risk.
        """

    def get_suggestions(self, query_type: str) -> List[str]:
        """Get follow-up suggestions based on query type"""
        suggestions_map = {
            'portfolio': [
                "Show detailed P/L breakdown",
                "Analyze position correlations",
                "Suggest rebalancing"
            ],
            'performance': [
                "Compare with SPY benchmark",
                "Show weekly performance",
                "Analyze best/worst trades"
            ],
            'strategy': [
                "Backtest current strategy",
                "Optimize parameters",
                "Compare strategy performance"
            ]
        }
        return suggestions_map.get(query_type, ["Tell me more about your trading goals"])

    def determine_charts_needed(self, query_type: str) -> List[Dict]:
        """Determine what charts would be helpful"""
        charts_map = {
            'portfolio': [{"type": "pie", "data": "positions"}],
            'performance': [{"type": "line", "data": "pnl_history"}],
            'strategy': [{"type": "candlestick", "data": "price_action"}],
            'market': [{"type": "heatmap", "data": "market_sectors"}]
        }
        return charts_map.get(query_type, [])

    def get_current_context(self) -> Dict:
        """Get current trading context from your existing system"""
        # This would connect to your actual trading bot
        return {
            "account_value": 100000,
            "daily_pnl": 127.50,
            "positions": [],
            "win_rate": 67,
            "trades_today": 12,
            "mode": "paper_trading"
        }

    def extract_suggestions(self, text: str) -> List[str]:
        """Extract actionable suggestions from AI response"""
        # Simple extraction - could be enhanced
        suggestions = []
        if "suggest" in text.lower() or "recommend" in text.lower():
            lines = text.split('\n')
            for line in lines:
                if any(word in line.lower() for word in ['suggest', 'recommend', 'consider']):
                    suggestions.append(line.strip())
        return suggestions[:3]  # Limit to 3 suggestions

# Create singleton instance
ai_engine = UnifiedTradingAI()