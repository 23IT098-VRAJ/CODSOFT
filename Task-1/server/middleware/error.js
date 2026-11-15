const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Central error handler: every error in the app ends up here and is mapped
// to a consistent `{ message, errors? }` JSON body.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors;

  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose schema validation
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = errors[0]?.message || 'Validation failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `That ${field} is already in use`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Session expired. Please log in again.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (Array.isArray(err.details)) {
    errors = err.details; // field errors from the validate middleware
  }

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    // Never leak internals to clients in production.
    if (!err.isOperational && process.env.NODE_ENV === 'production') message = 'Internal server error';
  }

  res.status(status).json({ message, ...(errors ? { errors } : {}) });
};

module.exports = { notFound, errorHandler };
