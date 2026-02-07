import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function OPTIONS() {
  return corsOptions();
}

const createSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string(),
  role: z.enum(['staff']).default('staff'),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  profileImage: z.string().nullable().optional(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const supabase = supabaseAdmin();
  const id = req.nextUrl.searchParams.get('id');



  if (id) {
    const { data, error: dbErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', id as string)
      .eq('role', 'staff')
      .single();

    if (dbErr) {
      if (dbErr.code === 'PGRST116') {
        return error('Staff member not found', 404);
      }
      console.error('Staff fetch error:', dbErr);
      return error('Failed to fetch staff member', 500);
    }

    return success(normalizeRecord(data));
  }

  const { data, error: listErr } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'staff')
    .order('full_name', { ascending: true });

  if (listErr) {
    console.error('Staff fetch error:', listErr);
    return error('Failed to fetch staff', 500);
  }

  return success((data ?? []).map(normalizeRecord));
}

const normalizeRecord = (record: any) =>
  record
    ? {
      ...record,
      job_title: record.job_title ?? record.jobTitle ?? null,
      phone: record.phone ?? record.contact_number ?? null,
      profile_image: record.profile_image ?? record.profile_image_url ?? null,
      profile_image_url: record.profile_image ?? record.profile_image_url ?? null,
    }
    : record;

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { username, email, password, fullName, jobTitle, phone, profileImage } = parsed.data;
  const supabase = supabaseAdmin();

  // Check if username or email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`username.eq.${username},email.eq.${email}`)
    .single();

  if (existing) {
    return error('Username or email already exists');
  }

  const id = `staff${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const insertData: Record<string, unknown> = {
    id,
    username,
    email,
    password_hash: password, // Note: hash in production
    full_name: fullName,
    role: 'staff',
    job_title: jobTitle ?? null,
    phone: phone ?? null,
  };

  if (profileImage && typeof profileImage === 'string' && profileImage.trim().startsWith('data:image/')) {
    insertData.profile_image = profileImage.trim();
    insertData.profile_image_url = profileImage.trim();
  }

  let { error: insertErr } = await supabase.from('users').insert(insertData);
  if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('profile_image'))) {
    // Retry without profile_image column for older schemas, but keep profile_image_url
    delete insertData.profile_image;
    const retryResult = await supabase.from('users').insert(insertData);
    insertErr = retryResult.error;
  }

  if (insertErr) {
    console.error('Staff creation error:', insertErr);
    return error('Failed to create staff member', 500);
  }

  // Log audit
  await logAudit({
    action: 'STAFF_CREATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { staffId: id, staffName: fullName, email },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success({ id }, 'Staff member created successfully');
}

export async function PUT(req: NextRequest) {
  try {
    // Allow staff to update their own profile, or admin to update any staff
    const auth = authenticate(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();
    console.log('Staff update request body:', JSON.stringify(body, null, 2));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Staff update validation error:', parsed.error.flatten());
      return error('Validation failed', 400, { issues: parsed.error.flatten() });
    }
    console.log('Staff update parsed data:', JSON.stringify(parsed.data, null, 2));

    const id = req.nextUrl.searchParams.get('id') ?? parsed.data.id;
    if (!id) {
      return error('Staff ID is required');
    }

    // Staff can only update their own profile, admin can update anyone
    if (auth.role === 'staff' && auth.id !== id) {
      return error('You can only update your own profile', 403);
    }

    if (auth.role !== 'admin' && auth.role !== 'staff') {
      return error('Access denied', 403);
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.username !== undefined) updates.username = parsed.data.username;
    if (parsed.data.email !== undefined) updates.email = parsed.data.email;
    if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName;
    if (parsed.data.password !== undefined) updates.password_hash = parsed.data.password;
    if (parsed.data.phone !== undefined) {
      if (parsed.data.phone === null) {
        updates.phone = null;
      } else {
        const phoneValue = typeof parsed.data.phone === 'string' ? parsed.data.phone.trim() : '';
        if (phoneValue) {
          updates.phone = phoneValue;
        } else {
          updates.phone = null;
        }
      }
    }
    if (parsed.data.jobTitle !== undefined) {
      if (parsed.data.jobTitle === null) {
        updates.job_title = null;
      } else if (typeof parsed.data.jobTitle === 'string') {
        const trimmed = parsed.data.jobTitle.trim();
        // Save the trimmed value - if it's empty, set to null to clear it
        updates.job_title = trimmed.length > 0 ? trimmed : null;
      } else {
        updates.job_title = null;
      }
    }
    if (parsed.data.profileImage !== undefined) {
      if (parsed.data.profileImage === null) {
        updates.profile_image = null;
        updates.profile_image_url = null;
      } else if (typeof parsed.data.profileImage === 'string' && parsed.data.profileImage.trim() !== '') {
        const imageData = parsed.data.profileImage.trim();
        if (imageData.startsWith('data:image/')) {
          updates.profile_image = imageData;
          updates.profile_image_url = imageData;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return error('No fields to update', 400);
    }

    updates.updated_at = new Date().toISOString();

    const supabase = supabaseAdmin();
    const attemptUpdate = async (payload: Record<string, unknown>) =>
      supabase
        .from('users')
        .update(payload)
        .eq('id', id)
        .eq('role', 'staff');

    let { error: updateErr } = await attemptUpdate(updates);

    if (updateErr) {
      console.error('Staff update error:', updateErr);
      console.error('Staff update payload:', JSON.stringify(updates));
      const fallbackUpdates: Record<string, unknown> = { ...updates };
      let shouldFallback = false;

      if (updateErr.message?.includes('profile_image') || updateErr.code === '42703') {
        delete fallbackUpdates.profile_image;
        shouldFallback = true;
      }
      if (updateErr.message?.includes('profile_image_url') || updateErr.code === '42703') {
        delete fallbackUpdates.profile_image_url;
        shouldFallback = true;
      }
      if (updateErr.message?.includes('job_title') || updateErr.code === '42703') {
        delete fallbackUpdates.job_title;
        shouldFallback = true;
      }
      if (updateErr.message?.includes('phone') || updateErr.code === '42703') {
        delete fallbackUpdates.phone;
        shouldFallback = true;
      }

      if (shouldFallback) {
        const { error: fallbackErr } = await attemptUpdate(fallbackUpdates);

        if (fallbackErr) {
          console.error('Staff update fallback error:', fallbackErr);
          console.error('Staff update fallback payload:', JSON.stringify(fallbackUpdates));
          return error('Failed to update staff member', 500, {
            details: fallbackErr.message,
            code: fallbackErr.code,
            hint: fallbackErr.hint
          });
        }
      } else {
        return error('Failed to update staff member', 500, {
          details: updateErr.message,
          code: updateErr.code,
          hint: updateErr.hint
        });
      }
    }

    // Fetch updated staff data for audit logging and to return updated record
    const { data: updatedStaff, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('role', 'staff')
      .single();

    if (fetchErr) {
      console.error('Error fetching updated staff:', fetchErr);
      // Still log audit even if fetch fails
      await logAudit({
        action: 'STAFF_UPDATED',
        userId: auth.id,
        userName: auth.fullName ?? 'Unknown',
        userRole: auth.role,
        details: {
          staffId: id,
          staffName: parsed.data.fullName ?? 'Unknown',
          updatedFields: Object.keys(updates).filter(k => k !== 'updated_at'),
        },
        ipAddress: getIpFromRequest(req.headers),
      });
      // Return success even if we can't fetch the updated record
      return success(null, 'Staff member updated successfully');
    }

    console.log('Updated staff record from DB:', updatedStaff);
    console.log('Job title in updated record:', updatedStaff?.job_title);

    // Log audit (don't fail if audit logging fails)
    try {
      await logAudit({
        action: 'STAFF_UPDATED',
        userId: auth.id,
        userName: auth.fullName ?? 'Unknown',
        userRole: auth.role,
        details: {
          staffId: id,
          staffName: updatedStaff?.full_name ?? parsed.data.fullName ?? 'Unknown',
          updatedFields: Object.keys(updates).filter(k => k !== 'updated_at'),
        },
        ipAddress: getIpFromRequest(req.headers),
      });
    } catch (auditErr) {
      console.error('Audit logging failed (non-critical):', auditErr);
    }

    // Return the updated staff record so frontend can sync
    try {
      const normalized = updatedStaff ? normalizeRecord(updatedStaff) : null;
      return success(normalized, 'Staff member updated successfully');
    } catch (normalizeErr) {
      console.error('Error normalizing staff record:', normalizeErr);
      // Still return success since the update worked
      return success(null, 'Staff member updated successfully');
    }
  } catch (err) {
    console.error('Unexpected error in PUT /staff:', err);
    return error('Internal server error', 500, {
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Staff ID is required');
  }

  const supabase = supabaseAdmin();

  // Fetch staff name before deletion for audit logging
  const { data: staffToDelete } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', id)
    .eq('role', 'staff')
    .single();

  const { error: deleteErr } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
    .eq('role', 'staff');

  if (deleteErr) {
    console.error('Staff delete error:', deleteErr);
    return error('Failed to delete staff member', 500);
  }

  // Log audit
  await logAudit({
    action: 'STAFF_DELETED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: {
      staffId: id,
      staffName: staffToDelete?.full_name ?? 'Unknown',
      action: 'Deleted staff member',
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Staff member deleted successfully');
}

