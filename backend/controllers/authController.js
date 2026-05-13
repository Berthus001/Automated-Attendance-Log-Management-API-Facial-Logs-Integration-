const User = require('../models/User.model');
const Student = require('../models/Student.model');
const LoginLog = require('../models/LoginLog.model');
const AttendanceLog = require('../models/AttendanceLog.model');
const jwt = require('jsonwebtoken');
const {
  extractFaceDescriptorFromBase64,
  compareFaces,
  getFaceDuplicateThreshold,
} = require('../utils/faceDetection');
const { processBase64Image } = require('../utils/imageProcessor');

// @desc    Login user (superadmin/admin only)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is superadmin or admin
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This login is for administrators only',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check for force login parameter
    const forceLogin = req.body.forceLogin === true;

    // Check if user is already logged in
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours (1 day) in milliseconds
    const now = new Date();
    
    if (user.isLoggedIn && !forceLogin) {
      // Check if last login was more than 24 hours ago (stale session)
      if (user.lastLoginAt && (now - new Date(user.lastLoginAt)) > SESSION_TIMEOUT) {
        // Session is stale, allow re-login
        user.isLoggedIn = false;
      } else {
        // Active session exists
        return res.status(409).json({
          success: false,
          message: 'User already logged in from another session',
        });
      }
    }

    // If forceLogin is true, clear previous session
    if (forceLogin && user.isLoggedIn) {
      user.isLoggedIn = false;
    }

    // Update login state
    user.isLoggedIn = true;
    user.lastLoginAt = now;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: process.env.JWT_EXPIRE || '7d',
      }
    );

    // Log the login
    try {
      await LoginLog.create({
        userId: user._id,
        role: user.role,
        loginTime: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      });
    } catch (logError) {
      console.error('Failed to create login log:', logError.message);
      // Don't fail the login if logging fails
    }

    // Return success response with token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasFaceEnrolled: Array.isArray(user.faceDescriptor) && user.faceDescriptor.length > 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Enroll or update current user's face descriptor
// @route   POST /api/auth/enroll-face
// @access  Private
exports.enrollFace = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a base64 image for face enrollment',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let faceResult;
    try {
      faceResult = await extractFaceDescriptorFromBase64(image);

      if (!faceResult.success) {
        return res.status(400).json({
          success: false,
          message: faceResult.message,
          error: faceResult.error,
          faceCount: faceResult.faceCount,
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract face descriptor from image',
        error: error.message,
      });
    }

    // Enforce face uniqueness across all other user/student profiles
    const duplicateFaceThreshold = getFaceDuplicateThreshold();

    const otherUsers = await User.find({
      _id: { $ne: user._id },
      faceDescriptor: { $exists: true, $ne: [] },
    }).select('_id role faceDescriptor');

    for (const otherUser of otherUsers) {
      const comparison = compareFaces(otherUser.faceDescriptor, faceResult.descriptor, duplicateFaceThreshold);
      if (comparison.isMatch) {
        return res.status(409).json({
          success: false,
          message: 'Face already registered',
          error: 'DUPLICATE_FACE',
          match: {
            existingUserId: otherUser._id,
            role: otherUser.role,
            distance: comparison.distance,
            threshold: duplicateFaceThreshold,
          },
        });
      }
    }

    const students = await Student.find({
      faceDescriptor: { $exists: true, $ne: [] },
    }).select('studentId faceDescriptor');

    for (const student of students) {
      const comparison = compareFaces(student.faceDescriptor, faceResult.descriptor, duplicateFaceThreshold);
      if (comparison.isMatch) {
        return res.status(409).json({
          success: false,
          message: 'Face already registered',
          error: 'DUPLICATE_FACE',
          match: {
            existingStudentId: student.studentId,
            distance: comparison.distance,
            threshold: duplicateFaceThreshold,
          },
        });
      }
    }

    user.faceDescriptor = faceResult.descriptor;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Face enrolled successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasFaceEnrolled: true,
      },
      faceDetection: {
        confidence: faceResult.confidence,
        boundingBox: faceResult.boundingBox,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasFaceEnrolled: Array.isArray(user.faceDescriptor) && user.faceDescriptor.length > 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify user face (Second-factor authentication)
// @route   POST /api/auth/face-verify
// @access  Private (requires JWT)
exports.faceVerify = async (req, res) => {
  try {
    const { image } = req.body;

    // Validate image input
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a base64 image for face verification',
      });
    }

    // Get logged-in user (set by protect middleware)
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has a face descriptor stored
    if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No face descriptor found for this user. Please enroll your face first.',
      });
    }

    // Extract face descriptor from provided image
    let capturedDescriptor;
    try {
      const faceResult = await extractFaceDescriptorFromBase64(image);

      if (!faceResult.success) {
        return res.status(400).json({
          success: false,
          message: faceResult.message,
          error: faceResult.error,
          faceCount: faceResult.faceCount,
        });
      }

      capturedDescriptor = faceResult.descriptor;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract face descriptor from image',
        error: error.message,
      });
    }

    // Compare captured face with stored face descriptor
    const storedDescriptor = user.faceDescriptor;
    const comparison = compareFaces(storedDescriptor, capturedDescriptor);

    // Check if faces match
    if (comparison.isMatch) {
      return res.status(200).json({
        success: true,
        message: 'Face verified successfully',
        verified: true,
        confidence: {
          distance: comparison.distance,
          threshold: 0.6,
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Face verification failed. Face does not match.',
        verified: false,
        confidence: {
          distance: comparison.distance,
          threshold: 0.6,
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

// @desc    Face-only login for students and teachers
// @route   POST /api/auth/face-login
// @access  Public
exports.faceLogin = async (req, res) => {
  try {
    const { image } = req.body;

    // Validate image input
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a base64 image for face login',
      });
    }

    // Extract face descriptor from provided image
    let capturedDescriptor;
    try {
      const faceResult = await extractFaceDescriptorFromBase64(image);

      if (!faceResult.success) {
        return res.status(400).json({
          success: false,
          message: faceResult.message,
          error: faceResult.error,
          faceCount: faceResult.faceCount,
        });
      }

      capturedDescriptor = faceResult.descriptor;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract face descriptor from image',
        error: error.message,
      });
    }

    // Get all active students and teachers with face descriptors
    const users = await User.find({
      role: { $in: ['student', 'teacher'] },
      isActive: true,
      faceDescriptor: { $exists: true, $ne: [] },
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No enrolled students or teachers found in the system',
      });
    }

    // Find best match by comparing with all users
    let bestMatch = null;
    let lowestDistance = Infinity;
    const matchThreshold = 0.6;
    const strongMatchThreshold = 0.4;

    for (const user of users) {
      const comparison = compareFaces(user.faceDescriptor, capturedDescriptor);
      
      if (comparison.distance < lowestDistance) {
        lowestDistance = comparison.distance;
        bestMatch = {
          user,
          distance: comparison.distance,
          isMatch: comparison.isMatch,
        };

        // Early exit if very strong match
        if (comparison.distance < strongMatchThreshold) {
          break;
        }
      }
    }

    // Check if best match is within threshold
    if (!bestMatch || !bestMatch.isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Face not recognized. No matching user found.',
        confidence: {
          distance: lowestDistance,
          threshold: matchThreshold,
        },
      });
    }

    // Verify the matched user is student or teacher
    const matchedUser = bestMatch.user;
    if (matchedUser.role !== 'student' && matchedUser.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Face login is only available for students and teachers',
      });
    }

    // Update login state for face login users
    const now = new Date();
    matchedUser.isLoggedIn = true;
    matchedUser.lastLoginAt = now;
    await matchedUser.save();

    // Log the login
    try {
      await LoginLog.create({
        userId: matchedUser._id,
        role: matchedUser.role,
        loginTime: now,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      });
    } catch (logError) {
      console.error('Failed to create login log:', logError.message);
      // Don't fail the login if logging fails
    }

    // Create or update attendance record for students and teachers
    let attendanceLogData = null;
    let scanType = null;

    if (existingAttendance && existingAttendance.scanCount === 1) {
      existingAttendance.timeOut = now;
      existingAttendance.scanCount = 2;
      existingAttendance.imagePath = existingAttendance.imagePath || null;
      await existingAttendance.save();

      attendanceLogData = {
        id: existingAttendance._id,
        timestamp: existingAttendance.timestamp,
        timeIn: existingAttendance.timeIn,
        timeOut: existingAttendance.timeOut,
        status: existingAttendance.status,
        alreadyLogged: false,
      };
      scanType = 'time-out';
      console.log(`Time out recorded for ${matchedUser.name} (${matchedUser.role})`);
    } else if (existingAttendance && existingAttendance.scanCount >= 2) {
      attendanceLogData = {
        id: existingAttendance._id,
        timestamp: existingAttendance.timestamp,
        timeIn: existingAttendance.timeIn,
        timeOut: existingAttendance.timeOut,
        status: existingAttendance.status,
        alreadyLogged: true,
      };
      scanType = 'completed';
      console.log(`Attendance already completed today for ${matchedUser.name} (${matchedUser.role})`);
    } else {
      // First scan of the day is time-in
      try {
        const imageResult = await processBase64Image(image, {
          maxWidth: 300,
          quality: 70,
          format: 'jpeg',
          subfolder: 'attendance',
        });

        const attendanceLog = await AttendanceLog.create({
          userId: matchedUser._id,
          userRole: matchedUser.role,
          userName: matchedUser.name,
          timestamp: now,
          timeIn: now,
          timeOut: null,
          scanCount: 1,
          imagePath: imageResult.filePath,
          deviceId: req.body.deviceId || null,
          confidenceScore: 1 - bestMatch.distance,
          status: 'present',
          location: req.body.location || undefined,
          createdBy: matchedUser.createdBy || null,
          synced: !global.isOfflineMode,
          origin: global.isOfflineMode ? 'local' : 'cloud',
        });

        attendanceLogData = {
          id: attendanceLog._id,
          timestamp: attendanceLog.timestamp,
          timeIn: attendanceLog.timeIn,
          timeOut: attendanceLog.timeOut,
          status: attendanceLog.status,
          alreadyLogged: false,
        };
        scanType = 'time-in';
        console.log(`Time in recorded for ${matchedUser.name} (${matchedUser.role})`);
      } catch (attendanceError) {
        console.error('Failed to create attendance log:', attendanceError.message);
        // Don't fail the login if attendance logging fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: matchedUser._id,
        email: matchedUser.email,
        role: matchedUser.role,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        expiresIn: process.env.JWT_EXPIRE || '7d',
      }
    );

    // Return success response with token
    const successMessage = alreadyLoggedToday 
      ? 'Face recognized. You have already logged attendance today.'
      : 'Face login successful. Attendance recorded.';

    res.status(200).json({
      success: true,
      message: successMessage,
      token,
      user: {
        id: matchedUser._id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
      },
      attendance: attendanceLogData,
      confidence: {
        distance: bestMatch.distance,
        threshold: matchThreshold,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Find user by ID from JWT token (set by protect middleware)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update logout state
    user.isLoggedIn = false;
    await user.save();

    // Update login log with logout time
    try {
      await LoginLog.findOneAndUpdate(
        { 
          userId: user._id,
          logoutTime: null // Find the latest login without logout
        },
        { 
          logoutTime: new Date() 
        },
        { 
          sort: { loginTime: -1 } // Get the most recent login
        }
      );
    } catch (logError) {
      console.error('Failed to update logout time:', logError.message);
      // Don't fail the logout if log update fails
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
