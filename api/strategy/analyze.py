#!/usr/bin/env python3
"""
Vercel serverless function for strategy analysis and multi-leg generation
"""

import json
from datetime import datetime, timedelta
import random

def handler(request):
    """Handle strategy analysis and opportunity generation"""

    if request.method != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        # Parse request body
        body = json.loads(request.body) if hasattr(request, 'body') and request.body else {}

        strategy_name = body.get('strategy_name', 'Default Strategy')
        symbols = body.get('symbols', ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'])
        allocation = body.get('allocation', 1000)

        # Generate strategy opportunities
        opportunities = generate_strategy_opportunities(symbols, allocation)

        # Calculate summary statistics
        total_cost = sum(opp['cost'] for opp in opportunities)
        total_potential_profit = sum(opp['estimated_profit'] for opp in opportunities)
        avg_confidence = sum(opp['confidence'] for opp in opportunities) / len(opportunities) if opportunities else 0

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                "success": True,
                "strategy_name": strategy_name,
                "opportunities": opportunities,
                "summary": {
                    "total_opportunities": len(opportunities),
                    "total_cost": total_cost,
                    "total_potential_profit": total_potential_profit,
                    "average_confidence": round(avg_confidence, 1),
                    "roi_estimate": round((total_potential_profit / total_cost * 100) if total_cost > 0 else 0, 2)
                },
                "timestamp": datetime.now().isoformat()
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
        }


def generate_strategy_opportunities(symbols, allocation):
    """Generate diverse trading opportunities including multi-leg options strategies"""

    opportunities = []

    for symbol in symbols[:8]:  # Limit to 8 for demo
        # Generate different types of opportunities
        opportunity_type = random.choice(['stock', 'call_option', 'put_option', 'iron_condor', 'bull_call_spread'])

        if opportunity_type == 'stock':
            opp = generate_stock_opportunity(symbol, allocation)
        elif opportunity_type == 'call_option':
            opp = generate_call_opportunity(symbol, allocation)
        elif opportunity_type == 'put_option':
            opp = generate_put_opportunity(symbol, allocation)
        elif opportunity_type == 'iron_condor':
            opp = generate_iron_condor_opportunity(symbol, allocation)
        elif opportunity_type == 'bull_call_spread':
            opp = generate_bull_call_spread_opportunity(symbol, allocation)

        opportunities.append(opp)

    return opportunities


def generate_stock_opportunity(symbol, allocation):
    """Generate a stock trading opportunity"""
    current_price = round(random.uniform(50, 300), 2)
    shares = int(allocation / current_price)

    return {
        "symbol": symbol,
        "type": "Stock",
        "signal": "BUY",
        "current_price": current_price,
        "quantity": shares,
        "cost": current_price * shares,
        "estimated_profit": round(current_price * shares * random.uniform(0.05, 0.15), 2),
        "confidence": round(random.uniform(70, 90), 1),
        "reasoning": f"Technical analysis shows {symbol} oversold with RSI at 28. Expecting bounce to resistance.",
        "legs": [{"action": "buy", "quantity": shares, "price": current_price}],
        "expiry": None,
        "strategy_name": "Momentum Play"
    }


def generate_call_opportunity(symbol, allocation):
    """Generate a call option opportunity"""
    stock_price = round(random.uniform(100, 200), 2)
    strike = round(stock_price * random.uniform(1.02, 1.08), 0)  # OTM call
    premium = round(stock_price * random.uniform(0.02, 0.05), 2)
    contracts = int(allocation / (premium * 100))

    expiry = datetime.now() + timedelta(days=random.randint(21, 45))

    return {
        "symbol": symbol,
        "type": "Call Option",
        "signal": "BUY",
        "current_price": stock_price,
        "strike": strike,
        "premium": premium,
        "quantity": contracts,
        "cost": premium * contracts * 100,
        "estimated_profit": round(premium * contracts * 100 * random.uniform(0.3, 0.8), 2),
        "confidence": round(random.uniform(65, 85), 1),
        "reasoning": f"High IV rank on {symbol}. Expecting breakout above ${strike} before {expiry.strftime('%Y-%m-%d')}.",
        "legs": [{"action": "buy", "type": "call", "strike": strike, "quantity": contracts, "premium": premium}],
        "expiry": expiry.strftime('%Y-%m-%d'),
        "strategy_name": "Bullish Directional"
    }


def generate_put_opportunity(symbol, allocation):
    """Generate a put option opportunity"""
    stock_price = round(random.uniform(100, 200), 2)
    strike = round(stock_price * random.uniform(0.92, 0.98), 0)  # OTM put
    premium = round(stock_price * random.uniform(0.015, 0.04), 2)
    contracts = int(allocation / (premium * 100))

    expiry = datetime.now() + timedelta(days=random.randint(21, 45))

    return {
        "symbol": symbol,
        "type": "Cash-Secured Put",
        "signal": "SELL",
        "current_price": stock_price,
        "strike": strike,
        "premium": premium,
        "quantity": contracts,
        "cost": strike * contracts * 100,  # Cash secured
        "estimated_profit": round(premium * contracts * 100 * 0.7, 2),  # 70% profit target
        "confidence": round(random.uniform(75, 90), 1),
        "reasoning": f"Selling cash-secured puts on {symbol}. Support at ${strike}. Collect premium income.",
        "legs": [{"action": "sell", "type": "put", "strike": strike, "quantity": contracts, "premium": premium}],
        "expiry": expiry.strftime('%Y-%m-%d'),
        "strategy_name": "Income Generation"
    }


def generate_iron_condor_opportunity(symbol, allocation):
    """Generate an Iron Condor multi-leg strategy"""
    stock_price = round(random.uniform(100, 200), 2)

    # Iron Condor strikes
    call_strike_short = round(stock_price * 1.05, 0)
    call_strike_long = round(stock_price * 1.10, 0)
    put_strike_short = round(stock_price * 0.95, 0)
    put_strike_long = round(stock_price * 0.90, 0)

    # Premiums (net credit)
    call_premium_short = round(stock_price * 0.02, 2)
    call_premium_long = round(stock_price * 0.01, 2)
    put_premium_short = round(stock_price * 0.02, 2)
    put_premium_long = round(stock_price * 0.01, 2)

    net_credit = (call_premium_short - call_premium_long + put_premium_short - put_premium_long)
    contracts = int(allocation / (net_credit * 100))

    expiry = datetime.now() + timedelta(days=random.randint(21, 35))

    return {
        "symbol": symbol,
        "type": "Iron Condor",
        "signal": "NEUTRAL",
        "current_price": stock_price,
        "quantity": contracts,
        "cost": abs((call_strike_long - call_strike_short) * contracts * 100),  # Max risk
        "estimated_profit": round(net_credit * contracts * 100 * 0.5, 2),  # 50% profit target
        "confidence": round(random.uniform(70, 85), 1),
        "reasoning": f"High IV on {symbol}. Expecting price to stay between ${put_strike_short}-${call_strike_short}.",
        "legs": [
            {"action": "sell", "type": "call", "strike": call_strike_short, "quantity": contracts, "premium": call_premium_short},
            {"action": "buy", "type": "call", "strike": call_strike_long, "quantity": contracts, "premium": call_premium_long},
            {"action": "sell", "type": "put", "strike": put_strike_short, "quantity": contracts, "premium": put_premium_short},
            {"action": "buy", "type": "put", "strike": put_strike_long, "quantity": contracts, "premium": put_premium_long}
        ],
        "expiry": expiry.strftime('%Y-%m-%d'),
        "net_credit": round(net_credit, 2),
        "strategy_name": "Range Bound"
    }


def generate_bull_call_spread_opportunity(symbol, allocation):
    """Generate a Bull Call Spread multi-leg strategy"""
    stock_price = round(random.uniform(100, 200), 2)

    strike_long = round(stock_price * 1.02, 0)  # Slightly OTM
    strike_short = round(stock_price * 1.08, 0)  # Further OTM

    premium_long = round(stock_price * 0.03, 2)
    premium_short = round(stock_price * 0.015, 2)

    net_debit = premium_long - premium_short
    contracts = int(allocation / (net_debit * 100))

    expiry = datetime.now() + timedelta(days=random.randint(21, 45))

    return {
        "symbol": symbol,
        "type": "Bull Call Spread",
        "signal": "BUY",
        "current_price": stock_price,
        "quantity": contracts,
        "cost": net_debit * contracts * 100,
        "estimated_profit": round((strike_short - strike_long - net_debit) * contracts * 100 * 0.6, 2),
        "confidence": round(random.uniform(68, 82), 1),
        "reasoning": f"Bullish on {symbol}. Limited risk spread targeting move to ${strike_short}.",
        "legs": [
            {"action": "buy", "type": "call", "strike": strike_long, "quantity": contracts, "premium": premium_long},
            {"action": "sell", "type": "call", "strike": strike_short, "quantity": contracts, "premium": premium_short}
        ],
        "expiry": expiry.strftime('%Y-%m-%d'),
        "net_debit": round(net_debit, 2),
        "max_profit": round((strike_short - strike_long - net_debit) * 100, 2),
        "strategy_name": "Bullish Spread"
    }