import { NextRequest } from 'next/server';
import { z } from 'zod';
import { success, error } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyEmailAddress } from '@/lib/emailVerification';

const schema = z.object({
  email: z.string().email(),
});

export function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.has('health')) {
    return success({ status: 'ok', service: 'email-verification' });
  }
  return error('Only POST method is allowed', 405);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return error('Email address is required', 400);
    }

    const email = parsed.data.email.trim();
    const supabase = supabaseAdmin();

    const [
      { data: userData, error: userErr },
      { data: patientData, error: patientErr },
    ] = await Promise.all([
      supabase.from('users').select('id').eq('email', email).limit(1),
      supabase.from('patients').select('id').eq('email', email).limit(1),
    ]);

    if (userErr || patientErr) {
      return error('Failed to check email existence', 500);
    }

    if ((userData?.length ?? 0) > 0 || (patientData?.length ?? 0) > 0) {
      return success({
        valid: false,
        exists: true,
        message: 'This email is already registered. Please use a different email or try logging in.',
      });
    }

    const verificationResult = await verifyEmailAddress(email);
    return success({ ...verificationResult, exists: false });
  } catch (err) {
    console.error('Email verification error', err);
    return error('Email verification service temporarily unavailable', 500);
  }
}

