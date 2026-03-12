const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const Event = require('../models/Event');
const Response = require('../models/Response');
const Log = require('../models/Log');
const User = require('../models/User');
const { getBranchFromEmail } = User;
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── Multer config for audio/video uploads ──
const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
const uploadsDir = path.join(__dirname, '..', uploadDirName);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedAudio = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/aac', 'audio/x-m4a'];
  const allowedVideo = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
  if ([...allowedAudio, ...allowedVideo].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio and video files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// Helper to create a log entry
async function log(action, userId, eventId, details) {
  try {
    await Log.create({ action, user: userId, event: eventId, details });
  } catch (err) {
    console.error('Logging error:', err);
  }
}

// ── Upload a file (audio/video) ──
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl, filename: req.file.filename, size: req.file.size });
});

// Create event/form (admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, questions, pocUserIds, deadline, maxEdits } = req.body;
    const event = await Event.create({
      name,
      description,
      questions,
      pocUsers: pocUserIds || [],
      deadline: deadline || undefined,
      maxEdits: maxEdits || 0,
    });
    await log('EVENT_CREATED', req.user._id, event._id, `Admin created event "${event.name}"`);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List events (all roles, but POC only sees assigned events)
router.get('/', auth, async (req, res) => {
  let filter = {};
  if (req.user.role === 'poc') {
    filter = { pocUsers: req.user._id };
  }
  const events = await Event.find(filter).select('name description isActive deadline createdAt updatedAt');
  res.json(events);
});

// Get event details including questions (for filling or viewing)
router.get('/:id', auth, async (req, res) => {
  const event = await Event.findById(req.params.id).populate('pocUsers', 'name email');
  if (!event) return res.status(404).json({ message: 'Event not found' });

  // POC can only view events they are assigned to
  if (req.user.role === 'poc' && !event.pocUsers.some((u) => (u._id || u).equals(req.user._id))) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // For DC: check if they or someone from their branch already submitted
  if (req.user.role === 'dc') {
    const existing = await Response.findOne({ event: event._id, dcUser: req.user._id });
    const eventObj = event.toObject();
    eventObj.alreadyFilled = !!existing;
    eventObj.previousResponse = existing;

    // Also check if another DC from the same branch already submitted
    if (!existing) {
      const dcBranch = getBranchFromEmail(req.user.email);
      if (dcBranch) {
        // Find all DC users with the same branch prefix
        const sameBranchUsers = await User.find({
          role: 'dc',
          email: { $regex: `^${dcBranch}`, $options: 'i' },
        }).select('_id');
        const sameBranchIds = sameBranchUsers.map((u) => u._id);
        const branchResponse = await Response.findOne({
          event: event._id,
          dcUser: { $in: sameBranchIds },
        }).populate('dcUser', 'name email');
        if (branchResponse) {
          eventObj.branchAlreadyFilled = true;
          eventObj.branchFilledBy = branchResponse.dcUser?.name || 'Another Department Coordinator';
        }
      }
    }

    return res.json(eventObj);
  }

  res.json(event);
});

// Update event (admin or POC assigned to event)
router.put('/:id', auth, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const isAdmin = req.user.role === 'admin' || req.user.role === 'masterAdmin';
  const isPocForEvent =
    req.user.role === 'poc' && event.pocUsers.some((u) => u.equals(req.user._id));

  if (!isAdmin && !isPocForEvent) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { name, description, questions, isActive, pocUserIds, deadline, maxEdits } = req.body;
  if (name !== undefined) event.name = name;
  if (description !== undefined) event.description = description;
  if (questions !== undefined) event.questions = questions;
  if (isActive !== undefined) event.isActive = isActive;
  if (pocUserIds !== undefined) event.pocUsers = pocUserIds;
  if (deadline !== undefined) event.deadline = deadline;
  if (maxEdits !== undefined) event.maxEdits = maxEdits;

  await event.save();
  await log('EVENT_UPDATED', req.user._id, event._id, `${req.user.role} updated event "${event.name}"`);
  res.json(event);
});

// DC submits response for an event
router.post('/:id/responses', auth, requireRole('dc'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check deadline
    if (event.deadline && new Date() > new Date(event.deadline)) {
      return res.status(400).json({ message: 'The deadline for this form has passed' });
    }

    // Check if DC already submitted for this event
    const existing = await Response.findOne({ event: event._id, dcUser: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted a response for this event' });
    }

    // Check if another DC from the same branch already submitted
    const dcBranch = getBranchFromEmail(req.user.email);
    if (dcBranch) {
      const sameBranchUsers = await User.find({
        role: 'dc',
        email: { $regex: `^${dcBranch}`, $options: 'i' },
      }).select('_id');
      const sameBranchIds = sameBranchUsers.map((u) => u._id);
      const branchResponse = await Response.findOne({
        event: event._id,
        dcUser: { $in: sameBranchIds },
      }).populate('dcUser', 'name');
      if (branchResponse) {
        return res.status(400).json({
          message: `A Department Coordinator from your branch (${branchResponse.dcUser?.name || 'unknown'}) has already submitted a response for this event`,
        });
      }
    }

    const { teamName, answers } = req.body;

    const response = await Response.create({
      event: event._id,
      dcUser: req.user._id,
      teamName,
      answers,
    });
    await log('FORM_FILLED', req.user._id, event._id, `Department Coordinator "${req.user.name}" submitted response for team "${teamName}"`);
    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin + POC can see responses for an event
router.get('/:id/responses', auth, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const isAdmin = req.user.role === 'admin' || req.user.role === 'masterAdmin';
  const isPocForEvent =
    req.user.role === 'poc' && event.pocUsers.some((u) => u.equals(req.user._id));

  if (!isAdmin && !isPocForEvent) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const responses = await Response.find({ event: event._id }).populate('dcUser', 'name email');
  res.json(responses);
});

// POC or Admin or DC updates an existing response
router.put('/:id/responses/:responseId', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check permissions
    const isAdmin = req.user.role === 'admin' || req.user.role === 'masterAdmin';
    const isPocForEvent = req.user.role === 'poc' && event.pocUsers.some((u) => u.equals(req.user._id));
    const isDc = req.user.role === 'dc';

    if (!isAdmin && !isPocForEvent && !isDc) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const response = await Response.findById(req.params.responseId);
    if (!response || response.event.toString() !== event._id.toString()) {
      return res.status(404).json({ message: 'Response not found' });
    }

    if (isDc) {
      // Check if it's their own response
      if (response.dcUser.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden: You can only edit your own response' });
      }
      // Check maxedits
      if (response.editCount >= (event.maxEdits || 0)) {
        return res.status(403).json({ message: 'You have reached the maximum number of allowed edits' });
      }
      
      // Check deadline
      if (event.deadline && new Date() > new Date(event.deadline)) {
        return res.status(400).json({ message: 'The deadline for this form has passed' });
      }
      
      // Increment edit count
      response.editCount += 1;
    }

    const { teamName, answers } = req.body;
    if (teamName !== undefined) response.teamName = teamName;
    if (answers !== undefined) response.answers = answers;

    await response.save();
    await log('RESPONSE_UPDATED', req.user._id, event._id, `${req.user.role.toUpperCase()} updated response for team "${response.teamName}"`);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only: view activity logs
router.get('/admin/logs', auth, requireRole('admin'), async (req, res) => {
  const logs = await Log.find()
    .sort({ createdAt: -1 })
    .populate('user', 'name email role')
    .populate('event', 'name')
    .limit(200);
  res.json(logs);
});

module.exports = router;
