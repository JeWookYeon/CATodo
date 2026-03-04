import time
import requests
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

@dataclass(frozen=True)
class LottoDraw:
    round: int
    draw_date: str
    numbers: List[int]
    bonus: int
    first_prize_won: int
    first_winner_count: int

def _to_lotto_draw(data: Dict[str, Any]) -> LottoDraw:
    nums = [int(data[f"drwtNo{i}"]) for i in range(1, 7)]
    return LottoDraw(
        round=int(data["drwNo"]),
        draw_date=str(data["drwNoDate"]),
        numbers=nums,
        bonus=int(data["bnusNo"]),
        first_prize_won=int(data.get("firstWinamnt", 0)),
        first_winner_count=int(data.get("firstPrzwnerCo", 0)),
    )

def fetch_lotto_round(round_no: int, timeout: float = 8.0) -> Optional[LottoDraw]:
    # ✅ 블로그 그대로: 완성 URL 문자열
    url = f"https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={round_no}"

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.dhlottery.co.kr/gameResult.do?method=byWin",
        "X-Requested-With": "XMLHttpRequest",
    }

    for attempt in range(5):
        print(f"[REQ] attempt={attempt} url={url}")
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)

        ct = (resp.headers.get("content-type") or "").lower()
        text = (resp.text or "").lstrip()
        print(f"[RES] status={resp.status_code} ct={ct} head={text[:120].replace(chr(10),' ')}")

        # ✅ JSON이면 파싱
        if resp.status_code == 200 and text.startswith("{"):
            data = resp.json()
            if data.get("returnValue") != "success":
                return None
            return _to_lotto_draw(data)

        time.sleep(0.5 * (2 ** attempt))

    raise RuntimeError(f"Failed to fetch lotto round {round_no} after retries")