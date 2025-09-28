#!/usr/bin/env python3
"""
Backend Blocking Test - Concurrent Request Monitor
Tests if backend operations block each other by sending multiple concurrent requests
"""

import asyncio
import aiohttp
import time
import sys
from datetime import datetime

# Test configuration
API_BASE = "http://localhost:8001"
CONCURRENT_REQUESTS = 10
TEST_ENDPOINTS = [
    "/api/health",
    "/api/account",
    "/api/positions",
    "/api/settings",
    "/api/quote/AAPL",
    "/api/news",
    "/api/morning-routine"
]

async def test_endpoint(session, endpoint, request_id):
    """Test a single endpoint and measure response time"""
    start_time = time.time()
    endpoint_start = datetime.now()

    try:
        print(f"[{request_id:02d}] {endpoint_start.strftime('%H:%M:%S.%f')[:-3]} Starting: {endpoint}")

        if endpoint == "/api/morning-routine":
            async with session.post(f"{API_BASE}{endpoint}") as response:
                data = await response.json()
        else:
            async with session.get(f"{API_BASE}{endpoint}") as response:
                data = await response.json()

        end_time = time.time()
        endpoint_end = datetime.now()
        duration = (end_time - start_time) * 1000  # Convert to ms

        print(f"[{request_id:02d}] {endpoint_end.strftime('%H:%M:%S.%f')[:-3]} Completed: {endpoint} - {duration:.1f}ms - Status: {response.status}")

        return {
            'endpoint': endpoint,
            'request_id': request_id,
            'duration_ms': duration,
            'status': response.status,
            'start_time': endpoint_start,
            'end_time': endpoint_end,
            'success': response.status == 200
        }

    except Exception as e:
        end_time = time.time()
        endpoint_end = datetime.now()
        duration = (end_time - start_time) * 1000

        print(f"[{request_id:02d}] {endpoint_end.strftime('%H:%M:%S.%f')[:-3]} FAILED: {endpoint} - {duration:.1f}ms - Error: {e}")

        return {
            'endpoint': endpoint,
            'request_id': request_id,
            'duration_ms': duration,
            'status': 'ERROR',
            'start_time': endpoint_start,
            'end_time': endpoint_end,
            'success': False,
            'error': str(e)
        }

async def test_concurrent_requests():
    """Test concurrent requests to detect blocking operations"""
    print(f"\n=== Backend Blocking Test ===")
    print(f"Testing {CONCURRENT_REQUESTS} concurrent requests to detect blocking operations...")
    print(f"Time: {datetime.now().strftime('%H:%M:%S')}")
    print()

    # Create session with timeout
    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:

        # Test 1: Multiple requests to same endpoint
        print("[TEST 1] Multiple requests to same endpoint (blocking detection)")
        print("-" * 60)

        tasks = []
        test_start = time.time()

        for i in range(CONCURRENT_REQUESTS):
            task = test_endpoint(session, "/api/health", i + 1)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)
        test_end = time.time()

        print(f"\nTEST 1 RESULTS:")
        total_duration = (test_end - test_start) * 1000
        successful = sum(1 for r in results if isinstance(r, dict) and r.get('success', False))
        avg_duration = sum(r['duration_ms'] for r in results if isinstance(r, dict)) / len(results)

        print(f"  Total test time: {total_duration:.1f}ms")
        print(f"  Successful requests: {successful}/{CONCURRENT_REQUESTS}")
        print(f"  Average response time: {avg_duration:.1f}ms")

        # Check for blocking (sequential vs parallel execution)
        if total_duration > (avg_duration * CONCURRENT_REQUESTS * 0.5):
            print(f"  [WARNING] POTENTIAL BLOCKING: Total time suggests sequential execution")
        else:
            print(f"  [SUCCESS] PARALLEL EXECUTION: Requests processed concurrently")

        print()

        # Test 2: Mixed endpoint requests
        print("[TEST 2] Mixed endpoint requests (heavy load test)")
        print("-" * 60)

        tasks = []
        test_start = time.time()

        for i in range(len(TEST_ENDPOINTS)):
            endpoint = TEST_ENDPOINTS[i % len(TEST_ENDPOINTS)]
            task = test_endpoint(session, endpoint, i + 1)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)
        test_end = time.time()

        print(f"\nTEST 2 RESULTS:")
        total_duration = (test_end - test_start) * 1000
        successful = sum(1 for r in results if isinstance(r, dict) and r.get('success', False))

        print(f"  Total test time: {total_duration:.1f}ms")
        print(f"  Successful requests: {successful}/{len(TEST_ENDPOINTS)}")

        # Group by endpoint
        endpoint_stats = {}
        for result in results:
            if isinstance(result, dict):
                ep = result['endpoint']
                if ep not in endpoint_stats:
                    endpoint_stats[ep] = []
                endpoint_stats[ep].append(result['duration_ms'])

        print(f"  Endpoint performance:")
        for endpoint, durations in endpoint_stats.items():
            avg_dur = sum(durations) / len(durations)
            print(f"    {endpoint}: {avg_dur:.1f}ms avg")

        print()

        # Test 3: Heavy morning routine with concurrent light requests
        print("[TEST 3] Heavy operation + concurrent light requests")
        print("-" * 60)

        # Start heavy operation (morning routine)
        heavy_task = test_endpoint(session, "/api/morning-routine", 1)

        # Wait a bit then send light requests
        await asyncio.sleep(0.1)

        light_tasks = []
        for i in range(5):
            task = test_endpoint(session, "/api/health", i + 2)
            light_tasks.append(task)

        # Wait for all
        all_results = await asyncio.gather(heavy_task, *light_tasks, return_exceptions=True)

        print(f"\nTEST 3 RESULTS:")
        heavy_result = all_results[0]
        light_results = all_results[1:]

        if isinstance(heavy_result, dict):
            print(f"  Heavy operation (morning-routine): {heavy_result['duration_ms']:.1f}ms")

        light_times = [r['duration_ms'] for r in light_results if isinstance(r, dict)]
        if light_times:
            avg_light = sum(light_times) / len(light_times)
            print(f"  Light operations (health): {avg_light:.1f}ms avg")

            if avg_light > 1000:  # More than 1 second for health check
                print(f"  [WARNING] BLOCKING DETECTED: Light operations delayed by heavy operation")
            else:
                print(f"  [SUCCESS] NON-BLOCKING: Light operations not affected by heavy operation")

        print(f"\n=== Test Complete ===")
        return True

if __name__ == "__main__":
    try:
        asyncio.run(test_concurrent_requests())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)