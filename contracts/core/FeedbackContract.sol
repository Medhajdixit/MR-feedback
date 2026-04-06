// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StudentRegistryContract.sol";
import "./AIModerationContract.sol";
import "../privacy/PrivacyContract.sol";

/**
 * @title FeedbackContract
 * @notice Manages feedback submission with AI moderation integration
 * @dev Stores feedback on-chain with IPFS content hashes
 */
contract FeedbackContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    StudentRegistryContract public studentRegistry;
    AIModerationContract public aiModeration;
    PrivacyContract public privacyContract;

    enum FeedbackCategory {
        General,
        Infrastructure,
        Faculty,
        Administration,
        Food,
        Technology,
        Safety,
        Other
    }

    enum FeedbackStatus {
        Pending,
        Approved,
        Rejected,
        Implemented,
        UnderReview
    }

    struct Feedback {
        uint256 id;
        address author;
        FeedbackCategory category;
        bytes32 contentHash; // IPFS hash
        bytes32 imageHash;   // Optional image IPFS hash
        uint8 aiQualityScore;
        FeedbackStatus status;
        uint256 timestamp;
        bool isAnonymous;
        bool hasImage;
        uint256 upvotes;
        uint256 downvotes;
        bool isImplemented;
    }

    // Mappings
    mapping(uint256 => Feedback) public feedbacks;
    mapping(address => uint256[]) public userFeedbacks;
    mapping(FeedbackCategory => uint256[]) public categoryFeedbacks;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public hasUpvoted;
    
    uint256 public feedbackCounter;
    uint256 public totalFeedbacks;
    uint256 public approvedFeedbacks;
    uint256 public implementedFeedbacks;

    // Events
    event FeedbackSubmitted(
        uint256 indexed feedbackId,
        address indexed author,
        FeedbackCategory category,
        bool isAnonymous,
        uint256 timestamp
    );
    event FeedbackApproved(uint256 indexed feedbackId, uint256 timestamp);
    event FeedbackRejected(uint256 indexed feedbackId, string reason, uint256 timestamp);
    event FeedbackImplemented(uint256 indexed feedbackId, uint256 timestamp);
    event FeedbackVoted(uint256 indexed feedbackId, address indexed voter, bool isUpvote);
    event FeedbackStatusUpdated(uint256 indexed feedbackId, FeedbackStatus newStatus);

    constructor(
        address _studentRegistry,
        address _aiModeration,
        address _privacyContract
    ) {
        require(_studentRegistry != address(0), "Invalid student registry");
        require(_aiModeration != address(0), "Invalid AI moderation");
        require(_privacyContract != address(0), "Invalid privacy contract");

        studentRegistry = StudentRegistryContract(_studentRegistry);
        aiModeration = AIModerationContract(_aiModeration);
        privacyContract = PrivacyContract(_privacyContract);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Submit feedback
     * @param category Feedback category
     * @param contentHash IPFS hash of feedback content
     * @param imageHash IPFS hash of image (optional)
     * @param aiQualityScore AI-determined quality score
     * @param isAnonymous Whether to submit anonymously
     * @return feedbackId ID of the created feedback
     */
    function submitFeedback(
        FeedbackCategory category,
        bytes32 contentHash,
        bytes32 imageHash,
        uint8 aiQualityScore,
        bool isAnonymous
    ) external nonReentrant returns (uint256) {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        require(contentHash != bytes32(0), "Invalid content hash");
        require(aiQualityScore <= 100, "Invalid quality score");

        // Check AI moderation result
        uint256 moderationId = feedbackCounter;
        AIModerationContract.ModerationResult memory modResult = 
            aiModeration.getModerationResult(moderationId);
        
        require(
            modResult.decision == AIModerationContract.ModerationDecision.Approved ||
            modResult.decision == AIModerationContract.ModerationDecision.Pending,
            "Content rejected by AI moderation"
        );

        feedbackCounter++;
        uint256 feedbackId = feedbackCounter;

        feedbacks[feedbackId] = Feedback({
            id: feedbackId,
            author: msg.sender,
            category: category,
            contentHash: contentHash,
            imageHash: imageHash,
            aiQualityScore: aiQualityScore,
            status: FeedbackStatus.Pending,
            timestamp: block.timestamp,
            isAnonymous: isAnonymous,
            hasImage: imageHash != bytes32(0),
            upvotes: 0,
            downvotes: 0,
            isImplemented: false
        });

        userFeedbacks[msg.sender].push(feedbackId);
        categoryFeedbacks[category].push(feedbackId);
        totalFeedbacks++;

        // If anonymous, mark content as anonymized
        if (isAnonymous) {
            privacyContract.anonymizeContent(feedbackId);
        }

        emit FeedbackSubmitted(feedbackId, msg.sender, category, isAnonymous, block.timestamp);

        return feedbackId;
    }

    /**
     * @notice Approve feedback (moderator only)
     * @param feedbackId ID of the feedback
     */
    function approveFeedback(uint256 feedbackId) 
        external 
        onlyRole(MODERATOR_ROLE) 
    {
        require(feedbacks[feedbackId].id != 0, "Feedback not found");
        require(feedbacks[feedbackId].status == FeedbackStatus.Pending, 
                "Feedback not pending");

        feedbacks[feedbackId].status = FeedbackStatus.Approved;
        approvedFeedbacks++;

        emit FeedbackApproved(feedbackId, block.timestamp);
    }

    /**
     * @notice Reject feedback (moderator only)
     * @param feedbackId ID of the feedback
     * @param reason Reason for rejection
     */
    function rejectFeedback(uint256 feedbackId, string memory reason) 
        external 
        onlyRole(MODERATOR_ROLE) 
    {
        require(feedbacks[feedbackId].id != 0, "Feedback not found");
        require(feedbacks[feedbackId].status == FeedbackStatus.Pending, 
                "Feedback not pending");
        require(bytes(reason).length > 0, "Reason required");

        feedbacks[feedbackId].status = FeedbackStatus.Rejected;

        emit FeedbackRejected(feedbackId, reason, block.timestamp);
    }

    /**
     * @notice Mark feedback as implemented
     * @param feedbackId ID of the feedback
     */
    function markAsImplemented(uint256 feedbackId) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(feedbacks[feedbackId].id != 0, "Feedback not found");
        require(feedbacks[feedbackId].status == FeedbackStatus.Approved, 
                "Feedback not approved");
        require(!feedbacks[feedbackId].isImplemented, "Already implemented");

        feedbacks[feedbackId].status = FeedbackStatus.Implemented;
        feedbacks[feedbackId].isImplemented = true;
        implementedFeedbacks++;

        emit FeedbackImplemented(feedbackId, block.timestamp);
    }

    /**
     * @notice Vote on feedback
     * @param feedbackId ID of the feedback
     * @param isUpvote True for upvote, false for downvote
     */
    function voteFeedback(uint256 feedbackId, bool isUpvote) external {
        require(feedbacks[feedbackId].id != 0, "Feedback not found");
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        require(!hasVoted[feedbackId][msg.sender], "Already voted");
        require(feedbacks[feedbackId].status == FeedbackStatus.Approved, 
                "Feedback not approved");

        hasVoted[feedbackId][msg.sender] = true;
        hasUpvoted[feedbackId][msg.sender] = isUpvote;

        if (isUpvote) {
            feedbacks[feedbackId].upvotes++;
        } else {
            feedbacks[feedbackId].downvotes++;
        }

        emit FeedbackVoted(feedbackId, msg.sender, isUpvote);
    }

    /**
     * @notice Get feedback by ID
     * @param feedbackId ID of the feedback
     * @return Feedback struct
     */
    function getFeedback(uint256 feedbackId) 
        external 
        view 
        returns (Feedback memory) 
    {
        return feedbacks[feedbackId];
    }

    /**
     * @notice Get user's feedbacks
     * @param user Address of the user
     * @return Array of feedback IDs
     */
    function getUserFeedbacks(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userFeedbacks[user];
    }

    /**
     * @notice Get feedbacks by category
     * @param category Feedback category
     * @return Array of feedback IDs
     */
    function getFeedbacksByCategory(FeedbackCategory category) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return categoryFeedbacks[category];
    }

    /**
     * @notice Get feedback statistics
     * @return total Total feedbacks
     * @return approved Approved feedbacks
     * @return implemented Implemented feedbacks
     */
    function getStatistics() 
        external 
        view 
        returns (uint256 total, uint256 approved, uint256 implemented) 
    {
        return (totalFeedbacks, approvedFeedbacks, implementedFeedbacks);
    }

    /**
     * @notice Update feedback status
     * @param feedbackId ID of the feedback
     * @param newStatus New status
     */
    function updateStatus(uint256 feedbackId, FeedbackStatus newStatus) 
        external 
        onlyRole(MODERATOR_ROLE) 
    {
        require(feedbacks[feedbackId].id != 0, "Feedback not found");
        
        feedbacks[feedbackId].status = newStatus;
        
        emit FeedbackStatusUpdated(feedbackId, newStatus);
    }

    /**
     * @notice Grant moderator role
     * @param moderator Address to grant role to
     */
    function grantModeratorRole(address moderator) external onlyRole(ADMIN_ROLE) {
        grantRole(MODERATOR_ROLE, moderator);
    }
}
