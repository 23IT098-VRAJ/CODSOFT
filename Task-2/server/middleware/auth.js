const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const getSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, 'Server misconfigured: the JWT_SECRET environment variable is not set');
  }
  return process.env.JWT_SECRET;
};

const signToken = (userId) => jwt.sign({ id: userId }, getSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Verifies the Bearer token and loads the user, so a deleted account stops
// working immediately instead of living on inside an old token.
// (Express 5 forwards a rejected promise to the error handler on its own.)
const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Not authorized, no token');

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), getSecret());
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Account no longer exists');

  req.user = user;
  next();
};

module.exports = { protect, signToken };
