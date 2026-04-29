const express = require('express');
const router = express.Router();
const {
  faceLogin,
  verifyFace,
  getAttendanceStats,
} = require('../controllers/faceLoginController');

// Face login - log attendance
router.post('/', faceLogin);

// Verify face without logging attendance
router.post('/verify', verifyFace);

// Get attendance statistics for a student
router.get('/stats/:studentId', getAttendanceStats);

module.exports = router;
