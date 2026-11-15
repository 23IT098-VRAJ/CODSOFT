const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const router = express.Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

router.post('/register', authLimiter, validate({ body: s.register }), auth.register);
router.post('/login', authLimiter, validate({ body: s.login }), auth.login);

router.get('/me', protect, auth.getMe);
router.put('/me', protect, validate({ body: s.updateProfile }), auth.updateMe);
router.put('/password', protect, authLimiter, validate({ body: s.changePassword }), auth.changePassword);

module.exports = router;
