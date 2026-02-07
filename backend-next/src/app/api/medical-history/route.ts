import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

const createSchema = z.object({
  patientId: z.string(),
  serviceId: z.string().optional(),
  doctorId: z.string().optional(),
  serviceName: z.string().optional(),
  doctorName: z.string().optional(),
  date: z.string(),
  time: z.string(),
  treatment: z.string(),
  remarks: z.string().optional(),
  images: z.array(z.string()).optional(), // Array of base64 image URLs
});

const updateSchema = z.object({
  id: z.string().optional(),
  treatment: z.string().optional(),
  remarks: z.string().optional(),
  images: z.array(z.string()).optional(), // Array of base64 image URLs
});

export async function GET(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const patientIdParam = req.nextUrl.searchParams.get('patient_id');
  const patientId = auth.role === 'patient' ? auth.id : patientIdParam;

  if (!patientId) {
    return error('Patient ID is required');
  }

  const supabase = supabaseAdmin();
  const { data, error: dbErr } = await supabase
    .from('medical_history')
    .select('*')
    .eq('patient_id', patientId)
    // FIX 1: Sort by 'created_at' because 'record_date' does not exist yet
    .order('created_at', { ascending: false });

  if (dbErr) {
    console.error('Medical history fetch error:', dbErr);
    return error('Failed to fetch medical history', 500);
  }

  // Transform database columns to frontend format
  const transformed = (data ?? []).map((record: any) => ({
    id: record.id,
    patientId: record.patient_id,
    serviceId: record.service_id,
    doctorId: record.doctor_id,
    serviceName: record.service_name,
    doctorName: record.doctor_name,

    // FIX 2: Use created_at as fallback so the frontend has a valid date
    date: record.record_date || (record.created_at ? record.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    time: record.record_time || (record.created_at ? record.created_at.split('T')[1]?.substring(0, 5) : '00:00'),

    treatment: record.treatment,
    remarks: record.remarks,
    images: record.images ?? [], // Return images array
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }));

  return success(transformed);
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { patientId, serviceId, doctorId, serviceName, doctorName, date, time, treatment, remarks, images } = parsed.data;
  const id = `med${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const supabase = supabaseAdmin();
  const { error: insertErr } = await supabase.from('medical_history').insert({
    id,
    patient_id: patientId,
    // service_id: serviceId ?? null, // Column does not exist
    // doctor_id: doctorId ?? null, // Column does not exist
    // service_name: serviceName ?? null, // Column does not exist
    // doctor_name: doctorName ?? null, // Column does not exist

    // FIX 3: Mapped columns to correct names
    visit_date: date,
    // record_time: time, // Column does not exist

    treatment,
    notes: remarks ?? null, // Map remarks to notes
    images: images ?? null, // Store images as JSON array if column exists (migration added it)
  });

  if (insertErr) {
    console.error('Medical history insert error:', insertErr);
    return error('Failed to create medical history record', 500);
  }

  return success({ id }, 'Medical history record created successfully');
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
    return error('Record ID is required');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.treatment !== undefined) updates.treatment = parsed.data.treatment;
  if (parsed.data.remarks !== undefined) updates.remarks = parsed.data.remarks;
  if (parsed.data.images !== undefined) updates.images = parsed.data.images;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();
  const { error: updateErr } = await supabase.from('medical_history').update(updates).eq('id', id);

  if (updateErr) {
    console.error('Medical history update error:', updateErr);
    return error('Failed to update medical history record', 500);
  }

  return success(null, 'Medical history record updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Record ID is required');
  }

  const supabase = supabaseAdmin();
  const { error: deleteErr } = await supabase.from('medical_history').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete medical history record', 500);
  }

  return success(null, 'Medical history record deleted successfully');
}