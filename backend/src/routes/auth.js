const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (user.active === false) {
      return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    if (user.subadmin_id) {
      tokenPayload.subadmin_id = user.subadmin_id;
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, subadmin_id: user.subadmin_id || null }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let subadminId = null;
    if (req.user.role === 'subadmin') {
      subadminId = req.user.id;
    }

    const insertRole = req.user.role === 'superadmin' ? (role || 'scanner') : 'scanner';

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, subadmin_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, subadmin_id',
      [username, passwordHash, insertRole, subadminId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/scanners', authMiddleware, adminOnly, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'subadmin') {
      result = await pool.query(
        "SELECT id, username, role, active, created_at FROM users WHERE subadmin_id = $1 AND role = 'scanner' ORDER BY created_at DESC",
        [req.user.id]
      );
    } else {
      result = await pool.query(
        "SELECT id, username, role, active, subadmin_id, created_at FROM users WHERE role != 'superadmin' ORDER BY created_at DESC"
      );
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Get scanners error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/scanners/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    if (req.user.role === 'subadmin') {
      const check = await pool.query('SELECT id FROM users WHERE id = $1 AND subadmin_id = $2', [id, req.user.id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Scanner not found' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Scanner deleted' });
  } catch (error) {
    console.error('Delete scanner error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
