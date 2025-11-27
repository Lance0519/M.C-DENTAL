import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { error, success } from '@/lib/response';

const resetSchema = z.object({
  token: z.string(),
  new_password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return error('Missing required fields', 400, { issues: parsed.error.flatten() });
    }

    const { token, new_password } = parsed.data;
    const supabase = supabaseAdmin();

    const [{ data: users }, { data: patients }] = await Promise.all([
      supabase.from('users').select('*').eq('reset_token', token).gt('reset_token_expires', new Date().toISOString()),
      supabase
        .from('patients')
        .select('*')
        .eq('reset_token', token)
        .gt('reset_token_expires', new Date().toISOString()),
    ]);

    const user = (users?.[0] ?? patients?.[0]) as Record<string, any> | undefined;
    const tableName = users?.[0] ? 'users' : patients?.[0] ? 'patients' : null;

    if (!user || !tableName) {
      return error('Invalid or expired reset token. Please request a new password reset.', 401);
    }

    const { error: updateErr } = await supabase
      .from(tableName)
      .update({
        password: new_password,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', user.id);

    if (updateErr) {
      return error('Failed to update password', 500);
    }

    return success({ message: 'Password reset successfully! You can now login with your new password.' });
  } catch (err) {
    console.error('Reset error', err);
    return error('Internal server error', 500);
  }
}

