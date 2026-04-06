/**
 * Feedback Routes
 * Handle feedback submission, retrieval, and voting
 */

const express = require('express');
const router = express.Router();
const { Feedback, ModerationLog } = require('../../models');
const aiService = require('../../services/aiService');
const blockchainService = require('../../services/blockchainService');
const ipfsService = require('../../services/ipfsService');
const { requireVerifiedStudent } = require('../../middleware/auth');

/**
 * POST /api/feedback
 * Submit new feedback
 */
router.post('/', requireVerifiedStudent, async (req, res) => {
    try {
        const { content, category, isAnonymous, image } = req.body;

        if (!content || !category) {
            return res.status(400).json({ error: 'Content and category required' });
        }

        // Step 1: Scrub PII if anonymous
        let processedContent = content;
        if (isAnonymous) {
            const privacyResult = await aiService.scrubPrivacy(content);
            processedContent = privacyResult.anonymized_text;
        }

        // Step 2: AI Moderation
        const moderation = await aiService.moderateContent(processedContent, 'feedback');

        // Step 3: Upload to IPFS
        const contentHash = await ipfsService.uploadText(processedContent);
        let imageHash = null;
        if (image) {
            imageHash = await ipfsService.uploadImage(image);
        }

        // Step 4: Record moderation decision on blockchain
        const feedbackId = Date.now(); // Temporary ID
        await blockchainService.recordModerationDecision(
            feedbackId,
            req.user.address,
            {
                toxicity: moderation.analysis.toxicity_score,
                sentiment: moderation.analysis.sentiment_score,
                constructiveness: moderation.analysis.constructiveness_score,
                spam: Math.floor(moderation.analysis.spam_probability * 100)
            }
        );

        // Step 5: Submit to blockchain if approved
        if (moderation.decision === 'APPROVE') {
            const txResult = await blockchainService.submitFeedback({
                category: getCategoryEnum(category),
                contentHash,
                imageHash,
                aiQualityScore: moderation.analysis.constructiveness_score,
                isAnonymous
            });

            // Step 6: Award points
            await blockchainService.awardPoints(
                req.user.address,
                0, // BasicFeedback activity type
                moderation.analysis.constructiveness_score,
                'Feedback submission'
            );

            // Step 7: Save to database
            const feedback = await Feedback.create({
                feedbackId: txResult.feedbackId,
                author: req.user.address,
                category,
                contentHash,
                imageHash,
                content: processedContent,
                aiScores: {
                    toxicity: moderation.analysis.toxicity_score,
                    sentiment: moderation.analysis.sentiment,
                    constructiveness: moderation.analysis.constructiveness_score,
                    spam: moderation.analysis.spam_probability,
                    qualityBonus: moderation.quality_bonus
                },
                status: 'approved',
                isAnonymous,
                txHash: txResult.txHash
            });

            // Step 8: Log moderation
            await ModerationLog.create({
                contentId: txResult.feedbackId,
                contentType: 'feedback',
                author: req.user.address,
                decision: moderation.decision,
                scores: moderation.analysis,
                reason: moderation.reason,
                aiSuggestions: moderation.suggestions
            });

            res.status(201).json({
                success: true,
                feedback: {
                    id: feedback.feedbackId,
                    txHash: txResult.txHash,
                    status: 'approved',
                    qualityBonus: moderation.quality_bonus
                }
            });
        } else {
            // Rejected or flagged
            res.status(200).json({
                success: false,
                decision: moderation.decision,
                reason: moderation.reason,
                suggestions: moderation.suggestions
            });
        }
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

/**
 * GET /api/feedback
 * Get feedbacks with filters
 */
router.get('/', async (req, res) => {
    try {
        const { category, status, limit = 20, skip = 0 } = req.query;

        const query = {};
        if (category) query.category = category;
        if (status) query.status = status;

        const feedbacks = await Feedback.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .select('-content'); // Don't send full content

        const total = await Feedback.countDocuments(query);

        res.json({
            feedbacks,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Feedback retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve feedbacks' });
    }
});

/**
 * GET /api/feedback/:id
 * Get specific feedback
 */
router.get('/:id', async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ feedbackId: req.params.id });

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        // Get full content from IPFS
        const fullContent = await ipfsService.getText(feedback.contentHash);

        res.json({
            ...feedback.toObject(),
            fullContent
        });
    } catch (error) {
        console.error('Feedback retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve feedback' });
    }
});

// Helper function to convert category string to enum
function getCategoryEnum(category) {
    const categories = {
        'General': 0,
        'Infrastructure': 1,
        'Faculty': 2,
        'Administration': 3,
        'Food': 4,
        'Technology': 5,
        'Safety': 6,
        'Other': 7
    };
    return categories[category] || 0;
}

module.exports = router;
