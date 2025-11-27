import { StorageService } from './storage';
import { normalizeDate } from './revenue-calculator';
import type { Appointment } from '@/types/dashboard';

export interface AppointmentFilters {
  dateFilter?: 'all' | 'today' | 'week' | 'month';
  serviceFilter?: string; // 'all' or service ID
  patientFilter?: string; // Search term
  statusFilter?: string; // 'all' or status value
  doctorFilter?: string; // 'all' or doctor ID
}

/**
 * Filter appointments based on various criteria
 * Uses normalizeDate for consistent date comparisons
 */
export function filterAppointments(
  appointments: Appointment[],
  filters: AppointmentFilters
): Appointment[] {
  let filtered = [...appointments];

  // Date filter
  if (filters.dateFilter && filters.dateFilter !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter((apt) => {
      const aptDateStr = normalizeDate(apt.date || (apt as any).appointmentDate);
      if (!aptDateStr) return false;
      
      // Parse normalized date
      const dateParts = aptDateStr.split('-');
      const aptYear = parseInt(dateParts[0], 10);
      const aptMonth = parseInt(dateParts[1], 10) - 1;
      const aptDay = parseInt(dateParts[2], 10);
      const appointmentDate = new Date(aptYear, aptMonth, aptDay);
      appointmentDate.setHours(0, 0, 0, 0);

      switch (filters.dateFilter) {
        case 'today':
          return appointmentDate.getTime() === today.getTime();
        case 'week': {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return appointmentDate >= weekStart && appointmentDate <= weekEnd;
        }
        case 'month':
          return (
            appointmentDate.getMonth() === today.getMonth() &&
            appointmentDate.getFullYear() === today.getFullYear()
          );
        default:
          return true;
      }
    });
  }

  // Service filter (handles both regular services and promotions)
  if (filters.serviceFilter && filters.serviceFilter !== 'all') {
    filtered = filtered.filter((apt) => {
      // Check if appointment matches the service ID
      if (String(apt.serviceId) === filters.serviceFilter) {
        return true;
      }
      
      // Check if service ID starts with promo_ prefix
      if (filters.serviceFilter.startsWith('promo_')) {
        const promoId = filters.serviceFilter.replace('promo_', '');
        return String(apt.serviceId) === `promo_${promoId}` || 
               String((apt as any).promoId) === promoId;
      }
      
      // Check multiple services
      if ((apt as any).services && Array.isArray((apt as any).services)) {
        return (apt as any).services.some((svc: any) => 
          String(svc.serviceId) === filters.serviceFilter ||
          (filters.serviceFilter.startsWith('promo_') && 
           String(svc.serviceId) === filters.serviceFilter)
        );
      }
      
      return false;
    });
  }

  // Patient filter (search by name)
  if (filters.patientFilter && filters.patientFilter.trim()) {
    const searchTerm = filters.patientFilter.trim().toLowerCase();
    filtered = filtered.filter((apt) => {
      const patientIdStr = typeof apt.patientId === 'string' 
        ? apt.patientId 
        : apt.patientId 
          ? String(apt.patientId) 
          : '';
      
      const patient = StorageService.getPatientById(patientIdStr);
      const patientName = patient?.fullName || apt.patientName || apt.patientFullName || '';
      const isGuest = patientIdStr.startsWith('guest_appointment');
      const isWalkin = patientIdStr.startsWith('walkin_');

      if (isGuest || isWalkin) {
        // Extract name from notes for guest/walk-in patients
        const notesMatch = apt.notes?.match(/(?:GUEST|WALK-IN) PATIENT[\s\S]*?Name:\s*([^\r\n]+)/i);
        const extractedName = notesMatch ? notesMatch[1].trim() : '';
        return extractedName.toLowerCase().includes(searchTerm);
      }

      return patientName.toLowerCase().includes(searchTerm);
    });
  }

  // Status filter
  if (filters.statusFilter && filters.statusFilter !== 'all') {
    filtered = filtered.filter((apt) => apt.status === filters.statusFilter);
  }

  // Doctor filter
  if (filters.doctorFilter && filters.doctorFilter !== 'all') {
    filtered = filtered.filter((apt) => String(apt.doctorId) === filters.doctorFilter);
  }

  return filtered;
}

/**
 * Get appointments by period (today, week, month)
 * Uses normalizeDate for consistent date comparisons
 */
export function getAppointmentsByPeriod(
  appointments: Appointment[],
  period: 'today' | 'week' | 'month'
): Appointment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return appointments.filter((apt) => {
    const aptDateStr = normalizeDate(apt.date || (apt as any).appointmentDate);
    if (!aptDateStr) return false;
    
    // Parse normalized date
    const dateParts = aptDateStr.split('-');
    const aptYear = parseInt(dateParts[0], 10);
    const aptMonth = parseInt(dateParts[1], 10) - 1;
    const aptDay = parseInt(dateParts[2], 10);
    const aptDate = new Date(aptYear, aptMonth, aptDay);
    aptDate.setHours(0, 0, 0, 0);
    
    if (period === 'today') {
      return aptDate.getTime() === today.getTime();
    } else if (period === 'week') {
      return aptDate >= weekStart && aptDate <= today;
    } else {
      return aptDate >= monthStart && aptDate <= today;
    }
  });
}

/**
 * Filter appointments within a date range
 * Useful for reports and custom date ranges
 */
export function filterAppointmentsByDateRange(
  appointments: Appointment[],
  startDate: Date,
  endDate: Date
): Appointment[] {
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(23, 59, 59, 999);

  return appointments.filter((apt) => {
    const aptDateStr = normalizeDate(apt.date || (apt as any).appointmentDate);
    if (!aptDateStr) return false;
    
    try {
      // Parse normalized date
      const dateParts = aptDateStr.split('-');
      const aptYear = parseInt(dateParts[0], 10);
      const aptMonth = parseInt(dateParts[1], 10) - 1;
      const aptDay = parseInt(dateParts[2], 10);
      const aptDate = new Date(aptYear, aptMonth, aptDay);
      aptDate.setHours(0, 0, 0, 0);
      
      return aptDate >= normalizedStart && aptDate <= normalizedEnd;
    } catch (error) {
      console.warn('Error parsing appointment date:', aptDateStr, error);
      return false;
    }
  });
}

