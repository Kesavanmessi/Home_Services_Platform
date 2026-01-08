const { SERVICE_RATES, PRICING_CONFIG } = require('../config/constants');

const calculateProviderCharge = (provider) => {
    // 1. Get Base Rate for Category
    const baseRate = SERVICE_RATES[provider.category] || SERVICE_RATES['Other'];

    // 2. Check Trial Status
    if (provider.trialJobsLeft > 0) {
        return Math.floor(baseRate);
    }

    // 3. Post-Trial Logic
    let multiplier = 1.0;

    // Rating Multiplier (Base 3 stars)
    // If rating is 4.5, (4.5 - 3) * 0.1 = 0.15 increase
    if (provider.rating > 3) {
        multiplier += (provider.rating - 3) * PRICING_CONFIG.RATING_MULTIPLIER;
    }

    // Experience Multiplier
    // Parse experience string (e.g., "5 years", "2" -> 2)
    let experienceYears = 0;
    if (provider.experience) {
        const match = provider.experience.toString().match(/(\d+)/);
        if (match) {
            experienceYears = parseInt(match[0], 10);
        }
    }
    multiplier += experienceYears * PRICING_CONFIG.EXPERIENCE_MULTIPLIER;

    // Cap Multiplier (Optional safety, e.g., max 3x)
    const MAX_MULTIPLIER = 3.0;
    if (multiplier > MAX_MULTIPLIER) multiplier = MAX_MULTIPLIER;

    return Math.floor(baseRate * multiplier);
};

module.exports = { calculateProviderCharge };
