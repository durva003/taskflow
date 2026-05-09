const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = 'taskflow_secret';

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role || 'viewer']
    );
    res.json({ message: 'User created', user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isCorrect = bcrypt.compareSync(password, user.password);
    if (!isCorrect) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current document
app.get('/api/document', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM document ORDER BY updated_at DESC LIMIT 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin edits document directly
app.put('/api/document', async (req, res) => {
  const { content, username } = req.body;
  try {
    const current = await pool.query('SELECT * FROM document LIMIT 1');
    await pool.query(
      'INSERT INTO history (content, changed_by, action) VALUES ($1, $2, $3)',
      [current.rows[0].content, username, 'edited']
    );
    await pool.query(
      'UPDATE document SET content=$1, updated_by=$2, updated_at=NOW() WHERE id=$3',
      [content, username, current.rows[0].id]
    );
    res.json({ message: 'Document updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get version history
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM history ORDER BY changed_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit suggestion (editor)
app.post('/api/suggestions', async (req, res) => {
  const { suggested_content, username } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO suggestions (suggested_content, suggested_by) VALUES ($1, $2) RETURNING *',
      [suggested_content, username]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all suggestions
app.get('/api/suggestions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suggestions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve suggestion (admin)
app.put('/api/suggestions/:id/approve', async (req, res) => {
  const { username } = req.body;
  try {
    const sug = await pool.query('SELECT * FROM suggestions WHERE id=$1', [req.params.id]);
    const { suggested_content } = sug.rows[0];
    const current = await pool.query('SELECT * FROM document LIMIT 1');
    await pool.query(
      'INSERT INTO history (content, changed_by, action) VALUES ($1, $2, $3)',
      [current.rows[0].content, username, 'approved']
    );
    await pool.query(
      'UPDATE document SET content=$1, updated_by=$2, updated_at=NOW() WHERE id=$3',
      [suggested_content, username, current.rows[0].id]
    );
    await pool.query('UPDATE suggestions SET status=$1 WHERE id=$2', ['approved', req.params.id]);
    res.json({ message: 'Suggestion approved' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject suggestion (admin)
app.put('/api/suggestions/:id/reject', async (req, res) => {
  try {
    await pool.query('UPDATE suggestions SET status=$1 WHERE id=$2', ['rejected', req.params.id]);
    res.json({ message: 'Suggestion rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught error:', err.message);
});