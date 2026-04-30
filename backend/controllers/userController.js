const User = require('../models/User.model');
const { loadModels, extractFaceDescriptorFromBase64 } = require('../utils/faceDetection');

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
    const { name, email, password, role, image, department } = req.body;

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

    // Role-based validation: Check if requester can create this role
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

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Extract face descriptor from base64 image
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

    // Create user with face descriptor
    const user = await User.create({
      name,
      email,
      password,
      role,
      department: department || '',
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
    
    // Prevent changing certain fields
    const protectedFields = ['role', 'createdBy'];
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
