import os
import requests
from datetime import datetime, timedelta
from typing import List
from .base_provider import BaseNewsProvider, NewsArticle

class PolygonProvider(BaseNewsProvider):
    def __init__(self):
        self.api_key = os.getenv('POLYGON_API_KEY')
        if not self.api_key:
            raise ValueError("POLYGON_API_KEY not set")
        self.base_url = "https://api.polygon.io"
        self.provider_name = 'polygon'

    def get_company_news(self, symbol: str, days_back: int = 7) -> List[NewsArticle]:
        url = f"{self.base_url}/v2/reference/news"
        params = {
            'ticker': symbol.upper(),
            'limit': 50,
            'apiKey': self.api_key
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if data.get('status') != 'OK':
                print(f"[ERROR] Polygon: {data.get('error', 'Unknown error')}")
                return []

            return [self._transform_article(article, symbol) for article in data.get('results', [])]
        except Exception as e:
            print(f"[ERROR] Polygon error: {e}")
            return []

    def get_market_news(self, category: str = 'general') -> List[NewsArticle]:
        url = f"{self.base_url}/v2/reference/news"
        params = {
            'limit': 50,
            'apiKey': self.api_key
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if data.get('status') != 'OK':
                print(f"[ERROR] Polygon market: {data.get('error', 'Unknown error')}")
                return []

            return [self._transform_article(article) for article in data.get('results', [])]
        except Exception as e:
            print(f"[ERROR] Polygon market news error: {e}")
            return []

    def _transform_article(self, article: dict, symbol: str = None) -> NewsArticle:
        return NewsArticle(
            id=f"polygon_{article['id']}",
            title=article['title'],
            summary=article.get('description', ''),
            source=article.get('publisher', {}).get('name', 'Polygon'),
            url=article['article_url'],
            published_at=article['published_utc'],
            sentiment='neutral',  # Polygon doesn't provide sentiment
            sentiment_score=0.0,
            symbols=article.get('tickers', [symbol] if symbol else []),
            category='general',
            image_url=article.get('image_url'),
            provider=self.provider_name
        )

    def get_provider_name(self) -> str:
        return self.provider_name
