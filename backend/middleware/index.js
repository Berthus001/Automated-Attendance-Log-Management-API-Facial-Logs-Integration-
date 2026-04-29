/**
 * Middleware Export Module
 * Centralized export for all middleware functions
 */
const asyncHandler = require('./asyncHandler');
const errorHandler = require('./errorHandler');
const requestLogger = require('./logger');
const { protect, authorize, allowRoles } = require('./auth');

module.exports = {
  asyncHandler,
  errorHandler,
  requestLogger,
  protect,
  authorize,
  allowRoles
};
