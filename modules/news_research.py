import requests
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime
import finnhub

class NewsResearch:
    """News aggregation and research tools"""

    def __init__(self):
        self.sources = {
            'yahoo': self.get_yahoo_news,
            'benzinga': self.get_benzinga_news,
            'finnhub': self.get_finnhub_news
        }

    def get_news_for_symbol(self, symbol: str, source: str = 'all'):
        """Get news for specific symbol"""
        if source == 'all':
            all_news = {}
            for src, func in self.sources.items():
                all_news[src] = func(symbol)
            return all_news
        return self.sources[source](symbol)

    def get_yahoo_news(self, symbol: str):
        """Yahoo Finance news"""
        url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}"
        feed = feedparser.parse(url)
        return [{
            'title': entry.title,
            'link': entry.link,
            'published': entry.published,
            'summary': entry.summary
        } for entry in feed.entries[:10]]

    def get_benzinga_news(self, symbol: str):
        """Benzinga news API"""
        # Requires API key
        pass

    def get_finnhub_news(self, symbol: str):
        """Finnhub news"""
        # Requires API key
        pass

    def get_earnings_calendar(self, symbol: str):
        """Get earnings dates and estimates"""
        ticker = yf.Ticker(symbol)
        return ticker.calendar

    def get_analyst_ratings(self, symbol: str):
        """Get analyst recommendations"""
        ticker = yf.Ticker(symbol)
        return ticker.recommendations