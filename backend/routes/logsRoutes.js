const express = require('express');
const router = express.Router();
const {
  getAttendanceLogs,
  getAttendanceLogById,
  getLogsSummary,
  deleteAttendanceLog,
  getLogsByDate,
  logMyAttendance,
  getMyAttendance,
} = require('../controllers/logsController');
const { protect, allowRoles } = require('../middleware/auth');

// Self-service routes for students/teachers (must come first to avoid conflict with /:id)
router.post('/log-attendance', protect, logMyAttendance);
router.get('/my-attendance', protect, getMyAttendance);

// Admin/SuperAdmin routes
router.get('/summary', protect, allowRoles('superadmin', 'admin'), getLogsSummary);
router.get('/by-date', protect, allowRoles('superadmin', 'admin'), getLogsByDate);

// Protected routes - only SuperAdmin and Admin can view all logs
router.get('/', protect, allowRoles('superadmin', 'admin'), getAttendanceLogs);
router.get('/:id', protect, allowRoles('superadmin', 'admin'), getAttendanceLogById);
router.delete('/:id', protect, allowRoles('superadmin', 'admin'), deleteAttendanceLog);

module.exports = router;
