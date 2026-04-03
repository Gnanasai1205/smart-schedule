const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present',
  },
  method: {
    type: String,
    enum: ['QR', 'Manual'],
    default: 'QR',
  },
  qrTokenId: {
    type: String,
    // Store unique ID of QR to prevent reuse of same QR (if needed)
  }
}, { timestamps: true });

// Prevent duplicate attendance for the same student, in the same class, on the same day
attendanceSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
