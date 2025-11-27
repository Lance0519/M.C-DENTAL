import { NextRequest } from 'next/server';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

// POST - Create notification for all admins when audit logs are exported
export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { exportedCount, exportedBy } = body;

    const supabase = supabaseAdmin();

    // Get all admin users
    const { data: admins, error: fetchErr } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (fetchErr) {
      console.error('Error fetching admins for export notification:', fetchErr);
      return error('Failed to fetch admin users', 500);
    }

    if (!admins || admins.length === 0) {
      return success({ notified: 0 }, 'No admins to notify');
    }

    const timestamp = Date.now();
    const exportDate = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const notifications = admins.map((admin, index) => ({
      id: `notif${timestamp}_export_${admin.id}_${index}`,
      user_id: admin.id,
      type: 'info',
      title: '📊 Audit Logs Exported',
      message: `${exportedBy || 'An admin'} exported ${exportedCount || 'audit'} log entries on ${exportDate}.`,
      read: false,
    }));

    const { error: insertErr } = await supabase.from('notifications').insert(notifications);

    if (insertErr) {
      console.error('Error creating export notifications:', insertErr);
      return error('Failed to create export notifications', 500);
    }

    return success({ notified: notifications.length }, 'Export notifications created');
  } catch (err) {
    console.error('Error in export notification:', err);
    return error('Internal server error', 500);
  }
}

