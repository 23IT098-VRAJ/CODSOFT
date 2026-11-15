const express = require('express');
const orders = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const router = express.Router();
router.use(protect); // every order route needs a logged-in user

router.post('/', validate({ body: s.orderBody }), orders.createOrder);
router.get('/mine', orders.getMyOrders);
router.get('/', authorize('admin'), validate({ query: s.orderQuery }), orders.listOrders);
router.get('/:id', validate({ params: s.idParam }), orders.getOrder);
router.put('/:id/cancel', validate({ params: s.idParam }), orders.cancelOrder);
router.put(
  '/:id/status',
  authorize('admin'),
  validate({ params: s.idParam, body: s.orderStatusBody }),
  orders.updateStatus
);

module.exports = router;
