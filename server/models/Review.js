const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
