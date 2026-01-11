'use server';
// =============================================
// Mail Server Actions - Email sending for administrators
// =============================================

import { cookies } from 'next/headers';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { verifyJWT } from '@/server/utils/jwt';
import { sendTestEmail, validateEmail } from '@/server/utils/mail';
import { validateSession } from '@/server/utils/session';

// =============================================
// Send Test Email Action (Administrator only)
// =============================================

interface ISendTestEmailRequest {
    recipient: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
}

interface ISendTestEmailResponse {
    success: boolean;
    error?: string;
    message?: string;
    data?: { messageId?: string };
}

export const sendTestEmailAction = async (params: ISendTestEmailRequest): Promise<ISendTestEmailResponse> => {
    const { recipient, subject, body, cc, bcc } = params;

    // Verify administrator authentication
    const c = await cookies();
    const token = c.get(AUTH_COOKIE.ADMINISTRATOR)?.value;

    if (!token) return { success: false, error: 'Authentication required' };

    const payload = await verifyJWT(token);
    if (payload?.role !== 'ADMINISTRATOR') return { success: false, error: 'Administrator access required' };

    const isValid = await validateSession(payload.sessionId, payload.email, payload.role);
    if (!isValid) return { success: false, error: 'Session expired' };

    // Validation
    if (!recipient || !subject || !body) return { success: false, error: 'Recipient, subject, and body are required' };
    if (!validateEmail(recipient)) return { success: false, error: 'Invalid email address' };
    if (subject.length > 200) return { success: false, error: 'Subject must be 200 characters or less' };
    if (body.length > 10000) return { success: false, error: 'Body must be 10000 characters or less' };

    try {
        const result = await sendTestEmail(recipient, subject, body, cc, bcc);

        if (result.success) return { success: true, message: 'Test email sent successfully', data: { messageId: result.messageId } };
        return { success: false, error: result.error ?? 'Failed to send email' };
    } catch (error) {
        console.error('[sendTestEmailAction]', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
};
