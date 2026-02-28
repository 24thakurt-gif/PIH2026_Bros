const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const existing = await User.findOne({ email });
        if (existing && existing.verified) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        // If unverified account exists, update it
        const code = generateOTP();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let user;
        if (existing && !existing.verified) {
            existing.name = name;
            existing.password = password;
            existing.verifyCode = code;
            existing.verifyExpires = expiry;
            await existing.save();
            user = existing;
        } else {
            user = new User({
                name, email, password,
                verifyCode: code,
                verifyExpires: expiry
            });
            await user.save();
        }

        // Return the OTP code for display (in production, send via email)
        res.status(201).json({
            message: 'Verification code sent to your email.',
            email: user.email,
            needsVerification: true,
            // In production, remove this line and send code via email service
            _devCode: code
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ error: 'Email and verification code are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (user.verified) {
            return res.status(400).json({ error: 'Email already verified.' });
        }
        if (user.verifyCode !== code) {
            return res.status(400).json({ error: 'Invalid verification code.' });
        }
        if (user.verifyExpires && user.verifyExpires < new Date()) {
            return res.status(400).json({ error: 'Verification code expired. Please register again.' });
        }

        user.verified = true;
        user.verifyCode = '';
        user.verifyExpires = null;
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user, message: 'Email verified successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// POST /api/auth/resend-code
router.post('/resend-code', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        if (user.verified) return res.status(400).json({ error: 'Already verified.' });

        const code = generateOTP();
        user.verifyCode = code;
        user.verifyExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        res.json({
            message: 'New verification code sent.',
            _devCode: code
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!user.verified) {
            return res.status(403).json({ error: 'Please verify your email before logging in.', needsVerification: true, email: user.email });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;
