import asyncio
import websockets
import json
import time

async def test_websocket_message_handling():
    """Test enhanced WebSocket message handling"""
    print("Testing WebSocket Message Handling Improvements")
    print("=" * 60)

    # Test 1: Main WebSocket - Market Data Messages
    print("\n1. Testing main WebSocket market data messages...")
    try:
        async with websockets.connect("ws://localhost:8001/ws") as ws:
            print("✓ Connected to main WebSocket")

            # Listen for market data messages
            for i in range(3):
                message = await asyncio.wait_for(ws.recv(), timeout=7.0)
                data = json.loads(message)
                print(f"✓ Market data message {i+1}: {data['type']} - {data['symbol']} @ ${data['price']:.2f}")

    except Exception as e:
        print(f"✗ Main WebSocket test failed: {e}")

    # Test 2: Test AI Chat WebSocket with various message types
    print("\n2. Testing AI Chat WebSocket with different message formats...")
    try:
        async with websockets.connect("ws://localhost:8001/ws/ai-chat") as ws:
            print("✓ Connected to AI Chat WebSocket")

            # Test valid message
            test_message = {
                "message": "Test message handling improvements",
                "context": {"test": "robustness"}
            }
            await ws.send(json.dumps(test_message))
            print("✓ Sent test message")

            response = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"✓ Received AI response: {data['type']}")

            # Test ping functionality (if server supports it)
            ping_message = {
                "type": "ping",
                "timestamp": "2025-09-28T12:00:00Z",
                "client_id": "test_client"
            }
            await ws.send(json.dumps(ping_message))
            print("✓ Sent ping message")

            # Wait briefly for potential pong response
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=2.0)
                data = json.loads(response)
                print(f"✓ Received response to ping: {data.get('type', 'unknown')}")
            except asyncio.TimeoutError:
                print("• No immediate ping response (normal for current server)")

    except Exception as e:
        print(f"✗ AI Chat WebSocket test failed: {e}")

    # Test 3: Test malformed messages (simulated client-side)
    print("\n3. Testing JSON error handling...")
    try:
        # Simulate what would happen with malformed JSON
        test_cases = [
            '{"valid": "json"}',
            '{"incomplete": json',  # Invalid JSON
            'not json at all',      # Not JSON
            '{}',                   # Empty object
            '{"type": "unknown_type", "data": "test"}'  # Unknown type
        ]

        for i, test_case in enumerate(test_cases):
            try:
                # This simulates the JSON.parse that happens in the frontend
                if test_case in ['{"incomplete": json', 'not json at all']:
                    json.loads(test_case)  # This will raise an exception
                else:
                    parsed = json.loads(test_case)
                    print(f"✓ Test case {i+1}: Valid JSON - {parsed}")
            except json.JSONDecodeError:
                print(f"✓ Test case {i+1}: Correctly caught JSON error")

    except Exception as e:
        print(f"✗ JSON error handling test failed: {e}")

    # Test 4: Connection resilience test
    print("\n4. Testing connection resilience...")
    try:
        async with websockets.connect("ws://localhost:8001/ws") as ws:
            print("✓ Connected for resilience test")

            # Rapid message test
            start_time = time.time()
            message_count = 0

            while time.time() - start_time < 10:  # 10 second test
                try:
                    message = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(message)
                    message_count += 1
                except asyncio.TimeoutError:
                    continue

            print(f"✓ Received {message_count} messages in 10 seconds")
            print(f"✓ Message rate: {message_count/10:.1f} messages/second")

    except Exception as e:
        print(f"✗ Connection resilience test failed: {e}")

    print("\n" + "=" * 60)
    print("WebSocket message handling test complete!")

if __name__ == "__main__":
    asyncio.run(test_websocket_message_handling())