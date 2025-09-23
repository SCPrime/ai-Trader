#!/usr/bin/env python3
"""
Simple test dashboard to verify the setup works.
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import uvicorn

app = FastAPI(title="AI Trading Bot - Test Dashboard")

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Trading Bot - Test Dashboard</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .status {
                padding: 10px;
                margin: 10px 0;
                border-radius: 5px;
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }
            .button {
                background: #007bff;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin: 5px;
            }
            .button:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 AI Trading Bot Dashboard</h1>
            <div class="status">
                ✅ Dashboard server is running successfully!
            </div>

            <h2>📊 Test Features</h2>
            <p>This is a test version to verify the dashboard setup is working correctly.</p>

            <button class="button" onclick="testAPI()">Test API Connection</button>
            <button class="button" onclick="window.location.href='/api/test'">API Test Endpoint</button>

            <div id="result" style="margin-top: 20px;"></div>

            <h2>🎯 Next Steps</h2>
            <ol>
                <li>✅ FastAPI server is working</li>
                <li>✅ HTML rendering is working</li>
                <li>✅ Basic styling is working</li>
                <li>🔄 Ready for full dashboard (run <code>python demo_dashboard.py</code>)</li>
            </ol>

            <h2>🌐 Available Endpoints</h2>
            <ul>
                <li><a href="/">/</a> - This test page</li>
                <li><a href="/api/test">/api/test</a> - API test endpoint</li>
                <li><a href="/api/health">/api/health</a> - Health check</li>
            </ul>
        </div>

        <script>
            function testAPI() {
                fetch('/api/test')
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('result').innerHTML =
                            '<div style="background: #d4edda; padding: 10px; border-radius: 5px; color: #155724;">' +
                            '✅ API Test Successful: ' + data.message +
                            '</div>';
                    })
                    .catch(error => {
                        document.getElementById('result').innerHTML =
                            '<div style="background: #f8d7da; padding: 10px; border-radius: 5px; color: #721c24;">' +
                            '❌ API Test Failed: ' + error +
                            '</div>';
                    });
            }
        </script>
    </body>
    </html>
    """

@app.get("/api/test")
async def test_api():
    return {"status": "success", "message": "API is working correctly!"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Trading Bot Dashboard",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    print("Starting AI Trading Bot Test Dashboard")
    print("Test dashboard will be available at: http://localhost:8000")
    print("This is a simplified test to verify the setup works")
    print("Starting server...")

    uvicorn.run(
        app,
        host="127.0.0.1",  # Use localhost instead of 0.0.0.0
        port=8000,
        log_level="info"
    )