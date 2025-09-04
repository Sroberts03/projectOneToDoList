require('dotenv').config({ path: '../.env.test' });

const request = require('supertest');
const express = require('express');
const todosRouter = require('./routes/todos');
const db = require('./config/db');

const app = express();
app.use(express.json());
// Middleware to set req.user for all requests
app.use((req, res, next) => {
  if (typeof testUserId !== 'undefined') {
    req.user = { id: testUserId };
  }
  next();
});
app.use('/todos', todosRouter);

let testUserId;
describe('Todos API', () => {
  beforeEach(async () => {
    // Create a test user
    const username = 'testuser_' + Date.now();
    await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO users (username, password_hash) VALUES (?, 'testpass')",
        [username],
        (err, result) => {
          if (err) return reject(err);
          testUserId = result.insertId;
          resolve();
        }
      );
    });
  });
  afterEach(async () => {
    // Delete test todos and user
    await new Promise((resolve) => {
      db.query(
        "DELETE FROM todos WHERE user_id = ?",
        [testUserId],
        () => {
          db.query(
            "DELETE FROM users WHERE id = ?",
            [testUserId],
            () => resolve()
          );
        }
      );
    });
  });
  it('POST /todos with missing fields should return 500', async () => {
    const badTodo = { completed: false, user_id: testUserId }; // missing title
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
    const updatedTodo = { title: 'Nope', completed: true, user_id: testUserId };
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
    db.end();
  });

  it('GET /todos should return all todos', async () => {
    // Create a test todo first
    const newTodo = { title: 'Get Test Todo', completed: false, user_id: testUserId, category: 'Test' };
    const createRes = await request(app).post('/todos').send(newTodo);
    expect(createRes.statusCode).toBe(201);
    const todoId = createRes.body.id;
    // Now test GET
    const res = await request(app).get('/todos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Clean up
    await request(app).delete(`/todos/${todoId}`);
  });

  it('GET /todos/:id should return a single todo or 404', async () => {
    // Create a todo to get
    const createRes = await request(app).post('/todos').send({ title: 'Get One', completed: false, user_id: testUserId });
    const todoId = createRes.body.id;
    const res = await request(app).get(`/todos/${todoId}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id');
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  it('POST /todos should create a new todo', async () => {
    const newTodo = { title: 'Test Todo', completed: false, user_id: testUserId, category: 'School' };
    const res = await request(app).post('/todos').send(newTodo);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(newTodo.title);
    expect(res.body.completed).toBe(newTodo.completed);
    expect(res.body.category).toBe(newTodo.category);
  });

  it('PUT /todos/:id should update a todo or return 404', async () => {
    // First, create a todo to update
    const createRes = await request(app).post('/todos').send({ title: 'Update Me', completed: false, user_id: testUserId, category: 'Personal' });
    const todoId = createRes.body.id;
    const updatedTodo = { title: 'Updated Todo', completed: true, user_id: testUserId, category: 'Work' };
    const res = await request(app).put(`/todos/${todoId}`).send(updatedTodo);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.title).toBe(updatedTodo.title);
      expect(res.body.completed).toBe(updatedTodo.completed);
      expect(res.body.category).toBe(updatedTodo.category);
    } else {
      expect(res.body).toHaveProperty('error');
    }
  });

  it('DELETE /todos/:id should delete a todo or return 404', async () => {
    // First, create a todo to delete
    const createRes = await request(app).post('/todos').send({ title: 'Delete Me', completed: false, user_id: testUserId });
    const todoId = createRes.body.id;
    const res = await request(app).delete(`/todos/${todoId}`);
    expect([204, 404]).toContain(res.statusCode);
  });
});
