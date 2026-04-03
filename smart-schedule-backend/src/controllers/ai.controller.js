const { chat, generateSuggestions, analyzeAttendance, generateTimetable, generateDailyRoutine } = require('../services/groqService');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// System prompt for the AI Mentor
const MENTOR_SYSTEM_PROMPT = `You are "Aria", an intelligent AI Academic Mentor for Smart Curriculum — a university attendance and scheduling platform.

Your role:
- Help students with study strategies, time management, and academic planning
- Help teachers with class organization and student engagement tips
- Be concise, warm, smart, and practical
- Never make up facts about specific students or classes
- If asked about attendance or timetable specifics, note you can see general stats but not individual records in this chat

Tone: Professional but friendly. Responses should be 2-4 sentences unless explanation is needed.`;

// @desc   Chat with AI Mentor
// @route  POST /api/ai/chat
// @access Private
const aiChat = async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: 'Messages array required' });
  }

  try {
    const reply = await chat(messages, MENTOR_SYSTEM_PROMPT);
    res.json({ success: true, message: reply });
  } catch (error) {
    console.error('Groq chat error:', error.message);
    res.status(500).json({ message: 'AI service temporarily unavailable' });
  }
};

// @desc   Get AI-personalized task suggestions
// @route  GET /api/ai/suggestions
// @access Private
const aiSuggestions = async (req, res) => {
  try {
    const user = req.user;

    // Fetch timetable
    const timetable = await Timetable.findOne({ user: user._id });

    // Fetch attendance stats
    const records = await Attendance.find({ student: user._id });
    const presentCount = records.filter(r => r.status === 'Present').length;
    const attendanceRate = records.length > 0
      ? Math.round((presentCount / records.length) * 100)
      : null;

    const suggestions = await generateSuggestions({
      name: user.name,
      role: user.role,
      timetable,
      attendance: { rate: attendanceRate, total: records.length, present: presentCount }
    });

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Groq suggestions error:', error.message);
    res.status(500).json({ message: 'Could not generate suggestions' });
  }
};

// @desc   AI attendance insights
// @route  GET /api/ai/attendance-insight
// @access Private
const aiAttendanceInsight = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id });
    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.length - presentCount;
    const rate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

    const insight = await analyzeAttendance({
      studentName: req.user.name,
      totalClasses: records.length,
      present: presentCount,
      absent: absentCount,
      attendanceRate: rate
    });

    res.json({ success: true, insight });
  } catch (error) {
    res.status(500).json({ message: 'Could not analyze attendance' });
  }
};

// @desc   AI-generate a timetable from subject list
// @route  POST /api/ai/generate-timetable
// @access Private
const aiGenerateTimetable = async (req, res) => {
  const { subjects, daysPerWeek, hoursPerDay, preferences } = req.body;
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: 'subjects array is required' });
  }
  try {
    const slots = await generateTimetable({
      role: req.user.role,
      subjects,
      daysPerWeek: daysPerWeek || 5,
      hoursPerDay: hoursPerDay || 6,
      preferences
    });
    res.json({ success: true, slots, message: `Generated ${slots.length} timetable slots using Groq AI.` });
  } catch (error) {
    res.status(500).json({ message: 'AI timetable generation failed: ' + error.message });
  }
};

// @desc   Generate AI daily routine combining timetable + goals + free slots
// @route  POST /api/ai/daily-routine
// @access Private (Student)
const aiDailyRoutine = async (req, res) => {
  try {
    const user = req.user;
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[new Date().getDay()];

    // 1. Get timetable slots for today
    const timetable = await Timetable.findOne({ user: user._id });
    const todaySlots = timetable
      ? (timetable.slots || []).filter(s => s.day && s.day.toLowerCase() === today.toLowerCase() && s.type !== 'free')
      : [];

    // 2. Compute free gaps between 08:00 and 22:00
    const toMinutes = t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const fromMinutes = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    const DAY_START = 8 * 60;  // 08:00
    const DAY_END   = 22 * 60; // 22:00

    // Sort today slots by start time
    const sorted = [...todaySlots].sort((a, b) => {
      const aStart = toMinutes((a.time || '08:00').split('-')[0].trim());
      const bStart = toMinutes((b.time || '08:00').split('-')[0].trim());
      return aStart - bStart;
    });

    const freeSlots = [];
    let cursor = DAY_START;

    for (const slot of sorted) {
      const parts = (slot.time || '').split('-');
      if (parts.length < 2) continue;
      const slotStart = toMinutes(parts[0].trim());
      const slotEnd   = toMinutes(parts[1].trim());
      if (slotStart > cursor + 30) { // gap of >30min
        freeSlots.push({ start: fromMinutes(cursor), end: fromMinutes(slotStart) });
      }
      if (slotEnd > cursor) cursor = slotEnd;
    }
    // Remaining time after last class
    if (cursor < DAY_END) {
      freeSlots.push({ start: fromMinutes(cursor), end: fromMinutes(DAY_END) });
    }

    // 3. Load student goals
    const userDoc = await User.findById(user._id).select('goals');
    const goals = userDoc.goals || [];

    // 4. Attendance rate
    const records = await Attendance.find({ student: user._id });
    const presentCount = records.filter(r => r.status === 'Present').length;
    const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : null;

    // 5. Call Groq
    const routine = await generateDailyRoutine({
      name: user.name,
      todaySlots: sorted.map(s => ({ time: s.time, subject: s.subject, type: s.type, room: s.room })),
      freeSlots,
      goals,
      attendanceRate
    });

    res.json({
      success: true,
      today,
      data: routine,
      meta: {
        classCount: todaySlots.length,
        freeSlotCount: freeSlots.length,
        goalCount: goals.length
      }
    });
  } catch (error) {
    console.error('Daily routine error:', error.message);
    res.status(500).json({ message: 'Could not generate daily routine: ' + error.message });
  }
};

module.exports = { aiChat, aiSuggestions, aiAttendanceInsight, aiGenerateTimetable, aiDailyRoutine };
