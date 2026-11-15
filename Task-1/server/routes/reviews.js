const express = require('express');
const reviews = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const router = express.Router();

router.get('/featured', reviews.featuredReviews); // must come before '/:productId'
router.get('/:productId', validate({ params: s.productIdParam }), reviews.listReviews);
router.post('/:productId', protect, validate({ params: s.productIdParam, body: s.reviewBody }), reviews.createReview);
router.delete('/:id', protect, validate({ params: s.idParam }), reviews.deleteReview);

module.exports = router;
