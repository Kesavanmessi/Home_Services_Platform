const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceProvider = require('../models/ServiceProvider');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper: Check and Expire Timeout
const checkTimeout = async (request) => {
    if (request.status === 'accepted' && request.acceptedAt) {
        const timeout = 15 * 60 * 1000; // 15 Minutes
        if (Date.now() - new Date(request.acceptedAt).getTime() > timeout) {
            request.status = 'open';
            request.provider = null;
            request.acceptedAt = null;
            request.acceptanceFeePaid = false; // Refund? Prompt says "Do not deduct confirmation fee". Implications on acceptance fee are vague, assume forfeit or refund. Logic: "Provider is released".
            // Simpler: Just reset.
            await request.save();
            return true; // Expired
        }
    }
    return false;
};

// Create Request (Client)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can post requests' });

    try {
        const { category, problemDescription, location } = req.body;

        const newRequest = new ServiceRequest({
            client: req.user.id,
            category,
            problemDescription,
            location,
            status: 'open'
        });

        await newRequest.save();

        // Notify Providers? (Too many, skip for now or broadcast)

        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// List Nearby Requests (Provider)
router.get('/nearby', auth, async (req, res) => {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Only providers can view requests' });

    try {
        const provider = await ServiceProvider.findById(req.user.id);
        if (!provider) return res.status(404).json({ message: 'Provider not found' });

        if (!provider.isVerified) return res.status(403).json({ message: 'Provider not verified' });
        if (!provider.isAvailable) return res.status(200).json([]); // Return empty if unavailable

        // Fetch requests
        const requests = await ServiceRequest.find({
            category: provider.category,
            status: 'open'
        }).populate('client', 'name location');

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get My Requests (Client)
router.get('/my-requests', auth, async (req, res) => {
    try {
        // Expire timed out requests on fetch
        const requests = await ServiceRequest.find({ client: req.user.id }).sort({ createdAt: -1 });

        // Check timeouts
        for (let req of requests) {
            await checkTimeout(req);
        }

        // Re-fetch to get populated data and guaranteed status
        const updatedRequests = await ServiceRequest.find({ client: req.user.id })
            .populate('provider', 'name rating phone isVerified')
            .sort({ createdAt: -1 });

        res.json(updatedRequests);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Single Request Details
router.get('/:id', auth, async (req, res) => {
    try {
        let request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Check Timeout
        if (await checkTimeout(request)) {
            // Reload if modified
            request = await ServiceRequest.findById(req.params.id);
        }

        await request.populate('client', 'name phone location');
        await request.populate('provider', 'name phone rating isVerified jobsCompleted');

        res.json(request);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Accept Request (Provider)
router.put('/:id/accept', auth, async (req, res) => {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Only providers can accept requests' });

    try {
        const provider = await ServiceProvider.findById(req.user.id);
        if (!provider.isAvailable) return res.status(400).json({ message: 'You are marked as away/unavailable' });

        // Daily Limit Logic
        const today = new Date().setHours(0, 0, 0, 0);
        const lastDate = provider.lastAcceptanceDate ? new Date(provider.lastAcceptanceDate).setHours(0, 0, 0, 0) : 0;

        let dailyCount = provider.dailyAcceptanceCount || 0;
        if (lastDate !== today) {
            dailyCount = 0; // Reset
        }

        if (dailyCount >= 3) {
            return res.status(400).json({ message: 'Daily acceptance limit (3) reached' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'open' && request.status !== 'pending') return res.status(400).json({ message: 'Request already accepted or not open' });

        // Simulate Fee
        const feeAmount = 30;

        // Update Request
        request.provider = req.user.id;
        request.status = 'accepted';
        request.acceptanceFeePaid = true;
        request.acceptedAt = Date.now();
        await request.save();

        // Update Provider Limits
        provider.dailyAcceptanceCount = dailyCount + 1;
        provider.lastAcceptanceDate = Date.now();
        await provider.save();

        // Log Transaction
        await Transaction.create({
            user: req.user.id,
            userType: 'ServiceProvider',
            amount: feeAmount,
            type: 'acceptance_fee',
            requestId: request._id
        });

        // Notify Client
        await Notification.create({
            user: request.client,
            userType: 'User',
            message: `A provider (${provider.name}) has accepted your request! Confirm within 15 mins.`
        });

        res.json({ message: 'Request accepted', request });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Confirm Provider (Client)
router.put('/:id/confirm', auth, async (req, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can confirm' });

    try {
        let request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        // Check timeout before confirming
        if (await checkTimeout(request)) {
            return res.status(400).json({ message: 'Acceptance expired. Provider released.' });
        }

        if (request.status !== 'accepted') return res.status(400).json({ message: 'Request not in accepted state' });

        // Simulate Fee
        const feeAmount = 20;

        request.status = 'confirmed';
        request.confirmationFeePaid = true;
        await request.save();

        await ServiceProvider.findByIdAndUpdate(request.provider, { $inc: { jobsCompleted: 1 } });

        await Transaction.create({
            user: req.user.id,
            userType: 'User',
            amount: feeAmount,
            type: 'confirmation_fee',
            requestId: request._id
        });

        // Notify Provider
        await Notification.create({
            user: request.provider,
            userType: 'ServiceProvider',
            message: `Client has confirmed! You can now view their contact details.`
        });

        res.json({ message: 'Provider confirmed', request });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Cancel Request (Provider) -> Penalty
router.put('/:id/cancel', auth, async (req, res) => {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Only providers can cancel' });

    try {
        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.provider.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        if (request.status !== 'accepted') return res.status(400).json({ message: 'Can only cancel accepted requests' });

        // Penalize Provider
        await ServiceProvider.findByIdAndUpdate(req.user.id, { $inc: { cancellationCount: 1 } });

        // Reset Request
        request.status = 'open';
        request.provider = null;
        request.acceptedAt = null;
        await request.save();

        // Notify Client
        await Notification.create({
            user: request.client,
            userType: 'User',
            message: `Provider cancelled the request. It is now open for others.`
        });

        res.json({ message: 'Request cancelled. Cancellation recorded.' });

    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});


module.exports = router;
