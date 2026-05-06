const User = require('../models/User.model');
const Student = require('../models/Student.model');
const { loadModels, extractFaceDescriptorFromBase64, compareFaces } = require('../utils/faceDetection');

// Load face recognition models on startup
loadModels().catch((error) => {
  console.error('Failed to load face recognition models:', error.message);
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/SuperAdmin)
exports.getUsers = async (req, res) => {
  try {
    let query = {};
    
    // Admin can only see users they created
    if (req.user.role === 'admin') {
      query.createdBy = req.user._id;
    }
    // Superadmin can see all users (no filter applied)
    
    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'name email role');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'name email role');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check ownership: Admin can only view users they created
    if (req.user.role === 'admin') {
      if (!user.createdBy || user.createdBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view users you created.',
        });
      }
    }
    // Superadmin can view all users
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create user with face descriptor
// @route   POST /api/users
// @access  Private (SuperAdmin can create admin/teacher/student, Admin can create teacher/student)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, image, department, username, studentId, accountId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a base64 image for face recognition',
      });
    }

    // Validate role
    const validRoles = ['superadmin', 'admin', 'teacher', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // 1) User uploads/registers face
    // 2) System extracts face descriptor
    let faceDescriptor = [];
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

      faceDescriptor = faceResult.descriptor;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract face descriptor from image',
        error: error.message,
      });
    }

    // 3) System compares against all existing users
    // 4) If similarity match found: block duplicate face registration
    const existingFaceUsers = await User.find({
      faceDescriptor: { $exists: true, $ne: [] },
    }).select('_id name email role faceDescriptor');

    const duplicateFaceThreshold = parseFloat(process.env.FACE_DUPLICATE_THRESHOLD || '0.6');
    for (const existingFaceUser of existingFaceUsers) {
      const comparison = compareFaces(existingFaceUser.faceDescriptor, faceDescriptor, duplicateFaceThreshold);
      if (comparison.isMatch) {
        return res.status(409).json({
          success: false,
          message: 'Face already registered',
          error: 'DUPLICATE_FACE',
          match: {
            existingUserId: existingFaceUser._id,
            role: existingFaceUser.role,
            distance: comparison.distance,
            threshold: duplicateFaceThreshold,
          },
        });
      }
    }

    // Also compare against enrolled students repository
    const existingFaceStudents = await Student.find({
      faceDescriptor: { $exists: true, $ne: [] },
    }).select('_id studentId name faceDescriptor');

    for (const existingFaceStudent of existingFaceStudents) {
      const comparison = compareFaces(existingFaceStudent.faceDescriptor, faceDescriptor, duplicateFaceThreshold);
      if (comparison.isMatch) {
        return res.status(409).json({
          success: false,
          message: 'Face already registered',
          error: 'DUPLICATE_FACE',
          match: {
            existingStudentId: existingFaceStudent.studentId,
            distance: comparison.distance,
            threshold: duplicateFaceThreshold,
          },
        });
      }
    }

    // 5) Check role restrictions
    const requesterRole = req.user.role;

    if (requesterRole === 'admin') {
      // Admin can only create teacher and student
      if (role === 'superadmin' || role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin users can only create teacher and student accounts',
        });
      }
    } else if (requesterRole === 'superadmin') {
      // Superadmin can create admin, teacher, student
      if (role === 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot create another superadmin account',
        });
      }
    } else {
      // Other roles cannot create users
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create users',
      });
    }

    // Duplicate email check
    const normalizedEmail = String(email).toLowerCase().trim();
    const existingEmailUser = await User.findOne({ email: normalizedEmail });
    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        error: 'DUPLICATE_EMAIL',
      });
    }

    // Duplicate username check (optional)
    let normalizedUsername;
    if (typeof username === 'string' && username.trim()) {
      normalizedUsername = username.toLowerCase().trim();
      const existingUsernameUser = await User.findOne({ username: normalizedUsername });
      if (existingUsernameUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
          error: 'DUPLICATE_USERNAME',
        });
      }
    }

    // Duplicate ID checks (studentId/accountId are optional)
    let normalizedStudentId;
    if (typeof studentId === 'string' && studentId.trim()) {
      normalizedStudentId = studentId.toUpperCase().trim();
      const existingStudentIdUser = await User.findOne({ studentId: normalizedStudentId });
      if (existingStudentIdUser) {
        return res.status(409).json({
          success: false,
          message: 'Student ID already exists',
          error: 'DUPLICATE_ID',
        });
      }
    }

    let normalizedAccountId;
    if (typeof accountId === 'string' && accountId.trim()) {
      normalizedAccountId = accountId.toUpperCase().trim();
      const existingAccountIdUser = await User.findOne({ accountId: normalizedAccountId });
      if (existingAccountIdUser) {
        return res.status(409).json({
          success: false,
          message: 'Account ID already exists',
          error: 'DUPLICATE_ID',
        });
      }
    }

    // 6) Save user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      department: department || '',
      username: normalizedUsername,
      studentId: normalizedStudentId,
      accountId: normalizedAccountId,
      faceDescriptor,
      createdBy: req.user._id,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin can update only their created users, SuperAdmin can update all)
exports.updateUser = async (req, res) => {
  try {
    // Find the user to check ownership
    const userToUpdate = await User.findById(req.params.id);
    
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check ownership: Only allow if user is superadmin OR if user created this account
    if (req.user.role !== 'superadmin') {
      if (!userToUpdate.createdBy || userToUpdate.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update users you created.',
        });
      }
    }

    // Enforce immutable role policy for all accounts
    if (typeof req.body.role !== 'undefined') {
      if (req.body.role !== userToUpdate.role) {
        return res.status(403).json({
          success: false,
          message: 'Role change is not allowed. Create a new account for a different role.',
        });
      }

      // Strip unchanged role from payload
      delete req.body.role;
    }

    // Normalize and validate uniqueness for mutable identity fields
    if (typeof req.body.email === 'string') {
      req.body.email = req.body.email.toLowerCase().trim();
      if (req.body.email && req.body.email !== userToUpdate.email) {
        const existingEmailUser = await User.findOne({
          email: req.body.email,
          _id: { $ne: userToUpdate._id },
        });

        if (existingEmailUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already registered',
            error: 'DUPLICATE_EMAIL',
          });
        }
      }
    }

    if (typeof req.body.username === 'string') {
      req.body.username = req.body.username.toLowerCase().trim();
      if (req.body.username && req.body.username !== userToUpdate.username) {
        const existingUsernameUser = await User.findOne({
          username: req.body.username,
          _id: { $ne: userToUpdate._id },
        });

        if (existingUsernameUser) {
          return res.status(409).json({
            success: false,
            message: 'Username already exists',
            error: 'DUPLICATE_USERNAME',
          });
        }
      }
    }

    if (typeof req.body.studentId === 'string') {
      req.body.studentId = req.body.studentId.toUpperCase().trim();
      if (req.body.studentId && req.body.studentId !== userToUpdate.studentId) {
        const existingStudentIdUser = await User.findOne({
          studentId: req.body.studentId,
          _id: { $ne: userToUpdate._id },
        });

        if (existingStudentIdUser) {
          return res.status(409).json({
            success: false,
            message: 'Student ID already exists',
            error: 'DUPLICATE_ID',
          });
        }
      }
    }

    if (typeof req.body.accountId === 'string') {
      req.body.accountId = req.body.accountId.toUpperCase().trim();
      if (req.body.accountId && req.body.accountId !== userToUpdate.accountId) {
        const existingAccountIdUser = await User.findOne({
          accountId: req.body.accountId,
          _id: { $ne: userToUpdate._id },
        });

        if (existingAccountIdUser) {
          return res.status(409).json({
            success: false,
            message: 'Account ID already exists',
            error: 'DUPLICATE_ID',
          });
        }
      }
    }
    
    // Prevent changing protected ownership metadata
    const protectedFields = ['createdBy'];
    if (req.user.role !== 'superadmin') {
      protectedFields.forEach(field => {
        if (req.body[field]) {
          delete req.body[field];
        }
      });
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin can delete only their created users, SuperAdmin can delete all)
exports.deleteUser = async (req, res) => {
  try {
    // Find the user to check ownership
    const userToDelete = await User.findById(req.params.id);
    
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Prevent deleting superadmin accounts
    if (userToDelete.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete superadmin accounts',
      });
    }
    
    // Check ownership: Only allow if user is superadmin OR if user created this account
    if (req.user.role !== 'superadmin') {
      if (!userToDelete.createdBy || userToDelete.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete users you created.',
        });
      }
    }
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all students
// @route   GET /api/users/students
// @access  Private (Admin/SuperAdmin)
exports.getStudents = async (req, res) => {
  try {
    let query = { role: 'student' };
    
    // Admin can only see students they created
    if (req.user.role === 'admin') {
      query.createdBy = req.user._id;
    }
    // Superadmin can see all students
    
    const students = await User.find(query)
      .select('-password -faceDescriptor')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: students.length,
      role: 'student',
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all teachers
// @route   GET /api/users/teachers
// @access  Private (Admin/SuperAdmin)
exports.getTeachers = async (req, res) => {
  try {
    let query = { role: 'teacher' };
    
    // Admin can only see teachers they created
    if (req.user.role === 'admin') {
      query.createdBy = req.user._id;
    }
    // Superadmin can see all teachers
    
    const teachers = await User.find(query)
      .select('-password -faceDescriptor')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: teachers.length,
      role: 'teacher',
      data: teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
