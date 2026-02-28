const router = require('express').Router();
const auth = require('../middleware/auth');
const Document = require('../models/Document');

router.use(auth);

// GET /api/documents
router.get('/', async (req, res) => {
    try {
        // Return docs without fileData for listing (too large)
        const docs = await Document.find({ userId: req.user.id })
            .select('-fileData')
            .sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch documents.' });
    }
});

// GET /api/documents/:id – Get single doc with file data
router.get('/:id', async (req, res) => {
    try {
        const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch document.' });
    }
});

// POST /api/documents
router.post('/', async (req, res) => {
    try {
        const doc = new Document({ ...req.body, userId: req.user.id });
        await doc.save();
        // Return without fileData
        const saved = doc.toObject();
        delete saved.fileData;
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: 'Failed to upload document.' });
    }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
    try {
        const doc = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        res.json({ message: 'Document deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete document.' });
    }
});

// PUT /api/documents/:id – Update (metadata only, not file)
router.put('/:id', async (req, res) => {
    try {
        const { title, category, date, notes } = req.body;
        const doc = await Document.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { title, category, date, notes },
            { new: true }
        ).select('-fileData');
        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update document.' });
    }
});

module.exports = router;
