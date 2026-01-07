const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ServiceProvider = require('../models/ServiceProvider');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Get User Transactions
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// RAZORPAY: Create Order
router.post('/create-order', auth, async (req, res) => {
    try {
        const { amount } = req.body; // Amount in INR
        if (!amount || amount < 1) return res.status(400).json({ message: 'Invalid amount' });

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`
        };

        const order = await instance.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ message: 'Payment initiation failed', error: error.message });
    }
});

// RAZORPAY: Verify Payment
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment Success - Credit Wallet
            const userId = req.user.id;
            const role = req.user.role;
            const creditAmount = Number(amount); // This should pass from frontend or verify from order fetch

            let user;
            let userType;

            if (role === 'provider') {
                user = await ServiceProvider.findById(userId);
                userType = 'ServiceProvider';
            } else {
                user = await User.findById(userId);
                userType = 'User';
            }

            if (!user) return res.status(404).json({ message: 'User not found' });

            // Atomic Credit
            user.walletBalance += creditAmount;
            await user.save();

            // Log Transaction
            await Transaction.create({
                user: userId,
                userType: userType,
                amount: creditAmount,
                type: 'credit',
                description: `Wallet Deposit (Txn: ${razorpay_payment_id})`,
                requestId: null // Not tied to a service request
            });

            return res.json({ message: 'Payment verified and wallet credited', success: true });
        } else {
            return res.status(400).json({ message: 'Invalid signature', success: false });
        }
    } catch (error) {
        console.error("Razorpay Verify Error:", error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
});

module.exports = router;
