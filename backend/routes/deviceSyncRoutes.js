const express = require('express');
const router = express.Router();
const { 
  syncAttendanceLog,
  bulkSyncAttendanceLogs
} = require('../controllers/deviceSyncController');

// POST /api/v1/device-sync - Sync single attendance log
router.post('/', syncAttendanceLog);

// POST /api/v1/device-sync/bulk - Bulk sync multiple logs
router.post('/bulk', bulkSyncAttendanceLogs);

module.exports = router;
