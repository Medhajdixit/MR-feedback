/**
 * Utility Functions
 * Helper functions for formatting and validation
 */

/**
 * Format wallet address
 */
export function formatAddress(address, chars = 4) {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Format date
 */
export function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format time ago
 */
export function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Copy failed:', error);
        return false;
    }
}

/**
 * Truncate text
 */
export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Get category color
 */
export function getCategoryColor(category) {
    const colors = {
        General: 'bg-gray-100 text-gray-800',
        Infrastructure: 'bg-blue-100 text-blue-800',
        Faculty: 'bg-purple-100 text-purple-800',
        Administration: 'bg-green-100 text-green-800',
        Food: 'bg-orange-100 text-orange-800',
        Technology: 'bg-indigo-100 text-indigo-800',
        Safety: 'bg-red-100 text-red-800',
        Other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.Other;
}
