// Central export file for all models
const User = require('./User.model');
const Student = require('./Student.model');
const AttendanceLog = require('./AttendanceLog.model');

module.exports = {
  User,
  Student,
  AttendanceLog,
};
