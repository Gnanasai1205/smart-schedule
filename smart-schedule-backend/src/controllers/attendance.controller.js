const jwt = require('jsonwebtoken');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Timetable = require('../models/Timetable');
const Session = require('../models/Session');

// @desc    Teacher generates QR code data
// @route   POST /attendance/generate-qr
// @access  Private (Teacher)
const generateQR = async (req, res) => {
  const { classId, latitude, longitude } = req.body;

  try {
    // Verify class belongs to teacher
    const classInfo = await Class.findById(classId);
    if (!classInfo || classInfo.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this class' });
    }

    const activeSession = await Session.findOne({ class: classId, isActive: true });

    // Generate a long-lived JWT token for the session's QR code
    const qrData = {
      classId,
      sessionId: activeSession ? activeSession._id : null,
      teacherId: req.user._id,
      teacherIP: req.ip || req.connection?.remoteAddress,
      teacherLat: latitude,
      teacherLng: longitude,
      timestamp: Date.now(),
    };

    const qrToken = jwt.sign(qrData, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.json({
      success: true,
      qrToken,
      expiresIn: 43200,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student marks attendance using QR token
// @route   POST /attendance/mark
// @access  Private (Student)
const markAttendance = async (req, res) => {
  const { qrToken, studentLat, studentLng, deviceId } = req.body;

  try {
    // 1. Verify token
    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    
    // 2. Check if student already marked attendance for this class today
    const { classId, sessionId } = decoded;

    if (!sessionId) {
      return res.status(400).json({ message: 'No active session found in QR code. Teacher needs to start the session.' });
    }

    const session = await Session.findById(sessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ message: 'Session is no longer active.' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      student: req.user._id,
      class: classId,
      session: sessionId
    });

    if (existingAttendance && existingAttendance.status === 'Present') {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    // --- ANTI-CHEAT CHECKS ---
    // 2.5 Device Binding
    if (deviceId) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user._id);
      if (!userDoc.deviceId) {
        userDoc.deviceId = deviceId;
        await userDoc.save();
      } else if (userDoc.deviceId !== deviceId) {
        return res.status(403).json({ message: 'Device mismatch: Your account is permanently bound to another device. Proxy marking is prohibited.' });
      }
    }

    // 2.6 IP Match Check
    const studentIP = req.ip || req.connection?.remoteAddress;
    // Allow distinct IPs ONLY if they are both local loopback vs v4 mapped for local testing (e.g., ::1 and 127.0.0.1)
    if (decoded.teacherIP && studentIP && studentIP !== decoded.teacherIP) {
      const isLocal1 = studentIP === '::1' || studentIP.includes('127.0.0.1');
      const isLocal2 = decoded.teacherIP === '::1' || decoded.teacherIP.includes('127.0.0.1');
      if (!(isLocal1 && isLocal2)) {
         return res.status(403).json({ message: 'IP mismatch: You must be on the exact same Wi-Fi network as the teacher.' });
      }
    }

    // 2.7 Geolocation Check
    if (decoded.teacherLat && decoded.teacherLng && studentLat && studentLng) {
      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; 
      }
      const distance = getDistance(decoded.teacherLat, decoded.teacherLng, studentLat, studentLng);
      // Reject if distance > 30 meters
      if (distance > 30) {
        return res.status(403).json({ message: `Proximity mismatch: You are too far (${Math.round(distance)}m) from the classroom.` });
      }
    }
    // --- END ANTI-CHEAT CHECKS ---

    // 3. Save attendance
    let attendance;
    if (existingAttendance) {
      existingAttendance.status = 'Present';
      existingAttendance.method = 'QR';
      existingAttendance.qrTokenId = qrToken;
      existingAttendance.date = new Date();
      await existingAttendance.save();
      attendance = existingAttendance;
    } else {
      attendance = await Attendance.create({
        student: req.user._id,
        class: classId,
        session: sessionId,
        status: 'Present',
        method: 'QR',
        qrTokenId: qrToken
      });
    }

    // 4. Emit socket event
    const io = req.app.get('io');
    io.to(`class_${classId}`).emit('attendanceMarked', {
      studentId: req.user._id,
      studentName: req.user.name,
      time: new Date(),
      status: 'Present'
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'QR Code expired. Ask teacher to generate a new one.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in student's own attendance records
// @route   GET /attendance/my
// @access  Private (Student)
const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate('class', 'name subject')
      .sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all attendance records for a teacher's classes
// @route   GET /attendance/class
// @access  Private (Teacher)
const getClassAttendance = async (req, res) => {
  try {
    const Class = require('../models/Class');
    const teacherClasses = await Class.find({ teacher: req.user._id }).select('_id');
    const classIds = teacherClasses.map(c => c._id);
    const records = await Attendance.find({ class: { $in: classIds } })
      .populate('student', 'name email')
      .populate('class', 'name subject')
      .sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: parse "09:00" → minutes since midnight
function timeToMinutes(t) {
  if (!t) return 0;
  // Handle formats: "09:00", "9:00", "9:00 AM"
  const cleaned = t.replace(/\s*(AM|PM)/i, '').trim();
  const [h, m] = cleaned.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// @desc   Get the currently active timetable slot for this teacher (based on current time)
// @route  GET /attendance/current-class
// @access Private (Teacher)
const getCurrentClass = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ user: req.user._id });
    if (!timetable || !timetable.slots?.length) {
      return res.json({ success: true, currentClass: null, message: 'No timetable uploaded yet.' });
    }

    // Get current IST day and time
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find a slot that matches today and contains the current time
    const activeSlot = timetable.slots.find(slot => {
      if (slot.day !== currentDay || slot.type === 'free') return false;
      // Parse time range: "09:00-10:00" or "09:00 - 10:00"
      const parts = slot.time.split(/[-–]/).map(s => s.trim());
      if (parts.length < 2) return false;
      const start = timeToMinutes(parts[0]);
      const end = timeToMinutes(parts[1]);
      return currentMinutes >= start && currentMinutes < end;
    });

    if (!activeSlot) {
      // Find next upcoming class today
      const upcoming = timetable.slots
        .filter(s => s.day === currentDay && s.type !== 'free')
        .map(s => {
          const parts = s.time.split(/[-–]/).map(x => x.trim());
          return { ...s._doc || s, startMin: timeToMinutes(parts[0] || '0') };
        })
        .filter(s => s.startMin > currentMinutes)
        .sort((a, b) => a.startMin - b.startMin)[0];

      return res.json({
        success: true,
        currentClass: null,
        upcomingClass: upcoming || null,
        currentDay,
        message: upcoming
          ? `No class right now. Next: ${upcoming.subject} at ${upcoming.time}`
          : `No more classes today (${currentDay}).`
      });
    }

    // Auto-create or fetch Class record for this subject
    let classRecord = await Class.findOne({
      teacher: req.user._id,
      name: activeSlot.subject
    });

    if (!classRecord) {
      classRecord = await Class.create({
        name: activeSlot.subject,
        subjectCode: activeSlot.subject.replace(/\s+/g, '').substring(0, 8).toUpperCase(),
        teacher: req.user._id,
        department: req.user.department || 'General'
      });
    }

    res.json({
      success: true,
      currentClass: {
        classId: classRecord._id,
        subject: activeSlot.subject,
        time: activeSlot.time,
        room: activeSlot.room,
        type: activeSlot.type,
        day: activeSlot.day
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get live attendance count for a class (real-time)
// @route  GET /attendance/live/:classId
// @access Private (Teacher)
const getLiveAttendance = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      class: req.params.classId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('student', 'name email').sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start an attendance session
// @route   POST /attendance/start-session
// @access  Private (Teacher)
const startSession = async (req, res) => {
  const { classId, subject, endTimeStr } = req.body;
  if (!classId) return res.status(400).json({ message: 'classId is required' });

  try {
    const classInfo = await Class.findById(classId).populate('students');
    if (!classInfo || classInfo.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this class' });
    }

    const existingSession = await Session.findOne({ class: classId, isActive: true });
    if (existingSession) {
      return res.status(400).json({ message: 'Session already active for this class' });
    }

    let endTime = null;
    if (endTimeStr) {
      // Parse "09:00" or "09:00 AM" or "14:30" for today
      const cleaned = endTimeStr.replace(/\s*(AM|PM)/i, '').trim();
      const [h, m] = cleaned.split(':').map(Number);
      const isPM = /PM/i.test(endTimeStr);
      let hours = h || 0;
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      const now = new Date();
      endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, m || 0, 0);
    }

    const session = await Session.create({
      class: classId,
      teacher: req.user._id,
      subject: subject || classInfo.name,
      isActive: true,
      startTime: new Date(),
      endTime
    });

    let studentsToMark = [];
    if (classInfo.students && classInfo.students.length > 0) {
      studentsToMark = classInfo.students;
    } else {
      const User = require('../models/User');
      const allStudents = await User.find({ role: 'Student' }).select('_id');
      studentsToMark = allStudents;
    }

    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

    const attendanceRecords = studentsToMark.map(student => ({
      student: student._id || student,
      class: classId,
      session: session._id,
      status: 'Absent',
      method: 'Manual',
      date: new Date()
    }));

    if (attendanceRecords.length > 0) {
      // Avoid inserting duplicates if already inserted manually for some reason, 
      // but session is new so it should be fine. Ignore errors for unique duplicates.
      try {
        await Attendance.insertMany(attendanceRecords, { ordered: false });
      } catch (err) {
        // Ignored if duplicate
      }
    }

    const io = req.app.get('io');
    io.to(`class_${classId}`).emit('sessionStarted', { sessionId: session._id, classId });
    io.emit('sessionStarted', { classId, sessionId: session._id }); 

    res.status(201).json({ success: true, session, totalStudents: studentsToMark.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End an attendance session
// @route   POST /attendance/end-session
// @access  Private (Teacher)
const endSession = async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

  try {
    const session = await Session.findById(sessionId);
    if (!session || session.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized or session missing' });
    }

    session.isActive = false;
    session.endTime = new Date();
    await session.save();

    const io = req.app.get('io');
    io.to(`class_${session.class}`).emit('sessionEnded', { sessionId, classId: session.class });
    io.emit('sessionEnded', { classId: session.class });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get active session for a class
// @route  GET /attendance/session/:classId
// @access Private
const getActiveSession = async (req, res) => {
  try {
    const session = await Session.findOne({ class: req.params.classId, isActive: true });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateQR,
  markAttendance,
  getMyAttendance,
  getClassAttendance,
  getCurrentClass,
  getLiveAttendance,
  startSession,
  endSession,
  getActiveSession
};
