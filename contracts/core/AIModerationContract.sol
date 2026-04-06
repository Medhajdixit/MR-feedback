// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AIModerationContract
 * @notice Manages AI moderation decisions, human review, and appeals
 * @dev Stores moderation results and tracks AI performance metrics
 */
contract AIModerationContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AI_SERVICE_ROLE = keccak256("AI_SERVICE_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    enum ModerationDecision {
        Pending,
        Approved,
        Rejected,
        Flagged,
        UnderReview
    }

    enum AppealStatus {
        None,
        Pending,
        Approved,
        Rejected
    }

    struct ModerationResult {
        uint256 contentId;
        address author;
        uint8 toxicityScore;      // 0-100
        uint8 sentimentScore;     // 0-100
        uint8 constructivenessScore; // 0-100
        uint8 spamScore;          // 0-100
        ModerationDecision decision;
        uint256 timestamp;
        string rejectionReason;
        bool requiresHumanReview;
    }

    struct Appeal {
        uint256 contentId;
        address appellant;
        string justification;
        uint256 appealTime;
        AppealStatus status;
        address reviewer;
        uint256 reviewTime;
        string reviewNotes;
    }

    struct ModerationStats {
        uint256 totalModerated;
        uint256 approved;
        uint256 rejected;
        uint256 flagged;
        uint256 appealsSubmitted;
        uint256 appealsApproved;
    }

    // Moderation thresholds
    uint8 public toxicityThreshold = 70;
    uint8 public spamThreshold = 80;
    uint8 public constructivenessMinimum = 30;

    // Mappings
    mapping(uint256 => ModerationResult) public moderationResults;
    mapping(uint256 => Appeal) public appeals;
    mapping(address => uint256[]) public userContent;
    mapping(address => ModerationStats) public userStats;
    
    ModerationStats public globalStats;
    
    uint256 public totalContentModerated;
    uint256[] public flaggedContent;

    // Events
    event ContentModerated(
        uint256 indexed contentId,
        address indexed author,
        ModerationDecision decision,
        uint8 toxicityScore,
        uint8 constructivenessScore,
        uint256 timestamp
    );
    event ContentFlagged(uint256 indexed contentId, string reason, uint256 timestamp);
    event AppealSubmitted(uint256 indexed contentId, address indexed appellant, uint256 timestamp);
    event AppealReviewed(
        uint256 indexed contentId,
        AppealStatus status,
        address indexed reviewer,
        uint256 timestamp
    );
    event ThresholdsUpdated(
        uint8 toxicity,
        uint8 spam,
        uint8 constructiveness,
        uint256 timestamp
    );
    event HumanReviewCompleted(
        uint256 indexed contentId,
        ModerationDecision finalDecision,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Record AI moderation decision
     * @param contentId ID of the content
     * @param author Address of content author
     * @param toxicity Toxicity score (0-100)
     * @param sentiment Sentiment score (0-100)
     * @param constructiveness Constructiveness score (0-100)
     * @param spam Spam score (0-100)
     */
    function recordModerationDecision(
        uint256 contentId,
        address author,
        uint8 toxicity,
        uint8 sentiment,
        uint8 constructiveness,
        uint8 spam
    ) external onlyRole(AI_SERVICE_ROLE) {
        require(moderationResults[contentId].timestamp == 0, "Already moderated");
        require(toxicity <= 100 && sentiment <= 100 && 
                constructiveness <= 100 && spam <= 100, "Invalid scores");

        ModerationDecision decision = _determineDecision(
            toxicity,
            spam,
            constructiveness
        );

        bool needsReview = _needsHumanReview(toxicity, spam, constructiveness);

        moderationResults[contentId] = ModerationResult({
            contentId: contentId,
            author: author,
            toxicityScore: toxicity,
            sentimentScore: sentiment,
            constructivenessScore: constructiveness,
            spamScore: spam,
            decision: needsReview ? ModerationDecision.Flagged : decision,
            timestamp: block.timestamp,
            rejectionReason: _getRejectionReason(toxicity, spam, constructiveness),
            requiresHumanReview: needsReview
        });

        userContent[author].push(contentId);
        totalContentModerated++;
        globalStats.totalModerated++;

        _updateStats(decision, author);

        if (needsReview) {
            flaggedContent.push(contentId);
            emit ContentFlagged(contentId, "AI flagged for review", block.timestamp);
        }

        emit ContentModerated(
            contentId,
            author,
            decision,
            toxicity,
            constructiveness,
            block.timestamp
        );
    }

    /**
     * @notice Determine moderation decision based on scores
     */
    function _determineDecision(
        uint8 toxicity,
        uint8 spam,
        uint8 constructiveness
    ) internal view returns (ModerationDecision) {
        if (toxicity > toxicityThreshold || spam > spamThreshold) {
            return ModerationDecision.Rejected;
        }
        
        if (constructiveness < constructivenessMinimum) {
            return ModerationDecision.Flagged;
        }

        return ModerationDecision.Approved;
    }

    /**
     * @notice Check if content needs human review
     */
    function _needsHumanReview(
        uint8 toxicity,
        uint8 spam,
        uint8 constructiveness
    ) internal view returns (bool) {
        // Borderline cases need human review
        uint8 toxicityMargin = 10;
        uint8 spamMargin = 10;
        uint8 constructivenessMargin = 10;

        bool borderlineToxicity = toxicity >= (toxicityThreshold - toxicityMargin) && 
                                  toxicity <= (toxicityThreshold + toxicityMargin);
        bool borderlineSpam = spam >= (spamThreshold - spamMargin) && 
                             spam <= (spamThreshold + spamMargin);
        bool borderlineConstructiveness = constructiveness >= (constructivenessMinimum - constructivenessMargin) && 
                                         constructiveness <= (constructivenessMinimum + constructivenessMargin);

        return borderlineToxicity || borderlineSpam || borderlineConstructiveness;
    }

    /**
     * @notice Get rejection reason based on scores
     */
    function _getRejectionReason(
        uint8 toxicity,
        uint8 spam,
        uint8 constructiveness
    ) internal view returns (string memory) {
        if (toxicity > toxicityThreshold) {
            return "High toxicity detected";
        }
        if (spam > spamThreshold) {
            return "Spam content detected";
        }
        if (constructiveness < constructivenessMinimum) {
            return "Low constructiveness score";
        }
        return "";
    }

    /**
     * @notice Update statistics
     */
    function _updateStats(ModerationDecision decision, address author) internal {
        if (decision == ModerationDecision.Approved) {
            globalStats.approved++;
            userStats[author].approved++;
        } else if (decision == ModerationDecision.Rejected) {
            globalStats.rejected++;
            userStats[author].rejected++;
        } else if (decision == ModerationDecision.Flagged) {
            globalStats.flagged++;
            userStats[author].flagged++;
        }
    }

    /**
     * @notice Submit appeal for rejected content
     * @param contentId ID of the content
     * @param justification Reason for appeal
     */
    function submitAppeal(uint256 contentId, string memory justification) external {
        ModerationResult memory result = moderationResults[contentId];
        require(result.timestamp > 0, "Content not moderated");
        require(result.author == msg.sender, "Not content author");
        require(result.decision == ModerationDecision.Rejected || 
                result.decision == ModerationDecision.Flagged, 
                "Content not rejected");
        require(appeals[contentId].appealTime == 0, "Appeal already submitted");
        require(bytes(justification).length > 0, "Justification required");

        appeals[contentId] = Appeal({
            contentId: contentId,
            appellant: msg.sender,
            justification: justification,
            appealTime: block.timestamp,
            status: AppealStatus.Pending,
            reviewer: address(0),
            reviewTime: 0,
            reviewNotes: ""
        });

        globalStats.appealsSubmitted++;
        userStats[msg.sender].appealsSubmitted++;

        emit AppealSubmitted(contentId, msg.sender, block.timestamp);
    }

    /**
     * @notice Review appeal (moderator only)
     * @param contentId ID of the content
     * @param approved Whether to approve the appeal
     * @param notes Review notes
     */
    function reviewAppeal(
        uint256 contentId,
        bool approved,
        string memory notes
    ) external onlyRole(MODERATOR_ROLE) {
        Appeal storage appeal = appeals[contentId];
        require(appeal.status == AppealStatus.Pending, "Appeal not pending");

        appeal.status = approved ? AppealStatus.Approved : AppealStatus.Rejected;
        appeal.reviewer = msg.sender;
        appeal.reviewTime = block.timestamp;
        appeal.reviewNotes = notes;

        if (approved) {
            moderationResults[contentId].decision = ModerationDecision.Approved;
            globalStats.appealsApproved++;
            userStats[appeal.appellant].appealsApproved++;
        }

        emit AppealReviewed(contentId, appeal.status, msg.sender, block.timestamp);
    }

    /**
     * @notice Complete human review for flagged content
     * @param contentId ID of the content
     * @param finalDecision Final moderation decision
     * @param notes Review notes
     */
    function completeHumanReview(
        uint256 contentId,
        ModerationDecision finalDecision,
        string memory notes
    ) external onlyRole(MODERATOR_ROLE) {
        ModerationResult storage result = moderationResults[contentId];
        require(result.requiresHumanReview, "Not flagged for review");
        require(result.decision == ModerationDecision.Flagged || 
                result.decision == ModerationDecision.UnderReview, 
                "Not under review");

        result.decision = finalDecision;
        result.requiresHumanReview = false;
        result.rejectionReason = notes;

        emit HumanReviewCompleted(contentId, finalDecision, block.timestamp);
    }

    /**
     * @notice Update moderation thresholds
     * @param toxicity New toxicity threshold
     * @param spam New spam threshold
     * @param constructiveness New constructiveness minimum
     */
    function updateThresholds(
        uint8 toxicity,
        uint8 spam,
        uint8 constructiveness
    ) external onlyRole(ADMIN_ROLE) {
        require(toxicity <= 100 && spam <= 100 && constructiveness <= 100, 
                "Invalid thresholds");

        toxicityThreshold = toxicity;
        spamThreshold = spam;
        constructivenessMinimum = constructiveness;

        emit ThresholdsUpdated(toxicity, spam, constructiveness, block.timestamp);
    }

    /**
     * @notice Get moderation result
     * @param contentId ID of the content
     * @return Moderation result struct
     */
    function getModerationResult(uint256 contentId) 
        external 
        view 
        returns (ModerationResult memory) 
    {
        return moderationResults[contentId];
    }

    /**
     * @notice Get appeal details
     * @param contentId ID of the content
     * @return Appeal struct
     */
    function getAppeal(uint256 contentId) external view returns (Appeal memory) {
        return appeals[contentId];
    }

    /**
     * @notice Get user's content IDs
     * @param user Address of the user
     * @return Array of content IDs
     */
    function getUserContent(address user) external view returns (uint256[] memory) {
        return userContent[user];
    }

    /**
     * @notice Get flagged content IDs
     * @return Array of flagged content IDs
     */
    function getFlaggedContent() external view returns (uint256[] memory) {
        return flaggedContent;
    }

    /**
     * @notice Get user statistics
     * @param user Address of the user
     * @return User moderation stats
     */
    function getUserStats(address user) external view returns (ModerationStats memory) {
        return userStats[user];
    }

    /**
     * @notice Get global statistics
     * @return Global moderation stats
     */
    function getGlobalStats() external view returns (ModerationStats memory) {
        return globalStats;
    }

    /**
     * @notice Grant AI service role
     * @param aiService Address of AI service
     */
    function grantAIServiceRole(address aiService) external onlyRole(ADMIN_ROLE) {
        grantRole(AI_SERVICE_ROLE, aiService);
    }

    /**
     * @notice Grant moderator role
     * @param moderator Address of moderator
     */
    function grantModeratorRole(address moderator) external onlyRole(ADMIN_ROLE) {
        grantRole(MODERATOR_ROLE, moderator);
    }
}
