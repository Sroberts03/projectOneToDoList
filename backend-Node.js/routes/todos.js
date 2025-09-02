const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

router.get('/todos', (req, res) => {
  db.query('SELECT * FROM todos', (err, results) => {
    if (err) {
      console.error('Error in GET /todos:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.json(results);
  });
});

router.get('/todos/:id', (req, res) => {
  const todoId = req.params.id;
  db.query('SELECT * FROM todos WHERE id = ?', [todoId], (err, results) => {
    if (err) {
      console.error('Error in GET /todos/:id:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(results[0]);
  });
});

router.post('/todos', (req, res) => {
  const { title, completed, user_id } = req.body;
  db.query('INSERT INTO todos (title, completed, user_id) VALUES (?, ?, ?)', [title, completed, user_id], (err, results) => {
    if (err) {
      console.error('Error in POST /todos:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.status(201).json({ id: results.insertId, title, completed, user_id });
  });
});

router.put('/todos/:id', (req, res) => {
  const todoId = req.params.id;
  const { title, completed, user_id } = req.body;
  db.query('UPDATE todos SET title = ?, completed = ?, user_id = ? WHERE id = ?', [title, completed, user_id, todoId], (err, results) => {
    if (err) {
      console.error('Error in PUT /todos/:id:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ id: todoId, title, completed, user_id });
  });
});

router.delete('/todos/:id', (req, res) => {
  const todoId = req.params.id;
  db.query('DELETE FROM todos WHERE id = ?', [todoId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.status(204).send();
  });
});

module.exports = router;
