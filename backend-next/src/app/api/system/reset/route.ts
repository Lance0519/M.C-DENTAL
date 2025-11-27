import { NextRequest } from 'next/server';
import { authenticate } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function OPTIONS() {
  return corsOptions();
}

/**
 * DELETE /api/system/reset
 * Reset all data in the system (admin only)
 * This will delete:
 * - All appointments
 * - All appointment_services
 * - All patients (except system defaults)
 * - All medical_history
 * - All notifications
 * - All audit_logs
 */
export async function DELETE(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  // Only admins can reset data
  if (auth.role !== 'admin') {
    return error('Only administrators can reset system data', 403);
  }

  const supabase = supabaseAdmin();
  const errors: string[] = [];

  try {
    // Delete in order to respect foreign key constraints

    // 1. Delete appointment_services first (references appointments)
    const { error: aptSvcErr } = await supabase
      .from('appointment_services')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (aptSvcErr) {
      console.error('Error deleting appointment_services:', aptSvcErr);
      errors.push(`appointment_services: ${aptSvcErr.message}`);
    }

    // 2. Delete medical_history (references patients)
    const { error: medHistErr } = await supabase
      .from('medical_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (medHistErr) {
      console.error('Error deleting medical_history:', medHistErr);
      errors.push(`medical_history: ${medHistErr.message}`);
    }

    // 3. Delete appointments
    const { error: aptErr } = await supabase
      .from('appointments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (aptErr) {
      console.error('Error deleting appointments:', aptErr);
      errors.push(`appointments: ${aptErr.message}`);
    }

    // 4. Delete patients (keep system/test accounts if needed)
    const { error: patErr } = await supabase
      .from('patients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (patErr) {
      console.error('Error deleting patients:', patErr);
      errors.push(`patients: ${patErr.message}`);
    }

    // 5. Delete notifications
    const { error: notifErr } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (notifErr) {
      console.error('Error deleting notifications:', notifErr);
      errors.push(`notifications: ${notifErr.message}`);
    }

    // 6. Delete audit_logs
    const { error: auditErr } = await supabase
      .from('audit_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (auditErr) {
      console.error('Error deleting audit_logs:', auditErr);
      errors.push(`audit_logs: ${auditErr.message}`);
    }

    // Log this reset action (this will be the first entry after reset)
    await logAudit({
      action: 'DATA_EXPORT', // Using existing action type
      userId: auth.id,
      userName: auth.fullName ?? 'Admin',
      userRole: auth.role,
      details: {
        action: 'SYSTEM_RESET',
        description: 'All system data was reset',
        errors: errors.length > 0 ? errors : undefined,
      },
      ipAddress: getIpFromRequest(req.headers),
    });

    if (errors.length > 0) {
      return success({ 
        message: 'System reset completed with some errors',
        errors 
      });
    }

    return success({ message: 'System data reset successfully' });
  } catch (err) {
    console.error('System reset error:', err);
    return error('Failed to reset system data', 500);
  }
}

