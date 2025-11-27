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
  role: z.enum(['staff']),
  position: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  position: z.string().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
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
      .select('id, username, email, full_name, role, created_at, updated_at')
      .eq('id', id)
      .eq('role', 'staff')
      .single();

    if (dbErr) {
      if (dbErr.code === 'PGRST116') {
        return error('Staff member not found', 404);
      }
      return error('Failed to fetch staff member', 500);
    }

    return success(data);
  }

  const { data, error: listErr } = await supabase
    .from('users')
    .select('id, username, email, full_name, role, created_at, updated_at')
    .eq('role', 'staff')
    .order('full_name', { ascending: true });

  if (listErr) {
    console.error('Staff fetch error:', listErr);
    return error('Failed to fetch staff', 500);
  }

  return success(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { username, email, password, fullName } = parsed.data;
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

  const { error: insertErr } = await supabase.from('users').insert({
    id,
    username,
    email,
    password_hash: password, // Note: In production, hash this password
    full_name: fullName,
    role: 'staff',
  });

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
  // Allow staff to update their own profile, or admin to update any staff
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('No fields to update', 400, { issues: parsed.error.flatten() });
  }

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
  if (parsed.data.phone !== undefined) updates.contact_number = parsed.data.phone;
  if (parsed.data.jobTitle !== undefined) updates.job_title = parsed.data.jobTitle;
  if (parsed.data.profileImage !== undefined) updates.profile_image = parsed.data.profileImage;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();
  const { error: updateErr } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .eq('role', 'staff');

  if (updateErr) {
    console.error('Staff update error:', updateErr);
    return error('Failed to update staff member', 500);
  }

  // Fetch staff name for better audit logging
  const { data: updatedStaff } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', id)
    .single();

  // Log audit
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

  return success(null, 'Staff member updated successfully');
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

