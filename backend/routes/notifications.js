const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { sendMail, medicineDueEmail, lowStockEmail } = require('../utils/mailer');

router.use(auth);

// POST /api/notifications/medicine-reminder
// Called by frontend when medicine reminder fires
router.post('/medicine-reminder', async (req, res) => {
    try {
        const { medicines } = req.body; // [{ name, dosage, time, instruction }]
        if (!medicines || medicines.length === 0) {
            return res.status(400).json({ error: 'No medicines provided.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const html = medicineDueEmail(user.name, medicines);
        const sent = await sendMail(user.email, '💊 MedVault: Time to Take Your Medicine!', html);

        res.json({ sent, message: sent ? 'Reminder email sent.' : 'Email delivery failed.' });
    } catch (err) {
        console.error('Medicine reminder email error:', err.message);
        res.status(500).json({ error: 'Failed to send reminder email.' });
    }
});

// POST /api/notifications/low-stock
// Called by frontend when low stock is detected
router.post('/low-stock', async (req, res) => {
    try {
        const { medicines } = req.body; // [{ name, remaining, total }]
        if (!medicines || medicines.length === 0) {
            return res.status(400).json({ error: 'No medicines provided.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const html = lowStockEmail(user.name, medicines);
        const sent = await sendMail(user.email, '⚠️ MedVault: Low Stock Alert!', html);

        res.json({ sent, message: sent ? 'Low stock alert sent.' : 'Email delivery failed.' });
    } catch (err) {
        console.error('Low stock email error:', err.message);
        res.status(500).json({ error: 'Failed to send low stock email.' });
    }
});

module.exports = router;
