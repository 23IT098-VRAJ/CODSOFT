const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// The promise is cached so that serverless invocations (Vercel) and the
// long-running server (Render / local) both reuse a single connection.
let connectionPromise = null;

async function connectDB(uri = process.env.MONGO_URI) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!uri) {
    throw new ApiError(500, 'Server misconfigured: the MONGO_URI environment variable is not set');
  }
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .catch((err) => {
        connectionPromise = null; // allow a retry on the next request
        throw new ApiError(503, 'Database is unavailable. Please try again shortly.', err.message);
      });
  }
  await connectionPromise;
  return mongoose.connection;
}

async function disconnectDB() {
  connectionPromise = null;
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
