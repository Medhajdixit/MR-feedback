/**
 * Rating Routes
 * Handle rating submission and retrieval
 */

const express = require('express');
const router = express.Router();
const { Rating } = require('../../models');
const blockchainService = require('../../services/blockchainService');
const { requireVerifiedStudent } = require('../../middleware/auth');

/**
 * POST /api/rating
 * Submit new rating
 */
router.post('/', requireVerifiedStudent, async (req, res) => {
    try {
        const { type, facultyAddress, dimensions, comment, isAnonymous } = req.body;

        if (!facultyAddress || !dimensions || dimensions.length !== 5) {
            return res.status(400).json({ error: 'Invalid rating data' });
        }

        // Validate dimensions (1-10 scale)
        const validDimensions = dimensions.every(d => d >= 1 && d <= 10);
        if (!validDimensions) {
            return res.status(400).json({ error: 'Dimensions must be between 1 and 10' });
        }

        // Submit to blockchain
        const txResult = await blockchainService.submitFacultyRating({
            faculty: facultyAddress,
            dimensions,
            commentHash: comment ? await ipfsService.uploadText(comment) : ethers.ZeroHash,
            isAnonymous,
        });

        // Save to database
        const rating = await Rating.create({
            ratingId: Date.now(), // Temporary, should get from blockchain event
            rater: req.user.address,
            subject: facultyAddress,
            type: type || 'faculty',
            dimensions,
            commentHash: txResult.commentHash,
            isAnonymous,
            txHash: txResult.txHash,
        });

        res.status(201).json({
            success: true,
            rating: {
                id: rating.ratingId,
                txHash: txResult.txHash,
                averageRating: dimensions.reduce((a, b) => a + b, 0) / dimensions.length,
            },
        });
    } catch (error) {
        console.error('Rating submission error:', error);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
});

/**
 * GET /api/rating/faculty/:address
 * Get all ratings for a faculty member
 */
router.get('/faculty/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // Get ratings from database
        const ratings = await Rating.find({ subject: address, type: 'faculty' })
            .sort({ createdAt: -1 })
            .limit(50);

        // Calculate average
        const totalRatings = ratings.length;
        const dimensionSums = [0, 0, 0, 0, 0];

        ratings.forEach(rating => {
            rating.dimensions.forEach((dim, index) => {
                dimensionSums[index] += dim;
            });
        });

        const dimensionAverages = dimensionSums.map(sum =>
            totalRatings > 0 ? (sum / totalRatings).toFixed(1) : 0
        );

        const overallAverage = dimensionAverages.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / 5;

        res.json({
            faculty: address,
            averageRating: overallAverage.toFixed(1),
            totalRatings,
            dimensionAverages,
            ratings: ratings.map(r => ({
                ratingId: r.ratingId,
                dimensions: r.dimensions,
                comment: r.commentHash,
                isAnonymous: r.isAnonymous,
                createdAt: r.createdAt,
            })),
        });
    } catch (error) {
        console.error('Rating retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve ratings' });
    }
});

/**
 * GET /api/rating/infrastructure
 * Get infrastructure ratings
 */
router.get('/infrastructure', async (req, res) => {
    try {
        const ratings = await Rating.find({ type: 'infrastructure' })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ ratings });
    } catch (error) {
        console.error('Infrastructure rating error:', error);
        res.status(500).json({ error: 'Failed to retrieve infrastructure ratings' });
    }
});

module.exports = router;
