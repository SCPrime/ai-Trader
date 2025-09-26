import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from src.unified_ai_engine import ai_engine
import asyncio

st.set_page_config(
    page_title="AI Trading Assistant",
    page_icon="🤖",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .main { padding-top: 0; }
    .block-container { padding-top: 1rem; }
    .stChatMessage { background: #1a1a1a; }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'charts' not in st.session_state:
    st.session_state.charts = []

# Sidebar with metrics and controls
with st.sidebar:
    st.title("🤖 Trading Bot Control")

    # Metrics
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Account", "$100,000", "+1.27%")
        st.metric("Win Rate", "67%", "+5%")
    with col2:
        st.metric("Daily P/L", "+$127.50", "↑")
        st.metric("Open Positions", "3", "-2")

    st.divider()

    # AI Provider selection
    provider = st.selectbox(
        "AI Provider",
        ["Auto (Best Available)", "Claude", "GPT-4", "Local"]
    )

    st.divider()

    # Quick actions
    st.subheader("Quick Analysis")

    if st.button("📊 Full Portfolio Analysis", use_container_width=True):
        st.session_state.messages.append({
            "role": "user",
            "content": "Analyze my complete portfolio"
        })

    if st.button("📈 Strategy Performance", use_container_width=True):
        st.session_state.messages.append({
            "role": "user",
            "content": "How are my strategies performing?"
        })

    if st.button("⚠️ Risk Assessment", use_container_width=True):
        st.session_state.messages.append({
            "role": "user",
            "content": "Analyze my current risk exposure"
        })

# Main chat interface
st.title("AI Trading Assistant - Unified Interface")

# Create tabs
tab1, tab2, tab3 = st.tabs(["💬 Chat", "📊 Analytics", "📈 Live Charts"])

with tab1:
    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.write(message["content"])

            # Display suggestions if available
            if "suggestions" in message:
                for suggestion in message["suggestions"]:
                    st.button(suggestion, key=f"sug_{hash(suggestion)}")

    # Chat input
    if prompt := st.chat_input("Ask about trades, strategies, or markets..."):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})

        # Get AI response
        with st.spinner("Analyzing..."):
            response = asyncio.run(
                ai_engine.process_query(prompt, interface='streamlit')
            )

        # Add AI response
        st.session_state.messages.append({
            "role": "assistant",
            "content": response['text'],
            "suggestions": response.get('suggestions', [])
        })

        # Store charts if any
        if response.get('charts'):
            st.session_state.charts = response['charts']

        st.rerun()

with tab2:
    st.subheader("Portfolio Analytics")

    col1, col2 = st.columns(2)

    with col1:
        # Portfolio pie chart
        fig = go.Figure(data=[go.Pie(
            labels=['SPY', 'QQQ', 'AAPL', 'Cash'],
            values=[30, 25, 20, 25]
        )])
        fig.update_layout(title="Portfolio Allocation")
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        # Performance line chart
        dates = pd.date_range(start='2024-01-01', periods=30)
        pnl = pd.Series(range(30)) * 100 + pd.Series(range(30)).apply(lambda x: x**1.5) * 50

        fig = go.Figure(data=[go.Scatter(
            x=dates,
            y=pnl,
            mode='lines',
            name='P/L'
        )])
        fig.update_layout(title="30-Day Performance")
        st.plotly_chart(fig, use_container_width=True)

with tab3:
    st.subheader("Live Market Data")

    # Placeholder for live charts
    placeholder = st.empty()

    # Update live data (in real implementation)
    with placeholder.container():
        st.info("Connect to market data feed for live charts")