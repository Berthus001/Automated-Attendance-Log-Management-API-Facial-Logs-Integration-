const express = require('express');
const { login, getMe, enrollFace, faceVerify, faceLogin } = require('../controllers/authController');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login); // Email + password (superadmin/admin only)
router.post('/face-login', faceLogin); // Face-only login (student/teacher only)

// Protected routes
router.get('/me', protect, getMe);
router.post('/enroll-face', protect, allowRoles('superadmin', 'admin'), enrollFace);
router.post('/face-verify', protect, faceVerify); // 2FA for admin/superadmin

module.exports = router;
