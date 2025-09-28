from trading_engine_complete import TradingEngine
from news_research import NewsResearch
from options_visualizer import OptionsVisualizer
from settings_manager import SettingsManager

class MainController:
    """Main controller integrating all modules"""

    def __init__(self):
        self.engine = TradingEngine()
        self.news = NewsResearch()
        self.visualizer = OptionsVisualizer()
        self.settings = SettingsManager()

    def execute_trade(self, trade_params):
        """Execute any type of trade"""
        if trade_params['type'] == 'stock':
            return self.engine.trade_stock(**trade_params)
        elif trade_params['type'] == 'option':
            return self.engine.trade_option(**trade_params)
        elif trade_params['type'] == 'multi_leg':
            return self.engine.create_spread(**trade_params)

    def get_market_data(self, symbol):
        """Get comprehensive market data"""
        return {
            'quote': self.engine.api.get_latest_trade(symbol),
            'options': self.engine.get_options_chain(symbol),
            'news': self.news.get_news_for_symbol(symbol),
            'technicals': self.calculate_technicals(symbol)
        }

    def visualize_strategy(self, strategy):
        """Generate strategy visualization"""
        return self.visualizer.plot_payoff_diagram(strategy)

    def update_settings(self, updates):
        """Update system settings"""
        for category, settings in updates.items():
            for key, value in settings.items():
                self.settings.update_setting(category, key, value)