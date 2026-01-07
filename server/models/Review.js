const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' }, // Optional, if Reviewer is Client
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, if Reviewer is Provider
    reviewer: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'reviewerModel' },
    reviewerModel: { type: String, required: true, enum: ['User', 'ServiceProvider'] }, // Who wrote the review
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
