// Operational error carrying an HTTP status code. Thrown from controllers and
// turned into a JSON response by the central error handler.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = ApiError;
