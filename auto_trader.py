from datetime import datetime  # Add this line with other imports
from dotenv import load_dotenv
load_dotenv()
import os
import json
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest, LimitOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce

client = TradingClient(
    api_key=os.getenv('ALPACA_PAPER_API_KEY'),
    secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY'),
    paper=True
)

def execute_trade(symbol, quantity, action="BUY", order_type="MARKET", limit_price=None):
    """Execute a trade with safety checks"""
    
    # Check account first
    account = client.get_account()
    buying_power = float(account.buying_power)
    
    print(f"Attempting to {action} {quantity} shares of {symbol}")
    print(f"Available buying power: ${buying_power:,.2f}")
    
    # Safety check
    if action == "BUY":
        # Get current price
        from alpaca.data.historical import StockHistoricalDataClient
        from alpaca.data.requests import StockQuotesRequest
        
        data_client = StockHistoricalDataClient(
            api_key=os.getenv('ALPACA_PAPER_API_KEY'),
            secret_key=os.getenv('ALPACA_PAPER_SECRET_KEY')
        )
        
        request = StockQuotesRequest(symbol_or_symbols=symbol, limit=1)
        quotes = data_client.get_stock_quotes(request)
        
        if symbol in quotes:
            current_price = quotes[symbol][0].ask_price
            total_cost = current_price * quantity
            
            if total_cost > buying_power:
                print(f"❌ Insufficient funds! Need ${total_cost:.2f}")
                return None
            
            if total_cost > 1000:  # Safety limit
                print(f"⚠️  Large order! ${total_cost:.2f} exceeds $1000 limit")
                return None
    
    # Execute trade
    try:
        if order_type == "MARKET":
            order_request = MarketOrderRequest(
                symbol=symbol,
                qty=quantity,
                side=OrderSide[action],
                time_in_force=TimeInForce.DAY
            )
        else:  # LIMIT
            order_request = LimitOrderRequest(
                symbol=symbol,
                qty=quantity,
                side=OrderSide[action],
                limit_price=limit_price,
                time_in_force=TimeInForce.DAY
            )
        
        order = client.submit_order(order_request)
        print(f"✅ Order submitted!")
        print(f"Order ID: {order.id}")
        
        # Save to log
        log_entry = {
            'order_id': order.id,
            'symbol': symbol,
            'quantity': quantity,
            'action': action,
            'timestamp': str(datetime.now())
        }
        
        with open('trade_log.json', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
        
        return order
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Test with small safe trade
execute_trade("SPY", 1, "BUY")