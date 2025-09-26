from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
import json
import asyncio
from datetime import datetime

class AITradingAssistant:
    def __init__(self):
        self.context = []
        
    async def process_query(self, user_input):
        """Process user questions about trading"""
        
        # Add context about current positions, market status, etc.
        trading_context = {
            "current_positions": self.get_current_positions(),
            "market_status": self.get_market_status(),
            "recent_trades": self.get_recent_trades()
        }
        
        # Here you can integrate with Claude API or local LLM
        response = await self.generate_response(user_input, trading_context)
        return response
    
    async def generate_response(self, query, context):
        # Implement your AI logic here
        # Could use Claude API, OpenAI, or local model
        pass

# Add to your existing app.py
app = FastAPI()

@app.get("/chat")
async def chat_interface():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI Trading Assistant</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 1200px; 
                margin: 0 auto;
                padding: 20px;
                background: #1a1a1a;
                color: #fff;
            }
            .chat-container {
                display: flex;
                gap: 20px;
                height: 80vh;
            }
            .sidebar {
                width: 300px;
                background: #2a2a2a;
                padding: 20px;
                border-radius: 10px;
            }
            .chat-box {
                flex: 1;
                background: #2a2a2a;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
            }
            #messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            .message {
                margin: 10px 0;
                padding: 10px;
                border-radius: 5px;
            }
            .user-message {
                background: #007bff;
                margin-left: 20%;
            }
            .ai-message {
                background: #444;
                margin-right: 20%;
            }
            .input-area {
                padding: 20px;
                border-top: 1px solid #444;
                display: flex;
                gap: 10px;
            }
            #messageInput {
                flex: 1;
                padding: 10px;
                border-radius: 5px;
                border: none;
                background: #1a1a1a;
                color: #fff;
            }
            button {
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .quick-action {
                display: block;
                width: 100%;
                margin: 5px 0;
                padding: 10px;
                background: #333;
                border: 1px solid #555;
                text-align: left;
            }
            .status-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 5px;
            }
            .online { background: #4CAF50; }
            .offline { background: #f44336; }
        </style>
    </head>
    <body>
        <h1>🤖 AI Trading Assistant</h1>
        <div class="chat-container">
            <div class="sidebar">
                <h3>Quick Actions</h3>
                <button class="quick-action" onclick="sendQuickMessage('What are my current positions?')">
                    📊 Current Positions
                </button>
                <button class="quick-action" onclick="sendQuickMessage('Show me today\'s performance')">
                    📈 Today's Performance
                </button>
                <button class="quick-action" onclick="sendQuickMessage('Analyze SPY')">
                    🔍 Analyze SPY
                </button>
                <button class="quick-action" onclick="sendQuickMessage('What\'s the market sentiment?')">
                    💭 Market Sentiment
                </button>
                <button class="quick-action" onclick="sendQuickMessage('Show recent trades')">
                    📝 Recent Trades
                </button>
                <button class="quick-action" onclick="sendQuickMessage('Explain current strategy')">
                    🎯 Current Strategy
                </button>
                
                <h3>Bot Status</h3>
                <p><span class="status-indicator online"></span> Paper Trading Active</p>
                <p>Account: $100,000</p>
                <p>Today's P/L: +$127.50</p>
            </div>
            
            <div class="chat-box">
                <div id="messages"></div>
                <div class="input-area">
                    <input type="text" id="messageInput" placeholder="Ask about trades, strategies, or market analysis..." />
                    <button onclick="sendMessage()">Send</button>
                </div>
            </div>
        </div>
        
        <script>
            const ws = new WebSocket('ws://localhost:8002/ws-chat');
            const messages = document.getElementById('messages');
            const input = document.getElementById('messageInput');
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                addMessage(data.message, 'ai-message');
            };
            
            function sendMessage() {
                const message = input.value;
                if (message.trim()) {
                    addMessage(message, 'user-message');
                    ws.send(JSON.stringify({message: message}));
                    input.value = '';
                }
            }
            
            function sendQuickMessage(message) {
                input.value = message;
                sendMessage();
            }
            
            function addMessage(text, className) {
                const div = document.createElement('div');
                div.className = 'message ' + className;
                div.textContent = text;
                messages.appendChild(div);
                messages.scrollTop = messages.scrollHeight;
            }
            
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') sendMessage();
            });
            
            // Welcome message
            addMessage('Hello! I\'m your AI trading assistant. I can help you analyze positions, understand strategies, and monitor your paper trading performance. What would you like to know?', 'ai-message');
        </script>
    </body>
    </html>
    """)

@app.websocket("/ws-chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    assistant = AITradingAssistant()
    
    while True:
        data = await websocket.receive_text()
        message_data = json.loads(data)
        
        # Process the message with AI
        response = await assistant.process_query(message_data['message'])
        
        await websocket.send_text(json.dumps({
            'message': response
        }))
