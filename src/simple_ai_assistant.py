"""
Simple AI Trading Assistant - Basic Implementation
"""
import json
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class SimpleAIAssistant:
    def __init__(self):
        self.responses = {
            "positions": "You currently have 1 AAPL share and 3 SPY shares in your paper trading account.",
            "performance": "Today's performance: +$127.50 (+0.13%). Your paper trading account is up 2.51% this quarter.",
            "spy": "SPY is trading in a bullish trend. The 20-day moving average is above the 50-day MA, indicating upward momentum.",
            "sentiment": "Market sentiment is cautiously optimistic. VIX is at moderate levels, suggesting balanced risk appetite.",
            "trades": "Recent trades: Bought 1 SPY at $661.31 (Sep 26), Bought 1 AAPL at $253.17 (earlier this week).",
            "strategy": "Currently using a simple moving average crossover strategy. Buy when 20-day MA crosses above 50-day MA."
        }
    
    async def process_query(self, user_input):
        """Process user questions with simple keyword matching"""
        user_input = user_input.lower()
        
        # Simple keyword matching
        if any(word in user_input for word in ["position", "holding", "stocks", "shares"]):
            return self.responses["positions"]
        elif any(word in user_input for word in ["performance", "today", "profit", "loss", "p&l", "pnl"]):
            return self.responses["performance"]
        elif "spy" in user_input:
            return self.responses["spy"]
        elif any(word in user_input for word in ["sentiment", "market", "mood"]):
            return self.responses["sentiment"]
        elif any(word in user_input for word in ["trade", "order", "recent", "history"]):
            return self.responses["trades"]
        elif any(word in user_input for word in ["strategy", "algorithm", "approach"]):
            return self.responses["strategy"]
        elif any(word in user_input for word in ["help", "what", "how"]):
            return """I can help you with:
            📊 Current positions and portfolio
            📈 Trading performance and P&L
            🔍 Stock analysis (SPY, AAPL, etc.)
            💭 Market sentiment
            📝 Recent trades and history
            🎯 Current trading strategy
            
            Just ask me anything about your trading!"""
        else:
            return f"I understand you're asking about: '{user_input}'. I'm a simple assistant focused on trading questions. Try asking about your positions, performance, or trading strategy!"

    def get_current_positions(self):
        """Get current trading positions"""
        return {
            "AAPL": {"shares": 1, "price": 253.17, "value": 256.32},
            "SPY": {"shares": 3, "price": 660.31, "value": 1985.85}
        }
    
    def get_market_status(self):
        """Get current market status"""
        return {
            "is_open": True,
            "session": "Regular Hours",
            "next_close": "4:00 PM ET"
        }
    
    def get_recent_trades(self):
        """Get recent trading activity"""
        return [
            {"symbol": "SPY", "action": "BUY", "shares": 1, "price": 661.31, "date": "2025-09-26"},
            {"symbol": "AAPL", "action": "BUY", "shares": 1, "price": 253.17, "date": "2025-09-24"}
        ]

# Test the assistant
if __name__ == "__main__":
    assistant = SimpleAIAssistant()
    
    test_queries = [
        "What are my current positions?",
        "How is my performance today?",
        "Analyze SPY for me",
        "What's the market sentiment?",
        "Show me recent trades",
        "Explain the current strategy"
    ]
    
    print("Testing AI Assistant:")
    print("=" * 50)
    
    for query in test_queries:
        print(f"Q: {query}")
        # Use asyncio to test async method
        import asyncio
        response = asyncio.run(assistant.process_query(query))
        print(f"A: {response}")
        print()
