const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const { PUBLIC_USER_FIELDS, TASK_STATUSES, PRIORITIES } = require('../config/constants');

const withMembers = (query) => query.populate('members', PUBLIC_USER_FIELDS);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/projects — every project the user belongs to, with task counts
exports.listProjects = async (req, res) => {
  const { status, q } = req.validQuery;
  const filter = { $or: [{ ownerId: req.user._id }, { members: req.user._id }] };
  if (status) filter.status = status;
  if (q) filter.name = new RegExp(escapeRegex(q), 'i');

  const projects = await withMembers(Project.find(filter)).sort({ createdAt: 1 }).lean();

  // One aggregation for all projects, instead of two count queries per project.
  const now = new Date();
  const stats = await Task.aggregate([
    { $match: { projectId: { $in: projects.map((p) => p._id) } } },
    {
      $group: {
        _id: '$projectId',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } },
        overdue: {
          $sum: { $cond: [{ $and: [{ $ne: ['$status', 'Done'] }, { $ne: ['$dueDate', null] }, { $lt: ['$dueDate', now] }] }, 1, 0] },
        },
      },
    },
  ]);
  const byProject = new Map(stats.map((s) => [String(s._id), s]));

  res.json(
    projects.map((p) => {
      const s = byProject.get(String(p._id));
      return { ...p, taskStats: { done: s?.done || 0, total: s?.total || 0, overdue: s?.overdue || 0 } };
    })
  );
};

// POST /api/projects
exports.createProject = async (req, res) => {
  const project = await Project.create({ ...req.body, ownerId: req.user._id });
  await Activity.record({ projectId: project._id, actorId: req.user._id, type: 'project.created', meta: { name: project.name } });
  res.status(201).json(await withMembers(Project.findById(project._id)));
};

// GET /api/projects/:id
exports.getProject = async (req, res) => {
  res.json(await withMembers(Project.findById(req.project._id)));
};

// PUT /api/projects/:id — any member may edit the project's details
exports.updateProject = async (req, res) => {
  const changed = Object.keys(req.body).filter((key) => String(req.project[key] ?? '') !== String(req.body[key] ?? ''));
  Object.assign(req.project, req.body);
  await req.project.save();

  if (changed.length) {
    await Activity.record({ projectId: req.project._id, actorId: req.user._id, type: 'project.updated', meta: { fields: changed } });
  }
  res.json(await withMembers(Project.findById(req.project._id)));
};

// DELETE /api/projects/:id — owner only; removes everything inside it
exports.deleteProject = async (req, res) => {
  const projectId = req.project._id;
  await Promise.all([
    Task.deleteMany({ projectId }),
    Comment.deleteMany({ projectId }),
    Activity.deleteMany({ projectId }),
    req.project.deleteOne(),
  ]);
  res.json({ message: 'Project deleted' });
};

// POST /api/projects/:id/members — add a registered user by email
exports.addMember = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ApiError(404, 'User not found with that email');
  if (req.project.hasMember(user._id)) throw new ApiError(400, 'User is already a member');

  // $addToSet makes the write itself idempotent: two invitations racing each
  // other cannot add the same person twice.
  await Project.updateOne({ _id: req.project._id }, { $addToSet: { members: user._id } });
  await Activity.record({ projectId: req.project._id, actorId: req.user._id, type: 'member.added', meta: { name: user.name } });
  res.json(await withMembers(Project.findById(req.project._id)));
};

// DELETE /api/projects/:id/members/:userId
// The owner can remove anyone else; a member can remove themselves (leave).
// The owner cannot leave — a project always has an owner.
exports.removeMember = async (req, res) => {
  const { userId } = req.validParams;
  const isSelf = String(req.user._id) === userId;

  if (req.project.isOwner(userId)) throw new ApiError(400, 'The owner cannot be removed from the project');
  if (!isSelf && !req.project.isOwner(req.user._id)) throw new ApiError(403, 'Only the project owner can remove members');
  if (!req.project.hasMember(userId)) throw new ApiError(404, 'That user is not a member of this project');

  const removed = await User.findById(userId).select('name');
  await Promise.all([
    Project.updateOne({ _id: req.project._id }, { $pull: { members: userId } }),
    // Their tasks stay in the project, but become unassigned.
    Task.updateMany({ projectId: req.project._id, assigneeId: userId }, { $set: { assigneeId: null } }),
  ]);
  await Activity.record({
    projectId: req.project._id,
    actorId: req.user._id,
    type: 'member.removed',
    meta: { name: removed?.name || 'A member', left: isSelf },
  });

  if (isSelf) return res.json({ message: 'You left the project' });
  res.json(await withMembers(Project.findById(req.project._id)));
};

// GET /api/projects/:id/stats — figures for a project report
exports.getStats = async (req, res) => {
  const projectId = req.project._id;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const open = { status: { $ne: 'Done' } };

  // $facet runs several groupings over the same set of tasks in one query.
  const [facets] = await Task.aggregate([
    { $match: { projectId } },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byPriority: [{ $match: open }, { $group: { _id: '$priority', count: { $sum: 1 } } }],
        overdue: [{ $match: { ...open, dueDate: { $ne: null, $lt: now } } }, { $count: 'count' }],
        unassigned: [{ $match: { ...open, assigneeId: null } }, { $count: 'count' }],
        completedThisWeek: [{ $match: { completedAt: { $gte: weekAgo } } }, { $count: 'count' }],
        workload: [
          { $match: { assigneeId: { $ne: null } } },
          {
            $group: {
              _id: '$assigneeId',
              open: { $sum: { $cond: [{ $ne: ['$status', 'Done'] }, 1, 0] } },
              done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } },
            },
          },
        ],
      },
    },
  ]);

  const countOf = (rows, key) => rows.find((r) => r._id === key)?.count || 0;
  const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, countOf(facets.byStatus, s)]));
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const members = await User.find({ _id: { $in: req.project.members } }).select(PUBLIC_USER_FIELDS).lean();
  const load = new Map(facets.workload.map((w) => [String(w._id), w]));

  res.json({
    total,
    byStatus,
    openByPriority: Object.fromEntries(PRIORITIES.map((p) => [p, countOf(facets.byPriority, p)])),
    completion: total ? Math.round((byStatus.Done / total) * 100) : 0,
    overdue: facets.overdue[0]?.count || 0,
    unassigned: facets.unassigned[0]?.count || 0,
    completedThisWeek: facets.completedThisWeek[0]?.count || 0,
    workload: members
      .map((m) => ({ user: m, open: load.get(String(m._id))?.open || 0, done: load.get(String(m._id))?.done || 0 }))
      .sort((a, b) => b.open - a.open),
  });
};

// GET /api/projects/:id/activity — newest first
exports.getActivity = async (req, res) => {
  const activity = await Activity.find({ projectId: req.project._id })
    .sort({ createdAt: -1 })
    .limit(req.validQuery.limit)
    .populate('actorId', PUBLIC_USER_FIELDS)
    .lean();
  res.json(activity);
};
