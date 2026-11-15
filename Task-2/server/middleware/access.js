// Access control. Every project and task route goes through one of these, so
// the membership rule lives in exactly one place: you can only see or change
// a project — and anything inside it — if you are one of its members.
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

async function findProjectFor(user, projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!project.hasMember(user._id)) throw new ApiError(403, 'Access denied');
  return project;
}

// For routes with a project id in the URL: loads it into req.project.
// `param` names the URL parameter that holds the id.
const loadProject = (param = 'id') => async (req, res, next) => {
  req.project = await findProjectFor(req.user, req.validParams[param]);
  next();
};

// For routes with a task id in the URL: loads req.task and its req.project.
const loadTask = async (req, res, next) => {
  const task = await Task.findById(req.validParams.id);
  if (!task) throw new ApiError(404, 'Task not found');
  req.project = await findProjectFor(req.user, task.projectId);
  req.task = task;
  next();
};

const requireOwner = (req, res, next) => {
  if (!req.project.isOwner(req.user._id)) throw new ApiError(403, 'Only the project owner can do this');
  next();
};

module.exports = { findProjectFor, loadProject, loadTask, requireOwner };
