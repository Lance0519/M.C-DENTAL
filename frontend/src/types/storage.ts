import type {
  Appointment,
  ClinicSchedule,
  DoctorProfile,
  PatientProfile,
  Promo,
  ServiceItem,
  StaffProfile
} from './user';

export type { ServiceItem, Appointment, ClinicSchedule, DoctorProfile, PatientProfile, Promo, StaffProfile };

export interface ClinicData {
  users: StaffProfile[];
  patients: PatientProfile[];
  doctors: DoctorProfile[];
  services: ServiceItem[];
  appointments: Appointment[];
  medicalHistory: Array<Record<string, unknown>>;
  promos: Promo[];
  clinicSchedule: ClinicSchedule;
  schedules: Array<{
    id: string;
    doctorId: string;
    day: string;
    startTime: string;
    endTime: string;
  }>;
  sessionImages?: Array<Record<string, unknown>>;
  auditLogs?: Array<Record<string, unknown>>;
  notifications?: Array<Record<string, unknown>>;
}

