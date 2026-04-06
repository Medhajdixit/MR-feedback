/**
 * Validation Middleware
 * Request validation for API endpoints
 */

const { ethers } = require('ethers');

/**
 * Validate Ethereum address
 */
const validateAddress = (req, res, next) => {
    const { address, facultyAddress } = req.body;
    const addressToValidate = address || facultyAddress;

    if (addressToValidate && !ethers.isAddress(addressToValidate)) {
        return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    next();
};

/**
 * Validate feedback submission
 */
const validateFeedback = (req, res, next) => {
    const { content, category } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length < 20) {
        return res.status(400).json({ error: 'Content must be at least 20 characters' });
    }

    if (content.length > 5000) {
        return res.status(400).json({ error: 'Content must not exceed 5000 characters' });
    }

    const validCategories = [
        'General',
        'Infrastructure',
        'Faculty',
        'Administration',
        'Food',
        'Technology',
        'Safety',
        'Other',
    ];

    if (category && !validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    next();
};

/**
 * Validate rating submission
 */
const validateRating = (req, res, next) => {
    const { dimensions, facultyAddress } = req.body;

    if (!facultyAddress) {
        return res.status(400).json({ error: 'Faculty address is required' });
    }

    if (!dimensions || !Array.isArray(dimensions)) {
        return res.status(400).json({ error: 'Dimensions must be an array' });
    }

    if (dimensions.length !== 5) {
        return res.status(400).json({ error: 'Must provide exactly 5 dimension ratings' });
    }

    const validDimensions = dimensions.every(
        (d) => Number.isInteger(d) && d >= 1 && d <= 10
    );

    if (!validDimensions) {
        return res.status(400).json({
            error: 'All dimensions must be integers between 1 and 10',
        });
    }

    next();
};

/**
 * Validate proposal creation
 */
const validateProposal = (req, res, next) => {
    const { title, description, proposalType } = req.body;

    if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
    }

    if (title.length > 200) {
        return res.status(400).json({ error: 'Title must not exceed 200 characters' });
    }

    if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: 'Description is required' });
    }

    if (description.length < 50) {
        return res.status(400).json({
            error: 'Description must be at least 50 characters',
        });
    }

    if (proposalType !== undefined) {
        if (!Number.isInteger(proposalType) || proposalType < 0 || proposalType > 5) {
            return res.status(400).json({ error: 'Invalid proposal type' });
        }
    }

    next();
};

/**
 * Sanitize input
 */
const sanitizeInput = (req, res, next) => {
    // Remove any potential XSS attempts
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .trim();
        }
        if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach((key) => {
                obj[key] = sanitize(obj[key]);
            });
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }

    next();
};

module.exports = {
    validateAddress,
    validateFeedback,
    validateRating,
    validateProposal,
    sanitizeInput,
};
