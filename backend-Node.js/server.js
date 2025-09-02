const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Add this line to parse JSON bodies
app.use(express.json());

// Import and use your todos router
const todosRouter = require('./routes/todos');
app.use(todosRouter);

app.get('/', (req, res) => {
  res.send('Hello from Express backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});