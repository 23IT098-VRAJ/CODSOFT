// Zero-setup demo: `npm run demo`
//
// Starts the API against a throw-away in-memory MongoDB, seeds the catalogue,
// creates one admin and one customer account plus two weeks of sample orders
// so the admin dashboard has something to chart. Nothing is written to your
// real database, and everything disappears when the process stops.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.JWT_SECRET = 'demo-only-secret-not-for-production';

const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB } = require('../config/db');
const { buildCatalogue, seedCatalogue } = require('../seed');
const { shippingFeeFor } = require('../config/constants');
const User = require('../models/User');
const Order = require('../models/Order');

// Demo-only accounts. They exist solely inside the in-memory database.
const DEMO_ADMIN = { name: 'Demo Admin', email: 'admin@shopindi.demo', password: 'Admin@12345', role: 'admin' };
const DEMO_USER = { name: 'Priya Sharma', email: 'priya@shopindi.demo', password: 'Priya@12345', role: 'user' };

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedOrders(products, customers) {
  const inStock = products.filter((p) => p.stock > 5);
  const address = { name: 'Priya Sharma', phone: '9876543210', address: '14, MG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' };
  const orders = [];

  for (let daysAgo = 13; daysAgo >= 0; daysAgo -= 1) {
    const perDay = 1 + Math.floor(Math.random() * 4);
    for (let n = 0; n < perDay; n += 1) {
      const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.floor(Math.random() * 6 * 3600000));
      const items = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => pick(inStock))
        .filter((p, i, all) => all.indexOf(p) === i)
        .map((p) => ({ productId: p._id, name: p.name, price: p.price, image: p.images[0], quantity: 1 + Math.floor(Math.random() * 2) }));

      const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const shippingFee = shippingFeeFor(itemsTotal);
      const flow =
        daysAgo > 6 ? pick([['Processing', 'Shipped', 'Delivered'], ['Processing', 'Shipped', 'Delivered'], ['Cancelled']])
        : daysAgo > 2 ? pick([['Processing', 'Shipped'], ['Processing', 'Shipped', 'Delivered'], ['Processing']])
        : pick([[], ['Processing']]);

      const statusHistory = [{ status: 'Pending', at: createdAt, note: 'Order placed' }].concat(
        flow.map((status, i) => ({ status, at: new Date(createdAt.getTime() + (i + 1) * 20 * 3600000) }))
      );

      orders.push({
        userId: pick(customers)._id,
        items,
        shippingAddress: address,
        paymentMethod: pick(['COD', 'COD', 'CARD']),
        itemsTotal,
        shippingFee,
        totalAmount: itemsTotal + shippingFee,
        status: statusHistory[statusHistory.length - 1].status,
        statusHistory,
        createdAt,
        updatedAt: statusHistory[statusHistory.length - 1].at,
      });
    }
  }
  await Order.insertMany(orders);
  return orders.length;
}

async function main() {
  console.log('Starting in-memory MongoDB (the first run downloads the MongoDB binary)…');
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('shopindi_demo');
  await connectDB();

  console.log('Fetching the product catalogue…');
  const { products, reviewCount } = await seedCatalogue(await buildCatalogue());

  const admin = await User.create(DEMO_ADMIN);
  const customer = await User.create(DEMO_USER);
  const orderCount = await seedOrders(products, [customer, admin]);

  const app = require('../app');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\nShopIndi demo API ready on http://localhost:${PORT}`);
    console.log(`  ${products.length} products · ${reviewCount} reviews · ${orderCount} sample orders`);
    console.log(`  Admin     ${DEMO_ADMIN.email}  /  ${DEMO_ADMIN.password}`);
    console.log(`  Customer  ${DEMO_USER.email}  /  ${DEMO_USER.password}`);
    console.log('  Data lives in memory only and is discarded when you stop this process.\n');
  });

  const shutdown = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Demo failed to start:', err.message);
  process.exit(1);
});
