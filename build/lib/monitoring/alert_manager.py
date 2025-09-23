"""
Alert management and notification system for monitoring.
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Callable, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

from .health_checker import HealthStatus, HealthCheckResult
from .performance_monitor import PerformanceMonitor
from ..notifications.notification_manager import (
    NotificationManager,
    NotificationMessage,
    NotificationLevel,
    NotificationType,
)

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    """Alert severity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AlertRule:
    """Alert rule configuration."""

    name: str
    condition: Callable[[Any], bool]
    severity: AlertSeverity
    message_template: str
    cooldown_minutes: int = 5
    max_alerts_per_hour: int = 10
    enabled: bool = True
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class Alert:
    """Alert instance."""

    rule_name: str
    severity: AlertSeverity
    message: str
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    data: Dict[str, Any] = field(default_factory=dict)
    tags: Dict[str, str] = field(default_factory=dict)


class AlertManager:
    """
    Alert management system for health and performance monitoring.
    """

    def __init__(self, notification_manager: Optional[NotificationManager] = None):
        """
        Initialize alert manager.

        Args:
            notification_manager: Notification manager for sending alerts
        """
        self.notification_manager = notification_manager
        self.rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.alert_counts: Dict[str, int] = {}
        self.last_alert_times: Dict[str, datetime] = {}

        # Tracking for cooldowns and rate limiting
        self.hourly_alert_counts: Dict[str, List[datetime]] = {}

        # Register default alert rules
        self._register_default_rules()

    def _register_default_rules(self):
        """Register default alert rules."""
        # System health alerts
        self.add_rule(
            AlertRule(
                name="critical_health_status",
                condition=lambda health_status: health_status == HealthStatus.CRITICAL,
                severity=AlertSeverity.CRITICAL,
                message_template="Critical system health issue detected: {message}",
                cooldown_minutes=1,
                max_alerts_per_hour=20,
            )
        )

        self.add_rule(
            AlertRule(
                name="warning_health_status",
                condition=lambda health_status: health_status == HealthStatus.WARNING,
                severity=AlertSeverity.MEDIUM,
                message_template="System health warning: {message}",
                cooldown_minutes=5,
                max_alerts_per_hour=10,
            )
        )

        # Performance alerts
        self.add_rule(
            AlertRule(
                name="high_cpu_usage",
                condition=lambda cpu_percent: cpu_percent > 90.0,
                severity=AlertSeverity.HIGH,
                message_template="High CPU usage detected: {cpu_percent:.1f}%",
                cooldown_minutes=10,
            )
        )

        self.add_rule(
            AlertRule(
                name="high_memory_usage",
                condition=lambda memory_percent: memory_percent > 90.0,
                severity=AlertSeverity.HIGH,
                message_template="High memory usage detected: {memory_percent:.1f}%",
                cooldown_minutes=10,
            )
        )

        self.add_rule(
            AlertRule(
                name="low_disk_space",
                condition=lambda disk_percent: disk_percent > 95.0,
                severity=AlertSeverity.CRITICAL,
                message_template="Critical disk space: {disk_percent:.1f}% used",
                cooldown_minutes=15,
            )
        )

        # API performance alerts
        self.add_rule(
            AlertRule(
                name="high_response_time",
                condition=lambda avg_response_time: avg_response_time
                > 5000,  # 5 seconds
                severity=AlertSeverity.HIGH,
                message_template="High API response time: {avg_response_time:.0f}ms",
                cooldown_minutes=5,
            )
        )

        self.add_rule(
            AlertRule(
                name="low_success_rate",
                condition=lambda success_rate: success_rate < 95.0,
                severity=AlertSeverity.HIGH,
                message_template="Low API success rate: {success_rate:.1f}%",
                cooldown_minutes=5,
            )
        )

    def add_rule(self, rule: AlertRule):
        """
        Add an alert rule.

        Args:
            rule: Alert rule to add
        """
        self.rules[rule.name] = rule
        logger.info(f"Added alert rule: {rule.name}")

    def remove_rule(self, rule_name: str):
        """
        Remove an alert rule.

        Args:
            rule_name: Name of rule to remove
        """
        if rule_name in self.rules:
            del self.rules[rule_name]
            logger.info(f"Removed alert rule: {rule_name}")

    def enable_rule(self, rule_name: str):
        """Enable an alert rule."""
        if rule_name in self.rules:
            self.rules[rule_name].enabled = True
            logger.info(f"Enabled alert rule: {rule_name}")

    def disable_rule(self, rule_name: str):
        """Disable an alert rule."""
        if rule_name in self.rules:
            self.rules[rule_name].enabled = False
            logger.info(f"Disabled alert rule: {rule_name}")

    async def check_health_alerts(self, health_results: Dict[str, HealthCheckResult]):
        """
        Check health monitoring results for alerts.

        Args:
            health_results: Dictionary of health check results
        """
        for check_name, result in health_results.items():
            # Check for critical health status
            if result.status == HealthStatus.CRITICAL:
                await self._evaluate_rule(
                    "critical_health_status",
                    result.status,
                    {"message": result.message, "check_name": check_name},
                )

            # Check for warning health status
            elif result.status == HealthStatus.WARNING:
                await self._evaluate_rule(
                    "warning_health_status",
                    result.status,
                    {"message": result.message, "check_name": check_name},
                )

            # Check specific resource metrics if available
            if "cpu_percent" in result.details:
                await self._evaluate_rule(
                    "high_cpu_usage",
                    result.details["cpu_percent"],
                    {"cpu_percent": result.details["cpu_percent"]},
                )

            if "memory_percent" in result.details:
                await self._evaluate_rule(
                    "high_memory_usage",
                    result.details["memory_percent"],
                    {"memory_percent": result.details["memory_percent"]},
                )

            if "percent_used" in result.details:
                await self._evaluate_rule(
                    "low_disk_space",
                    result.details["percent_used"],
                    {"disk_percent": result.details["percent_used"]},
                )

    async def check_performance_alerts(self, performance_monitor: PerformanceMonitor):
        """
        Check performance metrics for alerts.

        Args:
            performance_monitor: Performance monitor instance
        """
        # Check API performance metrics
        for endpoint in performance_monitor.request_counts:
            stats = performance_monitor.get_response_time_stats(endpoint)

            if "avg_ms" in stats:
                await self._evaluate_rule(
                    "high_response_time",
                    stats["avg_ms"],
                    {"avg_response_time": stats["avg_ms"], "endpoint": endpoint},
                )

            if "success_rate" in stats:
                await self._evaluate_rule(
                    "low_success_rate",
                    stats["success_rate"],
                    {"success_rate": stats["success_rate"], "endpoint": endpoint},
                )

    async def _evaluate_rule(self, rule_name: str, value: Any, data: Dict[str, Any]):
        """
        Evaluate an alert rule against a value.

        Args:
            rule_name: Name of the rule
            value: Value to check
            data: Additional data for alert context
        """
        if rule_name not in self.rules:
            return

        rule = self.rules[rule_name]

        if not rule.enabled:
            return

        # Check if rule condition is met
        try:
            if not rule.condition(value):
                # Condition not met, resolve alert if active
                await self._resolve_alert(rule_name)
                return
        except Exception as e:
            logger.error(f"Error evaluating rule {rule_name}: {e}")
            return

        # Condition is met, check for cooldown and rate limiting
        if not self._should_trigger_alert(rule_name, rule):
            return

        # Trigger alert
        await self._trigger_alert(rule, data)

    def _should_trigger_alert(self, rule_name: str, rule: AlertRule) -> bool:
        """
        Check if alert should be triggered based on cooldown and rate limits.

        Args:
            rule_name: Name of the rule
            rule: Alert rule

        Returns:
            True if alert should be triggered
        """
        now = datetime.now()

        # Check cooldown
        if rule_name in self.last_alert_times:
            time_since_last = now - self.last_alert_times[rule_name]
            if time_since_last < timedelta(minutes=rule.cooldown_minutes):
                return False

        # Check hourly rate limit
        if rule_name not in self.hourly_alert_counts:
            self.hourly_alert_counts[rule_name] = []

        # Clean old entries (older than 1 hour)
        hour_ago = now - timedelta(hours=1)
        self.hourly_alert_counts[rule_name] = [
            timestamp
            for timestamp in self.hourly_alert_counts[rule_name]
            if timestamp > hour_ago
        ]

        if len(self.hourly_alert_counts[rule_name]) >= rule.max_alerts_per_hour:
            return False

        return True

    async def _trigger_alert(self, rule: AlertRule, data: Dict[str, Any]):
        """
        Trigger an alert.

        Args:
            rule: Alert rule that triggered
            data: Alert data
        """
        now = datetime.now()

        # Format alert message
        try:
            message = rule.message_template.format(**data)
        except KeyError as e:
            message = f"Alert triggered for rule {rule.name}: missing data {e}"

        # Create alert
        alert = Alert(
            rule_name=rule.name,
            severity=rule.severity,
            message=message,
            triggered_at=now,
            data=data,
            tags=rule.tags.copy(),
        )

        # Store alert
        self.active_alerts[rule.name] = alert
        self.alert_history.append(alert)
        self.last_alert_times[rule.name] = now
        self.hourly_alert_counts[rule.name].append(now)

        # Send notification
        if self.notification_manager:
            await self._send_alert_notification(alert)

        logger.warning(f"Alert triggered: {rule.name} - {message}")

    async def _resolve_alert(self, rule_name: str):
        """
        Resolve an active alert.

        Args:
            rule_name: Name of the rule to resolve
        """
        if rule_name in self.active_alerts:
            alert = self.active_alerts.pop(rule_name)
            alert.resolved_at = datetime.now()

            if self.notification_manager:
                await self._send_resolution_notification(alert)

            logger.info(f"Alert resolved: {rule_name}")

    async def _send_alert_notification(self, alert: Alert):
        """
        Send alert notification.

        Args:
            alert: Alert to send notification for
        """
        try:
            # Map alert severity to notification level
            level_mapping = {
                AlertSeverity.LOW: NotificationLevel.INFO,
                AlertSeverity.MEDIUM: NotificationLevel.WARNING,
                AlertSeverity.HIGH: NotificationLevel.ERROR,
                AlertSeverity.CRITICAL: NotificationLevel.CRITICAL,
            }

            notification = NotificationMessage(
                title=f"🚨 {alert.severity.value.upper()} Alert: {alert.rule_name}",
                message=alert.message,
                level=level_mapping[alert.severity],
                notification_type=NotificationType.SYSTEM_ERROR,
                metadata={
                    "alert_rule": alert.rule_name,
                    "severity": alert.severity.value,
                    "triggered_at": alert.triggered_at.isoformat(),
                    "data": alert.data,
                    "tags": alert.tags,
                },
            )

            await self.notification_manager.send_notification(notification)

        except Exception as e:
            logger.error(f"Failed to send alert notification: {e}")

    async def _send_resolution_notification(self, alert: Alert):
        """
        Send alert resolution notification.

        Args:
            alert: Resolved alert
        """
        try:
            notification = NotificationMessage(
                title=f"✅ Alert Resolved: {alert.rule_name}",
                message=f"Alert '{alert.rule_name}' has been resolved after {alert.resolved_at - alert.triggered_at}",
                level=NotificationLevel.INFO,
                notification_type=NotificationType.SYSTEM_STATUS,
                metadata={
                    "alert_rule": alert.rule_name,
                    "severity": alert.severity.value,
                    "triggered_at": alert.triggered_at.isoformat(),
                    "resolved_at": alert.resolved_at.isoformat(),
                    "duration_minutes": (
                        alert.resolved_at - alert.triggered_at
                    ).total_seconds()
                    / 60,
                },
            )

            await self.notification_manager.send_notification(notification)

        except Exception as e:
            logger.error(f"Failed to send resolution notification: {e}")

    def get_active_alerts(self) -> List[Alert]:
        """Get list of active alerts."""
        return list(self.active_alerts.values())

    def get_alert_history(self, hours: int = 24) -> List[Alert]:
        """
        Get alert history for specified time period.

        Args:
            hours: Number of hours to look back

        Returns:
            List of alerts within time period
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [
            alert for alert in self.alert_history if alert.triggered_at >= cutoff_time
        ]

    def get_alert_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive alert summary.

        Returns:
            Alert summary with statistics
        """
        active_alerts = self.get_active_alerts()
        recent_alerts = self.get_alert_history(24)

        # Count alerts by severity
        severity_counts = {severity.value: 0 for severity in AlertSeverity}
        for alert in active_alerts:
            severity_counts[alert.severity.value] += 1

        # Count recent alerts by rule
        rule_counts = {}
        for alert in recent_alerts:
            rule_counts[alert.rule_name] = rule_counts.get(alert.rule_name, 0) + 1

        return {
            "timestamp": datetime.now().isoformat(),
            "active_alerts_count": len(active_alerts),
            "active_alerts_by_severity": severity_counts,
            "recent_alerts_24h": len(recent_alerts),
            "alert_rules_count": len(self.rules),
            "enabled_rules": sum(1 for rule in self.rules.values() if rule.enabled),
            "most_frequent_alerts": dict(
                sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            ),
        }

    def clear_alert_history(self, older_than_days: int = 7):
        """
        Clear old alert history.

        Args:
            older_than_days: Clear alerts older than this many days
        """
        cutoff_time = datetime.now() - timedelta(days=older_than_days)
        original_count = len(self.alert_history)

        self.alert_history = [
            alert for alert in self.alert_history if alert.triggered_at >= cutoff_time
        ]

        cleared_count = original_count - len(self.alert_history)
        logger.info(f"Cleared {cleared_count} old alerts from history")
