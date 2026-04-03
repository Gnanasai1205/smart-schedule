const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Timetable = require('../models/Timetable');
const { runOCR, parseOCRText } = require('../services/ocrParser');
const { parseTimetableOCR: groqParseTimetable } = require('../services/groqService');

// Multer config — store uploads/timetable/ locally
const uploadDir = path.join(__dirname, '../../uploads/timetable');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (_, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and WebP images are accepted'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// @desc   Upload image and run OCR + Groq AI to extract timetable slots
// @route  POST /api/timetable/upload
// @access Private (Student or Teacher)
const uploadTimetable = [
  // Handle multer errors explicitly (needed for Express 5 compat)
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided. Make sure field name is "image".' });
    }

    // Normalize path — Tesseract needs forward slashes on Windows
    const imagePath = req.file.path.replace(/\\/g, '/');

    try {
      console.log('[OCR] Starting Tesseract on:', imagePath);

      // Step 1: Tesseract OCR (await before deleting file)
      const { text, confidence } = await runOCR(imagePath);
      console.log(`[OCR] Tesseract done. Confidence: ${confidence}%, text length: ${text.length}`);

      // Cleanup only AFTER OCR completes
      fs.unlink(req.file.path, () => {});

      if (!text || text.trim().length < 5) {
        return res.json({
          success: true,
          slots: [],
          rawText: text,
          confidence,
          method: 'none',
          message: 'OCR could not read text from this image. Try a clearer, higher-contrast image.'
        });
      }

      // Step 2: Groq AI parse (primary) — smarter than regex
      let slots = [];
      let method = 'groq';
      try {
        slots = await groqParseTimetable(text);
        console.log(`[Groq] Parsed ${slots.length} slots`);
      } catch (groqErr) {
        console.warn('[Groq] Parse failed, falling back to regex:', groqErr.message);
        slots = parseOCRText(text);
        method = 'regex';
      }

      res.json({
        success: true,
        slots,
        rawText: text,
        confidence,
        method,
        message: slots.length === 0
          ? 'OCR ran but could not detect structured timetable. Please add entries manually.'
          : `Extracted ${slots.length} time slots (${confidence}% OCR confidence, ${method === 'groq' ? 'AI-parsed' : 'regex-parsed'}).`
      });
    } catch (error) {
      // Cleanup on error too
      fs.unlink(req.file.path, () => {});
      console.error('[OCR Error]', error);
      res.status(500).json({ message: 'OCR processing failed: ' + error.message });
    }
  }
];

// @desc   Save confirmed timetable to database
// @route  POST /api/timetable/save
// @access Private
const saveTimetable = async (req, res) => {
  const { slots } = req.body;
  if (!slots || !Array.isArray(slots)) {
    return res.status(400).json({ message: 'Slots array is required' });
  }

  try {
    const timetable = await Timetable.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        role: req.user.role,
        slots,
        ocrConfidence: req.body.confidence || null
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Timetable saved successfully', data: timetable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get timetable for logged-in user
// @route  GET /api/timetable/my
// @access Private
const getMyTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ user: req.user._id });
    if (!timetable) return res.json({ success: true, data: null });
    res.json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get timetable for specific userId (admin use)
// @route  GET /api/timetable/:userId
// @access Private (Admin)
const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ user: req.params.userId }).populate('user', 'name email');
    if (!timetable) return res.status(404).json({ message: 'No timetable found' });
    res.json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadTimetable, saveTimetable, getMyTimetable, getTimetableById };
