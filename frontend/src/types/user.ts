export type UserRole = 'admin' | 'staff' | 'patient';

export interface BaseUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  email: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  dateCreated?: string;
}

export interface PatientProfile extends BaseUser {
  firstName: string;
  lastName: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
  profileImage?: string;
}

export interface StaffProfile extends BaseUser {
  jobTitle: string;
  profileImage?: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  fullName?: string;
  specialty: string;
  available: boolean;
  profileImage?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price?: string;
  active?: boolean; // For deactivation
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  date: string;
  time: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  promoId?: string; // Promotion applied to this appointment
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  discount: string;
  price: string;
  originalPrice?: string;
  promoPrice?: string;
  validUntil?: string;
  active?: boolean; // For deactivation
  duration?: number; // Duration in minutes (optional, for services like metal braces installation)
  createdAt: string;
}

export interface ClinicScheduleDay {
  isOpen: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string; // Optional break start time (HH:MM)
  breakEndTime?: string;   // Optional break end time (HH:MM)
}

export type ClinicSchedule = Record<
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday',
  ClinicScheduleDay
>;

