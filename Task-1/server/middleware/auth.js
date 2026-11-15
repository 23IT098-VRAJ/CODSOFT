const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, 'Server misconfigured: the JWT_SECRET environment variable is not set');
  }
  return process.env.JWT_SECRET;
};

const signToken = (user) => jwt.sign({ _id: user._id }, getSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Verifies the Bearer token and loads the user from the database, so that a
// deleted account or a changed role takes effect immediately instead of
// living on inside an old token.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Please log in to continue');

  const decoded = jwt.verify(header.slice(7), getSecret());
  const user = await User.findById(decoded._id);
  if (!user) throw new ApiError(401, 'Account no longer exists');

  req.user = user;
  next();
});

// Role guard — use after protect: router.use(protect, authorize('admin'))
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to do this'));
  }
  next();
};

module.exports = { protect, authorize, signToken };
