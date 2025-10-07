"""
Trading Scheduler Service (Simplified - File-based)
Handles automated execution of trading routines using APScheduler
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List
import logging
import asyncio
import json
from pathlib import Path
import uuid

logger = logging.getLogger(__name__)

# Data storage paths
SCHEDULES_DIR = Path("data/schedules")
EXECUTIONS_DIR = Path("data/executions")
APPROVALS_DIR = Path("data/approvals")

# Ensure directories exist
SCHEDULES_DIR.mkdir(parents=True, exist_ok=True)
EXECUTIONS_DIR.mkdir(parents=True, exist_ok=True)
APPROVALS_DIR.mkdir(parents=True, exist_ok=True)


class TradingScheduler:
    """Main scheduler service for automated trading operations"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler(
            job_defaults={
                'coalesce': True,  # Combine missed runs
                'max_instances': 1,  # Prevent concurrent runs
                'misfire_grace_time': 300  # 5 minute grace period
            }
        )
        self.running = False

    def start(self):
        """Start the scheduler"""
        if not self.running:
            self.scheduler.start()
            self.running = True
            logger.info("Trading scheduler started")
            # Load and restore all enabled schedules
            self._restore_schedules()

    def shutdown(self):
        """Gracefully shutdown the scheduler"""
        if self.running:
            self.scheduler.shutdown(wait=True)
            self.running = False
            logger.info("Trading scheduler stopped")

    def _restore_schedules(self):
        """Restore all enabled schedules from storage"""
        try:
            for schedule_file in SCHEDULES_DIR.glob("*.json"):
                with open(schedule_file, 'r') as f:
                    schedule = json.load(f)
                    if schedule.get('enabled', False):
                        asyncio.create_task(self.add_schedule(
                            schedule_id=schedule['id'],
                            schedule_type=schedule['type'],
                            cron_expression=schedule['cron_expression'],
                            timezone=schedule['timezone'],
                            requires_approval=schedule['requires_approval']
                        ))
            logger.info("Schedules restored from storage")
        except Exception as e:
            logger.error(f"Failed to restore schedules: {str(e)}")

    async def add_schedule(
        self,
        schedule_id: str,
        schedule_type: str,
        cron_expression: str,
        timezone: str,
        requires_approval: bool
    ):
        """Add a new scheduled job"""
        try:
            # Parse cron expression
            trigger = CronTrigger.from_crontab(cron_expression, timezone=timezone)

            # Determine which function to call based on type
            job_func = self._get_job_function(schedule_type)

            # Add job to scheduler
            self.scheduler.add_job(
                job_func,
                trigger=trigger,
                id=schedule_id,
                args=[schedule_id, requires_approval],
                replace_existing=True,
                name=f"{schedule_type}_{schedule_id}"
            )

            logger.info(f"Schedule {schedule_id} added: {schedule_type} with cron {cron_expression}")
            return True

        except Exception as e:
            logger.error(f"Failed to add schedule {schedule_id}: {str(e)}")
            raise

    async def remove_schedule(self, schedule_id: str):
        """Remove a scheduled job"""
        try:
            self.scheduler.remove_job(schedule_id)
            logger.info(f"Schedule {schedule_id} removed")
            return True
        except Exception as e:
            logger.error(f"Failed to remove schedule {schedule_id}: {str(e)}")
            return False

    async def pause_schedule(self, schedule_id: str):
        """Pause a scheduled job"""
        try:
            self.scheduler.pause_job(schedule_id)
            logger.info(f"Schedule {schedule_id} paused")
            return True
        except Exception as e:
            logger.error(f"Failed to pause schedule {schedule_id}: {str(e)}")
            return False

    async def resume_schedule(self, schedule_id: str):
        """Resume a paused job"""
        try:
            self.scheduler.resume_job(schedule_id)
            logger.info(f"Schedule {schedule_id} resumed")
            return True
        except Exception as e:
            logger.error(f"Failed to resume schedule {schedule_id}: {str(e)}")
            return False

    async def pause_all(self):
        """Pause all scheduled jobs (emergency stop)"""
        try:
            self.scheduler.pause()
            logger.warning("ALL SCHEDULES PAUSED - Emergency stop activated")
            return True
        except Exception as e:
            logger.error(f"Failed to pause all schedules: {str(e)}")
            return False

    async def resume_all(self):
        """Resume all paused jobs"""
        try:
            self.scheduler.resume()
            logger.info("All schedules resumed")
            return True
        except Exception as e:
            logger.error(f"Failed to resume all schedules: {str(e)}")
            return False

    def get_schedule_info(self, schedule_id: str) -> Optional[Dict]:
        """Get information about a specific schedule"""
        try:
            job = self.scheduler.get_job(schedule_id)
            if job:
                return {
                    'id': job.id,
                    'name': job.name,
                    'next_run': job.next_run_time.isoformat() if job.next_run_time else None,
                    'trigger': str(job.trigger)
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get schedule info for {schedule_id}: {str(e)}")
            return None

    def _get_job_function(self, schedule_type: str):
        """Map schedule type to execution function"""
        job_map = {
            'morning_routine': self._execute_morning_routine,
            'news_review': self._execute_news_review,
            'ai_recs': self._execute_ai_recommendations,
            'custom': self._execute_custom_action
        }
        return job_map.get(schedule_type, self._execute_custom_action)

    # ========================
    # Execution Functions
    # ========================

    async def _execute_morning_routine(self, schedule_id: str, requires_approval: bool):
        """Execute morning routine workflow"""
        execution_id = await self._create_execution_record(schedule_id, 'morning_routine')

        try:
            logger.info(f"Executing morning routine for schedule {schedule_id}")

            # Generate mock recommendations for testing
            recommendations = [
                {
                    'action': 'buy',
                    'symbol': 'AAPL',
                    'quantity': 10,
                    'price': 150.0,
                    'value': 1500.0,
                    'reason': 'Strong technical breakout with positive news sentiment',
                    'risk_score': 3,
                    'confidence': 0.85,
                    'supporting_data': {
                        'technical_signals': ['RSI oversold', 'MACD bullish crossover'],
                        'news_sentiment': 0.7,
                        'volatility': 0.2
                    }
                }
            ]

            if requires_approval and recommendations:
                await self._create_approval_requests(
                    execution_id, recommendations, schedule_id
                )
                result = f"Generated {len(recommendations)} recommendations pending approval"
            else:
                result = f"Executed {len(recommendations)} trades automatically"

            await self._complete_execution(execution_id, 'completed', result)
            logger.info(f"Morning routine completed for schedule {schedule_id}")

        except Exception as e:
            logger.error(f"Morning routine failed for schedule {schedule_id}: {str(e)}")
            await self._complete_execution(execution_id, 'failed', None, str(e))

    async def _execute_news_review(self, schedule_id: str, requires_approval: bool):
        """Execute news review workflow"""
        execution_id = await self._create_execution_record(schedule_id, 'news_review')

        try:
            logger.info(f"Executing news review for schedule {schedule_id}")

            # Mock news-based signals
            signals = []

            if requires_approval and signals:
                await self._create_approval_requests(
                    execution_id, signals, schedule_id
                )
                result = f"Generated {len(signals)} signals pending approval"
            else:
                result = f"No actionable news signals found"

            await self._complete_execution(execution_id, 'completed', result)

        except Exception as e:
            logger.error(f"News review failed for schedule {schedule_id}: {str(e)}")
            await self._complete_execution(execution_id, 'failed', None, str(e))

    async def _execute_ai_recommendations(self, schedule_id: str, requires_approval: bool):
        """Execute AI recommendations check"""
        execution_id = await self._create_execution_record(schedule_id, 'ai_recs')

        try:
            logger.info(f"Executing AI recommendations for schedule {schedule_id}")

            # Mock AI recommendations
            recommendations = []

            if requires_approval and recommendations:
                await self._create_approval_requests(
                    execution_id, recommendations, schedule_id
                )
                result = f"Generated {len(recommendations)} high-confidence recs pending approval"
            else:
                result = f"No high-confidence recommendations at this time"

            await self._complete_execution(execution_id, 'completed', result)

        except Exception as e:
            logger.error(f"AI recommendations failed for schedule {schedule_id}: {str(e)}")
            await self._complete_execution(execution_id, 'failed', None, str(e))

    async def _execute_custom_action(self, schedule_id: str, requires_approval: bool):
        """Execute custom scheduled action"""
        execution_id = await self._create_execution_record(schedule_id, 'custom')

        try:
            logger.info(f"Executing custom action for schedule {schedule_id}")
            result = "Custom action completed"
            await self._complete_execution(execution_id, 'completed', result)

        except Exception as e:
            logger.error(f"Custom action failed for schedule {schedule_id}: {str(e)}")
            await self._complete_execution(execution_id, 'failed', None, str(e))

    # ========================
    # Helper Functions
    # ========================

    async def _create_execution_record(self, schedule_id: str, execution_type: str) -> str:
        """Create execution record in file storage"""
        execution_id = str(uuid.uuid4())

        # Load schedule info
        schedule_file = SCHEDULES_DIR / f"{schedule_id}.json"
        schedule_name = "Unknown"
        if schedule_file.exists():
            with open(schedule_file, 'r') as f:
                schedule = json.load(f)
                schedule_name = schedule.get('name', 'Unknown')

        execution = {
            'id': execution_id,
            'schedule_id': schedule_id,
            'schedule_name': schedule_name,
            'execution_type': execution_type,
            'status': 'running',
            'started_at': datetime.utcnow().isoformat(),
            'completed_at': None,
            'result': None,
            'error': None
        }

        with open(EXECUTIONS_DIR / f"{execution_id}.json", 'w') as f:
            json.dump(execution, f, indent=2)

        return execution_id

    async def _complete_execution(
        self,
        execution_id: str,
        status: str,
        result: Optional[str],
        error: Optional[str] = None
    ):
        """Update execution record with completion status"""
        execution_file = EXECUTIONS_DIR / f"{execution_id}.json"

        if execution_file.exists():
            with open(execution_file, 'r') as f:
                execution = json.load(f)

            execution.update({
                'status': status,
                'completed_at': datetime.utcnow().isoformat(),
                'result': result,
                'error': error
            })

            with open(execution_file, 'w') as f:
                json.dump(execution, f, indent=2)

    async def _create_approval_requests(
        self,
        execution_id: str,
        recommendations: list,
        schedule_id: str
    ):
        """Create approval requests for trades"""
        # Load schedule info
        schedule_file = SCHEDULES_DIR / f"{schedule_id}.json"
        schedule_name = "Unknown"
        if schedule_file.exists():
            with open(schedule_file, 'r') as f:
                schedule = json.load(f)
                schedule_name = schedule.get('name', 'Unknown')

        for rec in recommendations:
            approval_id = str(uuid.uuid4())
            approval = {
                'id': approval_id,
                'execution_id': execution_id,
                'schedule_id': schedule_id,
                'schedule_name': schedule_name,
                'trade_type': rec['action'],
                'symbol': rec['symbol'],
                'quantity': rec['quantity'],
                'estimated_price': rec.get('price', 0),
                'estimated_value': rec.get('value', 0),
                'reason': rec.get('reason', ''),
                'risk_score': rec.get('risk_score', 5),
                'ai_confidence': rec.get('confidence', 0.5) * 100,
                'supporting_data': rec.get('supporting_data', {}),
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat(),
                'expires_at': (datetime.utcnow() + timedelta(hours=4)).isoformat(),
                'approved_at': None,
                'approved_by': None,
                'rejection_reason': None
            }

            with open(APPROVALS_DIR / f"{approval_id}.json", 'w') as f:
                json.dump(approval, f, indent=2)


# Global scheduler instance
_scheduler_instance: Optional[TradingScheduler] = None


def get_scheduler() -> TradingScheduler:
    """Get the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        raise RuntimeError("Scheduler not initialized")
    return _scheduler_instance


def init_scheduler():
    """Initialize the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = TradingScheduler()
        _scheduler_instance.start()
    return _scheduler_instance
