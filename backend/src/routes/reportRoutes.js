const express = require("express");
const db = require("../db");

const router = express.Router();

// QUICK TEST
router.get("/test", (req, res) => {
  res.json({ message: "reports route working ✅" });
});

// GET ALL REPORTS
router.get("/all", async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT r.*, u.name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE REPORT (no file for now, only data)
router.post("/create", async (req, res) => {
  try {
    const { user_id, hazard_type, severity, description, latitude, longitude } = req.body;

    if (!user_id || !hazard_type || !severity || !description || latitude == null || longitude == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await db.promise().query(
      `INSERT INTO reports (user_id, hazard_type, severity, description, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, hazard_type, severity, description, latitude, longitude]
    );

    res.status(201).json({ message: "Report created ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
