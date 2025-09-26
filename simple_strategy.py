from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from datetime import datetime, timedelta

# Setup clients
trading_client = TradingClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
    paper=True
)

data_client = StockHistoricalDataClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY')
)

def check_price_drop(symbol, drop_percent=2):
    """Check if stock dropped more than X% today"""
    
    # Get today's data
    request = StockBarsRequest(
        symbol_or_symbols=symbol,
        timeframe=TimeFrame.Day,
        start=datetime.now() - timedelta(days=5)
    )
    
    bars = data_client.get_stock_bars(request)
    
    if symbol in bars:
        df = bars[symbol].df
        if len(df) >= 2:
            yesterday_close = df.iloc[-2]['close']
            current_close = df.iloc[-1]['close']
            change_pct = ((current_close - yesterday_close) / yesterday_close) * 100
            
            print(f"{symbol} Change: {change_pct:.2f}%")
            
            if change_pct < -drop_percent:
                print(f"BUY SIGNAL! {symbol} dropped {abs(change_pct):.2f}%")
                return True
    
    return False

# Check a few stocks
stocks = ["AAPL", "MSFT", "GOOGL", "TSLA"]
print("Checking for buying opportunities...")
print("=" * 50)

for stock in stocks:
    if check_price_drop(stock, drop_percent=1):
        print(f"* Consider buying {stock}")
    else:
        print(f"* {stock}: No action")