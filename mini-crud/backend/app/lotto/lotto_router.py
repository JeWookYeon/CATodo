from fastapi import APIRouter, HTTPException, Query

from app.lotto.lotto_repository import list_recent_results, get_result_by_round
from app.lotto.lotto_service import (
    sync_latest_rounds,
    backfill_recent_rounds,
    get_top_number_frequencies,
    get_number_round_history,
)

router = APIRouter(prefix="/lotto", tags=["lotto"])


@router.get("/results")
def get_lotto_results(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=50),
):
    return list_recent_results(page=page, size=size)


@router.get("/results/{round_no}")
def get_lotto_result(round_no: int):
    row = get_result_by_round(round_no)
    if not row:
        raise HTTPException(status_code=404, detail="Lotto round not found")
    return row


@router.get("/stats/frequencies")
def get_lotto_number_frequencies(
    limit: int = Query(default=10, ge=1, le=45),
):
    return get_top_number_frequencies(limit=limit)


@router.get("/stats/numbers/{number}/rounds")
def get_lotto_number_rounds(number: int):
    if number < 1 or number > 45:
        raise HTTPException(status_code=400, detail="number must be between 1 and 45")
    return get_number_round_history(number=number)


@router.post("/sync")
def manual_sync_lotto():
    return sync_latest_rounds()


@router.post("/backfill")
def manual_backfill_lotto(count: int = Query(default=100, ge=1, le=300)):
    return backfill_recent_rounds(count=count)