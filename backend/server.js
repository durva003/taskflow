const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./openapi.yaml');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const SECRET = 'taskflow_secret';

// Login
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let result = await pool.query('SELECT * FROM admins WHERE username=$1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (password !== user.password) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, username: user.username, role: 'admin' }, SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, username: user.username, role: 'admin' } });
    }

    result = await pool.query('SELECT * FROM editors WHERE username=$1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (password !== user.password) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, username: user.username, role: 'editor', team_id: user.team_id }, SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, username: user.username, role: 'editor', team_id: user.team_id } });
    }

    result = await pool.query('SELECT * FROM viewers WHERE username=$1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (password !== user.password) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, username: user.username, role: 'viewer', team_id: user.team_id }, SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, username: user.username, role: 'viewer', team_id: user.team_id } });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get documents
app.get('/api/v1/documents', async (req, res) => {
  const { team_id, role } = req.query;
  try {
    let result;
    if (role === 'admin') {
      result = await pool.query('SELECT d.*, t.name as team_name FROM documents d JOIN teams t ON d.team_id=t.id ORDER BY d.updated_at DESC');
    } else {
      result = await pool.query('SELECT d.*, t.name as team_name FROM documents d JOIN teams t ON d.team_id=t.id WHERE d.team_id=$1 ORDER BY d.updated_at DESC', [team_id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single document
app.get('/api/v1/documents/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id=$1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create document
app.post('/api/v1/documents', async (req, res) => {
  const { title, content, team_id, username } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO documents (title, content, team_id, updated_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, team_id, username]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get history
app.get('/api/v1/documents/:id/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM history WHERE document_id=$1 ORDER BY changed_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit suggestion
app.post('/api/v1/suggestions', async (req, res) => {
  const { document_id, suggested_content, username } = req.body;
  try {
    const doc = await pool.query('SELECT * FROM documents WHERE id=$1', [document_id]);
    const result = await pool.query(
      'INSERT INTO suggestions (document_id, suggested_content, suggested_by, original_content) VALUES ($1, $2, $3, $4) RETURNING *',
      [document_id, suggested_content, username, doc.rows[0].content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get suggestions
app.get('/api/v1/suggestions/:document_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suggestions WHERE document_id=$1 ORDER BY created_at DESC',
      [req.params.document_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve suggestion
app.put('/api/v1/suggestions/:id/approve', async (req, res) => {
  const { username } = req.body;
  try {
    const sug = await pool.query('SELECT * FROM suggestions WHERE id=$1', [req.params.id]);
    const { document_id, suggested_content } = sug.rows[0];
    const doc = await pool.query('SELECT * FROM documents WHERE id=$1', [document_id]);
    await pool.query(
      'INSERT INTO history (document_id, content, changed_by, action) VALUES ($1, $2, $3, $4)',
      [document_id, doc.rows[0].content, username, 'approved']
    );
    await pool.query(
      'UPDATE documents SET content=$1, updated_by=$2, updated_at=NOW() WHERE id=$3',
      [suggested_content, username, document_id]
    );
    await pool.query('UPDATE suggestions SET status=$1 WHERE id=$2', ['approved', req.params.id]);
    res.json({ message: 'Suggestion approved' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject suggestion
app.put('/api/v1/suggestions/:id/reject', async (req, res) => {
  try {
    await pool.query('UPDATE suggestions SET status=$1 WHERE id=$2', ['rejected', req.params.id]);
    res.json({ message: 'Suggestion rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teams
app.get('/api/v1/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Hash password helper (temporary)
app.get('/api/v1/hash/:password', async (req, res) => {
  const hash = bcrypt.hashSync(req.params.password, 10);
  res.json({ hash });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
}).on('error', (err) => {
  console.error('Server error:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught error:', err.message);
});