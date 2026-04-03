const express = require('express');
const router = express.Router();
const { getAnalytics, getUsers, approveUser, rejectUser } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('Admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/approve-user/:id', approveUser);
router.put('/reject-user/:id', rejectUser);

module.exports = router;
