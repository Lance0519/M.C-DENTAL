import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function OPTIONS() {
  return corsOptions();
}

const createSchema = z.object({
  name: z.string(),
  specialty: z.string(),
  available: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  specialty: z.string().optional(),
  available: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = supabaseAdmin();
  const id = req.nextUrl.searchParams.get('id');
  const available = req.nextUrl.searchParams.get('available');

  if (id) {
    const { data, error: dbErr } = await supabase.from('doctors').select('*').eq('id', id).single();

    if (dbErr) {
      if (dbErr.code === 'PGRST116') {
        return error('Doctor not found', 404);
      }
      return error('Failed to fetch doctor', 500);
    }

    return success(data);
  }

  let query = supabase.from('doctors').select('*').order('name', { ascending: true });

  if (available !== null) {
    const isAvailable = available === 'true';
    query = query.eq('available', isAvailable);
  }

  const { data, error: listErr } = await query;

  if (listErr) {
    return error('Failed to fetch doctors', 500);
  }

  return success(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { name, specialty, available = true } = parsed.data;
  const supabase = supabaseAdmin();
  const id = `doc${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const { error: insertErr } = await supabase.from('doctors').insert({
    id,
    name,
    specialty,
    available,
  });

  if (insertErr) {
    return error('Failed to create doctor', 500);
  }

  await logAudit({
    action: 'DOCTOR_CREATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { doctorId: id, doctorName: name, specialty },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success({ id }, 'Doctor created successfully');
}

export async function PUT(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('No fields to update', 400, { issues: parsed.error.flatten() });
  }

  const id = req.nextUrl.searchParams.get('id') ?? parsed.data.id;
  if (!id) {
    return error('Doctor ID is required');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.specialty !== undefined) updates.specialty = parsed.data.specialty;
  if (parsed.data.available !== undefined) updates.available = parsed.data.available;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();
  const { error: updateErr } = await supabase.from('doctors').update(updates).eq('id', id);

  if (updateErr) {
    return error('Failed to update doctor', 500);
  }

  // Fetch doctor name for better audit logging
  const { data: updatedDoctor } = await supabase
    .from('doctors')
    .select('name')
    .eq('id', id)
    .single();

  await logAudit({
    action: 'DOCTOR_UPDATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      doctorId: id, 
      doctorName: updatedDoctor?.name ?? parsed.data.name ?? 'Unknown',
      updatedFields: Object.keys(updates).filter(k => k !== 'updated_at'),
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Doctor updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Doctor ID is required');
  }

  const supabase = supabaseAdmin();
  const { data: appointments, error: apptErr } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('doctor_id', id);

  if (apptErr) {
    return error('Failed to check appointments', 500);
  }

  const hasActive = (appointments ?? []).some(
    (appt) => appt.status !== 'cancelled' && appt.status !== 'completed',
  );

  if (hasActive) {
    return error('Cannot delete doctor with active appointments. Please reassign or cancel appointments first.');
  }

  // Fetch doctor name before deletion for audit logging
  const { data: doctorToDelete } = await supabase
    .from('doctors')
    .select('name')
    .eq('id', id)
    .single();

  const { error: deleteErr } = await supabase.from('doctors').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete doctor', 500);
  }

  await logAudit({
    action: 'DOCTOR_DELETED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      doctorId: id, 
      doctorName: doctorToDelete?.name ?? 'Unknown',
      action: 'Deleted doctor',
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Doctor deleted successfully');
}

