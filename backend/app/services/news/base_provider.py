from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime

class NewsArticle:
    """Standardized news article format"""
    def __init__(self, **kwargs):
        self.id = kwargs.get('id')
        self.title = kwargs.get('title')
        self.summary = kwargs.get('summary', '')
        self.source = kwargs.get('source')
        self.url = kwargs.get('url')
        self.published_at = kwargs.get('published_at')
        self.sentiment = kwargs.get('sentiment', 'neutral')
        self.sentiment_score = kwargs.get('sentiment_score', 0.0)
        self.symbols = kwargs.get('symbols', [])
        self.category = kwargs.get('category', 'general')
        self.image_url = kwargs.get('image_url')
        self.provider = kwargs.get('provider')

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'title': self.title,
            'summary': self.summary,
            'source': self.source,
            'url': self.url,
            'publishedAt': self.published_at,
            'sentiment': self.sentiment,
            'sentimentScore': self.sentiment_score,
            'symbols': self.symbols,
            'category': self.category,
            'imageUrl': self.image_url,
            'provider': self.provider
        }

class BaseNewsProvider(ABC):
    """Base class for all news providers"""

    @abstractmethod
    def get_company_news(self, symbol: str, days_back: int = 7) -> List[NewsArticle]:
        pass

    @abstractmethod
    def get_market_news(self, category: str = 'general') -> List[NewsArticle]:
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        pass
