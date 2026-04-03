const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  time: { type: String, required: true },
  subject: { type: String, required: true },
  room: { type: String, default: '' },
  type: { type: String, enum: ['lecture', 'lab', 'free', 'other'], default: 'lecture' }
});

const timetableSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['Student', 'Teacher'],
    required: true
  },
  slots: [timetableSlotSchema],
  rawImage: { type: String }, // base64 or S3 URL (optional)
  ocrConfidence: { type: Number }, // 0-100
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
