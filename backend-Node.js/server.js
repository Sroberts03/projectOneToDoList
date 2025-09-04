
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors()); // Enable CORS for all origins
app.use(express.json());


const { router: authRouter, authenticateToken } = require('./routes/auth');
app.use('/api/auth', authRouter);

const todosRouter = require('./routes/todos');
// Protect todos routes with JWT auth
app.use('/api/todos', authenticateToken, todosRouter);

// Proxy endpoint for iCal fetch (bypasses CORS)
const fetch = require('node-fetch');
app.post('/api/proxy-ical', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL' });
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch calendar' });
    }
    const text = await response.text();
    res.json({ ical: text });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching calendar' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello from Express backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});