/**
 * User Routes
 * Handle user profile and statistics
 */

const express = require('express');
const router = express.Router();
const { User, Feedback, Rating } = require('../../models');
const blockchainService = require('../../services/blockchainService');

/**
 * GET /api/user/:address
 * Get user profile
 */
router.get('/:address', async (req, res) => {
    try {
        const { address } = req.params;

        let user = await User.findOne({ walletAddress: address.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get blockchain data
        const isVerified = await blockchainService.isVerifiedStudent(address);
        const pointBalance = await blockchainService.getPointBalance(address);

        res.json({
            address: user.walletAddress,
            profile: user.profile,
            preferences: user.preferences,
            isVerified,
            points: parseInt(pointBalance.toString()),
        });
    } catch (error) {
        console.error('User profile error:', error);
        res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', async (req, res) => {
    try {
        const { bio, isPublic, preferences } = req.body;

        let user = await User.findOne({ walletAddress: req.user.address });

        if (!user) {
            user = await User.create({ walletAddress: req.user.address });
        }

        if (bio !== undefined) user.profile.bio = bio;
        if (isPublic !== undefined) user.profile.isPublic = isPublic;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };

        await user.save();

        res.json({
            success: true,
            profile: user.profile,
            preferences: user.preferences,
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * GET /api/user/:address/stats
 * Get user statistics
 */
router.get('/:address/stats', async (req, res) => {
    try {
        const { address } = req.params;

        // Get feedback count
        const totalFeedbacks = await Feedback.countDocuments({ author: address.toLowerCase() });
        const approvedFeedbacks = await Feedback.countDocuments({
            author: address.toLowerCase(),
            status: 'approved',
        });

        // Get rating count
        const totalRatings = await Rating.countDocuments({ rater: address.toLowerCase() });

        // Get points from blockchain
        const points = await blockchainService.getPointBalance(address);

        // Calculate stats
        const stats = {
            totalFeedbacks,
            approvedFeedbacks,
            rejectedFeedbacks: totalFeedbacks - approvedFeedbacks,
            totalRatings,
            points: parseInt(points.toString()),
            badges: 0, // TODO: Get from gamification contract
            reputation: 100, // TODO: Get from reputation contract
            rank: 0, // TODO: Calculate from leaderboard
            consecutiveDays: 0, // TODO: Track login streak
        };

        res.json(stats);
    } catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve user stats' });
    }
});

/**
 * GET /api/user/:address/points
 * Get user point balance and history
 */
router.get('/:address/points', async (req, res) => {
    try {
        const { address } = req.params;

        const balance = await blockchainService.getPointBalance(address);

        res.json({
            balance: parseInt(balance.toString()),
            totalEarned: parseInt(balance.toString()), // TODO: Track separately
            totalSpent: 0, // TODO: Track redemptions
            recentTransactions: [], // TODO: Get from blockchain events
        });
    } catch (error) {
        console.error('Points retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve points' });
    }
});

/**
 * GET /api/user/:address/feedbacks
 * Get user's feedbacks
 */
router.get('/:address/feedbacks', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        const feedbacks = await Feedback.find({ author: address.toLowerCase() })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Feedback.countDocuments({ author: address.toLowerCase() });

        res.json({
            feedbacks,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip),
        });
    } catch (error) {
        console.error('User feedbacks error:', error);
        res.status(500).json({ error: 'Failed to retrieve feedbacks' });
    }
});

module.exports = router;
