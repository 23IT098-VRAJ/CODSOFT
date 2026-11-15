const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');

const api = () => request(app);
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

let counter = 0;

// Registers a user through the real endpoint and returns { token, user }.
async function createUser({ role = 'user', ...overrides } = {}) {
  counter += 1;
  const body = { name: 'Test User', email: `user${counter}@test.dev`, password: 'Passw0rd!', ...overrides };
  const res = await api().post('/api/auth/register').send(body);
  if (role !== 'user') await User.updateOne({ _id: res.body.user._id }, { role });
  return { token: res.body.token, user: res.body.user, password: body.password };
}

const createAdmin = () => createUser({ role: 'admin' });

const createProduct = (overrides = {}) =>
  Product.create({
    name: 'Wireless Mouse',
    description: 'A reliable 2.4 GHz wireless mouse',
    price: 500,
    category: 'Electronics',
    brand: 'Logi',
    images: ['https://example.com/mouse.png'],
    stock: 10,
    ...overrides,
  });

const address = {
  name: 'Test User',
  phone: '9876543210',
  address: '221B Baker Street',
  city: 'Ahmedabad',
  state: 'Gujarat',
  pincode: '380001',
};

module.exports = { api, bearer, createUser, createAdmin, createProduct, address };
