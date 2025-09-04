const db = require('../config/db');

const TodosDAO = {
  getAll: (callback) => {
    db.query('SELECT * FROM todos', callback);
  },
  getByUserId: (userId, callback) => {
    db.query('SELECT * FROM todos WHERE user_id = ?', [userId], callback);
  },
  getById: (id, callback) => {
    db.query('SELECT * FROM todos WHERE id = ?', [id], callback);
  },
  create: (todo, callback) => {
    const { title, completed, user_id, due_date, category } = todo;
    const safeDueDate = (!due_date || due_date === '') ? null : due_date;
    const safeCategory = category || 'General';
    db.query('INSERT INTO todos (title, completed, user_id, due_date, category) VALUES (?, ?, ?, ?, ?)', [title, completed, user_id, safeDueDate, safeCategory], callback);
  },
  update: (id, todo, callback) => {
    const { title, completed, user_id, due_date, category } = todo;
    const safeDueDate = (!due_date || due_date === '') ? null : due_date;
    const safeCategory = category || 'General';
    db.query('UPDATE todos SET title = ?, completed = ?, user_id = ?, due_date = ?, category = ? WHERE id = ?', [title, completed, user_id, safeDueDate, safeCategory, id], callback);
  },
  delete: (id, callback) => {
    db.query('DELETE FROM todos WHERE id = ?', [id], callback);
  }
};

module.exports = TodosDAO;
