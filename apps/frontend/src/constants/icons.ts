// =============================================
// Icon Constants - Lucide icon mappings for UI components
// =============================================

import { Laptop, type LucideIcon, Monitor, Plug, Smartphone, Tablet } from 'lucide-react';

// Device icons with fallback guaranteed
export const DEVICE_ICONS = {
    mobile: Smartphone,
    tablet: Tablet,
    laptop: Laptop,
    desktop: Monitor,
    unknown: Plug,
} as const;

// Helper to get device icon with guaranteed fallback
export const getDeviceIcon = (device: string): LucideIcon => {
    return DEVICE_ICONS[device as keyof typeof DEVICE_ICONS] ?? DEVICE_ICONS.unknown;
};
