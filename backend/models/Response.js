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
    // dcEditCount removed: no edits allowed, only submissions
    teamName: { type: String },
    answers: [answerSchema],
  },
  { timestamps: true }
);

// Indexes for performance (not unique anymore to allow multiple submissions)
responseSchema.index({ event: 1, dcUser: 1 });
responseSchema.index({ event: 1, branchCode: 1 });

module.exports = mongoose.model('Response', responseSchema);
