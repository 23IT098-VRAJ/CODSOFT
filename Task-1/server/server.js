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

  app.listen(PORT, () => console.log(`ShopIndi API listening on http://localhost:${PORT}`));
}

module.exports = app;
