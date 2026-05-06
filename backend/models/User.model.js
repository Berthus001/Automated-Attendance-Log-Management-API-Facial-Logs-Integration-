const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    accountId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'teacher', 'student'],
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    faceDescriptor: {
      type: [Number],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });
userSchema.index({ accountId: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
