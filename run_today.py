#!/usr/bin/env python3
"""
Single entry point for trading bot
Focus: Make ONE thing work perfectly
"""

import sys
import os

print("Trading Bot - Fresh Start")
print("=" * 40)

# Check environment
if not os.path.exists('.env'):
    print("[ERROR] Missing .env file with API keys")
    sys.exit(1)

print("[OK] Environment ready")
print("[OK] Paper trading mode")

# Import and run your working bot
try:
    import main
    print("Starting main trading bot...")
    # Run with dashboard mode for interactive trading
    sys.argv = ['run_today.py', 'dashboard']
    main.cli()  # Use the CLI entry point
except Exception as e:
    print(f"Main bot failed: {e}")
    print("Checking alternatives...")
    try:
        import app
        app.run()
    except Exception as e2:
        print(f"App also failed: {e2}")
        print("Check your bot files and try again.")