import { Resend } from 'resend';
import { env } from './env';

const resend = new Resend(env.resendApiKey());
const fromAddress = env.emailFromAddress();

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${env.clientBaseUrl()}/login/reset-password.html?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: 'Reset your password',
    html: `<p>Hello,</p><p>We received a request to reset your password. Click the link below to continue:</p><p><a href="${url}">Reset password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
}

export async function sendEmailVerificationEmail(to: string, token: string) {
  const url = `${env.clientBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: fromAddress,
    to,
    subject: 'Verify your email address',
    html: `<p>Hello,</p><p>Thanks for signing up. Please confirm your email by clicking the link below:</p><p><a href="${url}">Verify email</a></p>`,
  });
}