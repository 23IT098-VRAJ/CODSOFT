const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { protect } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/error');
const dashboard = require('./controllers/dashboardController');

const app = express();
const isTest = process.env.NODE_ENV === 'test';

app.set('trust proxy', 1); // correct client IPs behind Vercel / Render

// ── Security & parsing ────────────────────────────────────────────────
app.use(helmet());

// CLIENT_URL holds a comma-separated allow-list of frontends.
app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((o) => o.trim()) : ['http://localhost:5174'],
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
if (!isTest) app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // generous: a busy Kanban board makes a request per drag
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: { message: 'Too many requests. Please slow down.' },
  })
);

// ── Routes ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Make sure the (cached) database connection is ready before any data route.
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.get('/api/dashboard', protect, dashboard.getDashboard);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
