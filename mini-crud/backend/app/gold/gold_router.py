from fastapi import APIRouter, Query

from app.gold.gold_service import (
    fetch_gold_current,
    get_gold_history,
    sync_gold_current_to_history,
)

router = APIRouter(prefix="/gold", tags=["gold"])


@router.get("/current")
async def get_gold_current():
    return await fetch_gold_current()


@router.post("/sync-current")
async def post_sync_gold_current():
    return await sync_gold_current_to_history()


@router.get("/history")
def get_gold_history_api(limit: int = Query(default=30, ge=1, le=365)):
    return get_gold_history(limit=limit)