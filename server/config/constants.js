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
    },
    SERVICE_RATES: {
        'Electrician': 300,
        'Plumber': 250,
        'Carpenter': 350,
        'Painter': 400,
        'AC Repair': 500,
        'Other': 200
    },
    PRICING_CONFIG: {
        TRIAL_JOBS_COUNT: 5,
        PLATFORM_FEE: 50,
        RATING_MULTIPLIER: 0.1, // 10% per star above 3
        EXPERIENCE_MULTIPLIER: 0.05 // 5% per year
    }
};
