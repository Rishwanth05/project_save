const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const contactRoutes = require('./routes/contactRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SEC7 — Global rate limit: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// SEC7 — Strict rate limit for auth routes: 20 requests per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts. Try again in 15 minutes.' },
});

// SEC4 — CSRF protection on all state-changing routes
const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'strict' } });

app.get('/', (req, res) => res.json({ message: 'Project SAVE backend ✅' }));
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// SEC4 — expose CSRF token to frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/api/auth', authLimiter, csrfProtection, authRoutes);
app.use('/api/reports', csrfProtection, reportRoutes);
app.use('/api/contact', csrfProtection, contactRoutes);
app.use('/api/badges', csrfProtection, badgeRoutes);
app.use('/api/admin', csrfProtection, adminRoutes);
app.use('/api/notifications', csrfProtection, notificationRoutes);

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN')
    return res.status(403).json({ message: 'Invalid or missing CSRF token.' });
  console.error('❌', err.message);
  res.status(err.status || 500).json({ error: { message: err.message || 'Internal server error' } });
});

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

module.exports = app;