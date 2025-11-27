import { supabaseAdmin } from './supabase';

export type AuditAction =
  // Authentication
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'PASSWORD_CHANGE'
  // Appointments
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_CONFIRMED'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLATION_APPROVED'
  | 'CANCELLATION_REJECTED'
  | 'RESCHEDULE_REQUESTED'
  | 'RESCHEDULE_APPROVED'
  | 'RESCHEDULE_REJECTED'
  // Patients
  | 'PATIENT_CREATED'
  | 'PATIENT_UPDATED'
  | 'PATIENT_DELETED'
  | 'MEDICAL_HISTORY_UPLOADED'
  // Patient Images
  | 'PATIENT_IMAGE_UPLOADED'
  | 'PATIENT_IMAGE_UPDATED'
  | 'PATIENT_IMAGE_DELETED'
  // Staff
  | 'STAFF_CREATED'
  | 'STAFF_UPDATED'
  | 'STAFF_DELETED'
  // Doctors
  | 'DOCTOR_CREATED'
  | 'DOCTOR_UPDATED'
  | 'DOCTOR_DELETED'
  // Services
  | 'SERVICE_CREATED'
  | 'SERVICE_UPDATED'
  | 'SERVICE_DELETED'
  // Schedules
  | 'SCHEDULE_CREATED'
  | 'SCHEDULE_UPDATED'
  | 'SCHEDULE_DELETED'
  // Clinic Hours
  | 'CLINIC_HOURS_UPDATED'
  // Promotions
  | 'PROMOTION_CREATED'
  | 'PROMOTION_UPDATED'
  | 'PROMOTION_DELETED'
  // System
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'AUDIT_LOGS_CLEARED';

export interface AuditLogParams {
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log an action to the audit log
 */
export async function logAudit(params: AuditLogParams): Promise<boolean> {
  const { action, userId, userName, userRole, details, ipAddress } = params;
  
  const supabase = supabaseAdmin();
  const id = `audit${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const { error: insertErr } = await supabase.from('audit_logs').insert({
    id,
    action,
    details: details ?? {},
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    ip_address: ipAddress ?? 'N/A',
  });

  if (insertErr) {
    console.error('Audit log error:', insertErr);
    return false;
  }

  return true;
}

/**
 * Helper to extract IP from request headers
 */
export function getIpFromRequest(headers: Headers): string {
  return headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'N/A';
}

