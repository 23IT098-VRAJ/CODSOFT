const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../middleware/auth');
const { AVATAR_COLORS } = require('../config/constants');

const session = (user) => ({ token: signToken(user._id), user: user.toPublic() });

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'Email already registered');

  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const user = await User.create({ name, email, password, avatarColor }); // hashed by the model
  res.status(201).json(session(user));
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // One message for "no such user" and "wrong password", so the endpoint
  // cannot be used to find out which emails are registered.
  //
  // The status is 400 rather than the more usual 401 on purpose: the web
  // client treats every 401 as "session expired" and reloads the login page,
  // which would wipe this message before the user could read it.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(400, 'Invalid email or password');
  }
  res.json(session(user));
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user.toPublic() });
};

// PUT /api/auth/me
exports.updateMe = async (req, res) => {
  req.user.name = req.body.name;
  await req.user.save();
  res.json({ user: req.user.toPublic() });
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  if (currentPassword === newPassword) throw new ApiError(400, 'New password must be different from the current one');

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
};
