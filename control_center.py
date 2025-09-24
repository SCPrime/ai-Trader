from dotenv import load_dotenv
load_dotenv()
import os
from datetime import datetime

print("=" * 60)
print("AI TRADER CONTROL CENTER")
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 60)

while True:
    print("\nWhat would you like to do?")
    print("1. Check account status")
    print("2. View current positions")
    print("3. Find trading opportunities")
    print("4. Execute a trade")
    print("5. View pending orders")
    print("6. Exit")
    
    choice = input("\nEnter choice (1-6): ")
    
    if choice == "1":
        import account_status
    elif choice == "2":
        import check_positions
    elif choice == "3":
        import find_deals
    elif choice == "4":
        symbol = input("Symbol to trade: ").upper()
        qty = int(input("Quantity: "))
        import buy_apple  # We'll modify this
        print(f"Order submitted for {qty} shares of {symbol}")
    elif choice == "5":
        import check_orders
    elif choice == "6":
        print("Goodbye!")
        break
    else:
        print("Invalid choice")