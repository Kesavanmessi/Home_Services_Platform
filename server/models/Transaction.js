const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userType' },
    userType: { type: String, required: true, enum: ['User', 'ServiceProvider'] },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['acceptance_fee', 'confirmation_fee', 'penalty', 'refund', 'credit'], required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
