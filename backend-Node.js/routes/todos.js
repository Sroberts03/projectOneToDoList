const express = require('express');
const router = express.Router();
const TodosDAO = require('../dao/todosDAO');

router.get('/', (req, res) => {
  const userId = req.user.id;
  TodosDAO.getByUserId(userId, (err, results) => {
    if (err) {
      console.error('Error in GET /todos:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.json(results);
  });
});

router.get('/:id', (req, res) => {
  const todoId = req.params.id;
  TodosDAO.getById(todoId, (err, results) => {
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

router.post('/', (req, res) => {
  TodosDAO.create(req.body, (err, results) => {
    if (err) {
      console.error('Error in POST /todos:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    const { title, completed, user_id, due_date, category } = req.body;
    res.status(201).json({ id: results.insertId, title, completed, user_id, due_date, category });
  });
});

router.put('/:id', (req, res) => {
  const todoId = req.params.id;
  TodosDAO.update(todoId, req.body, (err, results) => {
    if (err) {
      console.error('Error in PUT /todos/:id:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    const { title, completed, user_id, due_date, category } = req.body;
    res.json({ id: todoId, title, completed, user_id, due_date, category });
  });
});

router.delete('/:id', (req, res) => {
  const todoId = req.params.id;
  TodosDAO.delete(todoId, (err, results) => {
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
