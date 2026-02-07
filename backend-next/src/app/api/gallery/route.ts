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
  title: z.string(),
  description: z.string().optional(),
  treatment: z.string(),
  beforeImageUrl: z.string(),
  afterImageUrl: z.string(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  treatment: z.string().optional(),
  beforeImageUrl: z.string().optional(),
  afterImageUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = supabaseAdmin();
  const id = req.nextUrl.searchParams.get('id');
  const treatment = req.nextUrl.searchParams.get('treatment');

  if (id) {
    const { data, error: dbErr } = await supabase.from('gallery_cases').select('*').eq('id', id).single();

    if (dbErr) {
      if (dbErr.code === 'PGRST116') {
        return error('Gallery case not found', 404);
      }
      return error('Failed to fetch gallery case', 500);
    }

    return success(data);
  }

  let query = supabase.from('gallery_cases').select('*').order('created_at', { ascending: false });

  if (treatment) {
    query = query.eq('treatment', treatment);
  }

  const { data, error: listErr } = await query;

  if (listErr) {
    // If table doesn't exist, return empty array
    if (listErr.code === '42P01') {
      return success([]);
    }
    return error('Failed to fetch gallery cases', 500);
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

  const { title, description, treatment, beforeImageUrl, afterImageUrl } = parsed.data;
  const supabase = supabaseAdmin();
  const id = `gallery${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const { error: insertErr } = await supabase.from('gallery_cases').insert({
    id,
    title,
    description: description ?? null,
    treatment,
    before_image_url: beforeImageUrl,
    after_image_url: afterImageUrl,
  });

  if (insertErr) {
    console.error('Gallery insert error:', insertErr);
    return error('Failed to create gallery case', 500);
  }

  await logAudit({
    action: 'GALLERY_CASE_CREATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { caseId: id, title, treatment },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success({ id }, 'Gallery case created successfully');
}

export async function PUT(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('Invalid request data', 400, { issues: parsed.error.flatten() });
  }

  const id = req.nextUrl.searchParams.get('id') ?? parsed.data.id;
  if (!id) {
    return error('Gallery case ID is required');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.treatment !== undefined) updates.treatment = parsed.data.treatment;
  if (parsed.data.beforeImageUrl !== undefined) updates.before_image_url = parsed.data.beforeImageUrl;
  if (parsed.data.afterImageUrl !== undefined) updates.after_image_url = parsed.data.afterImageUrl;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();

  // Fetch existing case for audit log
  const { data: existingCase } = await supabase
    .from('gallery_cases')
    .select('title')
    .eq('id', id)
    .single();

  const { error: updateErr } = await supabase.from('gallery_cases').update(updates).eq('id', id);

  if (updateErr) {
    return error('Failed to update gallery case', 500);
  }

  await logAudit({
    action: 'GALLERY_CASE_UPDATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: {
      caseId: id,
      caseTitle: existingCase?.title ?? parsed.data.title ?? 'Unknown',
      updatedFields: Object.keys(updates).filter(k => k !== 'updated_at'),
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Gallery case updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Gallery case ID is required');
  }

  const supabase = supabaseAdmin();

  // Fetch case title before deletion for audit
  const { data: caseToDelete } = await supabase
    .from('gallery_cases')
    .select('title')
    .eq('id', id)
    .single();

  const { error: deleteErr } = await supabase.from('gallery_cases').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete gallery case', 500);
  }

  await logAudit({
    action: 'GALLERY_CASE_DELETED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: {
      caseId: id,
      caseTitle: caseToDelete?.title ?? 'Unknown',
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Gallery case deleted successfully');
}

