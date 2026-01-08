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
        enum: [
            'pending_documents',
            'pending_verification',
            'documents_verified',
            'documents_rejected',
            'pending_interview_availability', // New: Admin approved docs, waiting for provider slots
            'pending_admin_schedule',       // New: Provider submitted slots, waiting for admin to pick
            'interview_scheduled',
            'verified',
            'failed'
        ],
        default: 'pending_documents'
    },
    documents: {
        idProof: { type: String }, // URL or Base64
        selfie: { type: String }   // URL or Base64
    },
    interviewAvailability: [{
        date: String, // ISO Date string or "YYYY-MM-DD"
        time: String  // "HH:mm"
    }],
    interviewDate: { type: Date },
    trialJobsLeft: { type: Number, default: 5 }, // Sync with PRICING_CONFIG manually or require if safe

    // New Fields for Filter
    workingHours: {
        start: { type: String, default: '08:00' },
        end: { type: String, default: '18:00' }
    },
    serviceRadius: { type: Number, default: 20, min: 5, max: 30 },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },

    isAvailable: { type: Boolean, default: true },
    cancellationCount: { type: Number, default: 0 },
    dailyAcceptanceCount: { type: Number, default: 0 },
    lastAcceptanceDate: { type: Date },
    rating: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 500 }, // Default 500 for testing
    role: { type: String, default: 'provider' },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'banned'],
        default: 'active'
    },
    banReason: { type: String },
    suspensionEndTime: { type: Date },
    termsAccepted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// GeoJSON Index - Crucial for Scalability
serviceProviderSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
