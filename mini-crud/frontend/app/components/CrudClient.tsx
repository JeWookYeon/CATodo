'use client';

import { useEffect, useState } from 'react';
import styles from './crud.module.css';

type Todo = {
  id: number;
  title: string;
  done: boolean;
  created_at: string;
};

const API = 'http://localhost:8000';

export default function CrudClient() {
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/todos`);
      const data = await res.json();
      setTodos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const createTodo = async () => {
    if (!title.trim()) return;

    await fetch(`${API}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    setTitle('');
    fetchTodos();
  };

  const toggleDone = async (todo: Todo) => {
    await fetch(`${API}/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: todo.title,
        done: !todo.done,
      }),
    });

    fetchTodos();
  };

  const deleteTodo = async (id: number) => {
    await fetch(`${API}/todos/${id}`, { method: 'DELETE' });
    fetchTodos();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>CATodo</h1>
          <p className={styles.sub}>
            당신이 해야할 일은 무엇인가요?
          </p>
        </div>
      </div>

      <div className={styles.composer}>
        <label className={styles.inputLabel}>
          <span className={styles.srOnly}>할 일 입력</span>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="할 일 입력"
            onKeyDown={(e) => {
              if (e.key === 'Enter') createTodo();
            }}
          />
        </label>

        <button className={styles.primaryBtn} onClick={createTodo}>
          추가
        </button>
        <button className={styles.secondaryBtn} onClick={fetchTodos}>
          새로고침
        </button>
      </div>

      {loading && <p className={styles.loading}>Loading...</p>}

      <ul className={styles.list}>
        {todos.map((todo) => (
          <li key={todo.id} className={styles.item}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={!!todo.done}
                onChange={() => toggleDone(todo)}
                className={styles.checkbox}
              />

              <span
                className={todo.done ? styles.doneText : styles.text}
                title={todo.title}
              >
                {todo.title}
              </span>
            </label>

            <button
              className={styles.dangerBtn}
              onClick={() => deleteTodo(todo.id)}
            >
              삭제
            </button>
          </li>
        ))}

        {!loading && todos.length === 0 && (
          <li className={styles.empty}>아직 할 일이 없어요. 하나 추가해볼까요?</li>
        )}
      </ul>
    </div>
  );
}
