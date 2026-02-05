const Database=require('better-sqlite3')

const db= new Database('expense_tracker.db')

db.prepare(`CREATE TABLE IF NOT EXISTS  expenses(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run()


module.exports=db
