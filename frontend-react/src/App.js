
import React, { useEffect, useState } from 'react';
import './App.css';

// Simple iCal parser (only supports DTSTART, SUMMARY, and DUE)
function parseICal(icalText) {
  const events = [];
  const lines = icalText.split(/\r?\n/);
  let event = null;
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      event = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (event && event.SUMMARY && event.DTSTART) {
        events.push(event);
      }
      event = null;
    } else if (event) {
      if (line.startsWith('SUMMARY:')) {
        event.SUMMARY = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('DTSTART')) {
        const dt = line.split(':')[1];
        event.DTSTART = dt ? dt.trim() : '';
      } else if (line.startsWith('DUE:')) {
        event.DUE = line.replace('DUE:', '').trim();
      }
    }
  }
  return events;
}

function App() {
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [calendarImportError, setCalendarImportError] = useState('');
  const [calendarUrls, setCalendarUrls] = useState([]);
  const [calendarUrlInput, setCalendarUrlInput] = useState('');
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
      <div className="site-banner">
        <div className="banner-content split">
          {token && (
            <>
              <button onClick={handleLogout} className="logout-btn">
                <span className="logout-icon">⎋</span>Logout
              </button>
              <div className="banner-title">Task Party 🎉</div>
              <div className="add-btn-tooltip-wrapper banner-add-btn-wrapper">
                <button
                  onClick={() => {
                    setDrawerOpen(true);
                    setEditMode(false);
                    setNewTodo('');
                    setDueDate('');
                    setEditTodoId(null);
                  }}
                  className="add-btn banner-add-btn"
                  title="Add Todo"
                >
                  &#43;
                </button>
                <div className="add-btn-tooltip-stack">
                  <button
                    className="add-btn-tooltip"
                    onClick={() => {
                      setDrawerOpen(true);
                      setEditMode(false);
                      setNewTodo('');
                      setDueDate('');
                      setEditTodoId(null);
                    }}
                    type="button"
                    tabIndex={0}
                  >
                    Add item
                  </button>
                  <button
                    className="add-btn-tooltip"
                    onClick={() => {
                      setCalendarDrawerOpen(true);
                    }}
                    type="button"
                    tabIndex={0}
                  >
                    Add calendar
                  </button>
                </div>
              </div>
            </>
          )}
          {!token && <div className="banner-title">Task Party 🎉</div>}
        </div>
      </div>
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
          {/* Add item and calendar buttons below banner */}
          <div className="add-btn-container">
            <div className="add-btn-tooltip-stack">
              <button
                className="add-btn-tooltip"
                onClick={() => {
                  setDrawerOpen(true);
                  setEditMode(false);
                  setNewTodo('');
                  setDueDate('');
                  setEditTodoId(null);
                }}
                type="button"
                tabIndex={0}
              >
                Add item
              </button>
              <button
                className="add-btn-tooltip"
                onClick={() => {
                  setCalendarDrawerOpen(true);
                }}
                type="button"
                tabIndex={0}
              >
                Add calendar
              </button>
            </div>
          </div>

          {/* Drawer for calendar import (multiple URLs) */}
          {calendarDrawerOpen && (
            <div className="drawer-overlay" onClick={() => setCalendarDrawerOpen(false)}>
              <div className="drawer" onClick={e => e.stopPropagation()}>
                <button className="drawer-close" onClick={() => setCalendarDrawerOpen(false)} title="Close">&#10005;</button>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!calendarUrlInput.trim()) return;
                    setCalendarUrls(urls => [...urls, calendarUrlInput.trim()]);
                    setCalendarUrlInput('');
                  }}
                  className="drawer-form drawer-form-margin"
                >
                  <h3 className="drawer-title">Add Calendar Link</h3>
                  <label htmlFor="calendar-url" className="drawer-label">Paste your calendar link (Canvas/BYU Learning Suite)</label>
                  <input
                    id="calendar-url"
                    type="url"
                    value={calendarUrlInput}
                    onChange={e => setCalendarUrlInput(e.target.value)}
                    className="drawer-input"
                    placeholder="https://..."
                  />
                  <button type="submit" className="drawer-btn" disabled={!calendarUrlInput.trim()}>Add Link</button>
                </form>
                {/* List of calendar URLs with remove option */}
                <div className="calendar-list-container">
                  <h4 className="calendar-list-title">Calendars to Import:</h4>
                  {calendarUrls.length === 0 && <div className="calendar-list-empty">No calendars added yet.</div>}
                  <ul className="calendar-list">
                    {calendarUrls.map((url, idx) => (
                      <li key={url + idx} className="calendar-list-item">
                        <span className="calendar-list-url">{url}</span>
                        <button type="button" className="calendar-remove-btn" onClick={() => setCalendarUrls(urls => urls.filter((_, i) => i !== idx))}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Import all calendars button */}
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    setCalendarImportError('');
                    if (!calendarUrls.length) return;
                    try {
                      for (const url of calendarUrls) {
                        const res = await fetch('http://localhost:4000/api/proxy-ical', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ url })
                        });
                        const data = await res.json();
                        if (!res.ok || !data.ical) {
                          setCalendarImportError('Failed to fetch calendar: ' + url);
                          continue;
                        }
                        const text = data.ical;
                        if (!text || !text.includes('BEGIN:VCALENDAR')) {
                          setCalendarImportError('The link does not contain a valid calendar: ' + url);
                          continue;
                        }
                        const events = parseICal(text);
                        if (!events.length) {
                          setCalendarImportError('No events found in the calendar: ' + url);
                          continue;
                        }
                        for (const ev of events) {
                          await fetch(API_URL, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              title: ev.SUMMARY,
                              completed: false,
                              user_id: parseInt(userId, 10),
                              due_date: ev.DTSTART ? ev.DTSTART.slice(0, 10) : null
                            })
                          });
                        }
                      }
                      fetchTodos();
                      setCalendarDrawerOpen(false);
                      setCalendarUrls([]);
                    } catch (err) {
                      setCalendarImportError('Failed to import calendar(s). Please check the links and try again.');
                    }
                  }}
                  className="drawer-form"
                >
                  <button type="submit" className="drawer-btn" disabled={!calendarUrls.length}>Import All Events</button>
                  {calendarImportError && (
                    <div className="calendar-import-error">
                      {calendarImportError}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

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
                  <div className="menu-btn-absolute">
                    <button
                      className="menu-btn"
                      title="Options"
                      onClick={e => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === todo.id ? null : todo.id);
                      }}
                    >
                      &#8942;
                    </button>
                  </div>
                  {menuOpenId === todo.id && (
                    <div className="menu-dropdown menu-dropdown-absolute">
                      <button
                        onClick={e => {
                          setDrawerOpen(true);
                          setEditMode(true);
                          setEditTodoId(todo.id);
                          setNewTodo(todo.title);
                          setDueDate(todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 10) : '');
                          setMenuOpenId(null);
                        }}
                        className="menu-dropdown-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={e => {
                          handleDeleteTodo(todo.id);
                          setSelectedTodoId(null);
                          setMenuOpenId(null);
                        }}
                        className="menu-dropdown-btn menu-dropdown-btn-delete"
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
