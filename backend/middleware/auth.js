const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// requireRole accepts roles; masterAdmin always passes admin checks
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  // masterAdmin has all privileges
  if (req.user.role === 'masterAdmin') {
    return next();
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

module.exports = { auth, requireRole };
