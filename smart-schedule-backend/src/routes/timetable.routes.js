const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  uploadTimetable,
  saveTimetable,
  getMyTimetable,
  getTimetableById
} = require('../controllers/timetable.controller');

// POST /api/timetable/upload — multer + OCR (middleware array)
router.post('/upload', protect, ...uploadTimetable);

// POST /api/timetable/save — save confirmed timetable
router.post('/save', protect, saveTimetable);

// GET /api/timetable/my — get logged-in user's timetable
router.get('/my', protect, getMyTimetable);

// GET /api/timetable/:userId — admin lookup
router.get('/:userId', protect, authorize('Admin'), getTimetableById);

module.exports = router;
