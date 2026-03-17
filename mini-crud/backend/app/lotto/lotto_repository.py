import logging
from typing import Any, Dict, List, Optional

from app.db import get_conn

logger = logging.getLogger(__name__)


def init_lotto_table() -> None:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS lotto_results (
                    round_no INT NOT NULL PRIMARY KEY,
                    draw_date DATE NOT NULL,
                    num1 TINYINT NOT NULL,
                    num2 TINYINT NOT NULL,
                    num3 TINYINT NOT NULL,
                    num4 TINYINT NOT NULL,
                    num5 TINYINT NOT NULL,
                    num6 TINYINT NOT NULL,
                    bonus TINYINT NOT NULL,
                    source VARCHAR(20) NOT NULL DEFAULT 'selenium',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
        conn.commit()
        logger.info("lotto_results 테이블 초기화 완료")
    finally:
        conn.close()


def get_max_round() -> Optional[int]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT MAX(round_no) AS max_round FROM lotto_results")
            row = cur.fetchone()
        if not row:
            return None
        return row["max_round"]
    finally:
        conn.close()


def upsert_lotto_results(items: List[Dict[str, Any]]) -> int:
    if not items:
        return 0

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
                INSERT INTO lotto_results (
                    round_no, draw_date, num1, num2, num3, num4, num5, num6, bonus, source
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    draw_date = VALUES(draw_date),
                    num1 = VALUES(num1),
                    num2 = VALUES(num2),
                    num3 = VALUES(num3),
                    num4 = VALUES(num4),
                    num5 = VALUES(num5),
                    num6 = VALUES(num6),
                    bonus = VALUES(bonus),
                    source = VALUES(source)
            """
            params = [
                (
                    item["round"],
                    item["draw_date"],
                    item["numbers"][0],
                    item["numbers"][1],
                    item["numbers"][2],
                    item["numbers"][3],
                    item["numbers"][4],
                    item["numbers"][5],
                    item["bonus"],
                    "selenium",
                )
                for item in items
            ]
            cur.executemany(sql, params)
        conn.commit()
        logger.info("lotto_results 업서트 완료: %s건", len(items))
        return len(items)
    finally:
        conn.close()


def list_recent_results(page: int = 1, size: int = 20) -> Dict[str, Any]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS total FROM lotto_results")
            total = cur.fetchone()["total"]

            offset = (page - 1) * size

            cur.execute("""
                SELECT round_no, draw_date, num1, num2, num3, num4, num5, num6, bonus, source, created_at, updated_at
                FROM lotto_results
                ORDER BY round_no DESC
                LIMIT %s OFFSET %s
            """, (size, offset))

            rows = cur.fetchall()

        return {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": (total + size - 1) // size,
            "items": rows
        }

    finally:
        conn.close()


def get_result_by_round(round_no: int) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT round_no, draw_date, num1, num2, num3, num4, num5, num6, bonus, source, created_at, updated_at
                FROM lotto_results
                WHERE round_no = %s
            """, (round_no,))
            row = cur.fetchone()
        return row
    finally:
        conn.close()


def get_number_frequency_stats(limit: int = 10) -> List[Dict[str, Any]]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    picked_number,
                    COUNT(*) AS frequency
                FROM (
                    SELECT num1 AS picked_number FROM lotto_results
                    UNION ALL
                    SELECT num2 AS picked_number FROM lotto_results
                    UNION ALL
                    SELECT num3 AS picked_number FROM lotto_results
                    UNION ALL
                    SELECT num4 AS picked_number FROM lotto_results
                    UNION ALL
                    SELECT num5 AS picked_number FROM lotto_results
                    UNION ALL
                    SELECT num6 AS picked_number FROM lotto_results
                ) AS numbers_union
                GROUP BY picked_number
                ORDER BY frequency DESC, picked_number ASC
                LIMIT %s
            """, (limit,))
            rows = cur.fetchall()

        return rows
    finally:
        conn.close()


def get_rounds_by_number(number: int) -> List[Dict[str, Any]]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    round_no,
                    draw_date,
                    num1,
                    num2,
                    num3,
                    num4,
                    num5,
                    num6,
                    bonus
                FROM lotto_results
                WHERE
                    num1 = %s OR
                    num2 = %s OR
                    num3 = %s OR
                    num4 = %s OR
                    num5 = %s OR
                    num6 = %s
                ORDER BY round_no DESC
            """, (number, number, number, number, number, number))
            rows = cur.fetchall()

        return rows
    finally:
        conn.close()