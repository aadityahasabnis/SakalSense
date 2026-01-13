'use server';
// =============================================
// Admin Request Server Actions - Admin registration approval flow
// =============================================

import { randomBytes } from 'crypto';

import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { RATE_LIMIT_AUTH } from '@/constants/rate-limit.constants';
import { BASE_URL } from '@/env';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { prisma } from '@/server/db/prisma';
import { createDebugLog } from '@/server/utils/debugLog';
import { getClientIP } from '@/server/utils/device';
import { verifyJWT } from '@/server/utils/jwt';
import { sendNotificationEmail } from '@/server/utils/mail';
import { hashPassword } from '@/server/utils/password';
import { consumeRateLimit } from '@/server/utils/rate-limit';

// =============================================
// Types
// =============================================

type AdminRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface IAdminRequest {
    id: string;
    email: string;
    fullName: string;
    reason: string | null;
    status: AdminRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================
// Submit Admin Request (Public)
// =============================================

interface ISubmitRequestParams {
    fullName: string;
    email: string;
    reason?: string;
}

interface ISubmitRequestResponse {
    message?: string;
}

export const submitAdminRequest = async (params: ISubmitRequestParams): Promise<IApiResponse<ISubmitRequestResponse>> => {
    const start = Date.now();
    const { fullName, email, reason } = params;
    const h = await headers();
    const ip = getClientIP(h);

    // Rate limiting
    const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_AUTH);
    if (!rateLimitResult.allowed) {
        await createDebugLog({ method: 'POST', url: '/auth/admin-request', requestBody: { email }, responseBody: { error: 'Rate limited' }, status: 429, duration: Date.now() - start });
        return { success: false, error: 'Too many requests. Please try again later.' };
    }

    // Validation
    if (!fullName || !email) {
        await createDebugLog({ method: 'POST', url: '/auth/admin-request', requestBody: { email }, responseBody: { error: 'Validation failed' }, status: 400, duration: Date.now() - start });
        return { success: false, error: 'Full name and email are required' };
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();

        // Check if already registered as admin
        const existingAdmin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
        if (existingAdmin) {
            await createDebugLog({ method: 'POST', url: '/auth/admin-request', requestBody: { email }, responseBody: { error: 'Already admin' }, status: 409, duration: Date.now() - start });
            return { success: false, error: 'This email is already registered as an admin' };
        }

        // Check for existing pending request
        const existingRequest = await prisma.adminInviteRequest.findUnique({ where: { email: normalizedEmail } });
        if (existingRequest) {
            if (existingRequest.status === 'PENDING') {
                return { success: false, error: 'A request with this email is already pending' };
            }
            if (existingRequest.status === 'REJECTED') {
                return { success: false, error: 'Your previous request was rejected. Please contact support.' };
            }
        }

        // Create new request
        await prisma.adminInviteRequest.create({
            data: {
                email: normalizedEmail,
                fullName: fullName.trim(),
                reason: reason?.trim(),
            },
        });

        await createDebugLog({ method: 'POST', url: '/auth/admin-request', requestBody: { email }, responseBody: { success: true }, status: 201, duration: Date.now() - start });
        return { success: true, data: { message: 'Your admin request has been submitted. You will be notified via email once reviewed.' } };
    } catch (error) {
        console.error('[submitAdminRequest]', error);
        await createDebugLog({ method: 'POST', url: '/auth/admin-request', requestBody: { email }, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

// =============================================
// Get Admin Requests (Administrator only)
// =============================================

interface IGetAdminRequestsParams {
    status?: AdminRequestStatus;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

interface IGetAdminRequestsResponse {
    requests: Array<IAdminRequest>;
    total: number;
    page: number;
    totalPages: number;
}

export const getAdminRequests = async (params: IGetAdminRequestsParams = {}): Promise<IApiResponse<IGetAdminRequestsResponse>> => {
    const start = Date.now();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE.ADMINISTRATOR)?.value;

    if (!token) {
        await createDebugLog({ method: 'GET', url: '/auth/admin-requests', requestBody: params, responseBody: { error: 'No token' }, status: 401, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR' });
        return { success: false, error: 'Authentication required' };
    }

    const payload = await verifyJWT(token);
    if (payload?.role !== 'ADMINISTRATOR') {
        await createDebugLog({ method: 'GET', url: '/auth/admin-requests', requestBody: params, responseBody: { error: 'Unauthorized' }, status: 403, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR' });
        return { success: false, error: 'Administrator access required' };
    }

    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    try {
        const where = status ? { status } : {};
        const [requests, total] = await Promise.all([
            prisma.adminInviteRequest.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.adminInviteRequest.count({ where }),
        ]);

        await createDebugLog({ method: 'GET', url: '/auth/admin-requests', requestBody: params, responseBody: { count: requests.length }, status: 200, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', stakeholderId: payload.userId });
        return {
            success: true,
            data: {
                requests: requests as Array<IAdminRequest>,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('[getAdminRequests]', error);
        await createDebugLog({ method: 'GET', url: '/auth/admin-requests', requestBody: params, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

// =============================================
// Approve Admin Request (Administrator only)
// =============================================

interface IApproveRequestParams {
    requestId: string;
}

interface IApproveRequestResponse {
    message?: string;
    adminId?: string;
}

export const approveAdminRequest = async (params: IApproveRequestParams): Promise<IApiResponse<IApproveRequestResponse>> => {
    const start = Date.now();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE.ADMINISTRATOR)?.value;

    if (!token) {
        await createDebugLog({ method: 'POST', url: '/auth/admin-requests/approve', requestBody: params, responseBody: { error: 'No token' }, status: 401, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR' });
        return { success: false, error: 'Authentication required' };
    }

    const payload = await verifyJWT(token);
    if (payload?.role !== 'ADMINISTRATOR') {
        await createDebugLog({ method: 'POST', url: '/auth/admin-requests/approve', requestBody: params, responseBody: { error: 'Unauthorized' }, status: 403, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR' });
        return { success: false, error: 'Administrator access required' };
    }

    try {
        const request = await prisma.adminInviteRequest.findUnique({ where: { id: params.requestId } });

        if (!request) {
            await createDebugLog({ method: 'POST', url: '/auth/admin-requests/approve', requestBody: params, responseBody: { error: 'Not found' }, status: 404, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', stakeholderId: payload.userId });
            return { success: false, error: 'Request not found' };
        }

        if (request.status !== 'PENDING') {
            await createDebugLog({ method: 'POST', url: '/auth/admin-requests/approve', requestBody: params, responseBody: { error: 'Already processed' }, status: 400, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', stakeholderId: payload.userId });
            return { success: false, error: `Request has already been ${request.status.toLowerCase()}` };
        }

        // Generate temporary password
        const tempPassword = randomBytes(8).toString('hex');
        const hashedPassword = await hashPassword(tempPassword);

        // Verify the administrator exists before using as invitedById
        const administratorExists = await prisma.administrator.findUnique({ where: { id: payload.userId } });

        // Create admin account
        const admin = await prisma.admin.create({
            data: {
                email: request.email,
                fullName: request.fullName,
                password: hashedPassword,
                ...(administratorExists && { invitedById: payload.userId }),
            },
        });

        // Update request status
        await prisma.adminInviteRequest.update({
            where: { id: params.requestId },
            data: { status: 'APPROVED' },
        });

        // Send approval email with login info
        const loginUrl = `${BASE_URL}/login/admin`;
        await sendNotificationEmail(
            request.email,
            'Your Admin Access Has Been Approved',
            `Congratulations! Your admin access request has been approved.\n\nYour login credentials:\nEmail: ${request.email}\nTemporary Password: ${tempPassword}\n\nPlease login at: ${loginUrl}\n\nIMPORTANT: Please change your password immediately after logging in.`,
            request.fullName
        );

        revalidatePath('/administrator/admin-requests');

        await createDebugLog({ method: 'POST', url: '/auth/admin-requests/approve', requestBody: params, responseBody: { success: true, adminId: admin.id }, status: 200, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', stakeholderId: payload.userId });
        return { success: true, data: { message: `Admin account created for ${request.email}`, adminId: admin.id } };
    } catch (error) {
        console.error('[approveAdminRequest]', error);
        await createDebugLog({ method: 'POST', url: '/auth/admin-requests/approve', requestBody: params, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

// =============================================
// Reject Admin Request (Administrator only)
// =============================================

interface IRejectRequestParams {
    requestId: string;
    reason?: string;
}

export const rejectAdminRequest = async (params: IRejectRequestParams): Promise<IApiResponse> => {
    const start = Date.now();
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE.ADMINISTRATOR)?.value;

    if (!token) {
        await createDebugLog({ method: 'POST', url: '/auth/admin-requests/reject', requestBody: params, responseBody: { error: 'No token' }, status: 401, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR' });
        return { success: false, error: 'Authentication required' };
    }

    const payload = await verifyJWT(token);
    if (payload?.role !== 'ADMINISTRATOR') {
        await createDebugLog({ method: 'POST', url: '/auth/admin-requests/reject', requestBody: params, responseBody: { error: 'Unauthorized' }, status: 403, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR' });
        return { success: false, error: 'Administrator access required' };
    }

    try {
        const request = await prisma.adminInviteRequest.findUnique({ where: { id: params.requestId } });

        if (!request) {
            await createDebugLog({ method: 'POST', url: '/auth/admin-requests/reject', requestBody: params, responseBody: { error: 'Not found' }, status: 404, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', stakeholderId: payload.userId });
            return { success: false, error: 'Request not found' };
        }

        if (request.status !== 'PENDING') {
            await createDebugLog({ method: 'POST', url: '/auth/admin-requests/reject', requestBody: params, responseBody: { error: 'Already processed' }, status: 400, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', stakeholderId: payload.userId });
            return { success: false, error: `Request has already been ${request.status.toLowerCase()}` };
        }

        // Update request status
        await prisma.adminInviteRequest.update({
            where: { id: params.requestId },
            data: { status: 'REJECTED' },
        });

        // Send rejection email
        const reasonText = params.reason ? `\n\nReason: ${params.reason}` : '';
        await sendNotificationEmail(
            request.email,
            'Admin Access Request Update',
            `We regret to inform you that your admin access request has not been approved at this time.${reasonText}\n\nIf you believe this was a mistake, please contact support.`,
            request.fullName
        );

        revalidatePath('/administrator/admin-requests');

        await createDebugLog({ method: 'POST', url: '/auth/admin-requests/reject', requestBody: params, responseBody: { success: true }, status: 200, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', stakeholderId: payload.userId });
        return { success: true, message: 'Request rejected successfully' };
    } catch (error) {
        console.error('[rejectAdminRequest]', error);
        await createDebugLog({ method: 'POST', url: '/auth/admin-requests/reject', requestBody: params, responseBody: { error: 'Server error' }, status: 500, duration: Date.now() - start, stakeholder: 'ADMINISTRATOR', errorMessage: error instanceof Error ? error.message : 'Unknown' });
        return { success: false, error: 'An unexpected error occurred' };
    }
};

// =============================================
// Get Request Counts (Administrator only)
// =============================================

interface IGetRequestCountsResponse {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
}

export const getAdminRequestCounts = async (): Promise<IApiResponse<IGetRequestCountsResponse>> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE.ADMINISTRATOR)?.value;

    if (!token) return { success: false, error: 'Authentication required' };

    const payload = await verifyJWT(token);
    if (payload?.role !== 'ADMINISTRATOR') return { success: false, error: 'Administrator access required' };

    try {
        const [pending, approved, rejected] = await Promise.all([
            prisma.adminInviteRequest.count({ where: { status: 'PENDING' } }),
            prisma.adminInviteRequest.count({ where: { status: 'APPROVED' } }),
            prisma.adminInviteRequest.count({ where: { status: 'REJECTED' } }),
        ]);

        return {
            success: true,
            data: { pending, approved, rejected, total: pending + approved + rejected },
        };
    } catch (error) {
        console.error('[getAdminRequestCounts]', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
};
