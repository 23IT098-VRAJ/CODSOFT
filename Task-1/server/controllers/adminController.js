const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { LOW_STOCK_THRESHOLD, ORDER_STATUSES } = require('../config/constants');

const TREND_DAYS = 14;
const IST = 'Asia/Kolkata';
const notCancelled = { status: { $ne: 'Cancelled' } };

// GET /api/admin/stats — everything the dashboard needs, computed with
// MongoDB aggregation pipelines and run in parallel.
exports.getStats = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (TREND_DAYS - 1));

  const [
    totalProducts,
    totalUsers,
    totalOrders,
    [revenue],
    statusCounts,
    daily,
    topProducts,
    categorySales,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: notCancelled },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { ...notCancelled, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: notCancelled },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { unitsSold: -1, revenue: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: notCancelled },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
      {
        $group: {
          _id: { $ifNull: [{ $arrayElemAt: ['$product.category', 0] }, 'Other'] },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          unitsSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $project: { _id: 0, category: '$_id', revenue: 1, unitsSold: 1 } },
    ]),
    Product.find({ stock: { $lt: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1 })
      .limit(6)
      .select('name stock images category')
      .lean(),
    Order.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  // Fill in the days that had no orders so the chart has a continuous axis.
  const byDay = new Map(daily.map((d) => [d._id, d]));
  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: IST }); // YYYY-MM-DD
  const revenueTrend = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date(since);
    date.setDate(since.getDate() + i);
    const key = dayKey.format(date);
    return { date: key, revenue: byDay.get(key)?.revenue || 0, orders: byDay.get(key)?.orders || 0 };
  });

  const countFor = (status) => statusCounts.find((s) => s._id === status)?.count || 0;

  res.json({
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue: revenue?.total || 0,
    averageOrderValue: revenue?.orders ? Math.round(revenue.total / revenue.orders) : 0,
    ordersByStatus: ORDER_STATUSES.map((status) => ({ status, count: countFor(status) })),
    revenueTrend,
    topProducts,
    categorySales,
    lowStock,
    recentOrders,
  });
});

// GET /api/admin/users
exports.listUsers = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.validQuery;
  const filter = {};
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email role createdAt')
      .lean(),
    User.countDocuments(filter),
  ]);

  // Attach each listed user's order count and lifetime spend.
  const spend = await Order.aggregate([
    { $match: { userId: { $in: users.map((u) => u._id) }, ...notCancelled } },
    { $group: { _id: '$userId', orders: { $sum: 1 }, spent: { $sum: '$totalAmount' } } },
  ]);
  const spendById = new Map(spend.map((s) => [String(s._id), s]));

  res.json({
    users: users.map((u) => ({
      ...u,
      orders: spendById.get(String(u._id))?.orders || 0,
      spent: spendById.get(String(u._id))?.spent || 0,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

// PUT /api/admin/users/:id/role
exports.updateRole = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.validParams.id) {
    throw new ApiError(400, 'You cannot change your own role');
  }
  const user = await User.findByIdAndUpdate(req.validParams.id, { role: req.body.role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: user.toPublic() });
});
