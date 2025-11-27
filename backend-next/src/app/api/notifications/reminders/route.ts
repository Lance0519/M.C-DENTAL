import { NextRequest } from 'next/server';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';

export async function OPTIONS() {
  return corsOptions();
}

// POST - Send appointment reminders for upcoming appointments
// This endpoint should be called by a cron job daily
// It sends reminders for appointments scheduled for tomorrow
export async function POST(req: NextRequest) {
  // Optional: Add API key authentication for cron jobs
  const apiKey = req.headers.get('x-api-key');
  const expectedKey = process.env.CRON_API_KEY;
  
  // If CRON_API_KEY is set, validate it
  if (expectedKey && apiKey !== expectedKey) {
    return error('Unauthorized', 401);
  }

  try {
    const supabase = supabaseAdmin();
    
    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    // Get all confirmed appointments for tomorrow
    const { data: appointments, error: fetchErr } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        patients!inner(full_name, user_id),
        doctors!inner(name)
      `)
      .eq('appointment_date', tomorrowStr)
      .eq('status', 'confirmed');

    if (fetchErr) {
      console.error('Error fetching appointments for reminders:', fetchErr);
      return error('Failed to fetch appointments', 500);
    }

    if (!appointments || appointments.length === 0) {
      return success({ sent: 0 }, 'No appointments to remind');
    }

    // Create reminder notifications for each patient
    const timestamp = Date.now();
    const notifications = appointments
      .filter((apt: any) => apt.patients?.user_id) // Only patients with user accounts
      .map((apt: any, index: number) => ({
        id: `notif${timestamp}_reminder_${apt.id}_${index}`,
        user_id: apt.patients.user_id,
        type: 'appointment_reminder',
        title: '📅 Appointment Reminder',
        message: `Reminder: You have an appointment tomorrow (${formatDate(apt.appointment_date)}) at ${formatTime(apt.appointment_time)} with Dr. ${apt.doctors?.name || 'your dentist'}. Please arrive 10-15 minutes early.`,
        read: false,
      }));

    if (notifications.length === 0) {
      return success({ sent: 0 }, 'No patient accounts to remind');
    }

    // Insert notifications
    const { error: insertErr } = await supabase.from('notifications').insert(notifications);

    if (insertErr) {
      console.error('Error inserting reminder notifications:', insertErr);
      return error('Failed to create reminder notifications', 500);
    }

    return success({ sent: notifications.length }, `Sent ${notifications.length} appointment reminders`);
  } catch (err) {
    console.error('Error in reminder endpoint:', err);
    return error('Internal server error', 500);
  }
}

// Helper function to format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Helper function to format time
function formatTime(timeStr: string): string {
  if (!timeStr) return 'scheduled time';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

