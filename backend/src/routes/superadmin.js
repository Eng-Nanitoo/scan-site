const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { authMiddleware, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, superAdminOnly);

router.get('/subadmins', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.active, u.created_at,
        (SELECT COUNT(*) FROM cards WHERE subadmin_id = u.id) AS card_count,
        (SELECT COUNT(*) FROM users WHERE subadmin_id = u.id AND role = 'scanner') AS scanner_count
      FROM users u
      WHERE u.role = 'subadmin'
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get subadmins error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/subadmins', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, active, created_at',
      [username, passwordHash, 'subadmin']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create subadmin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/subadmins/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE users SET active = NOT active WHERE id = $1 AND role = $2 RETURNING id, username, active',
      [id, 'subadmin']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-admin not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle subadmin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/subadmins/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const check = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [id, 'subadmin']);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Sub-admin not found' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Sub-admin deleted' });
  } catch (error) {
    console.error('Delete subadmin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
