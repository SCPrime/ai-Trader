#!/usr/bin/env python3
"""
Simple backtesting example for your trading strategies
"""

from backtest_engine import BacktestEngine
import pandas as pd

def simple_buy_hold_strategy(data, initial_capital=10000):
    """Simple buy and hold strategy for comparison"""
    if len(data) == 0:
        return 0
    
    # Buy at first price, sell at last price
    start_price = data['Close'].iloc[0]
    end_price = data['Close'].iloc[-1]
    
    shares = initial_capital / start_price
    final_value = shares * end_price
    
    return_pct = ((final_value - initial_capital) / initial_capital) * 100
    
    print(f"Buy & Hold Strategy Results:")
    print(f"Initial Capital: ${initial_capital:,.2f}")
    print(f"Final Value: ${final_value:,.2f}")
    print(f"Total Return: {return_pct:.2f}%")
    
    return return_pct

def main():
    print("BACKTESTING EXAMPLE")
    print("=" * 50)
    
    # Initialize backtest engine
    engine = BacktestEngine(initial_capital=10000)
    
    # Download historical data
    print("Downloading historical data for AAPL...")
    try:
        data = engine.download_historical_data("AAPL", period="1y")
        
        if not data.empty:
            print(f"Downloaded {len(data)} days of data")
            print(f"Date range: {data.index[0].date()} to {data.index[-1].date()}")
            
            # Run simple strategy
            simple_buy_hold_strategy(data)
        else:
            print("No data downloaded")
            
    except Exception as e:
        print(f"Error downloading data: {e}")
        print("You may need to install yfinance: pip install yfinance")

if __name__ == "__main__":
    main()
