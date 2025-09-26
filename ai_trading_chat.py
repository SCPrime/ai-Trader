"""
AI Trading Chat Interface with Anthropic Claude Integration
"""
import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import datetime, timedelta
import yfinance as yf
from dotenv import load_dotenv
import os
import anthropic
import json

# Load environment variables
load_dotenv()

# Configure Streamlit page
st.set_page_config(
    page_title="AI Trading Chat Assistant",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

class AITradingAssistant:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.getenv('ANTHROPIC_API_KEY')
        )

    def get_trading_context(self):
        """Get current trading context for AI"""
        try:
            # Mock data - in production, get from Alpaca API
            context = {
                "account_balance": 100007.26,
                "buying_power": 197773.15,
                "cash": 97765.89,
                "positions": {
                    "AAPL": {"shares": 1, "avg_price": 253.17, "current_price": 256.10, "pnl": 2.93},
                    "SPY": {"shares": 3, "avg_price": 660.31, "current_price": 661.95, "pnl": 4.92}
                },
                "recent_trades": [
                    {"symbol": "SPY", "action": "BUY", "shares": 1, "price": 661.31, "date": "2025-09-26"},
                    {"symbol": "AAPL", "action": "BUY", "shares": 1, "price": 253.17, "date": "2025-09-24"}
                ],
                "daily_pnl": 127.50,
                "win_rate": 72,
                "total_trades": 47,
                "strategy": "Moving Average Crossover"
            }
            return context
        except Exception as e:
            st.error(f"Error getting trading context: {e}")
            return {}

    def query_ai(self, user_message):
        """Query Claude AI with trading context"""
        try:
            context = self.get_trading_context()

            system_prompt = f"""You are an AI trading assistant helping with paper trading analysis.

Current Trading Context:
- Account Balance: ${context.get('account_balance', 0):,.2f}
- Cash Available: ${context.get('cash', 0):,.2f}
- Daily P&L: ${context.get('daily_pnl', 0):,.2f}
- Win Rate: {context.get('win_rate', 0)}%
- Current Strategy: {context.get('strategy', 'Unknown')}

Current Positions:
{json.dumps(context.get('positions', {}), indent=2)}

Recent Trades:
{json.dumps(context.get('recent_trades', []), indent=2)}

Provide helpful, concise responses about trading, portfolio analysis, and strategy.
Focus on paper trading education and risk management. Be professional but friendly."""

            message = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                temperature=0.7,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )

            return message.content[0].text

        except Exception as e:
            return f"I'm having trouble connecting to the AI service. Error: {str(e)}"

def main():
    # Initialize AI assistant
    if 'ai_assistant' not in st.session_state:
        st.session_state.ai_assistant = AITradingAssistant()

    # Header
    st.title("🤖 AI Trading Chat Assistant")
    st.markdown("---")

    # Sidebar with account info
    with st.sidebar:
        st.header("📊 Account Summary")

        context = st.session_state.ai_assistant.get_trading_context()

        col1, col2 = st.columns(2)
        with col1:
            st.metric("Portfolio", f"${context.get('account_balance', 0):,.2f}", "0.13%")
            st.metric("Daily P&L", f"${context.get('daily_pnl', 0):,.2f}", "0.13%")

        with col2:
            st.metric("Cash", f"${context.get('cash', 0):,.2f}", "-$2,234")
            st.metric("Win Rate", f"{context.get('win_rate', 0)}%", "5%")

        st.markdown("---")
        st.subheader("📈 Current Positions")

        positions = context.get('positions', {})
        for symbol, data in positions.items():
            pnl_color = "🟢" if data['pnl'] > 0 else "🔴" if data['pnl'] < 0 else "⚪"
            st.write(f"{pnl_color} **{symbol}**: {data['shares']} shares")
            st.write(f"   P&L: ${data['pnl']:.2f}")

        st.markdown("---")
        st.subheader("🎯 Quick Questions")

        quick_questions = [
            "What are my current positions?",
            "How is my performance today?",
            "Analyze my SPY position",
            "What's the market sentiment?",
            "Should I buy more AAPL?",
            "Explain my current strategy"
        ]

        for question in quick_questions:
            if st.button(question, key=f"quick_{question}"):
                st.session_state.quick_question = question

    # Main chat interface
    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("💬 Chat with AI Assistant")

        # Initialize chat history
        if "messages" not in st.session_state:
            st.session_state.messages = [
                {"role": "assistant", "content": "Hello! I'm your AI trading assistant. I can help you analyze your positions, understand market trends, and improve your trading strategy. What would you like to know?"}
            ]

        # Display chat messages
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.write(message["content"])

        # Handle quick questions
        if hasattr(st.session_state, 'quick_question'):
            prompt = st.session_state.quick_question
            delattr(st.session_state, 'quick_question')
        else:
            prompt = st.chat_input("Ask about your trades, strategies, or market analysis...")

        # Process new message
        if prompt:
            # Add user message
            st.session_state.messages.append({"role": "user", "content": prompt})

            with st.chat_message("user"):
                st.write(prompt)

            # Get AI response
            with st.chat_message("assistant"):
                with st.spinner("Analyzing..."):
                    response = st.session_state.ai_assistant.query_ai(prompt)
                    st.write(response)

            # Add AI response to history
            st.session_state.messages.append({"role": "assistant", "content": response})

    with col2:
        st.subheader("📊 Live Market Data")

        # Quick market overview
        try:
            spy_data = yf.download("SPY", period="1d", interval="1m", progress=False)
            if not spy_data.empty:
                current_price = spy_data['Close'].iloc[-1]
                change = spy_data['Close'].iloc[-1] - spy_data['Open'].iloc[0]
                change_pct = (change / spy_data['Open'].iloc[0]) * 100

                st.metric(
                    "SPY",
                    f"${current_price:.2f}",
                    f"{change:+.2f} ({change_pct:+.2f}%)"
                )

            aapl_data = yf.download("AAPL", period="1d", interval="1m", progress=False)
            if not aapl_data.empty:
                current_price = aapl_data['Close'].iloc[-1]
                change = aapl_data['Close'].iloc[-1] - aapl_data['Open'].iloc[0]
                change_pct = (change / aapl_data['Open'].iloc[0]) * 100

                st.metric(
                    "AAPL",
                    f"${current_price:.2f}",
                    f"{change:+.2f} ({change_pct:+.2f}%)"
                )

        except Exception as e:
            st.error(f"Unable to fetch live data: {e}")

        st.markdown("---")
        st.subheader("🎯 AI Capabilities")

        capabilities = [
            "📊 Portfolio Analysis",
            "📈 Position Evaluation",
            "🔍 Stock Research",
            "💡 Strategy Suggestions",
            "⚠️ Risk Assessment",
            "📝 Trade Explanations",
            "🎯 Goal Setting",
            "📚 Trading Education"
        ]

        for cap in capabilities:
            st.write(cap)

if __name__ == "__main__":
    main()