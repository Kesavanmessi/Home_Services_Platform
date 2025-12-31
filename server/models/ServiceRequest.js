const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' },
    category: { type: String, required: true },
    problemDescription: { type: String, required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['open', 'accepted', 'confirmed', 'completed', 'cancelled', 'expired'], default: 'open' },
    acceptanceFeePaid: { type: Boolean, default: false }, // Fee paid by provider to accept
    confirmationFeePaid: { type: Boolean, default: false }, // Fee paid by client to confirm
    acceptedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
