import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function OPTIONS() {
  return corsOptions();
}

// Use * to select all available columns - avoids errors from missing columns
const baseSelect = '*';

const createSchema = z.object({
  fullName: z.string(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  password: z.string().optional(),
  profileImage: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = authenticate(req);
    if (auth instanceof Response) return auth;

    const supabase = supabaseAdmin();
    const id = req.nextUrl.searchParams.get('id');

    if (id) {
      // For patients, they can only access their own record
      if (auth.role === 'patient' && auth.id !== id) {
        return error('You can only access your own data', 403);
      }

      const { data, error: dbErr } = await supabase
        .from('patients')
        .select(baseSelect)
        .eq('id', id)
        .single();
      
      if (dbErr) {
        console.error('GET /api/patients - Error fetching patient:', dbErr);
        if (dbErr.code === 'PGRST116') {
          return error('Patient not found', 404);
        }
        return error('Failed to fetch patient', 500, { details: dbErr.message, code: dbErr.code });
      }

      return success(data);
    }

    if (auth.role !== 'admin' && auth.role !== 'staff') {
      return error('Access denied', 403);
    }

    const { data: listData, error: listErr } = await supabase
      .from('patients')
      .select(baseSelect)
      .order('full_name', { ascending: true });

    if (listErr) {
      console.error('GET /api/patients - Error fetching patients list:', listErr);
      return error('Failed to fetch patients', 500, { details: listErr.message, code: listErr.code });
    }

    return success(listData ?? []);
  } catch (err) {
    console.error('GET /api/patients - Unexpected error:', err);
    return error('Internal server error', 500, { details: err instanceof Error ? err.message : 'Unknown error' });
  }
}

export async function POST(req: NextRequest) {
  // Allow guest patient creation (unauthenticated) for booking flow
  // But still allow authenticated admin/staff to create patients
  const auth = authenticate(req);
  const isAuthenticated = !(auth instanceof Response);
  
  // Determine if this is a guest booking request (checking for guest username pattern)
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { fullName, username, email, password, phone, dateOfBirth, gender, address } = parsed.data;
  
  // Only allow unauthenticated requests for guest patients
  const isGuestPatient = username?.startsWith('guest_') || email?.includes('@guest.local');
  if (!isAuthenticated && !isGuestPatient) {
    return error('Authentication required for non-guest patient creation', 401);
  }
  
  const supabase = supabaseAdmin();

  const [{ data: userNameExists }, { data: patientNameExists }] = await Promise.all([
    supabase.from('users').select('id').eq('username', username).limit(1),
    supabase.from('patients').select('id').eq('username', username).limit(1),
  ]);

  if (userNameExists?.length || patientNameExists?.length) {
    return error('Username already exists');
  }

  const [{ data: userEmailExists }, { data: patientEmailExists }] = await Promise.all([
    supabase.from('users').select('id').eq('email', email).limit(1),
    supabase.from('patients').select('id').eq('email', email).limit(1),
  ]);

  if (userEmailExists?.length || patientEmailExists?.length) {
    return error('Email already exists');
  }

  const id = `pat${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const { error: insertErr } = await supabase.from('patients').insert({
    id,
    username,
    password,
    email,
    full_name: fullName,
    phone: phone ?? null,
    date_of_birth: dateOfBirth ?? null,
    gender: gender ?? null,
    address: address ?? null,
    role: 'patient',
  });

  if (insertErr) {
    return error('Failed to create patient', 500);
  }

  // Log audit
  await logAudit({
    action: 'PATIENT_CREATED',
    userId: isAuthenticated ? (auth as any).id : id,
    userName: isAuthenticated ? ((auth as any).fullName ?? 'Unknown') : fullName,
    userRole: isAuthenticated ? (auth as any).role : 'guest',
    details: { patientId: id, patientName: fullName, email, isGuestBooking: isGuestPatient },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success({ id }, 'Patient created successfully');
}

export async function PUT(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('No fields to update', 400, { issues: parsed.error.flatten() });
  }

  const id = req.nextUrl.searchParams.get('id') ?? parsed.data.id;

  if (!id) {
    return error('Patient ID is required');
  }

  // For patients, they can only update their own record
  if (auth.role === 'patient' && auth.id !== id) {
    return error('You can only update your own data', 403);
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone || null;
  // Convert empty string to null for date field
  if (parsed.data.dateOfBirth !== undefined) {
    updates.date_of_birth = parsed.data.dateOfBirth?.trim() || null;
  }
  if (parsed.data.gender !== undefined) updates.gender = parsed.data.gender || null;
  if (parsed.data.address !== undefined) updates.address = parsed.data.address || null;
  if (parsed.data.password) updates.password = parsed.data.password;
  if (parsed.data.profileImage !== undefined) {
    // Handle null explicitly - set to null if provided, otherwise set the value
    // Try profile_image first (new column), fallback to profile_image_url if needed
    if (parsed.data.profileImage === null || parsed.data.profileImage === '') {
      // Only set to null if explicitly null, not empty string
      if (parsed.data.profileImage === null) {
        updates.profile_image = null;
        updates.profile_image_url = null;
        updates.profile_image_path = null;
      }
    } else {
      // Ensure we have a valid image data string
      const imageData = String(parsed.data.profileImage).trim();
      if (imageData && imageData.startsWith('data:image/')) {
        updates.profile_image = imageData;
        // Also update the old columns for backward compatibility
        updates.profile_image_url = imageData;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  // Note: updated_at is auto-managed by the database or may not exist
  // Remove this if it causes issues

  const supabase = supabaseAdmin();
  
  // Try to update, but handle the case where profile_image column might not exist
  const { error: updateErr } = await supabase.from('patients').update(updates).eq('id', id);

  if (updateErr) {
    console.error('Patient update error:', updateErr);
    console.error('Update data:', JSON.stringify(updates, null, 2));
    console.error('Patient ID:', id);
    
    // If the error is about a missing column, try without profile_image
    if (updateErr.message?.includes('profile_image') || updateErr.code === '42703') {
      console.warn('profile_image column may not exist, trying with profile_image_url only');
      const fallbackUpdates = { ...updates };
      delete fallbackUpdates.profile_image;
      
      if (parsed.data.profileImage !== undefined) {
        if (parsed.data.profileImage === null) {
          fallbackUpdates.profile_image_url = null;
          fallbackUpdates.profile_image_path = null;
        } else {
          fallbackUpdates.profile_image_url = parsed.data.profileImage;
        }
      }
      
      const { error: fallbackErr } = await supabase.from('patients').update(fallbackUpdates).eq('id', id);
      if (fallbackErr) {
        return error('Failed to update patient', 500, { 
          details: fallbackErr.message,
          code: fallbackErr.code,
          hint: fallbackErr.hint 
        });
      }
      // Success with fallback
    } else {
      return error('Failed to update patient', 500, { 
        details: updateErr.message,
        code: updateErr.code,
        hint: updateErr.hint 
      });
    }
  }

  // Log audit
  await logAudit({
    action: 'PATIENT_UPDATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { patientId: id, updatedFields: Object.keys(updates) },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Patient updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Patient ID is required');
  }

  const supabase = supabaseAdmin();

  const today = new Date().toISOString().slice(0, 10);
  const { data: futureAppointments, error: apptErr } = await supabase
    .from('appointments')
    .select('id, status, appointment_date')
    .eq('patient_id', id)
    .gte('appointment_date', today);

  if (apptErr) {
    return error('Failed to check appointments', 500);
  }

  const hasFuture = (futureAppointments ?? []).some(
    (appt) => appt.status !== 'cancelled' && appt.status !== 'completed',
  );

  if (hasFuture) {
    return error('Cannot delete patient with future appointments');
  }

  const { error: deleteErr } = await supabase.from('patients').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete patient', 500);
  }

  // Log audit
  await logAudit({
    action: 'PATIENT_DELETED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { patientId: id },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Patient deleted successfully');
}

