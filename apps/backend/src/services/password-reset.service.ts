// =============================================
// Password Reset Service - Token management
// =============================================

import { randomBytes } from 'crypto';

import { type StakeholderType, PASSWORD_RESET_TTL, RESET_TOKEN_PREFIX, PREFIX_TO_STAKEHOLDER } from '@/constants/auth.constants.js';
import { getRedis } from '@/db/index.js';

// Types
interface IPasswordResetTokenData {
    userId: string;
    email: string;
    createdAt: string;
}

// Redis key builder
const resetTokenKey = (role: StakeholderType, token: string): string => `pwreset:${role}:${token}`;

// Parse prefixed token (e.g., usr_abc123...) -> { role, token }
export const parseResetToken = (prefixedToken: string): { role: StakeholderType; token: string } | null => {
    const [prefix, token] = prefixedToken.split('_');
    if (!prefix || !token) return null;
    const role = PREFIX_TO_STAKEHOLDER[prefix];
    return role ? { role, token } : null;
};

// Generate prefixed token and store in Redis
export const generateResetToken = async (userId: string, email: string, role: StakeholderType): Promise<string> => {
    const rawToken = randomBytes(32).toString('hex');
    const prefixedToken = `${RESET_TOKEN_PREFIX[role]}_${rawToken}`;
    const tokenData: IPasswordResetTokenData = { userId, email, createdAt: new Date().toISOString() };
    await getRedis().setEx(resetTokenKey(role, rawToken), PASSWORD_RESET_TTL, JSON.stringify(tokenData));
    return prefixedToken;
};

// Validate token and return user data + role
export const validateResetToken = async (prefixedToken: string): Promise<{ data: IPasswordResetTokenData; role: StakeholderType } | null> => {
    const parsed = parseResetToken(prefixedToken);
    if (!parsed) return null;
    const data = await getRedis().get(resetTokenKey(parsed.role, parsed.token));
    return data ? { data: JSON.parse(data) as IPasswordResetTokenData, role: parsed.role } : null;
};

// Invalidate token after use
export const invalidateResetToken = async (prefixedToken: string): Promise<void> => {
    const parsed = parseResetToken(prefixedToken);
    if (parsed) await getRedis().del(resetTokenKey(parsed.role, parsed.token));
};
