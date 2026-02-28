/* ============================================
   MedVault – Firebase Cloud Function Entry Point
   Wraps Express app as a Cloud Function
   ============================================ */

const functions = require('firebase-functions');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment config from Firebase Functions config or .env
const JWT_SECRET = process.env.JWT_SECRET || functions.config().medvault?.jwt_secret || 'medvault_default_secret';
const MONGO_URI = process.env.MONGO_URI || functions.config().medvault?.mongo_uri || '';

// Set environment variables for middleware/models that read from process.env
process.env.JWT_SECRET = JWT_SECRET;
process.env.MONGO_URI = MONGO_URI;

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection (cached across function invocations)
let isConnected = false;

async function connectDB() {
    if (isConnected) return;
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not configured. Set it via: firebase functions:config:set medvault.mongo_uri="your_mongodb_atlas_uri"');
        throw new Error('MONGO_URI not configured');
    }
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        isConnected = false;
        throw err;
    }
}

// Ensure DB is connected before handling any request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        return res.status(503).json({ error: 'Database unavailable. Please try again later.' });
    }
});

// API Routes (registered AFTER DB middleware)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/checkups', require('./routes/checkups'));
app.use('/api/documents', require('./routes/documents'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
