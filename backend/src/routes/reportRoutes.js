const express = require("express");
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const xss = require("xss");
const { sendPushNotification } = require("../config/firebase");
const redis = require("../config/redis");
const { getCache, setCache } = require("../config/redis");
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const { S3Client } = require('@aws-sdk/client-s3')
const multerS3 = require('multer-s3')

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'), false)
  }
}

const upload = multer({
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
      cb(null, `uploads/${uniqueName}`)
    }
  })
})

// TRUST-1 — Recalculate trust score and badge tier
async function updateTrustScore(pool, userId, delta) {
  const result = await pool.query(
    `UPDATE users
     SET trust_score = GREATEST(0, LEAST(1000, trust_score + $1))
     WHERE id = $2
     RETURNING trust_score`,
    [delta, userId]
  )
  const score = result.rows[0]?.trust_score || 100
  const tier =
    score >= 800 ? 'Hero' :
    score >= 600 ? 'Guardian' :
    score >= 400 ? 'Trusted' :
    score >= 200 ? 'Reporter' : 'Newcomer'
  await pool.query(`UPDATE users SET badge_tier = $1 WHERE id = $2`, [tier, userId])
  return { score, tier }
}

async function dailyReportLimit(req, res, next) {
  try {
    const userId = req.user?.id
    if (!userId) return next()
    const today = new Date().toISOString().slice(0, 10)
    const key = `daily_reports:${userId}:${today}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 86400)
    if (count > 5) {
      return res.status(429).json({
        message: 'Daily report limit reached. You can submit up to 5 reports per day.'
      })
    }
    next()
  } catch (err) {
    next()
  }
}

router.get("/all", verifyToken, async (req, res) => {
  try {
    try {
      const cached = await getCache('reports:all');
      if (cached) return res.json(cached);
    } catch {}

    const result = await pool.query(`
      SELECT r.*, u.name, u.trust_score, u.badge_tier
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);

    try {
      await setCache('reports:all', result.rows, 30);
    } catch {}

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TRUST-1 — Get user trust score
router.get('/trust/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT trust_score, badge_tier FROM users WHERE id = $1`,
      [req.params.userId]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post("/create", dailyReportLimit, upload.single("image"), async (req, res) => {
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

    const image_url = req.file ? req.file.location : null;

    const result = await pool.query(
      `INSERT INTO reports
        (user_id, hazard_type, severity, description, custom_description, latitude, longitude, location_method, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, clean_hazard_type, severity, clean_description, clean_custom_description,
       latitude, longitude, location_method || "gps", image_url]
    );

    const newReport = result.rows[0]

    try { await redis.del('reports:all'); } catch {}

    // TRUST-1 — +10 points for submitting a report
    await updateTrustScore(pool, user_id, 10)

    // Update reporter's last known location so future FCM broadcasts can radius-filter them
    await pool.query(
      `UPDATE users SET last_lat = $1, last_lng = $2 WHERE id = $3`,
      [latitude, longitude, user_id]
    );

    const io = req.app.get('io')
    if (io) {
      io.emit('new-report', { ...newReport, name: req.body.reporter_name || 'Anonymous' })
    }

    // FCM — notify users within 30 miles of the hazard (fire and forget)
    // Uses Haversine formula (3959 = Earth radius in miles).
    // LEAST(1, ...) guards against floating-point rounding above 1 that would make acos return NaN.
    // Users with no last_lat/last_lng (never submitted a report) are excluded.
    pool.query(
      `SELECT fcm_token
       FROM users
       WHERE fcm_token IS NOT NULL
         AND last_lat IS NOT NULL
         AND last_lng IS NOT NULL
         AND (3959 * acos(LEAST(1,
               cos(radians($1)) * cos(radians(last_lat)) *
               cos(radians(last_lng) - radians($2)) +
               sin(radians($1)) * sin(radians(last_lat))
             ))) <= 30`,
      [latitude, longitude]
    )
      .then(({ rows }) => {
        const notifTitle = clean_hazard_type;
        const notifBody = `${severity} hazard reported nearby`;
        rows.forEach(({ fcm_token }) =>
          sendPushNotification(fcm_token, notifTitle, notifBody)
        );
      })
      .catch((err) => console.error('FCM broadcast query failed:', err.message));

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

    const proof_url = req.file.location;

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

    // TRUST-1 — +25 points for resolving a report
    const reportOwner = await pool.query('SELECT user_id FROM reports WHERE id = $1', [report_id])
    if (reportOwner.rows[0]?.user_id) {
      await updateTrustScore(pool, reportOwner.rows[0].user_id, 25)
    }

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
      `SELECT id, hazard_type, description, created_at, distance_meters
       FROM (
         SELECT id, hazard_type, description, created_at,
           (6371000 * acos(LEAST(1,
             cos(radians($1)) * cos(radians(latitude)) *
             cos(radians(longitude) - radians($2)) +
             sin(radians($1)) * sin(radians(latitude))
           ))) AS distance_meters
         FROM reports
         WHERE hazard_type = $3
           AND created_at > NOW() - INTERVAL '24 hours'
           AND latitude IS NOT NULL
           AND longitude IS NOT NULL
       ) sub
       WHERE distance_meters < 50
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
