import logging
from typing import Dict, Any, List

from app.lotto.lotto_repository import (
    init_lotto_table,
    get_max_round,
    upsert_lotto_results,
    get_number_frequency_stats,
    get_rounds_by_number,
)
from app.lotto.lotto_selenium import (
    collect_recent_rounds,
    collect_new_rounds_since,
    get_latest_round,
)

logger = logging.getLogger(__name__)


def backfill_recent_rounds(count: int = 100) -> Dict[str, Any]:
    logger.info("초기 백필 시작: 최근 %s회", count)

    try:
        items = collect_recent_rounds(count=count, headless=True)
        saved_count = upsert_lotto_results(items)

        result = {
            "mode": "backfill",
            "requested_count": count,
            "collected_count": len(items),
            "saved_count": saved_count,
            "latest_round": items[0]["round"] if items else None,
            "oldest_round": items[-1]["round"] if items else None,
        }

        logger.info("초기 백필 완료: %s", result)
        return result
    except Exception:
        logger.exception("초기 백필 실패")
        raise


def sync_latest_rounds() -> Dict[str, Any]:
    try:
        init_lotto_table()

        db_max_round = get_max_round()

        if db_max_round is None:
            logger.info("DB에 로또 데이터가 없어 초기 백필로 전환")
            return backfill_recent_rounds(count=100)

        latest_round = get_latest_round(headless=True)
        logger.info("로또 동기화 시작: DB 마지막 회차=%s, 사이트 최신 회차=%s", db_max_round, latest_round)

        if latest_round <= db_max_round:
            result = {
                "mode": "sync",
                "db_max_round": db_max_round,
                "latest_round": latest_round,
                "saved_count": 0,
                "message": "신규 회차 없음",
            }
            logger.info("로또 동기화 종료: %s", result)
            return result

        items = collect_new_rounds_since(last_saved_round=db_max_round, headless=True)
        saved_count = upsert_lotto_results(items)

        result = {
            "mode": "sync",
            "db_max_round": db_max_round,
            "latest_round": latest_round,
            "saved_count": saved_count,
            "new_rounds": [item["round"] for item in items],
        }
        logger.info("로또 동기화 완료: %s", result)
        return result
    except Exception:
        logger.exception("로또 동기화 실패")
        raise


def startup_sync_lotto() -> Dict[str, Any]:
    logger.info("서버 시작 시 로또 동기화 실행")
    try:
        return sync_latest_rounds()
    except Exception:
        logger.exception("startup_sync_lotto 내부 실패")
        raise


def get_top_number_frequencies(limit: int = 10) -> Dict[str, Any]:
    rows = get_number_frequency_stats(limit=limit)

    return {
        "limit": limit,
        "items": [
            {
                "number": row["picked_number"],
                "frequency": row["frequency"],
            }
            for row in rows
        ],
    }


def get_number_round_history(number: int) -> Dict[str, Any]:
    rows = get_rounds_by_number(number=number)

    return {
        "number": number,
        "count": len(rows),
        "rounds": rows,
    }