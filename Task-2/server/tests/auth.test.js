const { api, bearer, createUser } = require('./helpers');
const User = require('../models/User');

describe('Auth', () => {
  const valid = { name: 'Asha Patel', email: 'Asha@Example.com', password: 'secret12' };

  test('registers a user in the shape the web client expects', async () => {
    const res = await api().post('/api/auth/register').send(valid);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      _id: expect.any(String),
      name: 'Asha Patel',
      email: 'asha@example.com', // normalised to lower case
      avatarColor: expect.stringMatching(/^#[0-9A-F]{6}$/i),
    });

    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    expect(stored.password).not.toBe(valid.password); // stored as a bcrypt hash
  });

  test('rejects a duplicate email', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/register').send({ ...valid, email: 'ASHA@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already registered');
  });

  test.each([
    ['a short password', { password: '12345' }],
    ['an invalid email', { email: 'not-an-email' }],
    ['a missing name', { name: ' ' }],
  ])('rejects %s with a readable message', async (_label, patch) => {
    const res = await api().post('/api/auth/register').send({ ...valid, ...patch });
    expect(res.status).toBe(400);
    expect(res.body.message).toEqual(expect.any(String));
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('logs in with correct credentials', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/login').send({ email: valid.email, password: valid.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('asha@example.com');
  });

  test('a failed login is a 400 with one message for wrong password and unknown email', async () => {
    await api().post('/api/auth/register').send(valid);
    const wrongPassword = await api().post('/api/auth/login').send({ email: valid.email, password: 'wrong-one' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'wrong-one' });

    // 400, not 401: the web client reloads the page on any 401.
    expect(wrongPassword.status).toBe(400);
    expect(unknownEmail.status).toBe(400);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  test('blocks NoSQL operator injection in the login body', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  test('protected routes need a valid token', async () => {
    const { token, user } = await createUser();

    expect((await api().get('/api/projects')).status).toBe(401);
    expect((await api().get('/api/projects').set(bearer('garbage'))).status).toBe(401);
    expect((await api().get('/api/auth/me').set(bearer(token))).body.user._id).toBe(user._id);

    await User.deleteOne({ _id: user._id }); // a deleted account's token stops working
    expect((await api().get('/api/auth/me').set(bearer(token))).status).toBe(401);
  });

  test('updates the profile name and changes the password', async () => {
    const { token, user, password } = await createUser();

    const renamed = await api().put('/api/auth/me').set(bearer(token)).send({ name: 'New Name' });
    expect(renamed.body.user.name).toBe('New Name');

    const wrong = await api().put('/api/auth/password').set(bearer(token)).send({ currentPassword: 'nope', newPassword: 'another12' });
    expect(wrong.status).toBe(400);

    const ok = await api().put('/api/auth/password').set(bearer(token)).send({ currentPassword: password, newPassword: 'another12' });
    expect(ok.status).toBe(200);
    expect((await api().post('/api/auth/login').send({ email: user.email, password })).status).toBe(400);
    expect((await api().post('/api/auth/login').send({ email: user.email, password: 'another12' })).status).toBe(200);
  });

  test('health check and unknown routes', async () => {
    expect((await api().get('/api/health')).body.status).toBe('ok');
    expect((await api().get('/api/nope')).status).toBe(404);
  });
});
