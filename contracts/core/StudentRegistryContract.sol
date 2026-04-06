// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../privacy/PrivacyContract.sol";

/**
 * @title StudentRegistryContract
 * @notice Manages student registration and verification with privacy protection
 * @dev Integrates with PrivacyContract for anonymization features
 */
contract StudentRegistryContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    uint256 public constant VERIFICATION_FEE = 60 ether; // 60 SHM in wei
    
    PrivacyContract public privacyContract;

    enum StudentStatus {
        NotRegistered,
        Pending,
        Verified,
        Rejected,
        Suspended
    }

    enum UserRole {
        Student,
        Faculty,
        Admin
    }

    struct StudentProfile {
        address studentAddress;
        bytes32 hashedIdentity; // Hash of student ID/documents
        StudentStatus status;
        UserRole role;
        uint256 registrationTime;
        uint256 verificationTime;
        string rejectionReason;
        bool isActive;
    }

    // Mappings
    mapping(address => StudentProfile) public students;
    mapping(bytes32 => address) public identityToAddress;
    mapping(address => uint256) public studentPoints;
    
    uint256 public totalStudents;
    uint256 public verifiedStudents;
    uint256 public pendingVerifications;

    // Events
    event StudentRegistered(
        address indexed student,
        bytes32 hashedIdentity,
        uint256 fee,
        uint256 timestamp
    );
    event StudentVerified(address indexed student, uint256 timestamp);
    event StudentRejected(address indexed student, string reason, uint256 timestamp);
    event StudentSuspended(address indexed student, string reason, uint256 timestamp);
    event StudentReactivated(address indexed student, uint256 timestamp);
    event VerificationFeeCollected(address indexed student, uint256 amount);
    event FeeWithdrawn(address indexed admin, uint256 amount);
    event RoleAssigned(address indexed user, UserRole role);

    constructor(address _privacyContract) {
        require(_privacyContract != address(0), "Invalid privacy contract");
        
        privacyContract = PrivacyContract(_privacyContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @notice Register as a student with verification fee
     * @param hashedIdentity Hashed student identity (privacy-preserving)
     */
    function registerStudent(bytes32 hashedIdentity) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value == VERIFICATION_FEE, "Incorrect verification fee");
        require(students[msg.sender].status == StudentStatus.NotRegistered, 
                "Already registered");
        require(identityToAddress[hashedIdentity] == address(0), 
                "Identity already registered");
        require(hashedIdentity != bytes32(0), "Invalid identity hash");

        students[msg.sender] = StudentProfile({
            studentAddress: msg.sender,
            hashedIdentity: hashedIdentity,
            status: StudentStatus.Pending,
            role: UserRole.Student,
            registrationTime: block.timestamp,
            verificationTime: 0,
            rejectionReason: "",
            isActive: true
        });

        identityToAddress[hashedIdentity] = msg.sender;
        totalStudents++;
        pendingVerifications++;

        emit StudentRegistered(msg.sender, hashedIdentity, msg.value, block.timestamp);
        emit VerificationFeeCollected(msg.sender, msg.value);
    }

    /**
     * @notice Verify a student (admin/verifier only)
     * @param studentAddress Address of the student to verify
     */
    function verifyStudent(address studentAddress) 
        external 
        onlyRole(VERIFIER_ROLE) 
    {
        require(students[studentAddress].status == StudentStatus.Pending, 
                "Student not pending verification");

        students[studentAddress].status = StudentStatus.Verified;
        students[studentAddress].verificationTime = block.timestamp;
        
        verifiedStudents++;
        pendingVerifications--;

        emit StudentVerified(studentAddress, block.timestamp);
    }

    /**
     * @notice Reject a student registration
     * @param studentAddress Address of the student
     * @param reason Reason for rejection
     */
    function rejectStudent(address studentAddress, string memory reason) 
        external 
        onlyRole(VERIFIER_ROLE) 
    {
        require(students[studentAddress].status == StudentStatus.Pending, 
                "Student not pending verification");
        require(bytes(reason).length > 0, "Reason required");

        students[studentAddress].status = StudentStatus.Rejected;
        students[studentAddress].rejectionReason = reason;
        
        pendingVerifications--;

        emit StudentRejected(studentAddress, reason, block.timestamp);
    }

    /**
     * @notice Suspend a student
     * @param studentAddress Address of the student
     * @param reason Reason for suspension
     */
    function suspendStudent(address studentAddress, string memory reason) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(students[studentAddress].status == StudentStatus.Verified, 
                "Student not verified");
        require(bytes(reason).length > 0, "Reason required");

        students[studentAddress].status = StudentStatus.Suspended;
        students[studentAddress].isActive = false;
        
        verifiedStudents--;

        emit StudentSuspended(studentAddress, reason, block.timestamp);
    }

    /**
     * @notice Reactivate a suspended student
     * @param studentAddress Address of the student
     */
    function reactivateStudent(address studentAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(students[studentAddress].status == StudentStatus.Suspended, 
                "Student not suspended");

        students[studentAddress].status = StudentStatus.Verified;
        students[studentAddress].isActive = true;
        
        verifiedStudents++;

        emit StudentReactivated(studentAddress, block.timestamp);
    }

    /**
     * @notice Check if address is a verified student
     * @param studentAddress Address to check
     * @return True if verified student
     */
    function isVerifiedStudent(address studentAddress) external view returns (bool) {
        return students[studentAddress].status == StudentStatus.Verified &&
               students[studentAddress].isActive;
    }

    /**
     * @notice Get student status
     * @param studentAddress Address of the student
     * @return Current status
     */
    function getStudentStatus(address studentAddress) 
        external 
        view 
        returns (StudentStatus) 
    {
        return students[studentAddress].status;
    }

    /**
     * @notice Get student profile
     * @param studentAddress Address of the student
     * @return Student profile struct
     */
    function getStudentProfile(address studentAddress) 
        external 
        view 
        returns (StudentProfile memory) 
    {
        return students[studentAddress];
    }

    /**
     * @notice Assign role to user (faculty, admin)
     * @param userAddress Address of the user
     * @param role Role to assign
     */
    function assignRole(address userAddress, UserRole role) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(userAddress != address(0), "Invalid address");
        
        if (students[userAddress].studentAddress == address(0)) {
            // Create new profile for non-student users
            students[userAddress] = StudentProfile({
                studentAddress: userAddress,
                hashedIdentity: bytes32(0),
                status: StudentStatus.Verified,
                role: role,
                registrationTime: block.timestamp,
                verificationTime: block.timestamp,
                rejectionReason: "",
                isActive: true
            });
        } else {
            students[userAddress].role = role;
        }

        emit RoleAssigned(userAddress, role);
    }

    /**
     * @notice Get user role
     * @param userAddress Address of the user
     * @return User role
     */
    function getUserRole(address userAddress) external view returns (UserRole) {
        return students[userAddress].role;
    }

    /**
     * @notice Check if user is faculty
     * @param userAddress Address to check
     * @return True if faculty
     */
    function isFaculty(address userAddress) external view returns (bool) {
        return students[userAddress].role == UserRole.Faculty &&
               students[userAddress].isActive;
    }

    /**
     * @notice Check if user is admin
     * @param userAddress Address to check
     * @return True if admin
     */
    function isAdmin(address userAddress) external view returns (bool) {
        return students[userAddress].role == UserRole.Admin &&
               students[userAddress].isActive;
    }

    /**
     * @notice Withdraw collected fees (admin only)
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit FeeWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Get contract balance
     * @return Balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get registration statistics
     * @return total Total registered students
     * @return verified Total verified students
     * @return pending Total pending verifications
     */
    function getStatistics() 
        external 
        view 
        returns (uint256 total, uint256 verified, uint256 pending) 
    {
        return (totalStudents, verifiedStudents, pendingVerifications);
    }

    /**
     * @notice Grant verifier role
     * @param verifier Address to grant role to
     */
    function grantVerifierRole(address verifier) external onlyRole(ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, verifier);
    }

    /**
     * @notice Revoke verifier role
     * @param verifier Address to revoke role from
     */
    function revokeVerifierRole(address verifier) external onlyRole(ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, verifier);
    }
}
