const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, allowRoles } = require('../middleware/auth');

// Public routes - none

// Protected routes
router.route('/')
  .get(protect, allowRoles('superadmin', 'admin'), getUsers)
  .post(protect, allowRoles('superadmin', 'admin'), createUser);

router.route('/:id')
  .get(protect, getUser)
  .put(protect, allowRoles('superadmin', 'admin'), updateUser)
  .delete(protect, allowRoles('superadmin', 'admin'), deleteUser);

module.exports = router;
