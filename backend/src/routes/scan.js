const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

async function logActivity(userId, username, action, guestName, details) {
  try {
    await pool.query(
      'INSERT INTO activity_log (user_id, username, action, guest_name, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, username, action, guestName, details]
    );
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { unique_key } = req.body;

    if (!unique_key) {
      return res.status(400).json({ error: 'QR code key is required' });
    }

    const cardResult = await pool.query('SELECT * FROM cards WHERE unique_key = $1', [unique_key]);

    if (cardResult.rows.length === 0) {
      const io = req.app.get('io');
      const activityData = {
        id: Date.now(),
        username: req.user.username,
        action: 'scan_failed',
        guest_name: null,
        details: 'Unknown QR code scanned',
        created_at: new Date().toISOString()
      };
      if (io) io.emit('activity', activityData);
      await logActivity(req.user.id, req.user.username, 'scan_failed', null, 'Unknown QR code scanned');

      return res.status(404).json({ error: 'Card not found', status: 'not_found' });
    }

    const card = cardResult.rows[0];

    if (card.scanned) {
      const io = req.app.get('io');
      const activityData = {
        id: Date.now(),
        username: req.user.username,
        action: 'scan_duplicate',
        guest_name: card.guest_name,
        details: `Duplicate scan attempt for ${card.guest_name}`,
        created_at: new Date().toISOString()
      };
      if (io) io.emit('activity', activityData);
      await logActivity(req.user.id, req.user.username, 'scan_duplicate', card.guest_name, `Duplicate scan attempt for ${card.guest_name}`);

      return res.status(400).json({
        error: 'Card already scanned',
        status: 'already_scanned',
        scanned_at: card.scanned_at,
        guest_name: card.guest_name
      });
    }

    await pool.query(
      'UPDATE cards SET scanned = true, scanned_at = NOW(), scanned_by = $1 WHERE id = $2',
      [req.user.id, card.id]
    );

    const scanData = {
      message: 'Check-in successful',
      status: 'success',
      guest_name: card.guest_name,
      scanned_at: new Date().toISOString(),
      scanned_by: req.user.username
    };

    const io = req.app.get('io');
    if (io) {
      io.emit('guest_checked_in', scanData);
      io.emit('stats_updated');
    }

    const activityData = {
      id: Date.now(),
      username: req.user.username,
      action: 'check_in',
      guest_name: card.guest_name,
      details: `${card.guest_name} checked in`,
      created_at: new Date().toISOString()
    };
    if (io) io.emit('activity', activityData);
    await logActivity(req.user.id, req.user.username, 'check_in', card.guest_name, `${card.guest_name} checked in`);

    res.json(scanData);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM cards');
    const scannedResult = await pool.query('SELECT COUNT(*) FROM cards WHERE scanned = true');

    const total = parseInt(totalResult.rows[0].count);
    const scanned = parseInt(scannedResult.rows[0].count);
    const pending = total - scanned;

    const recentScans = await pool.query(`
      SELECT c.guest_name, c.scanned_at, u.username as scanned_by
      FROM cards c
      LEFT JOIN users u ON c.scanned_by = u.id
      WHERE c.scanned = true
      ORDER BY c.scanned_at DESC
      LIMIT 10
    `);

    res.json({
      total,
      scanned,
      pending,
      percentage: total > 0 ? Math.round((scanned / total) * 100) : 0,
      recent_scans: recentScans.rows
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await pool.query(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
