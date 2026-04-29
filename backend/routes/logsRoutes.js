const express = require('express');
const router = express.Router();
const {
  getAttendanceLogs,
  getAttendanceLogById,
  getLogsSummary,
  deleteAttendanceLog,
  getLogsByDate,
} = require('../controllers/logsController');

// Get logs summary/statistics (must be before /:id route)
router.get('/summary', getLogsSummary);

// Get logs grouped by date
router.get('/by-date', getLogsByDate);

// Get all logs with filtering and pagination
router.get('/', getAttendanceLogs);

// Get single log by ID
router.get('/:id', getAttendanceLogById);

// Delete log by ID
router.delete('/:id', deleteAttendanceLog);

module.exports = router;
