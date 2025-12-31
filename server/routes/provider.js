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

module.exports = router;
