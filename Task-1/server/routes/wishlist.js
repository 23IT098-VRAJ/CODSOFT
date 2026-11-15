const express = require('express');
const wishlist = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const router = express.Router();
router.use(protect);

router.get('/', wishlist.getWishlist);
router.post('/:productId', validate({ params: s.productIdParam }), wishlist.toggleWishlist);

module.exports = router;
