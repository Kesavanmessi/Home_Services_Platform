const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const ServiceProvider = require('../models/ServiceProvider');
const ServiceRequest = require('../models/ServiceRequest');
const Review = require('../models/Review');
const User = require('../models/User');
const { sendDocumentVerificationNotification, sendAccountStatusNotification } = require('../services/emailService');

// Admin Middleware (Simple check)
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
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
        if (provider) {
            await sendDocumentVerificationNotification(provider.email, provider.name, 'rejected', 'Documents rejected by admin.');
        }
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
        if (provider) {
            await sendDocumentVerificationNotification(provider.email, provider.name, 'approved');
        }
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
        if (provider) {
            await sendDocumentVerificationNotification(provider.email, provider.name, 'rejected', 'Verification/Interview Failed.');
        }
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

// --- JOB REPORTS ---

// Get All Jobs (Detailed Report List)
router.get('/jobs/report', auth, adminAuth, async (req, res) => {
    try {
        const jobs = await ServiceRequest.find()
            .populate('client', 'name email phone')
            .populate('provider', 'name email phone category')
            .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Single Job Full Details (Timeline + Reviews)
router.get('/jobs/:id/details', auth, adminAuth, async (req, res) => {
    try {
        const job = await ServiceRequest.findById(req.params.id)
            .populate('client', 'name email phone')
            .populate('provider', 'name email phone category');

        if (!job) return res.status(404).json({ message: 'Job not found' });

        // Fetch Reviews for this job
        const reviews = await Review.find({ request: req.params.id })
            .populate('reviewer', 'name')
            .populate('client', 'name')
            .populate('provider', 'name');

        res.json({ job, reviews });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- USER MANAGEMENT & BAN SYSTEM ---

// Get All Users (Clients)
router.get('/users/all', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find({ role: 'client' }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update User Status (Suspend/Ban)
// Update User Status (Suspend/Ban)
router.put('/users/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { status, reason, suspensionDuration } = req.body; // suspensionDuration in days
        let updateData = { accountStatus: status, banReason: reason };

        if (status === 'suspended' && suspensionDuration) {
            updateData.suspensionEndTime = new Date(Date.now() + suspensionDuration * 24 * 60 * 60 * 1000);
        } else if (status === 'active' || status === 'banned') {
            updateData.suspensionEndTime = null;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (user) {
            await sendAccountStatusNotification(user.email, user.name, status, reason, suspensionDuration);
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update Provider Status (Suspend/Ban)
// Update Provider Status (Suspend/Ban)
router.put('/providers/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { status, reason, suspensionDuration } = req.body;
        let updateData = { accountStatus: status, banReason: reason };

        if (status === 'suspended' && suspensionDuration) {
            updateData.suspensionEndTime = new Date(Date.now() + suspensionDuration * 24 * 60 * 60 * 1000);
        } else if (status === 'active' || status === 'banned') {
            updateData.suspensionEndTime = null;
        }

        const provider = await ServiceProvider.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (provider) {
            await sendAccountStatusNotification(provider.email, provider.name, status, reason, suspensionDuration);
        }

        res.json(provider);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
