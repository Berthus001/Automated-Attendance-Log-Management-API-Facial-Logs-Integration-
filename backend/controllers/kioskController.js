const User = require('../models/User.model');
const AttendanceLog = require('../models/AttendanceLog.model');
const { processBase64Image } = require('../utils/imageProcessor');
const { extractFaceDescriptorFromBase64, compareFaces } = require('../utils/faceDetection');
const smsService = require('../utils/smsService');

const KIOSK_MATCH_THRESHOLD = 0.45;

// @desc    Get all enrolled users (students/teachers) with face descriptors for kiosk matching
// @route   GET /api/kiosk/descriptors
// @access  Public (kiosk device only – no sensitive auth data is returned)
exports.getKioskDescriptors = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['student', 'teacher'] },
      isActive: true,
      faceDescriptor: { $exists: true, $not: { $size: 0 } },
    }).select('_id name role department phoneNumber faceDescriptor createdBy');

    const descriptors = users.map((u) => ({
      _id: u._id,
      name: u.name,
      role: u.role,
      department: u.department || '',
      phoneNumber: u.phoneNumber || '',
      faceDescriptor: u.faceDescriptor,
      createdBy: u.createdBy || null,
    }));

    return res.status(200).json({
      success: true,
      count: descriptors.length,
      data: descriptors,
    });
  } catch (error) {
    console.error('getKioskDescriptors error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record attendance from kiosk after client-side face match
// @route   POST /api/kiosk/attendance
// @access  Public (kiosk device – validated by userId existence)
exports.recordKioskAttendance = async (req, res) => {
  try {
    const { userId, image, confidenceScore } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: 'image is required for attendance verification' });
    }

    // Validate user exists first so role rejection can be explicit.
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    if (user.role !== 'student' && user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not allowed for attendance',
      });
    }

    if (!Array.isArray(user.faceDescriptor) || user.faceDescriptor.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No enrolled face descriptor found for this user',
      });
    }

    // Server-side re-verification prevents incorrect/fallback client-side matches.
    const faceResult = await extractFaceDescriptorFromBase64(image);
    if (!faceResult.success) {
      return res.status(400).json({
        success: false,
        message: faceResult.message,
        error: faceResult.error,
        faceCount: faceResult.faceCount,
      });
    }

    const comparison = compareFaces(user.faceDescriptor, faceResult.descriptor, KIOSK_MATCH_THRESHOLD);
    if (!comparison.isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Face not recognized. No matching user found.',
        confidence: {
          distance: comparison.distance,
          threshold: KIOSK_MATCH_THRESHOLD,
        },
      });
    }

    const now = new Date();

    // Today's date range
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const openAttendance = await AttendanceLog.findOne({
      userId: user._id,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
      scanCount: 1,
    }).sort({ timestamp: -1 });

    // ── SECOND SCAN (time-out of an open attendance record) ─────────────────
    if (openAttendance) {
      openAttendance.timeOut = now;
      openAttendance.scanCount = 2;
      await openAttendance.save();

      // Send time-out SMS if phone number exists
      if (user.phoneNumber) {
        await smsService.sendTimeOutSMS(user.phoneNumber, user.name, openAttendance.timeOut);
      }

      return res.status(200).json({
        success: true,
        scanType: 'time-out',
        message: `Time Out recorded for ${user.name}`,
        data: {
          userId: user._id,
          name: user.name,
          role: user.role,
          department: user.department || '',
          timeIn: openAttendance.timeIn,
          timeOut: openAttendance.timeOut,
          timestamp: openAttendance.timestamp,
        },
      });
    }

    // ── FIRST SCAN (time-in) ────────────────────────────────────────────────
    // Save attendance image if provided
    let imagePath = null;
    if (image) {
      try {
        const imageResult = await processBase64Image(image, {
          maxWidth: 300,
          quality: 70,
          format: 'jpeg',
          subfolder: 'attendance',
        });
        imagePath = imageResult.filePath;
      } catch (imgErr) {
        console.error('Failed to save attendance image:', imgErr.message);
      }
    }

    const attendanceLog = await AttendanceLog.create({
      userId: user._id,
      userRole: user.role,
      userName: user.name,
      timestamp: now,
      timeIn: now,
      timeOut: null,
      scanCount: 1,
      imagePath,
      confidenceScore: typeof confidenceScore === 'number' ? confidenceScore : null,
      status: 'present',
      deviceId: req.body.deviceId || 'kiosk',
      location: req.body.location || undefined,
      createdBy: user.createdBy || null,
    });

    // Send time-in SMS if phone number exists
    if (user.phoneNumber) {
      await smsService.sendTimeInSMS(user.phoneNumber, user.name, attendanceLog.timeIn);
    }

    return res.status(201).json({
      success: true,
      scanType: 'time-in',
      message: `Time In recorded for ${user.name}`,
      data: {
        userId: user._id,
        name: user.name,
        role: user.role,
        department: user.department || '',
        timeIn: attendanceLog.timeIn,
        timeOut: null,
        timestamp: attendanceLog.timestamp,
      },
    });
  } catch (error) {
    console.error('recordKioskAttendance error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
