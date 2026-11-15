const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reviews/:productId
exports.listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.validParams.productId }).sort({ createdAt: -1 }).lean();
  res.json(reviews);
});

// GET /api/reviews/featured — recent five-star reviews for the home page
exports.featuredReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ rating: 5, comment: { $nin: ['', null] } })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('productId', 'name images')
    .lean();

  res.json(
    reviews
      .filter((r) => r.productId) // skip reviews whose product was deleted
      .slice(0, 12)
      .map((r) => ({
        _id: r._id,
        userName: r.userName,
        comment: r.comment,
        verifiedPurchase: r.verifiedPurchase,
        product: { _id: r.productId._id, name: r.productId.name, image: r.productId.images?.[0] || '' },
      }))
  );
});

// POST /api/reviews/:productId — one review per user per product
exports.createReview = asyncHandler(async (req, res) => {
  const { productId } = req.validParams;
  if (!(await Product.exists({ _id: productId }))) throw new ApiError(404, 'Product not found');
  if (await Review.exists({ productId, userId: req.user._id })) {
    throw new ApiError(409, 'You have already reviewed this product');
  }

  // "Verified purchase" = the reviewer has a delivered order containing it.
  const verifiedPurchase = Boolean(
    await Order.exists({ userId: req.user._id, status: 'Delivered', 'items.productId': productId })
  );

  const review = await Review.create({
    productId,
    userId: req.user._id,
    userName: req.user.name,
    rating: req.body.rating,
    comment: req.body.comment,
    verifiedPurchase,
  });
  await Review.syncProductRating(productId);
  res.status(201).json(review);
});

// DELETE /api/reviews/:id — the author or an admin
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.validParams.id);
  if (!review) throw new ApiError(404, 'Review not found');

  const isAuthor = review.userId && String(review.userId) === String(req.user._id);
  if (!isAuthor && req.user.role !== 'admin') throw new ApiError(403, 'You can only delete your own review');

  await review.deleteOne();
  await Review.syncProductRating(review.productId);
  res.json({ message: 'Review deleted' });
});
