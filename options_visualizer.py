import plotly.graph_objects as go
import numpy as np

class OptionsVisualizer:
    """Visualize option strategies P/L diagrams"""

    def plot_payoff_diagram(self, strategy):
        """Create interactive P/L diagram"""
        stock_prices = np.linspace(
            strategy['min_price'],
            strategy['max_price'],
            100
        )

        payoffs = self.calculate_payoffs(strategy, stock_prices)

        fig = go.Figure()

        # Add payoff line
        fig.add_trace(go.Scatter(
            x=stock_prices,
            y=payoffs,
            mode='lines',
            name='Strategy P/L',
            line=dict(color='blue', width=2)
        ))

        # Add breakeven line
        fig.add_hline(y=0, line_dash="dash", line_color="gray")

        # Add max profit/loss annotations
        fig.add_annotation(
            x=strategy['max_profit_price'],
            y=strategy['max_profit'],
            text=f"Max Profit: ${strategy['max_profit']}"
        )

        fig.update_layout(
            title=f"{strategy['type']} Strategy Payoff",
            xaxis_title="Stock Price at Expiration",
            yaxis_title="Profit/Loss",
            hovermode='x'
        )

        return fig.to_html()

    def calculate_payoffs(self, strategy, prices):
        """Calculate P/L for each price point"""
        payoffs = []
        for price in prices:
            pnl = 0
            for leg in strategy['legs']:
                if leg['type'] == 'call':
                    pnl += self.call_payoff(price, leg)
                elif leg['type'] == 'put':
                    pnl += self.put_payoff(price, leg)
            payoffs.append(pnl)
        return payoffs

    def call_payoff(self, stock_price, leg):
        """Calculate call option payoff"""
        strike = leg['strike']
        premium = leg['premium']
        quantity = leg['quantity']

        if leg['side'] == 'buy':
            return quantity * (max(stock_price - strike, 0) - premium)
        else:  # sell
            return quantity * (premium - max(stock_price - strike, 0))

    def put_payoff(self, stock_price, leg):
        """Calculate put option payoff"""
        strike = leg['strike']
        premium = leg['premium']
        quantity = leg['quantity']

        if leg['side'] == 'buy':
            return quantity * (max(strike - stock_price, 0) - premium)
        else:  # sell
            return quantity * (premium - max(strike - stock_price, 0))