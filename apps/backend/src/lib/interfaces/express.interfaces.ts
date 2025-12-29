// =============================================
// Express Type Extensions
// =============================================

import { type Request } from 'express';

import { type IJWTPayload } from '@/lib/interfaces/auth.interfaces.js';

// AuthenticatedRequest - Request with user payload attached by auth middleware
export interface IAuthenticatedRequest extends Request {
    user: IJWTPayload;
}
