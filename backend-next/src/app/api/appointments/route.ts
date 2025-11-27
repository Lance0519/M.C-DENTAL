import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest, AuditAction } from '@/lib/audit';

// Helper function to create a notification
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string
) {
  try {
    const supabase = supabaseAdmin();
    const id = `notif${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
    
    const { error: insertErr } = await supabase.from('notifications').insert({
      id,
      user_id: userId,
      type,
      title,
      message,
      read: false,
    });

    if (insertErr) {
      console.error('Error creating notification:', insertErr);
    } else {
      console.log(`Notification created for user ${userId}: ${title}`);
    }
  } catch (err) {
    console.error('Error in createNotification:', err);
  }
}

// Helper function to notify all staff members (excludes admin)
async function notifyAllStaff(type: string, title: string, message: string) {
  try {
    const supabase = supabaseAdmin();
    // Only notify staff, NOT admin (admin doesn't need patient-related notifications)
    const { data: staffUsers, error: fetchErr } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'staff');

    if (fetchErr || !staffUsers || staffUsers.length === 0) {
      console.log('No staff users found to notify');
      return;
    }

    const timestamp = Date.now();
    const notifications = staffUsers.map((user, index) => ({
      id: `notif${timestamp}_${user.id}_${index}`,
      user_id: user.id,
      type,
      title,
      message,
      read: false,
    }));

    const { error: insertErr } = await supabase.from('notifications').insert(notifications);
    if (insertErr) {
      console.error('Error creating staff notifications:', insertErr);
    } else {
      console.log(`Created ${notifications.length} notifications for staff`);
    }
  } catch (err) {
    console.error('Error in notifyAllStaff:', err);
  }
}

export async function OPTIONS() {
  return corsOptions();
}

const appointmentServicesSchema = z
  .array(
    z.object({
      serviceId: z.string(),
      serviceName: z.string().optional(),
      price: z.string().optional(),
    }),
  )
  .optional();

const createSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  serviceId: z.string().optional(),
  services: appointmentServicesSchema,
  date: z.string(),
  time: z.string(),
  notes: z.string().optional(),
  status: z
    .enum(['pending', 'confirmed', 'completed', 'cancelled', 'cancellation_requested'])
    .optional(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  status: z
    .enum(['pending', 'confirmed', 'completed', 'cancelled', 'cancellation_requested'])
    .optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  notes: z.string().optional(),
  doctorId: z.string().optional(),
  treatment: z.string().optional(),
  remarks: z.string().optional(),
  rescheduleRequested: z.boolean().optional(),
  rescheduleRequestedDate: z.string().nullable().optional(),
  rescheduleRequestedTime: z.string().nullable().optional(),
  services: appointmentServicesSchema,
  paymentAmount: z.number().optional(),
  completedAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = supabaseAdmin();
  const patientId = req.nextUrl.searchParams.get('patient_id');
  const doctorId = req.nextUrl.searchParams.get('doctor_id');
  const status = req.nextUrl.searchParams.get('status');
  const date = req.nextUrl.searchParams.get('date');
  const publicOnly = req.nextUrl.searchParams.get('public') === 'true';

  // Try to authenticate, but don't fail if not authenticated
  const auth = authenticate(req);
  const isAuthenticated = !(auth instanceof Response);

  // If public parameter is set, return only date/time/doctor/service for availability checking
  // This allows guest booking to work while protecting sensitive data
  if (publicOnly || !isAuthenticated) {
    // First get appointments
    let query = supabase
      .from('appointments')
      .select('id, doctor_id, appointment_date, appointment_time, status, service_id')
      .neq('status', 'cancelled'); // Only show non-cancelled for availability

    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (date) query = query.eq('appointment_date', date);

    query = query.order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });

    const { data: appointments, error: dbErr } = await query;

    if (dbErr) {
      console.error('Public appointments fetch error:', dbErr);
      return error('Failed to fetch appointments', 500);
    }

    // Get service names for the appointments
    if (appointments && appointments.length > 0) {
      const serviceIds = [...new Set(appointments.map(a => a.service_id).filter(Boolean))];
      if (serviceIds.length > 0) {
        const { data: services } = await supabase
          .from('services')
          .select('id, name')
          .in('id', serviceIds);
        
        const serviceMap = new Map(services?.map(s => [s.id, s.name]) ?? []);
        
        // Add service_name to each appointment
        const enrichedAppointments = appointments.map(apt => ({
          ...apt,
          service_name: serviceMap.get(apt.service_id) || null
        }));
        
        return success(enrichedAppointments);
      }
    }

    return success(appointments ?? []);
  }

  // Full data for authenticated users
  let query = supabase.from('appointments').select('*, appointment_services(*)');

  if (auth.role === 'patient') {
    query = query.eq('patient_id', auth.id);
  } else if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  if (doctorId) query = query.eq('doctor_id', doctorId);
  if (status) query = query.eq('status', status);
  if (date) query = query.eq('appointment_date', date);

  query = query.order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });

  const { data: appointments, error: dbErr } = await query;

  if (dbErr) {
    console.error('Appointments fetch error:', dbErr);
    return error('Failed to fetch appointments', 500);
  }

  // Enrich appointments with service names from services table
  if (appointments && appointments.length > 0) {
    const serviceIds = [...new Set(appointments.map(a => a.service_id).filter(Boolean))];
    if (serviceIds.length > 0) {
      const { data: services } = await supabase
        .from('services')
        .select('id, name')
        .in('id', serviceIds);
      
      const serviceMap = new Map(services?.map(s => [s.id, s.name]) ?? []);
      
      // Add service_name to each appointment
      const enrichedAppointments = appointments.map(apt => ({
        ...apt,
        service_name: apt.service_name || serviceMap.get(apt.service_id) || 
          apt.appointment_services?.[0]?.service_name || null
      }));
      
      return success(enrichedAppointments);
    }
  }

  return success(appointments ?? []);
}

export async function POST(req: NextRequest) {
  // Allow guest booking - authentication is optional for creating appointments
  const auth = authenticate(req);
  const isAuthenticated = !(auth instanceof Response);

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const {
    patientId,
    doctorId,
    serviceId,
    services,
    date,
    time,
    notes,
    status = 'pending',
  } = parsed.data;
  const supabase = supabaseAdmin();

  const { data: conflicts, error: conflictErr } = await supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .eq('appointment_time', time)
    .neq('status', 'cancelled');

  if (conflictErr) {
    return error('Failed to check conflicting appointments', 500);
  }

  if ((conflicts ?? []).length > 0) {
    return error('This time slot is already booked for the selected doctor');
  }

  const id = `apt${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const primaryServiceId =
    serviceId ??
    services?.[0]?.serviceId ??
    (() => {
      throw new Error('A serviceId or services array is required');
    })();

  // For guest bookings, use patientId as created_by (it will be the guest appointment ID)
  const createdBy = isAuthenticated ? auth.id : patientId;

  const { error: insertErr } = await supabase.from('appointments').insert({
    id,
    patient_id: patientId,
    doctor_id: doctorId,
    service_id: primaryServiceId,
    appointment_date: date,
    appointment_time: time,
    status,
    notes: notes ?? null,
    created_by: createdBy,
    reschedule_requested: false,
  });

  if (insertErr) {
    console.error('Appointment insert error:', insertErr);
    return error(`Failed to create appointment: ${insertErr.message}`, 500);
  }

  if (services && services.length > 0) {
    const rows = services.map((svc) => ({
      appointment_id: id,
      service_id: svc.serviceId,
      service_name: svc.serviceName ?? null,
      price: svc.price ?? null,
    }));
    const { error: svcErr } = await supabase.from('appointment_services').insert(rows);
    if (svcErr) {
      console.error('Failed to insert appointment services', svcErr);
    }
  }

  // Fetch patient and doctor names for better audit logging
  const [{ data: patient }, { data: doctor }] = await Promise.all([
    supabase.from('patients').select('full_name').eq('id', patientId).single(),
    supabase.from('doctors').select('name').eq('id', doctorId).single(),
  ]);

  // Log audit - handle guest bookings
  const isGuestBooking = patientId.startsWith('guest_appointment');
  const patientDisplayName = patient?.full_name ?? 'Guest Patient';
  const doctorDisplayName = doctor?.name ?? 'Unknown Doctor';
  const serviceNames = services?.map(s => s.serviceName).join(', ') || 'dental service';
  
  await logAudit({
    action: 'APPOINTMENT_CREATED',
    userId: isAuthenticated ? auth.id : patientId,
    userName: isAuthenticated ? (auth.fullName ?? 'Unknown') : patientDisplayName,
    userRole: isAuthenticated ? auth.role : 'guest',
    details: {
      appointmentId: id,
      patientName: patientDisplayName,
      doctorName: doctorDisplayName,
      date,
      time,
      services: serviceNames,
      bookingType: isGuestBooking ? 'Guest Booking' : 'Regular Booking',
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  // Notify staff about new appointment
  await notifyAllStaff(
    'new_appointment',
    'New Appointment Booked',
    `${patientDisplayName} has booked an appointment for ${serviceNames} on ${date} at ${time} with ${doctorDisplayName}.`
  );

  return success({ id }, 'Appointment created successfully');
}

export async function PUT(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('No fields to update', 400, { issues: parsed.error.flatten() });
  }

  const id = req.nextUrl.searchParams.get('id') ?? parsed.data.id;
  if (!id) {
    return error('Appointment ID is required');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.date !== undefined) updates.appointment_date = parsed.data.date;
  if (parsed.data.time !== undefined) updates.appointment_time = parsed.data.time;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.doctorId !== undefined) updates.doctor_id = parsed.data.doctorId;
  if (parsed.data.treatment !== undefined) updates.treatment = parsed.data.treatment;
  if (parsed.data.remarks !== undefined) updates.remarks = parsed.data.remarks;
  if (parsed.data.rescheduleRequested !== undefined)
    updates.reschedule_requested = parsed.data.rescheduleRequested;
  if (parsed.data.rescheduleRequestedDate !== undefined)
    updates.reschedule_requested_date = parsed.data.rescheduleRequestedDate;
  if (parsed.data.rescheduleRequestedTime !== undefined)
    updates.reschedule_requested_time = parsed.data.rescheduleRequestedTime;
  if (parsed.data.paymentAmount !== undefined)
    updates.payment_amount = parsed.data.paymentAmount;
  if (parsed.data.completedAt !== undefined)
    updates.completed_at = parsed.data.completedAt;
  if (parsed.data.services && parsed.data.services.length > 0) {
    updates.service_id = parsed.data.services[0].serviceId;
  }

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();
  
  // Fetch current appointment state BEFORE update (for notification logic)
  const { data: currentAppointment } = await supabase
    .from('appointments')
    .select('status, patient_id, doctor_id, appointment_date, appointment_time, reschedule_requested')
    .eq('id', id)
    .single();

  const oldStatus = currentAppointment?.status;
  const wasRescheduleRequested = currentAppointment?.reschedule_requested;
  
  const { error: updateErr } = await supabase.from('appointments').update(updates).eq('id', id);

  if (updateErr) {
    console.error('Appointment update error:', updateErr);
    return error('Failed to update appointment', 500);
  }

  if (parsed.data.services) {
    const { error: deleteErr } = await supabase
      .from('appointment_services')
      .delete()
      .eq('appointment_id', id);

    if (deleteErr) {
      console.error('Failed to clear appointment services', deleteErr);
    }

    if (parsed.data.services.length > 0) {
      const rows = parsed.data.services.map((svc) => ({
        appointment_id: id,
        service_id: svc.serviceId,
        service_name: svc.serviceName ?? null,
        price: svc.price ?? null,
      }));
      const { error: svcErr } = await supabase.from('appointment_services').insert(rows);
      if (svcErr) {
        console.error('Failed to insert appointment services', svcErr);
      }
    }
  }

  // Fetch appointment details for better audit logging
  const { data: appointmentDetails } = await supabase
    .from('appointments')
    .select('patient_id, doctor_id, appointment_date, appointment_time')
    .eq('id', id)
    .single();

  let patientName = 'Unknown Patient';
  let doctorName = 'Unknown Doctor';
  
  if (appointmentDetails) {
    const [{ data: patient }, { data: doctor }] = await Promise.all([
      supabase.from('patients').select('full_name').eq('id', appointmentDetails.patient_id).single(),
      supabase.from('doctors').select('name').eq('id', appointmentDetails.doctor_id).single(),
    ]);
    patientName = patient?.full_name ?? 'Unknown Patient';
    doctorName = doctor?.name ?? 'Unknown Doctor';
  }

  // Determine the audit action based on status change
  let auditAction: AuditAction = 'APPOINTMENT_UPDATED';
  let actionDescription = 'Updated appointment';
  
  if (parsed.data.status === 'cancelled') {
    auditAction = 'APPOINTMENT_CANCELLED';
    actionDescription = 'Cancelled appointment';
  } else if (parsed.data.status === 'completed') {
    auditAction = 'APPOINTMENT_COMPLETED';
    actionDescription = 'Marked appointment as completed';
  } else if (parsed.data.status === 'confirmed') {
    auditAction = 'APPOINTMENT_CONFIRMED';
    actionDescription = 'Confirmed appointment';
  } else if (parsed.data.status === 'cancellation_requested') {
    auditAction = 'CANCELLATION_REQUESTED';
    actionDescription = 'Requested cancellation';
  } else if (parsed.data.rescheduleRequested) {
    auditAction = 'RESCHEDULE_REQUESTED';
    actionDescription = `Requested reschedule to ${parsed.data.rescheduleRequestedDate} at ${parsed.data.rescheduleRequestedTime}`;
  }

  await logAudit({
    action: auditAction,
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: {
      appointmentId: id,
      patientName,
      doctorName,
      date: appointmentDetails?.appointment_date ?? 'N/A',
      time: appointmentDetails?.appointment_time ?? 'N/A',
      action: actionDescription,
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  // ========== NOTIFICATION LOGIC ==========
  const appointmentDate = appointmentDetails?.appointment_date ?? 'N/A';
  const appointmentTime = appointmentDetails?.appointment_time ?? 'N/A';
  const patientId = appointmentDetails?.patient_id;
  const newStatus = parsed.data.status;

  // 1. Notify PATIENT when appointment is CONFIRMED
  if (newStatus === 'confirmed' && oldStatus !== 'confirmed' && patientId) {
    await createNotification(
      patientId,
      'appointment_confirmed',
      'Appointment Confirmed',
      `Your appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime} has been confirmed.`
    );
  }

  // 2. Notify STAFF when patient requests CANCELLATION
  if (newStatus === 'cancellation_requested' && oldStatus !== 'cancellation_requested') {
    await notifyAllStaff(
      'cancellation_request',
      'Cancellation Request',
      `${patientName} has requested to cancel their appointment on ${appointmentDate} at ${appointmentTime}.`
    );
  }

  // 3. Notify PATIENT when cancellation is APPROVED (status changes from cancellation_requested to cancelled)
  if (newStatus === 'cancelled' && oldStatus === 'cancellation_requested' && patientId) {
    await createNotification(
      patientId,
      'cancellation_approved',
      'Cancellation Approved',
      `Your cancellation request for the appointment on ${appointmentDate} at ${appointmentTime} has been approved.`
    );
  }

  // 4. Notify PATIENT when cancellation is REJECTED (status changes from cancellation_requested to something else, not cancelled)
  if (oldStatus === 'cancellation_requested' && newStatus && newStatus !== 'cancelled' && newStatus !== 'cancellation_requested' && patientId) {
    await createNotification(
      patientId,
      'cancellation_rejected',
      'Cancellation Request Rejected',
      `Your cancellation request for the appointment on ${appointmentDate} at ${appointmentTime} has been rejected. Your appointment remains scheduled.`
    );
  }

  // 5. Notify STAFF when patient requests RESCHEDULE
  if (parsed.data.rescheduleRequested && !wasRescheduleRequested) {
    const newDate = parsed.data.rescheduleRequestedDate ?? 'new date';
    const newTime = parsed.data.rescheduleRequestedTime ?? 'new time';
    await notifyAllStaff(
      'reschedule_request',
      'Reschedule Request',
      `${patientName} has requested to reschedule their appointment from ${appointmentDate} ${appointmentTime} to ${newDate} ${newTime}.`
    );
  }

  // 6. Notify PATIENT when reschedule is APPROVED (date/time changed while reschedule was requested)
  if (wasRescheduleRequested && (parsed.data.date || parsed.data.time) && patientId) {
    const newDate = parsed.data.date ?? appointmentDate;
    const newTime = parsed.data.time ?? appointmentTime;
    await createNotification(
      patientId,
      'reschedule_approved',
      'Reschedule Approved',
      `Your reschedule request has been approved. Your appointment has been rescheduled to ${newDate} at ${newTime}.`
    );
  }

  // 7. Notify PATIENT when reschedule is REJECTED (rescheduleRequested set to false without date/time change)
  if (wasRescheduleRequested && parsed.data.rescheduleRequested === false && !parsed.data.date && !parsed.data.time && patientId) {
    await createNotification(
      patientId,
      'reschedule_rejected',
      'Reschedule Request Rejected',
      `Your reschedule request has been rejected. Your appointment remains scheduled for ${appointmentDate} at ${appointmentTime}.`
    );
  }

  // 8. Notify PATIENT when appointment is RESCHEDULED by staff (date/time changed without reschedule request)
  if (!wasRescheduleRequested && (parsed.data.date || parsed.data.time) && oldStatus !== 'cancelled' && newStatus !== 'cancelled' && patientId) {
    const newDate = parsed.data.date ?? appointmentDate;
    const newTime = parsed.data.time ?? appointmentTime;
    // Only notify if date or time actually changed
    if (newDate !== appointmentDate || newTime !== appointmentTime) {
      await createNotification(
        patientId,
        'appointment_rescheduled',
        'Appointment Rescheduled',
        `Your appointment has been rescheduled from ${appointmentDate} at ${appointmentTime} to ${newDate} at ${newTime}.`
      );
    }
  }

  return success(null, 'Appointment updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = authenticate(req);
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Appointment ID is required');
  }

  if (auth.role === 'patient') {
    const supabase = supabaseAdmin();
    const { data: appointment, error: fetchErr } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') {
        return error('Appointment not found', 404);
      }
      return error('Failed to fetch appointment', 500);
    }

    if (appointment?.patient_id !== auth.id) {
      return error('You can only delete your own appointments', 403);
    }
  }

  const supabase = supabaseAdmin();
  
  // Fetch appointment details before deletion for audit logging
  const { data: appointmentDetails } = await supabase
    .from('appointments')
    .select('patient_id, doctor_id, appointment_date, appointment_time')
    .eq('id', id)
    .single();

  let patientName = 'Unknown Patient';
  let doctorName = 'Unknown Doctor';
  
  if (appointmentDetails) {
    const [{ data: patient }, { data: doctor }] = await Promise.all([
      supabase.from('patients').select('full_name').eq('id', appointmentDetails.patient_id).single(),
      supabase.from('doctors').select('name').eq('id', appointmentDetails.doctor_id).single(),
    ]);
    patientName = patient?.full_name ?? 'Unknown Patient';
    doctorName = doctor?.name ?? 'Unknown Doctor';
  }
  
  const { error: deleteErr } = await supabase.from('appointments').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete appointment', 500);
  }

  // Log audit
  await logAudit({
    action: 'APPOINTMENT_CANCELLED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      appointmentId: id, 
      patientName,
      doctorName,
      date: appointmentDetails?.appointment_date ?? 'N/A',
      time: appointmentDetails?.appointment_time ?? 'N/A',
      action: 'Deleted appointment',
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Appointment deleted successfully');
}

