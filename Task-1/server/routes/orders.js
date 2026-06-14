const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// POST /api/orders (auth)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    const order = await Order.create({ userId: req.user._id, items, shippingAddress, paymentMethod, totalAmount });
    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/stats (admin)
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalUsers] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
    ]);
    return res.json({ totalProducts, totalOrders, totalUsers });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/mine (auth)
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/orders (admin)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status (admin)
router.put('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending', 'Processing', 'Delivered'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
