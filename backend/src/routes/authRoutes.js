const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// TEST ROUTE
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes working ✅" });
});

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role",
      [name, email, password_hash]
    );

    res.status(201).json({ message: "Signup successful ✅", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE NAME
router.put("/update-name", verifyToken, async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" })
    }
    const result = await pool.query(
      "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, role",
      [name.trim(), req.user.id]
    )
    res.json({ message: "Name updated ✅", user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CHANGE PASSWORD
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body
    if (!old_password || !new_password) {
      return res.status(400).json({ message: "Both fields required" })
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" })
    }
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id])
    const user = result.rows[0]
    const match = await bcrypt.compare(old_password, user.password_hash)
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }
    const password_hash = await bcrypt.hash(new_password, 12)
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [password_hash, req.user.id])
    res.json({ message: "Password changed ✅" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET MY REPORTS
router.get("/my-reports", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET MY PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router;