const express = require('express');
const router = express.Router();
const { getDashboard, getSuggestions, getGoals, saveGoals } = require('../controllers/student.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('Student'), getDashboard);
router.get('/suggestions', protect, authorize('Student'), getSuggestions);
router.get('/goals', protect, authorize('Student'), getGoals);
router.post('/goals', protect, authorize('Student'), saveGoals);

module.exports = router;

