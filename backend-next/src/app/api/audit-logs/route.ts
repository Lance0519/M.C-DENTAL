import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

const createSchema = z.object({
  action: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userRole: z.string().optional(),
});

export async function GET(req: NextRequest) {
  // Only admins can view audit logs
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const supabase = supabaseAdmin();
  
  // Get query parameters for filtering
  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');
  const action = req.nextUrl.searchParams.get('action');
  const userId = req.nextUrl.searchParams.get('userId');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '1000');

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }
  if (action) {
    query = query.eq('action', action);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error: dbErr } = await query;

  if (dbErr) {
    console.error('Audit logs fetch error:', dbErr);
    return error('Failed to fetch audit logs', 500);
  }

  // Normalize the data to match frontend expectations
  const normalizedLogs = (data ?? []).map((log: any) => ({
    id: log.id,
    action: log.action,
    details: log.details ?? {},
    userId: log.user_id,
    userName: log.user_name,
    userRole: log.user_role,
    timestamp: log.created_at,
    ipAddress: log.ip_address,
  }));

  return success(normalizedLogs);
}

export async function POST(req: NextRequest) {
  // Admins and staff can create audit logs
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { action, details, userId, userName, userRole } = parsed.data;
  const id = `audit${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const supabase = supabaseAdmin();
  const { error: insertErr } = await supabase.from('audit_logs').insert({
    id,
    action,
    details: details ?? {},
    user_id: userId ?? auth.id,
    user_name: userName ?? auth.fullName ?? 'Unknown',
    user_role: userRole ?? auth.role,
    ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'N/A',
  });

  if (insertErr) {
    console.error('Audit log create error:', insertErr);
    return error('Failed to create audit log', 500);
  }

  return success({ id }, 'Audit log created successfully');
}

export async function DELETE(req: NextRequest) {
  // Only admins can delete audit logs
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const deleteAll = req.nextUrl.searchParams.get('all') === 'true';
  const olderThan = req.nextUrl.searchParams.get('olderThan'); // ISO date string

  const supabase = supabaseAdmin();

  if (deleteAll) {
    // Delete all audit logs (for reset)
    const { error: deleteErr } = await supabase
      .from('audit_logs')
      .delete()
      .neq('id', ''); // Delete all

    if (deleteErr) {
      console.error('Audit logs delete error:', deleteErr);
      return error('Failed to delete audit logs', 500);
    }

    return success(null, 'All audit logs deleted');
  }

  if (olderThan) {
    // Delete logs older than specified date
    const { error: deleteErr } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', olderThan);

    if (deleteErr) {
      console.error('Old audit logs delete error:', deleteErr);
      return error('Failed to delete old audit logs', 500);
    }

    return success(null, 'Old audit logs deleted');
  }

  return error('Specify either all=true or olderThan parameter');
}

