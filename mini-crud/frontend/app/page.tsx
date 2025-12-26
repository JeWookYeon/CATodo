'use client';

import { useEffect, useState } from 'react';

type Todo = {
  id: number;
  title: string;
  done: boolean;
  created_at: string;
};

const API = 'http://localhost:8000';

export default function Home() {
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
    <main style={{ padding: 24, maxWidth: 560 }}>
      <h1>Mini CRUD Todo</h1>

      <div style={{ marginBottom: 16 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일 입력"
        />
        <button onClick={createTodo} style={{ marginLeft: 8 }}>
          추가
        </button>
        <button onClick={fetchTodos} style={{ marginLeft: 8 }}>
          새로고침
        </button>
      </div>

      {loading && <p>Loading...</p>}

      <ul style={{ paddingLeft: 16 }}>
        {todos.map((todo) => (
          <li key={todo.id} style={{ marginBottom: 8 }}>
            <label style={{ marginRight: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!todo.done}
                onChange={() => toggleDone(todo)}
                style={{ marginRight: 8 }}
              />
              <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
                {todo.title}
              </span>
            </label>

            <button onClick={() => deleteTodo(todo.id)}>삭제</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
