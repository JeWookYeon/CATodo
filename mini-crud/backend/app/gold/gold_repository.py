from app.db import get_conn


def upsert_gold_price_history(
    price_date: str,
    close_usd_per_oz: float,
    close_usd_per_g: float,
    usd_krw: float,
    close_krw_per_g: float,
    source_type: str,
    source_name: str,
) -> dict:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO gold_price_history (
                    price_date,
                    close_usd_per_oz,
                    close_usd_per_g,
                    usd_krw,
                    close_krw_per_g,
                    source_type,
                    source_name
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    close_usd_per_oz = VALUES(close_usd_per_oz),
                    close_usd_per_g = VALUES(close_usd_per_g),
                    usd_krw = VALUES(usd_krw),
                    close_krw_per_g = VALUES(close_krw_per_g),
                    source_type = VALUES(source_type),
                    collected_at = CURRENT_TIMESTAMP
                """,
                (
                    price_date,
                    close_usd_per_oz,
                    close_usd_per_g,
                    usd_krw,
                    close_krw_per_g,
                    source_type,
                    source_name,
                ),
            )

            cur.execute(
                """
                SELECT *
                FROM gold_price_history
                WHERE price_date = %s AND source_name = %s
                """,
                (price_date, source_name),
            )
            row = cur.fetchone()

        conn.commit()
        return row
    finally:
        conn.close()


def list_gold_price_history(limit: int = 30) -> list[dict]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM gold_price_history
                ORDER BY price_date DESC, id DESC
                LIMIT %s
                """,
                (limit,),
            )
            rows = cur.fetchall()
        return rows
    finally:
        conn.close()