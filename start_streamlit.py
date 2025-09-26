#!/usr/bin/env python3
"""
Streamlit Dashboard Launcher
"""
import subprocess
import sys
import os

def main():
    print("🚀 Starting AI Trading Bot Streamlit Dashboard...")
    print("=" * 50)
    
    # Check if streamlit is installed
    try:
        import streamlit
        print("✅ Streamlit found")
    except ImportError:
        print("❌ Streamlit not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "streamlit"])
    
    # Check if .env exists
    if os.path.exists(".env"):
        print("✅ Environment file found")
    else:
        print("⚠️  Warning: .env file not found")
    
    print("🌐 Launching dashboard...")
    print("📱 Open your browser to: http://localhost:8501")
    print("🛑 Press Ctrl+C to stop")
    print("=" * 50)
    
    # Launch streamlit
    subprocess.run([
        sys.executable, "-m", "streamlit", "run", 
        "streamlit_dashboard.py", 
        "--server.port=8501",
        "--server.address=0.0.0.0"
    ])

if __name__ == "__main__":
    main()
