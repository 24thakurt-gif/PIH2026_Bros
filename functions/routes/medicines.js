const router = require('express').Router();
const auth = require('../middleware/auth');
const Medicine = require('../models/Medicine');

// All routes require authentication
router.use(auth);

// GET /api/medicines – List all
router.get('/', async (req, res) => {
    try {
        const medicines = await Medicine.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch medicines.' });
    }
});

// POST /api/medicines – Create
router.post('/', async (req, res) => {
    try {
        const med = new Medicine({ ...req.body, userId: req.user.id });
        await med.save();
        res.status(201).json(med);
    } catch (err) {
        res.status(400).json({ error: 'Failed to add medicine.' });
    }
});

// PUT /api/medicines/:id – Update
router.put('/:id', async (req, res) => {
    try {
        const med = await Medicine.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!med) return res.status(404).json({ error: 'Medicine not found.' });
        res.json(med);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update medicine.' });
    }
});

// DELETE /api/medicines/:id
router.delete('/:id', async (req, res) => {
    try {
        const med = await Medicine.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!med) return res.status(404).json({ error: 'Medicine not found.' });
        res.json({ message: 'Medicine deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete medicine.' });
    }
});

// PATCH /api/medicines/:id/dose – Take a dose
router.patch('/:id/dose', async (req, res) => {
    try {
        const med = await Medicine.findOne({ _id: req.params.id, userId: req.user.id });
        if (!med) return res.status(404).json({ error: 'Medicine not found.' });

        med.dosesTaken += 1;
        await med.save();
        res.json(med);
    } catch (err) {
        res.status(500).json({ error: 'Failed to record dose.' });
    }
});

// PATCH /api/medicines/:id/restock – Restock
router.patch('/:id/restock', async (req, res) => {
    try {
        const { amount } = req.body;
        const med = await Medicine.findOne({ _id: req.params.id, userId: req.user.id });
        if (!med) return res.status(404).json({ error: 'Medicine not found.' });

        med.totalQuantity += (amount || 30);
        await med.save();
        res.json(med);
    } catch (err) {
        res.status(500).json({ error: 'Failed to restock medicine.' });
    }
});

module.exports = router;
