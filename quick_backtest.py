import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def backtest_simple_strategy(symbol="SPY", period="6mo"):
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
    
    # Results
    total_return = (1 + data['Strategy_Returns']).prod() - 1
    buy_hold = (data['Close'].iloc[-1] / data['Close'].iloc[0]) - 1
    
    print(f"Strategy Return: {total_return:.2%}")
    print(f"Buy & Hold Return: {buy_hold:.2%}")
    print(f"Outperformance: {(total_return - buy_hold):.2%}")
    
    return data

# Run backtest
results = backtest_simple_strategy()
