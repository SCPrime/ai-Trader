#!/usr/bin/env python3
"""
Vercel serverless function for trade execution
"""

import json
from datetime import datetime
import random

def handler(request):
    """Handle trade execution requests"""

    if request.method != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        # Parse request body
        body = json.loads(request.body) if hasattr(request, 'body') and request.body else {}

        symbol = body.get('symbol', 'AAPL')
        side = body.get('side', 'buy')  # buy or sell
        quantity = int(body.get('quantity', 1))
        order_type = body.get('order_type', 'market')

        # Simulate trade execution
        execution_price = round(random.uniform(100, 200), 2)
        order_id = f"ORD_{random.randint(100000, 999999)}"

        trade_result = {
            "order_id": order_id,
            "symbol": symbol,
            "side": side.upper(),
            "quantity": quantity,
            "order_type": order_type,
            "execution_price": execution_price,
            "total_value": execution_price * quantity,
            "status": "FILLED",
            "timestamp": datetime.now().isoformat(),
            "fees": round(execution_price * quantity * 0.001, 2)  # 0.1% fee
        }

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
                "trade": trade_result,
                "message": f"Successfully {side} {quantity} shares of {symbol}",
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