const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const ServiceProvider = require('../models/ServiceProvider');
const Review = require('../models/Review');

// Admin Middleware (Simple check)
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.email !== 'admin@example.com') {
        return res.status(403).json({ message: 'Admin access denied', user: req.user });
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
            { verificationStatus: 'pending_interview_availability' },
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

// --- NEW ENHANCEMENTS ---

// Get All Providers with Sort, Filter & Search
router.get('/providers/all', auth, adminAuth, async (req, res) => {
    try {
        let { search, category, sortBy, order } = req.query;
        let query = {};

        // Search (Name, Email, or Phone)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by Category
        if (category && category !== 'All') {
            query.category = category;
        }

        // Sorting
        let sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = order === 'desc' ? -1 : 1;
        } else {
            sortOptions = { createdAt: -1 }; // Default new first
        }

        const providers = await ServiceProvider.find(query).sort(sortOptions).select('-password');
        res.json(providers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Reviews for a Specific Provider
router.get('/reviews/:providerId', auth, adminAuth, async (req, res) => {
    try {
        const reviews = await Review.find({ provider: req.params.providerId })
            .populate('client', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
