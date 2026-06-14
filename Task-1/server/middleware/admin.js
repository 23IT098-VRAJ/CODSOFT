const authMiddleware = require('./auth');

const adminMiddleware = async (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  });
};

module.exports = adminMiddleware;
