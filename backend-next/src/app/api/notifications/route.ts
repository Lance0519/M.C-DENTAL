import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

const createSchema = z.object({
  userId: z.string(),
  type: z.enum([
    'info', 'warning', 'error', 'success',
    'cancellation_request', 'reschedule_request',
    'appointment_confirmed', 'appointment_completed',
    'medical_history_uploaded', 'appointment_rescheduled',
    'cancellation_approved', 'reschedule_approved',
    'cancellation_rejected', 'reschedule_rejected',
    'new_appointment',
    // New notification types for patients
    'appointment_reminder',
    'new_promotion',
    'patient_document_uploaded'
  ]),
  title: z.string(),
  message: z.string(),
});

export async function GET(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const supabase = supabaseAdmin();
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';

  // Users can only see their own notifications
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', auth.id)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error: dbErr } = await query.limit(50);

  if (dbErr) {
    console.error('Notifications fetch error:', dbErr);
    return error('Failed to fetch notifications', 500);
  }

  return success(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  // Only admin and staff can create notifications for others
  if (auth.role === 'patient') {
    return error('Patients cannot create notifications', 403);
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { userId, type, title, message } = parsed.data;
  const id = `notif${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const supabase = supabaseAdmin();
  const { error: insertErr } = await supabase.from('notifications').insert({
    id,
    user_id: userId,
    type,
    title,
    message,
    read: false,
  });

  if (insertErr) {
    console.error('Notification create error:', insertErr);
    return error('Failed to create notification', 500);
  }

  return success({ id }, 'Notification created successfully');
}

// Mark notifications as read
export async function PUT(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const notificationId = req.nextUrl.searchParams.get('id');
  const markAllRead = req.nextUrl.searchParams.get('mark_all_read') === 'true';

  const supabase = supabaseAdmin();

  if (markAllRead) {
    // Mark all notifications as read for this user
    const { error: updateErr } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', auth.id)
      .eq('read', false);

    if (updateErr) {
      console.error('Notifications mark all read error:', updateErr);
      return error('Failed to mark notifications as read', 500);
    }

    return success(null, 'All notifications marked as read');
  }

  if (!notificationId) {
    return error('Notification ID is required');
  }

  // Verify the notification belongs to the current user
  const { data: notification, error: fetchErr } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', notificationId)
    .single();

  if (fetchErr) {
    if (fetchErr.code === 'PGRST116') {
      return error('Notification not found', 404);
    }
    return error('Failed to fetch notification', 500);
  }

  if (notification.user_id !== auth.id) {
    return error('You can only update your own notifications', 403);
  }

  const { error: updateErr } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (updateErr) {
    console.error('Notification update error:', updateErr);
    return error('Failed to update notification', 500);
  }

  return success(null, 'Notification marked as read');
}

export async function DELETE(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const notificationId = req.nextUrl.searchParams.get('id');
  const deleteAllRead = req.nextUrl.searchParams.get('delete_all_read') === 'true';

  const supabase = supabaseAdmin();

  // Delete all read notifications for this user
  if (deleteAllRead) {
    const { error: deleteErr, count } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', auth.id)
      .eq('read', true);

    if (deleteErr) {
      console.error('Delete all read notifications error:', deleteErr);
      return error('Failed to delete read notifications', 500);
    }

    return success({ deleted: count ?? 0 }, 'All read notifications deleted successfully');
  }

  if (!notificationId) {
    return error('Notification ID is required');
  }

  // Verify the notification belongs to the current user
  const { data: notification, error: fetchErr } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', notificationId)
    .single();

  if (fetchErr) {
    if (fetchErr.code === 'PGRST116') {
      return error('Notification not found', 404);
    }
    return error('Failed to fetch notification', 500);
  }

  if (notification.user_id !== auth.id && auth.role !== 'admin') {
    return error('You can only delete your own notifications', 403);
  }

  const { error: deleteErr } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (deleteErr) {
    console.error('Notification delete error:', deleteErr);
    return error('Failed to delete notification', 500);
  }

  return success(null, 'Notification deleted successfully');
}

