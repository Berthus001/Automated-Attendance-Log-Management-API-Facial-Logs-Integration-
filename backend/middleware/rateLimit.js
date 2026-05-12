const rateLimit = require('express-rate-limit');

exports.userManagementWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many user management requests, please try again later.',
  },
});
