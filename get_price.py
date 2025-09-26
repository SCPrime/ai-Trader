from dotenv import load_dotenv
load_dotenv()
import os
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockLatestQuoteRequest

client = StockHistoricalDataClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY')
)

symbols = ["AAPL", "TSLA", "SPY"]
request = StockLatestQuoteRequest(symbol_or_symbols=symbols)
quotes = client.get_stock_latest_quote(request)

for symbol, quote in quotes.items():
    print(f"{symbol}: ${quote.ask_price:.2f}")
    