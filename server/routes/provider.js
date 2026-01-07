const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ServiceProvider = require('../models/ServiceProvider');
const ServiceRequest = require('../models/ServiceRequest');

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

// Get Provider Availability Stats (Pre-Request Report)
router.get('/stats', auth, async (req, res) => {
    try {
        const { category, lat, lng } = req.query;
        if (!category || !lat || !lng) return res.status(400).json({ message: 'Missing parameters' });

        const uLat = parseFloat(lat);
        const uLng = parseFloat(lng);
        const R = 6371; // Earth Radius in km

        // 1. Get all providers in category
        const allProviders = await ServiceProvider.find({ category, isVerified: true });

        let stats = {
            total: 0,
            availableNow: 0,
            busy: 0,
            offline: 0
        };

        // 2. Filter by Location & Calculate Stats
        for (const provider of allProviders) {
            // Distance Check
            if (!provider.coordinates || !provider.coordinates.lat) continue;

            const pLat = provider.coordinates.lat * Math.PI / 180;
            const pLng = provider.coordinates.lng * Math.PI / 180;
            const rLat = uLat * Math.PI / 180;
            const rLng = uLng * Math.PI / 180;

            const dLat = rLat - pLat;
            const dLng = rLng - pLng;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(pLat) * Math.cos(rLat) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;

            // Use Provider's Service Radius (default 20km)
            if (d <= (provider.serviceRadius || 20)) {
                stats.total++;

                if (!provider.isAvailable) {
                    stats.offline++;
                } else {
                    // Provider is Online. Check if Busy.
                    const activeJob = await ServiceRequest.findOne({
                        provider: provider._id,
                        status: { $in: ['accepted', 'confirmed', 'in_progress'] }
                    });

                    if (activeJob) {
                        stats.busy++;
                    } else {
                        stats.availableNow++;
                    }
                }
            }
        }

        res.json(stats);
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
