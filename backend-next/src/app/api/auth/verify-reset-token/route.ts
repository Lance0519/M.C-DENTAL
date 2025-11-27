import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { error, success } from '@/lib/response';

const schema = z.object({
  token: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return error('Missing required fields', 400, { issues: parsed.error.flatten() });
    }

    const { token } = parsed.data;
    const supabase = supabaseAdmin();

    const [{ data: users }, { data: patients }] = await Promise.all([
      supabase.from('users').select('email, username').eq('reset_token', token).gt('reset_token_expires', new Date().toISOString()).limit(1),
      supabase
        .from('patients')
        .select('email, username')
        .eq('reset_token', token)
        .gt('reset_token_expires', new Date().toISOString())
        .limit(1),
    ]);

    const user = users?.[0] ?? patients?.[0];

    if (!user) {
      return error('Invalid or expired reset token', 401);
    }

    return success(
      {
        valid: true,
        email: user.email,
        username: user.username ?? null,
      },
      'Token is valid',
    );
  } catch (err) {
    console.error('Verify token error', err);
    return error('Internal server error', 500);
  }
}

