/**
 * Database Models for CampusFeedback+ 2.0
 * MongoDB schemas using Mongoose
 */

const mongoose = require('mongoose');

// User Model (off-chain data)
const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    email: {
        type: String,
        sparse: true,
        lowercase: true
    },
    profile: {
        bio: String,
        avatar: String,
        isPublic: { type: Boolean, default: true }
    },
    preferences: {
        notifications: { type: Boolean, default: true },
        emailUpdates: { type: Boolean, default: false },
        anonymousByDefault: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date
});

// Feedback Model (metadata and IPFS references)
const feedbackSchema = new mongoose.Schema({
    feedbackId: { type: Number, required: true, unique: true },
    author: { type: String, required: true, lowercase: true },
    category: { type: String, required: true },
    contentHash: { type: String, required: true }, // IPFS hash
    imageHash: String, // Optional IPFS hash
    content: String, // Cached content for search
    aiScores: {
        toxicity: Number,
        sentiment: String,
        constructiveness: Number,
        spam: Number,
        qualityBonus: Number
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'implemented'],
        default: 'pending'
    },
    isAnonymous: { type: Boolean, default: false },
    votes: {
        upvotes: { type: Number, default: 0 },
        downvotes: { type: Number, default: 0 }
    },
    txHash: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date
});

// Rating Model
const ratingSchema = new mongoose.Schema({
    ratingId: { type: Number, required: true, unique: true },
    rater: { type: String, required: true, lowercase: true },
    subject: { type: String, required: true, lowercase: true },
    type: {
        type: String,
        enum: ['faculty', 'infrastructure', 'service'],
        required: true
    },
    dimensions: [Number],
    commentHash: String,
    imageHash: String,
    isAnonymous: { type: Boolean, default: false },
    txHash: String,
    createdAt: { type: Date, default: Date.now }
});

// Moderation Log Model
const moderationLogSchema = new mongoose.Schema({
    contentId: { type: Number, required: true },
    contentType: {
        type: String,
        enum: ['feedback', 'rating', 'comment'],
        required: true
    },
    author: { type: String, required: true, lowercase: true },
    decision: {
        type: String,
        enum: ['APPROVE', 'REJECT', 'FLAG'],
        required: true
    },
    scores: {
        toxicity: Number,
        sentiment: Number,
        constructiveness: Number,
        spam: Number
    },
    reason: String,
    aiSuggestions: [String],
    humanReviewer: String,
    reviewNotes: String,
    createdAt: { type: Date, default: Date.now }
});

// Notification Model
const notificationSchema = new mongoose.Schema({
    recipient: { type: String, required: true, lowercase: true },
    type: {
        type: String,
        enum: ['feedback_approved', 'feedback_rejected', 'points_awarded', 'badge_earned', 'new_follower', 'governance_update'],
        required: true
    },
    title: String,
    message: String,
    data: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Analytics Model
const analyticsSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    metrics: {
        totalFeedbacks: { type: Number, default: 0 },
        approvedFeedbacks: { type: Number, default: 0 },
        rejectedFeedbacks: { type: Number, default: 0 },
        avgQualityScore: { type: Number, default: 0 },
        activeUsers: { type: Number, default: 0 },
        pointsAwarded: { type: Number, default: 0 }
    },
    categoryBreakdown: mongoose.Schema.Types.Mixed,
    trendingIssues: [String]
});

// Indexes for performance
userSchema.index({ walletAddress: 1 });
feedbackSchema.index({ author: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, status: 1 });
feedbackSchema.index({ createdAt: -1 });
ratingSchema.index({ subject: 1 });
moderationLogSchema.index({ contentId: 1, contentType: 1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
analyticsSchema.index({ date: -1 });

// Export models
module.exports = {
    User: mongoose.model('User', userSchema),
    Feedback: mongoose.model('Feedback', feedbackSchema),
    Rating: mongoose.model('Rating', ratingSchema),
    ModerationLog: mongoose.model('ModerationLog', moderationLogSchema),
    Notification: mongoose.model('Notification', notificationSchema),
    Analytics: mongoose.model('Analytics', analyticsSchema)
};
