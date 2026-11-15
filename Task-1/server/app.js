const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
const isTest = process.env.NODE_ENV === 'test';

app.set('trust proxy', 1); // correct client IPs behind Vercel / Render

// ── Security & parsing ────────────────────────────────────────────────
app.use(helmet());

// CLIENT_URL may hold a comma-separated allow-list. When it is not set
// (local development, same-origin Vercel deploy) every origin is allowed.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));

app.use(express.json({ limit: '100kb' }));
if (!isTest) app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: { message: 'Too many requests. Please slow down.' },
  })
);

// ── Routes ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: Math.round(process.uptime()) }));

// Make sure the (cached) database connection is ready before any data route.
app.use('/api', (req, res, next) => {
  connectDB()
    .then(() => next())
    .catch(next);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/admin', require('./routes/admin'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
