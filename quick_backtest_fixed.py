import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def backtest_simple_strategy(symbol="SPY", period="6mo"):
    print(f"Backtesting {symbol} for {period}...")
    
    # Download data
    data = yf.download(symbol, period=period)
    
    # Simple moving average strategy
    data['SMA20'] = data['Close'].rolling(20).mean()
    data['SMA50'] = data['Close'].rolling(50).mean()
    
    # Generate signals
    data['Signal'] = 0
    data.loc[data['SMA20'] > data['SMA50'], 'Signal'] = 1
    data.loc[data['SMA20'] < data['SMA50'], 'Signal'] = -1
    
    # Calculate returns
    data['Returns'] = data['Close'].pct_change()
    data['Strategy_Returns'] = data['Signal'].shift(1) * data['Returns']
    
    # Results - fix the formatting issue
    strategy_return = (1 + data['Strategy_Returns']).prod() - 1
    buy_hold_return = (data['Close'].iloc[-1] / data['Close'].iloc[0]) - 1
    
    print("=" * 50)
    print("BACKTEST RESULTS")
    print("=" * 50)
    print(f"Strategy Return: {strategy_return:.2%}")
    print(f"Buy & Hold Return: {buy_hold_return:.2%}")
    print(f"Outperformance: {(strategy_return - buy_hold_return):.2%}")
    
    # Additional metrics
    win_rate = (data['Strategy_Returns'] > 0).sum() / len(data['Strategy_Returns'])
    print(f"Win Rate: {win_rate:.2%}")
    print(f"Total Trades: {len(data)}")
    
    return data

# Test multiple symbols
for symbol in ["SPY", "AAPL", "MSFT"]:
    backtest_simple_strategy(symbol, "3mo")
    print()
