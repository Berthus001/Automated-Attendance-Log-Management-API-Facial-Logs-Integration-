const mongoose = require('mongoose');

const adminActionLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: 'Unknown User',
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    actorRole: {
      type: String,
      enum: ['superadmin', 'admin'],
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: [
        'user_created',
        'user_updated',
        'user_deleted',
        'admin_updated',
        'admin_suspended',
        'admin_activated',
        'admin_deleted',
      ],
      required: true,
      index: true,
    },
    source: {
      type: String,
      default: 'user_management',
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetUserName: {
      type: String,
      trim: true,
      default: null,
    },
    targetUserEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    targetUserRole: {
      type: String,
      enum: ['superadmin', 'admin', 'teacher', 'student'],
      default: null,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
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

adminActionLogSchema.index({ actorRole: 1, timestamp: -1 });
adminActionLogSchema.index({ actionType: 1, timestamp: -1 });

module.exports = mongoose.model('AdminActionLog', adminActionLogSchema);
