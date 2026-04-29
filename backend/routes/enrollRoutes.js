const express = require('express');
const router = express.Router();
const {
  enrollStudent,
  getEnrolledStudent,
  updateEnrolledStudent,
  deleteEnrolledStudent,
  getAllEnrolledStudents,
} = require('../controllers/enrollController');

// Get all enrolled students
router.get('/', getAllEnrolledStudents);

// Enroll new student
router.post('/', enrollStudent);

// Get specific student
router.get('/:studentId', getEnrolledStudent);

// Update student information
router.put('/:studentId', updateEnrolledStudent);

// Delete student
router.delete('/:studentId', deleteEnrolledStudent);

module.exports = router;
