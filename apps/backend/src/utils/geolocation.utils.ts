// =============================================
// IP Utilities - Fast IP detection without external APIs
// =============================================

// isLocalIP: Checks if IP is a local/private address
export const isLocalIP = (ip: string): boolean => {
    return (
        ip === '::1' ||
        ip === '127.0.0.1' ||
        ip === 'localhost' ||
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip.startsWith('172.16.') ||
        ip.startsWith('172.17.') ||
        ip.startsWith('172.18.') ||
        ip.startsWith('172.19.') ||
        ip.startsWith('172.2') ||
        ip.startsWith('172.30.') ||
        ip.startsWith('172.31.')
    );
};

// getClientIP: Extracts real client IP, prioritizing proxy headers
// Production: nginx/load-balancer should set X-Real-IP or X-Forwarded-For
export const getClientIP = (ip: string): string => {
    // Clean up IPv6 localhost
    if (ip === '::1') return '127.0.0.1';
    // Remove IPv6 prefix if present
    if (ip.startsWith('::ffff:')) return ip.slice(7);
    return ip;
};

// getLocationLabel: Returns simple location label without external API
// In production, consider using a local IP-to-location database (MaxMind GeoLite2)
export const getLocationLabel = (ip: string): string | null => {
    if (isLocalIP(ip)) return 'Local Network';
    // Without external API, we can't determine location
    // Return null - location field will be empty but login will be fast
    return null;
};
