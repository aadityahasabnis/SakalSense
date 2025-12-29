// =============================================
// Auth Types - Derived from constants for type safety
// =============================================

import { type AUTH_COOKIE, type STAKEHOLDER } from '@/constants/auth.constants';

export type StakeholderType = (typeof STAKEHOLDER)[keyof typeof STAKEHOLDER];
export type AuthCookieType = (typeof AUTH_COOKIE)[keyof typeof AUTH_COOKIE];

// Device types
export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'unknown';
