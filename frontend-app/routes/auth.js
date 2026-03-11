const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

const MASTER_ADMIN_EMAIL = (process.env.MASTER_ADMIN_EMAIL || '112125005@nitt.edu').toLowerCase();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Google Login ────────────────────────────────────────────────
router.post('/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify the token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload['email'];

    if (!email) {
      return res.status(400).json({ message: 'No email found in token' });
    }

    const normalizedEmail = email.toLowerCase();
    const name = payload['name'] || normalizedEmail.split('@')[0];

    // Find user in our database
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Check if this is the master admin logging in for the first time
      if (normalizedEmail === MASTER_ADMIN_EMAIL) {
        user = await User.create({
          name,
          email: normalizedEmail,
          role: 'masterAdmin',
        });
      } else {
        // Unregistered user — not allowed
        return res.status(403).json({
          message: 'You are not authorized to use this application. Contact the admin.',
        });
      }
    }

    // Issue our own JWT
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Google login error:', err.message, err.stack);
    res.status(500).json({ message: 'Authentication failed', error: err.message });
  }
});

// ─── Get profile ──────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

// ─── Admin/MasterAdmin creates users ──────────────────────────────
router.post('/admin/create-user', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    // Only masterAdmin can create admin users
    if (role === 'admin' && req.user.role !== 'masterAdmin') {
      return res.status(403).json({ message: 'Only the master admin can create admin users' });
    }

    // Cannot create masterAdmin role
    if (role === 'masterAdmin') {
      return res.status(403).json({ message: 'Cannot create another master admin' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({ name, email, role });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── List all users (master admin only) ───────────────────────────
router.get('/admin/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('_id name email role createdAt');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Delete user (master admin only) ──────────────────────────────
router.delete('/admin/delete-user/:id', auth, async (req, res) => {
  try {
    // Only masterAdmin can delete users
    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ message: 'Only the master admin can delete users' });
    }

    // Cannot delete yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── List POC users (admin/masterAdmin – for assigning to events) ─
router.get('/users/poc', auth, requireRole('admin'), async (req, res) => {
  const pocs = await User.find({ role: 'poc' }).select('_id name email');
  res.json(pocs);
});

module.exports = router;
