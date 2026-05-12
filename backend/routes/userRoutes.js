const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getStudents,
  getTeachers,
} = require('../controllers/userController');
const { protect, allowRoles } = require('../middleware/auth');
const { userManagementWriteLimiter } = require('../middleware/rateLimit');

// Public routes - none

// Protected routes - Role-specific endpoints
router.get('/students', protect, allowRoles('superadmin', 'admin'), getStudents);
router.get('/teachers', protect, allowRoles('superadmin', 'admin'), getTeachers);

// Protected routes - General user management
router.route('/')
  .get(protect, allowRoles('superadmin', 'admin'), getUsers)
  .post(protect, allowRoles('superadmin', 'admin'), userManagementWriteLimiter, createUser);

router.route('/:id')
  .get(protect, getUser)
  .put(protect, allowRoles('superadmin', 'admin'), userManagementWriteLimiter, updateUser)
  .delete(protect, allowRoles('superadmin', 'admin'), userManagementWriteLimiter, deleteUser);

module.exports = router;
