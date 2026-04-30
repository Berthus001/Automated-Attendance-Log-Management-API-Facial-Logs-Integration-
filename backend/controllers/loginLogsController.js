const LoginLog = require('../models/LoginLog.model');
const User = require('../models/User.model');

// @desc    Get login logs with filtering
// @route   GET /api/logs
// @access  Private (Admin/SuperAdmin)
exports.getLoginLogs = async (req, res) => {
  try {
    const { role, startDate, endDate, page = 1, limit = 50 } = req.query;

    // Build query
    let query = {};

    // Apply ownership restriction for admins
    if (req.user.role === 'admin') {
      // Admin can only see logs of users they created
      const createdUsers = await User.find({ createdBy: req.user._id }).select('_id');
      const userIds = createdUsers.map(user => user._id);
      query.userId = { $in: userIds };
    }
    // Superadmin can see all logs (no filter applied)

    // Filter by role if provided
    if (role) {
      const validRoles = ['superadmin', 'admin', 'teacher', 'student'];
      if (validRoles.includes(role)) {
        query.role = role;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
      }
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.loginTime = {};
      
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate format. Use ISO 8601 format (e.g., 2026-04-30)',
          });
        }
        query.loginTime.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate format. Use ISO 8601 format (e.g., 2026-04-30)',
          });
        }
        // Set to end of day
        end.setHours(23, 59, 59, 999);
        query.loginTime.$lte = end;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const logs = await LoginLog.find(query)
      .populate('userId', 'name email department')
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LoginLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get login log statistics
// @route   GET /api/logs/stats
// @access  Private (Admin/SuperAdmin)
exports.getLoginStats = async (req, res) => {
  try {
    let matchQuery = {};

    // Apply ownership restriction for admins
    if (req.user.role === 'admin') {
      const createdUsers = await User.find({ createdBy: req.user._id }).select('_id');
      const userIds = createdUsers.map(user => user._id);
      matchQuery.userId = { $in: userIds };
    }

    // Get statistics
    const stats = await LoginLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          lastLogin: { $max: '$loginTime' },
        },
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          lastLogin: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get total logins
    const totalLogins = await LoginLog.countDocuments(matchQuery);

    // Get logins today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const loginsToday = await LoginLog.countDocuments({
      ...matchQuery,
      loginTime: { $gte: today },
    });

    res.status(200).json({
      success: true,
      data: {
        totalLogins,
        loginsToday,
        byRole: stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's own login history
// @route   GET /api/logs/me
// @access  Private
exports.getMyLoginLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await LoginLog.find({ userId: req.user._id })
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LoginLog.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
