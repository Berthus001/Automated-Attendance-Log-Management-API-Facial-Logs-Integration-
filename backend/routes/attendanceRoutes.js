const express = require('express');
const { getAttendance, exportAttendanceToPDF } = require('../controllers/attendanceController');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, allowRoles('superadmin', 'admin'), getAttendance);
router.get('/export-pdf', protect, allowRoles('superadmin', 'admin'), exportAttendanceToPDF);

module.exports = router;
