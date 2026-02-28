const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'other' },
    date: { type: String, default: '' },
    notes: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileType: { type: String, default: '' },
    fileData: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
