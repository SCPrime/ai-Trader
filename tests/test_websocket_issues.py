import asyncio
import websockets
import json

async def test_connection_issues():
    """Test various WebSocket connection scenarios"""
    print("Testing WebSocket Connection Issues")
    print("=" * 50)

    # Test 1: Wrong port
    print("\n1. Testing wrong port (should fail)...")
    try:
        async with websockets.connect("ws://localhost:9999/ws", open_timeout=2) as ws:
            print("[ERROR] Should not connect to wrong port")
    except Exception as e:
        print(f"[EXPECTED] Connection failed: {type(e).__name__}")

    # Test 2: Wrong path
    print("\n2. Testing wrong path (should fail)...")
    try:
        async with websockets.connect("ws://localhost:8001/wrong-path", open_timeout=2) as ws:
            print("[ERROR] Should not connect to wrong path")
    except Exception as e:
        print(f"[EXPECTED] Connection failed: {type(e).__name__}")

    # Test 3: Correct connection (should work)
    print("\n3. Testing correct connection (should work)...")
    try:
        async with websockets.connect("ws://localhost:8001/ws", open_timeout=5) as ws:
            print("[OK] Correct connection successful")

            # Receive one message to verify it's working
            message = await asyncio.wait_for(ws.recv(), timeout=6.0)
            data = json.loads(message)
            print(f"[OK] Received data: {data['type']} for {data['symbol']}")

    except Exception as e:
        print(f"[ERROR] Unexpected failure: {e}")

    # Test 4: AI Chat endpoint
    print("\n4. Testing AI Chat WebSocket...")
    try:
        async with websockets.connect("ws://localhost:8001/ws/ai-chat", open_timeout=5) as ws:
            print("[OK] AI Chat WebSocket connected")

            # Send test message
            test_msg = {"message": "Test connection", "context": {}}
            await ws.send(json.dumps(test_msg))

            response = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"[OK] AI responded: {data['message'][:50]}...")

    except Exception as e:
        print(f"[ERROR] AI Chat connection failed: {e}")

    print("\n" + "=" * 50)
    print("Connection issue testing complete!")

if __name__ == "__main__":
    asyncio.run(test_connection_issues())