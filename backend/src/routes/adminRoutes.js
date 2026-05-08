const express = require('express');
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(verifyToken, requireAdmin);

// ── DASHBOARD STATS ────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [users, reports, resolved, critical] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM reports'),
      pool.query("SELECT COUNT(*) FROM reports WHERE status = 'resolved'"),
      pool.query("SELECT COUNT(*) FROM reports WHERE severity = 'critical'"),
    ]);

    const recentReports = await pool.query(`
      SELECT r.id, r.hazard_type, r.severity, r.status, r.created_at, u.name AS user_name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC LIMIT 10
    `);

    const reportsByDay = await pool.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM reports
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY day ORDER BY day
    `);

    const reportsBySeverity = await pool.query(`
      SELECT severity, COUNT(*) AS count FROM reports GROUP BY severity
    `);

    res.json({
      stats: {
        total_users: parseInt(users.rows[0].count),
        total_reports: parseInt(reports.rows[0].count),
        resolved_reports: parseInt(resolved.rows[0].count),
        critical_reports: parseInt(critical.rows[0].count),
      },
      recent_reports: recentReports.rows,
      reports_by_day: reportsByDay.rows,
      reports_by_severity: reportsBySeverity.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ALL USERS ──────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.name, u.email, u.role, u.is_verified, u.created_at,
             COUNT(r.id)::int AS report_count
      FROM users u
      LEFT JOIN reports r ON r.user_id = u.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE u.name ILIKE $1 OR u.email ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const total = await pool.query('SELECT COUNT(*) FROM users');

    res.json({ users: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE USER ────────────────────────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('UPDATE reports SET user_id = NULL WHERE user_id = $1', [req.params.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CHANGE USER ROLE ───────────────────────────────────────────────────────────
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.json({ message: 'Role updated ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ALL REPORTS ────────────────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const { status, severity, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (status) { params.push(status); conditions.push(`r.status = $${params.length}`); }
    if (severity) { params.push(severity); conditions.push(`r.severity = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`r.hazard_type ILIKE $${params.length} OR r.description ILIKE $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT r.*, u.name AS user_name, u.email AS user_email
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const total = await pool.query(`SELECT COUNT(*) FROM reports r ${where}`, params);

    res.json({ reports: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE REPORT STATUS (ADMIN) ───────────────────────────────────────────────
router.put('/reports/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['active', 'under_review', 'under_construction', 'being_monitored', 'partially_fixed', 'resolved'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    await pool.query(
      `UPDATE reports SET status = $1 WHERE id = $2`,
      [status, req.params.id]
    );

    await pool.query(
      `INSERT INTO report_status_history (report_id, new_status, user_role, previous_status)
       VALUES ($1, $2, 'admin', (SELECT status FROM reports WHERE id = $1))`,
      [req.params.id, status]
    );

    res.json({ message: 'Status updated ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE REPORT ──────────────────────────────────────────────────────────────
router.delete('/reports/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM report_status_history WHERE report_id = $1', [req.params.id]);
    await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
    res.json({ message: 'Report deleted ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── BROADCAST ALERT ────────────────────────────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  try {
    const { title, message, severity } = req.body;
    if (!title || !message)
      return res.status(400).json({ message: 'Title and message required' });

    await pool.query(
      `INSERT INTO notifications (title, message, severity, type, created_at)
       VALUES ($1, $2, $3, 'broadcast', NOW())`,
      [title, message, severity || 'medium']
    );

    res.json({ message: 'Alert broadcast sent ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;