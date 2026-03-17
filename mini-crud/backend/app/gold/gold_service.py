import os
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException

from app.gold.gold_repository import list_gold_price_history, upsert_gold_price_history

GRAMS_PER_TROY_OUNCE = 31.1034768


async def fetch_gold_current() -> dict:
    metals_api_key = os.getenv("METALS_API_KEY", "ILHCKNXZUU6UKEQ1EQPT608Q1EQPT").strip()

    if not metals_api_key:
        raise HTTPException(
            status_code=500,
            detail="METALS_API_KEY가 설정되지 않았습니다."
        )

    metals_url = "https://api.metals.dev/v1/latest"
    fx_url = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW"

    timeout = httpx.Timeout(15.0, connect=10.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        metals_response = await client.get(
            metals_url,
            params={
                "api_key": metals_api_key,
                "currency": "USD",
                "unit": "toz",
            },
            headers={"Accept": "application/json"},
        )
        metals_response.raise_for_status()
        metals_data = metals_response.json()

        fx_response = await client.get(fx_url)
        fx_response.raise_for_status()
        fx_data = fx_response.json()

    metals = metals_data.get("metals") or {}
    gold_usd_per_oz = metals.get("gold")
    usd_krw = (fx_data.get("rates") or {}).get("KRW")

    if gold_usd_per_oz is None:
        raise HTTPException(
            status_code=502,
            detail="금 시세 응답에서 gold 값을 찾을 수 없습니다."
        )

    if usd_krw is None:
        raise HTTPException(
            status_code=502,
            detail="환율 응답에서 KRW 값을 찾을 수 없습니다."
        )

    gold_usd_per_g = round(float(gold_usd_per_oz) / GRAMS_PER_TROY_OUNCE, 4)
    gold_krw_per_g = round(gold_usd_per_g * float(usd_krw), 2)

    return {
        "price_usd_per_oz": round(float(gold_usd_per_oz), 2),
        "price_usd_per_g": gold_usd_per_g,
        "usd_krw": round(float(usd_krw), 4),
        "price_krw_per_g": gold_krw_per_g,
        "gold_updated_at": metals_data.get("timestamp"),
        "fx_date": fx_data.get("date"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "gold_source": "metals.dev",
        "fx_source": "frankfurter.dev",
    }


async def sync_gold_current_to_history() -> dict:
    current = await fetch_gold_current()

    price_date = current.get("fx_date")
    if not price_date:
        price_date = datetime.now(timezone.utc).date().isoformat()

    saved_row = upsert_gold_price_history(
        price_date=price_date,
        close_usd_per_oz=current["price_usd_per_oz"],
        close_usd_per_g=current["price_usd_per_g"],
        usd_krw=current["usd_krw"],
        close_krw_per_g=current["price_krw_per_g"],
        source_type="api",
        source_name=current["gold_source"],
    )

    return {
        "saved": True,
        "message": "현재 금시세를 gold_price_history에 저장했습니다.",
        "item": saved_row,
    }


def get_gold_history(limit: int = 30) -> dict:
    safe_limit = limit
    if safe_limit < 1:
        safe_limit = 1
    if safe_limit > 365:
        safe_limit = 365

    items = list_gold_price_history(limit=safe_limit)

    return {
        "count": len(items),
        "limit": safe_limit,
        "items": items,
    }