/**
 * Utility Functions
 * Helper functions for backend operations
 */

const { ethers } = require('ethers');

/**
 * Generate random nonce
 */
const generateNonce = () => {
    return `Sign this message to authenticate with CampusFeedback+\nNonce: ${Date.now()}`;
};

/**
 * Verify wallet signature
 */
const verifySignature = (message, signature, expectedAddress) => {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
};

/**
 * Calculate quality bonus from AI scores
 */
const calculateQualityBonus = (aiScores) => {
    const { toxicity, sentiment, constructiveness } = aiScores;

    let bonus = 0;

    // Low toxicity bonus (0-10 points)
    if (toxicity < 0.1) bonus += 10;
    else if (toxicity < 0.3) bonus += 5;

    // Positive sentiment bonus (0-10 points)
    if (sentiment > 0.7) bonus += 10;
    else if (sentiment > 0.5) bonus += 5;

    // Constructiveness bonus (0-10 points)
    if (constructiveness >= 80) bonus += 10;
    else if (constructiveness >= 60) bonus += 5;

    return Math.min(bonus, 30); // Max 30 points
};

/**
 * Format blockchain transaction hash
 */
const formatTxHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

/**
 * Format wallet address
 */
const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Calculate average rating
 */
const calculateAverageRating = (dimensions) => {
    if (!dimensions || dimensions.length === 0) return 0;
    const sum = dimensions.reduce((a, b) => a + b, 0);
    return (sum / dimensions.length).toFixed(1);
};

/**
 * Paginate results
 */
const paginate = (query, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
};

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = baseDelay * Math.pow(2, i);
            console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
            await sleep(delay);
        }
    }
};

/**
 * Check if content is spam
 */
const isSpam = (content) => {
    const spamPatterns = [
        /(.)\1{10,}/i, // Repeated characters
        /https?:\/\//gi, // Multiple URLs
        /\b(buy|sell|cheap|discount|offer|click here)\b/gi, // Spam keywords
    ];

    return spamPatterns.some((pattern) => pattern.test(content));
};

/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
};

/**
 * Generate cache key
 */
const generateCacheKey = (prefix, ...args) => {
    return `${prefix}:${args.join(':')}`;
};

/**
 * Parse sort parameter
 */
const parseSortParam = (sortParam) => {
    if (!sortParam) return { createdAt: -1 };

    const [field, order] = sortParam.split(':');
    return { [field]: order === 'asc' ? 1 : -1 };
};

module.exports = {
    generateNonce,
    verifySignature,
    calculateQualityBonus,
    formatTxHash,
    formatAddress,
    calculateAverageRating,
    paginate,
    sleep,
    retryWithBackoff,
    isSpam,
    sanitizeFilename,
    generateCacheKey,
    parseSortParam,
};
