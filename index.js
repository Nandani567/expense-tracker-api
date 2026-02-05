const express = require('express');
const db = require('./db');

const app = express();
const PORT = 8700;

app.use(express.json());

app.post('/expense_tracker', (req, res) => {
  const { title, amount, category } = req.body;
  if (!title || !amount) return res.status(400).json({ error: 'title and amount are required' });

  const result = db
    .prepare(`INSERT INTO expenses (title, amount, category) VALUES (?, ?, ?)`)
    .run(title, amount, category);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/expense_tracker', (req, res) => {
  const { category, min, max, from, to, page = 1, limit = 5 } = req.query;

  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];

  if (category) { query += ' AND category = ?'; params.push(category); }
  if (min) { query += ' AND amount >= ?'; params.push(Number(min)); }
  if (max) { query += ' AND amount <= ?'; params.push(Number(max)); }
  if (from) { query += ' AND created_at >= ?'; params.push(from); }
  if (to) { query += ' AND created_at <= ?'; params.push(to); }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limitNum, offset);

  const rows = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) AS count FROM expenses WHERE 1=1';
  const countParams = [];
  if (category) { countQuery += ' AND category = ?'; countParams.push(category); }
  if (min) { countQuery += ' AND amount >= ?'; countParams.push(Number(min)); }
  if (max) { countQuery += ' AND amount <= ?'; countParams.push(Number(max)); }
  if (from) { countQuery += ' AND created_at >= ?'; countParams.push(from); }
  if (to) { countQuery += ' AND created_at <= ?'; countParams.push(to); }

  const totalRow = db.prepare(countQuery).get(...countParams);

  res.json({
    page: pageNum,
    limit: limitNum,
    total: totalRow.count,
    data: rows
  });
});

app.get('/expense_tracker/:id', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Expense not found' });
  res.json(row);
});

app.put('/expense_tracker/:id', (req, res) => {
  const { id } = req.params;
  const { title, amount, category } = req.body;

  const result = db
    .prepare('UPDATE expenses SET title = ?, amount = ?, category = ? WHERE id = ?')
    .run(title, amount, category, id);

  if (result.changes === 0) return res.status(404).json({ error: 'Expense not found' });

  res.json({ message: 'Expense updated successfully' });
});

app.delete('/expense_tracker/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

  if (result.changes === 0) return res.status(404).json({ error: 'Expense not found' });

  res.json({ message: 'Expense deleted successfully' });
});

app.get('/expense_tracker/stats/by-category', (req, res) => {
  const rows = db
    .prepare('SELECT category, SUM(amount) AS total FROM expenses GROUP BY category')
    .all();
  res.json(rows);
});


app.get('/expense_tracker/stats/monthly', (req, res) => {
  const { month } = req.query; 
  if (!month) return res.status(400).json({ error: 'month query parameter is required' });

  const row = db
    .prepare('SELECT SUM(amount) AS total FROM expenses WHERE created_at LIKE ?')
    .get(`${month}-%`);

  res.json({ month, total: row.total || 0 });
});

app.get('/expense_tracker/stats/weekly', (req, res) => {
  const { start } = req.query; 
  if (!start) return res.status(400).json({ error: 'start query parameter is required (YYYY-MM-DD)' });

  const from = `${start} 00:00:00`;
  const row = db
    .prepare(`
      SELECT SUM(amount) AS total
      FROM expenses
      WHERE created_at >= ?
        AND created_at < datetime(?, '+7 days')
    `)
    .get(from, from);

  res.json({
    start,
    end: `(start + 6 days)`,
    total: row.total || 0
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
