// =============================================
// Date Utilities - Framework-agnostic date/time formatters
// =============================================

// DateFormatOptions: Optional configuration for date formatting
export interface IDateFormatOptions {
    locale?: string;
    timeOnly?: boolean;
    includeTime?: boolean;
    includeSeconds?: boolean;
    use24Hour?: boolean;
    shortMonth?: boolean;
    includeYear?: boolean;
    includeWeekday?: boolean;
    shortDay?: boolean;
}

// formatDate: Flexible date/time formatter
export const formatDate = (date: Date | string | number, options: IDateFormatOptions = {}): string => {
    const d = new Date(date);
    const { locale = 'en-IN', timeOnly = false, includeTime = false, includeSeconds = false, use24Hour = false, shortMonth = true, includeYear = true, includeWeekday = false, shortDay = true } = options;

    if (timeOnly) {
        return new Intl.DateTimeFormat(locale, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: !use24Hour,
            ...(includeSeconds && { second: '2-digit' }),
        }).format(d);
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
        month: shortMonth ? 'short' : 'long',
        day: 'numeric',
        ...(includeYear && { year: 'numeric' }),
        ...(includeWeekday && { weekday: shortDay ? 'short' : 'long' }),
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
export interface IDurationOptions {
    short?: boolean;
    includeSeconds?: boolean;
}

// formatDuration: Formats seconds into human-readable duration
export const formatDuration = (seconds: number, options: IDurationOptions = {}): string => {
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

    return parts.length > 0 ? parts.join(short ? ' ' : ', ') : short ? '0s' : '0 seconds';
};

// formatISODate: Returns ISO date string (YYYY-MM-DD)
export const formatISODate = (date: Date | string | number): string => new Date(date).toISOString().split('T')[0] ?? '';

// formatISODateTime: Returns full ISO string
export const formatISODateTime = (date: Date | string | number): string => new Date(date).toISOString();
