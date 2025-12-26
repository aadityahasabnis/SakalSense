// =============================================
// IP Geolocation Utilities
// =============================================

interface GeoResponse {
    status: 'success' | 'fail';
    country?: string;
    city?: string;
    regionName?: string;
    query?: string;
}

const isLocalIP = (ip: string): boolean => {
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

export const getPublicIP = async (): Promise<string | null> => {
    try {
        const response = await fetch('http://ip-api.com/json/?fields=query', {
            signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) return null;
        const data = (await response.json()) as { query?: string };
        return data.query ?? null;
    } catch {
        return null;
    }
};

export const resolveClientIP = async (detectedIP: string): Promise<string> => {
    if (isLocalIP(detectedIP)) {
        const publicIP = await getPublicIP();
        return publicIP ?? detectedIP;
    }
    return detectedIP;
};

export const getLocationFromIP = async (ip: string): Promise<string | null> => {
    const resolvedIP = isLocalIP(ip) ? await getPublicIP() : ip;
    if (!resolvedIP) return null;

    try {
        const response = await fetch(`http://ip-api.com/json/${resolvedIP}?fields=status,country,city,regionName`, {
            signal: AbortSignal.timeout(3000),
        });

        if (!response.ok) return null;

        const data = (await response.json()) as GeoResponse;

        if (data.status === 'success' && data.city && data.country) {
            return `${data.city}, ${data.country}`;
        }

        return null;
    } catch {
        return null;
    }
};
