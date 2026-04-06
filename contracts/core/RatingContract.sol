// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StudentRegistryContract.sol";
import "./AIModerationContract.sol";

/**
 * @title RatingContract
 * @notice Manages multi-dimensional ratings for faculty and infrastructure
 * @dev Supports 1-10 scale ratings with AI validation
 */
contract RatingContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    StudentRegistryContract public studentRegistry;
    AIModerationContract public aiModeration;

    enum RatingType {
        Faculty,
        Infrastructure,
        FoodService,
        Administration,
        Technology,
        Safety
    }

    // Faculty rating dimensions (1-10 scale)
    struct FacultyRating {
        uint256 id;
        address rater;
        address faculty;
        uint8 teachingEffectiveness;
        uint8 accessibilitySupport;
        uint8 innovationAdaptability;
        uint8 assessmentFairness;
        uint8 professionalDevelopment;
        bytes32 commentHash; // IPFS hash
        uint256 timestamp;
        bool isAnonymous;
        bool isVerified;
    }

    // Infrastructure rating
    struct InfrastructureRating {
        uint256 id;
        address rater;
        string location;
        uint8 physicalCondition;
        uint8 technologySystems;
        uint8 learningEnvironment;
        uint8 recreationalFacilities;
        bytes32 commentHash;
        bytes32 imageHash;
        uint256 timestamp;
        bool isAnonymous;
        bool isVerified;
    }

    // Service rating
    struct ServiceRating {
        uint256 id;
        address rater;
        RatingType serviceType;
        uint8 quality;
        uint8 efficiency;
        uint8 responsiveness;
        uint8 satisfaction;
        bytes32 commentHash;
        uint256 timestamp;
        bool isAnonymous;
    }

    // Aggregate ratings
    struct FacultyAggregate {
        uint256 totalRatings;
        uint256 sumTeachingEffectiveness;
        uint256 sumAccessibilitySupport;
        uint256 sumInnovationAdaptability;
        uint256 sumAssessmentFairness;
        uint256 sumProfessionalDevelopment;
        uint256 lastUpdated;
    }

    // Mappings
    mapping(uint256 => FacultyRating) public facultyRatings;
    mapping(uint256 => InfrastructureRating) public infrastructureRatings;
    mapping(uint256 => ServiceRating) public serviceRatings;
    
    mapping(address => FacultyAggregate) public facultyAggregates;
    mapping(address => uint256[]) public facultyRatingIds;
    mapping(string => uint256[]) public locationRatingIds;
    mapping(address => mapping(address => bool)) public hasRatedFaculty;
    
    uint256 public facultyRatingCounter;
    uint256 public infrastructureRatingCounter;
    uint256 public serviceRatingCounter;

    // Events
    event FacultyRated(
        uint256 indexed ratingId,
        address indexed rater,
        address indexed faculty,
        uint8[5] dimensions,
        uint256 timestamp
    );
    event InfrastructureRated(
        uint256 indexed ratingId,
        address indexed rater,
        string location,
        uint256 timestamp
    );
    event ServiceRated(
        uint256 indexed ratingId,
        address indexed rater,
        RatingType serviceType,
        uint256 timestamp
    );
    event RatingVerified(uint256 indexed ratingId, RatingType ratingType);

    constructor(
        address _studentRegistry,
        address _aiModeration
    ) {
        require(_studentRegistry != address(0), "Invalid student registry");
        require(_aiModeration != address(0), "Invalid AI moderation");

        studentRegistry = StudentRegistryContract(_studentRegistry);
        aiModeration = AIModerationContract(_aiModeration);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Submit faculty rating
     * @param faculty Address of faculty member
     * @param dimensions Array of 5 ratings (1-10 scale)
     * @param commentHash IPFS hash of comment
     * @param isAnonymous Whether to submit anonymously
     * @return ratingId ID of the created rating
     */
    function submitFacultyRating(
        address faculty,
        uint8[5] memory dimensions,
        bytes32 commentHash,
        bool isAnonymous
    ) external nonReentrant returns (uint256) {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        require(studentRegistry.isFaculty(faculty), "Not a faculty member");
        require(!hasRatedFaculty[msg.sender][faculty], "Already rated this faculty");
        
        // Validate dimensions (1-10 scale)
        for (uint i = 0; i < 5; i++) {
            require(dimensions[i] >= 1 && dimensions[i] <= 10, "Invalid rating value");
        }

        facultyRatingCounter++;
        uint256 ratingId = facultyRatingCounter;

        facultyRatings[ratingId] = FacultyRating({
            id: ratingId,
            rater: msg.sender,
            faculty: faculty,
            teachingEffectiveness: dimensions[0],
            accessibilitySupport: dimensions[1],
            innovationAdaptability: dimensions[2],
            assessmentFairness: dimensions[3],
            professionalDevelopment: dimensions[4],
            commentHash: commentHash,
            timestamp: block.timestamp,
            isAnonymous: isAnonymous,
            isVerified: false
        });

        facultyRatingIds[faculty].push(ratingId);
        hasRatedFaculty[msg.sender][faculty] = true;

        // Update aggregate
        _updateFacultyAggregate(faculty, dimensions);

        emit FacultyRated(ratingId, msg.sender, faculty, dimensions, block.timestamp);

        return ratingId;
    }

    /**
     * @notice Update faculty aggregate ratings
     */
    function _updateFacultyAggregate(address faculty, uint8[5] memory dimensions) internal {
        FacultyAggregate storage aggregate = facultyAggregates[faculty];
        
        aggregate.totalRatings++;
        aggregate.sumTeachingEffectiveness += dimensions[0];
        aggregate.sumAccessibilitySupport += dimensions[1];
        aggregate.sumInnovationAdaptability += dimensions[2];
        aggregate.sumAssessmentFairness += dimensions[3];
        aggregate.sumProfessionalDevelopment += dimensions[4];
        aggregate.lastUpdated = block.timestamp;
    }

    /**
     * @notice Submit infrastructure rating
     * @param location Location identifier
     * @param dimensions Array of 4 ratings (1-10 scale)
     * @param commentHash IPFS hash of comment
     * @param imageHash IPFS hash of image (optional)
     * @param isAnonymous Whether to submit anonymously
     * @return ratingId ID of the created rating
     */
    function submitInfrastructureRating(
        string memory location,
        uint8[4] memory dimensions,
        bytes32 commentHash,
        bytes32 imageHash,
        bool isAnonymous
    ) external nonReentrant returns (uint256) {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        require(bytes(location).length > 0, "Location required");
        
        // Validate dimensions (1-10 scale)
        for (uint i = 0; i < 4; i++) {
            require(dimensions[i] >= 1 && dimensions[i] <= 10, "Invalid rating value");
        }

        infrastructureRatingCounter++;
        uint256 ratingId = infrastructureRatingCounter;

        infrastructureRatings[ratingId] = InfrastructureRating({
            id: ratingId,
            rater: msg.sender,
            location: location,
            physicalCondition: dimensions[0],
            technologySystems: dimensions[1],
            learningEnvironment: dimensions[2],
            recreationalFacilities: dimensions[3],
            commentHash: commentHash,
            imageHash: imageHash,
            timestamp: block.timestamp,
            isAnonymous: isAnonymous,
            isVerified: false
        });

        locationRatingIds[location].push(ratingId);

        emit InfrastructureRated(ratingId, msg.sender, location, block.timestamp);

        return ratingId;
    }

    /**
     * @notice Submit service rating
     * @param serviceType Type of service
     * @param dimensions Array of 4 ratings (1-10 scale)
     * @param commentHash IPFS hash of comment
     * @param isAnonymous Whether to submit anonymously
     * @return ratingId ID of the created rating
     */
    function submitServiceRating(
        RatingType serviceType,
        uint8[4] memory dimensions,
        bytes32 commentHash,
        bool isAnonymous
    ) external nonReentrant returns (uint256) {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        
        // Validate dimensions (1-10 scale)
        for (uint i = 0; i < 4; i++) {
            require(dimensions[i] >= 1 && dimensions[i] <= 10, "Invalid rating value");
        }

        serviceRatingCounter++;
        uint256 ratingId = serviceRatingCounter;

        serviceRatings[ratingId] = ServiceRating({
            id: ratingId,
            rater: msg.sender,
            serviceType: serviceType,
            quality: dimensions[0],
            efficiency: dimensions[1],
            responsiveness: dimensions[2],
            satisfaction: dimensions[3],
            commentHash: commentHash,
            timestamp: block.timestamp,
            isAnonymous: isAnonymous
        });

        emit ServiceRated(ratingId, msg.sender, serviceType, block.timestamp);

        return ratingId;
    }

    /**
     * @notice Get average faculty ratings
     * @param faculty Address of faculty member
     * @return averages Array of 5 average ratings
     */
    function getAverageRating(address faculty) 
        external 
        view 
        returns (uint8[5] memory averages) 
    {
        FacultyAggregate memory aggregate = facultyAggregates[faculty];
        
        if (aggregate.totalRatings == 0) {
            return [0, 0, 0, 0, 0];
        }

        averages[0] = uint8(aggregate.sumTeachingEffectiveness / aggregate.totalRatings);
        averages[1] = uint8(aggregate.sumAccessibilitySupport / aggregate.totalRatings);
        averages[2] = uint8(aggregate.sumInnovationAdaptability / aggregate.totalRatings);
        averages[3] = uint8(aggregate.sumAssessmentFairness / aggregate.totalRatings);
        averages[4] = uint8(aggregate.sumProfessionalDevelopment / aggregate.totalRatings);

        return averages;
    }

    /**
     * @notice Get faculty rating history
     * @param faculty Address of faculty member
     * @return Array of rating IDs
     */
    function getRatingHistory(address faculty) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return facultyRatingIds[faculty];
    }

    /**
     * @notice Get infrastructure ratings for location
     * @param location Location identifier
     * @return Array of rating IDs
     */
    function getLocationRatings(string memory location) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return locationRatingIds[location];
    }

    /**
     * @notice Get faculty rating details
     * @param ratingId ID of the rating
     * @return Faculty rating struct
     */
    function getFacultyRating(uint256 ratingId) 
        external 
        view 
        returns (FacultyRating memory) 
    {
        return facultyRatings[ratingId];
    }

    /**
     * @notice Get infrastructure rating details
     * @param ratingId ID of the rating
     * @return Infrastructure rating struct
     */
    function getInfrastructureRating(uint256 ratingId) 
        external 
        view 
        returns (InfrastructureRating memory) 
    {
        return infrastructureRatings[ratingId];
    }

    /**
     * @notice Get service rating details
     * @param ratingId ID of the rating
     * @return Service rating struct
     */
    function getServiceRating(uint256 ratingId) 
        external 
        view 
        returns (ServiceRating memory) 
    {
        return serviceRatings[ratingId];
    }

    /**
     * @notice Verify rating (moderator only)
     * @param ratingId ID of the rating
     * @param ratingType Type of rating
     */
    function verifyRating(uint256 ratingId, RatingType ratingType) 
        external 
        onlyRole(MODERATOR_ROLE) 
    {
        if (ratingType == RatingType.Faculty) {
            require(facultyRatings[ratingId].id != 0, "Rating not found");
            facultyRatings[ratingId].isVerified = true;
        } else if (ratingType == RatingType.Infrastructure) {
            require(infrastructureRatings[ratingId].id != 0, "Rating not found");
            infrastructureRatings[ratingId].isVerified = true;
        }

        emit RatingVerified(ratingId, ratingType);
    }

    /**
     * @notice Get rating statistics
     * @return faculty Total faculty ratings
     * @return infrastructure Total infrastructure ratings
     * @return service Total service ratings
     */
    function getStatistics() 
        external 
        view 
        returns (uint256 faculty, uint256 infrastructure, uint256 service) 
    {
        return (facultyRatingCounter, infrastructureRatingCounter, serviceRatingCounter);
    }

    /**
     * @notice Grant moderator role
     * @param moderator Address to grant role to
     */
    function grantModeratorRole(address moderator) external onlyRole(ADMIN_ROLE) {
        grantRole(MODERATOR_ROLE, moderator);
    }
}
