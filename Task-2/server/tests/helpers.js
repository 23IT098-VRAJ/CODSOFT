const request = require('supertest');
const app = require('../app');

const api = () => request(app);
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

let counter = 0;

// Registers a user through the real endpoint and returns { token, user, password }.
async function createUser(overrides = {}) {
  counter += 1;
  const body = { name: `User ${counter}`, email: `user${counter}@test.dev`, password: 'secret12', ...overrides };
  const res = await api().post('/api/auth/register').send(body);
  return { token: res.body.token, user: res.body.user, password: body.password };
}

async function createProject(owner, overrides = {}) {
  const res = await api().post('/api/projects').set(bearer(owner.token)).send({ name: 'Website relaunch', ...overrides });
  return res.body;
}

async function addMember(owner, project, member) {
  return api().post(`/api/projects/${project._id}/members`).set(bearer(owner.token)).send({ email: member.user.email });
}

async function createTask(user, project, overrides = {}) {
  const res = await api().post('/api/tasks').set(bearer(user.token)).send({ title: 'A task', projectId: project._id, ...overrides });
  return res.body;
}

// The titles of a column, in board order — what a user would see top to bottom.
async function column(user, project, status) {
  const res = await api().get(`/api/tasks/${project._id}`).set(bearer(user.token));
  return res.body.filter((t) => t.status === status).map((t) => t.title);
}

const missingId = '64b000000000000000000000';

module.exports = { api, bearer, createUser, createProject, addMember, createTask, column, missingId };
