// =============================================
// Email Interfaces - Type definitions for email system
// =============================================

import { type EmailStatusType, type EmailType } from '@/constants/email.constants';

// IEmailAttachment: File attachment structure
export interface IEmailAttachment {
    filename: string;
    content: Buffer | string;
    contentType?: string;
}

// IEmailPayload: Core email payload for sending
export interface IEmailPayload {
    to: string | Array<string>;
    subject: string;
    html: string;
    text?: string;
    cc?: string | Array<string>;
    bcc?: string | Array<string>;
    attachments?: Array<IEmailAttachment>;
    replyTo?: string;
}

// IEmailResult: Result from sending email
export interface IEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    retryCount?: number;
}

// IEmailLogEntry: Structure for email logs in Redis
export interface IEmailLogEntry {
    id: string;
    timestamp: string;
    recipient: string;
    subject: string;
    type: EmailType;
    status: EmailStatusType;
    duration: number;
    messageId?: string;
    errorMessage?: string;
    retryCount?: number;
}

// ISendTestMailRequest: Request body for test mail endpoint
export interface ISendTestMailRequest {
    recipient: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
}

// IEmailTemplateData: Generic template data
export interface IEmailTemplateData {
    recipientName?: string;
    [key: string]: unknown;
}

// IOtpEmailData: OTP verification email data
export interface IOtpEmailData extends IEmailTemplateData {
    otp: string;
    expiresIn?: string;
}

// IPasswordResetEmailData: Password reset email data
export interface IPasswordResetEmailData extends IEmailTemplateData {
    resetLink: string;
    expiresIn?: string;
}
