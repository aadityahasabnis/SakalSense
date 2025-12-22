// Date formatting utilities - Framework-agnostic date/time formatters
// Used across frontend and backend for consistent date display

// DateFormatOptions: Optional configuration for date formatting
export interface DateFormatOptions {
    locale?: string; // e.g., 'en-US', 'en-IN' (default: 'en-US')
    timeOnly?: boolean; // Show only time, no date (default: false)
    includeTime?: boolean; // Include time in output (default: false)
    includeSeconds?: boolean; // Include seconds when time is shown (default: false)
    use24Hour?: boolean; // Use 24-hour format (default: false)
    shortMonth?: boolean; // Use 'Jan' instead of 'January' (default: true)
    shortDay?: boolean; // Use 'Mon' instead of 'Monday' (default: true)
    includeYear?: boolean; // Include year in output (default: true)
    includeWeekday?: boolean; // Include day of week (default: false)
}

// formatDate: Flexible date/time formatter with optional configuration
// Set timeOnly: true to show only time (like formatTime did before)
export const formatDate = (date: Date | string | number, options: DateFormatOptions = {}): string => {
    const d = new Date(date);
    const {
        locale = 'en-IN',
        timeOnly = false,
        includeTime = false,
        includeSeconds = false,
        use24Hour = false,
        shortMonth = true,
        includeYear = true,
        includeWeekday = false,
    } = options;

    // Time-only mode
    if (timeOnly) {
        return new Intl.DateTimeFormat(locale, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: !use24Hour,
            ...(includeSeconds && { second: '2-digit' }),
        }).format(d);
    }

    // Date with optional time
    const dateOptions: Intl.DateTimeFormatOptions = {
        month: shortMonth ? 'short' : 'long',
        day: 'numeric',
        ...(includeYear && { year: 'numeric' }),
        ...(includeWeekday && { weekday: options.shortDay !== false ? 'short' : 'long' }),
    };

    if (includeTime) {
        dateOptions.hour = 'numeric';
        dateOptions.minute = '2-digit';
        dateOptions.hour12 = !use24Hour;
        if (includeSeconds) dateOptions.second = '2-digit';
    }

    return new Intl.DateTimeFormat(locale, dateOptions).format(d);
};

// DurationOptions: Configuration for duration formatting
export interface DurationOptions {
    short?: boolean; // Use 's', 'm', 'h', 'd' instead of full words (default: false)
    includeSeconds?: boolean; // Include seconds in output (default: true for < 1 min)
}

// formatDuration: Formats seconds into human-readable duration
// Example: 3661 → "1 hour, 1 minute" or "1h 1m"
export const formatDuration = (seconds: number, options: DurationOptions = {}): string => {
    const { short = false, includeSeconds = true } = options;

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: Array<string> = [];

    if (short) {
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (includeSeconds && secs > 0 && days === 0) parts.push(`${secs}s`);
    } else {
        if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        if (includeSeconds && secs > 0 && days === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(short ? ' ' : ', ') : (short ? '0s' : '0 seconds');
};

// formatISODate: Returns ISO date string (YYYY-MM-DD)
export const formatISODate = (date: Date | string | number): string => new Date(date).toISOString().split('T')[0] ?? '';

// formatISODateTime: Returns full ISO string
export const formatISODateTime = (date: Date | string | number): string => new Date(date).toISOString();

/*
 * ============================================
 * USAGE EXAMPLES & EXPECTED OUTPUTS
 * ============================================
 *
 * formatDate(new Date('2025-12-22'))
 * → "Dec 22, 2025"
 *
 * formatDate(new Date('2025-12-22'), { shortMonth: false })
 * → "December 22, 2025"
 *
 * formatDate(new Date('2025-12-22'), { includeWeekday: true })
 * → "Sun, Dec 22, 2025"
 *
 * formatDate(new Date('2025-12-22T14:30:00'), { includeTime: true })
 * → "Dec 22, 2025, 2:30 PM"
 *
 * formatDate(new Date('2025-12-22T14:30:00'), { timeOnly: true })
 * → "2:30 PM"
 *
 * formatDate(new Date('2025-12-22T14:30:00'), { timeOnly: true, use24Hour: true })
 * → "14:30"
 *
 * formatDuration(3661)
 * → "1 hour, 1 minute, 1 second"
 *
 * formatDuration(3661, { short: true })
 * → "1h 1m 1s"
 *
 * formatDuration(90061)
 * → "1 day, 1 hour, 1 minute"
 *
 * formatDuration(45)
 * → "45 seconds"
 *
 * formatISODate(new Date('2025-12-22T14:30:00'))
 * → "2025-12-22"
 *
 * formatISODateTime(new Date('2025-12-22T14:30:00'))
 * → "2025-12-22T14:30:00.000Z"
 */
