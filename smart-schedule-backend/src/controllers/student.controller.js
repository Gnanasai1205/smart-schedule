const Attendance = require('../models/Attendance');
const Timetable = require('../models/Timetable');
const User = require('../models/User');

// @desc    Get student dashboard data (attendance %, schedule, suggestions)
// @route   GET /student/dashboard
// @access  Private (Student)
const getDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Calculate Attendance Percentage
    const totalClassesAttended = await Attendance.countDocuments({ student: studentId, status: 'Present' });
    const totalClassesRecorded = await Attendance.countDocuments({ student: studentId });
    const attendancePercentage = totalClassesRecorded === 0 ? 100 : Math.round((totalClassesAttended / totalClassesRecorded) * 100);

    res.json({
      success: true,
      data: {
        attendancePercentage,
        totalClassesAttended,
        totalClassesMissed: totalClassesRecorded - totalClassesAttended,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI Suggestions based on free time slots
// @route   GET /student/suggestions
// @access  Private (Student)
const getSuggestions = async (req, res) => {
  try {
    const suggestions = [
      { type: 'study', task: 'Review previous lecture notes', estimatedTime: '30 mins' },
      { type: 'activity', task: 'Visit library for upcoming assignment reference', estimatedTime: '45 mins' },
    ];
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current student's saved goals
// @route   GET /api/student/goals
// @access  Private (Student)
const getGoals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('goals');
    res.json({ success: true, data: user.goals || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save (replace) student's goals list
// @route   POST /api/student/goals
// @access  Private (Student)
const saveGoals = async (req, res) => {
  try {
    const { goals } = req.body;
    if (!Array.isArray(goals)) {
      return res.status(400).json({ message: 'goals must be an array' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { goals },
      { new: true }
    ).select('goals');
    res.json({ success: true, data: user.goals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboard,
  getSuggestions,
  getGoals,
  saveGoals
};

