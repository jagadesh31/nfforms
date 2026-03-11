const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
        details: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Log', logSchema);
