const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, default: 'client' },
    walletBalance: { type: Number, default: 500 }, // Default 500 for testing
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    rating: { type: Number, default: 0 }, // Average rating from providers
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
