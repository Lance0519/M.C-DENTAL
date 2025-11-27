export type Role = 'admin' | 'staff' | 'patient';

export type User = {
  id: string;
  username: string;
  password: string;
  role: Role;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: string;
  username: string;
  password: string;
  role: Role;
  email: string;
  full_name: string;
  phone?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  duration?: string | null;
  price?: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'cancellation_requested';

export type AppointmentService = {
  id: string;
  appointment_id: string;
  service_id: string;
  service_name?: string | null;
  price?: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes?: string | null;
  treatment?: string | null;
  remarks?: string | null;
  reschedule_requested?: boolean;
  reschedule_requested_date?: string | null;
  reschedule_requested_time?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  appointment_services?: AppointmentService[];
};

