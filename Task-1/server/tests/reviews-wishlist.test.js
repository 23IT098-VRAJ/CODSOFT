const { api, bearer, createUser, createAdmin, createProduct, address } = require('./helpers');
const Product = require('../models/Product');

describe('Reviews', () => {
  let product;
  beforeEach(async () => {
    product = await createProduct();
  });

  const review = (token, body) => api().post(`/api/reviews/${product._id}`).set(bearer(token)).send(body);

  test('creates a review and keeps the product rating in sync', async () => {
    const a = await createUser({ name: 'Asha' });
    const b = await createUser({ name: 'Bhavin' });

    expect((await review(a.token, { rating: 5, comment: 'Great' })).status).toBe(201);
    expect((await review(b.token, { rating: 2 })).status).toBe(201);

    const updated = await Product.findById(product._id);
    expect(updated.rating).toMatchObject({ average: 3.5, count: 2 });

    const list = await api().get(`/api/reviews/${product._id}`);
    expect(list.body).toHaveLength(2);
    expect(list.body.map((r) => r.userName).sort()).toEqual(['Asha', 'Bhavin']);
  });

  test('allows one review per user and validates the rating', async () => {
    const { token } = await createUser();
    expect((await review(token, { rating: 9 })).status).toBe(400);
    expect((await review(token, { rating: 4 })).status).toBe(201);
    expect((await review(token, { rating: 1 })).status).toBe(409);
    expect((await api().post(`/api/reviews/${product._id}`).send({ rating: 4 })).status).toBe(401);
  });

  test('marks a review as a verified purchase only after delivery', async () => {
    const buyer = await createUser();
    const admin = await createAdmin();
    const stranger = await createUser();

    const { body: order } = await api()
      .post('/api/orders')
      .set(bearer(buyer.token))
      .send({ items: [{ productId: product._id, quantity: 1 }], shippingAddress: address });
    for (const status of ['Processing', 'Shipped', 'Delivered']) {
      await api().put(`/api/orders/${order._id}/status`).set(bearer(admin.token)).send({ status });
    }

    expect((await review(buyer.token, { rating: 5 })).body.verifiedPurchase).toBe(true);
    expect((await review(stranger.token, { rating: 3 })).body.verifiedPurchase).toBe(false);
  });

  test('features only five-star reviews that have a comment', async () => {
    const a = await createUser({ name: 'Asha' });
    const b = await createUser({ name: 'Bhavin' });
    const c = await createUser({ name: 'Chirag' });
    await review(a.token, { rating: 5, comment: 'Loved it' });
    await review(b.token, { rating: 3, comment: 'Average' });
    await review(c.token, { rating: 5 }); // no comment

    const res = await api().get('/api/reviews/featured');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ userName: 'Asha', comment: 'Loved it', product: { name: product.name } });
  });

  test('only the author or an admin can delete a review', async () => {
    const author = await createUser();
    const other = await createUser();
    const { body: created } = await review(author.token, { rating: 4 });

    expect((await api().delete(`/api/reviews/${created._id}`).set(bearer(other.token))).status).toBe(403);
    expect((await api().delete(`/api/reviews/${created._id}`).set(bearer(author.token))).status).toBe(200);
    expect((await Product.findById(product._id)).rating).toMatchObject({ average: 0, count: 0 });
  });
});

describe('Wishlist', () => {
  test('toggles a product in and out of the wishlist', async () => {
    const { token } = await createUser();
    const product = await createProduct();
    const toggle = () => api().post(`/api/wishlist/${product._id}`).set(bearer(token));

    const added = await toggle();
    expect(added.body).toMatchObject({ saved: true, wishlist: [String(product._id)] });

    const list = await api().get('/api/wishlist').set(bearer(token));
    expect(list.body[0].name).toBe(product.name);

    const removed = await toggle();
    expect(removed.body).toMatchObject({ saved: false, wishlist: [] });
  });

  test('requires login and an existing product', async () => {
    const { token } = await createUser();
    expect((await api().post('/api/wishlist/64b000000000000000000000')).status).toBe(401);
    expect((await api().post('/api/wishlist/64b000000000000000000000').set(bearer(token))).status).toBe(404);
  });
});

describe('Admin users', () => {
  test('lists users and changes roles, but not your own', async () => {
    const admin = await createAdmin();
    const user = await createUser({ name: 'Promote Me' });

    const list = await api().get('/api/admin/users?q=promote').set(bearer(admin.token));
    expect(list.body.total).toBe(1);
    expect(list.body.users[0]).toMatchObject({ name: 'Promote Me', orders: 0, spent: 0 });
    expect(list.body.users[0].password).toBeUndefined();

    const promoted = await api().put(`/api/admin/users/${user.user._id}/role`).set(bearer(admin.token)).send({ role: 'admin' });
    expect(promoted.body.user.role).toBe('admin');

    // The promotion applies to the user's existing token straight away.
    expect((await api().get('/api/admin/stats').set(bearer(user.token))).status).toBe(200);

    const self = await api().put(`/api/admin/users/${admin.user._id}/role`).set(bearer(admin.token)).send({ role: 'user' });
    expect(self.status).toBe(400);
  });
});

describe('API basics', () => {
  test('health check and unknown routes', async () => {
    expect((await api().get('/api/health')).body.status).toBe('ok');
    const missing = await api().get('/api/nope');
    expect(missing.status).toBe(404);
    expect(missing.body.message).toMatch(/Route not found/);
  });
});
