/* ============================================
   MedVault – Express Server
   ============================================ */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: [
        'https://medvault-app-3493.web.app',
        'https://medvault-app-3493.firebaseapp.com',
        'http://localhost:5000',
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/checkups', require('./routes/checkups'));
app.use('/api/documents', require('./routes/documents'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 MedVault server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('\n💡 Make sure MongoDB is running. You can:');
        console.log('   1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
        console.log('   2. Or use MongoDB Atlas (free cloud): https://www.mongodb.com/atlas');
        console.log('   Then update MONGO_URI in backend/.env');
        process.exit(1);
    });
