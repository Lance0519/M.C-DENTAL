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
  name: z.string(),
  description: z.string().optional(),
  duration: z.string(),
  price: z.string(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  price: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const supabase = supabaseAdmin();

  if (id) {
    const { data, error: dbErr } = await supabase.from('services').select('*').eq('id', id).single();

    if (dbErr) {
      if (dbErr.code === 'PGRST116') {
        return error('Service not found', 404);
      }
      return error('Failed to fetch service', 500);
    }

    return success(data);
  }

  const { data, error: listErr } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true });

  if (listErr) {
    return error('Failed to fetch services', 500);
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

  const { name, description, duration, price } = parsed.data;
  const supabase = supabaseAdmin();
  const id = `srv${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const { error: insertErr } = await supabase.from('services').insert({
    id,
    name,
    description: description ?? null,
    duration,
    price,
  });

  if (insertErr) {
    return error('Failed to create service', 500);
  }

  await logAudit({
    action: 'SERVICE_CREATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { serviceId: id, serviceName: name, price },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success({ id }, 'Service created successfully');
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
    return error('Service ID is required');
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.duration !== undefined) updates.duration = parsed.data.duration;
  if (parsed.data.price !== undefined) updates.price = parsed.data.price;
  if (parsed.data.active !== undefined) updates.active = parsed.data.active;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();
  
  // Fetch service details for better audit logging (including current active status)
  const { data: existingService } = await supabase
    .from('services')
    .select('name, active')
    .eq('id', id)
    .single();
  
  const { error: updateErr } = await supabase.from('services').update(updates).eq('id', id);

  if (updateErr) {
    return error('Failed to update service', 500);
  }

  // Determine if this is an activation/deactivation
  const isActivationChange = parsed.data.active !== undefined;
  const previousStatus = existingService?.active !== false ? 'Active' : 'Inactive';
  const newStatus = parsed.data.active ? 'Active' : 'Inactive';
  
  const actionDescription = isActivationChange
    ? `Status changed: ${previousStatus} → ${newStatus}`
    : 'Updated service details';

  await logAudit({
    action: 'SERVICE_UPDATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      serviceId: id, 
      serviceName: existingService?.name ?? 'Unknown',
      action: actionDescription,
      ...(isActivationChange && { statusChange: `${previousStatus} → ${newStatus}` }),
      updatedFields: Object.keys(updates).filter(k => k !== 'updated_at'),
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Service updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Service ID is required');
  }

  const supabase = supabaseAdmin();
  const { data: appointments, error: apptErr } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('service_id', id);

  if (apptErr) {
    return error('Failed to check appointments', 500);
  }

  const hasActive = (appointments ?? []).some(
    (appt) => appt.status !== 'cancelled' && appt.status !== 'completed',
  );

  if (hasActive) {
    return error('Cannot delete service with active appointments');
  }

  // Fetch service name before deletion for audit logging
  const { data: serviceToDelete } = await supabase
    .from('services')
    .select('name')
    .eq('id', id)
    .single();

  const { error: deleteErr } = await supabase.from('services').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete service', 500);
  }

  await logAudit({
    action: 'SERVICE_DELETED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      serviceId: id, 
      serviceName: serviceToDelete?.name ?? 'Unknown',
      action: 'Deleted service',
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Service deleted successfully');
}

