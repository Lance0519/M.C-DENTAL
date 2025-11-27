import { NextRequest } from 'next/server';
import { z } from 'zod';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function OPTIONS() {
  return corsOptions();
}

// Step 1: Find patient by email
const findSchema = z.object({
  email: z.string().email(),
});

// Step 2: Set password for the account
const claimSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// GET: Check if email exists and is claimable
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  
  if (!email) {
    return error('Email is required', 400);
  }

  const parsed = findSchema.safeParse({ email });
  if (!parsed.success) {
    return error('Invalid email format', 400);
  }

  const supabase = supabaseAdmin();

  // Check if patient exists with this email
  const { data: patient, error: dbErr } = await supabase
    .from('patients')
    .select('id, full_name, email, username, password')
    .eq('email', email.toLowerCase())
    .single();

  if (dbErr) {
    if (dbErr.code === 'PGRST116') {
      return error('No account found with this email. Please contact the clinic if you have booked an appointment.', 404);
    }
    console.error('Claim account lookup error:', dbErr);
    return error('Failed to lookup account', 500);
  }

  // Check if account has default password (patient123) or is claimable
  const isDefaultPassword = patient.password === 'patient123';
  const isGuestEmail = patient.email?.endsWith('@guest.local') || patient.email?.endsWith('@walkin.local');
  
  // Account is claimable if it has default password or is a guest email
  const isClaimable = isDefaultPassword || isGuestEmail;

  if (!isClaimable) {
    return error('This account has already been claimed. Please use the login page or reset your password.', 400);
  }

  return success({
    found: true,
    fullName: patient.full_name,
    email: patient.email,
    canClaim: true,
  }, 'Account found and can be claimed');
}

// POST: Claim the account by setting a new password
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = claimSchema.safeParse(body);
  
  if (!parsed.success) {
    return error('Invalid request', 400, { issues: parsed.error.flatten() });
  }

  const { email, newPassword } = parsed.data;
  const supabase = supabaseAdmin();

  // Find the patient
  const { data: patient, error: findErr } = await supabase
    .from('patients')
    .select('id, full_name, email, username, password')
    .eq('email', email.toLowerCase())
    .single();

  if (findErr || !patient) {
    return error('Account not found', 404);
  }

  // Verify account is claimable
  const isDefaultPassword = patient.password === 'patient123';
  const isGuestEmail = patient.email?.endsWith('@guest.local') || patient.email?.endsWith('@walkin.local');
  
  if (!isDefaultPassword && !isGuestEmail) {
    return error('This account has already been claimed', 400);
  }

  // Update the password and email if needed
  const updates: Record<string, unknown> = {
    password: newPassword,
    updated_at: new Date().toISOString(),
  };

  // If they had a guest email, keep the original but allow login with actual email
  // The email field should already be their real email if provided during booking

  const { error: updateErr } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patient.id);

  if (updateErr) {
    console.error('Claim account update error:', updateErr);
    return error('Failed to claim account', 500);
  }

  // Log the account claim
  await logAudit({
    action: 'PASSWORD_CHANGE',
    userId: patient.id,
    userName: patient.full_name,
    userRole: 'patient',
    details: {
      action: 'Account claimed by patient',
      patientName: patient.full_name,
      email: patient.email,
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success({
    claimed: true,
    username: patient.username,
    email: patient.email,
  }, 'Account claimed successfully! You can now log in with your email and new password.');
}

