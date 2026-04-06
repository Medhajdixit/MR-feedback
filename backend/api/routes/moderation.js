/**
 * Moderation Routes
 * Handle moderation history and appeals
 */

const express = require('express');
const router = express.Router();
const { ModerationLog } = require('../../models');
const blockchainService = require('../../services/blockchainService');

/**
 * GET /api/moderation/history
 * Get moderation history
 */
router.get('/history', async (req, res) => {
    try {
        const { limit = 20, skip = 0, contentType } = req.query;

        const query = {};
        if (req.user) {
            query.author = req.user.address;
        }
        if (contentType) {
            query.contentType = contentType;
        }

        const history = await ModerationLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await ModerationLog.countDocuments(query);

        res.json({
            history,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip),
        });
    } catch (error) {
        console.error('Moderation history error:', error);
        res.status(500).json({ error: 'Failed to retrieve moderation history' });
    }
});

/**
 * POST /api/moderation/appeal
 * Submit appeal for moderation decision
 */
router.post('/appeal', async (req, res) => {
    try {
        const { contentId, reason } = req.body;

        if (!contentId || !reason) {
            return res.status(400).json({ error: 'Content ID and reason required' });
        }

        // Find moderation log
        const log = await ModerationLog.findOne({
            contentId,
            author: req.user.address,
        });

        if (!log) {
            return res.status(404).json({ error: 'Moderation record not found' });
        }

        if (log.decision === 'APPROVE') {
            return res.status(400).json({ error: 'Cannot appeal approved content' });
        }

        // TODO: Submit appeal to blockchain
        // For now, just log it
        log.reviewNotes = `Appeal: ${reason}`;
        await log.save();

        res.json({
            success: true,
            message: 'Appeal submitted for review',
        });
    } catch (error) {
        console.error('Appeal submission error:', error);
        res.status(500).json({ error: 'Failed to submit appeal' });
    }
});

/**
 * GET /api/moderation/stats
 * Get moderation statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const totalModerated = await ModerationLog.countDocuments();
        const approved = await ModerationLog.countDocuments({ decision: 'APPROVE' });
        const rejected = await ModerationLog.countDocuments({ decision: 'REJECT' });
        const flagged = await ModerationLog.countDocuments({ decision: 'FLAG' });

        res.json({
            totalModerated,
            approved,
            rejected,
            flagged,
            approvalRate: totalModerated > 0 ? ((approved / totalModerated) * 100).toFixed(1) : 0,
        });
    } catch (error) {
        console.error('Moderation stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve moderation stats' });
    }
});

module.exports = router;
