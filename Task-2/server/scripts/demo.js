// Zero-setup demo: `npm run demo`
//
// Starts the API against a throw-away in-memory MongoDB and fills it with a
// small team, three projects, tasks, comments and an activity history.
// Nothing touches your real database; everything is gone when it stops.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.JWT_SECRET = 'demo-only-secret-not-for-production';

const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');

// Demo-only accounts. They exist solely inside the in-memory database.
const PASSWORD = 'demo1234';
const PEOPLE = [
  { name: 'Priya Sharma', email: 'priya@taskflow.demo', avatarColor: '#3730A3' },
  { name: 'Arjun Mehta', email: 'arjun@taskflow.demo', avatarColor: '#064E3B' },
  { name: 'Neha Iyer', email: 'neha@taskflow.demo', avatarColor: '#881337' },
];

const day = 24 * 60 * 60 * 1000;
const fromNow = (days) => new Date(Date.now() + days * day);

// [title, status, priority, assignee index or null, due in days or null]
const PLAN = [
  {
    project: { name: 'Website relaunch', description: 'New marketing site for the autumn campaign', color: '#6366f1', status: 'Active', due: 21 },
    owner: 0,
    members: [0, 1, 2],
    tasks: [
      ['Audit current pages', 'Done', 'Medium', 1, -6],
      ['Agree on sitemap', 'Done', 'High', 0, -4],
      ['Design homepage hero', 'In Progress', 'High', 2, 2],
      ['Write product copy', 'In Progress', 'Medium', 1, 5],
      ['Set up analytics', 'Todo', 'Low', null, 12],
      ['Build contact form', 'Todo', 'Medium', 0, 9],
      ['Fix broken footer links', 'Todo', 'High', 1, -1],
    ],
  },
  {
    project: { name: 'Mobile app v2', description: 'Offline mode and a redesigned onboarding', color: '#0ea5e9', status: 'Active', due: 45 },
    owner: 1,
    members: [1, 0],
    tasks: [
      ['Sketch onboarding flow', 'Done', 'Medium', 1, -10],
      ['Offline sync prototype', 'In Progress', 'High', 1, 7],
      ['Push notification settings', 'Todo', 'Medium', 0, 14],
      ['Crash on older Android', 'Todo', 'High', 0, -2],
    ],
  },
  {
    project: { name: 'Team offsite', description: 'Two days in Udaipur', color: '#f59e0b', status: 'On Hold', due: null },
    owner: 2,
    members: [2, 0],
    tasks: [
      ['Shortlist venues', 'Done', 'Low', 2, null],
      ['Collect dietary preferences', 'Todo', 'Low', 0, null],
    ],
  },
];

async function seed() {
  const users = [];
  for (const person of PEOPLE) users.push(await User.create({ ...person, password: PASSWORD }));

  let taskCount = 0;
  for (const plan of PLAN) {
    const owner = users[plan.owner];
    const { due, ...details } = plan.project;
    const project = await Project.create({
      ...details,
      dueDate: due === null ? null : fromNow(due),
      ownerId: owner._id,
      members: plan.members.map((i) => users[i]._id),
    });
    await Activity.record({ projectId: project._id, actorId: owner._id, type: 'project.created', meta: { name: project.name } });

    const position = {}; // next free slot per column
    for (const [title, status, priority, assignee, dueIn] of plan.tasks) {
      position[status] = position[status] ?? 0;
      const task = await Task.create({
        projectId: project._id,
        title,
        status,
        priority,
        assigneeId: assignee === null ? null : users[assignee]._id,
        dueDate: dueIn === null ? null : fromNow(dueIn),
        order: position[status],
        createdBy: owner._id,
        completedAt: status === 'Done' ? fromNow(-1) : null,
      });
      position[status] += 1;
      taskCount += 1;
      await Activity.record({ projectId: project._id, actorId: owner._id, type: 'task.created', taskId: task._id, meta: { title, status } });

      if (status === 'In Progress') {
        await Comment.create({ taskId: task._id, projectId: project._id, authorId: owner._id, body: 'How is this one going?' });
      }
    }
  }
  return { users: users.length, projects: PLAN.length, tasks: taskCount };
}

async function main() {
  console.log('Starting in-memory MongoDB (the first run downloads the MongoDB binary)…');
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('taskflow_demo');
  await connectDB();
  const counts = await seed();

  const app = require('../app');
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, (err) => {
    if (err) {
      // Express 5 passes a bind failure here instead of throwing.
      console.error(`Could not start the demo: ${err.code === 'EADDRINUSE' ? `port ${PORT} is already in use` : err.message}.`);
      process.exit(1);
    }
    console.log(`\nTaskFlow demo API ready on http://localhost:${PORT}`);
    console.log(`  ${counts.users} people · ${counts.projects} projects · ${counts.tasks} tasks`);
    console.log(`  Log in as any of: ${PEOPLE.map((p) => p.email).join(', ')}`);
    console.log(`  Password for all three: ${PASSWORD}`);
    console.log('  Data lives in memory only and is discarded when you stop this process.\n');
  });

  const shutdown = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Demo failed to start:', err.message);
  process.exit(1);
});
