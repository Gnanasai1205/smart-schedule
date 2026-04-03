const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a class name'],
    trim: true,
  },
  subjectCode: {
    type: String,
    required: [true, 'Please add a subject code'],
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
