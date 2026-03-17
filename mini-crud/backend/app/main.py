import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .db import get_conn
from app.gold.gold_router import router as gold_router
from app.lotto.lotto_repository import init_lotto_table
from app.lotto.lotto_router import router as lotto_router
from app.lotto.lotto_scheduler import start_lotto_scheduler, stop_lotto_scheduler
from app.lotto.lotto_service import startup_sync_lotto

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(title="Mini CRUD")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 로컬 실습용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TodoCreate(BaseModel):
    title: str


class TodoUpdate(BaseModel):
    title: str
    done: bool


def init_todo_table() -> None:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS todos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    done BOOLEAN NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()
        logger.info("todos 테이블 초기화 완료")
    finally:
        conn.close()


def init_gold_price_history_table() -> None:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS gold_price_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    price_date DATE NOT NULL,
                    close_usd_per_oz DECIMAL(12, 4) NOT NULL,
                    close_usd_per_g DECIMAL(12, 4) NOT NULL,
                    usd_krw DECIMAL(12, 4) NOT NULL,
                    close_krw_per_g DECIMAL(14, 2) NOT NULL,
                    source_type VARCHAR(50) NOT NULL,
                    source_name VARCHAR(100) NOT NULL,
                    collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_gold_price_history_price_date_source (price_date, source_name)
                )
            """)
        conn.commit()
        logger.info("gold_price_history 테이블 초기화 완료")
    finally:
        conn.close()


@app.on_event("startup")
def startup_event():
    logger.info("애플리케이션 startup 시작")

    init_todo_table()
    init_lotto_table()
    init_gold_price_history_table()

    start_lotto_scheduler()

    try:
        startup_result = startup_sync_lotto()
        logger.info("startup 로또 동기화 결과: %s", startup_result)
    except Exception:
        logger.exception("startup 로또 동기화 실패 - API 서버는 계속 실행합니다.")

    logger.info("애플리케이션 startup 완료")


@app.on_event("shutdown")
def shutdown_event():
    logger.info("애플리케이션 shutdown 시작")
    stop_lotto_scheduler()
    logger.info("애플리케이션 shutdown 완료")


app.include_router(lotto_router)
app.include_router(gold_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/todos")
def create_todo(payload: TodoCreate):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO todos (title, done) VALUES (%s, %s)",
                (payload.title, False)
            )
            todo_id = cur.lastrowid
            cur.execute("SELECT * FROM todos WHERE id=%s", (todo_id,))
            row = cur.fetchone()
        conn.commit()
        return row
    finally:
        conn.close()


@app.get("/todos")
def list_todos():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM todos ORDER BY id DESC")
            rows = cur.fetchall()
        return rows
    finally:
        conn.close()


@app.get("/todos/{todo_id}")
def get_todo(todo_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM todos WHERE id=%s", (todo_id,))
            row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Todo not found")
        return row
    finally:
        conn.close()


@app.put("/todos/{todo_id}")
def update_todo(todo_id: int, payload: TodoUpdate):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE todos SET title=%s, done=%s WHERE id=%s",
                (payload.title, payload.done, todo_id)
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Todo not found")
            cur.execute("SELECT * FROM todos WHERE id=%s", (todo_id,))
            row = cur.fetchone()
        conn.commit()
        return row
    finally:
        conn.close()


@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM todos WHERE id=%s", (todo_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Todo not found")
        conn.commit()
        return {"deleted": True, "id": todo_id}
    finally:
        conn.close()