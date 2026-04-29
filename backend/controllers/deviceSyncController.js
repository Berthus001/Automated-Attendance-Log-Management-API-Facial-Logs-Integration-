const Student = require('../models/Student.model');
const AttendanceLog = require('../models/AttendanceLog.model');
const { processBase64Image } = require('../utils/imageProcessor');

/**
 * Sync attendance log from device
 * POST /api/v1/device-sync
 */
exports.syncAttendanceLog = async (req, res) => {
  try {
    const { studentId, timestamp, deviceId, image } = req.body;

    // Validate required fields
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required'
      });
    }

    if (!timestamp) {
      return res.status(400).json({
        success: false,
        message: 'timestamp is required'
      });
    }

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      });
    }

    // Validate timestamp format
    const parsedTimestamp = new Date(timestamp);
    if (isNaN(parsedTimestamp.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timestamp format. Use ISO 8601 format (e.g., 2026-04-23T14:30:00Z)'
      });
    }

    // Verify student exists
    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase(),
      isActive: true 
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId.toUpperCase()} not found or inactive`
      });
    }

    // Process image if provided
    let imagePath = null;
    if (image) {
      try {
        const imageResult = await processBase64Image(image, {
          folder: 'attendance',
          maxWidth: 300,
          quality: 70
        });
        imagePath = imageResult.filePath;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image format or processing failed',
          error: error.message
        });
      }
    }

    // Check for duplicate log (same student, device, within 1 minute)
    const oneMinuteBefore = new Date(parsedTimestamp.getTime() - 60000);
    const oneMinuteAfter = new Date(parsedTimestamp.getTime() + 60000);
    
    const existingLog = await AttendanceLog.findOne({
      studentId: student.studentId,
      deviceId: deviceId,
      timestamp: {
        $gte: oneMinuteBefore,
        $lte: oneMinuteAfter
      }
    });

    if (existingLog) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate attendance log detected within 1-minute window',
        existingLog: {
          id: existingLog._id,
          timestamp: existingLog.timestamp,
          deviceId: existingLog.deviceId
        }
      });
    }

    // Create attendance log
    const attendanceLog = await AttendanceLog.create({
      studentId: student.studentId,
      course: student.course,
      timestamp: parsedTimestamp,
      imagePath: imagePath,
      deviceId: deviceId,
      status: 'present',
      confidenceScore: null // Device-synced logs don't have confidence score
    });

    res.status(201).json({
      success: true,
      message: 'Attendance log synced successfully',
      data: {
        logId: attendanceLog._id,
        student: {
          studentId: student.studentId,
          name: student.name,
          course: student.course
        },
        attendance: {
          timestamp: attendanceLog.timestamp,
          deviceId: attendanceLog.deviceId,
          status: attendanceLog.status,
          imagePath: attendanceLog.imagePath
        }
      }
    });

  } catch (error) {
    console.error('Device sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing attendance log',
      error: error.message
    });
  }
};

/**
 * Bulk sync multiple attendance logs
 * POST /api/v1/device-sync/bulk
 */
exports.bulkSyncAttendanceLogs = async (req, res) => {
  try {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        message: 'logs array is required'
      });
    }

    if (logs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'logs array cannot be empty'
      });
    }

    if (logs.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 logs per bulk sync request'
      });
    }

    const results = {
      success: [],
      failed: [],
      duplicate: []
    };

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      try {
        // Validate required fields
        if (!log.studentId || !log.timestamp || !log.deviceId) {
          results.failed.push({
            index: i,
            log: log,
            reason: 'Missing required fields (studentId, timestamp, or deviceId)'
          });
          continue;
        }

        // Validate timestamp
        const parsedTimestamp = new Date(log.timestamp);
        if (isNaN(parsedTimestamp.getTime())) {
          results.failed.push({
            index: i,
            log: log,
            reason: 'Invalid timestamp format'
          });
          continue;
        }

        // Verify student exists
        const student = await Student.findOne({ 
          studentId: log.studentId.toUpperCase(),
          isActive: true 
        });

        if (!student) {
          results.failed.push({
            index: i,
            log: log,
            reason: `Student ${log.studentId.toUpperCase()} not found or inactive`
          });
          continue;
        }

        // Process image if provided
        let imagePath = null;
        if (log.image) {
          try {
            const imageResult = await processBase64Image(log.image, {
              folder: 'attendance',
              maxWidth: 300,
              quality: 70
            });
            imagePath = imageResult.filePath;
          } catch (error) {
            results.failed.push({
              index: i,
              log: log,
              reason: 'Image processing failed'
            });
            continue;
          }
        }

        // Check for duplicate
        const oneMinuteBefore = new Date(parsedTimestamp.getTime() - 60000);
        const oneMinuteAfter = new Date(parsedTimestamp.getTime() + 60000);
        
        const existingLog = await AttendanceLog.findOne({
          studentId: student.studentId,
          deviceId: log.deviceId,
          timestamp: {
            $gte: oneMinuteBefore,
            $lte: oneMinuteAfter
          }
        });

        if (existingLog) {
          results.duplicate.push({
            index: i,
            log: log,
            existingLogId: existingLog._id
          });
          continue;
        }

        // Create attendance log
        const attendanceLog = await AttendanceLog.create({
          studentId: student.studentId,
          course: student.course,
          timestamp: parsedTimestamp,
          imagePath: imagePath,
          deviceId: log.deviceId,
          status: log.status || 'present',
          confidenceScore: log.confidenceScore || null
        });

        results.success.push({
          index: i,
          logId: attendanceLog._id,
          studentId: student.studentId,
          timestamp: attendanceLog.timestamp
        });

      } catch (error) {
        results.failed.push({
          index: i,
          log: log,
          reason: error.message
        });
      }
    }

    const statusCode = results.success.length > 0 ? 201 : 400;

    res.status(statusCode).json({
      success: results.success.length > 0,
      message: `Processed ${logs.length} logs: ${results.success.length} success, ${results.failed.length} failed, ${results.duplicate.length} duplicates`,
      summary: {
        total: logs.length,
        success: results.success.length,
        failed: results.failed.length,
        duplicate: results.duplicate.length
      },
      results: results
    });

  } catch (error) {
    console.error('Bulk sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk sync',
      error: error.message
    });
  }
};
