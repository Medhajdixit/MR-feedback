// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StudentRegistryContract.sol";

/**
 * @title PointEconomyContract
 * @notice Manages dynamic point-based reward system with AI quality bonuses
 * @dev 1000 points = 1 INR = ~1 SHM
 */
contract PointEconomyContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    StudentRegistryContract public studentRegistry;

    uint256 public constant POINTS_TO_INR_RATIO = 1000; // 1000 points = 1 INR
    uint256 public constant POINTS_TO_SHM_RATIO = 1000; // 1000 points = 1 SHM

    enum ActivityType {
        BasicFeedback,
        FacultyRating,
        InfrastructureReport,
        InfrastructureWithImage,
        AIEnhancementAccepted,
        PeerVerification,
        WeeklyConsistency,
        AITrainingContribution
    }

    struct PointTransaction {
        address user;
        ActivityType activity;
        uint256 basePoints;
        uint256 qualityBonus;
        uint256 totalPoints;
        uint256 timestamp;
        string description;
    }

    struct UserPointsData {
        uint256 totalPoints;
        uint256 lifetimePoints;
        uint256 redeemedPoints;
        uint256 lastActivityTime;
        uint256 consecutiveDays;
        uint256 transactionCount;
    }

    // Base points for each activity
    mapping(ActivityType => uint256) public basePoints;
    mapping(ActivityType => uint256) public maxQualityBonus;

    // User data
    mapping(address => UserPointsData) public userPoints;
    mapping(address => PointTransaction[]) public userTransactions;
    mapping(address => mapping(uint256 => bool)) public dailyActivity; // user => day => hasActivity

    uint256 public totalPointsIssued;
    uint256 public totalPointsRedeemed;
    uint256 public totalTransactions;

    // Events
    event PointsAwarded(
        address indexed user,
        ActivityType activity,
        uint256 basePoints,
        uint256 qualityBonus,
        uint256 totalPoints,
        uint256 timestamp
    );
    event PointsRedeemed(address indexed user, uint256 points, uint256 shmAmount);
    event PointsTransferred(address indexed from, address indexed to, uint256 points);
    event StreakBonusAwarded(address indexed user, uint256 consecutiveDays, uint256 bonusPoints);
    event BasePointsUpdated(ActivityType activity, uint256 newBasePoints);

    constructor(address _studentRegistry) {
        require(_studentRegistry != address(0), "Invalid student registry");
        
        studentRegistry = StudentRegistryContract(_studentRegistry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);

        // Initialize base points
        basePoints[ActivityType.BasicFeedback] = 10;
        basePoints[ActivityType.FacultyRating] = 25;
        basePoints[ActivityType.InfrastructureReport] = 30;
        basePoints[ActivityType.InfrastructureWithImage] = 50;
        basePoints[ActivityType.AIEnhancementAccepted] = 20;
        basePoints[ActivityType.PeerVerification] = 15;
        basePoints[ActivityType.WeeklyConsistency] = 100;
        basePoints[ActivityType.AITrainingContribution] = 50;

        // Initialize max quality bonuses
        maxQualityBonus[ActivityType.BasicFeedback] = 15;
        maxQualityBonus[ActivityType.FacultyRating] = 25;
        maxQualityBonus[ActivityType.InfrastructureReport] = 20;
        maxQualityBonus[ActivityType.InfrastructureWithImage] = 30;
        maxQualityBonus[ActivityType.AIEnhancementAccepted] = 0;
        maxQualityBonus[ActivityType.PeerVerification] = 10;
        maxQualityBonus[ActivityType.WeeklyConsistency] = 50;
        maxQualityBonus[ActivityType.AITrainingContribution] = 0;
    }

    /**
     * @notice Award points to user
     * @param user Address of the user
     * @param activity Type of activity
     * @param aiQualityScore AI quality score (0-100)
     * @param description Description of the activity
     */
    function awardPoints(
        address user,
        ActivityType activity,
        uint8 aiQualityScore,
        string memory description
    ) external onlyRole(REWARD_MANAGER_ROLE) {
        require(studentRegistry.isVerifiedStudent(user), "Not verified student");
        require(aiQualityScore <= 100, "Invalid quality score");

        uint256 base = basePoints[activity];
        uint256 bonus = calculateQualityBonus(activity, aiQualityScore);
        uint256 total = base + bonus;

        // Update user points
        userPoints[user].totalPoints += total;
        userPoints[user].lifetimePoints += total;
        userPoints[user].lastActivityTime = block.timestamp;
        userPoints[user].transactionCount++;

        // Record transaction
        userTransactions[user].push(PointTransaction({
            user: user,
            activity: activity,
            basePoints: base,
            qualityBonus: bonus,
            totalPoints: total,
            timestamp: block.timestamp,
            description: description
        }));

        // Update daily activity
        uint256 today = block.timestamp / 1 days;
        if (!dailyActivity[user][today]) {
            dailyActivity[user][today] = true;
            _updateStreak(user, today);
        }

        totalPointsIssued += total;
        totalTransactions++;

        emit PointsAwarded(user, activity, base, bonus, total, block.timestamp);
    }

    /**
     * @notice Calculate quality bonus based on AI score
     * @param activity Type of activity
     * @param aiQualityScore AI quality score (0-100)
     * @return Bonus points
     */
    function calculateQualityBonus(ActivityType activity, uint8 aiQualityScore) 
        public 
        view 
        returns (uint256) 
    {
        uint256 maxBonus = maxQualityBonus[activity];
        if (maxBonus == 0) return 0;

        // Linear scaling: higher quality = more bonus
        return (maxBonus * aiQualityScore) / 100;
    }

    /**
     * @notice Update user's consecutive days streak
     * @param user Address of the user
     * @param today Current day number
     */
    function _updateStreak(address user, uint256 today) internal {
        uint256 yesterday = today - 1;
        
        if (dailyActivity[user][yesterday]) {
            // Streak continues
            userPoints[user].consecutiveDays++;
            
            // Award streak bonus every 7 days
            if (userPoints[user].consecutiveDays % 7 == 0) {
                uint256 streakBonus = 50 * (userPoints[user].consecutiveDays / 7);
                userPoints[user].totalPoints += streakBonus;
                userPoints[user].lifetimePoints += streakBonus;
                
                emit StreakBonusAwarded(user, userPoints[user].consecutiveDays, streakBonus);
            }
        } else {
            // Streak broken, reset
            userPoints[user].consecutiveDays = 1;
        }
    }

    /**
     * @notice Redeem points for SHM
     * @param points Amount of points to redeem
     */
    function redeemPoints(uint256 points) external nonReentrant {
        require(userPoints[msg.sender].totalPoints >= points, "Insufficient points");
        require(points >= POINTS_TO_SHM_RATIO, "Minimum 1000 points required");
        require(points % POINTS_TO_SHM_RATIO == 0, "Points must be multiple of 1000");

        uint256 shmAmount = (points * 1 ether) / POINTS_TO_SHM_RATIO;
        require(address(this).balance >= shmAmount, "Insufficient contract balance");

        userPoints[msg.sender].totalPoints -= points;
        userPoints[msg.sender].redeemedPoints += points;
        totalPointsRedeemed += points;

        (bool success, ) = msg.sender.call{value: shmAmount}("");
        require(success, "Transfer failed");

        emit PointsRedeemed(msg.sender, points, shmAmount);
    }

    /**
     * @notice Transfer points to another user
     * @param to Recipient address
     * @param points Amount of points
     */
    function transferPoints(address to, uint256 points) external {
        require(studentRegistry.isVerifiedStudent(to), "Recipient not verified");
        require(userPoints[msg.sender].totalPoints >= points, "Insufficient points");
        require(points > 0, "Invalid amount");

        userPoints[msg.sender].totalPoints -= points;
        userPoints[to].totalPoints += points;

        emit PointsTransferred(msg.sender, to, points);
    }

    /**
     * @notice Get user's point balance
     * @param user Address of the user
     * @return Total points
     */
    function getPointBalance(address user) external view returns (uint256) {
        return userPoints[user].totalPoints;
    }

    /**
     * @notice Get user's points data
     * @param user Address of the user
     * @return User points data struct
     */
    function getUserPointsData(address user) 
        external 
        view 
        returns (UserPointsData memory) 
    {
        return userPoints[user];
    }

    /**
     * @notice Get user's transaction history
     * @param user Address of the user
     * @return Array of transactions
     */
    function getUserTransactions(address user) 
        external 
        view 
        returns (PointTransaction[] memory) 
    {
        return userTransactions[user];
    }

    /**
     * @notice Convert points to INR value
     * @param points Amount of points
     * @return INR value (in wei, 18 decimals)
     */
    function pointsToINR(uint256 points) external pure returns (uint256) {
        return (points * 1 ether) / POINTS_TO_INR_RATIO;
    }

    /**
     * @notice Convert points to SHM value
     * @param points Amount of points
     * @return SHM value (in wei)
     */
    function pointsToSHM(uint256 points) external pure returns (uint256) {
        return (points * 1 ether) / POINTS_TO_SHM_RATIO;
    }

    /**
     * @notice Update base points for activity
     * @param activity Activity type
     * @param newBasePoints New base points value
     */
    function updateBasePoints(ActivityType activity, uint256 newBasePoints) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        basePoints[activity] = newBasePoints;
        emit BasePointsUpdated(activity, newBasePoints);
    }

    /**
     * @notice Update max quality bonus for activity
     * @param activity Activity type
     * @param newMaxBonus New max bonus value
     */
    function updateMaxQualityBonus(ActivityType activity, uint256 newMaxBonus) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        maxQualityBonus[activity] = newMaxBonus;
    }

    /**
     * @notice Get global statistics
     * @return issued Total points issued
     * @return redeemed Total points redeemed
     * @return transactions Total transactions
     */
    function getGlobalStats() 
        external 
        view 
        returns (uint256 issued, uint256 redeemed, uint256 transactions) 
    {
        return (totalPointsIssued, totalPointsRedeemed, totalTransactions);
    }

    /**
     * @notice Fund contract with SHM for redemptions
     */
    function fundContract() external payable onlyRole(ADMIN_ROLE) {
        require(msg.value > 0, "Must send SHM");
    }

    /**
     * @notice Get contract balance
     * @return Balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Grant reward manager role
     * @param manager Address to grant role to
     */
    function grantRewardManagerRole(address manager) external onlyRole(ADMIN_ROLE) {
        grantRole(REWARD_MANAGER_ROLE, manager);
    }

    receive() external payable {}
}
