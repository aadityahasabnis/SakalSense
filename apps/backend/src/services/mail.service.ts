// =============================================
// Mail Service - Universal email sending logic
// =============================================

import nodemailer from 'nodemailer';

import { GMAIL_ACCOUNT, GMAIL_PASSWORD } from '@/config/env.js';
import { GMAIL_SMTP_CONFIG, EMAIL_RETRY_CONFIG, DEFAULT_SENDER, EMAIL_STATUS, type EmailType } from '@/constants/email.constants.js';
import { type IEmailPayload, type IEmailResult, type IOtpEmailData, type IPasswordResetEmailData } from '@/lib/interfaces/email.interfaces.js';
import { otpEmailTemplate, passwordResetEmailTemplate, testEmailTemplate, notificationEmailTemplate } from '@/lib/templates/email.templates.js';
import { validateEmail, sanitizeEmailAddress, delay } from '@/utils/mail.utils.js';
import { createMailLog } from '@/middlewares';

// Transporter type - simplified to avoid pool/transport type variance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MailTransporter = ReturnType<typeof nodemailer.createTransport<any>>;

// Singleton transporter instance
let transporter: MailTransporter | undefined;

// initTransporter: Create new transporter with connection pooling
const initTransporter = (): MailTransporter => {
    return nodemailer.createTransport({
        ...GMAIL_SMTP_CONFIG,
        auth: {
            user: GMAIL_ACCOUNT,
            pass: GMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false, // Bypass self-signed certificate issues
        },
    });
};

// createTransporter: Get or create transporter
export const createTransporter = (): MailTransporter => {
    if (!transporter) {        
        transporter = initTransporter();
    }
    return transporter;
};

// verifyConnection: Test SMTP connection
export const verifyConnection = async (): Promise<boolean> => {
    try {
        const t = createTransporter();
        await t.verify();
        return true;
    } catch {
        return false;
    }
};

// getTransporter: Get or create transporter (alias for createTransporter)
export const getTransporter = (): MailTransporter => createTransporter();

// sendEmail: Core email sending function with auto-logging
export const sendEmail = async (payload: IEmailPayload, emailType: EmailType): Promise<IEmailResult> => {
    const startTime = Date.now();
    const t = getTransporter();

    // Validate recipient(s)
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const invalidRecipients = recipients.filter((email) => !validateEmail(email));
    if (invalidRecipients.length > 0) {
        const error = `Invalid email address(es): ${invalidRecipients.join(', ')}`;
        await createMailLog({
            recipient: recipients[0] ?? 'unknown',
            subject: payload.subject,
            type: emailType,
            status: EMAIL_STATUS.FAILED,
            duration: Date.now() - startTime,
            errorMessage: error,
        });
        return { success: false, error };
    }

    // Sanitize addresses
    const sanitizedTo = recipients.map(sanitizeEmailAddress);

    try {
        const info = await t.sendMail({
            from: `"${DEFAULT_SENDER.name}" <${GMAIL_ACCOUNT}>`,
            to: sanitizedTo.join(', '),
            cc: payload.cc,
            bcc: payload.bcc,
            replyTo: payload.replyTo ?? DEFAULT_SENDER.replyTo,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            attachments: payload.attachments,
        });

        const duration = Date.now() - startTime;

        // Log successful email
        await createMailLog({
            recipient: sanitizedTo[0] ?? 'unknown',
            subject: payload.subject,
            type: emailType,
            status: EMAIL_STATUS.SENT,
            duration,
            messageId: info.messageId,
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log failed email
        await createMailLog({
            recipient: sanitizedTo[0] ?? 'unknown',
            subject: payload.subject,
            type: emailType,
            status: EMAIL_STATUS.FAILED,
            duration,
            errorMessage,
        });

        return { success: false, error: errorMessage };
    }
};

// sendEmailWithRetry: Send email with exponential backoff retry
export const sendEmailWithRetry = async (payload: IEmailPayload, emailType: EmailType): Promise<IEmailResult> => {
    let lastError: string = 'Unknown error';
    let retryCount = 0;

    for (let attempt = 1; attempt <= EMAIL_RETRY_CONFIG.maxAttempts; attempt++) {
        const result = await sendEmail(payload, emailType);
        if (result.success) {
            return { ...result, retryCount };
        }

        lastError = result.error ?? 'Unknown error';
        retryCount = attempt;

        if (attempt < EMAIL_RETRY_CONFIG.maxAttempts) {
            const delayTime = EMAIL_RETRY_CONFIG.initialDelayMs * Math.pow(EMAIL_RETRY_CONFIG.backoffMultiplier, attempt - 1);
            await delay(delayTime);
        }
    }

    return { success: false, error: lastError, retryCount };
};

// =============================================
// Template-based email functions
// =============================================

// sendOtpEmail: Send OTP verification email
export const sendOtpEmail = async (to: string, data: IOtpEmailData): Promise<IEmailResult> => {
    const { html, text } = otpEmailTemplate(data.recipientName ?? '', data.otp, data.expiresIn);
    return sendEmailWithRetry({ to, subject: 'Your Verification Code', html, text }, 'OTP');
};

// sendPasswordResetEmail: Send password reset email
export const sendPasswordResetEmail = async (to: string, data: IPasswordResetEmailData): Promise<IEmailResult> => {
    const { html, text } = passwordResetEmailTemplate(data.recipientName ?? '', data.resetLink, data.expiresIn);
    return sendEmailWithRetry({ to, subject: 'Reset Your Password', html, text }, 'PASSWORD_RESET');
};

// sendTestEmail: Send test email (for administrator)
export const sendTestEmail = async (to: string, subject: string, body: string, cc?: string, bcc?: string): Promise<IEmailResult> => {
    const { html, text } = testEmailTemplate(subject, body);
    return sendEmail({ to, subject, html, text, cc, bcc }, 'TEST');
};

// sendNotificationEmail: Send generic notification
export const sendNotificationEmail = async (to: string, subject: string, message: string, recipientName?: string): Promise<IEmailResult> => {
    const { html, text } = notificationEmailTemplate(recipientName ?? '', subject, message);
    return sendEmailWithRetry({ to, subject, html, text }, 'NOTIFICATION');
};
