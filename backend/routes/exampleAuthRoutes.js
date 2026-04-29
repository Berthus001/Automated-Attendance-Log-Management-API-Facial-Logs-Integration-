/**
 * Role-Based Authorization Examples
 * Demonstrates how to use allowRoles middleware
 */

const express = require('express');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Example 1: Superadmin only route
router.get('/superadmin-only', 
  protect, 
  allowRoles('superadmin'), 
  (req, res) => {
    res.json({ message: 'Welcome superadmin!' });
  }
);

// Example 2: Admin route (superadmin and admin)
router.get('/admin-panel', 
  protect, 
  allowRoles('superadmin', 'admin'), 
  (req, res) => {
    res.json({ message: 'Welcome to admin panel!' });
  }
);

// Example 3: Teacher and student route
router.get('/classroom', 
  protect, 
  allowRoles('teacher', 'student'), 
  (req, res) => {
    res.json({ message: 'Welcome to classroom!' });
  }
);

// Example 4: All authenticated users (no role restriction)
router.get('/profile', 
  protect, 
  (req, res) => {
    res.json({ 
      message: 'Your profile', 
      user: req.user 
    });
  }
);

// Example 5: Multiple middleware chain
router.post('/create-user',
  protect,
  allowRoles('superadmin', 'admin'),
  (req, res) => {
    // Only superadmin and admin can create users
    res.json({ message: 'User created successfully' });
  }
);

module.exports = router;
