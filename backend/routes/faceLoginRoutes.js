const express = require('express');
const router = express.Router();
const asyncErrorHandler = require('../middleware/asyncErrorHandler');
const {
  faceLogin,
  verifyFace,
  getAttendanceStats,
} = require('../controllers/faceLoginController');

// Face login - log attendance
router.post('/', asyncErrorHandler(faceLogin));

// Verify face without logging attendance
router.post('/verify', asyncErrorHandler(verifyFace));

// Get attendance statistics for a student
router.get('/stats/:studentId', asyncErrorHandler(getAttendanceStats));

module.exports = router;
