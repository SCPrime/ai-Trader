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
    page_title="AI Trading Bot Dashboard",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for dark theme
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        color: #00ff88;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin: 0.5rem 0;
    }
    .profit { color: #00ff88; }
    .loss { color: #ff4444; }
</style>
""", unsafe_allow_html=True)

class AITradingAssistant:
    def __init__(self):
        try:
            self.client = anthropic.Anthropic(
                api_key=os.getenv('ANTHROPIC_API_KEY')
            )
        except Exception as e:
            st.error(f"AI initialization error: {e}")
            self.client = None

    def get_trading_context(self):
        """Get current trading context for AI"""
        return {
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

    def query_ai(self, user_message):
        """Query Claude AI with trading context"""
        if not self.client:
            return "AI service is currently unavailable. Please check your API configuration."

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
Focus on paper trading education and risk management. Be professional but friendly.
Keep responses under 200 words for dashboard chat."""

            message = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=500,
                temperature=0.7,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )

            return message.content[0].text

        except Exception as e:
            return f"I'm having trouble processing your request. Error: {str(e)[:100]}"

def main():
    # Initialize AI assistant
    if 'ai_assistant' not in st.session_state:
        st.session_state.ai_assistant = AITradingAssistant()

    # Header
    st.markdown('<h1 class="main-header">🤖 AI Trading Bot Dashboard</h1>', unsafe_allow_html=True)
    
    # Sidebar
    with st.sidebar:
        st.header("🎛️ Controls")
        
        # Trading mode indicator
        st.success("📈 Paper Trading Mode")
        
        # Quick actions
        st.subheader("Quick Actions")
        if st.button("🔄 Refresh Data"):
            st.rerun()
            
        if st.button("⚡ Execute Trade"):
            st.info("Trade execution would happen here")
            
        if st.button("🛑 Emergency Stop"):
            st.error("Emergency stop activated!")
            
        # Account summary
        st.subheader("Account Summary")
        st.metric("Portfolio Value", "$100,007.26", "0.13%")
        st.metric("Buying Power", "$197,773.15", "-$500")
        st.metric("Cash", "$97,765.89", "-$2,234")
        
        # Bot status
        st.subheader("Bot Status")
        st.success("🟢 Online")
        st.info("Strategy: Moving Average")
        st.info("Risk Level: Conservative")
    
    # Main content area
    col1, col2, col3 = st.columns([2, 2, 1])
    
    with col1:
        st.subheader("📊 Portfolio Performance")
        
        # Generate sample performance data
        dates = pd.date_range(start='2024-01-01', end=datetime.now(), freq='D')
        performance = np.cumsum(np.random.randn(len(dates)) * 0.02) + 100000
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=dates,
            y=performance,
            mode='lines',
            name='Portfolio Value',
            line=dict(color='#00ff88', width=2)
        ))
        
        fig.update_layout(
            title="Portfolio Value Over Time",
            xaxis_title="Date",
            yaxis_title="Value ($)",
            template="plotly_dark",
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
    with col2:
        st.subheader("📈 Current Positions")
        
        # Current positions
        positions_data = {
            'Symbol': ['AAPL', 'SPY', 'MSFT'],
            'Shares': [1, 3, 0],
            'Avg Price': [253.17, 660.31, 0],
            'Current Price': [256.10, 661.95, 420.50],
            'P&L': [2.93, 4.92, 0],
            'P&L %': [1.16, 0.25, 0]
        }
        
        df_positions = pd.DataFrame(positions_data)
        
        # Style the dataframe
        def style_pnl(val):
            color = 'color: #00ff88' if val > 0 else 'color: #ff4444' if val < 0 else 'color: white'
            return color
        
        styled_df = df_positions.style.applymap(style_pnl, subset=['P&L', 'P&L %'])
        st.dataframe(styled_df, use_container_width=True)
        
        # Add some charts
        st.subheader("📊 Asset Allocation")
        
        allocation_data = {
            'Asset': ['AAPL', 'SPY', 'Cash'],
            'Value': [256.10, 1985.85, 97765.89],
            'Percentage': [0.26, 1.98, 97.76]
        }
        
        fig_pie = go.Figure(data=[go.Pie(
            labels=allocation_data['Asset'],
            values=allocation_data['Value'],
            hole=0.4,
            marker_colors=['#ff6b6b', '#4ecdc4', '#45b7d1']
        )])
        
        fig_pie.update_layout(
            title="Portfolio Allocation",
            template="plotly_dark",
            height=300
        )
        
        st.plotly_chart(fig_pie, use_container_width=True)
    
    with col3:
        st.subheader("🤖 AI Assistant")
        
        # Chat interface
        if "messages" not in st.session_state:
            st.session_state.messages = [
                {"role": "assistant", "content": "Hello! I'm your AI trading assistant. How can I help you today?"}
            ]
        
        # Display chat messages
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.write(message["content"])
        
        # Chat input
        if prompt := st.chat_input("Ask about your trades..."):
            st.session_state.messages.append({"role": "user", "content": prompt})

            # Get AI response
            with st.spinner("Analyzing with AI..."):
                response = st.session_state.ai_assistant.query_ai(prompt)

            st.session_state.messages.append({"role": "assistant", "content": response})
            st.rerun()
    
    # Bottom section - Recent activity
    st.subheader("📝 Recent Trading Activity")
    
    activity_data = {
        'Time': ['2025-09-26 14:30', '2025-09-26 09:45', '2025-09-25 15:20'],
        'Action': ['BUY', 'BUY', 'SELL'],
        'Symbol': ['SPY', 'AAPL', 'TSLA'],
        'Quantity': [1, 1, 2],
        'Price': [661.31, 253.17, 245.80],
        'Status': ['✅ Filled', '✅ Filled', '✅ Filled']
    }
    
    df_activity = pd.DataFrame(activity_data)
    st.dataframe(df_activity, use_container_width=True)
    
    # Real-time metrics
    st.subheader("📊 Real-time Metrics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="Daily P&L",
            value="$127.50",
            delta="0.13%"
        )
    
    with col2:
        st.metric(
            label="Win Rate",
            value="72%",
            delta="5%"
        )
    
    with col3:
        st.metric(
            label="Total Trades",
            value="47",
            delta="3"
        )
    
    with col4:
        st.metric(
            label="Sharpe Ratio",
            value="1.85",
            delta="0.12"
        )

if __name__ == "__main__":
    main()
