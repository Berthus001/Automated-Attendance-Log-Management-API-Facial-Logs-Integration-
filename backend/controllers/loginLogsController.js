const mongoose = require('mongoose');
const LoginLog = require('../models/LoginLog.model');
const AttendanceLog = require('../models/AttendanceLog.model');
const AdminActionLog = require('../models/AdminActionLog.model');
const User = require('../models/User.model');

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parseClientDateBoundary = (dateString, timezoneOffsetMinutes, endOfDay = false) => {
  if (!DATE_ONLY_REGEX.test(dateString)) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map((value) => Number.parseInt(value, 10));
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;

  // Convert client local day boundary to UTC using client timezone offset.
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
    + (timezoneOffsetMinutes * 60 * 1000);
  const boundary = new Date(utcMs);

  if (Number.isNaN(boundary.getTime())) {
    return null;
  }

  return boundary;
};

// @desc    Get login logs with filtering
// @route   GET /api/logs
// @access  Private (Admin/SuperAdmin)
exports.getLoginLogs = async (req, res) => {
  try {
    const { role, startDate, endDate, timezoneOffset = '0', page = 1, limit = 50 } = req.query;

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
      const parsedTimezoneOffset = Number.parseInt(String(timezoneOffset), 10);
      if (!Number.isInteger(parsedTimezoneOffset) || parsedTimezoneOffset < -840 || parsedTimezoneOffset > 840) {
        return res.status(400).json({
          success: false,
          message: 'Invalid timezoneOffset. It must be an integer between -840 and 840 minutes.',
        });
      }

      query.loginTime = {};
      
      if (startDate) {
        const start = DATE_ONLY_REGEX.test(startDate)
          ? parseClientDateBoundary(startDate, parsedTimezoneOffset, false)
          : new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate format. Use YYYY-MM-DD or ISO 8601 format (e.g., 2026-04-30)',
          });
        }
        query.loginTime.$gte = start;
      }
      
      if (endDate) {
        const end = DATE_ONLY_REGEX.test(endDate)
          ? parseClientDateBoundary(endDate, parsedTimezoneOffset, true)
          : new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate format. Use YYYY-MM-DD or ISO 8601 format (e.g., 2026-04-30)',
          });
        }
        if (!DATE_ONLY_REGEX.test(endDate)) {
          // For full timestamps, preserve legacy behavior by including the rest of that day.
          end.setHours(23, 59, 59, 999);
        }
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

// @desc    Get unified action logs (login/logout/attendance)
// @route   GET /api/login-logs/actions
// @access  Private (SuperAdmin)
exports.getActionLogs = async (req, res) => {
  try {
    const {
      role,
      actionType = 'all',
      userId,
      startDate,
      endDate,
      timezoneOffset = '0',
      page = 1,
      limit = 20,
    } = req.query;

    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page value. Page must be an integer greater than or equal to 1.',
      });
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit value. Limit must be an integer between 1 and 100.',
      });
    }

    const parsedTimezoneOffset = Number.parseInt(String(timezoneOffset), 10);
    if (!Number.isInteger(parsedTimezoneOffset) || parsedTimezoneOffset < -840 || parsedTimezoneOffset > 840) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timezoneOffset. It must be an integer between -840 and 840 minutes.',
      });
    }

    const validRoles = ['superadmin', 'admin', 'teacher', 'student'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const validActionTypes = [
      'all',
      'login',
      'logout',
      'attendance_time_in',
      'attendance_time_out',
      'user_created',
      'user_updated',
      'user_deleted',
      'admin_updated',
      'admin_suspended',
      'admin_activated',
      'admin_deleted',
    ];

    if (!validActionTypes.includes(actionType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid actionType. Must be one of: ${validActionTypes.join(', ')}`,
      });
    }

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId format.',
      });
    }

    let start = null;
    let end = null;

    if (startDate) {
      start = parseClientDateBoundary(startDate, parsedTimezoneOffset, false);
      if (!start) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use YYYY-MM-DD (e.g., 2026-04-30)',
        });
      }
    }

    if (endDate) {
      end = parseClientDateBoundary(endDate, parsedTimezoneOffset, true);
      if (!end) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use YYYY-MM-DD (e.g., 2026-04-30)',
        });
      }
    }

    const loginMatch = {};
    if (role) {
      loginMatch.role = role;
    }
    if (userId) {
      loginMatch.userId = new mongoose.Types.ObjectId(userId);
    }
    if (start || end) {
      loginMatch.loginTime = {};
      if (start) {
        loginMatch.loginTime.$gte = start;
      }
      if (end) {
        loginMatch.loginTime.$lte = end;
      }
    }

    const logoutMatch = {};
    if (role) {
      logoutMatch.role = role;
    }
    if (userId) {
      logoutMatch.userId = new mongoose.Types.ObjectId(userId);
    }
    logoutMatch.logoutTime = { $ne: null };
    if (start || end) {
      logoutMatch.logoutTime = {
        ...logoutMatch.logoutTime,
      };
      if (start) {
        logoutMatch.logoutTime.$gte = start;
      }
      if (end) {
        logoutMatch.logoutTime.$lte = end;
      }
    }

    const attendanceRoleFilter = role ? role : { $in: ['student', 'teacher', 'admin'] };

    const attendanceInMatch = {
      userRole: attendanceRoleFilter,
      timeIn: { $ne: null },
    };
    if (userId) {
      attendanceInMatch.userId = new mongoose.Types.ObjectId(userId);
    }

    if (start || end) {
      attendanceInMatch.timeIn = {
        ...attendanceInMatch.timeIn,
      };
      if (start) {
        attendanceInMatch.timeIn.$gte = start;
      }
      if (end) {
        attendanceInMatch.timeIn.$lte = end;
      }
    }

    const attendanceOutMatch = {
      userRole: attendanceRoleFilter,
      timeOut: { $ne: null },
    };
    if (userId) {
      attendanceOutMatch.userId = new mongoose.Types.ObjectId(userId);
    }

    if (start || end) {
      attendanceOutMatch.timeOut = {
        ...attendanceOutMatch.timeOut,
      };
      if (start) {
        attendanceOutMatch.timeOut.$gte = start;
      }
      if (end) {
        attendanceOutMatch.timeOut.$lte = end;
      }
    }

    const loginPipeline = [
      { $match: loginMatch },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          actionId: '$_id',
          userId: '$userId',
          userName: { $ifNull: ['$user.name', 'Unknown User'] },
          userEmail: { $ifNull: ['$user.email', null] },
          role: '$role',
          actionType: { $literal: 'login' },
          description: { $literal: 'User logged in' },
          timestamp: '$loginTime',
          source: { $literal: 'auth' },
          ipAddress: '$ipAddress',
          userAgent: '$userAgent',
        },
      },
    ];

    const logoutPipeline = [
      { $match: logoutMatch },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          actionId: '$_id',
          userId: '$userId',
          userName: { $ifNull: ['$user.name', 'Unknown User'] },
          userEmail: { $ifNull: ['$user.email', null] },
          role: '$role',
          actionType: { $literal: 'logout' },
          description: { $literal: 'User logged out' },
          timestamp: '$logoutTime',
          source: { $literal: 'auth' },
          ipAddress: '$ipAddress',
          userAgent: '$userAgent',
        },
      },
    ];

    const attendanceInPipeline = [
      { $match: attendanceInMatch },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          actionId: '$_id',
          userId: '$userId',
          userName: { $ifNull: ['$userName', { $ifNull: ['$user.name', 'Unknown User'] }] },
          userEmail: { $ifNull: ['$user.email', null] },
          role: '$userRole',
          actionType: { $literal: 'attendance_time_in' },
          description: { $literal: 'Attendance time-in recorded' },
          timestamp: '$timeIn',
          source: { $literal: 'attendance' },
          ipAddress: { $literal: null },
          userAgent: { $literal: null },
        },
      },
    ];

    const attendanceOutPipeline = [
      { $match: attendanceOutMatch },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          actionId: '$_id',
          userId: '$userId',
          userName: { $ifNull: ['$userName', { $ifNull: ['$user.name', 'Unknown User'] }] },
          userEmail: { $ifNull: ['$user.email', null] },
          role: '$userRole',
          actionType: { $literal: 'attendance_time_out' },
          description: { $literal: 'Attendance time-out recorded' },
          timestamp: '$timeOut',
          source: { $literal: 'attendance' },
          ipAddress: { $literal: null },
          userAgent: { $literal: null },
        },
      },
    ];

    const adminActionMatch = {};
    if (role) {
      adminActionMatch.actorRole = role;
    }
    if (userId) {
      adminActionMatch.actorId = new mongoose.Types.ObjectId(userId);
    }
    if (start || end) {
      adminActionMatch.timestamp = {};
      if (start) {
        adminActionMatch.timestamp.$gte = start;
      }
      if (end) {
        adminActionMatch.timestamp.$lte = end;
      }
    }
    if (actionType !== 'all') {
      adminActionMatch.actionType = actionType;
    }

    const adminActionPipeline = [
      { $match: adminActionMatch },
      {
        $lookup: {
          from: 'users',
          localField: 'actorId',
          foreignField: '_id',
          as: 'actor',
        },
      },
      { $unwind: { path: '$actor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          actionId: '$_id',
          userId: '$actorId',
          userName: { $ifNull: ['$actor.name', '$actorName'] },
          userEmail: { $ifNull: ['$actor.email', '$actorEmail'] },
          role: '$actorRole',
          actionType: '$actionType',
          description: '$description',
          timestamp: '$timestamp',
          source: { $ifNull: ['$source', 'user_management'] },
          ipAddress: '$ipAddress',
          userAgent: '$userAgent',
        },
      },
    ];

    const actionPipelines = [];
    if (actionType === 'all' || actionType === 'login') {
      actionPipelines.push({ coll: LoginLog.collection.name, pipeline: loginPipeline });
    }
    if (actionType === 'all' || actionType === 'logout') {
      actionPipelines.push({ coll: LoginLog.collection.name, pipeline: logoutPipeline });
    }
    if (actionType === 'all' || actionType === 'attendance_time_in') {
      actionPipelines.push({ coll: AttendanceLog.collection.name, pipeline: attendanceInPipeline });
    }
    if (actionType === 'all' || actionType === 'attendance_time_out') {
      actionPipelines.push({ coll: AttendanceLog.collection.name, pipeline: attendanceOutPipeline });
    }
    if (
      actionType === 'all' ||
      actionType === 'user_created' ||
      actionType === 'user_updated' ||
      actionType === 'user_deleted' ||
      actionType === 'admin_updated' ||
      actionType === 'admin_suspended' ||
      actionType === 'admin_activated' ||
      actionType === 'admin_deleted'
    ) {
      actionPipelines.push({ coll: AdminActionLog.collection.name, pipeline: adminActionPipeline });
    }

    if (actionPipelines.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: parsedPage,
        pages: 0,
        data: [],
      });
    }

    const [primary, ...others] = actionPipelines;
    const unionPipeline = [
      ...primary.pipeline,
      ...others.map((item) => ({
        $unionWith: {
          coll: item.coll,
          pipeline: item.pipeline,
        },
      })),
    ];

    const countPipeline = [
      ...unionPipeline,
      { $count: 'total' },
    ];

    const totalResult = await LoginLog.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    const skip = (parsedPage - 1) * parsedLimit;
    const dataPipeline = [
      ...unionPipeline,
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: parsedLimit },
    ];

    const data = await LoginLog.aggregate(dataPipeline);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
