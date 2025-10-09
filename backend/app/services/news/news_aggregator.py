from typing import List, Dict, Any
from datetime import datetime
from collections import defaultdict
from difflib import SequenceMatcher

from .finnhub_provider import FinnhubProvider
from .alpha_vantage_provider import AlphaVantageProvider
from .polygon_provider import PolygonProvider
from .base_provider import NewsArticle

class NewsAggregator:
    def __init__(self):
        self.providers = []

        # Try to initialize each provider (fail gracefully if API key missing)
        try:
            self.providers.append(FinnhubProvider())
            print("[OK] Finnhub provider initialized")
        except Exception as e:
            print(f"[WARNING] Finnhub provider skipped: {e}")

        try:
            self.providers.append(AlphaVantageProvider())
            print("[OK] Alpha Vantage provider initialized")
        except Exception as e:
            print(f"[WARNING] Alpha Vantage provider skipped: {e}")

        try:
            self.providers.append(PolygonProvider())
            print("[OK] Polygon provider initialized")
        except Exception as e:
            print(f"[WARNING] Polygon provider skipped: {e}")

        if not self.providers:
            raise ValueError("No news providers available - check API keys!")

    def get_company_news(self, symbol: str, days_back: int = 7) -> List[Dict[str, Any]]:
        """Aggregate news from all providers for a specific company"""
        all_articles = []

        for provider in self.providers:
            try:
                articles = provider.get_company_news(symbol, days_back)
                all_articles.extend(articles)
                print(f"[OK] {provider.get_provider_name()}: {len(articles)} articles")
            except Exception as e:
                print(f"[ERROR] {provider.get_provider_name()} failed: {e}")

        # Deduplicate
        deduplicated = self._deduplicate(all_articles)

        # Aggregate sentiment
        aggregated = self._aggregate_sentiment(deduplicated)

        # Sort by date
        aggregated.sort(key=lambda x: x.published_at, reverse=True)

        print(f"[NEWS] Total: {len(all_articles)} articles -> {len(aggregated)} unique")

        return [article.to_dict() for article in aggregated]

    def get_market_news(self, category: str = 'general', limit: int = 50) -> List[Dict[str, Any]]:
        """Aggregate market news from all providers"""
        all_articles = []

        for provider in self.providers:
            try:
                articles = provider.get_market_news(category)
                all_articles.extend(articles)
                print(f"[OK] {provider.get_provider_name()}: {len(articles)} articles")
            except Exception as e:
                print(f"[ERROR] {provider.get_provider_name()} failed: {e}")

        # Deduplicate
        deduplicated = self._deduplicate(all_articles)

        # Aggregate sentiment
        aggregated = self._aggregate_sentiment(deduplicated)

        # Prioritize
        aggregated = self._prioritize(aggregated)

        print(f"[NEWS] Total: {len(all_articles)} articles -> {len(aggregated)} unique")

        return [article.to_dict() for article in aggregated[:limit]]

    def _deduplicate(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        """Remove duplicate articles based on title similarity"""
        if not articles:
            return []

        groups = []
        used = set()

        for i, article in enumerate(articles):
            if i in used:
                continue

            group = [article]
            used.add(i)

            for j, other in enumerate(articles[i+1:], start=i+1):
                if j in used:
                    continue

                similarity = SequenceMatcher(None, article.title.lower(), other.title.lower()).ratio()

                if similarity > 0.85:
                    group.append(other)
                    used.add(j)

            groups.append(group)

        deduplicated = []
        for group in groups:
            best = max(group, key=lambda x: (
                abs(x.sentiment_score),
                len(x.summary),
                x.published_at
            ))
            deduplicated.append(best)

        return deduplicated

    def _aggregate_sentiment(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        """Average sentiment scores from multiple sources"""
        url_groups = defaultdict(list)
        for article in articles:
            url_groups[article.url].append(article)

        aggregated = []
        for url, group in url_groups.items():
            if len(group) == 1:
                aggregated.append(group[0])
            else:
                avg_score = sum(a.sentiment_score for a in group) / len(group)
                best = max(group, key=lambda x: len(x.summary))
                best.sentiment_score = avg_score
                best.sentiment = self._score_to_label(avg_score)
                best.provider = ', '.join(set(a.provider for a in group))
                aggregated.append(best)

        return aggregated

    def _score_to_label(self, score: float) -> str:
        if score > 0.2:
            return 'bullish'
        elif score < -0.2:
            return 'bearish'
        else:
            return 'neutral'

    def _prioritize(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        """Sort by importance"""
        def priority_score(article: NewsArticle) -> float:
            score = 0.0

            try:
                age_hours = (datetime.now() - datetime.fromisoformat(article.published_at.replace('Z', '+00:00'))).total_seconds() / 3600
                score += max(0, 100 - age_hours)
            except:
                pass

            score += abs(article.sentiment_score) * 50

            if ',' in article.provider:
                score += 30

            score += min(len(article.summary) / 10, 20)

            return score

        articles.sort(key=priority_score, reverse=True)
        return articles
