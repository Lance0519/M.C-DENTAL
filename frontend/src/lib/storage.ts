import type { ClinicData } from '@/types/storage';
import type {
  Appointment,
  ClinicSchedule,
  DoctorProfile,
  PatientProfile,
  Promo,
  ServiceItem,
  StaffProfile,
  UserRole
} from '@/types/user';
import { ServiceDurations } from './service-durations';

const STORAGE_KEY = 'clinicData';
const SESSION_USER_KEY = 'currentUser';

const defaultClinicSchedule: ClinicSchedule = {
  Monday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Thursday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Friday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Saturday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Sunday: { isOpen: false, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' }
};

const defaultData: ClinicData = {
  users: [
    {
      id: 'admin001',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      email: 'admin@clinic.com',
      fullName: 'System Administrator',
      jobTitle: 'System Administrator'
    },
    {
      id: 'staff001',
      username: 'staff',
      password: 'staff123',
      role: 'staff',
      email: 'staff@clinic.com',
      fullName: 'Jane Smith',
      jobTitle: 'Office Manager'
    }
  ],
  patients: [
    {
      id: 'pat001',
      username: 'patient',
      password: 'patient123',
      role: 'patient',
      email: 'patient@example.com',
      fullName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0100',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      address: '123 Main St',
      dateCreated: new Date().toISOString()
    }
  ],
  doctors: [
    { id: 'doc001', name: 'Dr. Maria Cruz', specialty: 'General Dentistry', available: true },
    { id: 'doc002', name: 'Dr. Carlos Santos', specialty: 'Orthodontics', available: true },
    { id: 'doc003', name: 'Dr. Ana Reyes', specialty: 'Oral Surgery', available: true }
  ],
  services: [
    {
      id: 'srv001',
      name: 'Consultation',
      description: 'Dental consultation - P500 only, but FREE if you avail any dental procedures',
      duration: '30 mins',
      price: '₱500 (Free with any dental procedure)'
    },
    {
      id: 'srv002',
      name: 'Simple Tooth Extraction',
      description: 'Simple extraction of teeth',
      duration: '30 mins',
      price: '₱500 minimum per tooth'
    },
    {
      id: 'srv003',
      name: 'Wisdom Tooth Extraction',
      description: 'Wisdom tooth extraction procedure',
      duration: '45 mins',
      price: '₱3,000 minimum per tooth'
    },
    {
      id: 'srv004',
      name: 'Impacted Wisdom Tooth Extraction',
      description: 'Impacted wisdom tooth extraction (limited time offer)',
      duration: '120 mins',
      price: '₱8,000 - ₱10,000 minimum per tooth'
    },
    {
      id: 'srv005',
      name: 'Cleaning',
      description: 'Dental cleaning - starting at P500 for mild/light cases, additional fees for above light cases',
      duration: '30 mins',
      price: '₱500 (mild/light cases), additional fees for severe cases'
    },
    {
      id: 'srv006',
      name: 'Pasta/Dental Fillings',
      description: 'Dental fillings - starting at P500 for mild/light cases, additional fees for above light cases',
      duration: '30 mins',
      price: '₱500 (mild/light cases), additional fees for severe cases'
    },
    {
      id: 'srv007',
      name: 'Dentures (1-3 tooth)',
      description: 'Dentures for 1-3 missing teeth per arch',
      duration: '60 mins',
      price: '₱5,000 per arch'
    },
    {
      id: 'srv008',
      name: 'Dentures (4-5 tooth)',
      description: 'Dentures for 4-5 missing teeth per arch',
      duration: '60 mins',
      price: '₱5,500 per arch'
    },
    {
      id: 'srv009',
      name: 'Dentures (6-7 tooth)',
      description: 'Dentures for 6-7 missing teeth per arch',
      duration: '60 mins',
      price: '₱6,000 per arch'
    },
    {
      id: 'srv010',
      name: 'Dentures (8+ tooth)',
      description: 'Dentures for 8 and above missing teeth per arch',
      duration: '60 mins',
      price: '₱7,000 per arch'
    },
    {
      id: 'srv011',
      name: 'Root Canal',
      description: 'Root canal treatment per canal',
      duration: '90 mins',
      price: '₱7,000 per canal'
    },
    {
      id: 'srv012',
      name: 'Jacket/Crown',
      description: 'Porcelain fused to metal crown per unit',
      duration: '45 mins',
      price: '₱6,000 per unit'
    },
    {
      id: 'srv013',
      name: 'Veneers',
      description: 'Dental veneers per unit',
      duration: '90 mins',
      price: '₱3,500 - ₱5,000 per unit'
    },
    {
      id: 'srv014',
      name: 'Teeth Whitening (2 cycles)',
      description: 'Teeth whitening with 2 cycles - includes free light case cleaning',
      duration: '60 mins',
      price: '₱6,000 (includes free light case cleaning)'
    },
    {
      id: 'srv015',
      name: 'Teeth Whitening (3 cycles)',
      description: 'Teeth whitening with 3 cycles - includes free light case cleaning',
      duration: '90 mins',
      price: '₱8,000 (includes free light case cleaning)'
    },
    {
      id: 'srv016',
      name: 'Panoramic X-Ray',
      description: 'Full mouth panoramic X-ray imaging',
      duration: '15 mins',
      price: '₱1,000'
    },
    {
      id: 'srv017',
      name: 'Periapical X-Ray',
      description: 'Detailed X-ray of specific tooth area',
      duration: '10 mins',
      price: '₱300'
    },
    {
      id: 'srv018',
      name: 'Oral Surgery',
      description: 'Oral surgery procedures per unit',
      duration: '120 mins',
      price: '₱8,000 - ₱10,000 per unit'
    },
    {
      id: 'srv019',
      name: 'Upper and Lower Metal Braces',
      description: 'Complete upper and lower metal braces package',
      duration: '60 mins',
      price: '₱30,000 starting (price may vary depending on severity)'
    },
    {
      id: 'srv020',
      name: 'Upper OR Lower Metal Braces',
      description: 'Single arch metal braces package',
      duration: '60 mins',
      price: '₱20,000 starting'
    },
    {
      id: 'srv021',
      name: 'Braces Adjustment',
      description: 'Regular braces adjustment',
      duration: '15 mins',
      price: 'Included in braces package or ₱500-₱1,000 per session'
    },
    {
      id: 'srv022',
      name: 'Braces Removal',
      description: 'Removal of existing braces with free light case cleaning',
      duration: '30 mins',
      price: '₱2,000 (includes free light case cleaning)'
    }
  ],
  appointments: [],
  medicalHistory: [],
  promos: [
    {
      id: 'promo001',
      title: '❆ BER MONTHS PROMO ❆',
      description:
        'Upper and Lower Metal Braces Package - Down Payment: ₱3,500 | Monthly Adjustment: ₱1,000 | Total Package: ₱30,000 starting (price may vary depending on severity). Includes: Panoramic X-Ray, Light Case Cleaning, 1 Simple Bunot, 1 Pasta (Molars that are not previously restored), Retainer After Braces (for upper and lower braces only), Fluoride After Braces, Intra & Extra Oral Photos, Uni Gum Sore Treatment, Ortho Kit. Possible Same Day Installation!',
      discount: 'BER MONTHS SPECIAL',
      price: '₱30,000',
      originalPrice: '₱35,000+',
      promoPrice: '₱30,000',
      validUntil: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: 'promo002',
      title: '❆ BER MONTHS PROMO ❆',
      description:
        'Upper OR Lower Metal Braces Package - Down Payment: ₱3,000 | Monthly Adjustment: ₱500 | Total Package: ₱20,000 starting. Includes: Panoramic X-Ray, Light Case Cleaning, 1 Simple Bunot, 1 Pasta (Molars that are not previously restored), Retainer After Braces, Fluoride After Braces, Intra & Extra Oral Photos, Uni Gum Sore Treatment, Ortho Kit. Possible Same Day Installation!',
      discount: 'BER MONTHS SPECIAL',
      price: '₱20,000',
      originalPrice: '₱25,000+',
      promoPrice: '₱20,000',
      validUntil: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
  ],
  clinicSchedule: defaultClinicSchedule,
  schedules: [
    { id: 'sch001', doctorId: 'doc001', day: 'Monday', startTime: '09:00', endTime: '17:00' },
    { id: 'sch002', doctorId: 'doc001', day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
    { id: 'sch003', doctorId: 'doc001', day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
    { id: 'sch004', doctorId: 'doc001', day: 'Thursday', startTime: '09:00', endTime: '17:00' },
    { id: 'sch005', doctorId: 'doc001', day: 'Friday', startTime: '09:00', endTime: '17:00' },
    { id: 'sch006', doctorId: 'doc002', day: 'Monday', startTime: '10:00', endTime: '16:00' },
    { id: 'sch007', doctorId: 'doc002', day: 'Wednesday', startTime: '10:00', endTime: '16:00' },
    { id: 'sch008', doctorId: 'doc002', day: 'Friday', startTime: '10:00', endTime: '16:00' },
    { id: 'sch009', doctorId: 'doc003', day: 'Monday', startTime: '08:00', endTime: '14:00' },
    { id: 'sch010', doctorId: 'doc003', day: 'Tuesday', startTime: '08:00', endTime: '14:00' },
    { id: 'sch011', doctorId: 'doc003', day: 'Thursday', startTime: '08:00', endTime: '14:00' }
  ],
  sessionImages: [],
  auditLogs: [],
  notifications: []
};

export class StorageService {
  private static readData(): ClinicData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData)) as ClinicData;
      }

      try {
        const parsed = JSON.parse(stored) as ClinicData;
        return parsed;
      } catch (error) {
        console.error('Failed to parse clinic data, resetting to defaults.', error);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData)) as ClinicData;
      }
    } catch (error) {
      // Fallback if localStorage is not available (e.g., during SSR)
      console.error('Error reading from localStorage:', error);
      return JSON.parse(JSON.stringify(defaultData)) as ClinicData;
    }
  }

  private static writeData(data: ClinicData) {
    try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Trigger sync event after writing data
    this.triggerDataSync();
    } catch (error: any) {
      // Check if it's a quota exceeded error
      if (error?.name === 'QuotaExceededError' || error?.code === 22 || 
          (error?.message && error.message.includes('quota'))) {
        const quotaError = new Error('Storage quota exceeded. Please remove some data or images to free up space.');
        quotaError.name = 'QuotaExceededError';
        throw quotaError;
      }
      throw error;
    }
  }

  static init() {
    this.readData();
  }

  static getData(): ClinicData {
    return this.readData();
  }

  static saveData(data: ClinicData) {
    this.writeData(data);
  }

  static getAllUsers(): Array<StaffProfile | PatientProfile> {
    const data = this.readData();
    return [...data.users, ...data.patients];
  }

  static getUserByUsername(username: string) {
    // Case-insensitive username lookup for consistency with email lookup
    // This ensures login works regardless of username casing
    if (!username) return undefined;
    const normalizedUsername = username.toLowerCase();
    return this.getAllUsers().find((user) => user.username?.toLowerCase() === normalizedUsername);
  }

  static getUserByEmail(email: string) {
    if (!email) return undefined;
    const normalizedEmail = email.toLowerCase();
    return this.getAllUsers().find((user) => user.email?.toLowerCase() === normalizedEmail);
  }

  static createUser(user: Omit<PatientProfile, 'id' | 'role' | 'dateCreated'> & { role?: UserRole }) {
    const data = this.readData();
    const newUser: PatientProfile = {
      ...user,
      id: `user${Date.now()}`,
      role: user.role ?? 'patient',
      fullName: user.fullName ?? `${user.firstName} ${user.lastName}`.trim(),
      dateCreated: new Date().toISOString()
    };

    if (newUser.role === 'patient') {
      data.patients.push(newUser);
    } else {
      data.users.push(newUser as StaffProfile);
    }

    this.writeData(data);
    
    // Audit log
    this.createAuditLog(newUser.role === 'patient' ? 'create_patient' : 'create_staff', {
      userId: newUser.id,
      userName: newUser.fullName || newUser.username,
      role: newUser.role,
    });
    
    return newUser;
  }

  // Appointment management - matching legacy logic exactly
  static getAppointments(): Appointment[] {
    const data = this.readData();
    return data.appointments || [];
  }

  static getAppointmentById(id: string): Appointment | undefined {
    const data = this.readData();
    return data.appointments.find((a) => a.id === id);
  }

  static getAppointmentsByPatient(patientId: string): Appointment[] {
    const data = this.readData();
    return data.appointments.filter((a) => a.patientId === patientId);
  }

  static getAppointmentsByDoctor(doctorId: string): Appointment[] {
    const data = this.readData();
    return data.appointments.filter((a) => a.doctorId === doctorId);
  }

  // Schedule management - matching legacy logic exactly
  static getSchedules(): Array<{ id: string; doctorId: string; day: string; startTime: string; endTime: string }> {
    const data = this.readData();
    return data.schedules || [];
  }

  static getScheduleById(scheduleId: string) {
    const data = this.readData();
    return data.schedules.find((s) => s.id === scheduleId);
  }

  static getSchedulesByDoctor(doctorId: string) {
    const data = this.readData();
    return (data.schedules || []).filter((s) => s.doctorId === doctorId);
  }

  static createSchedule(schedule: { doctorId: string; day: string; startTime: string; endTime: string }) {
    const data = this.readData();
    if (!data.schedules) {
      data.schedules = [];
    }

    const newSchedule = {
      ...schedule,
      id: `sch${Date.now()}`,
    };

    data.schedules.push(newSchedule);
    this.writeData(data);
    
    // Audit log
    const doctor = this.getDoctorById(schedule.doctorId);
    this.createAuditLog('create_schedule', {
      scheduleId: newSchedule.id,
      doctorName: doctor?.name || 'Unknown',
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
    
    return newSchedule;
  }

  static updateSchedule(scheduleId: string, updates: Partial<{ doctorId: string; day: string; startTime: string; endTime: string }>) {
    const data = this.readData();
    const schedule = data.schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      Object.assign(schedule, updates);
      this.writeData(data);
      
      // Audit log
      const doctor = this.getDoctorById(schedule.doctorId);
      this.createAuditLog('update_schedule', {
        scheduleId,
        doctorName: doctor?.name || 'Unknown',
        changes: Object.keys(updates),
      });
    }
    return schedule;
  }

  static deleteSchedule(scheduleId: string): void {
    const data = this.readData();
    const schedule = data.schedules.find((s) => s.id === scheduleId);
    data.schedules = (data.schedules || []).filter((s) => s.id !== scheduleId);
    this.writeData(data);
    
    // Audit log
    if (schedule) {
      const doctor = this.getDoctorById(schedule.doctorId);
      this.createAuditLog('delete_schedule', {
        scheduleId,
        doctorName: doctor?.name || 'Unknown',
        day: schedule.day,
      });
    }
  }

  static createAppointment(appointment: Partial<Appointment>): Appointment {
    const data = this.readData();
    
    // Validate required fields - support both date/time and appointmentDate/appointmentTime
    const hasDate = appointment.date || (appointment as any).appointmentDate;
    const hasTime = appointment.time || (appointment as any).appointmentTime;
    
    // Support both single service (legacy) and multiple services
    const hasService = appointment.serviceId || ((appointment as any).services && (appointment as any).services.length > 0);
    if (!appointment.patientId || !appointment.doctorId || !hasService || !hasDate || !hasTime) {
      throw new Error('Missing required appointment fields. All fields must be filled.');
    }

    // Normalize date and time fields for consistency
    const appointmentDate = appointment.date || (appointment as any).appointmentDate;
    const appointmentTime = appointment.time || (appointment as any).appointmentTime;
    
    const newAppointment: Appointment = {
      ...appointment,
      date: appointmentDate,
      time: appointmentTime,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
    } as Appointment;

    // Check for conflicts based on service duration - support multiple services and promotions
    let totalDuration = 0;
    let promoDuration = 0;
    
    if ((newAppointment as any).services && (newAppointment as any).services.length > 0) {
      // Calculate total duration from all services
      for (const serviceItem of (newAppointment as any).services) {
        const serviceId = serviceItem.serviceId.toString();
        // Check if it's a promotion
        if (serviceId.startsWith('promo_')) {
          const promoId = serviceId.replace('promo_', '');
          const promo = this.getPromoById(promoId);
          if (promo?.duration && promo.duration > 0) {
            promoDuration = promo.duration;
          }
        } else {
          // Regular service
          const service = this.getServiceById(serviceId);
          if (service) {
            totalDuration += ServiceDurations.getDuration(service);
          }
        }
      }
    } else {
      // Legacy: single service
      const serviceId = newAppointment.serviceId || '';
      if (serviceId.startsWith('promo_')) {
        // It's a promotion
        const promoId = serviceId.replace('promo_', '');
        const promo = this.getPromoById(promoId);
        if (promo?.duration && promo.duration > 0) {
          promoDuration = promo.duration;
        }
      } else {
        // Regular service
        const service = this.getServiceById(serviceId);
        totalDuration = ServiceDurations.getDuration(service || (newAppointment as any).serviceName || '');
      }
    }
    
    // If promotion has a custom duration, use it; otherwise use calculated service duration
    if (promoDuration > 0) {
      totalDuration = promoDuration;
    }
    
    const endTime = ServiceDurations.addMinutesToTime(appointmentTime, totalDuration);
    
    // Check for overlapping appointments based on duration
    const conflictingAppointment = data.appointments.find((a) => {
      if (a.id === newAppointment.id) return false;
      if (a.status === 'cancelled') return false;
      
      const aDate = a.date || (a as any).appointmentDate;
      const aTime = a.time || (a as any).appointmentTime;
      
      if (a.doctorId !== newAppointment.doctorId || aDate !== appointmentDate) {
        return false;
      }
      
      // Get existing appointment duration - support multiple services
      let aptDuration = 0;
      if ((a as any).services && (a as any).services.length > 0) {
        // Calculate total duration from all services
        for (const serviceItem of (a as any).services) {
          const service = this.getServiceById(serviceItem.serviceId.toString());
          if (service) {
            aptDuration += ServiceDurations.getDuration(service);
          }
        }
      } else {
        // Legacy: single service
        let aptServiceName = (a as any).serviceName;
        if (!aptServiceName && a.serviceId) {
          const aptService = this.getServiceById(a.serviceId);
          aptServiceName = aptService ? aptService.name : '';
        }
        aptDuration = ServiceDurations.getDuration(aptServiceName || '');
      }
      const aptEndTime = ServiceDurations.addMinutesToTime(aTime, aptDuration);
      
      // Check for overlap: appointments overlap if:
      // - New appointment starts before existing appointment ends AND
      // - New appointment ends after existing appointment starts
      // This prevents any time overlap between appointments
      const hasOverlap = appointmentTime < aptEndTime && endTime > aTime;
      
      return hasOverlap;
    });

    if (conflictingAppointment) {
      throw new Error('This time slot conflicts with an existing appointment. Please select a different time.');
    }

    // Check maximum 5 appointments per time slot (same date and time, excluding cancelled)
    const appointmentsAtSameTime = data.appointments.filter((a) => {
      const aDate = a.date || (a as any).appointmentDate;
      const aTime = a.time || (a as any).appointmentTime;
      return (
        aDate === appointmentDate &&
        aTime === appointmentTime &&
        a.status !== 'cancelled' &&
        a.id !== newAppointment.id
      );
    });

    if (appointmentsAtSameTime.length >= 5) {
      throw new Error(
        'This time slot is fully booked. Maximum 5 appointments per time slot. Please select a different time.'
      );
    }

    // Check maximum 15 appointments per day (same date, excluding cancelled)
    const appointmentsOnSameDate = data.appointments.filter((a) => {
      const aDate = a.date || (a as any).appointmentDate;
      return aDate === appointmentDate && a.status !== 'cancelled' && a.id !== newAppointment.id;
    });

    if (appointmentsOnSameDate.length >= 15) {
      throw new Error(
        'This date is fully booked. Maximum 15 appointments per day. Please select a different date.'
      );
    }

    // Only save if all validations pass
    newAppointment.id = `apt${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    newAppointment.createdAt = new Date().toISOString();
    newAppointment.updatedAt = new Date().toISOString();
    newAppointment.status = newAppointment.status || 'pending';

    if (!data.appointments) {
      data.appointments = [];
    }
    data.appointments.push(newAppointment);
    this.writeData(data);
    
    // Audit log
    const patient = this.getPatientById(newAppointment.patientId || '');
    const doctor = this.getDoctorById(newAppointment.doctorId || '');
    // Get service name for audit log
    let serviceName = (newAppointment as any).serviceName || 'Unknown';
    if (!serviceName && (newAppointment as any).services && (newAppointment as any).services.length > 0) {
      serviceName = (newAppointment as any).services.map((s: any) => s.serviceName || s.name).join(', ');
    } else if (!serviceName && newAppointment.serviceId) {
      const serviceObj = this.getServiceById(newAppointment.serviceId.toString());
      serviceName = serviceObj?.name || 'Unknown';
    }
    this.createAuditLog('create_appointment', {
      appointmentId: newAppointment.id,
      patientName: patient?.fullName || 'Guest',
      patientId: newAppointment.patientId || 'N/A',
      doctorName: doctor?.name || 'Unknown',
      doctorId: newAppointment.doctorId || 'N/A',
      service: serviceName,
      serviceId: newAppointment.serviceId || 'N/A',
      date: appointmentDate,
      time: appointmentTime,
      status: newAppointment.status || 'pending',
      isGuestBooking: !newAppointment.patientId,
    });
    
    // Notify staff (not admin) about new booked appointment
    const allStaff = this.getAllUsers().filter((u: any) => u.role === 'staff');
    const timestamp = Date.now();
    allStaff.forEach((staff: any, index: number) => {
      this.createNotification({
        id: `notif${timestamp}_${staff.id}_${index}`,
        type: 'appointment_confirmed',
        title: 'New Appointment',
        message: `${patient?.fullName || 'Guest Patient'} has a new appointment for ${serviceName} with ${doctor?.name || 'Unknown'} on ${appointmentDate} at ${appointmentTime}.`,
        userId: staff.id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    });
    
    return newAppointment;
  }

  static updateAppointment(appointmentId: string, updates: Partial<Appointment>): Appointment {
    const data = this.readData();
    const appointment = data.appointments.find((a) => a.id === appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Prevent editing date/time/doctor for completed or cancelled appointments (but allow notes)
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      if (updates.date !== undefined || updates.time !== undefined || 
          (updates as any).appointmentDate !== undefined || 
          (updates as any).appointmentTime !== undefined ||
          updates.doctorId !== undefined ||
          updates.serviceId !== undefined) {
        throw new Error('Cannot edit date, time, doctor, or service for completed or cancelled appointments. Only notes can be modified.');
      }
    }

    // Removed date validation - appointments can now be completed regardless of date
    // This allows staff/admin to mark appointments as completed even if the scheduled date hasn't passed

    // If date, time, or doctor is being updated, check for conflicts
    const isChangingDateTime = updates.date !== undefined || updates.time !== undefined || 
                               (updates as any).appointmentDate !== undefined || 
                               (updates as any).appointmentTime !== undefined;
    const isChangingDoctor = updates.doctorId !== undefined;
    const isChangingService = updates.serviceId !== undefined;

    if (isChangingDateTime || isChangingDoctor || isChangingService) {
      // Get the updated values
      const updatedDate = updates.date || (updates as any).appointmentDate || appointment.date || (appointment as any).appointmentDate;
      const updatedTime = updates.time || (updates as any).appointmentTime || appointment.time || (appointment as any).appointmentTime;
      const updatedDoctorId = updates.doctorId || appointment.doctorId;
      const updatedServiceId = updates.serviceId || appointment.serviceId;

      // Get service duration
      const service = this.getServiceById(updatedServiceId || '');
      const serviceDuration = ServiceDurations.getDuration(service || (updates as any).serviceName || (appointment as any).serviceName || '');
      const endTime = ServiceDurations.addMinutesToTime(updatedTime, serviceDuration);

      // Check for overlapping appointments based on duration
      const conflictingAppointment = data.appointments.find((a) => {
        if (a.id === appointmentId) return false; // Exclude current appointment
        if (a.status === 'cancelled') return false;

        const aDate = a.date || (a as any).appointmentDate;
        const aTime = a.time || (a as any).appointmentTime;

        if (a.doctorId !== updatedDoctorId || aDate !== updatedDate) {
          return false;
        }

        // Get existing appointment duration
        let aptServiceName = (a as any).serviceName;
        if (!aptServiceName && a.serviceId) {
          const aptService = this.getServiceById(a.serviceId);
          aptServiceName = aptService ? aptService.name : '';
        }

        const aptDuration = ServiceDurations.getDuration(aptServiceName || '');
        const aptEndTime = ServiceDurations.addMinutesToTime(aTime, aptDuration);

        // Check for overlap: appointments overlap if:
        // - Updated appointment starts before existing appointment ends AND
        // - Updated appointment ends after existing appointment starts
        const hasOverlap = updatedTime < aptEndTime && endTime > aTime;

        return hasOverlap;
      });

      if (conflictingAppointment) {
        throw new Error('This time slot conflicts with an existing appointment. Please select a different time.');
      }
    }

    const oldStatus = appointment.status;
    Object.assign(appointment, updates);
    appointment.updatedAt = new Date().toISOString();
    this.writeData(data);
    
    // Create notifications based on status changes
    const patient = this.getPatientById(appointment.patientId || '');
    const doctor = this.getDoctorById(appointment.doctorId || '');
    // Get service - support both single serviceId and multiple services array
    let service = null;
    if ((appointment as any).services && (appointment as any).services.length > 0) {
      // Use first service for notification purposes
      service = this.getServiceById((appointment as any).services[0].serviceId.toString());
    } else if (appointment.serviceId) {
      service = this.getServiceById(appointment.serviceId.toString());
    }
    
    // Notify patient when appointment is confirmed
    if (updates.status === 'confirmed' && oldStatus !== 'confirmed' && appointment.patientId && patient) {
      this.createNotification({
        id: `notif${Date.now()}`,
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `Your appointment for ${service?.name || (appointment as any).serviceName || 'service'} with ${doctor?.name || 'your dentist'} on ${appointment.date || (appointment as any).appointmentDate} at ${appointment.time || (appointment as any).appointmentTime} has been confirmed.`,
        userId: appointment.patientId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    
    // No notification for appointment completed (patient doesn't need this)
    
    // Notify staff when cancellation is requested
    if ((updates.status as any) === 'cancellation_requested' && (oldStatus as any) !== 'cancellation_requested') {
      const allStaff = this.getAllUsers().filter((u: any) => u.role === 'staff');
      const timestamp = Date.now();
      allStaff.forEach((staff: any, index: number) => {
        this.createNotification({
          id: `notif${timestamp}_${staff.id}_${index}`,
          type: 'cancellation_request',
          title: 'Cancellation Request',
          message: `${patient?.fullName || 'Guest Patient'} has requested to cancel their appointment for ${service?.name || (appointment as any).serviceName || 'service'} on ${appointment.date || (appointment as any).appointmentDate} at ${appointment.time || (appointment as any).appointmentTime}.`,
          userId: staff.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
    }
    
    // Notify patient when cancellation is approved
    if (updates.status === 'cancelled' && (oldStatus as any) === 'cancellation_requested' && appointment.patientId && patient) {
      this.createNotification({
        id: `notif${Date.now()}`,
        type: 'cancellation_approved',
        title: 'Cancellation Approved',
        message: `Your cancellation request for the appointment on ${appointment.date || (appointment as any).appointmentDate} at ${appointment.time || (appointment as any).appointmentTime} has been approved.`,
        userId: appointment.patientId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Notify patient when cancellation is rejected (status changes from cancellation_requested to something else, not cancelled)
    if ((oldStatus as any) === 'cancellation_requested' && updates.status && updates.status !== 'cancelled' && (updates.status as any) !== 'cancellation_requested' && appointment.patientId && patient) {
      this.createNotification({
        id: `notif${Date.now()}`,
        type: 'cancellation_rejected',
        title: 'Cancellation Request Rejected',
        message: `Your cancellation request for the appointment on ${appointment.date || (appointment as any).appointmentDate} at ${appointment.time || (appointment as any).appointmentTime} has been rejected. Your appointment remains scheduled.`,
        userId: appointment.patientId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Notify staff when reschedule is requested
    if ((updates as any).rescheduleRequested && !(appointment as any).rescheduleRequested) {
      const allStaff = this.getAllUsers().filter((u: any) => u.role === 'staff');
      const timestamp = Date.now();
      allStaff.forEach((staff: any, index: number) => {
        this.createNotification({
          id: `notif${timestamp}_${staff.id}_${index}`,
          type: 'reschedule_request',
          title: 'Reschedule Request',
          message: `${patient?.fullName || 'Guest Patient'} has requested to reschedule their appointment for ${service?.name || (appointment as any).serviceName || 'service'} from ${appointment.date || (appointment as any).appointmentDate} ${appointment.time || (appointment as any).appointmentTime} to ${(updates as any).rescheduleRequestedDate || 'new date'} ${(updates as any).rescheduleRequestedTime || 'new time'}.`,
          userId: staff.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
    }
    
    // Notify patient when reschedule is approved (date/time changed and reschedule was requested)
    if ((updates as any).rescheduleRequested && (appointment as any).rescheduleRequested && 
        (updates.date || updates.time || (updates as any).appointmentDate || (updates as any).appointmentTime) &&
        appointment.patientId && patient) {
      const newDate = updates.date || (updates as any).appointmentDate || appointment.date || (appointment as any).appointmentDate;
      const newTime = updates.time || (updates as any).appointmentTime || appointment.time || (appointment as any).appointmentTime;
      this.createNotification({
        id: `notif${Date.now()}`,
        type: 'reschedule_approved',
        title: 'Reschedule Approved',
        message: `Your reschedule request has been approved. Your appointment has been rescheduled to ${newDate} at ${newTime}.`,
        userId: appointment.patientId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Notify patient when reschedule is rejected (rescheduleRequested changes from true to false without date/time change)
    if ((appointment as any).rescheduleRequested && 
        ((updates as any).rescheduleRequested === false) &&
        !(updates.date || updates.time || (updates as any).appointmentDate || (updates as any).appointmentTime) &&
        appointment.patientId && patient) {
      this.createNotification({
        id: `notif${Date.now()}`,
        type: 'reschedule_rejected',
        title: 'Reschedule Request Rejected',
        message: `Your reschedule request has been rejected. Your appointment remains scheduled for ${appointment.date || (appointment as any).appointmentDate} at ${appointment.time || (appointment as any).appointmentTime}.`,
        userId: appointment.patientId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Notify patient when appointment is rescheduled (date/time changed)
    if ((updates.date || updates.time || (updates as any).appointmentDate || (updates as any).appointmentTime) &&
        oldStatus !== 'cancelled' && appointment.status !== 'cancelled' &&
        !(updates as any).rescheduleRequested && !(appointment as any).rescheduleRequested &&
        appointment.patientId && patient) {
      const newDate = updates.date || (updates as any).appointmentDate || appointment.date || (appointment as any).appointmentDate;
      const newTime = updates.time || (updates as any).appointmentTime || appointment.time || (appointment as any).appointmentTime;
      const oldDate = appointment.date || (appointment as any).appointmentDate;
      const oldTime = appointment.time || (appointment as any).appointmentTime;
      
      // Only notify if date or time actually changed
      if (newDate !== oldDate || newTime !== oldTime) {
        this.createNotification({
          id: `notif${Date.now()}`,
          type: 'appointment_rescheduled',
          title: 'Appointment Rescheduled',
          message: `Your appointment has been rescheduled from ${oldDate} at ${oldTime} to ${newDate} at ${newTime}.`,
          userId: appointment.patientId,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    // Audit log - check if status change
    const isStatusChange = 'status' in updates;
    const newStatus = updates.status;
    
    if (isStatusChange && oldStatus !== newStatus) {
      // Log status change separately with more details
      this.createAuditLog('appointment_status_changed', {
        appointmentId: appointment.id,
        oldStatus,
        newStatus,
        patientName: patient?.fullName || 'Guest',
        patientId: appointment.patientId || 'N/A',
        doctorName: doctor?.name || 'Unknown',
        doctorId: appointment.doctorId || 'N/A',
        service: service?.name || (appointment as any).serviceName || 'Unknown',
        serviceId: appointment.serviceId || 'N/A',
        date: appointment.date || (appointment as any).appointmentDate || 'Unknown',
        time: appointment.time || (appointment as any).appointmentTime || 'Unknown',
      });
    }
    
    // Also log general update
    this.createAuditLog('update_appointment', {
      appointmentId: appointment.id,
      patientName: patient?.fullName || 'Guest',
      patientId: appointment.patientId || 'N/A',
        doctorName: doctor?.name || 'Unknown',
        doctorId: appointment.doctorId || 'N/A',
        service: service?.name || (appointment as any).serviceName || 'Unknown',
        serviceId: appointment.serviceId || 'N/A',
      changes: Object.keys(updates),
      ...(isStatusChange && { statusChanged: true }),
    });
    
    return appointment;
  }

  static deleteAppointment(appointmentId: string): void {
    const data = this.readData();
    const appointment = data.appointments.find((a) => a.id === appointmentId);
    data.appointments = data.appointments.filter((a) => a.id !== appointmentId);
    this.writeData(data);
    
    // Audit log
    if (appointment) {
      const patient = this.getPatientById(appointment.patientId || '');
      const doctor = this.getDoctorById(appointment.doctorId || '');
      this.createAuditLog('delete_appointment', {
        appointmentId,
        patientName: patient?.fullName || 'Guest',
        doctorName: doctor?.name || 'Unknown',
        date: appointment.date || (appointment as any).appointmentDate,
        time: appointment.time || (appointment as any).appointmentTime,
      });
    }
  }

  // Legacy alias for compatibility
  static addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.createAppointment(appointment);
  }

  static getServices(): ServiceItem[] {
    return this.readData().services;
  }

  static getServiceById(id: string): ServiceItem | undefined {
    return this.readData().services.find((s) => s.id === id);
  }

  static createService(service: Omit<ServiceItem, 'id'> & { id?: string }): ServiceItem {
    const data = this.readData();
    if (!Array.isArray(data.services)) {
      data.services = [];
    }

    const newService: ServiceItem = {
      ...service,
      id: service.id ?? `srv${Date.now()}`,
      active: service.active !== undefined ? service.active : true // Default to active
    };

    data.services.push(newService);
    this.writeData(data);
    
    // Audit log
    this.createAuditLog('create_service', {
      serviceId: newService.id,
      serviceName: newService.name,
      price: newService.price,
    });
    
    return newService;
  }

  static updateService(serviceId: string, updates: Partial<ServiceItem>): ServiceItem | null {
    const data = this.readData();
    const service = data.services.find((s) => s.id === serviceId);
    if (service) {
      Object.assign(service, updates);
      this.writeData(data);
      
      // Audit log - check if activation/deactivation
      const isActivationChange = 'active' in updates;
      const actionType = isActivationChange 
        ? (updates.active === false ? 'deactivate_service' : 'activate_service')
        : 'update_service';
      
      this.createAuditLog(actionType, {
        serviceId,
        serviceName: service.name,
        changes: Object.keys(updates),
        ...(isActivationChange && {
          previousStatus: service.active !== false ? 'active' : 'inactive',
          newStatus: updates.active === false ? 'inactive' : 'active',
        }),
      });
    }
    return service ?? null;
  }

  static deleteService(serviceId: string): void {
    const data = this.readData();

    // Prevent deletion of Consultation service (default service)
    const service = data.services.find((s) => s.id === serviceId);
    const serviceName = service?.name?.trim().toLowerCase() ?? '';
    if (service && (service.id === 'srv001' || serviceName === 'consultation')) {
      throw new Error('Consultation service cannot be deleted as it is a default system service.');
    }

    const serviceToDelete = data.services.find((s) => s.id === serviceId);
    data.services = data.services.filter((s) => s.id !== serviceId);
    this.writeData(data);
    
    // Audit log
    if (serviceToDelete) {
      this.createAuditLog('delete_service', {
        serviceId,
        serviceName: serviceToDelete.name,
      });
    }
  }

  static setServices(services: ServiceItem[]): ServiceItem[] {
    const data = this.readData();
    data.services = Array.isArray(services) ? services.map((service) => ({ ...service })) : [];
    this.writeData(data);
    return data.services;
  }

  private static triggerDataSync() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clinicDataUpdated'));
      // Also trigger storage event for cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: localStorage.getItem(STORAGE_KEY)
      }));
    }
  }

  // Promo management - matching legacy logic exactly
  static getPromos(): Promo[] {
    const data = this.readData();
    return data.promos || [];
  }

  static getPromoById(id: string): Promo | undefined {
    const data = this.readData();
    return (data.promos || []).find((p) => p.id === id);
  }

  static createPromo(promo: Omit<Promo, 'id' | 'createdAt'> & { id?: string; active?: boolean }): Promo {
    const data = this.readData();
    if (!data.promos) {
      data.promos = [];
    }

    const newPromo: Promo = {
      ...promo,
      id: promo.id || `promo${Date.now()}`,
      createdAt: new Date().toISOString(),
      active: promo.active !== undefined ? promo.active : true // Default to active
    } as Promo;

    data.promos.push(newPromo);
    this.writeData(data);
    return newPromo;
  }

  static updatePromo(promoId: string, updates: Partial<Promo>): Promo | null {
    const data = this.readData();
    if (!data.promos) {
      data.promos = [];
    }
    const promo = data.promos.find((p) => p.id === promoId);
    if (promo) {
      Object.assign(promo, updates);
      this.writeData(data);
      
      // Audit log - check if activation/deactivation
      const isActivationChange = 'active' in updates;
      const actionType = isActivationChange 
        ? (updates.active === false ? 'deactivate_promo' : 'activate_promo')
        : 'update_promo';
      
      this.createAuditLog(actionType, {
        promoId,
        promoTitle: promo.title,
        changes: Object.keys(updates),
        ...(isActivationChange && {
          previousStatus: promo.active !== false ? 'active' : 'inactive',
          newStatus: updates.active === false ? 'inactive' : 'active',
        }),
      });
    }
    return promo ?? null;
  }

  static deletePromo(promoId: string): void {
    const data = this.readData();
    if (data.promos) {
      const promo = data.promos.find((p) => p.id === promoId);
      data.promos = data.promos.filter((p) => p.id !== promoId);
      this.writeData(data);
      
      // Audit log
      if (promo) {
        this.createAuditLog('delete_promo', {
          promoId,
          promoTitle: promo.title,
        });
      }
    }
  }

  // Patient management - matching legacy logic exactly
  static getPatients(): PatientProfile[] {
    const data = this.readData();
    return data.patients || [];
  }

  static getPatientById(id: string): PatientProfile | undefined {
    const data = this.readData();
    return data.patients.find((p) => p.id === id);
  }

  static createPatient(patient: Partial<PatientProfile> & { fullName: string }): PatientProfile {
    const data = this.readData();
    if (!data.patients) {
      data.patients = [];
    }

    // Ensure patient has an ID - matching legacy logic
    const newPatient: PatientProfile = {
      ...patient,
      id: patient.id || `pat${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateCreated: patient.dateCreated || new Date().toISOString(),
      role: 'patient',
      username: patient.username || patient.email?.split('@')[0] || `patient_${Date.now()}`,
      password: patient.password || 'patient123',
      email: patient.email || '',
      firstName: patient.firstName || patient.fullName.split(' ')[0] || '',
      lastName: patient.lastName || patient.fullName.split(' ').slice(1).join(' ') || '',
    } as PatientProfile;

    data.patients.push(newPatient);
    this.writeData(data);
    
    // Audit log
    this.createAuditLog('create_patient', {
      patientId: newPatient.id,
      patientName: newPatient.fullName,
      email: newPatient.email,
    });
    
    return newPatient;
  }

  static updatePatient(patientId: string, updates: Partial<PatientProfile>): PatientProfile | null {
    const data = this.readData();
    const patient = data.patients.find((p) => p.id === patientId);
    if (patient) {
      Object.assign(patient, updates);
      this.writeData(data);
      
      // Audit log
      this.createAuditLog('update_patient', {
        patientId,
        patientName: patient.fullName,
        changes: Object.keys(updates),
      });
    }
    return patient ?? null;
  }

  static deletePatient(patientId: string): void {
    const data = this.readData();
    const patient = data.patients.find((p) => p.id === patientId);
    data.patients = data.patients.filter((p) => p.id !== patientId);
    this.writeData(data);
    
    // Audit log
    if (patient) {
      this.createAuditLog('delete_patient', {
        patientId,
        patientName: patient.fullName,
      });
    }
  }

  // Doctor management - matching legacy logic
  static getDoctors(): DoctorProfile[] {
    return this.readData().doctors;
  }

  static getDoctorById(id: string): DoctorProfile | undefined {
    const data = this.readData();
    return data.doctors.find((d) => d.id === id);
  }

  static createDoctor(doctor: Partial<DoctorProfile> & { name: string }): DoctorProfile {
    const data = this.readData();
    const newDoctor: DoctorProfile = {
      ...doctor,
      id: doctor.id || `doc${Date.now()}`,
      specialty: doctor.specialty || '',
      available: doctor.available !== undefined ? doctor.available : true,
    };
    data.doctors.push(newDoctor);
    this.writeData(data);
    
    // Audit log
    this.createAuditLog('create_doctor', {
      doctorId: newDoctor.id,
      doctorName: newDoctor.name,
      specialty: newDoctor.specialty,
    });
    
    return newDoctor;
  }

  static updateDoctor(doctorId: string, updates: Partial<DoctorProfile>): DoctorProfile | null {
    const data = this.readData();
    const doctor = data.doctors.find((d) => d.id === doctorId);
    if (doctor) {
      Object.assign(doctor, updates);
      this.writeData(data);
      
      // Audit log
      this.createAuditLog('update_doctor', {
        doctorId,
        doctorName: doctor.name,
        changes: Object.keys(updates),
      });
    }
    return doctor ?? null;
  }

  static deleteDoctor(doctorId: string): void {
    const data = this.readData();
    const doctor = data.doctors.find((d) => d.id === doctorId);
    data.doctors = data.doctors.filter((d) => d.id !== doctorId);
    this.writeData(data);
    
    // Audit log
    if (doctor) {
      this.createAuditLog('delete_doctor', {
        doctorId,
        doctorName: doctor.name,
      });
    }
  }

  static getClinicSchedule(): ClinicSchedule {
    return this.readData().clinicSchedule ?? defaultClinicSchedule;
  }

  static updateClinicSchedule(schedule: ClinicSchedule): void {
    const data = this.readData();
    data.clinicSchedule = schedule;
    this.writeData(data);
    this.triggerDataSync();
    
    // Create audit log
    const currentUser = this.getCurrentUser();
    this.createAuditLog('update_clinic_schedule', {
      updatedBy: currentUser?.fullName || currentUser?.username || 'System',
      userId: currentUser?.id || 'N/A',
      changes: 'Clinic operating hours updated',
    });
  }

  // Medical history management
  static createMedicalHistory(record: any) {
    const data = this.readData();
    if (!data.medicalHistory) {
      data.medicalHistory = [];
    }
    const newRecord = {
      ...record,
      id: `med${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.medicalHistory.push(newRecord);
    this.writeData(data);
    
    // Get related information for audit log
    const patient = this.getPatientById(record.patientId || '');
    const doctor = this.getDoctorById(record.doctorId || '');
    const service = this.getServiceById(record.serviceId || '');
    
    // Log medical history creation
    this.createAuditLog('create_medical_history', {
      recordId: newRecord.id,
      patientName: patient?.fullName || 'Unknown',
      patientId: record.patientId || 'N/A',
      doctorName: doctor?.name || record.doctorName || 'Unknown',
      serviceName: service?.name || record.serviceName || 'Unknown',
      date: record.date || 'Unknown',
      time: record.time || 'Unknown',
      hasImages: !!(record.images && record.images.length > 0),
      imageCount: record.images?.length || 0,
      hasTreatmentNotes: !!record.treatment,
      hasRemarks: !!record.remarks,
    });
    
    // Notify patient when medical history is uploaded
    if (record.patientId) {
      this.createNotification({
        id: `notif${Date.now()}`,
        type: 'medical_history_uploaded',
        title: 'Medical History Updated',
        message: `New medical history record has been added for your ${service?.name || record.treatment || 'treatment'} on ${record.date || new Date().toLocaleDateString()}. ${record.images && record.images.length > 0 ? `${record.images.length} image(s) included.` : ''}`,
        userId: record.patientId,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    
    return newRecord;
  }

  static getMedicalHistory(): any[] {
    const data = this.readData();
    return data.medicalHistory || [];
  }

  static getMedicalHistoryByPatient(patientId: string): any[] {
    const data = this.readData();
    return (data.medicalHistory || []).filter((record: any) => record.patientId === patientId);
  }

  static getMedicalHistoryById(recordId: string): any | null {
    const data = this.readData();
    return (data.medicalHistory || []).find((record: any) => record.id === recordId) || null;
  }

  static updateMedicalHistory(recordId: string, updates: any): any | null {
    const data = this.readData();
    if (!data.medicalHistory) {
      data.medicalHistory = [];
    }
    const record = data.medicalHistory.find((r: any) => r.id === recordId);
    if (record) {
      const oldRecord = { ...record };
      Object.assign(record, updates);
      record.updatedAt = new Date().toISOString();
      this.writeData(data);
      
      // Get related information for audit log
      const patientId = typeof record.patientId === 'string' ? record.patientId : '';
      const patient = patientId ? this.getPatientById(patientId) : null;
      const changes = Object.keys(updates);
      const imagesArray = Array.isArray(updates.images) ? updates.images : null;
      const oldImagesArray = Array.isArray(oldRecord.images) ? oldRecord.images : [];
      const recordImagesArray = Array.isArray(record.images) ? record.images : [];
      
      // Log medical history update
      this.createAuditLog('update_medical_history', {
        recordId,
        patientName: patient?.fullName || 'Unknown',
        patientId: patientId || 'N/A',
        date: typeof record.date === 'string' ? record.date : 'Unknown',
        time: typeof record.time === 'string' ? record.time : 'Unknown',
        changes: changes,
        updatedFields: changes.join(', '),
        hasNewImages: !!(imagesArray && imagesArray.length > oldImagesArray.length),
        imageCount: recordImagesArray.length,
      });
      
      return record;
    }
    return null;
  }

  static deleteMedicalHistory(recordId: string): void {
    const data = this.readData();
    if (!data.medicalHistory) {
      data.medicalHistory = [];
    }
    const record = data.medicalHistory.find((r: any) => r.id === recordId);
    if (record) {
      // Get related information for audit log before deletion
      const patientId = typeof record.patientId === 'string' ? record.patientId : '';
      const patient = patientId ? this.getPatientById(patientId) : null;
      
      // Log medical history deletion
      this.createAuditLog('delete_medical_history', {
        recordId,
        patientName: patient?.fullName || 'Unknown',
        patientId: patientId || 'N/A',
        date: typeof record.date === 'string' ? record.date : 'Unknown',
        time: typeof record.time === 'string' ? record.time : 'Unknown',
      });
      
      data.medicalHistory = data.medicalHistory.filter((r: any) => r.id !== recordId);
      this.writeData(data);
    }
  }

  static setCurrentUser(user: StaffProfile | PatientProfile) {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  }

  static getCurrentUser(): (StaffProfile | PatientProfile) | null {
    const value = sessionStorage.getItem(SESSION_USER_KEY);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      sessionStorage.removeItem(SESSION_USER_KEY);
      return null;
    }
  }

  static logout() {
    sessionStorage.removeItem(SESSION_USER_KEY);
  }

  static getUserById(userId: string): (StaffProfile | PatientProfile) | null {
    const data = this.readData();
    const user = data.users.find((u) => u.id === userId) ?? data.patients.find((p) => p.id === userId);
    return user || null;
  }

  static updateUser(userId: string, updates: Partial<PatientProfile | StaffProfile>) {
    const data = this.readData();
    const user =
      data.users.find((u) => u.id === userId) ?? data.patients.find((p) => p.id === userId);
    if (!user) return null;
    Object.assign(user, updates);
    this.writeData(data);
    
    // Audit log
    this.createAuditLog('update_user', {
      userId,
      userName: (user as any).fullName || (user as any).username,
      role: user.role,
      changes: Object.keys(updates),
    });
    
    return user;
  }

  static deleteUser(userId: string) {
    const data = this.readData();
    const user = data.users.find((u) => u.id === userId) ?? data.patients.find((p) => p.id === userId);
    const userIndex = data.users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      data.users.splice(userIndex, 1);
      this.writeData(data);
      
      // Audit log
      if (user) {
        this.createAuditLog('delete_staff', {
          userId,
          userName: (user as any).fullName || (user as any).username,
          role: user.role,
        });
      }
      
      return true;
    }
    const patientIndex = data.patients.findIndex((p) => p.id === userId);
    if (patientIndex !== -1) {
      data.patients.splice(patientIndex, 1);
      this.writeData(data);
      
      // Audit log
      if (user) {
        this.createAuditLog('delete_patient', {
          userId,
          userName: (user as any).fullName || (user as any).username,
        });
      }
      
      return true;
    }
    return false;
  }

  // Audit Logs
  static getAuditLogs(): any[] {
    const data = this.readData();
    return data.auditLogs || [];
  }

  static createAuditLog(action: string, details: Record<string, unknown>, userId?: string, userRole?: string): any {
    const data = this.readData();
    if (!data.auditLogs) {
      data.auditLogs = [];
    }

    // Check and auto-export logs older than 6 months
    this.autoExportOldAuditLogs();

    const currentUser = this.getCurrentUser();
    
    // Format details to be more readable and comprehensive
    // Create a simple description from action and key details
    let description = '';
    try {
      const actionName = action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const keyInfo: string[] = [];
      
      if (details.patientName) keyInfo.push(`Patient: ${details.patientName}`);
      if (details.serviceName) keyInfo.push(`Service: ${details.serviceName}`);
      if (details.doctorName) keyInfo.push(`Doctor: ${details.doctorName}`);
      if (details.appointmentId) keyInfo.push(`Appointment ID: ${details.appointmentId}`);
      if (details.oldStatus && details.newStatus) {
        keyInfo.push(`Status: ${details.oldStatus} -> ${details.newStatus}`);
      }
      
      description = keyInfo.length > 0 
        ? `${actionName} - ${keyInfo.join(', ')}`
        : actionName;
    } catch (error) {
      console.error('Error creating audit description:', error);
      description = action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    
    const formattedDetails: Record<string, unknown> = {
      ...details,
      // Add human-readable description
      description,
      // Add timestamp for when the action occurred
      actionTimestamp: new Date().toISOString(),
    };

    const logEntry = {
      id: `audit${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      action,
      details: formattedDetails,
      userId: userId || currentUser?.id || 'system',
      userName: currentUser?.fullName || currentUser?.username || 'System',
      userRole: userRole || currentUser?.role || 'system',
      timestamp: new Date().toISOString(),
      ipAddress: 'N/A', // Would be set by backend in production
    };

    data.auditLogs.push(logEntry);
    
    // Keep only last 1000 logs to prevent storage bloat
    if (data.auditLogs.length > 1000) {
      data.auditLogs = data.auditLogs.slice(-1000);
    }

    this.writeData(data);
    return logEntry;
  }


  static autoExportOldAuditLogs(): void {
    const data = this.readData();
    if (!data.auditLogs || data.auditLogs.length === 0) return;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const oldLogs = data.auditLogs.filter((log: any) => {
      const logDate = new Date(log.timestamp);
      return logDate < sixMonthsAgo;
    });

    if (oldLogs.length === 0) return;

    // Export old logs to CSV
    const csvData = [
      ['Timestamp', 'Action', 'User', 'Role', 'Details'],
      ...oldLogs.map((log: any) => {
        const detailsStr = typeof log.details === 'string' 
          ? log.details 
          : JSON.stringify(log.details);
        return [
          new Date(log.timestamp).toLocaleString('en-US'),
          log.action,
          log.userName,
          log.userRole,
          detailsStr,
        ];
      }),
    ];

    const csvContent = csvData.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const exportDate = new Date().toISOString().split('T')[0];
    a.download = `audit-logs-auto-export-${exportDate}.csv`;
    
    // Trigger download (silently in background)
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Remove old logs from storage
    data.auditLogs = data.auditLogs.filter((log: any) => {
      const logDate = new Date(log.timestamp);
      return logDate >= sixMonthsAgo;
    });

    this.writeData(data);

    // Create notification for all admins
    const allAdmins = this.getAllUsers().filter((u: any) => u.role === 'admin');
    const timestamp = Date.now();
    allAdmins.forEach((admin: any, index: number) => {
      this.createNotification({
        id: `notif${timestamp}_${admin.id}_${index}`,
        type: 'info',
        title: 'Audit Logs Auto-Exported',
        message: `${oldLogs.length} audit log entries older than 6 months have been automatically exported and removed from the system.`,
        userId: admin.id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    });
  }

  static getAuditLogsByUser(userId: string): any[] {
    const data = this.readData();
    return (data.auditLogs || []).filter((log: any) => log.userId === userId);
  }

  static getAuditLogsByAction(action: string): any[] {
    const data = this.readData();
    return (data.auditLogs || []).filter((log: any) => log.action === action);
  }

  static getAuditLogsByDateRange(startDate: string, endDate: string): any[] {
    const data = this.readData();
    return (data.auditLogs || []).filter((log: any) => {
      const logDate = new Date(log.timestamp);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return logDate >= start && logDate <= end;
    });
  }

  // Notifications
  static createNotification(notification: {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'cancellation_request' | 'reschedule_request' | 'appointment_confirmed' | 'appointment_completed' | 'medical_history_uploaded' | 'appointment_rescheduled' | 'cancellation_approved' | 'reschedule_approved' | 'cancellation_rejected' | 'reschedule_rejected' | 'new_appointment' | 'appointment_reminder' | 'new_promotion' | 'patient_document_uploaded';
    title: string;
    message: string;
    userId?: string;
    read: boolean;
    createdAt: string;
  }): void {
    const data = this.readData();
    if (!data.notifications) {
      data.notifications = [];
    }
    data.notifications.push(notification);
    this.writeData(data);
    this.triggerDataSync();
  }

  static getNotifications(userId?: string, role?: string): any[] {
    const data = this.readData();
    const notifications = data.notifications || [];
    if (userId) {
      return notifications.filter((n: any) => {
        // If notification has no userId, don't show it (should always have a userId)
        if (!n.userId) return false;
        
        // Only show notifications where userId matches the current user
        if (n.userId !== userId) return false;
        
        // Additional check: For admin/staff, verify the notification is not for a patient
        if (role === 'admin' || role === 'staff') {
          // Check if the notification's userId belongs to a patient
          const notificationUser = this.getUserById(n.userId);
          if (notificationUser && (notificationUser as any).role === 'patient') {
            // This notification is for a patient, don't show it to admin/staff
            return false;
          }
          
          // Also check message content - patient notifications use "Your appointment" language
          const message = (n.message || '').toLowerCase();
          if (message.includes('your appointment') || message.includes('your ')) {
            // This is a patient-facing notification, don't show to admin/staff
            return false;
          }
        }
        
        // For patients, only show their own notifications (already filtered by userId match above)
        return true;
      });
    }
    return notifications;
  }

  static getUnreadNotifications(userId?: string, role?: string): any[] {
    return this.getNotifications(userId, role).filter((n: any) => !n.read);
  }

  static markNotificationAsRead(notificationId: string): void {
    const data = this.readData();
    const notification = (data.notifications || []).find((n: any) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.writeData(data);
      this.triggerDataSync();
    }
  }

  static deleteNotification(notificationId: string): void {
    const data = this.readData();
    data.notifications = (data.notifications || []).filter((n: any) => n.id !== notificationId);
    this.writeData(data);
    this.triggerDataSync();
  }

  static clearAllNotifications(userId?: string): void {
    const data = this.readData();
    if (userId) {
      // Clear only notifications for this specific user
      data.notifications = (data.notifications || []).filter((n: any) => n.userId !== userId);
    } else {
      // Clear all notifications if no userId provided
      data.notifications = [];
    }
    this.writeData(data);
    this.triggerDataSync();
  }

  /**
   * Reset all data to default values
   * This will clear all appointments, patients (except default), medical history, audit logs, etc.
   * Keeps default admin/staff accounts and services
   */
  static resetAllData(): void {
    try {
      // Reset to default data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      
      // Clear session storage (logout all users)
      sessionStorage.removeItem(SESSION_USER_KEY);
      
      // Trigger data sync event
      this.triggerDataSync();
      
      // Dispatch a custom event to notify all components
      window.dispatchEvent(new CustomEvent('clinicDataReset'));
      
      console.log('All data has been reset to defaults');
    } catch (error) {
      console.error('Error resetting data:', error);
      throw new Error('Failed to reset data');
    }
  }
}

// Ensure defaults are available as soon as the module is imported.
// Only initialize in browser environment and wrap in try-catch to prevent module load errors
if (typeof window !== 'undefined') {
  try {
    StorageService.init();
  } catch (error) {
    console.error('Error initializing StorageService:', error);
  }
}

