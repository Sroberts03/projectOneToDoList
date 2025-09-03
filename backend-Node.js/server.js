
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

app.get('/', (req, res) => {
  res.send('Hello from Express backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});