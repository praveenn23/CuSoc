const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
    getStats,
    getRegistrations,
    deleteRegistration,
    getEvent,
    updateEvent,
    adminLogin,
} = require('../controllers/adminController');

// Public — login (no auth middleware)
router.post('/login', adminLogin);

// Protected — all routes below require the admin key
router.use(adminAuth);

router.get('/stats', getStats);
router.get('/registrations', getRegistrations);
router.delete('/registrations/:id', deleteRegistration);
router.get('/event', getEvent);
router.put('/event', updateEvent);

module.exports = router;
