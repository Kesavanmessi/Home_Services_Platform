const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const ServiceProvider = require('../models/ServiceProvider');
const ServiceRequest = require('../models/ServiceRequest');

const User = require('../models/User'); // Import User model

// Create Review (Generic)
router.post('/', auth, async (req, res) => {
    try {
        const { rating, comment, providerId, clientId, requestId } = req.body;

        if (!requestId) return res.status(400).json({ message: 'Request ID is required' });

        const newReview = new Review({
            reviewer: req.user.id,
            reviewerModel: req.user.role === 'client' ? 'User' : 'ServiceProvider',
            rating,
            comment,
            request: requestId
        });

        if (req.user.role === 'client') {
            // Client reviewing Provider
            if (!providerId) return res.status(400).json({ message: 'Provider ID required' });
            newReview.provider = providerId;
        } else {
            // Provider reviewing Client
            if (!clientId) return res.status(400).json({ message: 'Client ID required' });
            newReview.client = clientId;
        }

        await newReview.save();

        // Update Average Rating
        if (newReview.provider) {
            const provider = await ServiceProvider.findById(newReview.provider);
            const reviews = await Review.find({ provider: newReview.provider });
            const avg = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;
            provider.rating = avg;
            await provider.save();
        }

        if (newReview.client) {
            const client = await User.findById(newReview.client);
            const reviews = await Review.find({ client: newReview.client });
            const avg = reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;
            client.rating = avg;
            await client.save();
        }

        res.status(201).json(newReview);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
