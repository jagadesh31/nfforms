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
    teamName: { type: String },
    answers: [answerSchema],
    editCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Response', responseSchema);
