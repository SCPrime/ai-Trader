from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.trading.client import TradingClient
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockQuotesRequest, StockBarsRequest
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

def find_best_deal():
    """Find stocks with best value today"""
    
    symbols = ["AAPL", "MSFT", "GOOGL", "TSLA", "META", "NVDA", "AMD", "SPY"]
    opportunities = []
    
    print("Analyzing stocks for best opportunities...")
    print("=" * 50)
    
    for symbol in symbols:
        # Get recent data
        request = StockBarsRequest(
            symbol_or_symbols=symbol,
            timeframe=TimeFrame.Day,
            start=datetime.now() - timedelta(days=30)
        )
        
        bars = data_client.get_stock_bars(request)
        
        if symbol in bars:
            df = bars[symbol].df
            
            # Calculate metrics
            current_price = df.iloc[-1]['close']
            avg_30day = df['close'].mean()
            min_30day = df['close'].min()
            max_30day = df['close'].max()
            
            # Score based on how close to 30-day low
            discount_score = ((max_30day - current_price) / (max_30day - min_30day)) * 100
            
            print(f"{symbol}:")
            print(f"  Current: ${current_price:.2f}")
            print(f"  30-day avg: ${avg_30day:.2f}")
            print(f"  Discount score: {discount_score:.1f}%")
            
            opportunities.append({
                'symbol': symbol,
                'price': current_price,
                'score': discount_score
            })
    
    # Find best opportunity
    best = max(opportunities, key=lambda x: x['score'])
    print("\n🎯 BEST OPPORTUNITY:")
    print(f"{best['symbol']} with {best['score']:.1f}% discount score")
    print(f"Current price: ${best['price']:.2f}")
    
    return best

# Run analysis
best_stock = find_best_deal()

# Ask if we should buy
print("\n" + "="*50)
print(f"Recommendation: Buy 1 share of {best_stock['symbol']}")
print("This would cost approximately ${:.2f}".format(best_stock['price']))