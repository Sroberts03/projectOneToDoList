import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import './CalendarTab.css';



function CalendarView({ todos, onTodoChange }) {
  // Add state for category
  const [category, setCategory] = useState('General');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTodoId, setEditTodoId] = useState(null);
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  // Helper for API URL
  const API_URL = 'http://localhost:4000/api/todos';
  // Helper for updating todo
  async function handleUpdateTodo(todo, completed) {
    try {
      await fetch(`${API_URL}/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: todo.title,
          completed,
          user_id: todo.user_id,
          due_date: todo.due_date ? todo.due_date.slice(0, 10) : null,
          category: todo.category
        })
      });
      if (typeof onTodoChange === 'function') onTodoChange();
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  }
  // Helper for deleting todo
  async function handleDeleteTodo(id) {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (typeof onTodoChange === 'function') onTodoChange();
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  }
  // Helper for editing todo
  function openEditDrawer(todo) {
    setDrawerOpen(true);
    setEditMode(true);
    setEditTodoId(todo.id);
    setNewTodo(todo.title);
    setDueDate(todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 10) : '');
    setCategory(todo.category || 'General');
    setMenuOpenId(null);
  }
  const [selectedDate, setSelectedDate] = useState(null);

  function handleDayCellDidMount(arg) {
    arg.el.onclick = () => {
      // Get date string in YYYY-MM-DD format from FullCalendar's internal API
      const dateStr = arg.date.toISOString().slice(0, 10);
      setSelectedDate(dateStr);
    };
  }

  // Add a class to the selected day cell
  function dayCellClassNames(arg) {
    return selectedDate === arg.date.toISOString().slice(0, 10) ? ['fc-day-selected'] : [];
  }

  // Convert todos to FullCalendar event format
  const events = todos.filter(t => t.due_date).map(todo => ({
    id: todo.id,
    title: todo.title,
    date: todo.due_date.slice(0, 10),
    extendedProps: { completed: todo.completed }
  }));

  // Helper to format date as DD-MM-YYYY
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.slice(0, 10).split('-');
    return `${month}-${day}-${year}`;
  }

  // Get tasks for selected day
  const selectedTasks = selectedDate
    ? todos.filter(t => t.due_date && t.due_date.slice(0, 10) === selectedDate)
    : [];

  // Custom event content: show a dot only
  function renderEventContent() {
    return (
      <span style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#1976d2',
        margin: '0 auto'
      }}></span>
    );
  }

  // Mass delete state for calendar view
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const allTaskIds = selectedTasks.map(t => t.id);
  const isAllTasksSelected = selectedTaskIds.length === allTaskIds.length && allTaskIds.length > 0;
  const handleSelectTask = (id) => {
    setSelectedTaskIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  const handleSelectAllTasks = () => {
    setSelectedTaskIds(isAllTasksSelected ? [] : allTaskIds);
  };
  const handleMassDeleteTasks = async () => {
    for (const id of selectedTaskIds) {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    }
    setSelectedTaskIds([]);
    if (typeof onTodoChange === 'function') onTodoChange();
  };

  return (
    <div className="calendar-view">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventContent={renderEventContent}
          dayCellClassNames={dayCellClassNames}
          dayCellDidMount={handleDayCellDidMount}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          height="auto"
        />
        {selectedDate && (
          <div className="calendar-tasks-list">
            <h3>Tasks for {formatDate(selectedDate)}:</h3>
            {selectedTasks.length === 0 ? (
              <div style={{ color: '#888' }}>No tasks due on this day.</div>
            ) : (
              <>
                {selectedTaskIds.length > 0 && (
                  <div className="mass-delete-bar">
                    <input
                      type="checkbox"
                      checked={isAllTasksSelected}
                      onChange={handleSelectAllTasks}
                      id="select-all-calendar"
                    />
                    <label htmlFor="select-all-calendar" style={{ marginRight: 16 }}>Select All</label>
                    <button
                      className="drawer-btn"
                      onClick={handleMassDeleteTasks}
                      disabled={selectedTaskIds.length === 0}
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
                <div className="todo-list">
                  {selectedTasks.map(task => (
                    <div
                      key={task.id}
                      className={`todo-card${task.completed ? ' completed' : ''}`}
                      style={{ marginBottom: 12, display: 'flex', alignItems: 'center', position: 'relative' }}
                    >
                      <input
                        type="checkbox"
                        checked={!!task.completed}
                        onChange={async (e) => {
                          e.stopPropagation();
                          handleUpdateTodo(task, !task.completed);
                        }}
                        className="todo-checkbox"
                        style={{ marginRight: 8 }}
                      />
                      <span style={{ textDecoration: task.completed ? 'line-through' : 'none', marginLeft: 8, flex: 1 }}>
                        {task.title}
                        {task.due_date && (
                          <span className="due-date" style={{ marginLeft: 8 }}>
                            Due: {formatDate(task.due_date)}
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
                              setMenuOpenId(menuOpenId === task.id ? null : task.id);
                            }}
                          >
                            &#8942;
                          </button>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={e => {
                            e.stopPropagation();
                            handleSelectTask(task.id);
                          }}
                          className="mass-delete-checkbox"
                          style={{ marginLeft: 8 }}
                        />
                      </div>
                      {menuOpenId === task.id && (
                        <div className="menu-dropdown menu-dropdown-absolute">
                          <button
                            onClick={e => {
                              openEditDrawer(task);
                            }}
                            className="menu-dropdown-btn"
                          >
                            Edit
                          </button>
                          <button
                            onClick={e => {
                              handleDeleteTodo(task.id);
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
              </>
            )}
          </div>
        )}
        {/* Drawer for editing todo */}
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
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!newTodo.trim()) return;
                  try {
                    // Find the todo being edited
                    const editingTodo = todos.find(t => t.id === editTodoId);
                    await fetch(`${API_URL}/${editTodoId}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({
                        title: newTodo,
                        completed: false,
                        user_id: editingTodo ? editingTodo.user_id : undefined,
                        due_date: dueDate || null,
                        category
                      })
                    });
                    setNewTodo('');
                    setDueDate('');
                    setCategory('General');
                    setDrawerOpen(false);
                    setEditMode(false);
                    setEditTodoId(null);
                    if (typeof onTodoChange === 'function') onTodoChange();
                  } catch (err) {
                    console.error('Error editing todo:', err);
                  }
                }}
                className="drawer-form"
              >
                <h3 className="drawer-title">Edit Reminder</h3>
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
                <button type="submit" className="drawer-btn">Save Changes</button>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default CalendarView;
