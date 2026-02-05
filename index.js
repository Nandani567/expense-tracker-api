const express = require('express');
const db = require('./db');

const app = express();
const PORT = 8700;

app.use(express.json());

// Create
app.post('/expense_tracker', (req, res) => {
  const { title, amount, category } = req.body;

  if (!title || !amount) {
    return res.status(400).json({ error: 'title and amount are required' });
  }

  const result = db
    .prepare(`INSERT INTO expenses (title, amount, category) VALUES (?, ?, ?)`)
    .run(title, amount, category);

  res.status(201).json({ id: result.lastInsertRowid });
});

// Read
app.get('/expense_tracker', (req, res) => {
  const rows = db.prepare(`SELECT * FROM expenses`).all();
  res.json(rows);
});

// Update

app.put('/expense_tracker/:id', (req, res) => {
  const { id } = req.params;
  const { title, amount, category } = req.body;
  const result = db

    .prepare(`UPDATE expenses SET title = ?, amount = ?, category = ? WHERE id = ?`)
    .run(title, amount, category, id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json({ message: 'Expense updated successfully' });
});

// Delete
app.delete('/expense_tracker/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare(`DELETE FROM expenses WHERE id = ?`).run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  res.json({ message: 'Expense deleted successfully' });
});













app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
