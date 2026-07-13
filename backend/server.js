const express = require('express');
const cors = require('cors');
require('dotenv').config();

// For SQLite approach - remove mongoose and add sqlite3
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create database tables if they don't exist
const db = new sqlite3.Database('./calendar.db');

db.serialize(() => {
  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'viewer'
  )`);

  // Create events table
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    start_datetime TEXT,
    end_datetime TEXT,
    owner_id INTEGER,
    category TEXT DEFAULT 'general',
    is_recurring INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default admin user if not exists
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (!row) {
      db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
             ['admin', 'admin@calendar.com', 'password123', 'admin']);
    }
  });
});

// Serve static files from frontend
app.use(express.static('../frontend'));

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Simple check for existing user
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
      if (row) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Insert new user
      db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
             [username, email, password], function(err) {
        if (err) {
          return res.status(500).json({ message: err.message });
        }

        const token = 'fake-jwt-token-' + this.lastID; // Simple token for demo
        res.status(201).json({
          token,
          user: {
            id: this.lastID,
            username,
            email,
            role: 'viewer' // Default role
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (!row) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Simple comparison (in production use bcrypt)
      if (row.password !== password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = 'fake-jwt-token-' + row.id; // Simple token for demo
      res.json({
        token,
        user: {
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve the main HTML file for all routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/../frontend/index.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});