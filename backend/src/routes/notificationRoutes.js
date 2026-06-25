const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET notifications — exclude soft-deleted rows
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM notifications
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 30
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET unread count — exclude soft-deleted rows
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const lastRead = await pool.query(
      `SELECT read_at FROM notification_reads WHERE user_id = $1`,
      [req.user.id]
    );
    const since = lastRead.rows[0]?.read_at || new Date(0);

    const count = await pool.query(
      `SELECT COUNT(*) FROM notifications
       WHERE created_at > $1
         AND deleted_at IS NULL`,
      [since]
    );

    res.json({ count: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT mark all read
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

// DELETE /clear-all — MUST be declared before /:id so Express doesn't treat
// "clear-all" as an :id parameter value
router.delete('/clear-all', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET deleted_at = NOW()
       WHERE deleted_at IS NULL
       RETURNING id`
    );
    res.json({
      message: `Cleared ${result.rowCount} notification(s) ✅`,
      count: result.rowCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — soft-delete a single notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET deleted_at = NOW()
       WHERE id = $1
         AND deleted_at IS NULL
       RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
