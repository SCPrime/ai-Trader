"""
Performance monitoring and metrics collection.
"""

import asyncio
import logging
import time
from typing import Dict, List, Any, Optional, DefaultDict
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, deque
import json

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetric:
    """Single performance metric measurement."""

    name: str
    value: float
    unit: str
    timestamp: datetime = field(default_factory=datetime.now)
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class TimingContext:
    """Context for timing operations."""

    name: str
    start_time: float
    tags: Dict[str, str] = field(default_factory=dict)


class PerformanceMonitor:
    """
    Performance monitoring and metrics collection system.
    """

    def __init__(self, max_metrics_per_type: int = 1000):
        """
        Initialize performance monitor.

        Args:
            max_metrics_per_type: Maximum metrics to store per metric type
        """
        self.max_metrics_per_type = max_metrics_per_type
        self.metrics: DefaultDict[str, deque] = defaultdict(
            lambda: deque(maxlen=max_metrics_per_type)
        )
        self.counters: DefaultDict[str, int] = defaultdict(int)
        self.gauges: Dict[str, float] = {}
        self.timing_contexts: Dict[str, TimingContext] = {}

        # Performance statistics
        self.request_counts: DefaultDict[str, int] = defaultdict(int)
        self.error_counts: DefaultDict[str, int] = defaultdict(int)
        self.response_times: DefaultDict[str, List[float]] = defaultdict(list)

    def record_metric(
        self,
        name: str,
        value: float,
        unit: str = "count",
        tags: Optional[Dict[str, str]] = None,
    ):
        """
        Record a performance metric.

        Args:
            name: Metric name
            value: Metric value
            unit: Unit of measurement
            tags: Optional tags for metric classification
        """
        metric = PerformanceMetric(name=name, value=value, unit=unit, tags=tags or {})

        self.metrics[name].append(metric)
        logger.debug(f"Recorded metric: {name}={value} {unit}")

    def increment_counter(
        self, name: str, increment: int = 1, tags: Optional[Dict[str, str]] = None
    ):
        """
        Increment a counter metric.

        Args:
            name: Counter name
            increment: Amount to increment
            tags: Optional tags
        """
        self.counters[name] += increment
        self.record_metric(name, self.counters[name], "count", tags)

    def set_gauge(
        self,
        name: str,
        value: float,
        unit: str = "value",
        tags: Optional[Dict[str, str]] = None,
    ):
        """
        Set a gauge metric value.

        Args:
            name: Gauge name
            value: Gauge value
            unit: Unit of measurement
            tags: Optional tags
        """
        self.gauges[name] = value
        self.record_metric(name, value, unit, tags)

    def start_timing(self, name: str, tags: Optional[Dict[str, str]] = None) -> str:
        """
        Start timing an operation.

        Args:
            name: Operation name
            tags: Optional tags

        Returns:
            Timing context ID
        """
        context_id = f"{name}_{int(time.time() * 1000000)}"
        self.timing_contexts[context_id] = TimingContext(
            name=name, start_time=time.time(), tags=tags or {}
        )
        return context_id

    def end_timing(self, context_id: str):
        """
        End timing an operation and record the duration.

        Args:
            context_id: Timing context ID from start_timing
        """
        if context_id not in self.timing_contexts:
            logger.warning(f"Timing context {context_id} not found")
            return

        context = self.timing_contexts.pop(context_id)
        duration = time.time() - context.start_time

        self.record_metric(
            f"{context.name}_duration",
            duration * 1000,  # Convert to milliseconds
            "ms",
            context.tags,
        )

        # Store response time for statistics
        self.response_times[context.name].append(duration * 1000)

        # Trim response times to prevent memory growth
        if len(self.response_times[context.name]) > 1000:
            self.response_times[context.name] = self.response_times[context.name][
                -1000:
            ]

    def timing_context(self, name: str, tags: Optional[Dict[str, str]] = None):
        """
        Context manager for timing operations.

        Args:
            name: Operation name
            tags: Optional tags

        Example:
            with monitor.timing_context("api_call"):
                # Code to time
                await some_operation()
        """
        return TimingContextManager(self, name, tags)

    def record_request(
        self,
        endpoint: str,
        success: bool = True,
        response_time_ms: Optional[float] = None,
    ):
        """
        Record API request metrics.

        Args:
            endpoint: API endpoint
            success: Whether request was successful
            response_time_ms: Response time in milliseconds
        """
        self.request_counts[endpoint] += 1

        if not success:
            self.error_counts[endpoint] += 1

        if response_time_ms is not None:
            self.response_times[endpoint].append(response_time_ms)
            self.record_metric(f"{endpoint}_response_time", response_time_ms, "ms")

        # Record success rate
        total_requests = self.request_counts[endpoint]
        error_count = self.error_counts[endpoint]
        success_rate = ((total_requests - error_count) / total_requests) * 100

        self.set_gauge(f"{endpoint}_success_rate", success_rate, "percent")

    def get_metric_summary(
        self, name: str, duration_minutes: int = 60
    ) -> Dict[str, Any]:
        """
        Get summary statistics for a metric.

        Args:
            name: Metric name
            duration_minutes: Time window for analysis

        Returns:
            Summary statistics
        """
        if name not in self.metrics:
            return {"error": f"Metric {name} not found"}

        cutoff_time = datetime.now() - timedelta(minutes=duration_minutes)
        recent_metrics = [m for m in self.metrics[name] if m.timestamp >= cutoff_time]

        if not recent_metrics:
            return {"error": f"No recent data for metric {name}"}

        values = [m.value for m in recent_metrics]

        return {
            "name": name,
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "avg": sum(values) / len(values),
            "latest": values[-1] if values else None,
            "unit": recent_metrics[-1].unit if recent_metrics else "unknown",
            "timespan_minutes": duration_minutes,
            "first_timestamp": recent_metrics[0].timestamp.isoformat(),
            "last_timestamp": recent_metrics[-1].timestamp.isoformat(),
        }

    def get_response_time_stats(self, endpoint: str) -> Dict[str, Any]:
        """
        Get response time statistics for an endpoint.

        Args:
            endpoint: API endpoint

        Returns:
            Response time statistics
        """
        if endpoint not in self.response_times or not self.response_times[endpoint]:
            return {"error": f"No response time data for {endpoint}"}

        times = self.response_times[endpoint]
        times.sort()

        count = len(times)
        avg = sum(times) / count

        # Calculate percentiles
        p50_idx = int(count * 0.5)
        p95_idx = int(count * 0.95)
        p99_idx = int(count * 0.99)

        return {
            "endpoint": endpoint,
            "count": count,
            "min_ms": min(times),
            "max_ms": max(times),
            "avg_ms": avg,
            "p50_ms": times[p50_idx] if p50_idx < count else None,
            "p95_ms": times[p95_idx] if p95_idx < count else None,
            "p99_ms": times[p99_idx] if p99_idx < count else None,
            "total_requests": self.request_counts[endpoint],
            "error_count": self.error_counts[endpoint],
            "success_rate": (
                (
                    (self.request_counts[endpoint] - self.error_counts[endpoint])
                    / self.request_counts[endpoint]
                    * 100
                )
                if self.request_counts[endpoint] > 0
                else 0
            ),
        }

    def get_all_metrics_summary(self) -> Dict[str, Any]:
        """
        Get summary of all metrics.

        Returns:
            Comprehensive metrics summary
        """
        summary = {
            "timestamp": datetime.now().isoformat(),
            "metric_types": list(self.metrics.keys()),
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "active_timings": len(self.timing_contexts),
            "endpoint_stats": {},
        }

        # Add endpoint statistics
        for endpoint in self.request_counts:
            summary["endpoint_stats"][endpoint] = self.get_response_time_stats(endpoint)

        return summary

    def export_metrics(self, format_type: str = "json") -> str:
        """
        Export metrics in specified format.

        Args:
            format_type: Export format ('json', 'prometheus')

        Returns:
            Exported metrics string
        """
        if format_type == "json":
            return self._export_json()
        elif format_type == "prometheus":
            return self._export_prometheus()
        else:
            raise ValueError(f"Unsupported export format: {format_type}")

    def _export_json(self) -> str:
        """Export metrics as JSON."""
        export_data = {
            "timestamp": datetime.now().isoformat(),
            "metrics": {},
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
        }

        # Export recent metrics (last hour)
        cutoff_time = datetime.now() - timedelta(hours=1)

        for name, metric_deque in self.metrics.items():
            recent_metrics = [
                {
                    "value": m.value,
                    "unit": m.unit,
                    "timestamp": m.timestamp.isoformat(),
                    "tags": m.tags,
                }
                for m in metric_deque
                if m.timestamp >= cutoff_time
            ]

            if recent_metrics:
                export_data["metrics"][name] = recent_metrics

        return json.dumps(export_data, indent=2)

    def _export_prometheus(self) -> str:
        """Export metrics in Prometheus format."""
        lines = []

        # Export counters
        for name, value in self.counters.items():
            lines.append(f"# TYPE {name} counter")
            lines.append(f"{name} {value}")

        # Export gauges
        for name, value in self.gauges.items():
            lines.append(f"# TYPE {name} gauge")
            lines.append(f"{name} {value}")

        # Export recent metric values
        cutoff_time = datetime.now() - timedelta(minutes=5)

        for name, metric_deque in self.metrics.items():
            recent_metrics = [m for m in metric_deque if m.timestamp >= cutoff_time]
            if recent_metrics:
                latest_metric = recent_metrics[-1]
                lines.append(f"# TYPE {name} gauge")

                # Add tags if present
                if latest_metric.tags:
                    tag_pairs = [f'{k}="{v}"' for k, v in latest_metric.tags.items()]
                    tag_string = "{" + ",".join(tag_pairs) + "}"
                    lines.append(f"{name}{tag_string} {latest_metric.value}")
                else:
                    lines.append(f"{name} {latest_metric.value}")

        return "\n".join(lines)

    def reset_metrics(self):
        """Reset all metrics and counters."""
        self.metrics.clear()
        self.counters.clear()
        self.gauges.clear()
        self.timing_contexts.clear()
        self.request_counts.clear()
        self.error_counts.clear()
        self.response_times.clear()
        logger.info("Performance metrics reset")

    def get_system_performance_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive system performance summary.

        Returns:
            System performance summary
        """
        # Calculate average response times across all endpoints
        all_response_times = []
        for times in self.response_times.values():
            all_response_times.extend(times)

        avg_response_time = (
            sum(all_response_times) / len(all_response_times)
            if all_response_times
            else 0
        )

        # Calculate total requests and errors
        total_requests = sum(self.request_counts.values())
        total_errors = sum(self.error_counts.values())
        overall_success_rate = (
            ((total_requests - total_errors) / total_requests * 100)
            if total_requests > 0
            else 0
        )

        return {
            "timestamp": datetime.now().isoformat(),
            "total_requests": total_requests,
            "total_errors": total_errors,
            "overall_success_rate": overall_success_rate,
            "avg_response_time_ms": avg_response_time,
            "active_endpoints": len(self.request_counts),
            "total_metric_types": len(self.metrics),
            "total_counters": len(self.counters),
            "total_gauges": len(self.gauges),
        }


class TimingContextManager:
    """Context manager for timing operations."""

    def __init__(
        self,
        monitor: PerformanceMonitor,
        name: str,
        tags: Optional[Dict[str, str]] = None,
    ):
        self.monitor = monitor
        self.name = name
        self.tags = tags
        self.context_id = None

    def __enter__(self):
        self.context_id = self.monitor.start_timing(self.name, self.tags)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.context_id:
            self.monitor.end_timing(self.context_id)


# Global performance monitor instance
performance_monitor = PerformanceMonitor()
