// Admin panel added — restart to pick up ADMIN_SECRET_KEY from .env
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const eventRoutes = require('./routes/eventRoutes');
const otpRoutes = require('./routes/otpRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
// ── CORS ────────────────────────────────────────────────────────────────────
// Permanent CORS fix: Handle preflights manually for Vercel stability
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Also keep the cors package for extra safety on non-OPTIONS requests
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/event', eventRoutes);
app.use('/', otpRoutes);           // /send-otp  /verify-otp
app.use('/register', registrationRoutes);
app.use('/admin', adminRoutes);         // /admin/login  /admin/registrations  etc.

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start server (for local dev) ─────────────────────────────────────────────
// On Vercel, the app is exported below and `listen` is never called.
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
}

// ── Export for Vercel serverless ─────────────────────────────────────────────
module.exports = app;
