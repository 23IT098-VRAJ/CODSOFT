// Express 4 does not catch rejected promises from async handlers.
// This wrapper forwards them to next() so the error middleware can respond.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
