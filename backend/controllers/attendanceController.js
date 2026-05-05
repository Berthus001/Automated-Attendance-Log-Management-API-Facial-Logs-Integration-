const AttendanceLog = require('../models/AttendanceLog.model');

/**
 * Get attendance list for dashboard view.
 *
 * @route   GET /api/attendance
 * @access  Private (Admin, SuperAdmin)
 */
exports.getAttendance = async (req, res) => {
  try {
    const { role, date, page = '1', limit = '20' } = req.query;

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

    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};

    if (req.user.role === 'admin') {
      query.createdBy = req.user.id;
    }

    if (role && !['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role filter. Allowed values are student or teacher.',
      });
    }

    if (role && ['student', 'teacher'].includes(role)) {
      query.userRole = role;
    } else {
      query.userRole = { $in: ['student', 'teacher'] };
    }

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD.',
        });
      }

      const startOfDay = new Date(date);
      if (Number.isNaN(startOfDay.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date value. Use a valid calendar date in YYYY-MM-DD format.',
        });
      }

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
      startOfDay.setHours(0, 0, 0, 0);

      query.timestamp = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const total = await AttendanceLog.countDocuments(query);

    const logs = await AttendanceLog.find(query)
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const formatted = logs.map((log) => {
      const timestamp = new Date(log.timestamp);
      const timeIn = log.timeIn ? new Date(log.timeIn) : timestamp;
      const timeOut = log.timeOut ? new Date(log.timeOut) : null;
      return {
        id: log._id,
        userId: log.userId?._id || log.userId,
        name: log.userName || log.userId?.name || 'Unknown User',
        role: log.userRole,
        createdBy: log.createdBy || null,
        scanCount: log.scanCount || 1,
        timestamp,
        timeIn,
        timeOut,
        date: timeIn.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: timeIn.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        timeInFormatted: timeIn.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        timeOutFormatted: timeOut
          ? timeOut.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          : null,
      };
    });

    const pages = total === 0 ? 0 : Math.ceil(total / parsedLimit);

    return res.status(200).json({
      success: true,
      data: formatted,
      total,
      page: parsedPage,
      pages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
