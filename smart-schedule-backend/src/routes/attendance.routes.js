const express = require('express');
const router = express.Router();
const { generateQR, markAttendance, getMyAttendance, getClassAttendance, getCurrentClass, getLiveAttendance } = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/generate-qr', protect, authorize('Teacher', 'Admin'), generateQR);
router.post('/mark', protect, authorize('Student'), markAttendance);
router.get('/my', protect, authorize('Student'), getMyAttendance);
router.get('/class', protect, authorize('Teacher', 'Admin'), getClassAttendance);
router.get('/current-class', protect, authorize('Teacher', 'Admin'), getCurrentClass);
router.get('/live/:classId', protect, authorize('Teacher', 'Admin'), getLiveAttendance);

module.exports = router;
