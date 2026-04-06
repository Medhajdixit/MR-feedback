// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PrivacyContract
 * @notice Manages privacy-preserving features including anonymization and data protection
 * @dev Implements zero-knowledge verification and GDPR compliance mechanisms
 */
contract PrivacyContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    // Privacy settings
    struct PrivacySettings {
        bool isAnonymous;
        bool allowDataCollection;
        uint256 dataRetentionPeriod; // in days
        uint256 lastUpdated;
    }

    // Data deletion request
    struct DeletionRequest {
        address requester;
        uint256 requestTime;
        bool processed;
        bool approved;
        string reason;
    }

    // Mappings
    mapping(address => PrivacySettings) public userPrivacySettings;
    mapping(address => DeletionRequest) public deletionRequests;
    mapping(bytes32 => bool) public verifiedProofs; // For zero-knowledge proofs
    mapping(uint256 => bool) public anonymizedContent; // Content ID => is anonymized

    // Events
    event PrivacySettingsUpdated(address indexed user, bool isAnonymous, uint256 timestamp);
    event DeletionRequested(address indexed user, uint256 timestamp);
    event DeletionProcessed(address indexed user, bool approved, uint256 timestamp);
    event ProofVerified(bytes32 indexed proofHash, bool valid, uint256 timestamp);
    event ContentAnonymized(uint256 indexed contentId, uint256 timestamp);
    event DataAccessLogged(address indexed accessor, address indexed subject, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Update user privacy settings
     * @param isAnonymous Whether user wants anonymous interactions
     * @param allowDataCollection Whether to allow data collection for analytics
     * @param retentionDays Data retention period in days
     */
    function updatePrivacySettings(
        bool isAnonymous,
        bool allowDataCollection,
        uint256 retentionDays
    ) external {
        require(retentionDays >= 30 && retentionDays <= 3650, "Invalid retention period");

        userPrivacySettings[msg.sender] = PrivacySettings({
            isAnonymous: isAnonymous,
            allowDataCollection: allowDataCollection,
            dataRetentionPeriod: retentionDays,
            lastUpdated: block.timestamp
        });

        emit PrivacySettingsUpdated(msg.sender, isAnonymous, block.timestamp);
    }

    /**
     * @notice Get user privacy settings
     * @param user Address of the user
     * @return Privacy settings struct
     */
    function getPrivacySettings(address user) external view returns (PrivacySettings memory) {
        return userPrivacySettings[user];
    }

    /**
     * @notice Check if user prefers anonymous interactions
     * @param user Address of the user
     * @return True if user wants anonymity
     */
    function isAnonymousUser(address user) external view returns (bool) {
        return userPrivacySettings[user].isAnonymous;
    }

    /**
     * @notice Request data deletion (GDPR right to be forgotten)
     * @param reason Reason for deletion request
     */
    function requestDataDeletion(string memory reason) external {
        require(deletionRequests[msg.sender].requestTime == 0 || 
                deletionRequests[msg.sender].processed, 
                "Pending deletion request exists");

        deletionRequests[msg.sender] = DeletionRequest({
            requester: msg.sender,
            requestTime: block.timestamp,
            processed: false,
            approved: false,
            reason: reason
        });

        emit DeletionRequested(msg.sender, block.timestamp);
    }

    /**
     * @notice Process data deletion request (admin only)
     * @param user Address of the user
     * @param approved Whether to approve the deletion
     */
    function processDeletionRequest(address user, bool approved) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(deletionRequests[user].requestTime > 0, "No deletion request found");
        require(!deletionRequests[user].processed, "Request already processed");

        deletionRequests[user].processed = true;
        deletionRequests[user].approved = approved;

        emit DeletionProcessed(user, approved, block.timestamp);
    }

    /**
     * @notice Verify zero-knowledge proof
     * @param proof The proof bytes
     * @param publicInput Public input for verification
     * @return True if proof is valid
     */
    function verifyZKProof(bytes memory proof, bytes32 publicInput) 
        external 
        returns (bool) 
    {
        // Simplified ZK proof verification
        // In production, integrate with actual ZK proof library (e.g., Groth16, PLONK)
        bytes32 proofHash = keccak256(abi.encodePacked(proof, publicInput));
        
        // For demo: proof is valid if it hasn't been used before
        bool isValid = !verifiedProofs[proofHash];
        
        if (isValid) {
            verifiedProofs[proofHash] = true;
            emit ProofVerified(proofHash, true, block.timestamp);
        }

        return isValid;
    }

    /**
     * @notice Mark content as anonymized
     * @param contentId ID of the content
     */
    function anonymizeContent(uint256 contentId) 
        external 
        onlyRole(MODERATOR_ROLE) 
    {
        require(!anonymizedContent[contentId], "Content already anonymized");
        
        anonymizedContent[contentId] = true;
        emit ContentAnonymized(contentId, block.timestamp);
    }

    /**
     * @notice Check if content is anonymized
     * @param contentId ID of the content
     * @return True if content is anonymized
     */
    function isContentAnonymized(uint256 contentId) external view returns (bool) {
        return anonymizedContent[contentId];
    }

    /**
     * @notice Log data access for audit trail
     * @param subject Address whose data is being accessed
     */
    function logDataAccess(address subject) external {
        emit DataAccessLogged(msg.sender, subject, block.timestamp);
    }

    /**
     * @notice Check if data retention period has expired
     * @param user Address of the user
     * @return True if data should be deleted
     */
    function shouldDeleteData(address user) external view returns (bool) {
        PrivacySettings memory settings = userPrivacySettings[user];
        if (settings.lastUpdated == 0) return false;
        
        uint256 retentionSeconds = settings.dataRetentionPeriod * 1 days;
        return block.timestamp > settings.lastUpdated + retentionSeconds;
    }

    /**
     * @notice Grant moderator role
     * @param moderator Address to grant role to
     */
    function grantModeratorRole(address moderator) external onlyRole(ADMIN_ROLE) {
        grantRole(MODERATOR_ROLE, moderator);
    }

    /**
     * @notice Revoke moderator role
     * @param moderator Address to revoke role from
     */
    function revokeModeratorRole(address moderator) external onlyRole(ADMIN_ROLE) {
        revokeRole(MODERATOR_ROLE, moderator);
    }
}
