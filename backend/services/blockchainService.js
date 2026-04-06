/**
 * Blockchain Service Layer
 * Handles all interactions with smart contracts on Shardeum
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABIs (will be imported from artifacts)
const StudentRegistryABI = require('../../artifacts/contracts/core/StudentRegistryContract.sol/StudentRegistryContract.json').abi;
const FeedbackABI = require('../../artifacts/contracts/core/FeedbackContract.sol/FeedbackContract.json').abi;
const PointEconomyABI = require('../../artifacts/contracts/core/PointEconomyContract.sol/PointEconomyContract.json').abi;
const RatingABI = require('../../artifacts/contracts/core/RatingContract.sol/RatingContract.json').abi;
const AIModerationABI = require('../../artifacts/contracts/core/AIModerationContract.sol/AIModerationContract.json').abi;

class BlockchainService {
    constructor() {
        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(
            process.env.SHARDEUM_RPC_URL || 'https://api-unstable.shardeum.org'
        );

        // Initialize wallet (for backend transactions)
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

        // Contract addresses (from deployment)
        this.addresses = {
            studentRegistry: process.env.STUDENT_REGISTRY_ADDRESS,
            feedback: process.env.FEEDBACK_ADDRESS,
            pointEconomy: process.env.POINT_ECONOMY_ADDRESS,
            rating: process.env.RATING_ADDRESS,
            aiModeration: process.env.AI_MODERATION_ADDRESS
        };

        // Initialize contracts
        this.contracts = {
            studentRegistry: new ethers.Contract(
                this.addresses.studentRegistry,
                StudentRegistryABI,
                this.wallet
            ),
            feedback: new ethers.Contract(
                this.addresses.feedback,
                FeedbackABI,
                this.wallet
            ),
            pointEconomy: new ethers.Contract(
                this.addresses.pointEconomy,
                PointEconomyABI,
                this.wallet
            ),
            rating: new ethers.Contract(
                this.addresses.rating,
                RatingABI,
                this.wallet
            ),
            aiModeration: new ethers.Contract(
                this.addresses.aiModeration,
                AIModerationABI,
                this.wallet
            )
        };

        console.log('✅ Blockchain service initialized');
    }

    /**
     * Check if user is verified student
     */
    async isVerifiedStudent(address) {
        try {
            return await this.contracts.studentRegistry.isVerifiedStudent(address);
        } catch (error) {
            console.error('Error checking student verification:', error);
            throw error;
        }
    }

    /**
     * Get student profile
     */
    async getStudentProfile(address) {
        try {
            return await this.contracts.studentRegistry.getStudentProfile(address);
        } catch (error) {
            console.error('Error getting student profile:', error);
            throw error;
        }
    }

    /**
     * Record AI moderation decision
     */
    async recordModerationDecision(contentId, author, scores) {
        try {
            const tx = await this.contracts.aiModeration.recordModerationDecision(
                contentId,
                author,
                scores.toxicity,
                scores.sentiment,
                scores.constructiveness,
                scores.spam
            );
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error recording moderation decision:', error);
            throw error;
        }
    }

    /**
     * Submit feedback to blockchain
     */
    async submitFeedback(feedbackData) {
        try {
            const tx = await this.contracts.feedback.submitFeedback(
                feedbackData.category,
                feedbackData.contentHash,
                feedbackData.imageHash || ethers.ZeroHash,
                feedbackData.aiQualityScore,
                feedbackData.isAnonymous
            );
            const receipt = await tx.wait();

            // Extract feedback ID from event
            const event = receipt.logs.find(log =>
                log.topics[0] === ethers.id('FeedbackSubmitted(uint256,address,uint8,bool,uint256)')
            );

            return {
                txHash: tx.hash,
                feedbackId: event ? parseInt(event.topics[1]) : null
            };
        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
    }

    /**
     * Award points to user
     */
    async awardPoints(user, activity, qualityScore, description) {
        try {
            const tx = await this.contracts.pointEconomy.awardPoints(
                user,
                activity,
                qualityScore,
                description
            );
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error awarding points:', error);
            throw error;
        }
    }

    /**
     * Get user point balance
     */
    async getPointBalance(address) {
        try {
            const balance = await this.contracts.pointEconomy.getPointBalance(address);
            return parseInt(balance.toString());
        } catch (error) {
            console.error('Error getting point balance:', error);
            throw error;
        }
    }

    /**
     * Submit rating
     */
    async submitFacultyRating(ratingData) {
        try {
            const tx = await this.contracts.rating.submitFacultyRating(
                ratingData.faculty,
                ratingData.dimensions,
                ratingData.commentHash,
                ratingData.isAnonymous
            );
            const receipt = await tx.wait();
            return {
                txHash: tx.hash,
                receipt
            };
        } catch (error) {
            console.error('Error submitting rating:', error);
            throw error;
        }
    }

    /**
     * Get average faculty rating
     */
    async getAverageRating(facultyAddress) {
        try {
            return await this.contracts.rating.getAverageRating(facultyAddress);
        } catch (error) {
            console.error('Error getting average rating:', error);
            throw error;
        }
    }

    /**
     * Get moderation result
     */
    async getModerationResult(contentId) {
        try {
            return await this.contracts.aiModeration.getModerationResult(contentId);
        } catch (error) {
            console.error('Error getting moderation result:', error);
            throw error;
        }
    }

    /**
     * Get network info
     */
    async getNetworkInfo() {
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getFeeData();

            return {
                chainId: Number(network.chainId),
                name: network.name,
                blockNumber,
                gasPrice: gasPrice.gasPrice.toString()
            };
        } catch (error) {
            console.error('Error getting network info:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new BlockchainService();
