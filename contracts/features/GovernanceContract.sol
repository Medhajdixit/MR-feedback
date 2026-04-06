// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../core/StudentRegistryContract.sol";
import "./ReputationContract.sol";

/**
 * @title GovernanceContract
 * @notice DAO-style governance for campus feedback platform
 * @dev Enables community voting on proposals and platform decisions
 */
contract GovernanceContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    StudentRegistryContract public studentRegistry;
    ReputationContract public reputationContract;

    enum ProposalType {
        PolicyChange,
        FeatureRequest,
        BudgetAllocation,
        ModeratorElection,
        ThresholdUpdate,
        Other
    }

    enum ProposalStatus {
        Pending,
        Active,
        Passed,
        Rejected,
        Executed,
        Cancelled
    }

    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        string title;
        string description;
        address proposer;
        uint256 createdAt;
        uint256 votingEndsAt;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalStatus status;
        uint256 executionDelay;
        bool executed;
    }

    struct Vote {
        address voter;
        bool support; // true = for, false = against
        uint256 weight;
        uint256 timestamp;
        string reason;
    }

    // Governance parameters
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant PROPOSAL_THRESHOLD = 100; // Minimum reputation to propose
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of eligible voters
    
    // Mappings
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256[]) public userProposals;
    
    uint256 public proposalCounter;
    uint256 public totalEligibleVoters;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        ProposalType proposalType,
        string title,
        address indexed proposer,
        uint256 votingEndsAt
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight,
        string reason
    );
    event ProposalExecuted(uint256 indexed proposalId, uint256 timestamp);
    event ProposalCancelled(uint256 indexed proposalId, string reason);
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus newStatus);

    constructor(address _studentRegistry, address _reputationContract) {
        require(_studentRegistry != address(0), "Invalid student registry");
        require(_reputationContract != address(0), "Invalid reputation contract");

        studentRegistry = StudentRegistryContract(_studentRegistry);
        reputationContract = ReputationContract(_reputationContract);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
    }

    /**
     * @notice Create a new proposal
     * @param proposalType Type of proposal
     * @param title Proposal title
     * @param description Detailed description
     * @return proposalId ID of created proposal
     */
    function createProposal(
        ProposalType proposalType,
        string memory title,
        string memory description
    ) external returns (uint256) {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        
        // Check reputation threshold
        uint256 reputation = reputationContract.getReputationScore(msg.sender).totalScore;
        require(reputation >= PROPOSAL_THRESHOLD, "Insufficient reputation");
        
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");

        proposalCounter++;
        uint256 proposalId = proposalCounter;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposalType: proposalType,
            title: title,
            description: description,
            proposer: msg.sender,
            createdAt: block.timestamp,
            votingEndsAt: block.timestamp + VOTING_PERIOD,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            status: ProposalStatus.Active,
            executionDelay: EXECUTION_DELAY,
            executed: false
        });

        userProposals[msg.sender].push(proposalId);

        emit ProposalCreated(
            proposalId,
            proposalType,
            title,
            msg.sender,
            block.timestamp + VOTING_PERIOD
        );

        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param support True to vote for, false to vote against
     * @param reason Optional reason for vote
     */
    function castVote(
        uint256 proposalId,
        bool support,
        string memory reason
    ) external {
        require(studentRegistry.isVerifiedStudent(msg.sender), "Not verified student");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp < proposal.votingEndsAt, "Voting period ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        // Calculate vote weight based on reputation
        uint256 weight = _calculateVoteWeight(msg.sender);

        votes[proposalId][msg.sender] = Vote({
            voter: msg.sender,
            support: support,
            weight: weight,
            timestamp: block.timestamp,
            reason: reason
        });

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight, reason);
    }

    /**
     * @notice Calculate vote weight based on reputation
     * @param voter Address of the voter
     * @return Vote weight
     */
    function _calculateVoteWeight(address voter) internal view returns (uint256) {
        uint256 reputation = reputationContract.getReputationScore(voter).totalScore;
        
        // Base weight is 1, bonus based on reputation
        uint256 weight = 1;
        
        if (reputation >= 5000) {
            weight = 5; // Expert
        } else if (reputation >= 2000) {
            weight = 4; // Advanced
        } else if (reputation >= 1000) {
            weight = 3; // Intermediate
        } else if (reputation >= 500) {
            weight = 2; // Contributor
        }
        
        return weight;
    }

    /**
     * @notice Finalize proposal after voting period
     * @param proposalId ID of the proposal
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.votingEndsAt, "Voting still ongoing");

        // Check quorum
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 quorumRequired = (totalEligibleVoters * QUORUM_PERCENTAGE) / 100;
        
        if (totalVotes < quorumRequired) {
            proposal.status = ProposalStatus.Rejected;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Rejected);
            return;
        }

        // Determine outcome
        if (proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.Passed;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Passed);
        } else {
            proposal.status = ProposalStatus.Rejected;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Rejected);
        }
    }

    /**
     * @notice Execute a passed proposal (admin only)
     * @param proposalId ID of the proposal
     */
    function executeProposal(uint256 proposalId) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Passed, "Proposal not passed");
        require(!proposal.executed, "Already executed");
        require(
            block.timestamp >= proposal.votingEndsAt + proposal.executionDelay,
            "Execution delay not met"
        );

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        emit ProposalExecuted(proposalId, block.timestamp);
    }

    /**
     * @notice Cancel a proposal (admin or proposer only)
     * @param proposalId ID of the proposal
     * @param reason Reason for cancellation
     */
    function cancelProposal(uint256 proposalId, string memory reason) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(proposal.status == ProposalStatus.Active, "Proposal not active");

        proposal.status = ProposalStatus.Cancelled;

        emit ProposalCancelled(proposalId, reason);
    }

    /**
     * @notice Get proposal details
     * @param proposalId ID of the proposal
     * @return Proposal struct
     */
    function getProposal(uint256 proposalId) 
        external 
        view 
        returns (Proposal memory) 
    {
        return proposals[proposalId];
    }

    /**
     * @notice Get vote details
     * @param proposalId ID of the proposal
     * @param voter Address of the voter
     * @return Vote struct
     */
    function getVote(uint256 proposalId, address voter) 
        external 
        view 
        returns (Vote memory) 
    {
        return votes[proposalId][voter];
    }

    /**
     * @notice Get user's proposals
     * @param user Address of the user
     * @return Array of proposal IDs
     */
    function getUserProposals(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userProposals[user];
    }

    /**
     * @notice Get proposal voting results
     * @param proposalId ID of the proposal
     * @return forVotes Against votes, abstain votes
     */
    function getVotingResults(uint256 proposalId) 
        external 
        view 
        returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes) 
    {
        Proposal memory proposal = proposals[proposalId];
        return (proposal.forVotes, proposal.againstVotes, proposal.abstainVotes);
    }

    /**
     * @notice Check if proposal has reached quorum
     * @param proposalId ID of the proposal
     * @return True if quorum reached
     */
    function hasReachedQuorum(uint256 proposalId) external view returns (bool) {
        Proposal memory proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 quorumRequired = (totalEligibleVoters * QUORUM_PERCENTAGE) / 100;
        
        return totalVotes >= quorumRequired;
    }

    /**
     * @notice Update total eligible voters (admin only)
     * @param count New count
     */
    function updateEligibleVoters(uint256 count) external onlyRole(ADMIN_ROLE) {
        totalEligibleVoters = count;
    }

    /**
     * @notice Grant proposer role
     * @param proposer Address to grant role to
     */
    function grantProposerRole(address proposer) external onlyRole(ADMIN_ROLE) {
        grantRole(PROPOSER_ROLE, proposer);
    }
}
