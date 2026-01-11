// =============================================
// Device Detection Utilities
// =============================================

import { DEVICE } from '@/constants/auth.constants';
import { type DeviceType } from '@/types/auth.types';

// detectDevice: Detect device type from User-Agent string
export const detectDevice = (userAgent: string): DeviceType => {
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return DEVICE.MOBILE;
    if (/tablet|ipad/i.test(ua)) return DEVICE.TABLET;
    if (/macintosh|windows|linux/i.test(ua)) return DEVICE.DESKTOP;
    return DEVICE.UNKNOWN;
};

// getClientIP: Extract client IP from request headers
export const getClientIP = (headers: Headers): string => headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? 'unknown';
