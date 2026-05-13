const { Student, AttendanceLog } = require('../models');
const { processBase64Image } = require('../utils/imageProcessor');
const { extractFaceDescriptorFromBase64, compareFaceDescriptors } = require('../utils/faceDetection');
const { isValidBase64Image } = require('../utils/imageHelpers');
const smsService = require('../utils/smsService');

/**
 * Face login for attendance logging
 * @route   POST /api/v1/face-login
 * @access  Public
 */
exports.faceLogin = async (req, res) => {
  try {
    const { image, deviceId, location } = req.body;

    // Validate base64 image
    if (!image || !isValidBase64Image(image)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid base64 image',
      });
    }

    // Extract face descriptor from image
    const faceResult = await extractFaceDescriptorFromBase64(image);

    // Validate face detection
    if (!faceResult.success) {
      return res.status(400).json({
        success: false,
        message: faceResult.message,
        error: faceResult.error,
        faceCount: faceResult.faceCount,
      });
    }

    // Get all active students
    const students = await Student.find({ isActive: true }).select('studentId name course faceDescriptor phoneNumber');

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No enrolled students found in the system',
      });
    }

    // Find best match with optimization
    let bestMatch = null;
    let lowestDistance = Infinity;
    const matchThreshold = 0.6;
    const strongMatchThreshold = 0.4; // Stop early if very strong match

    for (const student of students) {
      const distance = compareFaceDescriptors(
        faceResult.descriptor,
        student.faceDescriptor
      );

      // Update best match if this is closer
      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestMatch = student;

        // Early termination for very strong matches
        if (distance < strongMatchThreshold) {
          console.log(`Strong match found for ${student.studentId} with distance ${distance.toFixed(4)}`);
          break;
        }
      }
    }

    // Check if best match is within threshold
    if (lowestDistance >= matchThreshold) {
      return res.status(401).json({
        success: false,
        message: 'Face not recognized. Please enroll first.',
        error: 'FACE_NOT_RECOGNIZED',
        confidence: (1 - lowestDistance).toFixed(4),
        threshold: matchThreshold,
      });
    }

    // Process and save attendance image
    const imageResult = await processBase64Image(image, {
      maxWidth: 300,
      quality: 70,
      format: 'jpeg',
      subfolder: 'attendance',
    });

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    let attendanceLog = await AttendanceLog.findOne({
      studentId: bestMatch.studentId,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    });

    let scanType;
    if (attendanceLog && attendanceLog.scanCount === 1) {
      attendanceLog.timeOut = now;
      attendanceLog.scanCount = 2;
      attendanceLog.imagePath = imageResult.filePath || attendanceLog.imagePath;
      attendanceLog = await attendanceLog.save();
      scanType = 'time-out';

      if (bestMatch.phoneNumber) {
        await smsService.sendTimeOutSMS(bestMatch.phoneNumber, bestMatch.name, attendanceLog.timeOut);
      }
    } else if (attendanceLog && attendanceLog.scanCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already completed for today',
        data: {
          studentId: bestMatch.studentId,
          name: bestMatch.name,
          course: bestMatch.course,
          timeIn: attendanceLog.timeIn,
          timeOut: attendanceLog.timeOut,
        },
      });
    } else {
      attendanceLog = await AttendanceLog.create({
        userId: bestMatch._id,
        userRole: 'student',
        userName: bestMatch.name,
        studentId: bestMatch.studentId,
        course: bestMatch.course,
        timestamp: now,
        timeIn: now,
        timeOut: null,
        scanCount: 1,
        imagePath: imageResult.filePath,
        deviceId: deviceId || null,
        confidenceScore: 1 - lowestDistance,
        status: 'present',
        location: location || undefined,
        synced: !global.isOfflineMode,
        origin: global.isOfflineMode ? 'local' : 'cloud',
      });
      scanType = 'time-in';

      if (bestMatch.phoneNumber) {
        await smsService.sendTimeInSMS(bestMatch.phoneNumber, bestMatch.name, attendanceLog.timeIn);
      }
    }

    // Return success with matched student and attendance log
    res.status(200).json({
      success: true,
      message: scanType === 'time-out' ? 'Time Out recorded successfully' : 'Time In recorded successfully',
      data: {
        student: {
          studentId: bestMatch.studentId,
          name: bestMatch.name,
          course: bestMatch.course,
        },
        attendance: {
          id: attendanceLog._id,
          timestamp: attendanceLog.timestamp,
          timeIn: attendanceLog.timeIn,
          timeOut: attendanceLog.timeOut,
          status: attendanceLog.status,
          imagePath: attendanceLog.imagePath,
          deviceId: attendanceLog.deviceId,
          scanCount: attendanceLog.scanCount,
        },
        scanType,
        match: {
          confidence: (1 - lowestDistance).toFixed(4),
          distance: lowestDistance.toFixed(4),
          threshold: matchThreshold,
        },
        faceDetection: {
          confidence: faceResult.confidence,
          boundingBox: faceResult.boundingBox,
        },
      },
    });
  } catch (error) {
    console.error('Face login error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify face without logging attendance (for testing)
 * @route   POST /api/v1/face-login/verify
 * @access  Public
 */
exports.verifyFace = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || !isValidBase64Image(image)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid base64 image',
      });
    }

    // Extract face descriptor
    const faceResult = await extractFaceDescriptorFromBase64(image);

    if (!faceResult.success) {
      return res.status(400).json({
        success: false,
        message: faceResult.message,
        error: faceResult.error,
        faceCount: faceResult.faceCount,
      });
    }

    // Get all active students
    const students = await Student.find({ isActive: true }).select('studentId name course faceDescriptor');

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No enrolled students found',
      });
    }

    // Find best match
    let bestMatch = null;
    let lowestDistance = Infinity;
    const matchThreshold = 0.6;

    for (const student of students) {
      const distance = compareFaceDescriptors(
        faceResult.descriptor,
        student.faceDescriptor
      );

      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestMatch = student;

        // Early termination
        if (distance < 0.4) break;
      }
    }

    // Return verification result
    if (lowestDistance < matchThreshold) {
      res.status(200).json({
        success: true,
        message: 'Face recognized',
        data: {
          student: {
            studentId: bestMatch.studentId,
            name: bestMatch.name,
            course: bestMatch.course,
          },
          match: {
            confidence: (1 - lowestDistance).toFixed(4),
            distance: lowestDistance.toFixed(4),
            threshold: matchThreshold,
            recognized: true,
          },
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Face not recognized',
        error: 'FACE_NOT_RECOGNIZED',
        data: {
          match: {
            confidence: (1 - lowestDistance).toFixed(4),
            distance: lowestDistance.toFixed(4),
            threshold: matchThreshold,
            recognized: false,
          },
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get attendance statistics for a student
 * @route   GET /api/v1/face-login/stats/:studentId
 * @access  Public
 */
exports.getAttendanceStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Build query
    const query = { studentId: studentId.toUpperCase() };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get attendance logs
    const logs = await AttendanceLog.find(query).sort({ timestamp: -1 });

    // Calculate statistics
    const totalAttendance = logs.length;
    const presentCount = logs.filter(log => log.status === 'present').length;
    const lateCount = logs.filter(log => log.status === 'late').length;

    // Get student info
    const student = await Student.findOne({ studentId: studentId.toUpperCase() })
      .select('-faceDescriptor');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          studentId: student.studentId,
          name: student.name,
          course: student.course,
        },
        statistics: {
          totalAttendance,
          presentCount,
          lateCount,
          attendanceRate: totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(2) : '0.00',
        },
        recentLogs: logs.slice(0, 10),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
