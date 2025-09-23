"""
System health monitoring and checks.
"""

import asyncio
import logging
import psutil
import time
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Health check status levels."""

    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


@dataclass
class HealthCheckResult:
    """Result of a health check."""

    name: str
    status: HealthStatus
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    response_time_ms: float = 0.0


@dataclass
class SystemMetrics:
    """System resource metrics."""

    cpu_percent: float
    memory_percent: float
    memory_used_gb: float
    memory_available_gb: float
    disk_percent: float
    disk_free_gb: float
    network_sent_mb: float
    network_recv_mb: float
    process_count: int
    timestamp: datetime = field(default_factory=datetime.now)


class HealthChecker:
    """
    Comprehensive system health monitoring.
    """

    def __init__(self, check_interval: int = 60):
        """
        Initialize health checker.

        Args:
            check_interval: Interval between health checks in seconds
        """
        self.check_interval = check_interval
        self.checks: Dict[str, Callable] = {}
        self.results: Dict[str, HealthCheckResult] = {}
        self.metrics_history: List[SystemMetrics] = []
        self.max_history_size = 1000
        self.is_running = False
        self.check_task: Optional[asyncio.Task] = None

        # System thresholds
        self.cpu_warning_threshold = 80.0
        self.cpu_critical_threshold = 95.0
        self.memory_warning_threshold = 80.0
        self.memory_critical_threshold = 95.0
        self.disk_warning_threshold = 85.0
        self.disk_critical_threshold = 95.0

        # Register default health checks
        self._register_default_checks()

    def _register_default_checks(self):
        """Register default system health checks."""
        self.register_check("system_resources", self._check_system_resources)
        self.register_check("process_health", self._check_process_health)
        self.register_check("disk_space", self._check_disk_space)
        self.register_check("network_connectivity", self._check_network_connectivity)

    def register_check(self, name: str, check_function: Callable):
        """
        Register a health check function.

        Args:
            name: Name of the health check
            check_function: Async function that returns HealthCheckResult
        """
        self.checks[name] = check_function
        logger.info(f"Registered health check: {name}")

    def unregister_check(self, name: str):
        """
        Unregister a health check.

        Args:
            name: Name of the health check to remove
        """
        if name in self.checks:
            del self.checks[name]
            if name in self.results:
                del self.results[name]
            logger.info(f"Unregistered health check: {name}")

    async def run_single_check(self, name: str) -> Optional[HealthCheckResult]:
        """
        Run a single health check.

        Args:
            name: Name of the health check to run

        Returns:
            Health check result or None if check doesn't exist
        """
        if name not in self.checks:
            logger.warning(f"Health check '{name}' not found")
            return None

        start_time = time.time()
        try:
            result = await self.checks[name]()
            result.response_time_ms = (time.time() - start_time) * 1000
            self.results[name] = result
            return result

        except Exception as e:
            error_result = HealthCheckResult(
                name=name,
                status=HealthStatus.CRITICAL,
                message=f"Health check failed: {str(e)}",
                response_time_ms=(time.time() - start_time) * 1000,
            )
            self.results[name] = error_result
            logger.error(f"Health check '{name}' failed: {e}")
            return error_result

    async def run_all_checks(self) -> Dict[str, HealthCheckResult]:
        """
        Run all registered health checks.

        Returns:
            Dictionary of health check results
        """
        tasks = []
        for name in self.checks:
            tasks.append(self.run_single_check(name))

        await asyncio.gather(*tasks, return_exceptions=True)
        return self.results.copy()

    async def start_monitoring(self):
        """Start continuous health monitoring."""
        if self.is_running:
            logger.warning("Health monitoring already running")
            return

        self.is_running = True
        self.check_task = asyncio.create_task(self._monitoring_loop())
        logger.info("Started health monitoring")

    async def stop_monitoring(self):
        """Stop continuous health monitoring."""
        self.is_running = False
        if self.check_task:
            self.check_task.cancel()
            try:
                await self.check_task
            except asyncio.CancelledError:
                pass
        logger.info("Stopped health monitoring")

    async def _monitoring_loop(self):
        """Main monitoring loop."""
        while self.is_running:
            try:
                await self.run_all_checks()
                await self._collect_system_metrics()
                await asyncio.sleep(self.check_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)  # Brief pause before retrying

    async def _collect_system_metrics(self):
        """Collect system resource metrics."""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)

            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used_gb = memory.used / (1024**3)
            memory_available_gb = memory.available / (1024**3)

            # Disk metrics
            disk = psutil.disk_usage("/")
            disk_percent = (disk.used / disk.total) * 100
            disk_free_gb = disk.free / (1024**3)

            # Network metrics
            network = psutil.net_io_counters()
            network_sent_mb = network.bytes_sent / (1024**2)
            network_recv_mb = network.bytes_recv / (1024**2)

            # Process count
            process_count = len(psutil.pids())

            metrics = SystemMetrics(
                cpu_percent=cpu_percent,
                memory_percent=memory_percent,
                memory_used_gb=memory_used_gb,
                memory_available_gb=memory_available_gb,
                disk_percent=disk_percent,
                disk_free_gb=disk_free_gb,
                network_sent_mb=network_sent_mb,
                network_recv_mb=network_recv_mb,
                process_count=process_count,
            )

            self.metrics_history.append(metrics)

            # Trim history to prevent memory growth
            if len(self.metrics_history) > self.max_history_size:
                self.metrics_history = self.metrics_history[-self.max_history_size :]

        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")

    async def _check_system_resources(self) -> HealthCheckResult:
        """Check system resource usage."""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()

            status = HealthStatus.HEALTHY
            messages = []

            # Check CPU
            if cpu_percent >= self.cpu_critical_threshold:
                status = HealthStatus.CRITICAL
                messages.append(f"CPU usage critical: {cpu_percent:.1f}%")
            elif cpu_percent >= self.cpu_warning_threshold:
                status = HealthStatus.WARNING
                messages.append(f"CPU usage high: {cpu_percent:.1f}%")

            # Check memory
            if memory.percent >= self.memory_critical_threshold:
                status = HealthStatus.CRITICAL
                messages.append(f"Memory usage critical: {memory.percent:.1f}%")
            elif memory.percent >= self.memory_warning_threshold:
                if status == HealthStatus.HEALTHY:
                    status = HealthStatus.WARNING
                messages.append(f"Memory usage high: {memory.percent:.1f}%")

            if not messages:
                message = f"System resources healthy (CPU: {cpu_percent:.1f}%, Memory: {memory.percent:.1f}%)"
            else:
                message = "; ".join(messages)

            return HealthCheckResult(
                name="system_resources",
                status=status,
                message=message,
                details={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_used_gb": memory.used / (1024**3),
                    "memory_available_gb": memory.available / (1024**3),
                },
            )

        except Exception as e:
            return HealthCheckResult(
                name="system_resources",
                status=HealthStatus.CRITICAL,
                message=f"Failed to check system resources: {str(e)}",
            )

    async def _check_process_health(self) -> HealthCheckResult:
        """Check process health and resource usage."""
        try:
            current_process = psutil.Process()
            cpu_percent = current_process.cpu_percent()
            memory_info = current_process.memory_info()
            memory_percent = current_process.memory_percent()

            status = HealthStatus.HEALTHY
            message = f"Process healthy (CPU: {cpu_percent:.1f}%, Memory: {memory_percent:.1f}%)"

            # Check if process is using excessive resources
            if cpu_percent > 50.0:
                status = HealthStatus.WARNING
                message = f"Process using high CPU: {cpu_percent:.1f}%"

            if memory_percent > 20.0:
                status = HealthStatus.WARNING
                message = f"Process using high memory: {memory_percent:.1f}%"

            return HealthCheckResult(
                name="process_health",
                status=status,
                message=message,
                details={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory_percent,
                    "memory_rss_mb": memory_info.rss / (1024**2),
                    "memory_vms_mb": memory_info.vms / (1024**2),
                    "pid": current_process.pid,
                    "num_threads": current_process.num_threads(),
                },
            )

        except Exception as e:
            return HealthCheckResult(
                name="process_health",
                status=HealthStatus.CRITICAL,
                message=f"Failed to check process health: {str(e)}",
            )

    async def _check_disk_space(self) -> HealthCheckResult:
        """Check disk space availability."""
        try:
            disk_usage = psutil.disk_usage("/")
            percent_used = (disk_usage.used / disk_usage.total) * 100
            free_gb = disk_usage.free / (1024**3)

            status = HealthStatus.HEALTHY
            if percent_used >= self.disk_critical_threshold:
                status = HealthStatus.CRITICAL
                message = f"Disk space critical: {percent_used:.1f}% used, {free_gb:.1f}GB free"
            elif percent_used >= self.disk_warning_threshold:
                status = HealthStatus.WARNING
                message = (
                    f"Disk space low: {percent_used:.1f}% used, {free_gb:.1f}GB free"
                )
            else:
                message = f"Disk space healthy: {percent_used:.1f}% used, {free_gb:.1f}GB free"

            return HealthCheckResult(
                name="disk_space",
                status=status,
                message=message,
                details={
                    "percent_used": percent_used,
                    "total_gb": disk_usage.total / (1024**3),
                    "used_gb": disk_usage.used / (1024**3),
                    "free_gb": free_gb,
                },
            )

        except Exception as e:
            return HealthCheckResult(
                name="disk_space",
                status=HealthStatus.CRITICAL,
                message=f"Failed to check disk space: {str(e)}",
            )

    async def _check_network_connectivity(self) -> HealthCheckResult:
        """Check network connectivity."""
        try:
            # Simple connectivity check using DNS resolution
            import socket

            socket.setdefaulttimeout(5)

            # Try to resolve a reliable DNS name
            socket.gethostbyname("google.com")

            return HealthCheckResult(
                name="network_connectivity",
                status=HealthStatus.HEALTHY,
                message="Network connectivity healthy",
            )

        except socket.gaierror:
            return HealthCheckResult(
                name="network_connectivity",
                status=HealthStatus.CRITICAL,
                message="Network connectivity failed: DNS resolution error",
            )
        except Exception as e:
            return HealthCheckResult(
                name="network_connectivity",
                status=HealthStatus.CRITICAL,
                message=f"Network connectivity check failed: {str(e)}",
            )

    def get_overall_health(self) -> HealthStatus:
        """
        Get overall system health status.

        Returns:
            Overall health status based on all checks
        """
        if not self.results:
            return HealthStatus.UNKNOWN

        statuses = [result.status for result in self.results.values()]

        if HealthStatus.CRITICAL in statuses:
            return HealthStatus.CRITICAL
        elif HealthStatus.WARNING in statuses:
            return HealthStatus.WARNING
        elif all(status == HealthStatus.HEALTHY for status in statuses):
            return HealthStatus.HEALTHY
        else:
            return HealthStatus.UNKNOWN

    def get_health_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive health summary.

        Returns:
            Dictionary containing health summary
        """
        overall_status = self.get_overall_health()

        # Get latest metrics
        latest_metrics = self.metrics_history[-1] if self.metrics_history else None

        return {
            "overall_status": overall_status.value,
            "timestamp": datetime.now().isoformat(),
            "checks": {
                name: {
                    "status": result.status.value,
                    "message": result.message,
                    "response_time_ms": result.response_time_ms,
                    "timestamp": result.timestamp.isoformat(),
                }
                for name, result in self.results.items()
            },
            "latest_metrics": (
                {
                    "cpu_percent": latest_metrics.cpu_percent,
                    "memory_percent": latest_metrics.memory_percent,
                    "disk_percent": latest_metrics.disk_percent,
                    "process_count": latest_metrics.process_count,
                    "timestamp": latest_metrics.timestamp.isoformat(),
                }
                if latest_metrics
                else None
            ),
            "monitoring_active": self.is_running,
        }

    def get_metrics_history(self, duration_minutes: int = 60) -> List[SystemMetrics]:
        """
        Get system metrics history for specified duration.

        Args:
            duration_minutes: Duration in minutes to retrieve

        Returns:
            List of system metrics within the time window
        """
        cutoff_time = datetime.now() - timedelta(minutes=duration_minutes)
        return [
            metrics
            for metrics in self.metrics_history
            if metrics.timestamp >= cutoff_time
        ]
