// =============================================
// Debug Log Interfaces - API request/response logging
// =============================================

import { type StakeholderType } from '@/types/auth.types';

// Status category for precise error classification
export type DebugLogStatusCategory = 'SUCCESS' | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION_ERROR' | 'SERVER_ERROR';

// IDebugLogEntry: Structure for API debug logs stored in Redis
export interface IDebugLogEntry {
    id: string;
    timestamp: string;
    method: string;
    url: string;
    requestBody: unknown;
    responseBody: unknown;
    status: number;
    duration: number;
    statusCategory: DebugLogStatusCategory;
    stakeholder?: StakeholderType;
    stakeholderId?: string;
    errorMessage?: string;
}
