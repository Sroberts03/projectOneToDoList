import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTodoId, setEditTodoId] = useState(null);
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
      let data = await res.json();
      if (Array.isArray(data)) {
        // Sort: incomplete first, then by due date (soonest first), completed last, no due date at bottom
        data = data.sort((a, b) => {
          // Incomplete first
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          // Both incomplete or both complete
          // If both have due dates, sort by due date
          if (a.due_date && b.due_date) {
            return new Date(a.due_date) - new Date(b.due_date);
          }
          // If only one has due date, that one comes first
          if (a.due_date && !b.due_date) return -1;
          if (!a.due_date && b.due_date) return 1;
          // Neither has due date, keep order
          return 0;
        });
      }
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

  // Add or edit a todo
  const handleAddOrEditTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim() || !userId) return;
    try {
      if (editMode && editTodoId) {
        // Edit existing todo
        const res = await fetch(`${API_URL}/${editTodoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: newTodo,
            completed: false,
            user_id: parseInt(userId, 10),
            due_date: dueDate || null
          })
        });
        if (res.ok) {
          setNewTodo('');
          setDueDate('');
          setDrawerOpen(false);
          setEditMode(false);
          setEditTodoId(null);
          fetchTodos();
        }
      } else {
        // Add new todo
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: newTodo, completed: false, user_id: parseInt(userId, 10), due_date: dueDate || null })
        });
        if (res.ok) {
          setNewTodo('');
          setDueDate('');
          setDrawerOpen(false);
          fetchTodos();
        }
      }
    } catch (err) {
      console.error('Error adding/editing todo:', err);
    }
  };
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpenId && !e.target.closest('.menu-dropdown') && !e.target.closest('.menu-btn')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenId]);
// ...existing code...
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
        <div className="auth-container">
          <form onSubmit={handleAuth} className="auth-form">
            <h2 className="auth-title">
              {authMode === 'login' ? 'Sign In to Your Account' : 'Create an Account'}
            </h2>
            <label className="auth-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="auth-input"
            />
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="auth-input"
            />
            <button type="submit" className="auth-btn main-btn">
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="auth-btn switch-btn"
            >
              {authMode === 'login' ? 'Create an Account' : 'Already have an account? Login'}
            </button>
            {authError && (
              <div className="auth-error">{authError}</div>
            )}
          </form>
        </div>
      ) : (
        <>
          <div className="logout-btn-container">
            <button onClick={handleLogout} className="logout-btn">
              <span className="logout-icon">⎋</span>Logout
            </button>
          </div>
          {/* Floating plus button at top right */}
          <div className="add-btn-container">
            <button
              onClick={() => {
                setDrawerOpen(true);
                setEditMode(false);
                setNewTodo('');
                setDueDate('');
                setEditTodoId(null);
              }}
              className="add-btn"
              title="Add Todo"
            >
              &#43;
            </button>
          </div>

          {/* Drawer for adding/editing todo */}
          {drawerOpen && (
            <div className="drawer-overlay" onClick={() => {
              setDrawerOpen(false);
              setEditMode(false);
              setEditTodoId(null);
            }}>
              <div className="drawer" onClick={e => e.stopPropagation()}>
                <button className="drawer-close" onClick={() => {
                  setDrawerOpen(false);
                  setEditMode(false);
                  setEditTodoId(null);
                }} title="Close">&#10005;</button>
                <form onSubmit={handleAddOrEditTodo} className="drawer-form">
                  <h3 className="drawer-title">{editMode ? 'Edit Reminder' : 'Add New Reminder'}</h3>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={e => setNewTodo(e.target.value)}
                    placeholder="What do you want to remember?"
                    className="drawer-input"
                    autoFocus
                  />
                  <label htmlFor="due-date" className="drawer-label">Due Date <span className="drawer-label-optional">(optional)</span></label>
                  <input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="drawer-input"
                  />
                  <button type="submit" className="drawer-btn">{editMode ? 'Save Changes' : 'Add'}</button>
                </form>
              </div>
            </div>
          )}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="todo-list">
              {todos.map(todo => (
                <div
                  key={todo.id}
                  className={`todo-card${selectedTodoId === todo.id ? ' selected' : ''}`}
                  onClick={() => setSelectedTodoId(todo.id)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <input
                    type="checkbox"
                    checked={!!todo.completed}
                    onChange={async (e) => {
                      e.stopPropagation();
                      try {
                        await fetch(`${API_URL}/${todo.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            title: todo.title,
                            completed: !todo.completed,
                            user_id: todo.user_id,
                            due_date: todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 10) : null
                          })
                        });
                        fetchTodos();
                      } catch (err) {
                        console.error('Error updating todo:', err);
                      }
                    }}
                    className="todo-checkbox"
                  />
                  <span className={`todo-title${todo.completed ? ' completed' : ''} todo-title-flex`}>
                    {todo.title}
                    {todo.due_date && (
                      <span className="due-date">
                        Due: {new Date(todo.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                  <div style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }}>
                    <button
                      className="menu-btn"
                      title="Options"
                      onClick={e => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === todo.id ? null : todo.id);
                      }}
                      style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
                    >
                      &#8942;
                    </button>
                  </div>
                  {menuOpenId === todo.id && (
                    <div className="menu-dropdown" style={{ position: 'absolute', top: '50%', left: '100%', transform: 'translateY(-50%) translateX(8px)', zIndex: 99999 }}>
                      <button
                        onClick={e => {
                          setDrawerOpen(true);
                          setEditMode(true);
                          setEditTodoId(todo.id);
                          setNewTodo(todo.title);
                          setDueDate(todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 10) : '');
                          setMenuOpenId(null);
                        }}
                        style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: '0.75rem 1.5rem', textAlign: 'left', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={e => {
                          handleDeleteTodo(todo.id);
                          setSelectedTodoId(null);
                          setMenuOpenId(null);
                        }}
                        style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: '0.75rem 1.5rem', textAlign: 'left', color: '#d32f2f', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
