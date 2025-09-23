#!/usr/bin/env python3
"""
Vercel serverless function for health check
"""

import json
from datetime import datetime

def handler(request):
    """Handle health check requests"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps({
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        })
    }