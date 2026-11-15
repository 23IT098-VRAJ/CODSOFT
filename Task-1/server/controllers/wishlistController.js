const User = require('../models/User');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/wishlist — the saved products, populated
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist').lean();
  res.json((user.wishlist || []).filter(Boolean));
});

// POST /api/wishlist/:productId — toggle a product in or out of the wishlist
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.validParams;
  const saved = req.user.wishlist.some((id) => String(id) === productId);

  if (!saved && !(await Product.exists({ _id: productId }))) throw new ApiError(404, 'Product not found');

  const user = await User.findByIdAndUpdate(
    req.user._id,
    saved ? { $pull: { wishlist: productId } } : { $addToSet: { wishlist: productId } },
    { new: true }
  );
  res.json({ saved: !saved, wishlist: user.wishlist });
});
