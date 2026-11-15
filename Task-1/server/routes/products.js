const express = require('express');
const products = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const router = express.Router();
const admin = [protect, authorize('admin')];

router.get('/', validate({ query: s.productQuery }), products.listProducts);
router.get('/meta', products.getMeta);
router.get('/:id', validate({ params: s.idParam }), products.getProduct);
router.get('/:id/related', validate({ params: s.idParam }), products.getRelated);

router.post('/', admin, validate({ body: s.productBody }), products.createProduct);
router.put('/:id', admin, validate({ params: s.idParam, body: s.productUpdateBody }), products.updateProduct);
router.delete('/:id', admin, validate({ params: s.idParam }), products.deleteProduct);

module.exports = router;
