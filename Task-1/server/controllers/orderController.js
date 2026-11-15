const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { STATUS_TRANSITIONS, USER_CANCELLABLE, shippingFeeFor } = require('../config/constants');

// Put stock back for every reserved line (used on failure and on cancellation).
const releaseStock = (lines) =>
  Promise.all(lines.map((l) => Product.updateOne({ _id: l.productId }, { $inc: { stock: l.quantity } })));

// POST /api/orders
// The client sends only product ids and quantities. Names, prices and totals
// are taken from the database, so a tampered request cannot change what is
// charged. Stock is reserved with a conditional atomic update per product:
// two customers racing for the last unit cannot both succeed.
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  // Merge duplicate lines for the same product.
  const quantities = new Map();
  for (const { productId, quantity } of req.body.items) {
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] } }).lean();
  if (products.length !== quantities.size) {
    throw new ApiError(400, 'Some items in your cart are no longer available. Please review your cart.');
  }

  const items = products.map((p) => ({
    productId: p._id,
    name: p.name,
    price: p.price,
    quantity: quantities.get(String(p._id)),
    image: p.images?.[0] || '',
  }));

  const reserved = [];
  try {
    for (const item of items) {
      const result = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        const current = await Product.findById(item.productId).select('stock').lean();
        const left = current?.stock ?? 0;
        throw new ApiError(
          409,
          left > 0 ? `Only ${left} left in stock for "${item.name}"` : `"${item.name}" is out of stock`
        );
      }
      reserved.push(item);
    }

    const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingFee = shippingFeeFor(itemsTotal);

    const order = await Order.create({
      userId: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      itemsTotal,
      shippingFee,
      totalAmount: itemsTotal + shippingFee,
      statusHistory: [{ status: 'Pending', note: 'Order placed' }],
    });
    res.status(201).json(order);
  } catch (err) {
    await releaseStock(reserved); // undo partial reservations
    throw err;
  }
});

// GET /api/orders/mine
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

// GET /api/orders/:id — the owner or an admin
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.validParams.id).populate('userId', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = String(order.userId?._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(404, 'Order not found');
  res.json(order);
});

// Moves an order to a new status; restores stock when it is cancelled.
// The status filter in the query makes the change atomic: if another request
// already moved the order, nothing is updated and we report a conflict.
async function transition(order, status, note) {
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { status, $push: { statusHistory: { status, note, at: new Date() } } },
    { new: true }
  ).populate('userId', 'name email');
  if (!updated) throw new ApiError(409, 'This order was just updated by someone else. Please refresh.');

  if (status === 'Cancelled') await releaseStock(order.items);
  return updated;
}

// PUT /api/orders/:id/cancel — the customer cancels their own order
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.validParams.id, userId: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!USER_CANCELLABLE.includes(order.status)) {
    throw new ApiError(400, `An order that is ${order.status.toLowerCase()} can no longer be cancelled`);
  }
  res.json(await transition(order, 'Cancelled', 'Cancelled by customer'));
});

// GET /api/orders (admin)
exports.listOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.validQuery;
  const filter = status ? { status } : {};

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

// PUT /api/orders/:id/status (admin) — only valid forward moves are allowed
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.validParams.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (!STATUS_TRANSITIONS[order.status]?.includes(status)) {
    throw new ApiError(400, `An order cannot go from ${order.status} to ${status}`);
  }
  res.json(await transition(order, status, note));
});
