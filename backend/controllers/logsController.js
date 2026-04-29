const { AttendanceLog } = require('../models');

/**
 * Get attendance logs with filtering and pagination
 * @route   GET /api/v1/logs
 * @access  Public
 */
exports.getAttendanceLogs = async (req, res) => {
  try {
    const {
      studentId,
      course,
      startDate,
      endDate,
      status,
      deviceId,
      page = 1,
      limit = 20,
    } = req.query;

    // Build dynamic query
    const query = {};

    // Filter by studentId
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
 * @route   GET /api/v1/logs/summary
 * @access  Public
 */
exports.getLogsSummary = async (req, res) => {
  try {
    const { startDate, endDate, course } = req.query;

    // Build query for date range
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

    const uniqueStudents = await AttendanceLog.distinct('studentId', query);

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
        uniqueStudents: uniqueStudents.length,
        statusBreakdown,
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
