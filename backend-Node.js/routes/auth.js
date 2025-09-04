const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Register endpoint
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hashedPassword], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.status(201).json({ message: 'User registered', id: result.insertId });
  });
});

// Login endpoint (accepts username or email)
router.post('/login', (req, res) => {
  const { username, email, password } = req.body;
  if ((!username && !email) || !password) {
    return res.status(400).json({ error: 'Username/email and password required' });
  }
  const identifier = username || email;
  db.query('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, id: user.id });
  });
});

// JWT auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Forgot password endpoint (MVP: just respond success if user exists)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    if (results.length === 0) {
      return res.status(404).json({ error: 'No account found for that email.' });
    }
    // In production, send email with reset link here
    return res.json({ success: true });
  });
});

module.exports = { router, authenticateToken };
