const { api, bearer, createUser } = require('./helpers');
const User = require('../models/User');

describe('Auth', () => {
  const valid = { name: 'Asha Patel', email: 'Asha@Example.com', password: 'Passw0rd!' };

  test('registers a user, normalises the email and never returns the password', async () => {
    const res = await api().post('/api/auth/register').send(valid);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Asha Patel', email: 'asha@example.com', role: 'user' });
    expect(res.body.user.password).toBeUndefined();

    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    expect(stored.password).not.toBe(valid.password); // stored as a bcrypt hash
  });

  test('rejects a duplicate email', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/register').send(valid);
    expect(res.status).toBe(409);
  });

  test.each([
    ['a short password', { password: 'abc1' }],
    ['a password without a number', { password: 'onlyletters' }],
    ['an invalid email', { email: 'not-an-email' }],
    ['a missing name', { name: '' }],
  ])('rejects %s', async (_label, patch) => {
    const res = await api().post('/api/auth/register').send({ ...valid, ...patch });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('a client cannot make itself admin at registration', async () => {
    const res = await api().post('/api/auth/register').send({ ...valid, role: 'admin' });
    expect(res.body.user.role).toBe('user');
  });

  test('logs in with correct credentials', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/login').send({ email: valid.email, password: valid.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('gives the same error for a wrong password and an unknown email', async () => {
    await api().post('/api/auth/register').send(valid);
    const wrongPassword = await api().post('/api/auth/login').send({ email: valid.email, password: 'Wrong123' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrong123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  test('blocks NoSQL operator injection in the login body', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });

  test('GET /me needs a valid token', async () => {
    const { token } = await createUser();

    expect((await api().get('/api/auth/me')).status).toBe(401);
    expect((await api().get('/api/auth/me').set(bearer('garbage'))).status).toBe(401);

    const res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toMatch(/@test\.dev$/);
  });

  test('a token stops working once the account is deleted', async () => {
    const { token, user } = await createUser();
    await User.deleteOne({ _id: user._id });
    expect((await api().get('/api/auth/me').set(bearer(token))).status).toBe(401);
  });

  test('changes the password only when the current one is right', async () => {
    const { token, user, password } = await createUser();

    const wrong = await api()
      .put('/api/auth/password')
      .set(bearer(token))
      .send({ currentPassword: 'nope', newPassword: 'NewPassw0rd' });
    expect(wrong.status).toBe(400);

    const ok = await api()
      .put('/api/auth/password')
      .set(bearer(token))
      .send({ currentPassword: password, newPassword: 'NewPassw0rd' });
    expect(ok.status).toBe(200);

    expect((await api().post('/api/auth/login').send({ email: user.email, password })).status).toBe(401);
    expect((await api().post('/api/auth/login').send({ email: user.email, password: 'NewPassw0rd' })).status).toBe(200);
  });
});
