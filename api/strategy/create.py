#!/usr/bin/env python3
"""
Vercel serverless function for strategy creation
"""

import json
from datetime import datetime
import re

def handler(request):
    """Handle strategy creation requests"""

    if request.method != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        # Parse request body
        body = json.loads(request.body) if hasattr(request, 'body') and request.body else {}

        strategy_name = body.get('name', 'Unnamed Strategy')
        description = body.get('description', '')
        rules = body.get('rules', '')

        # Simple AI-like parsing of natural language rules
        parsed_strategy = parse_strategy_rules(rules)

        strategy_id = f"STRAT_{hash(strategy_name + rules) % 999999:06d}"

        strategy = {
            "id": strategy_id,
            "name": strategy_name,
            "description": description,
            "rules": rules,
            "parsed_conditions": parsed_strategy,
            "created_at": datetime.now().isoformat(),
            "status": "created",
            "backtest_results": None
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
                "strategy": strategy,
                "message": f"Strategy '{strategy_name}' created successfully",
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


def parse_strategy_rules(rules_text):
    """Parse natural language rules into structured format"""

    if not rules_text:
        return {}

    parsed = {
        "entry_conditions": [],
        "exit_conditions": [],
        "risk_management": {},
        "position_sizing": {},
        "technical_indicators": []
    }

    rules_lower = rules_text.lower()

    # Parse RSI conditions
    rsi_match = re.search(r'rsi\s+(?:below|<|under)\s+(\d+)', rules_lower)
    if rsi_match:
        parsed["entry_conditions"].append({
            "indicator": "RSI",
            "condition": "below",
            "value": int(rsi_match.group(1))
        })

    rsi_above_match = re.search(r'rsi\s+(?:above|>|over)\s+(\d+)', rules_lower)
    if rsi_above_match:
        parsed["entry_conditions"].append({
            "indicator": "RSI",
            "condition": "above",
            "value": int(rsi_above_match.group(1))
        })

    # Parse profit target
    profit_match = re.search(r'(?:take profit|profit target).*?(\d+)%', rules_lower)
    if profit_match:
        parsed["exit_conditions"].append({
            "type": "profit_target",
            "value": int(profit_match.group(1))
        })

    # Parse stop loss
    stop_match = re.search(r'stop loss.*?(\d+)%', rules_lower)
    if stop_match:
        parsed["risk_management"]["stop_loss"] = int(stop_match.group(1))

    # Parse position size
    position_match = re.search(r'(?:position size|use)\s+(\d+)%', rules_lower)
    if position_match:
        parsed["position_sizing"]["percentage"] = int(position_match.group(1))

    # Parse moving averages
    if 'moving average' in rules_lower or 'ma' in rules_lower:
        parsed["technical_indicators"].append("moving_average")

    if 'bollinger' in rules_lower:
        parsed["technical_indicators"].append("bollinger_bands")

    # Parse options strategies
    if any(word in rules_lower for word in ['iron condor', 'spread', 'straddle', 'strangle']):
        parsed["strategy_type"] = "options_multi_leg"
    elif any(word in rules_lower for word in ['call', 'put']):
        parsed["strategy_type"] = "options_single_leg"
    else:
        parsed["strategy_type"] = "stock"

    return parsed