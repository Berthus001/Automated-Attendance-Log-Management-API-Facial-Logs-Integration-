const { Student } = require('../models');
const User = require('../models/User.model');
const { processBase64Image } = require('../utils/imageProcessor');
const { extractFaceDescriptorFromBase64, compareFaces } = require('../utils/faceDetection');
const { isValidBase64Image } = require('../utils/imageHelpers');

/**
 * Enroll a new student with facial recognition
 * @route   POST /api/v1/enroll
 * @access  Public
 */
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, name, course, image } = req.body;

    // Validate required fields
    if (!studentId || !name || !course || !image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, name, course, and image',
      });
    }

    // Validate base64 image
    if (!isValidBase64Image(image)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid base64 image',
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      studentId: studentId.toUpperCase() 
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `Student with ID ${studentId} already exists`,
        data: {
          studentId: existingStudent.studentId,
          name: existingStudent.name,
          course: existingStudent.course,
        },
      });
    }

    // Extract face descriptor from base64 image
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

    // Block duplicate face across existing students and users
    const duplicateFaceThreshold = parseFloat(process.env.FACE_DUPLICATE_THRESHOLD || '0.6');

    const enrolledStudents = await Student.find({
      faceDescriptor: { $exists: true, $ne: [] },
    }).select('studentId faceDescriptor');

    for (const enrolledStudent of enrolledStudents) {
      const comparison = compareFaces(enrolledStudent.faceDescriptor, faceResult.descriptor, duplicateFaceThreshold);
      if (comparison.isMatch) {
        return res.status(409).json({
          success: false,
          message: 'Face already registered',
          error: 'DUPLICATE_FACE',
          match: {
            existingStudentId: enrolledStudent.studentId,
            distance: comparison.distance,
            threshold: duplicateFaceThreshold,
          },
        });
      }
    }

    const existingUsers = await User.find({
      faceDescriptor: { $exists: true, $ne: [] },
    }).select('_id role faceDescriptor');

    for (const existingUser of existingUsers) {
      const comparison = compareFaces(existingUser.faceDescriptor, faceResult.descriptor, duplicateFaceThreshold);
      if (comparison.isMatch) {
        return res.status(409).json({
          success: false,
          message: 'Face already registered',
          error: 'DUPLICATE_FACE',
          match: {
            existingUserId: existingUser._id,
            role: existingUser.role,
            distance: comparison.distance,
            threshold: duplicateFaceThreshold,
          },
        });
      }
    }

    // Process and save image
    const imageResult = await processBase64Image(image, {
      maxWidth: 300,
      quality: 70,
      format: 'jpeg',
      subfolder: 'students',
    });

    // Create student with face descriptor
    const student = await Student.create({
      studentId: studentId.toUpperCase(),
      name,
      course,
      faceDescriptor: faceResult.descriptor,
      email: req.body.email || undefined,
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: {
        studentId: student.studentId,
        name: student.name,
        course: student.course,
        email: student.email,
        imagePath: imageResult.filePath,
        faceDetection: {
          confidence: faceResult.confidence,
          boundingBox: faceResult.boundingBox,
        },
        enrolledAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get enrolled student details
 * @route   GET /api/v1/enroll/:studentId
 * @access  Public
 */
exports.getEnrolledStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase() 
    }).select('-faceDescriptor'); // Exclude face descriptor from response

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update enrolled student information
 * @route   PUT /api/v1/enroll/:studentId
 * @access  Public
 */
exports.updateEnrolledStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, course, email, image } = req.body;

    const student = await Student.findOne({ 
      studentId: studentId.toUpperCase() 
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found`,
      });
    }

    // Update basic info
    if (name) student.name = name;
    if (course) student.course = course;
    if (email) student.email = email;

    // Update face descriptor if new image provided
    if (image) {
      if (!isValidBase64Image(image)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid base64 image',
        });
      }

      // Extract new face descriptor
      const faceResult = await extractFaceDescriptorFromBase64(image);

      if (!faceResult.success) {
        return res.status(400).json({
          success: false,
          message: faceResult.message,
          error: faceResult.error,
          faceCount: faceResult.faceCount,
        });
      }

      // Block duplicate face on re-enrollment/update (exclude current student)
      const duplicateFaceThreshold = parseFloat(process.env.FACE_DUPLICATE_THRESHOLD || '0.6');

      const otherStudents = await Student.find({
        studentId: { $ne: student.studentId },
        faceDescriptor: { $exists: true, $ne: [] },
      }).select('studentId faceDescriptor');

      for (const otherStudent of otherStudents) {
        const comparison = compareFaces(otherStudent.faceDescriptor, faceResult.descriptor, duplicateFaceThreshold);
        if (comparison.isMatch) {
          return res.status(409).json({
            success: false,
            message: 'Face already registered',
            error: 'DUPLICATE_FACE',
            match: {
              existingStudentId: otherStudent.studentId,
              distance: comparison.distance,
              threshold: duplicateFaceThreshold,
            },
          });
        }
      }

      const existingUsers = await User.find({
        faceDescriptor: { $exists: true, $ne: [] },
      }).select('_id role faceDescriptor');

      for (const existingUser of existingUsers) {
        const comparison = compareFaces(existingUser.faceDescriptor, faceResult.descriptor, duplicateFaceThreshold);
        if (comparison.isMatch) {
          return res.status(409).json({
            success: false,
            message: 'Face already registered',
            error: 'DUPLICATE_FACE',
            match: {
              existingUserId: existingUser._id,
              role: existingUser.role,
              distance: comparison.distance,
              threshold: duplicateFaceThreshold,
            },
          });
        }
      }

      // Update face descriptor
      student.faceDescriptor = faceResult.descriptor;

      // Save new image
      await processBase64Image(image, {
        maxWidth: 300,
        quality: 70,
        format: 'jpeg',
        subfolder: 'students',
      });
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student information updated successfully',
      data: {
        studentId: student.studentId,
        name: student.name,
        course: student.course,
        email: student.email,
        updatedAt: student.updatedAt,
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
 * Delete enrolled student
 * @route   DELETE /api/v1/enroll/:studentId
 * @access  Public
 */
exports.deleteEnrolledStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOneAndDelete({ 
      studentId: studentId.toUpperCase() 
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      data: {
        studentId: student.studentId,
        name: student.name,
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
 * Get all enrolled students
 * @route   GET /api/v1/enroll
 * @access  Public
 */
exports.getAllEnrolledStudents = async (req, res) => {
  try {
    const { course, isActive, limit = 50, page = 1 } = req.query;

    // Build query
    const query = {};
    if (course) query.course = course;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Execute query with pagination
    const students = await Student.find(query)
      .select('-faceDescriptor')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
