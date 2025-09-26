import yfinance as yf
import pandas as pd

def simple_backtest(symbol="SPY", period="3mo"):
    print(f"Backtesting {symbol} ({period})...")
    
    # Download data
    data = yf.download(symbol, period=period, progress=False)
    
    # Simple moving average strategy  
    data['SMA20'] = data['Close'].rolling(20).mean()
    data['SMA50'] = data['Close'].rolling(50).mean()
    
    # Generate signals
    data['Signal'] = 0
    data.loc[data['SMA20'] > data['SMA50'], 'Signal'] = 1
    
    # Calculate returns
    data['Returns'] = data['Close'].pct_change()
    data['Strategy_Returns'] = data['Signal'].shift(1) * data['Returns']
    
    # Calculate final metrics
    strategy_total = (1 + data['Strategy_Returns'].dropna()).prod() - 1
    buy_hold_total = data['Close'].iloc[-1] / data['Close'].iloc[0] - 1
    
    print(f"  Strategy: {strategy_total:.2%}")
    print(f"  Buy&Hold: {buy_hold_total:.2%}")
    print(f"  Difference: {(strategy_total - buy_hold_total):.2%}")
    
    return strategy_total

print("QUICK BACKTEST RESULTS")
print("=" * 30)
results = {}
for symbol in ["SPY", "AAPL", "MSFT"]:
    results[symbol] = simple_backtest(symbol)
    print()

print("SUMMARY:")
for symbol, result in results.items():
    print(f"{symbol}: {result:.2%}")
