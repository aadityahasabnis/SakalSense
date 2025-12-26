// =============================================
// Auth Types - Derived from constants for type safety
// =============================================

import type { STAKEHOLDER, DEVICE, AUTH_COOKIE } from '../constants/auth.constants';

export type StakeholderType = (typeof STAKEHOLDER)[keyof typeof STAKEHOLDER];
export type DeviceType = (typeof DEVICE)[keyof typeof DEVICE];
export type AuthCookieType = (typeof AUTH_COOKIE)[keyof typeof AUTH_COOKIE];
