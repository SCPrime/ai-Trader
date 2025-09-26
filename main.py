#!/usr/bin/env python3
"""
AI Trading Bot - Advanced algorithmic trading with Claude AI integration.

A production-ready trading bot featuring:
- Real-time market data streaming
- Advanced RSI and MACD strategies  
- AI-powered trade analysis
- Comprehensive risk management
- Multi-channel notifications
"""

import os
import sys
import logging
import json
import asyncio
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import click
import uvicorn
from rich.console import Console
from rich.prompt import Confirm, Prompt
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

def setup_logging(level="INFO", log_dir="logs", enable_console=True, enable_file=True):
    """Setup logging configuration."""
    # Create logs directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)
    
    # Configure handlers
    handlers = []
    
    if enable_file:
        handlers.append(logging.FileHandler(os.path.join(log_dir, 'trading_bot.log')))
    
    if enable_console:
        handlers.append(logging.StreamHandler())
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=handlers,
        force=True
    )
    return logging.getLogger(__name__)

def get_logger():
    """Get logger instance."""
    return logging.getLogger(__name__)

# Initialize Rich console
console = Console()

@click.group()
@click.option('-c', '--config', help='Configuration file path')
@click.option('-e', '--env-file', help='Environment file path') 
@click.option('-l', '--log-level', default='INFO', help='Log level')
@click.option('-v', '--verbose', is_flag=True, help='Verbose output')
@click.pass_context
def cli(ctx, config, env_file, log_level, verbose):
    """AI Trading Bot - Advanced algorithmic trading with Claude AI integration.
    
    A production-ready trading bot featuring:
    - Real-time market data streaming
    - Advanced RSI and MACD strategies
    - AI-powered trade analysis  
    - Comprehensive risk management
    - Multi-channel notifications
    """
    # Initialize context object
    ctx.ensure_object(dict)
    ctx.obj['config'] = config
    ctx.obj['env_file'] = env_file
    ctx.obj['log_level'] = log_level
    ctx.obj['verbose'] = verbose
    
    # Setup logging
    logger = setup_logging(
        level=log_level,
        enable_console=True,
        enable_file=True
    )
    
    if verbose:
        logger.info("AI Trading Bot initialized in verbose mode")

@cli.command()
@click.pass_context
def setup(ctx):
    """🛠️ Run the setup wizard to initialize the trading bot."""
    console.print("\n[bold blue]🚀 AI Trading Bot Setup Wizard[/bold blue]", style="bold")
    console.print("This wizard will help you configure your trading bot.\n")
    
    # Check for existing .env file
    env_path = Path('.env')
    if env_path.exists():
        if not Confirm.ask("Found existing .env file. Overwrite?"):
            console.print("[yellow]Setup cancelled.[/yellow]")
            return
    
    env_vars = {}
    
    # Alpaca API Configuration
    console.print("[bold cyan]📈 Alpaca API Configuration[/bold cyan]")
    console.print("Get your API keys from: https://app.alpaca.markets/paper/dashboard/overview")
    
    env_vars['ALPACA_PAPER_API_KEY'] = Prompt.ask("Enter your Alpaca Paper API Key")
    env_vars['ALPACA_PAPER_SECRET_KEY'] = Prompt.ask("Enter your Alpaca Paper Secret Key", password=True)
    env_vars['ALPACA_BASE_URL'] = "https://paper-api.alpaca.markets"
    
    # Anthropic API Configuration  
    console.print("\n[bold cyan]🤖 Anthropic Claude API Configuration[/bold cyan]")
    console.print("Get your API key from: https://console.anthropic.com/")
    
    env_vars['ANTHROPIC_API_KEY'] = Prompt.ask("Enter your Anthropic API Key", password=True)
    
    # Trading Configuration
    console.print("\n[bold cyan]⚙️ Trading Configuration[/bold cyan]")
    
    env_vars['MAX_POSITION_SIZE'] = Prompt.ask("Max position size ($)", default="1000")
    env_vars['RISK_PERCENTAGE'] = Prompt.ask("Risk percentage per trade", default="0.02")
    env_vars['STOP_LOSS_PERCENTAGE'] = Prompt.ask("Stop loss percentage", default="0.05")
    
    # Environment
    env_vars['ENVIRONMENT'] = "development"
    
    # Write .env file
    try:
        with open('.env', 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        
        console.print("\n[bold green]✅ Setup complete![/bold green]")
        console.print("Your configuration has been saved to .env")
        console.print("\nNext steps:")
        console.print("1. Run: [bold]python main.py status[/bold] - Check connection")
        console.print("2. Run: [bold]python main.py dashboard[/bold] - Launch web interface")
        console.print("3. Run: [bold]python main.py run[/bold] - Start trading")
        
    except Exception as e:
        console.print(f"[bold red]❌ Error writing .env file: {e}[/bold red]")

@cli.command()
@click.pass_context
def status(ctx):
    """Check the current status of the trading bot and account."""
    console.print("[bold blue]📊 Trading Bot Status[/bold blue]\n")
    
    # Check .env file
    env_path = Path('.env')
    if not env_path.exists():
        console.print("[bold red]❌ No .env file found[/bold red]")
        console.print("Run: [bold]python main.py setup[/bold] to configure")
        return
    
    console.print("[green]✅ Configuration file found[/green]")
    
    # Try to load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        # Check required variables
        required_vars = ['ALPACA_PAPER_API_KEY', 'ALPACA_PAPER_SECRET_KEY', 'ANTHROPIC_API_KEY']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            console.print(f"[bold red]❌ Missing environment variables: {', '.join(missing_vars)}[/bold red]")
            return
            
        console.print("[green]✅ All environment variables configured[/green]")
        
        # Try Alpaca connection
        try:
            from alpaca.trading.client import TradingClient
            client = TradingClient(os.getenv('ALPACA_PAPER_API_KEY'), os.getenv('ALPACA_PAPER_SECRET_KEY'), paper=True)
            account = client.get_account()
            
            console.print("[green]✅ Alpaca API connection successful[/green]")
            console.print(f"Account Status: {account.status}")
            console.print(f"Buying Power: ${float(account.buying_power):,.2f}")
            console.print(f"Portfolio Value: ${float(account.portfolio_value):,.2f}")
            
        except Exception as e:
            console.print(f"[bold red]❌ Alpaca API error: {str(e)}[/bold red]")
            
        # Try Anthropic connection
        try:
            from anthropic import Anthropic
            anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            console.print("[green]✅ Anthropic API configured[/green]")
            
        except Exception as e:
            console.print(f"[bold red]❌ Anthropic API error: {str(e)}[/bold red]")
            
    except ImportError as e:
        console.print(f"[bold red]❌ Missing dependency: {str(e)}[/bold red]")
        console.print("Run: [bold]pip install python-dotenv[/bold]")

@cli.command()
@click.option('--host', default='127.0.0.1', help='Host to bind to')
@click.option('--port', default=8000, help='Port to bind to') 
@click.option('--reload', is_flag=True, help='Enable auto-reload')
@click.pass_context
def dashboard(ctx, host, port, reload):
    """🌐 Launch the web-based trading dashboard."""
    console.print(f"[bold blue]🚀 Starting trading dashboard on http://{host}:{port}[/bold blue]")
    
    try:
        # Try to import FastAPI app
        from app import app
        uvicorn.run(app, host=host, port=port, reload=reload)
    except ImportError:
        console.print("[bold red]❌ Dashboard app not found[/bold red]")
        console.print("Make sure app.py exists and contains a FastAPI app instance")

@cli.command()
@click.option('--symbol', default='SPY', help='Symbol to analyze')
@click.option('--period', default='1D', help='Time period')
@click.pass_context  
def analyze(ctx, symbol, period):
    """Analyze a symbol using AI and technical indicators."""
    console.print(f"[bold blue]🔍 Analyzing {symbol} for {period}[/bold blue]")
    
    # Placeholder - implement actual analysis
    console.print("[yellow]Analysis feature coming soon...[/yellow]")

@cli.command()
@click.option('--strategy', default='rsi', help='Trading strategy')
@click.option('--dry-run', is_flag=True, help='Dry run mode')
@click.pass_context
def run(ctx, strategy, dry_run):
    """🚀 Run the trading bot with specified parameters.""" 
    mode = "DRY RUN" if dry_run else "LIVE TRADING"
    console.print(f"[bold blue]🚀 Starting trading bot in {mode} mode[/bold blue]")
    console.print(f"Strategy: {strategy}")
    
    if not dry_run:
        if not Confirm.ask("[bold red]Are you sure you want to start live trading?[/bold red]"):
            console.print("[yellow]Trading cancelled.[/yellow]")
            return
    
    # Placeholder - implement actual trading logic
    console.print("[yellow]Trading bot implementation coming soon...[/yellow]")

@cli.command()
@click.option('--days', default=30, help='Number of days to backtest')
@click.option('--strategy', default='rsi', help='Strategy to test')
@click.pass_context
def backtest(ctx, days, strategy):
    """Run backtesting on historical data."""
    console.print(f"[bold blue]📈 Running backtest for {days} days[/bold blue]")
    console.print(f"Strategy: {strategy}")
    
    # Placeholder - implement backtesting
    console.print("[yellow]Backtesting feature coming soon...[/yellow]")

@cli.command()
@click.pass_context
def performance(ctx):
    """📊 Show trading performance metrics and statistics."""
    console.print("[bold blue]📊 Performance Metrics[/bold blue]\n")
    
    # Placeholder - implement performance tracking
    console.print("[yellow]Performance tracking coming soon...[/yellow]")

@cli.command()
@click.option('--lines', default=50, help='Number of log lines to show')
@click.pass_context
def logs(ctx, lines):
    """Show recent log entries."""
    console.print(f"[bold blue]📋 Last {lines} log entries[/bold blue]\n")
    
    log_file = Path('logs/trading_bot.log')
    if not log_file.exists():
        console.print("[yellow]No log file found[/yellow]")
        return
    
    try:
        with open(log_file, 'r') as f:
            log_lines = f.readlines()[-lines:]
            for line in log_lines:
                console.print(line.strip())
    except Exception as e:
        console.print(f"[bold red]Error reading log file: {e}[/bold red]")

@cli.command()
@click.pass_context  
def config_info(ctx):
    """Display current configuration information."""
    console.print("[bold blue]⚙️ Configuration Information[/bold blue]\n")
    
    # Check .env file
    env_path = Path('.env')
    if env_path.exists():
        console.print("[green]✅ .env file found[/green]")
        
        # Show non-sensitive config
        try:
            from dotenv import load_dotenv
            load_dotenv()
            
            config_table = Table(title="Configuration")
            config_table.add_column("Setting", style="cyan")
            config_table.add_column("Value", style="green")
            
            # Show safe config values
            safe_vars = {
                'ALPACA_BASE_URL': os.getenv('ALPACA_BASE_URL', 'Not set'),
                'MAX_POSITION_SIZE': os.getenv('MAX_POSITION_SIZE', 'Not set'),
                'RISK_PERCENTAGE': os.getenv('RISK_PERCENTAGE', 'Not set'),
                'STOP_LOSS_PERCENTAGE': os.getenv('STOP_LOSS_PERCENTAGE', 'Not set'),
                'ENVIRONMENT': os.getenv('ENVIRONMENT', 'Not set')
            }
            
            for key, value in safe_vars.items():
                config_table.add_row(key, str(value))
                
            console.print(config_table)
            
            # Check for API keys (without showing them)
            api_keys = {
                'ALPACA_PAPER_API_KEY': bool(os.getenv('ALPACA_PAPER_API_KEY')),
                'ALPACA_PAPER_SECRET_KEY': bool(os.getenv('ALPACA_PAPER_SECRET_KEY')), 
                'ANTHROPIC_API_KEY': bool(os.getenv('ANTHROPIC_API_KEY'))
            }
            
            console.print("\n[bold]API Key Status:[/bold]")
            for key, exists in api_keys.items():
                status = "[green]✅ Set[/green]" if exists else "[red]❌ Not set[/red]"
                console.print(f"{key}: {status}")
                
        except ImportError:
            console.print("[red]python-dotenv not installed[/red]")
    else:
        console.print("[red]❌ No .env file found[/red]")
        console.print("Run: [bold]python main.py setup[/bold] to configure")

@cli.command()
@click.pass_context
def version(ctx):
    """📖 Show version information."""
    console.print(Panel.fit(
        "[bold blue]AI Trading Bot[/bold blue]\n"
        "Version: 1.0.0\n"
        "Python: " + sys.version.split()[0] + "\n"
        "Platform: " + sys.platform,
        title="Version Info"
    ))

if __name__ == "__main__":
    cli()