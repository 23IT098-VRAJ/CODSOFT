const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews/:productId (auth)
router.post('/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    const existing = await Review.findOne({ productId, userId: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already reviewed' });

    const userDoc = await User.findById(req.user._id);
    const review = await Review.create({
      productId,
      userId: req.user._id,
      userName: userDoc ? userDoc.name : req.user.name,
      rating,
      comment,
    });

    const reviews = await Review.find({ productId });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { 'rating.average': avg, 'rating.count': reviews.length });

    return res.status(201).json(review);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
