const express = require('express');
const admin = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/stats', admin.getStats);
router.get('/users', validate({ query: s.userQuery }), admin.listUsers);
router.put('/users/:id/role', validate({ params: s.idParam, body: s.roleBody }), admin.updateRole);

module.exports = router;
