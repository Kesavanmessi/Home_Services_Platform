module.exports = {
    FEES: {
        ACCEPTANCE: 30, // Fee provider pays to accept
        CONFIRMATION: 20, // Fee client pays to confirm
        PENALTY_CANCELLATION: 50 // Penalty for cancelling active job
    },
    REFUNDS: {
        PROVIDER_CANCELLED_CLIENT_REFUND: 20,
        CLIENT_CANCELLED_PROVIDER_REFUND: 30
    },
    LIMITS: {
        DAILY_ACCEPTANCE: 3,
        JSON_BODY_SIZE: '10kb', // Much smaller than 50mb
        RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        RATE_LIMIT_MAX_REQUESTS: 100
    },
    TIMEOUTS: {
        ACCEPTANCE_EXPIRY_MS: 15 * 60 * 1000 // 15 mins
    },
    ROLES: {
        ADMIN: 'admin',
        PROVIDER: 'provider',
        CLIENT: 'client'
    }
};
