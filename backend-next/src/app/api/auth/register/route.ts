import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { error, success } from '@/lib/response';

const registerSchema = z.object({
  fullName: z.string(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return error('Missing required fields', 400, { issues: parsed.error.flatten() });
    }

    const { fullName, username, email, password, phone, dateOfBirth, address } = parsed.data;
    const supabase = supabaseAdmin();

    const usernameCheck = await supabase.rpc('check_username_exists', { username_input: username });
    if (usernameCheck.error) {
      if (usernameCheck.error.code === 'PGRST201' || usernameCheck.error.message.includes('function')) {
        // fallback: manual union query if RPC not available
        const { data, error: manualErr } = await supabase
          .rpc('check_unique_username', { username_input: username });
        if (manualErr) {
          return error('Database error while checking username', 500);
        }
        if (data?.exists) {
          return error('Username already exists');
        }
      } else {
        return error('Database error while checking username', 500);
      }
    } else if (usernameCheck.data?.exists) {
      return error('Username already exists');
    }

    const emailCheck = await supabase.rpc('check_email_exists', { email_input: email });
    if (emailCheck.error) {
      if (emailCheck.error.code === 'PGRST201' || emailCheck.error.message.includes('function')) {
        const { data, error: manualErr } = await supabase
          .rpc('check_unique_email', { email_input: email });
        if (manualErr) {
          return error('Database error while checking email', 500);
        }
        if (data?.exists) {
          return error('Email already exists');
        }
      } else {
        return error('Database error while checking email', 500);
      }
    } else if (emailCheck.data?.exists) {
      return error('Email already exists');
    }

    const id = `pat${Date.now()}`;

    const { error: insertErr } = await supabase.from('patients').insert({
      id,
      username,
      password,
      email,
      full_name: fullName,
      phone: phone ?? null,
      date_of_birth: dateOfBirth ?? null,
      address: address ?? null,
      role: 'patient',
    });

    if (insertErr) {
      return error('Registration failed', 500, { details: insertErr.message });
    }

    return success({ id }, 'Registration successful! You can now login.');
  } catch (err) {
    console.error('Register error', err);
    return error('Internal server error', 500);
  }
}

