import type { Appointment } from '@/types/dashboard';
import type { ServiceItem } from '@/types/user';

/**
 * Calculate the revenue/price for an appointment
 * Priority: paymentAmount > service prices
 * 
 * @param appointment - The appointment to calculate revenue for
 * @param services - List of available services
 * @returns The calculated revenue amount
 */
export function calculateAppointmentRevenue(
  appointment: Appointment,
  services: ServiceItem[]
): number {
  // Priority 1: Use paymentAmount if available (actual amount paid)
  if ((appointment as any).paymentAmount !== undefined && (appointment as any).paymentAmount !== null) {
    return Number((appointment as any).paymentAmount);
  }
  
  // Priority 2: Calculate from service prices
  // Handle multiple services
  if ((appointment as any).services && Array.isArray((appointment as any).services)) {
    return (appointment as any).services.reduce((sum: number, svc: any) => {
      const svcItem = services.find((s) => String(s.id) === String(svc.serviceId));
      const svcPrice = svcItem?.price 
        ? (typeof svcItem.price === 'string' 
            ? parseFloat(svcItem.price.replace(/[^0-9.]/g, '')) 
            : Number(svcItem.price)) 
        : 0;
      return sum + svcPrice;
    }, 0);
  }
  
  // Single service
  const service = services.find((s) => String(s.id) === String(appointment.serviceId));
  const price = service?.price 
    ? (typeof service.price === 'string' 
        ? parseFloat(service.price.replace(/[^0-9.]/g, '')) 
        : Number(service.price)) 
    : 0;
  return price;
}

/**
 * Get the completion date for an appointment (for revenue tracking)
 * Priority: completedAt > updatedAt > appointment date
 * 
 * @param appointment - The appointment to get completion date for
 * @returns The completion date string in YYYY-MM-DD format, or null if not available
 */
export function getAppointmentCompletionDate(appointment: Appointment): string | null {
  if (!appointment) return null;
  
  // Only for completed appointments
  if (appointment.status !== 'completed') return null;
  
  // Priority 1: completedAt (explicit completion date stored with payment)
  if ((appointment as any).completedAt) {
    return normalizeDate((appointment as any).completedAt);
  }
  
  // Priority 2: updatedAt (when status was changed to completed)
  if (appointment.updatedAt) {
    return normalizeDate(appointment.updatedAt);
  }
  
  // Priority 3: appointment date (fallback)
  return normalizeDate(appointment.date || (appointment as any).appointmentDate);
}

/**
 * Normalize date string to YYYY-MM-DD format (avoids timezone issues)
 * 
 * @param dateStr - Date string or Date object
 * @returns Normalized date string in YYYY-MM-DD format, or null if invalid
 */
export function normalizeDate(dateStr: string | undefined | Date | null): string | null {
  if (!dateStr) return null;
  try {
    let date: Date;
    if (typeof dateStr === 'string') {
      // Extract just the date part (YYYY-MM-DD) if it includes time
      const dateOnly = dateStr.split('T')[0].split(' ')[0];
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        // Parse using local time components to avoid timezone issues
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = dateStr;
    }
    
    if (isNaN(date.getTime())) return null;
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

