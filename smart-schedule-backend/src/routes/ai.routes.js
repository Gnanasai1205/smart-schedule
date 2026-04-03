const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiChat, aiSuggestions, aiAttendanceInsight, aiGenerateTimetable, aiDailyRoutine } = require('../controllers/ai.controller');

// POST /api/ai/chat
router.post('/chat', protect, aiChat);
// GET /api/ai/suggestions
router.get('/suggestions', protect, aiSuggestions);
// GET /api/ai/attendance-insight
router.get('/attendance-insight', protect, aiAttendanceInsight);
// POST /api/ai/generate-timetable
router.post('/generate-timetable', protect, aiGenerateTimetable);
// POST /api/ai/daily-routine
router.post('/daily-routine', protect, aiDailyRoutine);

module.exports = router;
