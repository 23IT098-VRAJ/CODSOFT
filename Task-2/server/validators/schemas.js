const { z } = require('zod');
const { PROJECT_STATUSES, TASK_STATUSES, PRIORITIES } = require('../config/constants');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// The web forms send '' for "no date" and "no assignee"; treat that as null.
const emptyToNull = (v) => (v === '' ? null : v);
const nullableDate = z.preprocess(emptyToNull, z.union([z.null(), z.coerce.date({ message: 'Invalid date' })]).optional());
const nullableId = z.preprocess(emptyToNull, z.union([z.null(), objectId]).optional());

const idParam = z.object({ id: objectId });
const projectIdParam = z.object({ projectId: objectId });

// ── Auth ──────────────────────────────────────────────────────────────
const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(60);
const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const newPassword = z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password is too long');

const register = z.object({ name, email, password: newPassword });
const login = z.object({ email, password: z.string().min(1, 'Password is required') });
const updateProfile = z.object({ name });
const changePassword = z.object({ currentPassword: z.string().min(1, 'Current password is required'), newPassword });

// ── Projects ──────────────────────────────────────────────────────────
const projectFields = {
  name: z.string().trim().min(1, 'Project name is required').max(100),
  description: z.string().trim().max(1000),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Colour must be a hex value like #6366f1'),
  status: z.enum(PROJECT_STATUSES, { message: 'Invalid project status' }),
  dueDate: nullableDate,
};
const projectCreate = z.object({
  name: projectFields.name,
  description: projectFields.description.optional(),
  color: projectFields.color.optional(),
  status: projectFields.status.optional(),
  dueDate: projectFields.dueDate,
});
const projectUpdate = z.object(projectFields).partial();
const projectQuery = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

const memberBody = z.object({ email });
const memberParams = z.object({ id: objectId, userId: objectId });
const activityQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) });

// ── Tasks ─────────────────────────────────────────────────────────────
const taskFields = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000),
  status: z.enum(TASK_STATUSES, { message: 'Invalid task status' }),
  priority: z.enum(PRIORITIES, { message: 'Invalid priority' }),
  assigneeId: nullableId,
  dueDate: nullableDate,
};
const taskCreate = z.object({
  projectId: objectId,
  title: taskFields.title,
  description: taskFields.description.optional(),
  status: taskFields.status.optional(),
  priority: taskFields.priority.optional(),
  assigneeId: taskFields.assigneeId,
  dueDate: taskFields.dueDate,
});
const order = z.coerce.number().int('Position must be a whole number').min(0);
const taskUpdate = z.object({ ...taskFields, order }).partial();
const taskMove = z.object({ status: taskFields.status.optional(), order: order.optional() });

const taskQuery = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignee: z.union([objectId, z.literal('me'), z.literal('none')]).optional(),
  overdue: z.enum(['true', 'false']).optional(),
  q: z.string().trim().max(100).optional(),
});
const myTasksQuery = z.object({ status: z.enum(TASK_STATUSES).optional(), overdue: z.enum(['true', 'false']).optional() });

// ── Comments ──────────────────────────────────────────────────────────
const commentBody = z.object({ body: z.string().trim().min(1, 'Comment cannot be empty').max(2000) });
const commentParams = z.object({ id: objectId, commentId: objectId });

module.exports = {
  idParam,
  projectIdParam,
  register,
  login,
  updateProfile,
  changePassword,
  projectCreate,
  projectUpdate,
  projectQuery,
  memberBody,
  memberParams,
  activityQuery,
  taskCreate,
  taskUpdate,
  taskMove,
  taskQuery,
  myTasksQuery,
  commentBody,
  commentParams,
};
