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

    // Check username in patients table
    const { data: patientUsername, error: patUsernameErr } = await supabase
      .from('patients')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (patUsernameErr) {
      console.error('Username check error (patients):', patUsernameErr);
      return error('Database error while checking username', 500);
    }

    // Check username in staff table
    const { data: staffUsername, error: staffUsernameErr } = await supabase
      .from('staff')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (staffUsernameErr) {
      console.error('Username check error (staff):', staffUsernameErr);
      return error('Database error while checking username', 500);
    }

    if (patientUsername || staffUsername) {
      return error('Username already exists', 400);
    }

    // Check email in patients table
    const { data: patientEmail, error: patEmailErr } = await supabase
      .from('patients')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (patEmailErr) {
      console.error('Email check error (patients):', patEmailErr);
      return error('Database error while checking email', 500);
    }

    // Check email in staff table
    const { data: staffEmail, error: staffEmailErr } = await supabase
      .from('staff')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (staffEmailErr) {
      console.error('Email check error (staff):', staffEmailErr);
      return error('Database error while checking email', 500);
    }

    if (patientEmail || staffEmail) {
      return error('Email already exists', 400);
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
      console.error('Insert error:', insertErr);
      return error('Registration failed', 500, { details: insertErr.message });
    }

    return success({ id }, 'Registration successful! You can now login.');
  } catch (err) {
    console.error('Register error', err);
    return error('Internal server error', 500);
  }
}

