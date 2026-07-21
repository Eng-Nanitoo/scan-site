const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

router.post('/logo', authMiddleware, adminOnly, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    await pool.query('UPDATE settings SET logo_url = $1 WHERE id = 1', [logoUrl]);

    res.json({ logoUrl });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/settings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { event_name } = req.body;

    await pool.query('UPDATE settings SET event_name = $1 WHERE id = 1', [event_name]);

    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/generate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { guest_names, count } = req.body;
    let names = guest_names || [];

    if (!guest_names && count) {
      for (let i = 1; i <= count; i++) {
        names.push(`Guest ${i}`);
      }
    }

    if (names.length === 0) {
      return res.status(400).json({ error: 'Provide guest_names array or count' });
    }

    const cards = [];
    for (const name of names) {
      const uniqueKey = uuidv4();
      const result = await pool.query(
        'INSERT INTO cards (unique_key, guest_name) VALUES ($1, $2) RETURNING *',
        [uniqueKey, name]
      );
      cards.push(result.rows[0]);
    }

    res.status(201).json(cards);
  } catch (error) {
    console.error('Generate cards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT * FROM cards WHERE unique_key = $1', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cards');
    res.json({ message: 'All cards deleted', count: result.rowCount });
  } catch (error) {
    console.error('Delete all cards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cards WHERE id = $1', [id]);
    res.json({ message: 'Card deleted' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
