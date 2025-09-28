import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    import alpaca_trade_api as tradeapi
    ALPACA_AVAILABLE = True
except ImportError:
    ALPACA_AVAILABLE = False
    print("Warning: Alpaca not installed, using mock mode")

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False
    print("Warning: yfinance not installed")

class TradingEngine:
    """Main Trading Engine for stocks, options, and strategies"""

    def __init__(self, mode='paper'):
        self.mode = mode
        self.api = None
        self.account = None
        self.positions = {}
        self.orders = []
        self.watchlist = []
        self.strategies = {}

        # Initialize connections
        self.initialize()

    def initialize(self):
        """Initialize trading connections"""
        if ALPACA_AVAILABLE and self.mode == 'paper':
            try:
                self.api = tradeapi.REST(
                    os.getenv('ALPACA_API_KEY_ID'),
                    os.getenv('ALPACA_API_SECRET_KEY'),
                    'https://paper-api.alpaca.markets',
                    api_version='v2'
                )
                self.account = self.api.get_account()
                print(f"[OK] Connected to Alpaca Paper Trading")
                print(f"   Account Value: ${float(self.account.portfolio_value):,.2f}")
                print(f"   Buying Power: ${float(self.account.buying_power):,.2f}")
            except Exception as e:
                print(f"[ERROR] Alpaca connection failed: {e}")
                self.api = None
        else:
            print("[INFO] Running in simulation mode")
            self.account = {
                'portfolio_value': 100000,
                'buying_power': 100000,
                'cash': 100000
            }

    # ============ STOCK TRADING ============

    def buy_stock(self, symbol: str, qty: int, order_type: str = 'market') -> Dict:
        """Buy stock"""
        try:
            if self.api:
                order = self.api.submit_order(
                    symbol=symbol,
                    qty=qty,
                    side='buy',
                    type=order_type,
                    time_in_force='day'
                )
                return {
                    'status': 'success',
                    'order_id': order.id,
                    'symbol': symbol,
                    'qty': qty,
                    'side': 'buy'
                }
            else:
                # Simulation mode
                return {
                    'status': 'simulated',
                    'order_id': f"SIM_{datetime.now().timestamp()}",
                    'symbol': symbol,
                    'qty': qty,
                    'side': 'buy'
                }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def sell_stock(self, symbol: str, qty: int, order_type: str = 'market') -> Dict:
        """Sell stock"""
        try:
            if self.api:
                order = self.api.submit_order(
                    symbol=symbol,
                    qty=qty,
                    side='sell',
                    type=order_type,
                    time_in_force='day'
                )
                return {
                    'status': 'success',
                    'order_id': order.id,
                    'symbol': symbol,
                    'qty': qty,
                    'side': 'sell'
                }
            else:
                return {
                    'status': 'simulated',
                    'order_id': f"SIM_{datetime.now().timestamp()}",
                    'symbol': symbol,
                    'qty': qty,
                    'side': 'sell'
                }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def get_positions(self) -> List[Dict]:
        """Get current positions"""
        if self.api:
            try:
                positions = self.api.list_positions()
                return [{
                    'symbol': p.symbol,
                    'qty': int(p.qty),
                    'avg_price': float(p.avg_entry_price),
                    'current_price': float(p.current_price),
                    'market_value': float(p.market_value),
                    'pnl': float(p.unrealized_pl),
                    'pnl_percent': float(p.unrealized_plpc) * 100
                } for p in positions]
            except:
                return []
        return list(self.positions.values())

    def get_orders(self, status='all') -> List[Dict]:
        """Get orders"""
        if self.api:
            try:
                orders = self.api.list_orders(status=status)
                return [{
                    'id': o.id,
                    'symbol': o.symbol,
                    'qty': int(o.qty),
                    'side': o.side,
                    'type': o.order_type,
                    'status': o.status,
                    'submitted_at': o.submitted_at
                } for o in orders]
            except:
                return []
        return self.orders

    def cancel_order(self, order_id: str) -> Dict:
        """Cancel an order"""
        if self.api:
            try:
                self.api.cancel_order(order_id)
                return {'status': 'success', 'order_id': order_id}
            except Exception as e:
                return {'status': 'error', 'message': str(e)}
        return {'status': 'simulated'}

    # ============ OPTIONS TRADING ============

    def get_options_chain(self, symbol: str) -> Dict:
        """Get options chain for a symbol"""
        if not YFINANCE_AVAILABLE:
            return {'error': 'yfinance not available'}

        try:
            ticker = yf.Ticker(symbol)
            expirations = ticker.options

            if not expirations:
                return {'error': 'No options available'}

            # Get the first 3 expirations
            chains = {}
            for exp in expirations[:3]:
                opt = ticker.option_chain(exp)
                chains[exp] = {
                    'calls': opt.calls[['strike', 'lastPrice', 'bid', 'ask', 'volume', 'openInterest']].to_dict('records'),
                    'puts': opt.puts[['strike', 'lastPrice', 'bid', 'ask', 'volume', 'openInterest']].to_dict('records')
                }

            return chains
        except Exception as e:
            return {'error': str(e)}

    # ============ STRATEGIES ============

    def create_iron_condor(self, symbol: str, strikes: List[float], expiration: str) -> Dict:
        """Create iron condor strategy"""
        strategy = {
            'type': 'iron_condor',
            'symbol': symbol,
            'expiration': expiration,
            'legs': [
                {'type': 'put', 'strike': strikes[0], 'side': 'sell'},
                {'type': 'put', 'strike': strikes[1], 'side': 'buy'},
                {'type': 'call', 'strike': strikes[2], 'side': 'buy'},
                {'type': 'call', 'strike': strikes[3], 'side': 'sell'}
            ],
            'max_profit': (strikes[1] - strikes[0]) * 100,
            'max_loss': ((strikes[2] - strikes[1]) - (strikes[1] - strikes[0])) * 100
        }
        self.strategies[f"{symbol}_{datetime.now().timestamp()}"] = strategy
        return strategy

    def create_bull_call_spread(self, symbol: str, buy_strike: float, sell_strike: float, expiration: str) -> Dict:
        """Create bull call spread"""
        strategy = {
            'type': 'bull_call_spread',
            'symbol': symbol,
            'expiration': expiration,
            'legs': [
                {'type': 'call', 'strike': buy_strike, 'side': 'buy'},
                {'type': 'call', 'strike': sell_strike, 'side': 'sell'}
            ],
            'max_profit': (sell_strike - buy_strike) * 100,
            'max_loss': 'Premium paid'
        }
        self.strategies[f"{symbol}_{datetime.now().timestamp()}"] = strategy
        return strategy

    # ============ MARKET DATA ============

    def get_quote(self, symbol: str) -> Dict:
        """Get current quote for symbol"""
        if YFINANCE_AVAILABLE:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                return {
                    'symbol': symbol,
                    'price': info.get('currentPrice', 0),
                    'bid': info.get('bid', 0),
                    'ask': info.get('ask', 0),
                    'volume': info.get('volume', 0),
                    'open': info.get('open', 0),
                    'high': info.get('dayHigh', 0),
                    'low': info.get('dayLow', 0)
                }
            except:
                pass

        # Fallback to Alpaca
        if self.api:
            try:
                quote = self.api.get_latest_trade(symbol)
                return {
                    'symbol': symbol,
                    'price': quote.price,
                    'size': quote.size,
                    'timestamp': quote.timestamp
                }
            except:
                pass

        return {'symbol': symbol, 'price': 0}

    def get_account_info(self) -> Dict:
        """Get account information"""
        if self.api:
            try:
                acc = self.api.get_account()
                return {
                    'portfolio_value': float(acc.portfolio_value),
                    'buying_power': float(acc.buying_power),
                    'cash': float(acc.cash),
                    'positions_value': float(acc.long_market_value),
                    'day_trade_count': int(acc.daytrade_count)
                }
            except:
                pass

        return self.account

    # ============ TECHNICAL INDICATORS ============

    def calculate_rsi(self, symbol: str, period: int = 14) -> float:
        """Calculate RSI"""
        if YFINANCE_AVAILABLE:
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="1mo")

                if len(hist) < period:
                    return 50.0

                closes = hist['Close']
                delta = closes.diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))

                return float(rsi.iloc[-1])
            except:
                return 50.0
        return 50.0

# Create global instance
engine = TradingEngine()