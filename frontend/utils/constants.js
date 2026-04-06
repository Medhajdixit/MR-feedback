/**
 * Constants
 * Application-wide constants
 */

export const CATEGORIES = [
    'General',
    'Infrastructure',
    'Faculty',
    'Administration',
    'Food',
    'Technology',
    'Safety',
    'Other',
];

export const PROPOSAL_TYPES = [
    'Policy Change',
    'Feature Request',
    'Budget Allocation',
    'Moderator Election',
    'Threshold Update',
    'Other',
];

export const BADGE_TYPES = {
    FIRST_FEEDBACK: 0,
    FEEDBACK_MASTER: 1,
    QUALITY_CONTRIBUTOR: 2,
    CONSISTENT_USER: 3,
    COMMUNITY_HELPER: 4,
    TREND_SETTER: 5,
    IMPACT_MAKER: 6,
    PRIVACY_CHAMPION: 7,
};

export const ACTIVITY_TYPES = {
    BASIC_FEEDBACK: 0,
    FACULTY_RATING: 1,
    INFRASTRUCTURE_REPORT: 2,
    INFRASTRUCTURE_WITH_IMAGE: 3,
    AI_ENHANCEMENT_ACCEPTED: 4,
    PEER_VERIFICATION: 5,
    WEEKLY_CONSISTENCY: 6,
    AI_TRAINING_CONTRIBUTION: 7,
};

export const POINTS_PER_INR = 1000;
export const POINTS_PER_SHM = 1000;

export const SHARDEUM_CHAIN_ID = 8080;
export const SHARDEUM_CHAIN_ID_HEX = '0x1f90';

export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs';
