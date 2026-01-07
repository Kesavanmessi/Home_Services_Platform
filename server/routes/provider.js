const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ServiceProvider = require('../models/ServiceProvider');

// Toggle Availability
router.put('/availability', auth, async (req, res) => {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Access denied' });

    try {
        const provider = await ServiceProvider.findById(req.user.id);
        if (!provider) return res.status(404).json({ message: 'Provider not found' });

        provider.isAvailable = !provider.isAvailable;
        await provider.save();

        res.json({ isAvailable: provider.isAvailable });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Upload Verification Documents
router.post('/verification/upload', auth, async (req, res) => {
    try {
        const { idProof, selfie } = req.body;
        // In a real app, you would upload these to S3/Cloudinary and save the URLs.
        // For this demo, we assume the frontend sends Base64 or we just store the "mock" path.

        const provider = await ServiceProvider.findByIdAndUpdate(
            req.user.id,
            {
                documents: { idProof, selfie },
                verificationStatus: 'pending_verification'
            },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Provider Profile (Modified to include full details)
router.get('/profile', auth, async (req, res) => {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Access denied' });
    try {
        const provider = await ServiceProvider.findById(req.user.id).select('-password');
        if (!provider) return res.status(404).json({ message: 'Provider profile not found' });
        res.json(provider);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update Settings
router.put('/settings', auth, async (req, res) => {
    try {
        const { workingHours, serviceRadius, coordinates } = req.body;
        const provider = await ServiceProvider.findByIdAndUpdate(
            req.user.id,
            { workingHours, serviceRadius, coordinates },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        console.error("Settings Update Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Submit Interview Availability
router.post('/verification/availability', auth, async (req, res) => {
    try {
        const { availability } = req.body; // Array of {date, time}

        const provider = await ServiceProvider.findByIdAndUpdate(
            req.user.id,
            {
                interviewAvailability: availability,
                verificationStatus: 'pending_admin_schedule'
            },
            { new: true }
        );
        res.json(provider);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
