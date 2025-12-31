const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceProvider = require('../models/ServiceProvider');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Create Request (Client)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can post requests' });

    try {
        const { category, problemDescription, location } = req.body;

        const newRequest = new ServiceRequest({
            client: req.user.id,
            category,
            problemDescription,
            location
        });

        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// List Requests (Provider)
// Should filter by category and location (optional)
router.get('/nearby', auth, async (req, res) => {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Only providers can view requests' });

    try {
        // Get provider details to match category
        const provider = await ServiceProvider.findById(req.user.id);
        if (!provider) return res.status(404).json({ message: 'Provider not found' });

        if (!provider.isVerified) return res.status(403).json({ message: 'Provider not verified' });

        // Find pending requests in provider's category
        // Simple logic: Match category exactly.
        const requests = await ServiceRequest.find({
            category: provider.category,
            status: 'pending'
        }).populate('client', 'name location'); // Start with minimal info? 
        // Prompt: "Nearby approved providers can see... Problem, Location"

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get My Requests (Client)
router.get('/my-requests', auth, async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ client: req.user.id })
            .populate('provider', 'name rating phone isVerified')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});
// Get Single Request Details
router.get('/:id', auth, async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id)
            .populate('client', 'name phone location')
            .populate('provider', 'name phone rating isVerified jobsCompleted');

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Access control?
        // Client can see their own.
        // Provider can see if they accepted it, or if it is pending (limited info).

        res.json(request);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Accept Request (Provider) -> Pays Acceptance Fee
router.put('/:id/accept', auth, async (req, res) => {
    if (req.user.role !== 'provider') return res.status(403).json({ message: 'Only providers can accept requests' });

    try {
        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already accepted' });

        // Simulate Fee Payment
        const feeAmount = 30; // 30-50 range
        // In real app, verify balance or process payment here.

        request.provider = req.user.id;
        request.status = 'accepted'; // Wait for confirm? Prompt: "Step 3: Provider Accepts... Client is notified"
        request.acceptanceFeePaid = true;

        await request.save();

        // Log Transaction
        await Transaction.create({
            user: req.user.id,
            userType: 'ServiceProvider',
            amount: feeAmount,
            type: 'acceptance_fee',
            requestId: request._id
        });

        res.json({ message: 'Request accepted', request });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Confirm Provider (Client) -> Pays Confirmation Fee
router.put('/:id/confirm', auth, async (req, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can confirm' });

    try {
        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Ensure user is the owner
        if (request.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        if (request.status !== 'accepted') return res.status(400).json({ message: 'Request not in accepted state' });

        // Simulate Fee Payment
        const feeAmount = 20;

        request.status = 'confirmed';
        request.confirmationFeePaid = true;

        await request.save();

        // Increment provider jobs?
        await ServiceProvider.findByIdAndUpdate(request.provider, { $inc: { jobsCompleted: 1 } });

        // Log Transaction
        await Transaction.create({
            user: req.user.id,
            userType: 'User',
            amount: feeAmount,
            type: 'confirmation_fee',
            requestId: request._id
        });

        res.json({ message: 'Provider confirmed', request });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
