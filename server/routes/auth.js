const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ServiceProvider = require('../models/ServiceProvider');
const auth = require('../middleware/auth');

// Register Client
router.post('/register-client', async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, phone });
        await user.save();

        const token = jwt.sign({ id: user._id, role: 'client' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user._id, name, email, role: 'client' } });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Register Provider
router.post('/register-provider', async (req, res) => {
    const { name, email, password, phone, category, location, experience } = req.body;
    try {
        let provider = await ServiceProvider.findOne({ email });
        if (provider) return res.status(400).json({ message: 'Provider already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        provider = new ServiceProvider({
            name, email, password: hashedPassword, phone, category, location, experience
        });
        // Providers need admin approval, but for simplicity we might auto-approve or mock it.
        // Prompt says "Admin reviews and approves". So isVerified default is false.

        await provider.save();

        // We can issue a token, but maybe they check verified status?
        // For now, issue token so they can see "Waiting for approval" dashboard.
        const token = jwt.sign({ id: provider._id, role: 'provider' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: provider._id, name, email, role: 'provider', isVerified: provider.isVerified } });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body; // Expect role to be passed or check both
    try {
        let user;
        let collection;

        // If role is provided, check specific collection. Else check both.
        // Simpler: Check User first, then Provider if not found? Or force role selection in UI.
        // UI can pass role.

        if (role === 'client') {
            user = await User.findOne({ email });
        } else if (role === 'provider') {
            user = await ServiceProvider.findOne({ email });
        } else if (role === 'admin') {
            // Simple Hardcoded Admin for MVP
            if (email === 'admin@example.com' && password === 'admin123') {
                const token = jwt.sign({ id: 'admin_id', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({
                    token,
                    user: { id: 'admin_id', name: 'Admin', email, role: 'admin' }
                });
            } else {
                return res.status(400).json({ message: 'Invalid Admin Credentials' });
            }
        } else {
            return res.status(400).json({ message: 'Role (client/provider/admin) is required' });
        }

        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.role === 'provider' ? user.isVerified : undefined,
                walletBalance: user.walletBalance,
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// Get Current User (Load User)
router.get('/user', auth, async (req, res) => {
    try {
        let user;
        if (req.user.role === 'provider') {
            user = await ServiceProvider.findById(req.user.id).select('-password');
        } else if (req.user.role === 'admin') {
            // Check for hardcoded admin ID from login
            if (req.user.id === 'admin_id') {
                user = { id: 'admin_id', name: 'Admin', email: 'admin@example.com', role: 'admin' };
            } else {
                // Future-proof: validation for DB admins if added later
                user = await User.findById(req.user.id).select('-password');
            }
        } else {
            user = await User.findById(req.user.id).select('-password');
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
