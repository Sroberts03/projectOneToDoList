import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authError, setAuthError] = useState('');

  const API_URL = 'http://localhost:4000/api/todos';
  const AUTH_URL = 'http://localhost:4000/api/auth';

  // Fetch todos from backend
  const fetchTodos = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setTodos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchTodos();
  }, [token]);

  // Add a new todo
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim() || !userId) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTodo, completed: false, user_id: parseInt(userId, 10) })
      });
      if (res.ok) {
        setNewTodo('');
        fetchTodos();
      }
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  // Delete a todo
  const handleDeleteTodo = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTodos();
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password required');
      return;
    }
    try {
      const res = await fetch(`${AUTH_URL}/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token && data.id) {
        setToken(data.token);
        setUserId(data.id.toString());
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.id.toString());
      } else if (res.ok && data.message && data.id) {
        setAuthMode('login');
        setAuthError('Registration successful. Please log in.');
        setUserId(data.id.toString());
        localStorage.setItem('userId', data.id.toString());
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Network error');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserId('');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setTodos([]);
  };

  return (
    <div className="App">
      <h1>Todo List</h1>
      {!token ? (
        <form onSubmit={handleAuth} style={{ marginBottom: '2rem' }}>
          <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ marginLeft: '8px' }}
          />
          <button type="submit">{authMode === 'login' ? 'Login' : 'Register'}</button>
          <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ marginLeft: '8px' }}>
            {authMode === 'login' ? 'Switch to Register' : 'Switch to Login'}
          </button>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
        </form>
      ) : (
        <>
          <button onClick={handleLogout} style={{ marginBottom: '1rem' }}>Logout</button>
          <form onSubmit={handleAddTodo}>
            <input
              type="text"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              placeholder="Add a new todo"
            />
            <button type="submit">Add</button>
          </form>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {todos.map(todo => (
                <li key={todo.id}>
                  {todo.title}
                  <button onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default App;
