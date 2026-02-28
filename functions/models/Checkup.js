const mongoose = require('mongoose');

const checkupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    doctor: { type: String, default: '' },
    lastDate: { type: String, required: true },
    interval: { type: Number, default: 180 },
    notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Checkup', checkupSchema);
