const mongoose = require('mongoose');

const roles = ['masterAdmin', 'admin', 'poc', 'dc'];

// NITT roll number branch mapping
// Roll number format: DDDYYXXX where first 4 chars = degree+department
const BRANCH_MAP = {
  '1011': 'Civil Engineering',
  '1021': 'Computer Science & Engineering',
  '1031': 'Electrical & Electronics Engineering',
  '1041': 'Electronics & Communication Engineering',
  '1051': 'Instrumentation & Control Engineering',
  '1061': 'Mechanical Engineering',
  '1071': 'Metallurgical & Materials Engineering',
  '1081': 'Production Engineering',
  '1091': 'Chemical Engineering',
  '1101': 'Architecture',
  '1111': 'Energy & Environmental Engineering',
  '1121': 'Electronics & Instrumentation Engineering',
};

/**
 * Extract branch code from a NITT email (e.g. 112125005@nitt.edu → "1121")
 * The first 4 digits of the roll number encode degree+department.
 */
function getBranchFromEmail(email) {
  if (!email) return null;
  const rollNumber = email.split('@')[0];
  if (!rollNumber || rollNumber.length < 4) return null;
  return rollNumber.substring(0, 4);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    role: { type: String, enum: roles, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
module.exports.roles = roles;
module.exports.getBranchFromEmail = getBranchFromEmail;
module.exports.BRANCH_MAP = BRANCH_MAP;
