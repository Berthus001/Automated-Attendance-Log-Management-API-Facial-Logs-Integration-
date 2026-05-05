const express = require('express');
const { getAttendance } = require('../controllers/attendanceController');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, allowRoles('superadmin', 'admin'), getAttendance);

module.exports = router;
