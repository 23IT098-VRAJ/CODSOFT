const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects — Get all projects where user is owner or member
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({
      $or: [{ ownerId: userId }, { members: userId }],
    }).populate('members', '_id name email avatarColor');

    // Attach task stats to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const [done, total] = await Promise.all([
          Task.countDocuments({ projectId: project._id, status: 'Done' }),
          Task.countDocuments({ projectId: project._id }),
        ]);
        return { ...project.toObject(), taskStats: { done, total } };
      })
    );

    res.json(projectsWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects — Create a new project
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, color, status, dueDate } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      description,
      color,
      status,
      dueDate,
      ownerId: req.user._id,
    });

    const populated = await Project.findById(project._id).populate(
      'members',
      '_id name email avatarColor'
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id — Get single project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'members',
      '_id name email avatarColor'
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userId = req.user._id.toString();
    const isMember =
      project.ownerId.toString() === userId ||
      project.members.some((m) => m._id.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id — Update project
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userId = req.user._id.toString();
    const isMember =
      project.ownerId.toString() === userId ||
      project.members.some((m) => m.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, color, status, dueDate } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (color !== undefined) project.color = color;
    if (status !== undefined) project.status = status;
    if (dueDate !== undefined) project.dueDate = dueDate;

    await project.save();

    const updated = await Project.findById(project._id).populate(
      'members',
      '_id name email avatarColor'
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id — Delete project (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ projectId: req.params.id });

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:id/members — Add member by email
router.post('/:id/members', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userId = req.user._id.toString();
    const isMember =
      project.ownerId.toString() === userId ||
      project.members.some((m) => m.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { email } = req.body;
    const newUser = await User.findOne({ email: email.toLowerCase() });
    if (!newUser) {
      return res.status(404).json({ message: 'User not found with that email' });
    }

    const alreadyMember = project.members.some(
      (m) => m.toString() === newUser._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push(newUser._id);
    await project.save();

    const updated = await Project.findById(project._id).populate(
      'members',
      '_id name email avatarColor'
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
