const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ── GET NOTIFICATIONS FOR USER ─────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    // Get broadcast alerts + alerts for reports near user
    const result = await pool.query(`
      SELECT * FROM notifications
      WHERE type = 'broadcast'
      ORDER BY created_at DESC
      LIMIT 30
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── MARK ALL READ ──────────────────────────────────────────────────────────────
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO notification_reads (user_id, read_at)
       VALUES ($1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET read_at = NOW()`,
      [req.user.id]
    );
    res.json({ message: 'Marked as read ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET UNREAD COUNT ───────────────────────────────────────────────────────────
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const lastRead = await pool.query(
      `SELECT read_at FROM notification_reads WHERE user_id = $1`,
      [req.user.id]
    );

    const since = lastRead.rows[0]?.read_at || new Date(0);

    const count = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE created_at > $1`,
      [since]
    );

    res.json({ count: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;