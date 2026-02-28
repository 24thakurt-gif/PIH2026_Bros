const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true },
    frequency: { type: Number, required: true, default: 1 },
    times: [{ type: String }],
    totalQuantity: { type: Number, default: 30 },
    dosesTaken: { type: Number, default: 0 },
    instruction: { type: String, default: 'anytime' },
    sideEffects: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
