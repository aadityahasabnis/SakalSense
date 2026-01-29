import {
    BookOpen,
    Code,
    FileText,
    Newspaper,
    StickyNote,
    Table,
    type LucideIcon,
} from 'lucide-react';

import { type ContentType, CONTENT_TYPE } from '@/constants/content.constants';

/**
 * Get Lucide icon component for content type
 */
export const getContentTypeIcon = (type: ContentType): LucideIcon => {
    const iconMap: Record<ContentType, LucideIcon> = {
        [CONTENT_TYPE.ARTICLE]: FileText,
        [CONTENT_TYPE.BLOG]: Newspaper,
        [CONTENT_TYPE.TUTORIAL]: BookOpen,
        [CONTENT_TYPE.CHEATSHEET]: Table,
        [CONTENT_TYPE.NOTE]: StickyNote,
        [CONTENT_TYPE.PROJECT]: Code,
    };

    return iconMap[type] || FileText;
};

/**
 * Calculate reading time in minutes
 */
export const calculateReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return Math.max(1, minutes);
};

/**
 * Format number with locale string (1000 → 1,000)
 */
export const formatNumber = (num: number): string => {
    return num.toLocaleString();
};

/**
 * Format compact number (1000 → 1K, 1000000 → 1M)
 */
export const formatCompactNumber = (num: number): string => {
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toString();
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date | string): string => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    const intervals: Array<[string, number]> = [
        ['year', 31536000],
        ['month', 2592000],
        ['week', 604800],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
        ['second', 1],
    ];

    for (const [name, secondsInInterval] of intervals) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return `${interval} ${name}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'Just now';
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Get initials from full name
 */
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
