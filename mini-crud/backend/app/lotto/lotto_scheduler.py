import logging
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.lotto.lotto_service import sync_latest_rounds

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone=ZoneInfo("Asia/Seoul"))
_scheduler_started = False


def scheduled_lotto_sync() -> None:
    logger.info("스케줄러 로또 동기화 시작")
    try:
        result = sync_latest_rounds()
        logger.info("스케줄러 로또 동기화 완료: %s", result)
    except Exception:
        logger.exception("스케줄러 로또 동기화 실패")


def start_lotto_scheduler() -> None:
    global _scheduler_started

    if _scheduler_started:
        logger.info("로또 스케줄러는 이미 시작됨")
        return

    scheduler.add_job(
        scheduled_lotto_sync,
        trigger=CronTrigger(day_of_week="sat", hour=21, minute=10),
        id="lotto_weekly_sync",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
        misfire_grace_time=3600,
    )
    scheduler.start()
    _scheduler_started = True
    logger.info("로또 스케줄러 시작 완료 (매주 토요일 21:10 Asia/Seoul)")


def stop_lotto_scheduler() -> None:
    global _scheduler_started

    if not _scheduler_started:
        return

    scheduler.shutdown(wait=False)
    _scheduler_started = False
    logger.info("로또 스케줄러 종료 완료")