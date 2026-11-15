const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const { placeTask, closeGaps } = require('../services/taskOrder');
const { PUBLIC_USER_FIELDS } = require('../config/constants');

const withAssignee = (query) => query.populate('assigneeId', PUBLIC_USER_FIELDS);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const overdueFilter = () => ({ status: { $ne: 'Done' }, dueDate: { $ne: null, $lt: new Date() } });

// A task may only be assigned to someone who is in the project.
function assertAssignable(project, assigneeId) {
  if (assigneeId && !project.hasMember(assigneeId)) {
    throw new ApiError(400, 'Tasks can only be assigned to members of the project');
  }
}

// GET /api/tasks/:projectId — a project's tasks, in board order.
// Optional filters: status, priority, assignee (an id, "me" or "none"), overdue, q.
exports.listTasks = async (req, res) => {
  const { status, priority, assignee, overdue, q } = req.validQuery;
  const filter = { projectId: req.project._id };

  if (overdue === 'true') Object.assign(filter, overdueFilter());
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee === 'me') filter.assigneeId = req.user._id;
  else if (assignee === 'none') filter.assigneeId = null;
  else if (assignee) filter.assigneeId = assignee;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  res.json(await withAssignee(Task.find(filter)).sort({ order: 1, createdAt: 1 }));
};

// GET /api/tasks/mine — everything assigned to me, across all my projects
exports.listMyTasks = async (req, res) => {
  const { status, overdue } = req.validQuery;

  // Limited to projects I still belong to, in case an old assignment survived.
  const projects = await Project.find({ members: req.user._id }).select('_id').lean();
  const filter = { assigneeId: req.user._id, projectId: { $in: projects.map((p) => p._id) } };
  if (overdue === 'true') Object.assign(filter, overdueFilter());
  if (status) filter.status = status;

  const tasks = await Task.find(filter)
    .populate('projectId', 'name color')
    .populate('assigneeId', PUBLIC_USER_FIELDS)
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  // Tasks with a due date first (soonest first), then the undated ones.
  tasks.sort((a, b) => (a.dueDate ? 0 : 1) - (b.dueDate ? 0 : 1));
  res.json(tasks);
};

// POST /api/tasks — new tasks go to the bottom of their column
exports.createTask = async (req, res) => {
  const { project } = req; // loaded and membership-checked by the route
  const { title, description, status = 'Todo', priority, assigneeId = null, dueDate = null } = req.body;
  assertAssignable(project, assigneeId);

  const order = await Task.countDocuments({ projectId: project._id, status });
  const task = await Task.create({
    projectId: project._id,
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    order,
    createdBy: req.user._id,
    completedAt: status === 'Done' ? new Date() : null,
  });

  await Activity.record({ projectId: project._id, actorId: req.user._id, type: 'task.created', taskId: task._id, meta: { title: task.title, status } });
  res.status(201).json(await withAssignee(Task.findById(task._id)));
};

// PUT /api/tasks/:id — edit a task's details
exports.updateTask = async (req, res) => {
  const { task, project } = req;
  const { status, order, ...fields } = req.body;
  const events = [];
  const record = (type, meta = {}) => events.push({ type, meta: { title: fields.title ?? task.title, ...meta } });

  if (fields.assigneeId !== undefined) {
    assertAssignable(project, fields.assigneeId);
    if (String(fields.assigneeId || '') !== String(task.assigneeId || '')) {
      const member = fields.assigneeId ? await project.populate('members', 'name') : null;
      const name = member?.members.find((m) => String(m._id) === String(fields.assigneeId))?.name;
      record('task.assigned', { assignee: name || null });
    }
  }

  const edited = Object.keys(fields).filter((k) => k !== 'assigneeId' && String(task[k] ?? '') !== String(fields[k] ?? ''));
  Object.assign(task, fields);
  await task.save();
  if (edited.length) record('task.updated', { fields: edited });

  // A change of status, or an explicit position, is a move on the board.
  const statusChanged = status !== undefined && status !== task.status;
  if (statusChanged || order !== undefined) {
    const move = await placeTask(task, status ?? task.status, statusChanged && order === undefined ? undefined : order);
    if (statusChanged) record(move.toStatus === 'Done' ? 'task.completed' : 'task.moved', { from: move.fromStatus, to: move.toStatus });
  }

  for (const e of events) {
    await Activity.record({ projectId: project._id, actorId: req.user._id, taskId: task._id, ...e });
  }
  res.json(await withAssignee(Task.findById(task._id)));
};

// PATCH /api/tasks/:id/move — drag and drop on the board.
// Body: { status, order } where order is the position within the column.
exports.moveTask = async (req, res) => {
  const { task } = req;
  const { status = task.status, order } = req.body;
  const move = await placeTask(task, status, order);

  if (move.fromStatus !== move.toStatus) {
    await Activity.record({
      projectId: task.projectId,
      actorId: req.user._id,
      taskId: task._id,
      type: move.toStatus === 'Done' ? 'task.completed' : 'task.moved',
      meta: { title: task.title, from: move.fromStatus, to: move.toStatus },
    });
  }
  res.json(await withAssignee(Task.findById(task._id)));
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  const { task } = req;
  await Promise.all([task.deleteOne(), Comment.deleteMany({ taskId: task._id })]);
  await closeGaps(task.projectId, task.status); // the column closes up behind it
  await Activity.record({ projectId: task.projectId, actorId: req.user._id, type: 'task.deleted', meta: { title: task.title } });
  res.json({ message: 'Task deleted' });
};

// ── Comments ──────────────────────────────────────────────────────────

// GET /api/tasks/:id/comments — oldest first, like a conversation
exports.listComments = async (req, res) => {
  const comments = await Comment.find({ taskId: req.task._id }).sort({ createdAt: 1 }).populate('authorId', PUBLIC_USER_FIELDS).lean();
  res.json(comments);
};

// POST /api/tasks/:id/comments
exports.addComment = async (req, res) => {
  const comment = await Comment.create({
    taskId: req.task._id,
    projectId: req.task.projectId,
    authorId: req.user._id,
    body: req.body.body,
  });
  await Activity.record({ projectId: req.task.projectId, actorId: req.user._id, type: 'comment.added', taskId: req.task._id, meta: { title: req.task.title } });
  res.status(201).json(await comment.populate('authorId', PUBLIC_USER_FIELDS));
};

// DELETE /api/tasks/:id/comments/:commentId — the author, or the project owner
exports.deleteComment = async (req, res) => {
  const comment = await Comment.findOne({ _id: req.validParams.commentId, taskId: req.task._id });
  if (!comment) throw new ApiError(404, 'Comment not found');

  const isAuthor = String(comment.authorId) === String(req.user._id);
  if (!isAuthor && !req.project.isOwner(req.user._id)) throw new ApiError(403, 'You can only delete your own comments');

  await comment.deleteOne();
  res.json({ message: 'Comment deleted' });
};
