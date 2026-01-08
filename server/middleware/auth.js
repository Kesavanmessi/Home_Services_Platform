const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ServiceProvider = require('../models/ServiceProvider');

const auth = async (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Check Account Status
        if (req.user.role === 'client' || req.user.role === 'provider') {
            const Model = req.user.role === 'client' ? User : ServiceProvider;
            const user = await Model.findById(req.user.id);

            if (!user) {
                return res.status(401).json({ message: 'User no longer exists' });
            }

            if (user.accountStatus === 'banned') {
                return res.status(403).json({ message: 'Account has been permanently banned.', reason: user.banReason });
            }

            if (user.accountStatus === 'suspended') {
                // Check if suspension expired
                if (user.suspensionEndTime && new Date() > new Date(user.suspensionEndTime)) {
                    // Auto Re-activate
                    user.accountStatus = 'active';
                    user.suspensionEndTime = undefined;
                    user.banReason = undefined; // Optional: clear reason
                    await user.save();
                } else {
                    const dateStr = user.suspensionEndTime ? new Date(user.suspensionEndTime).toLocaleString() : 'Indefinitely';
                    return res.status(403).json({ message: `Account suspended until ${dateStr}`, reason: user.banReason });
                }
            }
        }

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error('Auth Middleware Error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
