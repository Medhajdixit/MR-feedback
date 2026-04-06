// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../core/StudentRegistryContract.sol";
import "../core/PointEconomyContract.sol";

/**
 * @title GamificationContract
 * @notice Manages achievements, badges, leaderboards, and milestones
 * @dev Integrates with PointEconomy for rewards
 */
contract GamificationContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GAME_MANAGER_ROLE = keccak256("GAME_MANAGER_ROLE");

    StudentRegistryContract public studentRegistry;
    PointEconomyContract public pointEconomy;

    enum BadgeType {
        FirstFeedback,
        FeedbackMaster,
        QualityContributor,
        ConsistentUser,
        CommunityHelper,
        TrendSetter,
        ImpactMaker,
        PrivacyChampion
    }

    enum AchievementTier {
        Bronze,
        Silver,
        Gold,
        Platinum,
        Diamond
    }

    struct Badge {
        BadgeType badgeType;
        string name;
        string description;
        uint256 pointReward;
        uint256 requirement;
        bool isActive;
    }

    struct UserAchievement {
        address user;
        BadgeType badgeType;
        AchievementTier tier;
        uint256 earnedAt;
        uint256 pointsAwarded;
    }

    struct Milestone {
        uint256 id;
        string name;
        string description;
        uint256 targetValue;
        uint256 pointReward;
        bool isActive;
    }

    struct LeaderboardEntry {
        address user;
        uint256 totalPoints;
        uint256 totalFeedbacks;
        uint256 badgeCount;
        uint256 rank;
    }

    // Mappings
    mapping(BadgeType => Badge) public badges;
    mapping(address => mapping(BadgeType => bool)) public userBadges;
    mapping(address => UserAchievement[]) public userAchievements;
    mapping(address => uint256) public userBadgeCount;
    mapping(uint256 => Milestone) public milestones;
    mapping(address => mapping(uint256 => bool)) public userMilestones;
    
    // Statistics
    mapping(address => uint256) public feedbackCount;
    mapping(address => uint256) public qualityFeedbackCount;
    mapping(address => uint256) public consecutiveDaysActive;
    
    uint256 public totalBadgesEarned;
    uint256 public milestoneCounter;
    address[] public activeUsers;

    // Events
    event BadgeEarned(
        address indexed user,
        BadgeType badgeType,
        AchievementTier tier,
        uint256 pointsAwarded,
        uint256 timestamp
    );
    event MilestoneAchieved(
        address indexed user,
        uint256 indexed milestoneId,
        uint256 pointsAwarded,
        uint256 timestamp
    );
    event LeaderboardUpdated(address indexed user, uint256 newRank);
    event BadgeCreated(BadgeType badgeType, string name, uint256 pointReward);

    constructor(address _studentRegistry, address payable _pointEconomy) {
        require(_studentRegistry != address(0), "Invalid student registry");
        require(_pointEconomy != address(0), "Invalid point economy");

        studentRegistry = StudentRegistryContract(_studentRegistry);
        pointEconomy = PointEconomyContract(_pointEconomy);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(GAME_MANAGER_ROLE, msg.sender);

        _initializeBadges();
        _initializeMilestones();
    }

    /**
     * @notice Initialize default badges
     */
    function _initializeBadges() internal {
        badges[BadgeType.FirstFeedback] = Badge({
            badgeType: BadgeType.FirstFeedback,
            name: "First Steps",
            description: "Submit your first feedback",
            pointReward: 50,
            requirement: 1,
            isActive: true
        });

        badges[BadgeType.FeedbackMaster] = Badge({
            badgeType: BadgeType.FeedbackMaster,
            name: "Feedback Master",
            description: "Submit 50 feedbacks",
            pointReward: 500,
            requirement: 50,
            isActive: true
        });

        badges[BadgeType.QualityContributor] = Badge({
            badgeType: BadgeType.QualityContributor,
            name: "Quality Contributor",
            description: "Submit 10 high-quality feedbacks",
            pointReward: 300,
            requirement: 10,
            isActive: true
        });

        badges[BadgeType.ConsistentUser] = Badge({
            badgeType: BadgeType.ConsistentUser,
            name: "Consistency Champion",
            description: "Active for 30 consecutive days",
            pointReward: 400,
            requirement: 30,
            isActive: true
        });

        badges[BadgeType.CommunityHelper] = Badge({
            badgeType: BadgeType.CommunityHelper,
            name: "Community Helper",
            description: "Help verify 20 peer feedbacks",
            pointReward: 250,
            requirement: 20,
            isActive: true
        });
    }

    /**
     * @notice Initialize default milestones
     */
    function _initializeMilestones() internal {
        _createMilestone("Novice", "Earn 1000 points", 1000, 100);
        _createMilestone("Contributor", "Earn 5000 points", 5000, 500);
        _createMilestone("Expert", "Earn 10000 points", 10000, 1000);
        _createMilestone("Master", "Earn 25000 points", 25000, 2500);
        _createMilestone("Legend", "Earn 50000 points", 50000, 5000);
    }

    /**
     * @notice Create a new milestone
     */
    function _createMilestone(
        string memory name,
        string memory description,
        uint256 targetValue,
        uint256 pointReward
    ) internal {
        milestoneCounter++;
        milestones[milestoneCounter] = Milestone({
            id: milestoneCounter,
            name: name,
            description: description,
            targetValue: targetValue,
            pointReward: pointReward,
            isActive: true
        });
    }

    /**
     * @notice Record feedback submission and check for achievements
     * @param user Address of the user
     * @param isQuality Whether feedback is high quality
     */
    function recordFeedback(address user, bool isQuality) 
        external 
        onlyRole(GAME_MANAGER_ROLE) 
    {
        require(studentRegistry.isVerifiedStudent(user), "Not verified student");

        feedbackCount[user]++;
        if (isQuality) {
            qualityFeedbackCount[user]++;
        }

        // Check for badge achievements
        _checkBadgeEligibility(user);
        _checkMilestones(user);
    }

    /**
     * @notice Check if user is eligible for any badges
     */
    function _checkBadgeEligibility(address user) internal {
        // First Feedback badge
        if (feedbackCount[user] == 1 && !userBadges[user][BadgeType.FirstFeedback]) {
            _awardBadge(user, BadgeType.FirstFeedback, AchievementTier.Bronze);
        }

        // Feedback Master badge
        if (feedbackCount[user] >= 50 && !userBadges[user][BadgeType.FeedbackMaster]) {
            _awardBadge(user, BadgeType.FeedbackMaster, AchievementTier.Gold);
        }

        // Quality Contributor badge
        if (qualityFeedbackCount[user] >= 10 && !userBadges[user][BadgeType.QualityContributor]) {
            _awardBadge(user, BadgeType.QualityContributor, AchievementTier.Silver);
        }
    }

    /**
     * @notice Award badge to user
     */
    function _awardBadge(address user, BadgeType badgeType, AchievementTier tier) internal {
        Badge memory badge = badges[badgeType];
        require(badge.isActive, "Badge not active");
        require(!userBadges[user][badgeType], "Badge already earned");

        userBadges[user][badgeType] = true;
        userBadgeCount[user]++;
        totalBadgesEarned++;

        // Record achievement
        userAchievements[user].push(UserAchievement({
            user: user,
            badgeType: badgeType,
            tier: tier,
            earnedAt: block.timestamp,
            pointsAwarded: badge.pointReward
        }));

        emit BadgeEarned(user, badgeType, tier, badge.pointReward, block.timestamp);
    }

    /**
     * @notice Check milestone achievements
     */
    function _checkMilestones(address user) internal {
        uint256 userPoints = pointEconomy.getPointBalance(user);

        for (uint256 i = 1; i <= milestoneCounter; i++) {
            Milestone memory milestone = milestones[i];
            
            if (milestone.isActive && 
                !userMilestones[user][i] && 
                userPoints >= milestone.targetValue) {
                
                userMilestones[user][i] = true;
                
                emit MilestoneAchieved(user, i, milestone.pointReward, block.timestamp);
            }
        }
    }

    /**
     * @notice Update consecutive days active
     * @param user Address of the user
     * @param consecutiveDays Number of consecutive days
     */
    function updateConsecutiveDays(address user, uint256 consecutiveDays) 
        external 
        onlyRole(GAME_MANAGER_ROLE) 
    {
        consecutiveDaysActive[user] = consecutiveDays;

        // Check for consistency badge
        if (consecutiveDays >= 30 && !userBadges[user][BadgeType.ConsistentUser]) {
            _awardBadge(user, BadgeType.ConsistentUser, AchievementTier.Gold);
        }
    }

    /**
     * @notice Get user's badges
     * @param user Address of the user
     * @return Array of achievements
     */
    function getUserAchievements(address user) 
        external 
        view 
        returns (UserAchievement[] memory) 
    {
        return userAchievements[user];
    }

    /**
     * @notice Get leaderboard (top N users)
     * @param limit Number of users to return
     * @return Array of leaderboard entries
     */
    function getLeaderboard(uint256 limit) 
        external 
        view 
        returns (LeaderboardEntry[] memory) 
    {
        // In production, this would be optimized with off-chain indexing
        // For now, return a simplified version
        
        uint256 count = limit > activeUsers.length ? activeUsers.length : limit;
        LeaderboardEntry[] memory entries = new LeaderboardEntry[](count);
        
        for (uint256 i = 0; i < count; i++) {
            address user = activeUsers[i];
            entries[i] = LeaderboardEntry({
                user: user,
                totalPoints: pointEconomy.getPointBalance(user),
                totalFeedbacks: feedbackCount[user],
                badgeCount: userBadgeCount[user],
                rank: i + 1
            });
        }
        
        return entries;
    }

    /**
     * @notice Get user statistics
     * @param user Address of the user
     * @return feedbacks Total feedbacks
     * @return qualityFeedbacks Quality feedbacks
     * @return badgeCount Total badges earned
     * @return consecutiveDays Consecutive days active
     */
    function getUserStats(address user) 
        external 
        view 
        returns (
            uint256 feedbacks,
            uint256 qualityFeedbacks,
            uint256 badgeCount,
            uint256 consecutiveDays
        ) 
    {
        return (
            feedbackCount[user],
            qualityFeedbackCount[user],
            userBadgeCount[user],
            consecutiveDaysActive[user]
        );
    }

    /**
     * @notice Check if user has specific badge
     * @param user Address of the user
     * @param badgeType Type of badge
     * @return True if user has badge
     */
    function hasBadge(address user, BadgeType badgeType) 
        external 
        view 
        returns (bool) 
    {
        return userBadges[user][badgeType];
    }

    /**
     * @notice Grant game manager role
     * @param manager Address to grant role to
     */
    function grantGameManagerRole(address manager) external onlyRole(ADMIN_ROLE) {
        grantRole(GAME_MANAGER_ROLE, manager);
    }
}
