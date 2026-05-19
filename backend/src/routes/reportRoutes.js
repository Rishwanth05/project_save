const express = require("express");
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const xss = require("xss");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.get("/test", (req, res) => {
  res.json({ message: "Reports route working ✅" });
});

router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, u.name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const {
      user_id, hazard_type, severity, description,
      custom_description, latitude, longitude, location_method,
    } = req.body;

    if (!user_id || !hazard_type || !severity || !description ||
        latitude == null || longitude == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (hazard_type === 'Others' && !custom_description?.trim()) {
      return res.status(400).json({ message: "Please describe the hazard type" });
    }

    const clean_hazard_type = xss(hazard_type.trim());
    const clean_description = xss(description.trim());
    const clean_custom_description = custom_description ? xss(custom_description.trim()) : null;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO reports 
        (user_id, hazard_type, severity, description, custom_description, latitude, longitude, location_method, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, clean_hazard_type, severity, clean_description, clean_custom_description,
       latitude, longitude, location_method || "gps", image_url]
    );

    const newReport = result.rows[0]

    const io = req.app.get('io')
    if (io) {
      io.emit('new-report', { ...newReport, name: req.body.reporter_name || 'Anonymous' })
    }

    res.status(201).json({ message: "Report created ✅", report: newReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/resolve", upload.single("proof"), async (req, res) => {
  try {
    const { report_id } = req.body;

    if (!report_id)
      return res.status(400).json({ message: "report_id is required" });

    if (!req.file)
      return res.status(400).json({ message: "Camera proof image is required to resolve a report" });

    const proof_url = `/uploads/${req.file.filename}`;

    await pool.query(
      `UPDATE reports SET status = 'resolved', resolved_at = NOW() WHERE id = $1`,
      [report_id]
    );

    await pool.query(
      `INSERT INTO report_status_history 
        (report_id, new_status, previous_status, user_role, proof_image_url)
       VALUES ($1, 'resolved', 'active', 'user', $2)`,
      [report_id, proof_url]
    );

    res.json({ message: "Report resolved ✅", proofUrl: proof_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DUP1 — Duplicate detection: check 50m radius + same category + 24hr window
router.post("/check-duplicate", async (req, res) => {
  try {
    const { latitude, longitude, hazard_type } = req.body
    if (!latitude || !longitude || !hazard_type)
      return res.status(400).json({ message: 'Missing fields' })

    const result = await pool.query(
      `SELECT id, hazard_type, description, created_at,
        (6371000 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance_meters
       FROM reports
       WHERE hazard_type = $3
         AND created_at > NOW() - INTERVAL '24 hours'
         AND latitude IS NOT NULL
         AND longitude IS NOT NULL
       HAVING (6371000 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) < 50
       ORDER BY distance_meters ASC
       LIMIT 1`,
      [latitude, longitude, hazard_type]
    )

    if (result.rows.length > 0)
      return res.json({ isDuplicate: true, existing: result.rows[0] })

    res.json({ isDuplicate: false })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
});

module.exports = router;