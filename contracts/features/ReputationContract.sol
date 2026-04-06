// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../core/StudentRegistryContract.sol";

/**
 * @title ReputationContract
 * @notice Manages user reputation and credibility scores
 * @dev Calculates reputation based on multiple factors
 */
contract ReputationContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER_ROLE");

    StudentRegistryContract public studentRegistry;

    struct ReputationScore {
        uint256 totalScore;
        uint256 feedbackQuality;
        uint256 communityEngagement;
        uint256 consistency;
        uint256 helpfulness;
        uint256 lastUpdated;
    }

    struct ReputationHistory {
        uint256 timestamp;
        int256 change;
        string reason;
    }

    // Mappings
    mapping(address => ReputationScore) public reputationScores;
    mapping(address => ReputationHistory[]) public reputationHistory;
    mapping(address => uint256) public trustLevel; // 0-5
    
    uint256 public constant MAX_REPUTATION = 10000;
    uint256 public constant INITIAL_REPUTATION = 100;

    // Events
    event ReputationUpdated(
        address indexed user,
        uint256 newScore,
        int256 change,
        string reason
    );
    event TrustLevelChanged(address indexed user, uint256 newLevel);

    constructor(address _studentRegistry) {
        require(_studentRegistry != address(0), "Invalid student registry");
        
        studentRegistry = StudentRegistryContract(_studentRegistry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REPUTATION_MANAGER_ROLE, msg.sender);
    }

    /**
     * @notice Initialize reputation for new user
     * @param user Address of the user
     */
    function initializeReputation(address user) 
        external 
        onlyRole(REPUTATION_MANAGER_ROLE) 
    {
        require(studentRegistry.isVerifiedStudent(user), "Not verified student");
        require(reputationScores[user].lastUpdated == 0, "Already initialized");

        reputationScores[user] = ReputationScore({
            totalScore: INITIAL_REPUTATION,
            feedbackQuality: 20,
            communityEngagement: 20,
            consistency: 20,
            helpfulness: 20,
            lastUpdated: block.timestamp
        });

        trustLevel[user] = 1; // Novice level

        emit ReputationUpdated(user, INITIAL_REPUTATION, int256(INITIAL_REPUTATION), "Initial reputation");
    }

    /**
     * @notice Update reputation based on feedback quality
     * @param user Address of the user
     * @param qualityScore Quality score (0-100)
     */
    function updateFeedbackQuality(address user, uint256 qualityScore) 
        external 
        onlyRole(REPUTATION_MANAGER_ROLE) 
    {
        require(qualityScore <= 100, "Invalid quality score");

        ReputationScore storage score = reputationScores[user];
        
        // Calculate change based on quality
        int256 change = 0;
        if (qualityScore >= 80) {
            change = 10;
        } else if (qualityScore >= 60) {
            change = 5;
        } else if (qualityScore >= 40) {
            change = 0;
        } else {
            change = -5;
        }

        _updateReputation(user, change, "Feedback quality");
        score.feedbackQuality = (score.feedbackQuality + qualityScore) / 2;
    }

    /**
     * @notice Update reputation based on community engagement
     * @param user Address of the user
     * @param engagementPoints Engagement points earned
     */
    function updateCommunityEngagement(address user, uint256 engagementPoints) 
        external 
        onlyRole(REPUTATION_MANAGER_ROLE) 
    {
        int256 change = int256(engagementPoints / 10);
        _updateReputation(user, change, "Community engagement");
        
        ReputationScore storage score = reputationScores[user];
        score.communityEngagement += engagementPoints;
    }

    /**
     * @notice Update reputation based on consistency
     * @param user Address of the user
     * @param consecutiveDays Number of consecutive days active
     */
    function updateConsistency(address user, uint256 consecutiveDays) 
        external 
        onlyRole(REPUTATION_MANAGER_ROLE) 
    {
        int256 change = 0;
        if (consecutiveDays >= 30) {
            change = 20;
        } else if (consecutiveDays >= 14) {
            change = 10;
        } else if (consecutiveDays >= 7) {
            change = 5;
        }

        if (change > 0) {
            _updateReputation(user, change, "Consistency bonus");
            reputationScores[user].consistency += uint256(change);
        }
    }

    /**
     * @notice Update reputation based on helpfulness
     * @param user Address of the user
     * @param helpfulActions Number of helpful actions
     */
    function updateHelpfulness(address user, uint256 helpfulActions) 
        external 
        onlyRole(REPUTATION_MANAGER_ROLE) 
    {
        int256 change = int256(helpfulActions * 3);
        _updateReputation(user, change, "Helpfulness");
        
        reputationScores[user].helpfulness += helpfulActions;
    }

    /**
     * @notice Internal function to update reputation
     */
    function _updateReputation(address user, int256 change, string memory reason) internal {
        ReputationScore storage score = reputationScores[user];
        
        // Apply change
        if (change > 0) {
            score.totalScore = score.totalScore + uint256(change);
            if (score.totalScore > MAX_REPUTATION) {
                score.totalScore = MAX_REPUTATION;
            }
        } else if (change < 0) {
            uint256 decrease = uint256(-change);
            if (score.totalScore > decrease) {
                score.totalScore -= decrease;
            } else {
                score.totalScore = 0;
            }
        }

        score.lastUpdated = block.timestamp;

        // Record history
        reputationHistory[user].push(ReputationHistory({
            timestamp: block.timestamp,
            change: change,
            reason: reason
        }));

        // Update trust level
        _updateTrustLevel(user);

        emit ReputationUpdated(user, score.totalScore, change, reason);
    }

    /**
     * @notice Update trust level based on reputation
     */
    function _updateTrustLevel(address user) internal {
        uint256 reputation = reputationScores[user].totalScore;
        uint256 oldLevel = trustLevel[user];
        uint256 newLevel;

        if (reputation >= 5000) {
            newLevel = 5; // Expert
        } else if (reputation >= 2000) {
            newLevel = 4; // Advanced
        } else if (reputation >= 1000) {
            newLevel = 3; // Intermediate
        } else if (reputation >= 500) {
            newLevel = 2; // Contributor
        } else {
            newLevel = 1; // Novice
        }

        if (newLevel != oldLevel) {
            trustLevel[user] = newLevel;
            emit TrustLevelChanged(user, newLevel);
        }
    }

    /**
     * @notice Get user reputation score
     * @param user Address of the user
     * @return Reputation score struct
     */
    function getReputationScore(address user) 
        external 
        view 
        returns (ReputationScore memory) 
    {
        return reputationScores[user];
    }

    /**
     * @notice Get user reputation history
     * @param user Address of the user
     * @return Array of reputation history
     */
    function getReputationHistory(address user) 
        external 
        view 
        returns (ReputationHistory[] memory) 
    {
        return reputationHistory[user];
    }

    /**
     * @notice Get user trust level
     * @param user Address of the user
     * @return Trust level (0-5)
     */
    function getTrustLevel(address user) external view returns (uint256) {
        return trustLevel[user];
    }

    /**
     * @notice Check if user is trusted (level >= 3)
     * @param user Address of the user
     * @return True if trusted
     */
    function isTrustedUser(address user) external view returns (bool) {
        return trustLevel[user] >= 3;
    }

    /**
     * @notice Grant reputation manager role
     * @param manager Address to grant role to
     */
    function grantReputationManagerRole(address manager) external onlyRole(ADMIN_ROLE) {
        grantRole(REPUTATION_MANAGER_ROLE, manager);
    }
}
