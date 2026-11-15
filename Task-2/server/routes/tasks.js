const express = require('express');
const tasks = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { findProjectFor, loadProject, loadTask } = require('../middleware/access');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const router = express.Router();
router.use(protect);

// Validates the task :id, then loads the task and its project (membership checked).
const task = [validate({ params: s.idParam }), loadTask];

// Creating a task names its project in the body rather than the URL.
const loadProjectFromBody = async (req, res, next) => {
  req.project = await findProjectFor(req.user, req.body.projectId);
  next();
};

// '/mine' must be declared before '/:projectId', or it would be read as an id.
router.get('/mine', validate({ query: s.myTasksQuery }), tasks.listMyTasks);
router.get('/:projectId', validate({ params: s.projectIdParam, query: s.taskQuery }), loadProject('projectId'), tasks.listTasks);

router.post('/', validate({ body: s.taskCreate }), loadProjectFromBody, tasks.createTask);
router.put('/:id', validate({ params: s.idParam, body: s.taskUpdate }), loadTask, tasks.updateTask);
router.patch('/:id/move', validate({ params: s.idParam, body: s.taskMove }), loadTask, tasks.moveTask);
router.delete('/:id', task, tasks.deleteTask);

router.get('/:id/comments', task, tasks.listComments);
router.post('/:id/comments', validate({ params: s.idParam, body: s.commentBody }), loadTask, tasks.addComment);
router.delete('/:id/comments/:commentId', validate({ params: s.commentParams }), loadTask, tasks.deleteComment);

module.exports = router;
