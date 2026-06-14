const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI is missing!');
} else {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Fail fast if IP is blocked
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));
}

// Diagnostic Middleware for Serverless
app.use((req, res, next) => {
  if (!process.env.MONGO_URI) {
    return res.status(500).json({ 
      success: false, 
      message: "🚨 DEPLOYMENT ERROR: MONGO_URI environment variable is missing in Vercel! Please add it in Vercel Settings > Environment Variables." 
    });
  }
  next();
});

// Route stubs — replaced as routes are built
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
