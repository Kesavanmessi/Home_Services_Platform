const mongoose = require('mongoose');

const serviceProviderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    experience: { type: String },
    isVerified: { type: Boolean, default: false }, // Keep for backward compatibility, sync with status
    verificationStatus: {
        type: String,
        enum: ['pending_documents', 'pending_verification', 'documents_verified', 'documents_rejected', 'interview_scheduled', 'verified', 'failed'],
        default: 'pending_documents'
    },
    documents: {
        idProof: { type: String }, // URL or Base64
        selfie: { type: String }   // URL or Base64
    },
    interviewDate: { type: Date },
    trialJobsLeft: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    cancellationCount: { type: Number, default: 0 },
    dailyAcceptanceCount: { type: Number, default: 0 },
    lastAcceptanceDate: { type: Date },
    rating: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    role: { type: String, default: 'provider' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
