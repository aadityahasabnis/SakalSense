// =============================================
// Test Mail API Route - Send test email (Administrator only)
// =============================================

import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE } from '@/constants/auth.constants';
import { HTTP_STATUS } from '@/constants/http.constants';
import { verifyJWT } from '@/lib/auth/jwt';
import { validateSession } from '@/lib/auth/session';
import { type IApiResponse } from '@/lib/interfaces/api.interfaces';
import { type ISendTestMailRequest } from '@/lib/interfaces/email.interfaces';
import { sendTestEmail, validateEmail } from '@/lib/mail/service';

// ITestMailResponse: Response for test mail endpoint
interface ITestMailResponse { messageId?: string }

export const POST = async (req: NextRequest): Promise<NextResponse<IApiResponse<ITestMailResponse>>> => {
    // Verify administrator authentication
    const token = req.cookies.get(AUTH_COOKIE.ADMINISTRATOR)?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: HTTP_STATUS.UNAUTHORIZED });

    const payload = await verifyJWT(token);
    if (payload?.role !== 'ADMINISTRATOR') return NextResponse.json({ success: false, error: 'Administrator access required' }, { status: HTTP_STATUS.FORBIDDEN });

    const isValid = await validateSession(payload.sessionId, payload.userId, payload.role);
    if (!isValid) return NextResponse.json({ success: false, error: 'Session expired' }, { status: HTTP_STATUS.UNAUTHORIZED });

    try {
        const body: ISendTestMailRequest = await req.json();
        const { recipient, cc, bcc, subject, body: emailBody } = body;

        if (!recipient || !subject || !emailBody) return NextResponse.json({ success: false, error: 'Recipient, subject, and body are required' }, { status: HTTP_STATUS.BAD_REQUEST });
        if (!validateEmail(recipient)) return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: HTTP_STATUS.BAD_REQUEST });
        if (subject.length > 200) return NextResponse.json({ success: false, error: 'Subject must be 200 characters or less' }, { status: HTTP_STATUS.BAD_REQUEST });
        if (emailBody.length > 10000) return NextResponse.json({ success: false, error: 'Body must be 10000 characters or less' }, { status: HTTP_STATUS.BAD_REQUEST });

        const result = await sendTestEmail(recipient, subject, emailBody, cc, bcc);

        if (result.success) return NextResponse.json({ success: true, message: 'Test email sent successfully', data: { messageId: result.messageId } });
        return NextResponse.json({ success: false, error: result.error ?? 'Failed to send email' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    } catch (error) {
        console.error('[API/mail/test]', error);
        return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
};
