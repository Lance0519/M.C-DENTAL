import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const updateSchema = z.object({
  day: z.enum(validDays).optional(),
  isOpen: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
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

      // Map snake_case to camelCase
      return success({
        id: data.id,
        day: data.day_of_week,
        isOpen: data.is_open,
        startTime: data.start_time,
        endTime: data.end_time,
        breakStartTime: data.break_start_time,
        breakEndTime: data.break_end_time,
      });
    }

    const { data: listData, error: listErr } = await supabase
      .from('clinic_schedule')
      .select('*')
      .order('day_of_week', { ascending: true });

    let data = listData;

    // Auto-seed if empty
    if (!listErr && (!data || data.length === 0)) {
      const { data: seededData, error: seedError } = await supabase
        .from('clinic_schedule')
        .insert([
          { day_of_week: 'Monday', is_open: true, start_time: '09:00', end_time: '17:00', break_start_time: '12:01', break_end_time: '12:59' },
          { day_of_week: 'Tuesday', is_open: true, start_time: '09:00', end_time: '17:00', break_start_time: '12:01', break_end_time: '12:59' },
          { day_of_week: 'Wednesday', is_open: true, start_time: '09:00', end_time: '17:00', break_start_time: '12:01', break_end_time: '12:59' },
          { day_of_week: 'Thursday', is_open: true, start_time: '09:00', end_time: '17:00', break_start_time: '12:01', break_end_time: '12:59' },
          { day_of_week: 'Friday', is_open: true, start_time: '09:00', end_time: '17:00', break_start_time: '12:01', break_end_time: '12:59' },
          { day_of_week: 'Saturday', is_open: true, start_time: '09:00', end_time: '17:00', break_start_time: '12:01', break_end_time: '12:59' },
          { day_of_week: 'Sunday', is_open: false, start_time: '09:00', end_time: '17:00', break_start_time: '12:01', break_end_time: '12:59' },
        ])
        .select('*');

      if (!seedError && seededData) {
        data = seededData;
      }
    }

    if (listErr && !data) {
      return error('Failed to fetch clinic schedule', 500);
    }

    // Fallback if data is still undefined (should not happen if seed works)
    if (!data) return success([]);

    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sorted = data.sort((a, b) => order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week));

    // Map snake_case to camelCase
    const mapped = sorted.map(item => ({
      id: item.id,
      day: item.day_of_week,
      isOpen: item.is_open,
      startTime: item.start_time,
      endTime: item.end_time,
      breakStartTime: item.break_start_time,
      breakEndTime: item.break_end_time,
    }));

    return success(mapped);
  } catch (err) {
    console.error('GET /api/clinic-schedule - Unexpected error:', err);
    return error('Internal server error', 500, { details: err instanceof Error ? err.message : 'Unknown error' });
  }
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

  // Validate break times if provided
  if (parsed.data.breakStartTime && parsed.data.breakEndTime && parsed.data.breakStartTime >= parsed.data.breakEndTime) {
    return error('Break end time must be after break start time');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.isOpen !== undefined) updates.is_open = parsed.data.isOpen;
  if (parsed.data.startTime !== undefined) updates.start_time = parsed.data.startTime;
  if (parsed.data.endTime !== undefined) updates.end_time = parsed.data.endTime;
  if (parsed.data.breakStartTime !== undefined) updates.break_start_time = parsed.data.breakStartTime;
  if (parsed.data.breakEndTime !== undefined) updates.break_end_time = parsed.data.breakEndTime;

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

