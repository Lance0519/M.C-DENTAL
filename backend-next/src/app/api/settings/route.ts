import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function OPTIONS() {
  return corsOptions();
}

const updateSchema = z.object({
  key: z.string(),
  value: z.string().optional().nullable(),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = supabaseAdmin();
  const key = req.nextUrl.searchParams.get('key');
  const category = req.nextUrl.searchParams.get('category');

  if (key) {
    // Get single setting by key
    const { data, error: dbErr } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (dbErr) {
      if (dbErr.code === 'PGRST116') {
        return error('Setting not found', 404);
      }
      // If table doesn't exist, return 404 instead of 500
      if (dbErr.code === '42P01' || dbErr.message?.includes('does not exist')) {
        console.warn('site_settings table does not exist. Please run the migration.');
        return error('Setting not found', 404);
      }
      console.error('Failed to fetch setting:', dbErr);
      return error(`Failed to fetch setting: ${dbErr.message}`, 500);
    }

    return success(data);
  }

  // Get all settings or filter by category
  let query = supabase.from('site_settings').select('*');
  if (category) {
    query = query.eq('category', category);
  }
  query = query.order('key', { ascending: true });

  const { data, error: listErr } = await query;

  if (listErr) {
    console.error('Failed to fetch settings:', listErr);
    // If table doesn't exist, return empty object instead of error
    // This allows the frontend to work with defaults
    if (listErr.code === '42P01' || listErr.message?.includes('does not exist')) {
      console.warn('site_settings table does not exist. Please run the migration.');
      return success({});
    }
    return error(`Failed to fetch settings: ${listErr.message}`, 500);
  }

  // Transform to key-value object for easier access
  const settingsMap = (data ?? []).reduce((acc: Record<string, any>, setting: any) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return success(settingsMap);
}

export async function PUT(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('Invalid request data', 400, { issues: parsed.error.flatten() });
  }

  const { key, value, description } = parsed.data;
  const supabase = supabaseAdmin();

  // Check if setting exists
  const { data: existing } = await supabase
    .from('site_settings')
    .select('id, value')
    .eq('key', key)
    .single();

  const updates: Record<string, unknown> = {
    value: value ?? null,
    updated_at: new Date().toISOString(),
  };

  if (description !== undefined) {
    updates.description = description;
  }

  let result;
  if (existing) {
    // Update existing setting
    const { data, error: updateErr } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('key', key)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update setting:', updateErr);
      return error(`Failed to update setting: ${updateErr.message}`, 500);
    }

    result = data;
  } else {
    // Create new setting
    const id = `setting_${Date.now()}_${Math.floor(Math.random() * 900 + 100)}`;
    const { data, error: insertErr } = await supabase
      .from('site_settings')
      .insert({
        id,
        key,
        value: value ?? null,
        description: description ?? null,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Failed to create setting:', insertErr);
      return error(`Failed to create setting: ${insertErr.message}`, 500);
    }

    result = data;
  }

  await logAudit({
    action: 'SETTING_UPDATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { settingKey: key, oldValue: existing?.value, newValue: value },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(result, 'Setting updated successfully');
}

