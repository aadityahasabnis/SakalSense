// =============================================
// Mail Controller - Endpoint handlers for email operations
// =============================================

import { type Request, type Response } from 'express';
import { type ISendTestMailRequest } from '@/lib/interfaces/email.interfaces.js';
import { sendTestEmail } from '@/services/mail.service.js';
import { getRecentMailLogs, getMailLogStats } from '@/middlewares/mailLogger.middleware.js';
import { HTTP_STATUS } from '@/constants/http.constants.js';
import { validateEmail } from '@/utils/mail.utils.js';

// sendTestMail: Send test email (Administrator only)
export const sendTestMailController = async (req: Request, res: Response): Promise<void> => {
    const { recipient, cc, bcc, subject, body } = req.body as ISendTestMailRequest;

    // Validate required fields
    if (!recipient || !subject || !body) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Recipient, subject, and body are required' });
        return;
    }

    // Validate email format
    if (!validateEmail(recipient)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Invalid email address' });
        return;
    }

    // Validate lengths
    if (subject.length > 200) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Subject must be 200 characters or less' });
        return;
    }

    if (body.length > 10000) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, error: 'Body must be 10000 characters or less' });
        return;
    }

    // Send test email with optional cc/bcc
    const result = await sendTestEmail(recipient, subject, body, cc, bcc);

    if (result.success) {
        res.json({ success: true, message: 'Test email sent successfully', data: { messageId: result.messageId } });
    } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, error: result.error ?? 'Failed to send email' });
    }
};

// getMailLogs: Get recent email logs (Administrator only)
export const getMailLogsController = async (req: Request, res: Response): Promise<void> => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const logs = await getRecentMailLogs(limit);

    res.json({ success: true, data: { logs, count: logs.length } });
};

// getMailStats: Get email statistics (Administrator only)
export const getMailStatsController = async (_req: Request, res: Response): Promise<void> => {
    const stats = await getMailLogStats();

    res.json({ success: true, data: stats });
};
