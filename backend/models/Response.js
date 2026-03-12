const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    text: { type: String, default: '' },
    fileUrl: { type: String },
    fileType: { type: String, enum: ['audio', 'video', null], default: null },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    dcUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branchCode: { type: String },
    dcEditCount: { type: Number, default: 0, min: 0 },
    teamName: { type: String },
    answers: [answerSchema],
  },
  { timestamps: true }
);

// Hard guardrails: one response per user per event, and one response per branch per event.
responseSchema.index({ event: 1, dcUser: 1 }, { unique: true });
responseSchema.index(
  { event: 1, branchCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      branchCode: { $type: 'string' },
    },
  }
);

module.exports = mongoose.model('Response', responseSchema);
