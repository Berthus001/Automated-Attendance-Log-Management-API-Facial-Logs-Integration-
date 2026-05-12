const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Please provide a student ID'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a student name'],
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Please provide a course'],
      trim: true,
    },
    faceDescriptor: {
      type: [Number],
      required: [true, 'Face descriptor is required for facial recognition'],
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length === 128;
        },
        message: 'Face descriptor must be an array of 128 numbers',
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function(v) {
          return !v || /^\d+$/.test(v);
        },
        message: 'Phone number must contain only digits',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
studentSchema.index({ course: 1, isActive: 1 });

// Virtual for attendance logs
studentSchema.virtual('attendanceLogs', {
  ref: 'AttendanceLog',
  localField: 'studentId',
  foreignField: 'studentId',
});

// Method to compare face descriptors
studentSchema.methods.compareFaceDescriptor = function(descriptor) {
  // Euclidean distance calculation
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    sum += Math.pow(this.faceDescriptor[i] - descriptor[i], 2);
  }
  return Math.sqrt(sum);
};

module.exports = mongoose.model('Student', studentSchema);
