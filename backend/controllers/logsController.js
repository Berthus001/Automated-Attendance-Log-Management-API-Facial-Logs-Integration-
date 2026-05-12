const { AttendanceLog } = require('../models');
const User = require('../models/User.model');

/**
 * Get attendance logs with filtering and pagination
 * Role-based access:
 * - SuperAdmin: See ALL logs
 * - Admin: See ONLY logs for users they created
 * - Student/Teacher: Not allowed (use /api/logs/my-attendance)
 * 
 * @route   GET /api/logs
 * @access  Private (SuperAdmin, Admin)
 */
exports.getAttendanceLogs = async (req, res) => {
  try {
    const {
      userId,
      studentId,
      userRole,
      course,
      startDate,
      endDate,
      status,
      deviceId,
      page = 1,
      limit = 20,
    } = req.query;

    // Build dynamic query
    let query = {};

    // Role-based filtering
    if (req.user.role === 'admin') {
      // Admin can ONLY see attendance logs for users they created
      const createdUsers = await User.find({ createdBy: req.user._id }).select('_id');
      const userIds = createdUsers.map(user => user._id);
      
      if (userIds.length === 0) {
        // Admin hasn't created any users yet
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          data: [],
          message: 'No users created yet. Create students or teachers to see their attendance.',
        });
      }
      
      query.userId = { $in: userIds };
    }
    // SuperAdmin can see ALL logs (no filter applied)

    // Filter by userId
    if (userId) {
      query.userId = userId;
    }

    // Filter by userRole
    if (userRole) {
      const validRoles = ['student', 'teacher', 'admin'];
      if (validRoles.includes(userRole)) {
        query.userRole = userRole;
      }
    }

    // Filter by legacy studentId (backward compatibility)
    if (studentId) {
      query.studentId = studentId.toUpperCase();
    }

    // Filter by course
    if (course) {
      query.course = course;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by deviceId
    if (deviceId) {
      query.deviceId = deviceId;
    }

    // Date range filtering using $gte and $lte
    if (startDate || endDate) {
      query.timestamp = {};

      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }

      if (endDate) {
        // Include the entire end date by setting time to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDateTime;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination and sorting
    const logs = await AttendanceLog.find(query)
      .populate('userId', 'name email role department')
      .populate('createdBy', 'name email role')
      .sort({ timestamp: -1 }) // Sort by newest first
      .limit(limitNum)
      .skip(skip)
      .select('-__v'); // Exclude version field

    // Get total count for pagination
    const total = await AttendanceLog.countDocuments(query);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data: logs,
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get single attendance log by ID
 * @route   GET /api/v1/logs/:id
 * @access  Public
 */
exports.getAttendanceLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AttendanceLog.findById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found',
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get logs summary/statistics
 * Role-based: SuperAdmin sees all, Admin sees only their users
 * 
 * @route   GET /api/logs/summary
 * @access  Private (SuperAdmin, Admin)
 */
exports.getLogsSummary = async (req, res) => {
  try {
    const { startDate, endDate, course } = req.query;

    // Build query for date range
    let query = {};

    // Role-based filtering
    if (req.user.role === 'admin') {
      const createdUsers = await User.find({ createdBy: req.user._id }).select('_id');
      const userIds = createdUsers.map(user => user._id);
      query.userId = { $in: userIds };
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDateTime;
      }
    }

    if (course) {
      query.course = course;
    }

    // Get aggregated statistics
    const totalLogs = await AttendanceLog.countDocuments(query);

    const statusCounts = await AttendanceLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const courseCounts = await AttendanceLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Count by role
    const roleCounts = await AttendanceLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userRole',
          count: { $sum: 1 },
        },
      },
    ]);

    const uniqueUsers = await AttendanceLog.distinct('userId', query);

    // Format status counts
    const statusBreakdown = {
      present: 0,
      late: 0,
      absent: 0,
    };

    statusCounts.forEach(item => {
      if (item._id) {
        statusBreakdown[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        uniqueUsers: uniqueUsers.length,
        statusBreakdown,
        roleBreakdown: roleCounts,
        courseBreakdown: courseCounts,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete attendance log
 * @route   DELETE /api/v1/logs/:id
 * @access  Public
 */
exports.deleteAttendanceLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AttendanceLog.findByIdAndDelete(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Attendance log not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance log deleted successfully',
      data: log,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get logs grouped by date
 * @route   GET /api/v1/logs/by-date
 * @access  Public
 */
exports.getLogsByDate = async (req, res) => {
  try {
    const { startDate, endDate, course } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDateTime;
      }
    }

    if (course) {
      query.course = course;
    }

    const logsByDate = await AttendanceLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
          students: { $addToSet: '$studentId' },
        },
      },
      { $sort: { _id: -1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          uniqueStudents: { $size: '$students' },
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: logsByDate.length,
      data: logsByDate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Log attendance for current user (Student/Teacher self-service)
 * @route   POST /api/logs/log-attendance
 * @access  Private (Student, Teacher, Admin)
 */
exports.logMyAttendance = async (req, res) => {
  try {
    const { course, status = 'present', deviceId, imagePath, confidenceScore, location } = req.body;

    // Get user's createdBy field for filtering
    const user = await User.findById(req.user._id);

    // Note: Removed duplicate attendance check to allow multiple time in/time out per day
    // Users can now log attendance multiple times throughout the day

    // Create attendance log
    const attendanceLog = await AttendanceLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      userName: user.name,
      studentId: req.user.studentId || null, // Legacy support
      course: course || 'General',
      timestamp: new Date(),
      imagePath: imagePath || null,
      deviceId: deviceId || null,
      status: status,
      confidenceScore: confidenceScore || null,
      location: location || null,
      createdBy: user.createdBy || null, // Track who created this user (for admin filtering)
    });

    // Populate user details
    await attendanceLog.populate('userId', 'name email role department');

    res.status(201).json({
      success: true,
      message: 'Attendance logged successfully',
      data: attendanceLog,
    });
  } catch (error) {
    console.error('Log attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get current user's attendance history
 * @route   GET /api/logs/my-attendance
 * @access  Private (All authenticated users)
 */
exports.getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = { userId: req.user._id };

    // Date range filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDateTime;
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get logs
    const logs = await AttendanceLog.find(query)
      .populate('userId', 'name email role department')
      .sort({ timestamp: -1 })
      .limit(limitNum)
      .skip(skip)
      .select('-__v');

    // Get total count
    const total = await AttendanceLog.countDocuments(query);

    // Calculate pagination
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      data: logs,
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
