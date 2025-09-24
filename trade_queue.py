import json
from datetime import datetime

class TradeQueue:
    def __init__(self, filename="pending_trades.json"):
        self.filename = filename
        self.trades = []
        
    def add_trade(self, symbol, action, quantity, reason):
        trade = {
            "id": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "symbol": symbol,
            "action": action,
            "quantity": quantity,
            "reason": reason,
            "timestamp": datetime.now().isoformat(),
            "status": "pending"
        }
        self.trades.append(trade)
        self.save()
        print(f"Trade queued: {action} {quantity} {symbol}")
        return trade["id"]
        
    def save(self):
        with open(self.filename, 'w') as f:
            json.dump(self.trades, f, indent=2)
            
    def get_pending(self):
        return [t for t in self.trades if t["status"] == "pending"]

# Test it
queue = TradeQueue()
queue.add_trade("TSLA", "BUY", 1, "Price dropped 3%")
queue.add_trade("MSFT", "BUY", 2, "Good momentum")

print("\nPending trades:")
for trade in queue.get_pending():
    print(f"- {trade['action']} {trade['quantity']} {trade['symbol']}: {trade['reason']}")