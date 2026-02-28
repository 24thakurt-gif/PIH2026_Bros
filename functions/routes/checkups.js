const router = require('express').Router();
const auth = require('../middleware/auth');
const Checkup = require('../models/Checkup');

router.use(auth);

// GET /api/checkups
router.get('/', async (req, res) => {
    try {
        const checkups = await Checkup.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(checkups);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch checkups.' });
    }
});

// POST /api/checkups
router.post('/', async (req, res) => {
    try {
        const checkup = new Checkup({ ...req.body, userId: req.user.id });
        await checkup.save();
        res.status(201).json(checkup);
    } catch (err) {
        res.status(400).json({ error: 'Failed to add checkup.' });
    }
});

// PUT /api/checkups/:id
router.put('/:id', async (req, res) => {
    try {
        const checkup = await Checkup.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!checkup) return res.status(404).json({ error: 'Checkup not found.' });
        res.json(checkup);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update checkup.' });
    }
});

// DELETE /api/checkups/:id
router.delete('/:id', async (req, res) => {
    try {
        const checkup = await Checkup.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!checkup) return res.status(404).json({ error: 'Checkup not found.' });
        res.json({ message: 'Checkup deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete checkup.' });
    }
});

module.exports = router;
