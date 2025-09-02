const db = require('../config/db');

const TodosDAO = {
  getAll: (callback) => {
    db.query('SELECT * FROM todos', callback);
  },
  getById: (id, callback) => {
    db.query('SELECT * FROM todos WHERE id = ?', [id], callback);
  },
  create: (todo, callback) => {
    const { title, completed, user_id } = todo;
    db.query('INSERT INTO todos (title, completed, user_id) VALUES (?, ?, ?)', [title, completed, user_id], callback);
  },
  update: (id, todo, callback) => {
    const { title, completed, user_id } = todo;
    db.query('UPDATE todos SET title = ?, completed = ?, user_id = ? WHERE id = ?', [title, completed, user_id, id], callback);
  },
  delete: (id, callback) => {
    db.query('DELETE FROM todos WHERE id = ?', [id], callback);
  }
};

module.exports = TodosDAO;
