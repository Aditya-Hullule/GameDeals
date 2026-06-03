const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

    // Create Waitlist Table
    db.run(`CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dealID TEXT NOT NULL,
      title TEXT NOT NULL,
      thumb TEXT,
      salePrice REAL,
      storeID TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, dealID)
    )`);

    // Create Collection Table
    db.run(`CREATE TABLE IF NOT EXISTS collection (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dealID TEXT NOT NULL,
      title TEXT NOT NULL,
      thumb TEXT,
      salePrice REAL,
      storeID TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, dealID)
    )`);
  }
});

module.exports = db;
