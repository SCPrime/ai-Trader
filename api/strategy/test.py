#!/usr/bin/env python3
"""
Vercel serverless function for strategy testing
"""

import json
from datetime import datetime
import random

def handler(request):
    """Handle strategy test requests"""
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        # Parse request body
        body = json.loads(request.body) if hasattr(request, 'body') and request.body else {}
        strategy_name = body.get("strategy_name", "Unknown")

        # Simulate options income strategy results
        investment_legs = []
        symbols = ["PLTR", "NOK", "SIRI", "SOFI", "NIO", "WISH", "CLOV", "BBBY", "AMC", "XPEV", "FCEL", "PLUG", "CCIV", "RIDE", "NKLA"]

        for i, symbol in enumerate(symbols[:10]):  # Limit to 10 for demo
            price = round(random.uniform(1.0, 4.0), 2)
            iv_rank = round(random.uniform(80, 95), 1)

            # Cash-Secured Put
            csp_strike = round(price * 0.95, 2)
            csp_premium = round(price * 0.05, 2)
            csp_profit = round(csp_premium * 0.5, 2)

            investment_legs.append({
                "symbol": symbol,
                "leg_type": "Cash-Secured Put",
                "strike": csp_strike,
                "expiration": "30-45 DTE",
                "premium_collected": csp_premium,
                "estimated_profit": csp_profit,
                "confidence": round(random.uniform(75, 90), 1),
                "iv_rank": iv_rank,
                "current_price": price
            })

        response_data = {
            "success": True,
            "strategy_name": strategy_name,
            "results": investment_legs,
            "total_potential_profit": round(sum(leg["estimated_profit"] for leg in investment_legs), 2),
            "timestamp": datetime.now().isoformat()
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps(response_data)
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