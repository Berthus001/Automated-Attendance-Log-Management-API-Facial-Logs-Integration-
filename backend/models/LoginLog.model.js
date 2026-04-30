const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'teacher', 'student'],
      required: [true, 'User role is required'],
      index: true,
    },
    loginTime: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
loginLogSchema.index({ userId: 1, loginTime: -1 });
loginLogSchema.index({ role: 1, loginTime: -1 });

module.exports = mongoose.model('LoginLog', loginLogSchema);
