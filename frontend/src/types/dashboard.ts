/**
 * Dashboard-specific types
 */

export interface Appointment {
  id: string | number;
  patientId?: string | number;
  patientName?: string;
  patientFullName?: string;
  patient?: any;
  doctorId?: string | number;
  doctorName?: string;
  doctorFullName?: string;
  doctor?: any;
  serviceId?: string | number; // Legacy: single service (for backward compatibility)
  serviceName?: string; // Legacy: single service name
  service?: any; // Legacy: single service object
  services?: Array<{ // New: multiple services support
    serviceId: string | number;
    serviceName: string;
    price?: string | number;
  }>;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'cancellation_requested';
  notes?: string;
  walkInName?: string;
  walkInFullName?: string;
  walkIn?: any;
  rescheduleRequested?: boolean;
  rescheduleRequestedDate?: string;
  rescheduleRequestedTime?: string;
  paymentAmount?: number; // Amount paid by patient (for revenue tracking)
  completedAt?: string; // Date when appointment was completed (for revenue tracking)
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  id: string | number;
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  dateCreated?: string;
  profileImage?: string;
}

export interface Service {
  id: string | number;
  name: string;
  description?: string;
  duration?: string;
  price?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Doctor {
  id: string | number;
  name: string;
  fullName?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  available?: boolean;
  profileImage?: string;
}

export interface StaffMember {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  jobTitle?: string;
  role?: 'admin' | 'staff';
  phone?: string;
  profileImage?: string;
  dateCreated?: string;
}

export interface Promotion {
  id: string | number;
  title: string;
  description: string;
  discount?: string | number;
  price?: string | number;
  originalPrice?: string | number;
  promoPrice?: string | number;
  validUntil?: string;
  createdAt?: string;
}

export interface Schedule {
  id: string | number;
  doctorId?: string | number;
  doctorName?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export interface Statistics {
  totalAppointments?: number;
  pendingAppointments?: number;
  confirmedAppointments?: number;
  totalPatients?: number;
  totalServices?: number;
  totalDoctors?: number;
  todayAppointments?: number;
  weeklyAppointments?: number;
  monthlyAppointments?: number;
  revenue?: number;
}

export interface DashboardTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export type DashboardRole = 'admin' | 'staff' | 'patient';

export interface MedicalHistoryRecord {
  id: string;
  patientId: string;
  serviceId?: string;
  doctorId?: string;
  serviceName?: string;
  doctorName?: string;
  date: string;
  time: string;
  treatment: string;
  remarks?: string;
  images?: string[]; // Array of base64 image URLs
  createdAt?: string;
  updatedAt?: string;
}

