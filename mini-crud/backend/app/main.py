from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .db import get_conn

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

# @app.on_event("startup")
# def init_db():
#     conn = get_conn()
#     try:
#         with conn.cursor() as cur:
#             cur.execute("""
#                 CREATE TABLE IF NOT EXISTS todos (
#                     id INT AUTO_INCREMENT PRIMARY KEY,
#                     title VARCHAR(200) NOT NULL,
#                     done BOOLEAN NOT NULL DEFAULT 0,
#                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#                 )
#             """)
#     finally:
#         conn.close()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/todos")
def create_todo(payload: TodoCreate):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO todos (title, done) VALUES (%s, %s)", (payload.title, False))
            todo_id = cur.lastrowid
            cur.execute("SELECT * FROM todos WHERE id=%s", (todo_id,))
            row = cur.fetchone()
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
            cur.execute("UPDATE todos SET title=%s, done=%s WHERE id=%s", (payload.title, payload.done, todo_id))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Todo not found")
            cur.execute("SELECT * FROM todos WHERE id=%s", (todo_id,))
            row = cur.fetchone()
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
        return {"deleted": True, "id": todo_id}
    finally:
        conn.close()
