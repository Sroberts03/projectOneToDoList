import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import './CalendarTab.css';



function CalendarView({ todos }) {
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
              <div className="todo-list">
                {selectedTasks.map(task => (
                  <div
                    key={task.id}
                    className={`todo-card${task.completed ? ' completed' : ''}`}
                    style={{ marginBottom: 12 }}
                  >
                    <input
                      type="checkbox"
                      checked={!!task.completed}
                      onChange={async (e) => {
                        e.stopPropagation();
                        try {
                          await fetch(`/api/todos/${task.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                              title: task.title,
                              completed: !task.completed,
                              user_id: task.user_id,
                              due_date: task.due_date ? task.due_date.slice(0, 10) : null
                            })
                          });
                          window.location.reload();
                        } catch (err) {
                          console.error('Error updating todo:', err);
                        }
                      }}
                      className="todo-checkbox"
                    />
                    <span style={{ textDecoration: task.completed ? 'line-through' : 'none', marginLeft: 8 }}>
                      {task.title}
                      {task.due_date && (
                        <span className="due-date" style={{ marginLeft: 8 }}>
                          Due: {formatDate(task.due_date)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export default CalendarView;
