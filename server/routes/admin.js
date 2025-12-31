const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ServiceProvider = require('../models/ServiceProvider');

// Admin Middleware (Simple check)
const adminAuth = (req, res, next) => {
    // In a real app, check req.user.role === 'admin'
    // For simplicity, we'll assume any logged in user with a specific email or role 'admin'
    if (req.user.role !== 'admin' && req.user.email !== 'admin@example.com') {
        return res.status(403).json({ message: 'Admin access denied' });
    }
    next();
};

// Get Pending Providers
router.get('/providers/pending', auth, adminAuth, async (req, res) => {
    try {
        const providers = await ServiceProvider.find({ isVerified: false });
        res.json(providers);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Approve Provider
router.put('/providers/:id/approve', auth, adminAuth, async (req, res) => {
    try {
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            { isVerified: true },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
