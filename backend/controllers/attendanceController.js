const AttendanceLog = require('../models/AttendanceLog.model');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Get attendance list for dashboard view.
 *
 * @route   GET /api/attendance
 * @access  Private (Admin, SuperAdmin)
 */
exports.getAttendance = async (req, res) => {
  try {
    const { role, date, startDate, endDate, student, course, page = '1', limit = '20' } = req.query;

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

    // Handle date filtering - support both single date and date range
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
    } else if (startDate || endDate) {
      // Date range filtering
      query.timestamp = {};

      if (startDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate format. Use YYYY-MM-DD.',
          });
        }

        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate value. Use a valid calendar date in YYYY-MM-DD format.',
          });
        }

        start.setHours(0, 0, 0, 0);
        query.timestamp.$gte = start;
      }

      if (endDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate format. Use YYYY-MM-DD.',
          });
        }

        const end = new Date(endDate);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate value. Use a valid calendar date in YYYY-MM-DD format.',
          });
        }

        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    if (student && typeof student === 'string' && student.trim()) {
      const studentPattern = new RegExp(escapeRegex(student.trim()), 'i');
      query.userName = studentPattern;
    }

    if (course && typeof course === 'string' && course.trim()) {
      query.course = new RegExp(escapeRegex(course.trim()), 'i');
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
          timeZone: 'Asia/Manila',
        }),
        time: timeIn.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila',
        }),
        timeInFormatted: timeIn.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila',
        }),
        timeOutFormatted: timeOut
          ? timeOut.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Manila',
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

/**
 * Export attendance data to PDF report
 *
 * @route   GET /api/attendance/export-pdf
 * @access  Private (Admin, SuperAdmin)
 */
exports.exportAttendanceToPDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const { role, date, startDate, endDate, student, course } = req.query;

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

    // Handle date filtering
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
          message: 'Invalid date value.',
        });
      }

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
      startOfDay.setHours(0, 0, 0, 0);

      query.timestamp = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    } else if (startDate || endDate) {
      query.timestamp = {};

      if (startDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate format. Use YYYY-MM-DD.',
          });
        }

        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate value.',
          });
        }

        start.setHours(0, 0, 0, 0);
        query.timestamp.$gte = start;
      }

      if (endDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate format. Use YYYY-MM-DD.',
          });
        }

        const end = new Date(endDate);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate value.',
          });
        }

        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    if (student && typeof student === 'string' && student.trim()) {
      const studentPattern = new RegExp(student.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.userName = studentPattern;
    }

    if (course && typeof course === 'string' && course.trim()) {
      query.course = new RegExp(course.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    const logs = await AttendanceLog.find(query)
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .limit(1000); // Limit to prevent too large PDFs

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    // Add filters info
    doc.fontSize(10);
    if (startDate || endDate) {
      doc.text(`Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`);
    } else if (date) {
      doc.text(`Date: ${date}`);
    }
    if (role) doc.text(`Role: ${role}`);
    if (student) doc.text(`Student: ${student}`);
    if (course) doc.text(`Course: ${course}`);
    doc.text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })}`);
    doc.text(`Total Records: ${logs.length}`);
    doc.moveDown();

    // Add table header
    const tableTop = doc.y;
    const colWidths = {
      name: 120,
      role: 60,
      date: 90,
      timeIn: 70,
      timeOut: 70,
      scans: 40,
    };

    doc.fontSize(9).font('Helvetica-Bold');
    let x = 50;
    doc.text('Name', x, tableTop, { width: colWidths.name, continued: false });
    x += colWidths.name;
    doc.text('Role', x, tableTop, { width: colWidths.role, continued: false });
    x += colWidths.role;
    doc.text('Date', x, tableTop, { width: colWidths.date, continued: false });
    x += colWidths.date;
    doc.text('Time In', x, tableTop, { width: colWidths.timeIn, continued: false });
    x += colWidths.timeIn;
    doc.text('Time Out', x, tableTop, { width: colWidths.timeOut, continued: false });
    x += colWidths.timeOut;
    doc.text('Scans', x, tableTop, { width: colWidths.scans, continued: false });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Add table rows
    doc.font('Helvetica').fontSize(8);
    for (const log of logs) {
      const timestamp = new Date(log.timestamp);
      const timeIn = log.timeIn ? new Date(log.timeIn) : timestamp;
      const timeOut = log.timeOut ? new Date(log.timeOut) : null;

      const dateStr = timeIn.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Manila',
      });

      const timeInStr = timeIn.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila',
      });

      const timeOutStr = timeOut
        ? timeOut.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Manila',
          })
        : '-';

      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        doc.moveDown();
      }

      const rowY = doc.y;
      let xPos = 50;

      doc.text(log.userName || 'Unknown', xPos, rowY, { width: colWidths.name, continued: false });
      xPos += colWidths.name;
      doc.text(log.userRole || '-', xPos, rowY, { width: colWidths.role, continued: false });
      xPos += colWidths.role;
      doc.text(dateStr, xPos, rowY, { width: colWidths.date, continued: false });
      xPos += colWidths.date;
      doc.text(timeInStr, xPos, rowY, { width: colWidths.timeIn, continued: false });
      xPos += colWidths.timeIn;
      doc.text(timeOutStr, xPos, rowY, { width: colWidths.timeOut, continued: false });
      xPos += colWidths.timeOut;
      doc.text(String(log.scanCount || 1), xPos, rowY, { width: colWidths.scans, continued: false });

      doc.moveDown(0.8);
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};
