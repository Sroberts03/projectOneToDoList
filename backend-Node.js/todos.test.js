require('dotenv').config({ path: '../.env' });

const request = require('supertest');
const express = require('express');
const todosRouter = require('./routes/todos');
const db = require('./config/db');

const app = express();
app.use(express.json());
app.use(todosRouter);

describe('Todos API', () => {
  it('POST /todos with missing fields should return 500', async () => {
    const badTodo = { completed: false, user_id: 1 }; // missing title
    const res = await request(app).post('/todos').send(badTodo);
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /todos with invalid user_id should return 500', async () => {
    const badTodo = { title: 'Bad User', completed: false, user_id: 99999 }; // user_id does not exist
    const res = await request(app).post('/todos').send(badTodo);
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('PUT /todos/:id for non-existent todo should return 404', async () => {
    const updatedTodo = { title: 'Nope', completed: true, user_id: 1 };
    const res = await request(app).put('/todos/99999').send(updatedTodo);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('DELETE /todos/:id for non-existent todo should return 404', async () => {
    const res = await request(app).delete('/todos/99999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
  afterAll(async () => {
    await new Promise((resolve) => {
      db.query(
        "DELETE FROM todos WHERE title IN ('Test Todo', 'Update Me', 'Updated Todo', 'Delete Me')",
        () => {
          db.end(resolve);
        }
      );
    });
  });

  it('GET /todos should return all todos', async () => {
    const res = await request(app).get('/todos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /todos/:id should return a single todo or 404', async () => {
    const res = await request(app).get('/todos/1');
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id');
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  it('POST /todos should create a new todo', async () => {
    // Use user_id 1 for testing (make sure a user with id=1 exists in your DB)
    const newTodo = { title: 'Test Todo', completed: false, user_id: 1 };
    const res = await request(app).post('/todos').send(newTodo);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(newTodo.title);
    expect(res.body.completed).toBe(newTodo.completed);
  });

  it('PUT /todos/:id should update a todo or return 404', async () => {
    // First, create a todo to update
    const createRes = await request(app).post('/todos').send({ title: 'Update Me', completed: false, user_id: 1 });
    const todoId = createRes.body.id;
    const updatedTodo = { title: 'Updated Todo', completed: true, user_id: 1 };
    const res = await request(app).put(`/todos/${todoId}`).send(updatedTodo);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.title).toBe(updatedTodo.title);
      expect(res.body.completed).toBe(updatedTodo.completed);
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  it('DELETE /todos/:id should delete a todo or return 404', async () => {
    // First, create a todo to delete
    const createRes = await request(app).post('/todos').send({ title: 'Delete Me', completed: false, user_id: 1 });
    const todoId = createRes.body.id;
    const res = await request(app).delete(`/todos/${todoId}`);
    expect([204, 404]).toContain(res.statusCode);
  });
});
