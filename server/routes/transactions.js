const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/add', auth, async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    try {
        // Determine model based on role
        const Model = req.user.role === 'provider' ? require('../models/ServiceProvider') : require('../models/User');

        // Fetch user to check current balance state
        const currentUser = await Model.findById(req.user.id);
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        // Initialize with default 500 if undefined, otherwise use existing
        // This fixes the issue for existing users who missed the default 500 schema update
        const currentBalance = currentUser.walletBalance !== undefined ? currentUser.walletBalance : 500;
        const newBalance = currentBalance + amount;

        currentUser.walletBalance = newBalance;
        await currentUser.save();

        const transaction = new Transaction({
            user: req.user.id,
            userType: req.user.role === 'provider' ? 'ServiceProvider' : 'User',
            amount,
            type: 'credit', // You might need to add 'credit' to Transaction enum if strict
            description: 'Wallet Top-up'
        });
        await transaction.save();

        res.json({ message: 'Money added successfully', transaction });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
