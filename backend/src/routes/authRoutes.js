const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xss = require('xss');
const pool = require('../db');
const { generateOTP, sendOTPEmail } = require('../utils/email');
const { verifyToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Try again in 15 minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  message: { message: 'Too many OTP requests. Try again in 30 minutes.' },
});

// ── SIGNUP (step 1) ────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    // SEC3 — sanitize name
    const clean_name = xss(name.trim());

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0)
      return res.status(409).json({ message: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO users (name, email, password_hash, is_verified, role)
       VALUES ($1, $2, $3, false, 'user')
       ON CONFLICT (email) DO NOTHING`,
      [clean_name, email, password_hash]
    );

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_codes (email, code, purpose, expires_at)
       VALUES ($1, $2, 'verify', $3)
       ON CONFLICT (email, purpose) DO UPDATE
       SET code = $2, expires_at = $3, attempts = 0`,
      [email, otp, expires_at]
    );

    await sendOTPEmail(email, otp, 'verify');
    res.json({ message: 'OTP sent to your email', email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── VERIFY EMAIL OTP ───────────────────────────────────────────────────────────
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP required' });

    const result = await pool.query(
      `SELECT * FROM otp_codes WHERE email = $1 AND purpose = 'verify'`,
      [email]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ message: 'No OTP found. Request a new one.' });

    const record = result.rows[0];

    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ message: 'OTP expired. Request a new one.' });

    if (record.attempts >= 5)
      return res.status(429).json({ message: 'Too many incorrect attempts. Request a new OTP.' });

    if (record.code !== otp) {
      const updated = await pool.query(
        `UPDATE otp_codes SET attempts = attempts + 1
         WHERE email = $1 AND purpose = 'verify'
         RETURNING attempts`,
        [email]
      );
      const attemptsLeft = 5 - updated.rows[0].attempts;
      if (attemptsLeft <= 0) {
        await pool.query(
          `DELETE FROM otp_codes WHERE email = $1 AND purpose = 'verify'`,
          [email]
        );
        return res.status(429).json({ message: 'Too many incorrect attempts. Request a new OTP.' });
      }
      return res.status(400).json({
        message: `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      });
    }

    await pool.query(
      `UPDATE users SET is_verified = true, failed_login_attempts = 0, locked_until = NULL WHERE email = $1`,
      [email]
    );
    await pool.query(`DELETE FROM otp_codes WHERE email = $1 AND purpose = 'verify'`, [email]);

    const user = await pool.query(
      `SELECT id, name, email, role FROM users WHERE email = $1`,
      [email]
    );

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Email verified ✅', token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LOGIN (step 1) ─────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    const user = result.rows[0];

    if (!user.is_verified)
      return res.status(403).json({ message: 'Please verify your email first', needsVerification: true, email });

    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        message: `Account locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      const updated = await pool.query(
        `UPDATE users
         SET failed_login_attempts = failed_login_attempts + 1
         WHERE email = $1
         RETURNING failed_login_attempts`,
        [email]
      );
      const attempts = updated.rows[0].failed_login_attempts;

      if (attempts >= 5) {
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await pool.query(
          `UPDATE users SET locked_until = $1 WHERE email = $2`,
          [lockedUntil, email]
        );
        try {
          await sendOTPEmail(email, null, 'lockout');
        } catch (_) {}

        return res.status(423).json({
          message: 'Account locked for 30 minutes due to too many failed attempts. Check your email.',
        });
      }

      const attemptsLeft = 5 - attempts;
      return res.status(401).json({
        message: `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} before lockout.`,
      });
    }

    await pool.query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = $1`,
      [email]
    );

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_codes (email, code, purpose, expires_at)
       VALUES ($1, $2, 'login', $3)
       ON CONFLICT (email, purpose) DO UPDATE
       SET code = $2, expires_at = $3, attempts = 0`,
      [email, otp, expires_at]
    );

    await sendOTPEmail(email, otp, 'login');
    res.json({ message: 'OTP sent to your email', email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── VERIFY LOGIN OTP ───────────────────────────────────────────────────────────
router.post('/verify-login', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP required' });

    const result = await pool.query(
      `SELECT * FROM otp_codes WHERE email = $1 AND purpose = 'login'`,
      [email]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ message: 'No OTP found. Login again.' });

    const record = result.rows[0];

    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ message: 'OTP expired. Login again.' });

    if (record.attempts >= 5)
      return res.status(429).json({ message: 'Too many incorrect attempts. Request a new OTP.' });

    if (record.code !== otp) {
      const updated = await pool.query(
        `UPDATE otp_codes SET attempts = attempts + 1
         WHERE email = $1 AND purpose = 'login'
         RETURNING attempts`,
        [email]
      );
      const attemptsLeft = 5 - updated.rows[0].attempts;
      if (attemptsLeft <= 0) {
        await pool.query(
          `DELETE FROM otp_codes WHERE email = $1 AND purpose = 'login'`,
          [email]
        );
        return res.status(429).json({ message: 'Too many incorrect attempts. Request a new OTP.' });
      }
      return res.status(400).json({
        message: `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      });
    }

    await pool.query(`DELETE FROM otp_codes WHERE email = $1 AND purpose = 'login'`, [email]);

    const user = await pool.query(
      `SELECT id, name, email, role FROM users WHERE email = $1`,
      [email]
    );

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful ✅', token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RESEND OTP ─────────────────────────────────────────────────────────────────
router.post('/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose)
      return res.status(400).json({ message: 'Email and purpose required' });

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_codes (email, code, purpose, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, purpose) DO UPDATE
       SET code = $2, expires_at = $4, attempts = 0`,
      [email, otp, purpose, expires_at]
    );

    await sendOTPEmail(email, otp, purpose);
    res.json({ message: 'OTP resent ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET MY PROFILE ─────────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, is_verified FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET MY REPORTS ─────────────────────────────────────────────────────────────
router.get('/my-reports', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE NAME ────────────────────────────────────────────────────────────────
router.put('/update-name', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: 'Name is required' });

    // SEC3 — sanitize name
    const clean_name = xss(name.trim());

    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, role',
      [clean_name, req.user.id]
    );
    res.json({ message: 'Name updated ✅', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────────
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password)
      return res.status(400).json({ message: 'Both fields required' });
    if (new_password.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: 'Current password is incorrect' });

    const password_hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);
    res.json({ message: 'Password changed ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REQUEST ACCOUNT DELETION OTP ───────────────────────────────────────────────
router.post('/request-delete', verifyToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const email = user.rows[0].email;

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_codes (email, code, purpose, expires_at)
       VALUES ($1, $2, 'delete', $3)
       ON CONFLICT (email, purpose) DO UPDATE
       SET code = $2, expires_at = $3, attempts = 0`,
      [email, otp, expires_at]
    );

    await sendOTPEmail(email, otp, 'delete');
    res.json({ message: 'Deletion OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CONFIRM ACCOUNT DELETION ───────────────────────────────────────────────────
router.delete('/delete-account', verifyToken, async (req, res) => {
  try {
    const { otp, reason } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP required' });

    const user = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const email = user.rows[0].email;

    const record = await pool.query(
      `SELECT * FROM otp_codes WHERE email = $1 AND purpose = 'delete'`,
      [email]
    );

    if (record.rows.length === 0)
      return res.status(400).json({ message: 'No deletion OTP found. Request one first.' });

    const otpRow = record.rows[0];

    if (new Date() > new Date(otpRow.expires_at))
      return res.status(400).json({ message: 'OTP expired. Request a new one.' });

    if (otpRow.attempts >= 5)
      return res.status(429).json({ message: 'Too many incorrect attempts. Request a new OTP.' });

    if (otpRow.code !== otp) {
      const updated = await pool.query(
        `UPDATE otp_codes SET attempts = attempts + 1
         WHERE email = $1 AND purpose = 'delete'
         RETURNING attempts`,
        [email]
      );
      const attemptsLeft = 5 - updated.rows[0].attempts;
      if (attemptsLeft <= 0) {
        await pool.query(
          `DELETE FROM otp_codes WHERE email = $1 AND purpose = 'delete'`,
          [email]
        );
        return res.status(429).json({ message: 'Too many incorrect attempts. Request a new OTP.' });
      }
      return res.status(400).json({
        message: `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      });
    }

    await pool.query(`UPDATE reports SET user_id = NULL WHERE user_id = $1`, [req.user.id]);

    if (reason) {
      await pool.query(
        `INSERT INTO account_deletions (email, reason, deleted_at) VALUES ($1, $2, NOW())`,
        [email, reason]
      );
    }

    await pool.query(`DELETE FROM otp_codes WHERE email = $1`, [email]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [req.user.id]);

    res.json({ message: 'Account permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    // Always return success even if email not found (prevents email enumeration)
    if (result.rows.length === 0)
      return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = require('crypto').randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Invalidate any existing tokens for this email
    await pool.query(
      `UPDATE password_reset_tokens SET used = true WHERE email = $1`,
      [email]
    );

    await pool.query(
      `INSERT INTO password_reset_tokens (email, token, expires_at)
       VALUES ($1, $2, $3)`,
      [email, token, expires_at]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await pool.query('SELECT 1'); // keep pool warm
    const { sendResetEmail } = require('../utils/email');
    await sendResetEmail(email, resetLink);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RESET PASSWORD ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password)
      return res.status(400).json({ message: 'Token and new password required' });
    if (new_password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false`,
      [token]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Invalid or expired reset link.' });

    const record = result.rows[0];

    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ message: 'Reset link has expired. Request a new one.' });

    const user = await pool.query('SELECT id FROM users WHERE email = $1', [record.email]);
    if (user.rows.length === 0)
      return res.status(400).json({ message: 'User not found.' });

    const userId = user.rows[0].id;

    // Check last 5 passwords
    const history = await pool.query(
      `SELECT password_hash FROM password_history
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    for (const row of history.rows) {
      const reused = await bcrypt.compare(new_password, row.password_hash);
      if (reused)
        return res.status(400).json({ message: 'You cannot reuse one of your last 5 passwords.' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, userId]);

    // Save to history
    await pool.query(
      'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
      [userId, password_hash]
    );

    // Mark token used
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    );

    // Invalidate all sessions by clearing any OTP codes
    await pool.query('DELETE FROM otp_codes WHERE email = $1', [record.email]);

    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;