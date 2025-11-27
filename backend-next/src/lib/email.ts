import { Resend } from 'resend';
import { env } from './env';

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(env.resendApiKey());
  }
  return resendClient;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resend = getResend();
  const fromAddress = env.emailFromAddress();
  const clientUrl = env.clientBaseUrl();
  
  // Use React app route for password reset
  const url = `${clientUrl}/login?reset=true&token=${encodeURIComponent(token)}`;

  console.log(`Sending password reset email to ${to}`);
  console.log(`Reset URL: ${url}`);

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject: 'Reset your M.C. Dental Clinic password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C5A572;">M.C. Dental Clinic</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to continue:</p>
          <p style="margin: 30px 0;">
            <a href="${url}" style="background-color: #C5A572; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy this link: <a href="${url}">${url}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px;">M.C. Dental Clinic - Your smile is our priority</p>
        </div>
      `,
    });
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendEmailVerificationEmail(to: string, token: string) {
  const resend = getResend();
  const fromAddress = env.emailFromAddress();
  const clientUrl = env.clientBaseUrl();
  
  const url = `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const result = await resend.emails.send({
    from: fromAddress,
    to,
    subject: 'Verify your email address - M.C. Dental Clinic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C5A572;">M.C. Dental Clinic</h2>
        <p>Hello,</p>
        <p>Thanks for signing up. Please confirm your email by clicking the button below:</p>
        <p style="margin: 30px 0;">
          <a href="${url}" style="background-color: #C5A572; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy this link: <a href="${url}">${url}</a></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">M.C. Dental Clinic - Your smile is our priority</p>
      </div>
    `,
  });
  return result;
}