import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { error, success } from '@/lib/response';
import { sendPasswordResetEmail } from '@/lib/email';

const recoverSchema = z.object({
  email: z.string().email(),
  send_reset_link: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = recoverSchema.safeParse(body);

    if (!parsed.success) {
      return error('Missing required fields', 400, { issues: parsed.error.flatten() });
    }

    const { email, send_reset_link } = parsed.data;
    const supabase = supabaseAdmin();

    const [{ data: users }, { data: patients }] = await Promise.all([
      supabase.from('users').select('*').eq('email', email).limit(1),
      supabase.from('patients').select('*').eq('email', email).limit(1),
    ]);

    const user = (users?.[0] ?? patients?.[0]) as Record<string, any> | undefined;
    const tableName = users?.[0] ? 'users' : patients?.[0] ? 'patients' : null;

    if (!user || !tableName) {
      return error('Email address not found', 404);
    }

    if (!send_reset_link) {
      return success(
        {
          message: 'Password recovery email could not be sent. Your password is: ' + user.password,
          password: user.password,
          email_sent: false,
          note: 'Email service is not configured. Please contact support for assistance.',
        },
        'Password recovery',
      );
    }

    // TODO: integrate Supabase email or Edge Function for reset emails
    const resetToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: tokenErr } = await supabase
      .from(tableName === 'users' ? 'users' : 'patients')
      .update({
        reset_token: resetToken,
        reset_token_expires: expires,
      })
      .eq('id', user.id);

    if (tokenErr) {
      return error('Failed to generate reset token', 500);
    }

    try {
      await sendPasswordResetEmail(email, resetToken);
      return success(
        {
          message: 'Password reset link sent to your email! Please check your inbox and spam folders.',
          email_sent: true,
          reset_link_sent: true,
        },
        'Reset link sent',
      );
    } catch (mailErr) {
      console.error('Failed to send password reset email', mailErr);
      return success(
        {
          message: 'Password reset token generated but email delivery failed.',
          reset_token: resetToken,
          email_sent: false,
          reset_link_sent: true,
          note: 'Use the token above to reset your password manually.',
        },
        'Reset token generated',
      );
    }
  } catch (err) {
    console.error('Recover error', err);
    return error('Internal server error', 500);
  }
}

