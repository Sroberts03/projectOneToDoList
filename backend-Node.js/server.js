
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors()); // Enable CORS for all origins
app.use(express.json());

const todosRouter = require('./routes/todos');
app.use('/api/todos', todosRouter);

app.get('/', (req, res) => {
  res.send('Hello from Express backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});