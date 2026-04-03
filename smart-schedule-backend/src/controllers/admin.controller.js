const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Get system-wide analytics
// @route   GET /admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalTeachers = await User.countDocuments({ role: 'Teacher' });

    // Aggregate attendance trends (e.g. Present vs Absent overall)
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Find students with lowest attendance
    const studentAttendance = await Attendance.aggregate([
      {
        $group: {
          _id: '$student',
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          studentId: '$_id',
          attendancePercentage: {
            $multiply: [{ $divide: ['$presentCount', '$totalClasses'] }, 100]
          }
        }
      },
      { $sort: { attendancePercentage: 1 } },
      { $limit: 10 }
    ]);

    // Populate user details for low attendance
    const populatedLowAttendance = await User.populate(studentAttendance, { path: 'studentId', select: 'name email' });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        attendanceStats,
        lowAttendanceList: populatedLowAttendance
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (with optional status filter)
// @route   GET /admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a pending user
// @route   PUT /admin/approve-user/:id
// @access  Private (Admin)
const approveUser = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['Student', 'Teacher', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required to approve user' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a pending user
// @route   PUT /admin/reject-user/:id
// @access  Private (Admin)
const rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  approveUser,
  rejectUser
};
