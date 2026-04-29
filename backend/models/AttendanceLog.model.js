const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      trim: true,
      uppercase: true,
      index: true,
      ref: 'Student',
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    imagePath: {
      type: String,
      required: [true, 'Image path is required'],
      trim: true,
    },
    deviceId: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent'],
      default: 'present',
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
attendanceLogSchema.index({ studentId: 1, timestamp: -1 });
attendanceLogSchema.index({ course: 1, timestamp: -1 });
attendanceLogSchema.index({ timestamp: -1, status: 1 });

// Index for geospatial queries (if using location data)
attendanceLogSchema.index({ location: '2dsphere' });

// Static method to get attendance by date range
attendanceLogSchema.statics.getAttendanceByDateRange = function(startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ timestamp: -1 });
};

// Static method to get student attendance
attendanceLogSchema.statics.getStudentAttendance = function(studentId, limit = 10) {
  return this.find({ studentId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Method to check if attendance is late
attendanceLogSchema.methods.isLate = function(classStartTime) {
  const attendanceTime = this.timestamp.getHours() * 60 + this.timestamp.getMinutes();
  return attendanceTime > classStartTime;
};

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
