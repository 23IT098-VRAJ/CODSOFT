const express = require('express');
const projects = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { loadProject, requireOwner } = require('../middleware/access');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const router = express.Router();
router.use(protect);

// Validates the :id, then loads the project and checks membership.
const project = [validate({ params: s.idParam }), loadProject()];

router.get('/', validate({ query: s.projectQuery }), projects.listProjects);
router.post('/', validate({ body: s.projectCreate }), projects.createProject);

router.get('/:id', project, projects.getProject);
router.put('/:id', validate({ params: s.idParam, body: s.projectUpdate }), loadProject(), projects.updateProject);
router.delete('/:id', project, requireOwner, projects.deleteProject);

router.get('/:id/stats', project, projects.getStats);
router.get('/:id/activity', validate({ params: s.idParam, query: s.activityQuery }), loadProject(), projects.getActivity);

router.post('/:id/members', validate({ params: s.idParam, body: s.memberBody }), loadProject(), projects.addMember);
router.delete('/:id/members/:userId', validate({ params: s.memberParams }), loadProject(), projects.removeMember);

module.exports = router;
