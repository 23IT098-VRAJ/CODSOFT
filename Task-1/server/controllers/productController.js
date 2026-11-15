const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  top_rated: { 'rating.average': -1, 'rating.count': -1, _id: 1 },
  name: { name: 1, _id: 1 },
};

// User input must never be used as a raw regular expression.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/products — search, filter, sort and paginate the catalogue
exports.listProducts = asyncHandler(async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, inStock, sort, page, limit } = req.validQuery;

  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }];
  }
  if (category?.length) filter.category = { $in: category };
  if (brand) filter.brand = brand;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ products, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

// GET /api/products/meta — category counts and price bounds for the filter UI
exports.getMeta = asyncHandler(async (req, res) => {
  const [categories, [range], brands] = await Promise.all([
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]),
    Product.aggregate([{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
    // The brands with the most products — shown in the home page marquee.
    Product.aggregate([
      { $match: { brand: { $nin: ['Generic', '', null] } } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 16 },
      { $project: { _id: 0, name: '$_id', count: 1 } },
    ]),
  ]);
  res.json({ categories, brands, priceRange: { min: range?.min ?? 0, max: range?.max ?? 0 } });
});

// GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.validParams.id).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
});

// GET /api/products/:id/related — best-rated products from the same category
exports.getRelated = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.validParams.id).select('category').lean();
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.find({ category: product.category, _id: { $ne: product._id } })
    .sort(SORTS.top_rated)
    .limit(4)
    .lean();
  res.json(related);
});

// POST /api/products (admin)
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// PUT /api/products/:id (admin)
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.validParams.id, req.body, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
});

// DELETE /api/products/:id (admin) — also removes data that points at the product
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.validParams.id);
  if (!product) throw new ApiError(404, 'Product not found');

  await Promise.all([
    Review.deleteMany({ productId: product._id }),
    User.updateMany({ wishlist: product._id }, { $pull: { wishlist: product._id } }),
  ]);
  res.json({ message: 'Product deleted' });
});
