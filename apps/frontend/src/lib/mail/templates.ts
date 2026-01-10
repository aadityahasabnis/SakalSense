// =============================================
// Email Templates - HTML email templates
// =============================================

import { DEFAULT_SENDER } from '@/constants/email.constants';

// Base layout wrapper for all emails
const baseLayout = (content: string, title: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .otp-box { background-color: #f8f9fa; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0; }
        .text-muted { color: #666; font-size: 14px; }
        p { margin: 0 0 16px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${DEFAULT_SENDER.name}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${DEFAULT_SENDER.name}. All rights reserved.</p>
            <p class="text-muted">This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
`;

// OTP Verification Email Template
export const otpEmailTemplate = (recipientName: string, otp: string, expiresIn = '10 minutes'): { html: string; text: string } => {
    const html = baseLayout(
        `
        <p>Hello${recipientName ? ` ${recipientName}` : ''},</p>
        <p>Your verification code is:</p>
        <div class="otp-box">
            <p class="otp-code">${otp}</p>
        </div>
        <p class="text-muted">This code will expire in <strong>${expiresIn}</strong>.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        `,
        'Verification Code'
    );
    const text = `Hello${recipientName ? ` ${recipientName}` : ''},\n\nYour verification code is: ${otp}\n\nThis code will expire in ${expiresIn}.\n\nIf you didn't request this code, please ignore this email.\n\n${DEFAULT_SENDER.name}`;
    return { html, text };
};

// Password Reset Email Template
export const passwordResetEmailTemplate = (recipientName: string, resetLink: string, expiresIn = '1 hour'): { html: string; text: string } => {
    const html = baseLayout(
        `
        <p>Hello${recipientName ? ` ${recipientName}` : ''},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        <p class="text-muted">This link will expire in <strong>${expiresIn}</strong>.</p>
        <p class="text-muted">If you didn't request this, you can safely ignore this email.</p>
        <p class="text-muted" style="margin-top: 24px; font-size: 12px;">If the button doesn't work, copy and paste this link: ${resetLink}</p>
        `,
        'Reset Your Password'
    );
    const text = `Hello${recipientName ? ` ${recipientName}` : ''},\n\nWe received a request to reset your password.\n\nClick here to reset: ${resetLink}\n\nThis link will expire in ${expiresIn}.\n\nIf you didn't request this, you can safely ignore this email.\n\n${DEFAULT_SENDER.name}`;
    return { html, text };
};

// Generic Notification Email Template
export const notificationEmailTemplate = (recipientName: string, subject: string, message: string): { html: string; text: string } => {
    const html = baseLayout(
        `
        <p>Hello${recipientName ? ` ${recipientName}` : ''},</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        `,
        subject
    );
    const text = `Hello${recipientName ? ` ${recipientName}` : ''},\n\n${message}\n\n${DEFAULT_SENDER.name}`;
    return { html, text };
};

// Test Email Template
export const testEmailTemplate = (subject: string, body: string): { html: string; text: string } => {
    const html = baseLayout(
        `
        <p>${body.replace(/\n/g, '<br>')}</p>
        <p class="text-muted" style="margin-top: 24px;">This is a test email sent from the administrator panel.</p>
        `,
        subject
    );
    const text = `${body}\n\nThis is a test email sent from the administrator panel.\n\n${DEFAULT_SENDER.name}`;
    return { html, text };
};
