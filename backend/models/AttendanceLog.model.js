const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema(
  {
    // Universal user reference (supports all user types: student, teacher, admin)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    // User role for quick filtering
    userRole: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: [true, 'User role is required'],
      index: true,
    },
    // Name snapshot at attendance time
    userName: {
      type: String,
      trim: true,
    },
    // Legacy studentId field (kept for backward compatibility)
    studentId: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      ref: 'Student',
    },
    course: {
      type: String,
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    // Time-in/time-out tracking
    timeIn: {
      type: Date,
      default: null,
    },
    timeOut: {
      type: Date,
      default: null,
    },
    // 1 = time-in recorded, 2 = time-out recorded (completed)
    scanCount: {
      type: Number,
      default: 1,
      min: 1,
      max: 2,
    },
    imagePath: {
      type: String,
      trim: true,
    },
    deviceId: {
      type: String,
      trim: true,
      default: null,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    // Track who created this user (for admin filtering)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
attendanceLogSchema.index({ userId: 1, timestamp: -1 });
attendanceLogSchema.index({ userRole: 1, timestamp: -1 });
attendanceLogSchema.index({ studentId: 1, timestamp: -1 }); // Legacy support
attendanceLogSchema.index({ course: 1, timestamp: -1 });
attendanceLogSchema.index({ timestamp: -1, status: 1 });
attendanceLogSchema.index({ createdBy: 1, timestamp: -1 }); // Admin filtering

// Index for geospatial queries (if using location data)
attendanceLogSchema.index({ location: '2dsphere' });

// Static method to get attendance by date range
attendanceLogSchema.statics.getAttendanceByDateRange = function(startDate, endDate, filters = {}) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
    ...filters,
  })
  .populate('userId', 'name email role department')
  .sort({ timestamp: -1 });
};

// Static method to get user attendance (works for all user types)
attendanceLogSchema.statics.getUserAttendance = function(userId, limit = 10) {
  return this.find({ userId })
    .populate('userId', 'name email role department')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Method to check if attendance is late
attendanceLogSchema.methods.isLate = function(classStartTime) {
  const attendanceTime = this.timestamp.getHours() * 60 + this.timestamp.getMinutes();
  return attendanceTime > classStartTime;
};

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
