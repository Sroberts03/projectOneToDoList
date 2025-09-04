import React, { useEffect, useState } from 'react';
import './App.css';
import CalendarView from './CalendarView';
import './CalendarTab.css';

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
  // Add state for category
  const [category, setCategory] = useState('General');
  const [todos, setTodos] = useState([]);
  // Mass delete state for list view
  const [selectedIds, setSelectedIds] = useState([]);
  const allIncompleteIds = todos.filter(t => !t.completed).map(t => t.id);
  const allIds = todos.map(t => t.id);
  const isAllSelected = selectedIds.length === allIds.length && allIds.length > 0;
  const handleSelectTodo = (id) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  const handleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : allIds);
  };
  const handleMassDelete = async () => {
    for (const id of selectedIds) {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    setSelectedIds([]);
    fetchTodos();
  };
  const [activeTab, setActiveTab] = useState('list');
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [calendarImportError, setCalendarImportError] = useState('');
  const [calendarUrls, setCalendarUrls] = useState([]); // [{ url, category }]
  const [calendarUrlInput, setCalendarUrlInput] = useState('');
  const [calendarCategory, setCalendarCategory] = useState('General');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [selectedTodoId, setSelectedTodoId] = useState(null);
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
            due_date: dueDate || null,
            category
          })
        });
        if (res.ok) {
          setNewTodo('');
          setDueDate('');
          setCategory('General');
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
          body: JSON.stringify({ title: newTodo, completed: false, user_id: parseInt(userId, 10), due_date: dueDate || null, category })
        });
        if (res.ok) {
          setNewTodo('');
          setDueDate('');
          setCategory('General');
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
              <div className="banner-title">My to-do list</div>
              {/* Move tab buttons into banner */}
              <div className="banner-tabs">
                <button
                  className={`calendar-tab-btn${activeTab === 'list' ? ' active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  List
                </button>
                <button
                  className={`calendar-tab-btn${activeTab === 'calendar' ? ' active' : ''}`}
                  onClick={() => setActiveTab('calendar')}
                >
                  Calendar
                </button>
              </div>
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
          {/* Tab navigation moved to banner */}

          {/* Main content for active tab */}
          {activeTab === 'list' && (
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
            </>
          )}
          {activeTab === 'calendar' && (
            <CalendarView todos={todos} onTodoChange={fetchTodos} />
          )}

          {/* Drawer for calendar import (multiple URLs) */}
          {calendarDrawerOpen && (
            <div className="drawer-overlay" onClick={() => setCalendarDrawerOpen(false)}>
              <div className="drawer" onClick={e => e.stopPropagation()}>
                <button className="drawer-close" onClick={() => setCalendarDrawerOpen(false)} title="Close">&#10005;</button>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!calendarUrlInput.trim()) return;
                    setCalendarUrls(urls => [...urls, { url: calendarUrlInput.trim(), category: calendarCategory }]);
                    setCalendarUrlInput('');
                    setCalendarCategory('General');
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
                  <label htmlFor="calendar-category" className="drawer-label">Category for Imported Events</label>
                  <select
                    id="calendar-category"
                    value={calendarCategory}
                    onChange={e => setCalendarCategory(e.target.value)}
                    className="drawer-input"
                  >
                    <option value="General">General</option>
                    <option value="School">School</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                  </select>
                  <button type="submit" className="drawer-btn" disabled={!calendarUrlInput.trim()}>Add Link</button>
                </form>
                {/* List of calendar URLs with remove option */}
                <div className="calendar-list-container">
                  <h4 className="calendar-list-title">Calendars to Import:</h4>
                  {calendarUrls.length === 0 && <div className="calendar-list-empty">No calendars added yet.</div>}
                  <ul className="calendar-list">
                    {calendarUrls.map((obj, idx) => (
                      <li key={obj.url + idx} className="calendar-list-item">
                        <span className="calendar-list-url">{obj.url}</span>
                        <span className="calendar-list-category">({obj.category})</span>
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
                      for (const obj of calendarUrls) {
                        const res = await fetch('http://localhost:4000/api/proxy-ical', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ url: obj.url })
                        });
                        const data = await res.json();
                        if (!res.ok || !data.ical) {
                          setCalendarImportError('Failed to fetch calendar: ' + obj.url);
                          continue;
                        }
                        const text = data.ical;
                        if (!text || !text.includes('BEGIN:VCALENDAR')) {
                          setCalendarImportError('The link does not contain a valid calendar: ' + obj.url);
                          continue;
                        }
                        const events = parseICal(text);
                        if (!events.length) {
                          setCalendarImportError('No events found in the calendar: ' + obj.url);
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
                              due_date: ev.DTSTART ? ev.DTSTART.slice(0, 10) : null,
                              category: obj.category
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
                  <label htmlFor="category" className="drawer-label">Category</label>
                  <select
                    id="category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="drawer-input"
                  >
                    <option value="General">General</option>
                    <option value="School">School</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                  </select>
                  <button type="submit" className="drawer-btn">{editMode ? 'Save Changes' : 'Add'}</button>
                </form>
              </div>
            </div>
          )}
          {activeTab === 'list' && (
            loading ? (
              <p>Loading...</p>
            ) : (
              <>
                {(() => {
                  // Count how many categories have at least one selected todo
                  const categories = ['General', 'School', 'Work', 'Personal'];
                  const selectedCategoryCount = categories.filter(cat => {
                    const todosInCategory = todos.filter(todo => todo.category === cat);
                    const allIdsInCategory = todosInCategory.map(t => t.id);
                    return selectedIds.some(id => allIdsInCategory.includes(id));
                  }).length;
                  if (selectedCategoryCount >= 2) {
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === todos.length && todos.length > 0}
                          onChange={() => {
                            setSelectedIds(selectedIds.length === todos.length ? [] : todos.map(t => t.id));
                          }}
                          id="select-all-global"
                        />
                        <label htmlFor="select-all-global" style={{ marginRight: 8 }}>Select All</label>
                        <button
                          className="drawer-btn"
                          onClick={async () => {
                            await Promise.all(selectedIds.map(id => fetch(`${API_URL}/${id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` }
                            })));
                            setSelectedIds([]);
                            fetchTodos();
                          }}
                          disabled={selectedIds.length === 0}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                          title="Delete Selected"
                        >
                          <span role="img" aria-label="Delete" style={{ pointerEvents: 'none' }}>🗑️</span>
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="todo-list-columns" style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                  {['General', 'School', 'Work', 'Personal'].map(category => {
                    const todosInCategory = todos.filter(todo => todo.category === category);
                    const allIdsInCategory = todosInCategory.map(t => t.id);
                    const isAllSelectedInCategory = allIdsInCategory.length > 0 && allIdsInCategory.every(id => selectedIds.includes(id));
                    const selectedCountInCategory = selectedIds.filter(id => allIdsInCategory.includes(id)).length;
                    const handleSelectAllCategory = () => {
                      setSelectedIds(isAllSelectedInCategory ? selectedIds.filter(id => !allIdsInCategory.includes(id)) : [...selectedIds, ...allIdsInCategory.filter(id => !selectedIds.includes(id))]);
                    };
                    return (
                      <div key={category} className="todo-category-column" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
                          <h3 style={{ textAlign: 'center', margin: 0, width: '100%' }}>{category}</h3>
                          {(todosInCategory.length > 0 && selectedCountInCategory > 0) && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                              <input
                                type="checkbox"
                                checked={isAllSelectedInCategory}
                                onChange={handleSelectAllCategory}
                                id={`select-all-list-${category}`}
                              />
                              <label htmlFor={`select-all-list-${category}`} style={{ marginRight: 8 }}>Select All in Category</label>
                              <button
                                className="drawer-btn"
                                onClick={async () => {
                                  const idsToDelete = selectedIds.filter(id => todosInCategory.some(t => t.id === id));
                                  await Promise.all(idsToDelete.map(id => fetch(`${API_URL}/${id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` }
                                  })));
                                  setSelectedIds(ids => ids.filter(id => !idsToDelete.includes(id)));
                                  fetchTodos();
                                }}
                                disabled={selectedIds.filter(id => todosInCategory.some(t => t.id === id)).length === 0}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                                title="Delete Selected"
                              >
                                <span role="img" aria-label="Delete" style={{ pointerEvents: 'none' }}>🗑️</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {todosInCategory.map(todo => (
                          <div
                            key={todo.id}
                            className={`todo-card${selectedTodoId === todo.id ? ' selected' : ''}`}
                            onClick={() => setSelectedTodoId(todo.id)}
                            style={{ display: 'flex', alignItems: 'center', position: 'relative', marginBottom: 8 }}
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
                                      due_date: todo.due_date ? todo.due_date.slice(0, 10) : null,
                                      category: todo.category
                                    })
                                  });
                                  fetchTodos();
                                } catch (err) {
                                  console.error('Error updating todo:', err);
                                }
                              }}
                              className="todo-checkbox"
                              style={{ marginRight: 8 }}
                            />
                            <span className={`todo-title${todo.completed ? ' completed' : ''} todo-title-flex`} style={{ flex: 1 }}>
                              {todo.title}
                              {todo.due_date && (
                                <span className="due-date">
                                  Due: {(() => {
                                    if (!todo.due_date) return '';
                                    const [year, month, day] = todo.due_date.slice(0, 10).split('-');
                                    return `${month}-${day}-${year}`;
                                  })()}
                                </span>
                              )}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(todo.id)}
                                onChange={e => {
                                  e.stopPropagation();
                                  handleSelectTodo(todo.id);
                                }}
                                className="mass-delete-checkbox"
                                style={{ marginLeft: 8 }}
                              />
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
                    );
                  })}
                </div>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}

export default App;
