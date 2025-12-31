const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ServiceProvider = require('../models/ServiceProvider');

// Admin Middleware (Simple check)
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.email !== 'admin@example.com') {
        return res.status(403).json({ message: 'Admin access denied' });
    }
    next();
};

// Get Pending Providers (Any stage of verification)
router.get('/providers/pending', auth, adminAuth, async (req, res) => {
    try {
        const providers = await ServiceProvider.find({
            verificationStatus: { $ne: 'verified' }
        });
        res.json(providers);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Verify Documents
router.put('/providers/:id/verify-docs', auth, adminAuth, async (req, res) => {
    try {
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: 'documents_verified' },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Reject Documents
router.put('/providers/:id/reject-docs', auth, adminAuth, async (req, res) => {
    try {
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: 'documents_rejected' },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Schedule Interview
router.put('/providers/:id/schedule-interview', auth, adminAuth, async (req, res) => {
    try {
        const { date } = req.body;
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            {
                verificationStatus: 'interview_scheduled',
                interviewDate: date
            },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Final Approve (Pass Interview)
router.put('/providers/:id/approve', auth, adminAuth, async (req, res) => {
    try {
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            {
                isVerified: true,
                verificationStatus: 'verified',
                trialJobsLeft: 3 // Grant 3 trial jobs
            },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Fail Interview/Verification
router.put('/providers/:id/fail', auth, adminAuth, async (req, res) => {
    try {
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            {
                isVerified: false,
                verificationStatus: 'failed'
            },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
