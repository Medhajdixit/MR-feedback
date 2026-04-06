/**
 * Authentication Routes
 * Wallet-based authentication with signature verification
 */

const express = require('express');
const router = express.Router();
const { generateToken, verifySignature } = require('../middleware/auth');
const { User } = require('../models');

/**
 * POST /api/auth/nonce
 * Get nonce for wallet signature
 */
router.post('/nonce', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        // Generate nonce message
        const nonce = `Sign this message to authenticate with CampusFeedback+\nNonce: ${Date.now()}`;

        res.json({ nonce });
    } catch (error) {
        console.error('Nonce generation error:', error);
        res.status(500).json({ error: 'Failed to generate nonce' });
    }
});

/**
 * POST /api/auth/login
 * Login with wallet signature
 */
router.post('/login', async (req, res) => {
    try {
        const { address, signature, message } = req.body;

        if (!address || !signature || !message) {
            return res.status(400).json({
                error: 'Address, signature, and message required'
            });
        }

        // Verify signature
        const isValid = await verifySignature(message, signature, address);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Find or create user
        let user = await User.findOne({ walletAddress: address.toLowerCase() });

        if (!user) {
            user = await User.create({
                walletAddress: address.toLowerCase(),
                lastLogin: new Date()
            });
        } else {
            user.lastLogin = new Date();
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(address);

        res.json({
            token,
            user: {
                address: user.walletAddress,
                profile: user.profile,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * GET /api/auth/verify
 * Verify token validity
 */
router.get('/verify', require('../middleware/auth').authenticateToken, (req, res) => {
    res.json({
        valid: true,
        address: req.user.address
    });
});

module.exports = router;
