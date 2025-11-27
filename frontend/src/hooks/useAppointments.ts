import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Appointment } from '@/types/dashboard';

type AppointmentServicePayload = {
  serviceId: string;
  serviceName?: string;
  price?: string | number;
};

const normalizeServices = (raw: any): Appointment['services'] => {
  if (Array.isArray(raw?.appointment_services)) {
    return raw.appointment_services.map((svc: any) => ({
      serviceId: svc.service_id,
      serviceName: svc.service_name ?? undefined,
      price: svc.price ?? undefined,
    }));
  }

  if (Array.isArray(raw?.services)) {
    return raw.services;
  }

  if (raw?.service_id) {
    return [
      {
        serviceId: raw.service_id,
        serviceName: raw.service_name ?? raw.serviceName,
        price: raw.price ?? undefined,
      },
    ];
  }

  return [];
};

const normalizeAppointment = (raw: any): Appointment => {
  const date = raw.appointment_date ?? raw.date ?? '';
  const time = raw.appointment_time ?? raw.time ?? '';
  return {
    id: raw.id,
    patientId: raw.patient_id ?? raw.patientId ?? undefined,
    patientName: raw.patient_name ?? raw.patientName,
    doctorId: raw.doctor_id ?? raw.doctorId ?? undefined,
    doctorName: raw.doctor_name ?? raw.doctorName,
    serviceId: raw.service_id ?? raw.serviceId ?? undefined,
    serviceName: raw.service_name ?? raw.serviceName,
    services: normalizeServices(raw),
    date,
    time,
    status: (raw.status || 'pending') as Appointment['status'],
    notes: raw.notes ?? undefined,
    rescheduleRequested: raw.reschedule_requested ?? raw.rescheduleRequested,
    rescheduleRequestedDate: raw.reschedule_requested_date ?? raw.rescheduleRequestedDate,
    rescheduleRequestedTime: raw.reschedule_requested_time ?? raw.rescheduleRequestedTime,
    treatment: raw.treatment ?? undefined,
    remarks: raw.remarks ?? undefined,
    paymentAmount: raw.payment_amount ?? raw.paymentAmount ?? undefined,
    completedAt: raw.completed_at ?? raw.completedAt ?? undefined,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  } as Appointment;
};

const buildServicesPayload = (services?: Appointment['services']): AppointmentServicePayload[] | undefined =>
  services?.map((svc) => ({
    serviceId: String(svc.serviceId),
    serviceName: svc.serviceName,
    price: svc.price ? String(svc.price) : undefined,
  }));

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async (params?: { doctorId?: string; date?: string; public?: boolean }): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, string> = {};
      if (params?.doctorId) queryParams.doctor_id = params.doctorId;
      if (params?.date) queryParams.date = params.date;
      if (params?.public) queryParams.public = 'true';
      
      const response = await api.getAppointments(Object.keys(queryParams).length > 0 ? queryParams : undefined);
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      const normalized = (data as any[]).map(normalizeAppointment);
      setAppointments(normalized);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // NOTE: Removed auto-load on mount to prevent race conditions
  // Components should explicitly call loadAppointments with their required filters

  const createAppointment = async (appointment: Partial<Appointment>) => {
    try {
      const patientId = appointment.patientId ?? (appointment as any).patient?.id;
      const doctorId = appointment.doctorId ?? (appointment as any).doctor?.id;
      const serviceId =
        appointment.serviceId ??
        appointment.services?.[0]?.serviceId ??
        (appointment as any).service?.id;
      const serviceName = appointment.serviceName ?? appointment.services?.[0]?.serviceName;
      const date = appointment.date;
      const time = appointment.time;

      if (!patientId || !doctorId || !serviceId || !date || !time) {
        throw new Error('Missing required fields for appointment creation.');
      }

      // Build services array with service name
      const services = appointment.services 
        ? buildServicesPayload(appointment.services)
        : [{ serviceId: String(serviceId), serviceName: serviceName }];

      const payload = {
        patientId: String(patientId),
        doctorId: String(doctorId),
        serviceId: String(serviceId),
        services,
        date,
        time,
        notes: appointment.notes,
        status: appointment.status,
      };

      const response = await api.createAppointment(payload);
      // Dispatch event to notify other components to refresh
      window.dispatchEvent(new CustomEvent('clinicDataUpdated'));
      return { success: true, data: response };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create appointment';
      return { success: false, message };
    }
  };

  const updateAppointment = async (id: string | number, updates: Partial<Appointment>) => {
    try {
      const payload: Record<string, any> = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.time !== undefined) payload.time = updates.time;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.doctorId !== undefined) payload.doctorId = String(updates.doctorId);
      if (updates.treatment !== undefined) payload.treatment = updates.treatment;
      if (updates.remarks !== undefined) payload.remarks = updates.remarks;
      if (updates.rescheduleRequested !== undefined)
        payload.rescheduleRequested = updates.rescheduleRequested;
      if (updates.rescheduleRequestedDate !== undefined)
        payload.rescheduleRequestedDate = updates.rescheduleRequestedDate;
      if (updates.rescheduleRequestedTime !== undefined)
        payload.rescheduleRequestedTime = updates.rescheduleRequestedTime;
      if ((updates as any).paymentAmount !== undefined)
        payload.paymentAmount = (updates as any).paymentAmount;
      if ((updates as any).completedAt !== undefined)
        payload.completedAt = (updates as any).completedAt;
      if (updates.services) {
        payload.services = buildServicesPayload(updates.services);
      }

      await api.updateAppointment(String(id), payload);
      // Dispatch event to notify other components to refresh
      window.dispatchEvent(new CustomEvent('clinicDataUpdated'));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update appointment';
      return { success: false, message };
    }
  };

  const deleteAppointment = async (id: string | number) => {
    try {
      await api.deleteAppointment(String(id));
      setAppointments((prev) => prev.filter((apt) => String(apt.id) !== String(id)));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete appointment';
      return { success: false, message };
    }
  };

  return {
    appointments,
    loading,
    error,
    loadAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}

