const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { PUBLIC_USER_FIELDS, PROJECT_STATUSES, TASK_STATUSES } = require('../config/constants');

// GET /api/dashboard — a personal summary across every project I belong to:
// how many projects, what is on my plate, what is late, what is due soon,
// and what the team has been doing.
exports.getDashboard = async (req, res) => {
  const me = req.user._id;
  const now = new Date();
  const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const projects = await Project.find({ members: me }).select('_id name color status').lean();
  const projectIds = projects.map((p) => p._id);
  const mine = { assigneeId: me, projectId: { $in: projectIds } };
  const open = { ...mine, status: { $ne: 'Done' } };

  const [byStatus, overdue, dueSoon, recentActivity] = await Promise.all([
    Task.aggregate([{ $match: mine }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.countDocuments({ ...open, dueDate: { $ne: null, $lt: now } }),
    Task.find({ ...open, dueDate: { $gte: now, $lte: inAWeek } })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('projectId', 'name color')
      .select('title dueDate priority status projectId')
      .lean(),
    Activity.find({ projectId: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('actorId', PUBLIC_USER_FIELDS)
      .populate('projectId', 'name color')
      .lean(),
  ]);

  const count = (rows, key) => rows.find((r) => r._id === key)?.count || 0;

  res.json({
    projects: {
      total: projects.length,
      byStatus: Object.fromEntries(PROJECT_STATUSES.map((s) => [s, projects.filter((p) => p.status === s).length])),
    },
    myTasks: {
      byStatus: Object.fromEntries(TASK_STATUSES.map((s) => [s, count(byStatus, s)])),
      open: count(byStatus, 'Todo') + count(byStatus, 'In Progress'),
      overdue,
    },
    dueSoon,
    recentActivity,
  });
};
