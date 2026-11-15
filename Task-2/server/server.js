require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');

// Started directly (`node server.js`, Render, local dev) → listen on a port.
// Imported (Vercel serverless function, tests) → just export the app.
if (require.main === module) {
  const PORT = process.env.PORT || 5001;

  // The server starts even if the database is briefly unreachable: requests
  // get a clear 503 and the connection is retried on the next one, instead
  // of the whole process exiting.
  connectDB()
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection failed:', err.details || err.message));

  // Express 5 reports a failure to bind (most often "port already in use")
  // by passing the error to this callback rather than throwing. Without this
  // check the server would print "listening" while accepting no connections.
  app.listen(PORT, (err) => {
    if (err) {
      const reason = err.code === 'EADDRINUSE' ? `port ${PORT} is already in use by another program` : err.message;
      console.error(`Could not start the API: ${reason}.`);
      if (err.code === 'EADDRINUSE') console.error(`Stop the other program, or set a different PORT in server/.env.`);
      process.exit(1);
    }
    console.log(`TaskFlow API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
