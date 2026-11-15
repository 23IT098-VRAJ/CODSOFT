const { api, bearer, createUser, createAdmin, createProduct } = require('./helpers');
const Review = require('../models/Review');

describe('Products', () => {
  beforeEach(async () => {
    await createProduct({ name: 'Wireless Mouse', price: 500, category: 'Electronics', stock: 10 });
    await createProduct({ name: 'Gaming Laptop', price: 60000, category: 'Electronics', stock: 0 });
    await createProduct({ name: 'Cotton Shirt', price: 900, category: 'Clothing', brand: 'Levis', stock: 5 });
    await createProduct({ name: 'Atomic Habits', price: 400, category: 'Books', brand: 'Penguin', stock: 20 });
  });

  test('lists products with pagination metadata', async () => {
    const res = await api().get('/api/products?limit=3');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(3);
    expect(res.body).toMatchObject({ total: 4, page: 1, pages: 2 });
  });

  test('searches by name, case-insensitively', async () => {
    const res = await api().get('/api/products?q=LAPTOP');
    expect(res.body.products.map((p) => p.name)).toEqual(['Gaming Laptop']);
  });

  test('treats search text literally, not as a regular expression', async () => {
    const res = await api().get('/api/products').query({ q: '.*' });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  test('filters by several categories, price range and stock', async () => {
    const multi = await api().get('/api/products?category=Books&category=Clothing');
    expect(multi.body.total).toBe(2);

    const priced = await api().get('/api/products?minPrice=450&maxPrice=1000');
    expect(priced.body.products.map((p) => p.name).sort()).toEqual(['Cotton Shirt', 'Wireless Mouse']);

    const inStock = await api().get('/api/products?category=Electronics&inStock=true');
    expect(inStock.body.products.map((p) => p.name)).toEqual(['Wireless Mouse']);
  });

  test('sorts by price', async () => {
    const res = await api().get('/api/products?sort=price_desc');
    const prices = res.body.products.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('rejects invalid query parameters', async () => {
    expect((await api().get('/api/products?sort=hacked')).status).toBe(400);
    expect((await api().get('/api/products?limit=5000')).status).toBe(400);
  });

  test('returns 404 for an unknown product and 400 for a malformed id', async () => {
    expect((await api().get('/api/products/64b000000000000000000000')).status).toBe(404);
    expect((await api().get('/api/products/not-an-id')).status).toBe(400);
  });

  test('reports category counts and the price range', async () => {
    const res = await api().get('/api/products/meta');
    expect(res.body.categories).toEqual(
      expect.arrayContaining([{ name: 'Electronics', count: 2 }, { name: 'Books', count: 1 }])
    );
    expect(res.body.priceRange).toEqual({ min: 400, max: 60000 });
  });

  describe('admin management', () => {
    const body = { name: 'Desk Lamp', price: 1200, category: 'Home', stock: 7, images: ['https://example.com/lamp.png'] };

    test('only admins can create products', async () => {
      const { token: userToken } = await createUser();
      const { token: adminToken } = await createAdmin();

      expect((await api().post('/api/products').send(body)).status).toBe(401);
      expect((await api().post('/api/products').set(bearer(userToken)).send(body)).status).toBe(403);

      const res = await api().post('/api/products').set(bearer(adminToken)).send(body);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Desk Lamp', price: 1200, brand: 'Generic' });
    });

    test('validates product data', async () => {
      const { token } = await createAdmin();
      const send = (patch) => api().post('/api/products').set(bearer(token)).send({ ...body, ...patch });

      expect((await send({ price: -5 })).status).toBe(400);
      expect((await send({ stock: 2.5 })).status).toBe(400);
      expect((await send({ category: 'Weapons' })).status).toBe(400);
      expect((await send({ images: ['javascript:alert(1)//'] })).status).toBe(400);
    });

    test('a partial update leaves the other fields untouched', async () => {
      const { token } = await createAdmin();
      const product = await createProduct({ name: 'Old Name', brand: 'Acme', description: 'Keep me' });

      const res = await api().put(`/api/products/${product._id}`).set(bearer(token)).send({ price: 750 });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ price: 750, name: 'Old Name', brand: 'Acme', description: 'Keep me' });
    });

    test('deleting a product also removes its reviews', async () => {
      const { token } = await createAdmin();
      const product = await createProduct();
      await Review.create({ productId: product._id, userName: 'Someone', rating: 5 });

      const res = await api().delete(`/api/products/${product._id}`).set(bearer(token));
      expect(res.status).toBe(200);
      expect(await Review.countDocuments({ productId: product._id })).toBe(0);
    });
  });
});
