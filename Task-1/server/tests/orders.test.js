const { api, bearer, createUser, createAdmin, createProduct, address } = require('./helpers');
const Product = require('../models/Product');
const Order = require('../models/Order');

const stockOf = async (product) => (await Product.findById(product._id)).stock;

describe('Orders', () => {
  let user;
  let mouse;
  const place = (token, items, extra = {}) =>
    api().post('/api/orders').set(bearer(token)).send({ items, shippingAddress: address, paymentMethod: 'COD', ...extra });

  beforeEach(async () => {
    user = await createUser();
    mouse = await createProduct({ name: 'Wireless Mouse', price: 500, stock: 10 });
  });

  test('requires login', async () => {
    const res = await api().post('/api/orders').send({ items: [{ productId: mouse._id, quantity: 1 }], shippingAddress: address });
    expect(res.status).toBe(401);
  });

  test('places an order, prices it on the server and reduces stock', async () => {
    const res = await place(user.token, [{ productId: mouse._id, quantity: 3 }]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ itemsTotal: 1500, shippingFee: 0, totalAmount: 1500, status: 'Pending' });
    expect(res.body.items[0]).toMatchObject({ name: 'Wireless Mouse', price: 500, quantity: 3 });
    expect(res.body.statusHistory).toHaveLength(1);
    expect(await stockOf(mouse)).toBe(7);
  });

  test('adds the shipping fee to small orders', async () => {
    const res = await place(user.token, [{ productId: mouse._id, quantity: 1 }]);
    expect(res.body).toMatchObject({ itemsTotal: 500, shippingFee: 99, totalAmount: 599 });
  });

  test('ignores prices and totals sent by the client', async () => {
    const res = await place(user.token, [{ productId: mouse._id, quantity: 2, price: 1, name: 'Free stuff' }], {
      totalAmount: 1,
      status: 'Delivered',
    });

    expect(res.status).toBe(201);
    expect(res.body.totalAmount).toBe(1000);
    expect(res.body.items[0].price).toBe(500);
    expect(res.body.status).toBe('Pending');
  });

  test('refuses to oversell and leaves stock untouched', async () => {
    const lamp = await createProduct({ name: 'Desk Lamp', price: 800, stock: 2 });

    // The mouse line is fine, the lamp line is not — the whole order must fail
    // and the mouse stock that was reserved first must be given back.
    const res = await place(user.token, [
      { productId: mouse._id, quantity: 4 },
      { productId: lamp._id, quantity: 5 },
    ]);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Only 2 left/);
    expect(await stockOf(mouse)).toBe(10);
    expect(await stockOf(lamp)).toBe(2);
    expect(await Order.countDocuments()).toBe(0);
  });

  test('two customers racing for the last unit: exactly one wins', async () => {
    const last = await createProduct({ name: 'Last One', price: 2000, stock: 1 });
    const other = await createUser();

    const results = await Promise.all([
      place(user.token, [{ productId: last._id, quantity: 1 }]),
      place(other.token, [{ productId: last._id, quantity: 1 }]),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await stockOf(last)).toBe(0);
  });

  test('validates the shipping address and the cart', async () => {
    const items = [{ productId: mouse._id, quantity: 1 }];
    const withAddress = (patch) =>
      api().post('/api/orders').set(bearer(user.token)).send({ items, shippingAddress: { ...address, ...patch } });

    expect((await withAddress({ phone: '12345' })).status).toBe(400);
    expect((await withAddress({ pincode: 'ABCDEF' })).status).toBe(400);
    expect((await place(user.token, [])).status).toBe(400);
    expect((await place(user.token, [{ productId: mouse._id, quantity: 0 }])).status).toBe(400);
    expect((await place(user.token, [{ productId: '64b000000000000000000000', quantity: 1 }])).status).toBe(400);
    expect(await stockOf(mouse)).toBe(10);
  });

  test("customers see only their own orders", async () => {
    const other = await createUser();
    const { body: order } = await place(user.token, [{ productId: mouse._id, quantity: 1 }]);

    expect((await api().get('/api/orders/mine').set(bearer(user.token))).body).toHaveLength(1);
    expect((await api().get('/api/orders/mine').set(bearer(other.token))).body).toHaveLength(0);

    expect((await api().get(`/api/orders/${order._id}`).set(bearer(user.token))).status).toBe(200);
    expect((await api().get(`/api/orders/${order._id}`).set(bearer(other.token))).status).toBe(404);
    expect((await api().get('/api/orders').set(bearer(user.token))).status).toBe(403);
  });

  test('cancelling an order restores the stock', async () => {
    const { body: order } = await place(user.token, [{ productId: mouse._id, quantity: 4 }]);
    expect(await stockOf(mouse)).toBe(6);

    const res = await api().put(`/api/orders/${order._id}/cancel`).set(bearer(user.token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Cancelled');
    expect(await stockOf(mouse)).toBe(10);

    // Cancelling twice must not return the stock twice.
    expect((await api().put(`/api/orders/${order._id}/cancel`).set(bearer(user.token))).status).toBe(400);
    expect(await stockOf(mouse)).toBe(10);
  });

  describe('admin status updates', () => {
    let admin;
    let order;
    const setStatus = (status) => api().put(`/api/orders/${order._id}/status`).set(bearer(admin.token)).send({ status });

    beforeEach(async () => {
      admin = await createAdmin();
      order = (await place(user.token, [{ productId: mouse._id, quantity: 2 }])).body;
    });

    test('moves an order through its lifecycle and records the history', async () => {
      expect((await setStatus('Processing')).status).toBe(200);
      expect((await setStatus('Shipped')).status).toBe(200);
      const delivered = await setStatus('Delivered');

      expect(delivered.body.status).toBe('Delivered');
      expect(delivered.body.statusHistory.map((h) => h.status)).toEqual(['Pending', 'Processing', 'Shipped', 'Delivered']);
    });

    test('rejects skipping steps or reopening a finished order', async () => {
      expect((await setStatus('Delivered')).status).toBe(400); // Pending → Delivered
      await setStatus('Processing');
      await setStatus('Shipped');
      expect((await setStatus('Cancelled')).status).toBe(400); // already shipped
      expect((await setStatus('Pending')).status).toBe(400);
    });

    test('a shipped order can no longer be cancelled by the customer', async () => {
      await setStatus('Processing');
      await setStatus('Shipped');
      const res = await api().put(`/api/orders/${order._id}/cancel`).set(bearer(user.token));
      expect(res.status).toBe(400);
      expect(await stockOf(mouse)).toBe(8);
    });

    test('lists orders with a status filter, and non-admins cannot change status', async () => {
      await setStatus('Processing');
      await place(user.token, [{ productId: mouse._id, quantity: 1 }]);

      const all = await api().get('/api/orders').set(bearer(admin.token));
      expect(all.body.total).toBe(2);
      expect(all.body.orders[0].userId.email).toBe(user.user.email);

      const pending = await api().get('/api/orders?status=Pending').set(bearer(admin.token));
      expect(pending.body.total).toBe(1);

      const res = await api().put(`/api/orders/${order._id}/status`).set(bearer(user.token)).send({ status: 'Shipped' });
      expect(res.status).toBe(403);
    });

    test('dashboard stats exclude cancelled orders from revenue', async () => {
      const second = (await place(user.token, [{ productId: mouse._id, quantity: 4 }])).body; // ₹2000
      await api().put(`/api/orders/${second._id}/cancel`).set(bearer(user.token));

      const res = await api().get('/api/admin/stats').set(bearer(admin.token));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ totalOrders: 2, totalRevenue: 1000, averageOrderValue: 1000 });
      expect(res.body.revenueTrend).toHaveLength(14);
      expect(res.body.revenueTrend.reduce((s, d) => s + d.revenue, 0)).toBe(1000);
      expect(res.body.topProducts[0]).toMatchObject({ name: 'Wireless Mouse', unitsSold: 2 });
      expect(res.body.categorySales).toEqual([{ category: 'Electronics', revenue: 1000, unitsSold: 2 }]);
      expect(res.body.ordersByStatus.find((s) => s.status === 'Cancelled').count).toBe(1);

      expect((await api().get('/api/admin/stats').set(bearer(user.token))).status).toBe(403);
    });
  });
});
