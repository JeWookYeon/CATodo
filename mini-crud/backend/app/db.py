import os
import time
import pymysql


def get_conn(max_retries: int = 10, delay: int = 3):
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            return pymysql.connect(
                host=os.getenv("DB_HOST", "db"),
                port=int(os.getenv("DB_PORT", "3306")),
                user=os.getenv("DB_USER", "app"),
                password=os.getenv("DB_PASSWORD", "app1234"),
                database=os.getenv("DB_NAME", "appdb"),
                charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=False,
            )
        except pymysql.MySQLError as e:
            last_error = e
            print(f"[DB RETRY] {attempt}/{max_retries} DB 연결 실패: {e}")
            if attempt < max_retries:
                time.sleep(delay)

    raise last_error