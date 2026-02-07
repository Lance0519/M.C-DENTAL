import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

const verifySchema = z.object({
  userId: z.string(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // User must be authenticated
    const auth = authenticate(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return error('Missing required fields', 400);
    }

    const { userId, password } = parsed.data;

    // User can only verify their own password
    if (auth.id !== userId) {
      return error('Unauthorized', 403);
    }

    // Only admin can access this endpoint (for audit log access)
    if (auth.role !== 'admin') {
      return error('Only administrators can verify password for audit access', 403);
    }

    const supabase = supabaseAdmin();

    // Check users table first (for admin/staff)
    // Users table uses 'password_hash' column
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', userId)
      .single();

    if (userErr) {
      if (userErr.code === 'PGRST116') {
        // User not found in users table, check patients table
      } else {
        console.error('User lookup error:', userErr);
        return error(`Failed to verify password: ${userErr.message}`, 500);
      }
    }

    if (user && userErr === null) {
      // Check password - users table uses 'password_hash'
      const storedPassword = (user as any).password_hash;
      if (!storedPassword) {
        console.error('Password hash is missing for user:', userId);
        return error('Password not set for this user', 500);
      }
      if (storedPassword === password) {
        return success({ verified: true }, 'Password verified');
      }
      return error('Invalid password', 401);
    }

    // Check patients table as fallback
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .select('id, password')
      .eq('id', userId)
      .single();

    if (patientErr) {
      if (patientErr.code === 'PGRST116') {
        return error('User not found', 404);
      }
      console.error('Patient lookup error:', patientErr);
      return error(`Failed to verify password: ${patientErr.message}`, 500);
    }

    if (patient) {
      if (patient.password === password) {
        return success({ verified: true }, 'Password verified');
      }
      return error('Invalid password', 401);
    }

    return error('User not found', 404);
  } catch (err) {
    console.error('Password verification error:', err);
    return error('Internal server error', 500);
  }
}

