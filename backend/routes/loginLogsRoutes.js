const express = require('express');
const router = express.Router();
const {
  getLoginLogs,
  getLoginStats,
  getActionLogs,
  getMyLoginLogs,
} = require('../controllers/loginLogsController');
const { protect, allowRoles } = require('../middleware/auth');

// Protected routes
router.get('/', protect, allowRoles('superadmin', 'admin'), getLoginLogs);
router.get('/stats', protect, allowRoles('superadmin', 'admin'), getLoginStats);
router.get('/actions', protect, allowRoles('superadmin'), getActionLogs);
router.get('/me', protect, getMyLoginLogs);

module.exports = router;
