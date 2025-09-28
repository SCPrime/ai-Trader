import asyncio
import websockets
import json
import time

async def test_main_websocket():
    """Test the main WebSocket connection"""
    print("Testing main WebSocket connection...")
    try:
        uri = "ws://localhost:8001/ws"
        async with websockets.connect(uri) as websocket:
            print("[OK] Main WebSocket connected successfully!")

            # Wait for messages for a few seconds
            print("Listening for messages...")
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(message)
                print(f"[OK] Received message: {data}")
            except asyncio.TimeoutError:
                print("[WARN] No messages received within 5 seconds (this is normal)")
            except json.JSONDecodeError as e:
                print(f"[WARN] Received non-JSON message: {message}")

    except Exception as e:
        print(f"[ERROR] Main WebSocket connection failed: {e}")

async def test_ai_chat_websocket():
    """Test the AI chat WebSocket connection"""
    print("\nTesting AI chat WebSocket connection...")
    try:
        uri = "ws://localhost:8001/ws/ai-chat"
        async with websockets.connect(uri) as websocket:
            print("[OK] AI Chat WebSocket connected successfully!")

            # Send a test message
            test_message = {
                "message": "Hello, can you help me with trading?",
                "context": {"symbol": "AAPL"}
            }
            await websocket.send(json.dumps(test_message))
            print(f"[OK] Sent test message: {test_message}")

            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                data = json.loads(response)
                print(f"[OK] Received AI response: {data}")
            except asyncio.TimeoutError:
                print("[WARN] No response received within 10 seconds")

    except Exception as e:
        print(f"[ERROR] AI Chat WebSocket connection failed: {e}")

async def main():
    print("WebSocket Connection Test")
    print("=" * 50)

    await test_main_websocket()
    await test_ai_chat_websocket()

    print("\n" + "=" * 50)
    print("WebSocket test complete!")

if __name__ == "__main__":
    asyncio.run(main())