import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const updateSchema = z.object({
  day: z.enum(validDays).optional(),
  isOpen: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = supabaseAdmin();
  const day = req.nextUrl.searchParams.get('day');

  if (day) {
    const { data, error: dbErr } = await supabase
      .from('clinic_schedule')
      .select('*')
      .eq('day_of_week', day)
      .single();

    if (dbErr) {
      if (dbErr.code === 'PGRST116') {
        return error('Schedule for this day not found', 404);
      }
      return error('Failed to fetch clinic schedule', 500);
    }

    return success(data);
  }

  const { data, error: listErr } = await supabase
    .from('clinic_schedule')
    .select('*')
    .order('day_of_week', { ascending: true });

  if (listErr) {
    return error('Failed to fetch clinic schedule', 500);
  }

  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sorted = (data ?? []).sort((a, b) => order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week));

  return success(sorted);
}

export async function PUT(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('No fields to update', 400, { issues: parsed.error.flatten() });
  }

  const dayParam = req.nextUrl.searchParams.get('day') ?? parsed.data.day;
  if (!dayParam) {
    return error('Day of week is required');
  }

  if (parsed.data.startTime && parsed.data.endTime && parsed.data.startTime >= parsed.data.endTime) {
    return error('End time must be after start time');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.isOpen !== undefined) updates.is_open = parsed.data.isOpen;
  if (parsed.data.startTime !== undefined) updates.start_time = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) updates.end_time = parsed.data.endTime;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();
  const { error: updateErr } = await supabase
    .from('clinic_schedule')
    .update(updates)
    .eq('day_of_week', dayParam);

  if (updateErr) {
    return error('Failed to update clinic schedule', 500);
  }

  return success(null, 'Clinic schedule updated successfully');
}

