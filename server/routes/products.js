const express = require('express');
const Product = require('../models/Product');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

const sortMap = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  top_rated: { 'rating.average': -1 },
};

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = { $in: Array.isArray(category) ? category : [category] };
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const sortOpt = sortMap[sort] || { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOpt).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    return res.json({ products, total, page: Number(page) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/products (admin)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id (admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
