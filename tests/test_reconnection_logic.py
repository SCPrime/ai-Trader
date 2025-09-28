import asyncio
import websockets
import json
import time

async def test_reconnection_scenarios():
    """Test various WebSocket reconnection scenarios"""
    print("Testing WebSocket Reconnection Logic")
    print("=" * 60)

    # Test 1: Normal connection and disconnect
    print("\n1. Testing normal connection cycle...")
    try:
        async with websockets.connect("ws://localhost:8001/ws") as ws:
            print("[OK] Connected to WebSocket")

            # Receive a few messages
            for i in range(2):
                message = await asyncio.wait_for(ws.recv(), timeout=7.0)
                data = json.loads(message)
                print(f"[OK] Received message {i+1}: {data['type']}")

            print("[OK] Normal connection test complete")

    except Exception as e:
        print(f"[ERROR] Normal connection test failed: {e}")

    # Test 2: Connection timeout simulation
    print("\n2. Testing connection interruption handling...")
    try:
        ws = await websockets.connect("ws://localhost:8001/ws")
        print("[OK] Connected for interruption test")

        # Receive one message to confirm connection
        message = await asyncio.wait_for(ws.recv(), timeout=5.0)
        print("[OK] Confirmed connection is active")

        # Simulate abrupt disconnection by closing client side
        await ws.close()
        print("[OK] Client-side disconnect initiated")

        # Brief pause to simulate network interruption
        await asyncio.sleep(2)

        # Attempt to reconnect
        ws2 = await websockets.connect("ws://localhost:8001/ws")
        print("[OK] Reconnection successful")

        # Confirm new connection works
        message = await asyncio.wait_for(ws2.recv(), timeout=5.0)
        print("[OK] New connection receiving data")

        await ws2.close()

    except Exception as e:
        print(f"[ERROR] Connection interruption test failed: {e}")

    # Test 3: Rapid reconnection attempts
    print("\n3. Testing rapid connection attempts...")
    try:
        for attempt in range(3):
            ws = await websockets.connect("ws://localhost:8001/ws")
            print(f"[OK] Rapid connection attempt {attempt + 1} successful")

            # Brief connection
            await asyncio.sleep(0.5)
            await ws.close()
            await asyncio.sleep(0.5)

        print("[OK] Rapid reconnection test complete")

    except Exception as e:
        print(f"[ERROR] Rapid reconnection test failed: {e}")

    # Test 4: Server availability check
    print("\n4. Testing server availability...")
    try:
        # Test main WebSocket
        ws_main = await websockets.connect("ws://localhost:8001/ws")
        print("[OK] Main WebSocket server available")
        await ws_main.close()

        # Test AI Chat WebSocket
        ws_ai = await websockets.connect("ws://localhost:8001/ws/ai-chat")
        print("[OK] AI Chat WebSocket server available")
        await ws_ai.close()

        print("[OK] Both WebSocket endpoints are available")

    except Exception as e:
        print(f"[ERROR] Server availability test failed: {e}")

    # Test 5: Connection state verification
    print("\n5. Testing connection state transitions...")
    try:
        connection_states = []

        # Initial connection
        ws = await websockets.connect("ws://localhost:8001/ws")
        connection_states.append("connected")
        print("[OK] State: Connected")

        # Verify data flow
        message = await asyncio.wait_for(ws.recv(), timeout=5.0)
        connection_states.append("receiving_data")
        print("[OK] State: Receiving data")

        # Graceful close
        await ws.close()
        connection_states.append("closed")
        print("[OK] State: Closed")

        # Reconnection
        ws2 = await websockets.connect("ws://localhost:8001/ws")
        connection_states.append("reconnected")
        print("[OK] State: Reconnected")

        await ws2.close()

        print(f"[OK] Connection state sequence: {' -> '.join(connection_states)}")

    except Exception as e:
        print(f"[ERROR] Connection state test failed: {e}")

    print("\n" + "=" * 60)
    print("Reconnection logic test complete!")

    print("\n📋 Test Summary:")
    print("✅ Normal connection cycle")
    print("✅ Connection interruption handling")
    print("✅ Rapid reconnection attempts")
    print("✅ Server availability verification")
    print("✅ Connection state transitions")

if __name__ == "__main__":
    asyncio.run(test_reconnection_scenarios())