import os
import requests
from datetime import datetime
from typing import List
from .base_provider import BaseNewsProvider, NewsArticle

class AlphaVantageProvider(BaseNewsProvider):
    def __init__(self):
        self.api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
        if not self.api_key:
            raise ValueError("ALPHA_VANTAGE_API_KEY not set")
        self.provider_name = 'alpha_vantage'

    def get_company_news(self, symbol: str, days_back: int = 7) -> List[NewsArticle]:
        url = "https://www.alphavantage.co/query"
        params = {
            'function': 'NEWS_SENTIMENT',
            'tickers': symbol.upper(),
            'apikey': self.api_key,
            'limit': 50
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if 'feed' not in data:
                print(f"[ERROR] Alpha Vantage: No feed data - {data.get('Note', 'Unknown error')}")
                return []

            return [self._transform_article(article, symbol) for article in data['feed']]
        except Exception as e:
            print(f"[ERROR] Alpha Vantage error: {e}")
            return []

    def get_market_news(self, category: str = 'general') -> List[NewsArticle]:
        url = "https://www.alphavantage.co/query"
        params = {
            'function': 'NEWS_SENTIMENT',
            'apikey': self.api_key,
            'limit': 50,
            'topics': category
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if 'feed' not in data:
                print(f"[ERROR] Alpha Vantage market: {data.get('Note', 'Unknown error')}")
                return []

            return [self._transform_article(article) for article in data['feed']]
        except Exception as e:
            print(f"[ERROR] Alpha Vantage market news error: {e}")
            return []

    def _transform_article(self, article: dict, symbol: str = None) -> NewsArticle:
        sentiment_score = float(article.get('overall_sentiment_score', 0))

        return NewsArticle(
            id=f"alphavantage_{hash(article['url'])}",
            title=article['title'],
            summary=article.get('summary', ''),
            source=article.get('source', 'Unknown'),
            url=article['url'],
            published_at=article['time_published'],
            sentiment=self._calculate_sentiment(sentiment_score),
            sentiment_score=sentiment_score,
            symbols=[t['ticker'] for t in article.get('ticker_sentiment', [])] if not symbol else [symbol],
            category=article.get('category_within_source', 'general'),
            image_url=article.get('banner_image'),
            provider=self.provider_name
        )

    def _calculate_sentiment(self, score: float) -> str:
        if score > 0.15:
            return 'bullish'
        elif score < -0.15:
            return 'bearish'
        else:
            return 'neutral'

    def get_provider_name(self) -> str:
        return self.provider_name
