// Vercel serverless entry point. Every /api/* request is rewritten here
// (see ../vercel.json) and handled by the Express app, which still sees the
// original URL. server.js only listens on a port when run directly, so
// requiring it here just returns the app.
module.exports = require('../server/server');
