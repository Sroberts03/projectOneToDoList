import React from 'react';
import './App.css';

const UserGuide = () => (
  <div className="user-guide-container" style={{ maxWidth: 800, margin: '2rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(33,150,243,0.10)', padding: '2rem', textAlign: 'left' }}>
  <h1 style={{ textAlign: 'center', fontFamily: 'pacifico, cursive', fontSize: '2.5rem', marginBottom: '1.5rem' }}>User Guide</h1>
    <h2>Features</h2>
    <ul>
      <li>Add, edit, and delete todos</li>
      <li>Organize todos by category (Work, Personal, School, Other)</li>
      <li>Import external calendars (Canvas, BYU Learning Suite, etc.)</li>
      <li>Calendar view for scheduling</li>
      <li>Bulk select and delete tasks (per category or globally)</li>
      <li>Mark tasks as completed</li>
      <li>Responsive, modern UI</li>
    </ul>
    <h2>Getting Started</h2>
    <ol>
      <li><b>Login/Register:</b> Start by creating an account or logging in.</li>
      <li><b>Add a Todo:</b> Click the plus (+) button to add a new reminder. Choose a category, set a due date, and add details.</li>
      <li><b>Edit/Delete:</b> Click on a todo to edit. Use the trash can icon to delete single or multiple tasks.</li>
      <li><b>Calendar View:</b> Switch to the calendar tab to see your tasks by date. Edit or delete directly from the calendar.</li>
      <li><b>Bulk Actions:</b> Select multiple tasks using checkboxes. Use 'Select All in Category' or the global select all for mass deletion.</li>
    </ol>
    <h2>Tips</h2>
    <ul>
      <li>Use the calendar for a visual overview of your schedule.</li>
      <li>Completed tasks are shown with a strikethrough.</li>
      <li>You can always edit a task's category or due date.</li>
    </ul>
  <h2>Account Recovery</h2>
  <p>If you forget your login, click the "Forgot Password?" link on the login page to retrieve or reset your password. Follow the instructions sent to your email.</p>
  <p style={{ textAlign: 'left', marginTop: '2rem', fontSize: '1.2rem' }}>Enjoy staying organized!</p>
  </div>
);

export default UserGuide;
