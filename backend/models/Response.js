const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    dcUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamName: { type: String },
    answers: [answerSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Response', responseSchema);

