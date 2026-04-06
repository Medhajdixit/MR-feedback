// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../core/StudentRegistryContract.sol";

/**
 * @title SocialNetworkContract
 * @notice Manages social features: following, communities, and social interactions
 * @dev Enables community building and peer connections
 */
contract SocialNetworkContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    StudentRegistryContract public studentRegistry;

    struct Community {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256 createdAt;
        uint256 memberCount;
        bool isActive;
    }

    struct UserProfile {
        address userAddress;
        string bio;
        uint256 followerCount;
        uint256 followingCount;
        uint256 communityCount;
        bool isPublic;
    }

    // Mappings
    mapping(address => UserProfile) public userProfiles;
    mapping(address => mapping(address => bool)) public isFollowing;
    mapping(address => address[]) public followers;
    mapping(address => address[]) public following;
    
    mapping(uint256 => Community) public communities;
    mapping(uint256 => address[]) public communityMembers;
    mapping(uint256 => mapping(address => bool)) public isCommunityMember;
    mapping(address => uint256[]) public userCommunities;
    
    uint256 public communityCounter;
    uint256 public totalConnections;

    // Events
    event UserFollowed(address indexed follower, address indexed followed, uint256 timestamp);
    event UserUnfollowed(address indexed follower, address indexed unfollowed, uint256 timestamp);
    event CommunityCreated(uint256 indexed communityId, string name, address indexed creator);
    event CommunityJoined(uint256 indexed communityId, address indexed member);
    event CommunityLeft(uint256 indexed communityId, address indexed member);
    event ProfileUpdated(address indexed user, string bio);

    constructor(address _studentRegistry) {
        require(_studentRegistry != address(0), "Invalid student registry");
        
        studentRegistry = StudentRegistryContract(_studentRegistry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Update user profile
     * @param bio User biography
     * @param isPublic Whether profile is public
     */
    function updateProfile(string memory bio, bool isPublic) external {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");

        userProfiles[msg.sender].userAddress = msg.sender;
        userProfiles[msg.sender].bio = bio;
        userProfiles[msg.sender].isPublic = isPublic;

        emit ProfileUpdated(msg.sender, bio);
    }

    /**
     * @notice Follow another user
     * @param userToFollow Address to follow
     */
    function followUser(address userToFollow) external {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        require(studentRegistry.isVerifiedStudent(userToFollow), "Target not verified");
        require(msg.sender != userToFollow, "Cannot follow yourself");
        require(!isFollowing[msg.sender][userToFollow], "Already following");

        isFollowing[msg.sender][userToFollow] = true;
        followers[userToFollow].push(msg.sender);
        following[msg.sender].push(userToFollow);

        userProfiles[msg.sender].followingCount++;
        userProfiles[userToFollow].followerCount++;
        totalConnections++;

        emit UserFollowed(msg.sender, userToFollow, block.timestamp);
    }

    /**
     * @notice Unfollow a user
     * @param userToUnfollow Address to unfollow
     */
    function unfollowUser(address userToUnfollow) external {
        require(isFollowing[msg.sender][userToUnfollow], "Not following");

        isFollowing[msg.sender][userToUnfollow] = false;
        
        // Remove from arrays (simplified - in production use more efficient method)
        _removeFromArray(followers[userToUnfollow], msg.sender);
        _removeFromArray(following[msg.sender], userToUnfollow);

        userProfiles[msg.sender].followingCount--;
        userProfiles[userToUnfollow].followerCount--;
        totalConnections--;

        emit UserUnfollowed(msg.sender, userToUnfollow, block.timestamp);
    }

    /**
     * @notice Create a new community
     * @param name Community name
     * @param description Community description
     * @return communityId ID of created community
     */
    function createCommunity(string memory name, string memory description) 
        external 
        returns (uint256) 
    {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        require(bytes(name).length > 0, "Name required");

        communityCounter++;
        uint256 communityId = communityCounter;

        communities[communityId] = Community({
            id: communityId,
            name: name,
            description: description,
            creator: msg.sender,
            createdAt: block.timestamp,
            memberCount: 1,
            isActive: true
        });

        // Creator automatically joins
        isCommunityMember[communityId][msg.sender] = true;
        communityMembers[communityId].push(msg.sender);
        userCommunities[msg.sender].push(communityId);
        userProfiles[msg.sender].communityCount++;

        emit CommunityCreated(communityId, name, msg.sender);
        emit CommunityJoined(communityId, msg.sender);

        return communityId;
    }

    /**
     * @notice Join a community
     * @param communityId ID of community to join
     */
    function joinCommunity(uint256 communityId) external {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        require(communities[communityId].isActive, "Community not active");
        require(!isCommunityMember[communityId][msg.sender], "Already a member");

        isCommunityMember[communityId][msg.sender] = true;
        communityMembers[communityId].push(msg.sender);
        userCommunities[msg.sender].push(communityId);
        
        communities[communityId].memberCount++;
        userProfiles[msg.sender].communityCount++;

        emit CommunityJoined(communityId, msg.sender);
    }

    /**
     * @notice Leave a community
     * @param communityId ID of community to leave
     */
    function leaveCommunity(uint256 communityId) external {
        require(isCommunityMember[communityId][msg.sender], "Not a member");
        require(communities[communityId].creator != msg.sender, "Creator cannot leave");

        isCommunityMember[communityId][msg.sender] = false;
        
        _removeFromArray(communityMembers[communityId], msg.sender);
        _removeFromUintArray(userCommunities[msg.sender], communityId);
        
        communities[communityId].memberCount--;
        userProfiles[msg.sender].communityCount--;

        emit CommunityLeft(communityId, msg.sender);
    }

    /**
     * @notice Get user's followers
     * @param user Address of the user
     * @return Array of follower addresses
     */
    function getFollowers(address user) external view returns (address[] memory) {
        return followers[user];
    }

    /**
     * @notice Get users that user is following
     * @param user Address of the user
     * @return Array of addresses being followed
     */
    function getFollowing(address user) external view returns (address[] memory) {
        return following[user];
    }

    /**
     * @notice Get community members
     * @param communityId ID of the community
     * @return Array of member addresses
     */
    function getCommunityMembers(uint256 communityId) 
        external 
        view 
        returns (address[] memory) 
    {
        return communityMembers[communityId];
    }

    /**
     * @notice Get user's communities
     * @param user Address of the user
     * @return Array of community IDs
     */
    function getUserCommunities(address user) external view returns (uint256[] memory) {
        return userCommunities[user];
    }

    /**
     * @notice Get user profile
     * @param user Address of the user
     * @return User profile struct
     */
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    /**
     * @notice Helper function to remove address from array
     */
    function _removeFromArray(address[] storage array, address element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    /**
     * @notice Helper function to remove uint from array
     */
    function _removeFromUintArray(uint256[] storage array, uint256 element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    /**
     * @notice Grant moderator role
     * @param moderator Address to grant role to
     */
    function grantModeratorRole(address moderator) external onlyRole(ADMIN_ROLE) {
        grantRole(MODERATOR_ROLE, moderator);
    }
}
