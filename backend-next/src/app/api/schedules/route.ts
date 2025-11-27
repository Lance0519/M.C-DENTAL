import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function OPTIONS() {
  return corsOptions();
}

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const createSchema = z.object({
  doctorId: z.string(),
  day: z.enum(validDays as [string, ...string[]]),
  startTime: z.string(),
  endTime: z.string(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  day: z.enum(validDays as [string, ...string[]]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function GET(req: NextRequest) {
  // Schedules are publicly accessible for booking purposes (guests need to see available times)
  // No authentication required for GET
  const supabase = supabaseAdmin();
  const doctorId = req.nextUrl.searchParams.get('doctor_id');
  const day = req.nextUrl.searchParams.get('day');

  let query = supabase.from('schedules').select('*');
  if (doctorId) query = query.eq('doctor_id', doctorId);
  if (day) query = query.eq('day_of_week', day);

  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  query = query.order('day_of_week', { ascending: true }).order('start_time', { ascending: true });

  const { data, error: dbErr } = await query;

  if (dbErr) {
    return error('Failed to fetch schedules', 500);
  }

  // Sort days manually to match CASE ordering
  const sorted = (data ?? []).sort((a, b) => {
    const dayDiff = order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week);
    if (dayDiff !== 0) return dayDiff;
    return a.start_time.localeCompare(b.start_time);
  });

  return success(sorted);
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { doctorId, day, startTime, endTime } = parsed.data;

  if (startTime >= endTime) {
    return error('End time must be after start time');
  }

  const supabase = supabaseAdmin();

  const { data: overlaps, error: overlapErr } = await supabase
    .from('schedules')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', day)
    .or(
      `and(start_time.lt.${endTime},end_time.gt.${startTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`,
    );

  if (overlapErr) {
    return error('Failed to check overlapping schedules', 500);
  }

  if ((overlaps ?? []).length > 0) {
    return error('This schedule overlaps with an existing schedule for this doctor');
  }

  const id = `sch${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const { error: insertErr } = await supabase.from('schedules').insert({
    id,
    doctor_id: doctorId,
    day_of_week: day,
    start_time: startTime,
    end_time: endTime,
  });

  if (insertErr) {
    return error('Failed to create schedule', 500);
  }

  // Fetch doctor name for better audit logging
  const { data: doctor } = await supabase
    .from('doctors')
    .select('name')
    .eq('id', doctorId)
    .single();

  await logAudit({
    action: 'SCHEDULE_CREATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      scheduleId: id, 
      doctorName: doctor?.name ?? 'Unknown Doctor',
      day, 
      time: `${startTime} - ${endTime}`,
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success({ id }, 'Schedule created successfully');
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
    return error('Schedule ID is required');
  }

  if (parsed.data.startTime && parsed.data.endTime && parsed.data.startTime >= parsed.data.endTime) {
    return error('End time must be after start time');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.day !== undefined) updates.day_of_week = parsed.data.day;
  if (parsed.data.startTime !== undefined) updates.start_time = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) updates.end_time = parsed.data.endTime;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();
  const { error: updateErr } = await supabase.from('schedules').update(updates).eq('id', id);

  if (updateErr) {
    return error('Failed to update schedule', 500);
  }

  // Fetch schedule details for better audit logging
  const { data: schedule } = await supabase
    .from('schedules')
    .select('doctor_id, day_of_week, start_time, end_time')
    .eq('id', id)
    .single();

  let doctorName = 'Unknown Doctor';
  if (schedule) {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('name')
      .eq('id', schedule.doctor_id)
      .single();
    doctorName = doctor?.name ?? 'Unknown Doctor';
  }

  await logAudit({
    action: 'SCHEDULE_UPDATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      scheduleId: id, 
      doctorName,
      day: schedule?.day_of_week ?? 'N/A',
      updatedFields: Object.keys(updates).filter(k => k !== 'updated_at'),
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Schedule updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Schedule ID is required');
  }

  const supabase = supabaseAdmin();
  // Fetch schedule details before deletion for audit logging
  const { data: scheduleToDelete } = await supabase
    .from('schedules')
    .select('doctor_id, day_of_week, start_time, end_time')
    .eq('id', id)
    .single();

  let doctorName = 'Unknown Doctor';
  if (scheduleToDelete) {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('name')
      .eq('id', scheduleToDelete.doctor_id)
      .single();
    doctorName = doctor?.name ?? 'Unknown Doctor';
  }

  const { error: deleteErr } = await supabase.from('schedules').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete schedule', 500);
  }

  await logAudit({
    action: 'SCHEDULE_DELETED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      scheduleId: id, 
      doctorName,
      day: scheduleToDelete?.day_of_week ?? 'N/A',
      time: scheduleToDelete ? `${scheduleToDelete.start_time} - ${scheduleToDelete.end_time}` : 'N/A',
      action: 'Deleted schedule',
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Schedule deleted successfully');
}

