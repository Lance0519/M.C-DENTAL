import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

const createSchema = z.object({
  patientId: z.string(),
  sessionId: z.string().optional(),
  sessionTitle: z.string().optional(),
  imageUrl: z.string(),
  date: z.string(),
  procedure: z.string().optional(),
  dentist: z.string().optional(),
  type: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  sessionTitle: z.string().optional(),
  sessionId: z.string().optional(),
  date: z.string().optional(),
  procedure: z.string().optional(),
  dentist: z.string().optional(),
  type: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const patientIdParam = req.nextUrl.searchParams.get('patient_id');
  const sessionId = req.nextUrl.searchParams.get('session_id');
  const patientId = auth.role === 'patient' ? auth.id : patientIdParam;

  if (!patientId && !sessionId) {
    return error('Patient ID or Session ID is required');
  }

  const supabase = supabaseAdmin();
  let query = supabase.from('session_images').select('*');

  if (patientId) query = query.eq('patient_id', patientId);
  if (sessionId) query = query.eq('session_id', sessionId);

  query = query.order('photo_date', { ascending: false }).order('uploaded_at', { ascending: false });

  const { data, error: dbErr } = await query;

  if (dbErr) {
    return error('Failed to fetch session images', 500);
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

  const { patientId, sessionId, sessionTitle, imageUrl, date, procedure, dentist, type, label, description } =
    parsed.data;

  const id = `img${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const supabase = supabaseAdmin();
  const { error: insertErr } = await supabase.from('session_images').insert({
    id,
    patient_id: patientId,
    session_id: sessionId ?? null,
    session_title: sessionTitle ?? null,
    image_url: imageUrl,
    photo_date: date,
    procedure: procedure ?? null,
    dentist: dentist ?? null,
    photo_type: type ?? null,
    label: label ?? null,
    description: description ?? null,
  });

  if (insertErr) {
    return error('Failed to upload session image', 500);
  }

  return success({ id }, 'Session image uploaded successfully');
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
    return error('Image ID is required');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.sessionTitle !== undefined) updates.session_title = parsed.data.sessionTitle;
  if (parsed.data.sessionId !== undefined) updates.session_id = parsed.data.sessionId;
  if (parsed.data.date !== undefined) updates.photo_date = parsed.data.date;
  if (parsed.data.procedure !== undefined) updates.procedure = parsed.data.procedure;
  if (parsed.data.dentist !== undefined) updates.dentist = parsed.data.dentist;
  if (parsed.data.type !== undefined) updates.photo_type = parsed.data.type;
  if (parsed.data.label !== undefined) updates.label = parsed.data.label;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  const supabase = supabaseAdmin();
  const { error: updateErr } = await supabase.from('session_images').update(updates).eq('id', id);

  if (updateErr) {
    return error('Failed to update session image', 500);
  }

  return success(null, 'Session image updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Image ID is required');
  }

  const supabase = supabaseAdmin();
  const { error: deleteErr } = await supabase.from('session_images').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete session image', 500);
  }

  return success(null, 'Session image deleted successfully');
}

