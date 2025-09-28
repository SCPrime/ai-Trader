#!/usr/bin/env python3
"""
In-terminal dashboard for VSCode
Run this in VSCode terminal to monitor without leaving the editor
"""

import os
import time
import json
import requests
from datetime import datetime

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def check_bot_connection():
    """Check if bot is running on localhost:8000"""
    try:
        response = requests.get('http://localhost:8000', timeout=2)
        return True if response.status_code == 200 else False
    except:
        return False

def read_bot_state():
    """Read current bot state"""
    bot_running = check_bot_connection()

    state = {
        'status': 'ONLINE ✅' if bot_running else 'OFFLINE ❌',
        'dashboard_url': 'http://localhost:8000' if bot_running else 'Not available',
        'mode': 'Paper Trading',
        'last_update': datetime.now().strftime('%H:%M:%S')
    }

    # Read current state from StateWriter output
    try:
        if os.path.exists('current_state.json'):
            with open('current_state.json', 'r') as f:
                current_state = json.load(f)
                state['last_action'] = current_state.get('action', 'Unknown')
                state['last_action_time'] = current_state.get('timestamp', 'Unknown')
                state['action_data'] = current_state.get('data', {})
    except:
        state['last_action'] = 'No recent activity'

    # Try to read recent actions
    try:
        if os.path.exists('bot_actions.log'):
            with open('bot_actions.log', 'r') as f:
                lines = f.readlines()[-5:]  # Last 5 actions
                state['recent_actions'] = [line.strip() for line in lines if line.strip()]
        else:
            state['recent_actions'] = ['No actions logged yet']
    except:
        state['recent_actions'] = ['Error reading action log']

    return state

def display_dashboard():
    """Display dashboard in terminal"""
    state = read_bot_state()

    clear_screen()
    print("=" * 70)
    print("🤖 AI TRADING BOT MONITOR - VSCODE INTEGRATED")
    print("=" * 70)
    print(f"Bot Status: {state.get('status')}")
    print(f"Trading Mode: {state.get('mode')}")
    print(f"Dashboard: {state.get('dashboard_url')}")
    print(f"Last Check: {state.get('last_update')}")
    print("-" * 70)

    # Environment check
    env_status = "✅" if os.path.exists('.env') else "❌"
    main_status = "✅" if os.path.exists('main.py') else "❌"
    app_status = "✅" if os.path.exists('app.py') else "❌"

    print("Environment Check:")
    print(f"  .env file: {env_status}")
    print(f"  main.py: {main_status}")
    print(f"  app.py: {app_status}")
    print("-" * 70)

    # Last action
    print("Last Action:")
    print(f"  {state.get('last_action', 'No recent activity')}")
    if state.get('action_data'):
        for key, value in state.get('action_data', {}).items():
            print(f"    {key}: {value}")
    print()

    # Recent actions
    print("Recent Activity:")
    for action in state.get('recent_actions', ['No recent activity']):
        if action.strip():
            print(f"  {action[:65]}...")

    print("-" * 70)
    print("Commands: Ctrl+C to exit | Auto-refreshes every 3 seconds")
    print("To access full dashboard: Open http://localhost:8000 in browser")

def main():
    try:
        while True:
            display_dashboard()
            time.sleep(3)
    except KeyboardInterrupt:
        clear_screen()
        print("🛑 Monitor stopped. Bot continues running.")
        print("Access dashboard: http://localhost:8000")

if __name__ == "__main__":
    main()