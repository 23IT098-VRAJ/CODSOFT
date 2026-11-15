require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');

// Started directly (`node server.js`, Render, local dev) → listen on a port.
// Imported (Vercel serverless function, tests) → just export the app.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection failed:', err.details || err.message));

  const server = app.listen(PORT, () => console.log(`ShopIndi API listening on http://localhost:${PORT}`));

  // Say plainly why the server could not start, instead of a stack trace.
  server.on('error', (err) => {
    const reason = err.code === 'EADDRINUSE' ? `port ${PORT} is already in use by another program` : err.message;
    console.error(`Could not start the API: ${reason}.`);
    if (err.code === 'EADDRINUSE') console.error('Stop the other program, or set a different PORT in server/.env.');
    process.exit(1);
  });
}

module.exports = app;
