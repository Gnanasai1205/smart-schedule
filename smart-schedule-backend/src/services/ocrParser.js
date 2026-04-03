const Tesseract = require('tesseract.js');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBREVS = {
  'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday',
  'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday',
  'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
  'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
};

/**
 * Runs Tesseract OCR on imagePath and returns {text, confidence}
 */
async function runOCR(imagePath) {
  const result = await Tesseract.recognize(imagePath, 'eng', {
    logger: () => {} // silence logs
  });
  return {
    text: result.data.text,
    confidence: Math.round(result.data.confidence)
  };
}

/**
 * Detects time patterns like 09:00-10:00, 9am-10am, 9:00 AM - 10:00 AM
 */
function extractTimeSlots(text) {
  const timePattern = /\b(\d{1,2}[:.]\d{2}\s*(?:AM|PM)?)\s*[-–to]+\s*(\d{1,2}[:.]\d{2}\s*(?:AM|PM)?)\b/gi;
  const matches = [];
  let match;
  while ((match = timePattern.exec(text)) !== null) {
    matches.push({
      full: match[0].trim(),
      start: match[1].trim(),
      end: match[2].trim(),
      index: match.index
    });
  }
  return matches;
}

/**
 * Simple AI-style parser: tries to find day+time+subject patterns in raw OCR text.
 * Falls back to row-by-row heuristics.
 */
function parseOCRText(text) {
  const slots = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentDay = null;
  const timeSlots = extractTimeSlots(text);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Detect day headers
    for (const [abbrev, fullDay] of Object.entries(DAY_ABBREVS)) {
      if (line.includes(abbrev) && line.length < 30) {
        currentDay = fullDay;
        break;
      }
    }

    // Try to detect lines that have: time slot + subject
    const timeMatch = extractTimeSlots(lines[i]);
    if (timeMatch.length > 0 && currentDay) {
      const timeStr = timeMatch[0].full;
      // The subject is whatever text is on this line that isn't the time
      const subjectPart = lines[i]
        .replace(timeMatch[0].full, '')
        .replace(/[-–|:]/g, '')
        .trim();

      if (subjectPart.length > 1) {
        slots.push({
          day: currentDay,
          time: timeStr,
          subject: capitalizeWords(subjectPart),
          room: '',
          type: detectType(subjectPart)
        });
      }
    }
  }

  // Fallback: if no structured result, try table-style parsing
  if (slots.length === 0) {
    slots.push(...tableFallbackParser(lines));
  }

  return slots;
}

function tableFallbackParser(lines) {
  const slots = [];
  const timePattern = /\d{1,2}[:.]\d{2}/;
  
  let currentDay = null;
  for (const line of lines) {
    const lower = line.toLowerCase();

    for (const [abbrev, fullDay] of Object.entries(DAY_ABBREVS)) {
      if (lower.startsWith(abbrev)) {
        currentDay = fullDay;
        break;
      }
    }

    if (timePattern.test(line) && currentDay) {
      const parts = line.split(/\s{2,}|\t|\|/);
      if (parts.length >= 2) {
        const timePart = parts.find(p => timePattern.test(p)) || parts[0];
        const subjectPart = parts.filter(p => !timePattern.test(p) && p.trim()).join(' ').trim();
        if (subjectPart) {
          slots.push({
            day: currentDay,
            time: timePart.trim(),
            subject: capitalizeWords(subjectPart),
            room: '',
            type: detectType(subjectPart)
          });
        }
      }
    }
  }
  return slots;
}

function detectType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('lab') || lower.includes('practical')) return 'lab';
  if (lower.includes('free') || lower.includes('break') || lower.includes('lunch')) return 'free';
  return 'lecture';
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = { runOCR, parseOCRText };
