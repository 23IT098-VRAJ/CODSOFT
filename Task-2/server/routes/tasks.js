const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: verify user is project member
const verifyMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isOwner = project.ownerId.toString() === userId.toString();
  const isMember = project.members.some((m) => m.toString() === userId.toString());
  if (!isOwner && !isMember) return null;
  return project;
};

// GET /api/tasks/:projectId — Get all tasks for a project
router.get('/:projectId', protect, async (req, res) => {
  try {
    const project = await verifyMembership(req.params.projectId, req.user._id);
    if (!project) {
      return res.status(403).json({ message: 'Access denied or project not found' });
    }

    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assigneeId', '_id name email avatarColor')
      .sort({ order: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks — Create a task
router.post('/', protect, async (req, res) => {
  try {
    const { title, projectId, status = 'Todo', priority, assigneeId, dueDate, description } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and projectId are required' });
    }

    const project = await verifyMembership(projectId, req.user._id);
    if (!project) {
      return res.status(403).json({ message: 'Access denied or project not found' });
    }

    // Get max order in that status bucket
    const lastTask = await Task.findOne({ projectId, status }).sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title,
      projectId,
      status,
      priority,
      assigneeId: assigneeId || null,
      dueDate,
      description,
      order,
    });

    const populated = await Task.findById(task._id).populate(
      'assigneeId',
      '_id name email avatarColor'
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id — Update a task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await verifyMembership(task.projectId, req.user._id);
    if (!project) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, priority, assigneeId, dueDate, order } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assigneeId !== undefined) task.assigneeId = assigneeId || null;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (order !== undefined) task.order = order;

    await task.save();

    const updated = await Task.findById(task._id).populate(
      'assigneeId',
      '_id name email avatarColor'
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id — Delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await verifyMembership(task.projectId, req.user._id);
    if (!project) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/move — Kanban drag-drop
router.patch('/:id/move', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await verifyMembership(task.projectId, req.user._id);
    if (!project) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, order } = req.body;
    if (status !== undefined) task.status = status;
    if (order !== undefined) task.order = order;

    await task.save();

    const updated = await Task.findById(task._id).populate(
      'assigneeId',
      '_id name email avatarColor'
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
