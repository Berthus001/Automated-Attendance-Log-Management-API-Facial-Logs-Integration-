const express = require('express');
const rateLimit = require('express-rate-limit');
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

const userManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many user management requests, please try again later.',
  },
});

router.use(userManagementLimiter);

// Public routes - none

// Protected routes - Role-specific endpoints
router.get('/students', protect, allowRoles('superadmin', 'admin'), getStudents);
router.get('/teachers', protect, allowRoles('superadmin', 'admin'), getTeachers);

// Protected routes - General user management
router.route('/')
  .get(protect, allowRoles('superadmin', 'admin'), getUsers)
  .post(protect, allowRoles('superadmin', 'admin'), createUser);

router.route('/:id')
  .get(protect, getUser)
  .put(protect, allowRoles('superadmin', 'admin'), updateUser)
  .delete(protect, allowRoles('superadmin', 'admin'), deleteUser);

module.exports = router;
