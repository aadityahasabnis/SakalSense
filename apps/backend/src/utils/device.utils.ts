// =============================================
// Device Detection Utilities
// =============================================

import { DEVICE } from '@/constants/auth.constants';
import { type DeviceType } from '@/lib/interfaces/auth.types';

export const detectDevice = (userAgent: string): DeviceType => {
    const ua = userAgent.toLowerCase();

    if (ua.includes('mobile')) return DEVICE.MOBILE;
    if (ua.includes('tablet')) return DEVICE.TABLET;
    if (ua.includes('laptop') || ua.includes('macbook')) return DEVICE.LAPTOP;

    return DEVICE.DESKTOP;
};

export const getClientIP = (req: { ip?: string; socket?: { remoteAddress?: string } }): string => {
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
};
