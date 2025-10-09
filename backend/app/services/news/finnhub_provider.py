import finnhub
import os
from datetime import datetime, timedelta
from typing import List
from .base_provider import BaseNewsProvider, NewsArticle

class FinnhubProvider(BaseNewsProvider):
    def __init__(self):
        api_key = os.getenv('FINNHUB_API_KEY')
        if not api_key:
            raise ValueError("FINNHUB_API_KEY not set")
        self.client = finnhub.Client(api_key=api_key)
        self.provider_name = 'finnhub'

    def get_company_news(self, symbol: str, days_back: int = 7) -> List[NewsArticle]:
        to_date = datetime.now().strftime('%Y-%m-%d')
        from_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')

        try:
            news = self.client.company_news(symbol.upper(), _from=from_date, to=to_date)
            return [self._transform_article(article, symbol) for article in news]
        except Exception as e:
            print(f"[ERROR] Finnhub error: {e}")
            return []

    def get_market_news(self, category: str = 'general') -> List[NewsArticle]:
        try:
            news = self.client.general_news(category, min_id=0)
            return [self._transform_article(article) for article in news[:50]]
        except Exception as e:
            print(f"[ERROR] Finnhub market news error: {e}")
            return []

    def _transform_article(self, article: dict, symbol: str = None) -> NewsArticle:
        return NewsArticle(
            id=f"finnhub_{article.get('id', hash(article['url']))}",
            title=article['headline'],
            summary=article.get('summary', ''),
            source=article['source'],
            url=article['url'],
            published_at=datetime.fromtimestamp(article['datetime']).isoformat(),
            sentiment=self._calculate_sentiment(article.get('sentiment', 0)),
            sentiment_score=article.get('sentiment', 0),
            symbols=[symbol] if symbol else article.get('related', '').split(','),
            category=article.get('category', 'general'),
            image_url=article.get('image'),
            provider=self.provider_name
        )

    def _calculate_sentiment(self, score: float) -> str:
        if score > 0.3:
            return 'bullish'
        elif score < -0.3:
            return 'bearish'
        else:
            return 'neutral'

    def get_provider_name(self) -> str:
        return self.provider_name
