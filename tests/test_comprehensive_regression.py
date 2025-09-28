#!/usr/bin/env python3
"""
Comprehensive Regression Test Suite
Tests all endpoints and verifies data integrity after blocking fixes
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime

# Test configuration
API_BASE = "http://localhost:8001"

# Comprehensive endpoint test suite
ENDPOINTS_TO_TEST = [
    # Basic health and info
    {"url": "/api/health", "method": "GET", "name": "Health Check"},

    # Account and portfolio
    {"url": "/api/account", "method": "GET", "name": "Account Info"},
    {"url": "/api/positions", "method": "GET", "name": "Positions"},
    {"url": "/api/portfolio/positions", "method": "GET", "name": "Portfolio Positions"},
    {"url": "/api/orders", "method": "GET", "name": "Orders"},

    # Market data
    {"url": "/api/quote/AAPL", "method": "GET", "name": "Quote AAPL"},
    {"url": "/api/quote/TSLA", "method": "GET", "name": "Quote TSLA"},
    {"url": "/api/chart/AAPL", "method": "GET", "name": "Chart AAPL"},
    {"url": "/api/options/chain/AAPL", "method": "GET", "name": "Options Chain AAPL"},

    # News and analysis
    {"url": "/api/news", "method": "GET", "name": "General News"},
    {"url": "/api/news/AAPL", "method": "GET", "name": "Symbol News AAPL"},
    {"url": "/api/news/categories", "method": "GET", "name": "News Categories"},
    {"url": "/api/ai/analysis/AAPL", "method": "GET", "name": "AI Analysis AAPL"},

    # Settings
    {"url": "/api/settings", "method": "GET", "name": "Get Settings"},

    # Strategies
    {"url": "/api/strategies", "method": "GET", "name": "Get Strategies"},

    # Supervisor
    {"url": "/api/supervisor/status", "method": "GET", "name": "Supervisor Status"},

    # Search
    {"url": "/api/search?query=AAPL", "method": "GET", "name": "Symbol Search"},
]

# POST/PUT endpoint tests
POST_ENDPOINTS = [
    {
        "url": "/api/stock/buy",
        "method": "POST",
        "name": "Buy Stock",
        "data": {"symbol": "AAPL", "qty": 1}
    },
    {
        "url": "/api/stock/sell",
        "method": "POST",
        "name": "Sell Stock",
        "data": {"symbol": "AAPL", "qty": 1}
    },
    {
        "url": "/api/morning-routine",
        "method": "POST",
        "name": "Morning Routine"
    },
    {
        "url": "/api/settings",
        "method": "POST",
        "name": "Save Settings",
        "data": {
            "position_size": 0.02,
            "stop_loss": 2.0,
            "take_profit": 4.0,
            "risk_per_trade": 1.0,
            "max_positions": 5
        }
    }
]

async def test_endpoint(session, endpoint_info):
    """Test a single endpoint and validate response"""
    url = f"{API_BASE}{endpoint_info['url']}"
    method = endpoint_info['method']
    name = endpoint_info['name']

    try:
        if method == "GET":
            async with session.get(url) as response:
                data = await response.json()
                return await validate_response(response, data, name)

        elif method == "POST":
            post_data = endpoint_info.get('data', {})
            async with session.post(url, json=post_data) as response:
                data = await response.json()
                return await validate_response(response, data, name)

    except Exception as e:
        return {
            'name': name,
            'url': endpoint_info['url'],
            'status': 'ERROR',
            'success': False,
            'error': str(e),
            'data_valid': False
        }

async def validate_response(response, data, name):
    """Validate response status and data structure"""
    success = response.status == 200
    data_valid = True
    data_issues = []

    # Basic data validation
    if data is None:
        data_valid = False
        data_issues.append("Response data is None")
    elif isinstance(data, dict):
        # Check for common error patterns
        if 'error' in data and data.get('error'):
            data_issues.append(f"API returned error: {data['error']}")

        # Check for null/undefined values that might indicate backend issues
        null_fields = [k for k, v in data.items() if v is None and k not in ['error', 'detail']]
        if null_fields:
            data_issues.append(f"Null fields found: {null_fields}")

        # Check for NaN values (which would be serialized as null in JSON)
        if any(str(v).lower() == 'nan' for v in data.values() if isinstance(v, (str, float))):
            data_issues.append("NaN values detected in response")

    if data_issues:
        data_valid = False

    return {
        'name': name,
        'url': response.url.path,
        'status': response.status,
        'success': success,
        'data_valid': data_valid,
        'data_issues': data_issues,
        'data_sample': str(data)[:200] if data else None
    }

async def run_comprehensive_tests():
    """Run all regression tests"""
    print("=== Comprehensive Regression Test Suite ===")
    print(f"Testing all endpoints after blocking operation fixes...")
    print(f"Time: {datetime.now().strftime('%H:%M:%S')}")
    print()

    timeout = aiohttp.ClientTimeout(total=60)  # Longer timeout for news API
    async with aiohttp.ClientSession(timeout=timeout) as session:

        # Test 1: GET endpoints
        print("[TEST 1] GET Endpoints Validation")
        print("-" * 50)

        get_tasks = [test_endpoint(session, endpoint) for endpoint in ENDPOINTS_TO_TEST]
        get_results = await asyncio.gather(*get_tasks, return_exceptions=True)

        print("GET Endpoint Results:")
        successful_gets = 0
        failed_gets = []
        data_issues_gets = []

        for result in get_results:
            if isinstance(result, dict):
                status_icon = "✅" if result['success'] else "❌"
                data_icon = "✅" if result['data_valid'] else "⚠️"

                print(f"  {status_icon} {data_icon} {result['name']:<25} | Status: {result['status']}")

                if result['success']:
                    successful_gets += 1
                else:
                    failed_gets.append(result)

                if not result['data_valid']:
                    data_issues_gets.append(result)
            else:
                print(f"  ❌ ❌ Exception: {result}")

        print(f"\nGET Results Summary: {successful_gets}/{len(ENDPOINTS_TO_TEST)} successful")

        if failed_gets:
            print("Failed GET endpoints:")
            for failure in failed_gets:
                print(f"  - {failure['name']}: {failure.get('error', 'HTTP ' + str(failure['status']))}")

        if data_issues_gets:
            print("Data validation issues:")
            for issue in data_issues_gets:
                print(f"  - {issue['name']}: {', '.join(issue['data_issues'])}")

        print()

        # Test 2: POST endpoints
        print("[TEST 2] POST Endpoints Validation")
        print("-" * 50)

        post_tasks = [test_endpoint(session, endpoint) for endpoint in POST_ENDPOINTS]
        post_results = await asyncio.gather(*post_tasks, return_exceptions=True)

        print("POST Endpoint Results:")
        successful_posts = 0
        failed_posts = []

        for result in post_results:
            if isinstance(result, dict):
                status_icon = "✅" if result['success'] else "❌"
                data_icon = "✅" if result['data_valid'] else "⚠️"

                print(f"  {status_icon} {data_icon} {result['name']:<25} | Status: {result['status']}")

                if result['success']:
                    successful_posts += 1
                else:
                    failed_posts.append(result)
            else:
                print(f"  ❌ ❌ Exception: {result}")

        print(f"\nPOST Results Summary: {successful_posts}/{len(POST_ENDPOINTS)} successful")

        if failed_posts:
            print("Failed POST endpoints:")
            for failure in failed_posts:
                print(f"  - {failure['name']}: {failure.get('error', 'HTTP ' + str(failure['status']))}")

        print()

        # Test 3: Settings round-trip test
        print("[TEST 3] Settings Round-Trip Validation")
        print("-" * 50)

        try:
            # Get current settings
            async with session.get(f"{API_BASE}/api/settings") as response:
                original_settings = await response.json()
                print(f"  Original settings loaded: {response.status == 200}")

            # Modify and save settings
            test_settings = {
                "position_size": 0.03,
                "stop_loss": 2.5,
                "take_profit": 5.0,
                "risk_per_trade": 1.5,
                "max_positions": 8
            }

            async with session.post(f"{API_BASE}/api/settings", json=test_settings) as response:
                save_result = await response.json()
                settings_saved = response.status == 200
                print(f"  Settings saved: {settings_saved}")

            # Verify settings were saved correctly
            async with session.get(f"{API_BASE}/api/settings") as response:
                new_settings = await response.json()
                settings_loaded = response.status == 200
                print(f"  Settings reloaded: {settings_loaded}")

            # Validate data integrity
            if settings_saved and settings_loaded:
                data_matches = True
                for key, expected_value in test_settings.items():
                    actual_value = new_settings.get(key)
                    if abs(float(actual_value) - float(expected_value)) > 0.001:
                        data_matches = False
                        print(f"    ⚠️ Mismatch in {key}: expected {expected_value}, got {actual_value}")

                if data_matches:
                    print("  ✅ Settings round-trip successful - all values preserved")
                else:
                    print("  ❌ Settings round-trip failed - data corruption detected")

        except Exception as e:
            print(f"  ❌ Settings round-trip test failed: {e}")

        print()

        # Final assessment
        print("[FINAL ASSESSMENT]")
        print("=" * 50)

        total_endpoints = len(ENDPOINTS_TO_TEST) + len(POST_ENDPOINTS)
        total_successful = successful_gets + successful_posts
        success_rate = (total_successful / total_endpoints) * 100

        print(f"Overall Success Rate: {total_successful}/{total_endpoints} ({success_rate:.1f}%)")

        if success_rate >= 95:
            print("✅ EXCELLENT: Platform is fully functional after blocking fixes")
        elif success_rate >= 90:
            print("✅ GOOD: Platform is mostly functional with minor issues")
        elif success_rate >= 80:
            print("⚠️ ACCEPTABLE: Platform functional but needs attention")
        else:
            print("❌ POOR: Significant issues detected, requires investigation")

        # Check for critical failures
        critical_endpoints = ["/api/health", "/api/account", "/api/settings"]
        critical_failures = [r for r in get_results if isinstance(r, dict) and not r['success'] and any(r['url'].endswith(ep) for ep in critical_endpoints)]

        if critical_failures:
            print("❌ CRITICAL: Core functionality affected")
            for failure in critical_failures:
                print(f"   - {failure['name']} failed")
        else:
            print("✅ CORE FUNCTIONALITY: All critical endpoints operational")

        return total_successful, total_endpoints

if __name__ == "__main__":
    try:
        asyncio.run(run_comprehensive_tests())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test suite failed: {e}")
        sys.exit(1)