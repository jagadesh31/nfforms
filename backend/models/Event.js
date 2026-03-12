const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    required: { type: Boolean, default: true },
    isRollNumber: { type: Boolean, default: false },
    isAudio: { type: Boolean, default: false },
    isVideo: { type: Boolean, default: false },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    deadline: { type: Date },
    maxEdits: { type: Number, default: 0 },
    questions: [questionSchema],
    pocUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
