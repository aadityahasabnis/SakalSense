// =============================================
// Mail Service - Universal email sending logic with Nodemailer
// =============================================

import nodemailer from 'nodemailer';

import { DEFAULT_SENDER, EMAIL_RETRY_CONFIG, EMAIL_TYPE, type EmailType, GMAIL_SMTP_CONFIG } from '@/constants/email.constants';
import { GMAIL_ACCOUNT, GMAIL_PASSWORD } from '@/env';
import { type IEmailPayload, type IEmailResult, type IOtpEmailData, type IPasswordResetEmailData } from '@/lib/interfaces/email.interfaces';
import { notificationEmailTemplate, otpEmailTemplate, passwordResetEmailTemplate, testEmailTemplate } from '@/server/utils/mail-templates';

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// validateEmail: RFC 5322 compliant email validation
export const validateEmail = (email: string): boolean => Boolean(email) && typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email);

// sanitizeEmailAddress: Clean and normalize, prevent header injection
export const sanitizeEmailAddress = (email: string): string => (email && typeof email === 'string' ? email.toLowerCase().trim().replace(/[\r\n]/g, '') : '');

// delay: Promise-based delay for retry backoff
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Transporter singleton
let transporter: nodemailer.Transporter | undefined;

// getTransporter: Get or create SMTP transporter
const getTransporter = (): nodemailer.Transporter => {
    transporter ??= nodemailer.createTransport({
        ...GMAIL_SMTP_CONFIG,
        auth: { user: GMAIL_ACCOUNT, pass: GMAIL_PASSWORD },
        tls: { rejectUnauthorized: false },
    });
    return transporter;
};

// verifyConnection: Test SMTP connection
export const verifyConnection = async (): Promise<boolean> => {
    try {
        await getTransporter().verify();
        return true;
    } catch {
        return false;
    }
};

// sendEmail: Core email sending function
export const sendEmail = async (payload: IEmailPayload, emailType: EmailType): Promise<IEmailResult> => {
    const t = getTransporter();
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const invalidRecipients = recipients.filter((email) => !validateEmail(email));

    if (invalidRecipients.length > 0) {
        return { success: false, error: `Invalid email address(es): ${invalidRecipients.join(', ')}` };
    }

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

        console.log(`[Mail] ${emailType} sent to ${sanitizedTo[0]} (${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Mail] Failed to send ${emailType} to ${sanitizedTo[0]}:`, errorMessage);
        return { success: false, error: errorMessage };
    }
};

// sendEmailWithRetry: Send email with exponential backoff retry
export const sendEmailWithRetry = async (payload: IEmailPayload, emailType: EmailType): Promise<IEmailResult> => {
    let lastError = 'Unknown error';
    let retryCount = 0;

    for (let attempt = 1; attempt <= EMAIL_RETRY_CONFIG.maxAttempts; attempt++) {
        const result = await sendEmail(payload, emailType);
        if (result.success) return { ...result, retryCount };

        lastError = result.error ?? 'Unknown error';
        retryCount = attempt;

        if (attempt < EMAIL_RETRY_CONFIG.maxAttempts) {
            const delayTime = EMAIL_RETRY_CONFIG.initialDelayMs * Math.pow(EMAIL_RETRY_CONFIG.backoffMultiplier, attempt - 1);
            await delay(delayTime);
        }
    }

    return { success: false, error: lastError, retryCount };
};

// sendOtpEmail: Send OTP verification email
export const sendOtpEmail = async (to: string, data: IOtpEmailData): Promise<IEmailResult> => {
    const { html, text } = otpEmailTemplate(data.recipientName ?? '', data.otp, data.expiresIn);
    return sendEmailWithRetry({ to, subject: 'Your Verification Code', html, text }, EMAIL_TYPE.OTP);
};

// sendPasswordResetEmail: Send password reset email
export const sendPasswordResetEmail = async (to: string, data: IPasswordResetEmailData): Promise<IEmailResult> => {
    const { html, text } = passwordResetEmailTemplate(data.recipientName ?? '', data.resetLink, data.expiresIn);
    return sendEmailWithRetry({ to, subject: 'Reset Your Password', html, text }, EMAIL_TYPE.PASSWORD_RESET);
};

// sendTestEmail: Send test email (for administrator)
export const sendTestEmail = async (to: string, subject: string, body: string, cc?: string, bcc?: string): Promise<IEmailResult> => {
    const { html, text } = testEmailTemplate(subject, body);
    return sendEmail({ to, subject, html, text, cc, bcc }, EMAIL_TYPE.TEST);
};

// sendNotificationEmail: Send generic notification
export const sendNotificationEmail = async (to: string, subject: string, message: string, recipientName?: string): Promise<IEmailResult> => {
    const { html, text } = notificationEmailTemplate(recipientName ?? '', subject, message);
    return sendEmailWithRetry({ to, subject, html, text }, EMAIL_TYPE.NOTIFICATION);
};
