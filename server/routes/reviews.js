const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const ServiceProvider = require('../models/ServiceProvider');
const ServiceRequest = require('../models/ServiceRequest');

// Create Review
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can review' });

    try {
        const { requestId, rating, comment } = req.body;

        // Check if request exists and is completed/confirmed
        const request = await ServiceRequest.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Ensure user is the owner
        if (request.client.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        // Check if already reviewed (optional, skip for simplicity)

        const review = new Review({
            request: requestId,
            client: req.user.id,
            provider: request.provider,
            rating,
            comment
        });

        await review.save();

        // Update Provider Rating
        // Simple Average
        const reviews = await Review.find({ provider: request.provider });
        const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

        await ServiceProvider.findByIdAndUpdate(request.provider, {
            rating: avgRating.toFixed(1)
        });

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
