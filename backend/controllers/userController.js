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
    const users = await User.find().select('-password');
    
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
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
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
    const { name, email, password, role, image } = req.body;

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
// @route   PUT /api/v1/users/:id
// @access  Public
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
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
// @route   DELETE /api/v1/users/:id
// @access  Public
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
