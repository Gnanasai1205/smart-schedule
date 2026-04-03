const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Single-turn AI completion
 */
async function complete(systemPrompt, userPrompt, opts = {}) {
  const response = await groq.chat.completions.create({
    model: opts.model || MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024
  });
  return response.choices[0]?.message?.content || '';
}

/**
 * Multi-turn chat completion (returns assistant message text)
 */
async function chat(messages, systemPrompt) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.75,
    max_tokens: 1024
  });
  return response.choices[0]?.message?.content || '';
}

/**
 * Parse raw OCR text into structured timetable JSON using Groq
 */
async function parseTimetableOCR(rawText) {
  const prompt = `You are a timetable parser. Given raw OCR text from a university timetable image, extract all schedule entries and return ONLY a valid JSON array.

Rules:
- Each entry must have: day (full name e.g. "Monday"), time (e.g. "09:00-10:00"), subject, room (empty string if not found), type (lecture/lab/free)
- If you cannot parse the text, return an empty array []
- Return ONLY the JSON array, no explanations

OCR Text:
${rawText}`;

  const result = await complete('You are a JSON-only timetable parser.', prompt, { temperature: 0.1, maxTokens: 2048 });
  
  // Extract JSON from response
  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Generate personalized task suggestions
 */
async function generateSuggestions(userData) {
  const { name, timetable, attendance, role } = userData;
  const attendanceRate = attendance?.rate || null;
  const subjects = timetable?.slots?.map(s => s.subject).filter(Boolean) || [];
  const uniqueSubjects = [...new Set(subjects)].slice(0, 8);

  const prompt = `You are a smart academic productivity assistant for a ${role} named ${name}.

${attendanceRate !== null ? `Their current attendance rate is ${attendanceRate}%.` : ''}
${uniqueSubjects.length ? `Their subjects are: ${uniqueSubjects.join(', ')}.` : ''}

Generate exactly 4 smart, actionable, specific study tasks. Return ONLY a JSON array with this structure:
[{"id":"1","title":"...","description":"...","priority":"high"|"medium"|"low","duration":"...","category":"..."}]

Make tasks specific to their subjects and situation. No generic advice.`;

  const result = await complete('You are a JSON-only task generator.', prompt, { temperature: 0.8, maxTokens: 1024 });
  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Generate attendance insights
 */
async function analyzeAttendance(stats) {
  const prompt = `Analyze student attendance data and provide a concise 3-sentence insight with actionable suggestions.\nData: ${JSON.stringify(stats)}\nFocus on: trends, risks, and 1 specific recommendation.`;
  return complete('You are an educational data analyst.', prompt, { temperature: 0.5, maxTokens: 256 });
}

/**
 * AI-generate a full weekly timetable from user preferences
 */
async function generateTimetable({ role, subjects, daysPerWeek, hoursPerDay, preferences }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, daysPerWeek || 5);
  const prompt = `You are a university timetable scheduler. Create a realistic ${role} timetable.

Inputs:
- Role: ${role}
- Subjects/Courses: ${subjects.join(', ')}
- Days: ${days.join(', ')}
- Hours per day: ${hoursPerDay || 6} (starting 09:00)
- Preferences: ${preferences || 'balanced schedule, include breaks'}

Rules:
- Each subject should appear 2-3 times per week
- Include 1 lunch break (12:00-13:00) each day as type "free"
- Labs should be 2-hour slots, lectures 1 hour
- Spread subjects evenly
- Return ONLY a valid JSON array, no text before or after

Format (ONLY this JSON):
[{"day":"Monday","time":"09:00-10:00","subject":"Data Structures","room":"CS-101","type":"lecture"},...]`;

  const result = await complete('You are a JSON-only timetable generator.', prompt, {
    temperature: 0.3,
    maxTokens: 3000
  });

  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Generate a full day routine merging class slots + AI-filled free periods
 * @param {object} params
 * @param {string} params.name - student name
 * @param {Array}  params.todaySlots - timetable slots for today [{time, subject, type, room}]
 * @param {Array}  params.freeSlots  - detected free time windows [{start, end}] e.g. [{start:'10:00',end:'11:00'}]
 * @param {Array}  params.goals      - student goals [{text, category}]
 * @param {number} params.attendanceRate
 */
async function generateDailyRoutine({ name, todaySlots, freeSlots, goals, attendanceRate }) {
  const goalTexts = goals.map(g => `• ${g.text} (${g.category})`).join('\n') || 'No specific goals set';
  const classesDesc = todaySlots.map(s => `${s.time}: ${s.subject} (${s.type})`).join('\n') || 'No classes today';
  const freeSlotsDesc = freeSlots.map(s => `${s.start}–${s.end}`).join(', ') || 'No free slots';

  const prompt = `You are a smart academic planner for a student named ${name}.

Today's confirmed class schedule:
${classesDesc}

Free time windows available:
${freeSlotsDesc}

Student's long-term goals:
${goalTexts}

${attendanceRate !== null ? `Current attendance: ${attendanceRate}%` : ''}

For EACH free time window, generate a specific, actionable task that:
1. Directly helps progress toward at least one of the student's goals
2. Fits within the free window duration
3. Is concrete and specific (not generic like "study more")

Return ONLY a valid JSON array. Include ALL time blocks (both classes and free-period tasks). Format:
[
  {"time":"09:00-10:00","title":"Data Structures Lecture","type":"class","subject":"Data Structures","room":"CS-101","description":"Attend lecture"},
  {"time":"10:00-11:00","title":"Practice 5 LeetCode Easy problems","type":"task","subject":"DSA Practice","room":"","description":"Focus on array/string problems to build interview readiness. Use LeetCode easy set.","priority":"high","category":"Career"},
  ...
]

Rules:
- type must be exactly "class", "task", or "break"
- time must be in "HH:MM-HH:MM" format
- Sort entries chronologically
- Return ONLY the JSON array, no other text`;

  const result = await complete('You are a JSON-only daily planner. Output only valid JSON.', prompt, {
    temperature: 0.6,
    maxTokens: 2500
  });

  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

module.exports = { groq, complete, chat, parseTimetableOCR, generateSuggestions, analyzeAttendance, generateTimetable, generateDailyRoutine, MODEL };
