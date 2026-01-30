// =============================================
// Formatters - Common formatting utilities
// =============================================
// Centralized formatting functions for dates, numbers, and strings

/**
 * Format a date/time as relative time ago (e.g., "5m ago", "2h ago", "3d ago")
 * @param date - Date to format (Date object or string)
 * @returns Formatted relative time string
 *
 * @example
 * formatTimeAgo(new Date(Date.now() - 60000)) // "1m ago"
 * formatTimeAgo('2024-01-15T10:30:00Z') // "2d ago" (depending on current date)
 */
export const formatTimeAgo = (date: Date | string): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diff = now.getTime() - targetDate.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 30) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    if (years === 1) return '1y ago';
    if (years > 1) return `${years}y ago`;

    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format duration in minutes to human-readable time (e.g., "5m", "2h 30m", "1d 5h")
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 *
 * @example
 * formatTimeSpent(45) // "45m"
 * formatTimeSpent(150) // "2h 30m"
 * formatTimeSpent(1500) // "1d 1h"
 */
export const formatTimeSpent = (minutes: number): string => {
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;

    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);

    if (hours < 24) {
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (remainingHours > 0) {
        return `${days}d ${remainingHours}h`;
    }

    return `${days}d`;
};

/**
 * Format seconds to human-readable duration (e.g., "1:30", "2:45:30")
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (MM:SS or HH:MM:SS)
 *
 * @example
 * formatDuration(90) // "1:30"
 * formatDuration(3661) // "1:01:01"
 */
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get initials from a name (up to 2 characters)
 * @param name - Full name
 * @returns Uppercase initials (max 2 chars)
 *
 * @example
 * getInitials('John Doe') // "JD"
 * getInitials('Alice') // "AL"
 * getInitials('Mary Jane Watson') // "MW"
 */
export const getInitials = (name: string): string => {
    if (!name || typeof name !== 'string') return '?';

    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return '?';

    const firstPart = parts[0];
    if (!firstPart) return '?';

    if (parts.length === 1) {
        return firstPart.slice(0, 2).toUpperCase();
    }

    const lastPart = parts[parts.length - 1];
    const firstChar = firstPart[0] ?? '';
    const lastChar = lastPart?.[0] ?? '';

    return (firstChar + lastChar).toUpperCase();
};

/**
 * Format a number with compact notation (e.g., 1.2K, 3.5M)
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 *
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 * formatCompactNumber(500) // "500"
 */
export const formatCompactNumber = (num: number, decimals: number = 1): string => {
    if (num < 1000) return num.toString();

    const units = ['', 'K', 'M', 'B', 'T'];
    const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
    const unitValue = num / Math.pow(1000, unitIndex);

    const formatted = unitValue.toFixed(decimals);
    // Remove trailing zeros after decimal point
    const cleaned = formatted.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');

    return cleaned + units[unitIndex];
};

/**
 * Format a number with commas as thousand separators
 * @param num - Number to format
 * @returns Formatted number string with commas
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format a percentage value
 * @param value - The current value
 * @param total - The total value
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(75, 100) // "75%"
 * formatPercentage(1, 3, 1) // "33.3%"
 */
export const formatPercentage = (value: number, total: number, decimals: number = 0): string => {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format a date to a readable format
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // "Jan 15, 2024"
 * formatDate(new Date(), { includeTime: true }) // "Jan 15, 2024 at 10:30 AM"
 */
export const formatDate = (
    date: Date | string,
    options?: {
        includeTime?: boolean;
        includeYear?: boolean;
        relative?: boolean;
    }
): string => {
    const targetDate = new Date(date);
    const now = new Date();

    // If relative and within the last week, use relative format
    if (options?.relative) {
        const diff = now.getTime() - targetDate.getTime();
        const days = Math.floor(diff / 86400000);
        if (days < 7) {
            return formatTimeAgo(date);
        }
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
    };

    // Include year if it's different from current year or explicitly requested
    if (options?.includeYear !== false && targetDate.getFullYear() !== now.getFullYear()) {
        formatOptions.year = 'numeric';
    }

    if (options?.includeTime) {
        formatOptions.hour = 'numeric';
        formatOptions.minute = '2-digit';
    }

    return targetDate.toLocaleDateString('en-US', formatOptions);
};

/**
 * Pluralize a word based on count
 * @param count - The count
 * @param singular - Singular form
 * @param plural - Plural form (optional, defaults to singular + 's')
 * @returns Pluralized string with count
 *
 * @example
 * pluralize(1, 'item') // "1 item"
 * pluralize(5, 'item') // "5 items"
 * pluralize(2, 'person', 'people') // "2 people"
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
    const word = count === 1 ? singular : (plural ?? `${singular}s`);
    return `${formatNumber(count)} ${word}`;
};

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 100)
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * truncateText('Hello World', 5) // "Hello..."
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
};

/**
 * Format XP value with suffix
 * @param xp - XP amount
 * @returns Formatted XP string
 *
 * @example
 * formatXP(1500) // "1,500 XP"
 * formatXP(15000) // "15K XP"
 */
export const formatXP = (xp: number): string => {
    if (xp >= 10000) {
        return `${formatCompactNumber(xp)} XP`;
    }
    return `${formatNumber(xp)} XP`;
};

/**
 * Calculate and format level from XP
 * @param xp - Total XP
 * @returns Level information object
 *
 * @example
 * calculateLevel(1500) // { level: 5, currentXP: 100, requiredXP: 300, progress: 33 }
 */
export const calculateLevel = (xp: number): {
    level: number;
    currentXP: number;
    requiredXP: number;
    progress: number;
} => {
    // XP formula: each level requires (level * 100) XP
    // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
    let level = 1;
    let totalRequired = 0;

    while (totalRequired + level * 100 <= xp) {
        totalRequired += level * 100;
        level++;
    }

    const currentXP = xp - totalRequired;
    const requiredXP = level * 100;
    const progress = Math.round((currentXP / requiredXP) * 100);

    return { level, currentXP, requiredXP, progress };
};

/**
 * Format a streak count with appropriate suffix
 * @param days - Number of streak days
 * @returns Formatted streak string
 *
 * @example
 * formatStreak(7) // "7 day streak"
 * formatStreak(1) // "1 day streak"
 */
export const formatStreak = (days: number): string => {
    return `${days} day${days !== 1 ? 's' : ''} streak`;
};
