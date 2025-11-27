// Storage management for Clinic Appointment System

// Type definitions
type UserRole = 'admin' | 'staff' | 'patient';

interface BaseUser {
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

interface PatientProfile extends BaseUser {
  firstName: string;
  lastName: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
}

interface StaffProfile extends BaseUser {
  jobTitle: string;
}

interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  price?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
}

interface Appointment {
  id?: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  date?: string;
  time?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

interface ClinicScheduleDay {
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

type ClinicSchedule = {
  Monday: ClinicScheduleDay;
  Tuesday: ClinicScheduleDay;
  Wednesday: ClinicScheduleDay;
  Thursday: ClinicScheduleDay;
  Friday: ClinicScheduleDay;
  Saturday: ClinicScheduleDay;
  Sunday: ClinicScheduleDay;
};

interface Schedule {
  id: string;
  doctorId: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface Promo {
  id: string;
  title: string;
  description: string;
  discount: string;
  price: string;
  originalPrice?: string;
  promoPrice?: string;
  validUntil?: string;
  createdAt: string;
}

interface SessionImage {
  id: string;
  patientId: string;
  uploadedAt: string;
  [key: string]: unknown;
}

interface MedicalHistoryRecord {
  id: string;
  patientId: string;
  createdAt: string;
  [key: string]: unknown;
}

interface AuditLog {
  id: string;
  timestamp: string;
  type: string;
  action: string;
  details: unknown;
  userId: string;
  userName: string;
}

interface Notification {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  action: string | null;
  actionData: unknown;
}

interface ClinicData {
  users: StaffProfile[];
  patients: PatientProfile[];
  doctors: DoctorProfile[];
  services: ServiceItem[];
  appointments: Appointment[];
  medicalHistory: MedicalHistoryRecord[];
  promos: Promo[];
  clinicSchedule: ClinicSchedule;
  schedules: Schedule[];
  sessionImages?: SessionImage[];
  auditLogs?: AuditLog[];
  notifications?: Notification[];
}

interface CreateUserInput {
  username: string;
  password: string;
  role: UserRole;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
  jobTitle?: string;
}

interface CreateNotificationInput {
  type?: string;
  title?: string;
  message?: string;
  userId?: string;
  action?: string | null;
  actionData?: unknown;
}

// Utility function to generate unique ID
function generateId(): string {
  return 'id' + Date.now() + Math.random().toString(36).substr(2, 9);
}

const STORAGE_KEY = 'clinicData';

const defaultClinicSchedule: ClinicSchedule = {
  Monday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
  Tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
  Wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
  Thursday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
  Friday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
  Saturday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
  Sunday: { isOpen: false, startTime: '09:00', endTime: '18:00' }
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
    { id: 'srv001', name: 'Consultation', description: 'Dental consultation - P500 only, but FREE if you avail any dental procedures. Get ready to flash those pearly whites without breaking the bank!', duration: '30 mins', price: '₱500 (Free with any dental procedure)' },
    { id: 'srv002', name: 'Simple Tooth Extraction', description: 'Simple extraction of teeth. Affordable dental service at unbeatable prices!', duration: '30 mins', price: '₱500 minimum per tooth' },
    { id: 'srv003', name: 'Wisdom Tooth Extraction', description: 'Wisdom tooth extraction procedure. Quality dental care at affordable prices!', duration: '45 mins', price: '₱3,000 minimum per tooth' },
    { id: 'srv004', name: 'Impacted Wisdom Tooth Extraction', description: 'Impacted wisdom tooth extraction - P8k to P10K minimum per tooth (limited time offer only). Don\'t miss out on our amazing promo!', duration: '120 mins', price: '₱8,000 - ₱10,000 minimum per tooth' },
    { id: 'srv005', name: 'Cleaning', description: 'Dental cleaning - starting amount is P500 for mild or light cases, if above light cases there is additional fees. Experience quality dental care!', duration: '30 mins', price: '₱500 (mild/light cases), additional fees for severe cases' },
    { id: 'srv006', name: 'Pasta/Dental Fillings', description: 'Dental fillings - starting amount is P500 for mild or light cases, if above light cases there is additional fees. Affordable dental services!', duration: '30 mins', price: '₱500 (mild/light cases), additional fees for severe cases' },
    { id: 'srv007', name: 'Dentures (1-3 tooth)', description: 'Dentures for 1-3 missing teeth per arch. Affordable prices that will make you smile!', duration: '60 mins', price: '₱5,000 per arch' },
    { id: 'srv008', name: 'Dentures (4-5 tooth)', description: 'Dentures for 4-5 missing teeth per arch. Quality dental care at unbeatable prices!', duration: '60 mins', price: '₱5,500 per arch' },
    { id: 'srv009', name: 'Dentures (6-7 tooth)', description: 'Dentures for 6-7 missing teeth per arch. Book now and save!', duration: '60 mins', price: '₱6,000 per arch' },
    { id: 'srv010', name: 'Dentures (8+ tooth)', description: 'Dentures for 8 and above missing teeth per arch. Affordable dental services!', duration: '60 mins', price: '₱7,000 per arch' },
    { id: 'srv011', name: 'Root Canal', description: 'Root canal treatment - 7k per canal. Quality dental care at affordable prices!', duration: '90 mins', price: '₱7,000 per canal' },
    { id: 'srv012', name: 'Jacket/Crown', description: 'Jacket/Crown - 6K per unit (porcelain fused to metal). Affordable dental services!', duration: '45 mins', price: '₱6,000 per unit' },
    { id: 'srv013', name: 'Veneers', description: 'Veneers - 3500 to 5k per unit. Get ready to flash those pearly whites!', duration: '90 mins', price: '₱3,500 - ₱5,000 per unit' },
    { id: 'srv014', name: 'Teeth Whitening (2 cycles)', description: 'Teeth whitening with 2 cycles - 6K with free light case cleaning. Book your appointment today!', duration: '60 mins', price: '₱6,000 (includes free light case cleaning)' },
    { id: 'srv015', name: 'Teeth Whitening (3 cycles)', description: 'Teeth whitening with 3 cycles - 8k with free light case cleaning. Experience quality dental care!', duration: '90 mins', price: '₱8,000 (includes free light case cleaning)' },
    { id: 'srv016', name: 'Panoramic X-Ray', description: 'Panoramic X-Ray - P1k. Full mouth panoramic X-ray imaging at affordable prices!', duration: '15 mins', price: '₱1,000' },
    { id: 'srv017', name: 'Periapical X-Ray', description: 'Periapical X-Ray - P300. Detailed X-ray of specific tooth area. Affordable dental services!', duration: '10 mins', price: '₱300' },
    { id: 'srv018', name: 'Oral Surgery', description: 'Oral Surgery - P8k to P10k per unit. Quality dental care at unbeatable prices!', duration: '120 mins', price: '₱8,000 - ₱10,000 per unit' },
    { id: 'srv021', name: 'Braces Adjustment', description: 'Regular braces adjustment. Included in braces package or ₱500-₱1,000 per session. Book now and save!', duration: '15 mins', price: 'Included in braces package or ₱500-₱1,000 per session' },
    { id: 'srv022', name: 'Braces Removal', description: 'Removal Fee for existing braces: P2000 with free light case cleaning. Don\'t miss out on our amazing promo!', duration: '30 mins', price: '₱2,000 (includes free light case cleaning)' }
  ],
  appointments: [],
  medicalHistory: [],
  promos: [
    {
      id: 'promo001',
      title: '❆ BER MONTHS PROMO ❆ - Upper and Lower Metal Braces',
      description: 'Upper and Lower Metal Braces Package - Down Payment: ₱3,500 | Monthly Adjustment: ₱1,000 | Total Package: ₱30,000 starting (price may vary depending on severity). Includes: Panoramic X-Ray, Light Case Cleaning, 1 Simple Bunot, 1 Pasta (Molars that are not previously restored), Retainer After Braces (for upper and lower braces only), Fluoride After Braces, Intra & Extra Oral Photos, Uni Gum Sore Treatment, Ortho Kit. Possible Same Day Installation!',
      discount: 'BER MONTHS SPECIAL',
      price: '₱30,000',
      originalPrice: '₱35,000+',
      promoPrice: '₱30,000',
      validUntil: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: 'promo002',
      title: '❆ BER MONTHS PROMO ❆ - Upper OR Lower Metal Braces',
      description: 'Upper OR Lower Metal Braces Package - Down Payment: ₱3,000 | Monthly Adjustment: ₱500 | Total Package: ₱20,000 starting. Includes: Panoramic X-Ray, Light Case Cleaning, 1 Simple Bunot, 1 Pasta (Molars that are not previously restored), Retainer After Braces, Fluoride After Braces, Intra & Extra Oral Photos, Uni Gum Sore Treatment, Ortho Kit. Possible Same Day Installation!',
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

const Storage = {
  // Initialize default data
  init(): void {
    const existingData = localStorage.getItem(STORAGE_KEY);
    
    if (!existingData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    } else {
      // Ensure auditLogs and notifications exist in existing data
      const data = JSON.parse(existingData) as ClinicData;
      if (!data.auditLogs) {
        data.auditLogs = [];
      }
      if (!data.notifications) {
        data.notifications = [];
      }
      
      // Ensure promos array exists and add Ber Months promo if not present
      if (!data.promos) {
        data.promos = [];
      }
      
      // Check if Ber Months promo already exists
      const berMonthsPromoExists = data.promos.some(p => p.id === 'promo001' || (p.title && p.title.includes('BER MONTHS')));
      
      if (!berMonthsPromoExists) {
        // Add Ber Months promos
        data.promos.push(
          {
            id: 'promo001',
            title: '❆ BER MONTHS PROMO ❆',
            description: 'Upper and Lower Metal Braces Package - Down Payment: ₱3,500 | Monthly Adjustment: ₱1,000 | Total Package: ₱30,000 starting (price may vary depending on severity). Includes: Panoramic X-Ray, Light Case Cleaning, 1 Simple Bunot, 1 Pasta (Molars that are not previously restored), Retainer After Braces (for upper and lower braces only), Fluoride After Braces, Intra & Extra Oral Photos, Uni Gum Sore Treatment, Ortho Kit. Possible Same Day Installation!',
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
            description: 'Upper OR Lower Metal Braces Package - Down Payment: ₱3,000 | Monthly Adjustment: ₱500 | Total Package: ₱20,000 starting. Includes: Panoramic X-Ray, Light Case Cleaning, 1 Simple Bunot, 1 Pasta (Molars that are not previously restored), Retainer After Braces, Fluoride After Braces, Intra & Extra Oral Photos, Uni Gum Sore Treatment, Ortho Kit. Possible Same Day Installation!',
            discount: 'BER MONTHS SPECIAL',
            price: '₱20,000',
            originalPrice: '₱25,000+',
            promoPrice: '₱20,000',
            validUntil: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          }
        );
      }
      
      // Update services with new default services (merge and update)
      if (!data.services) {
        data.services = [];
      }
      
      // Create a map of existing services by ID
      const existingServicesMap = new Map<string, ServiceItem>();
      data.services.forEach((service: ServiceItem) => {
        if (service && service.id) {
          existingServicesMap.set(service.id, service);
        }
      });
      
      // Remove braces services (srv019, srv020) from services - they should only be in promotions
      data.services = data.services.filter((service: ServiceItem) => 
        service && service.id && service.id !== 'srv019' && service.id !== 'srv020'
      );
      
      // Update or add default services
      defaultData.services.forEach((defaultService: ServiceItem) => {
        const existing = existingServicesMap.get(defaultService.id);
        if (existing && existing.id !== 'srv019' && existing.id !== 'srv020') {
          // Update existing service with new description, price, etc. but preserve any custom data
          Object.assign(existing, {
            name: defaultService.name,
            description: defaultService.description,
            duration: defaultService.duration,
            price: defaultService.price
          });
        } else if (defaultService.id !== 'srv019' && defaultService.id !== 'srv020') {
          // Add missing default service (but not the braces services)
          data.services.push({ ...defaultService });
        }
      });
      
      // Ensure services array is properly initialized
      if (!Array.isArray(data.services)) {
        data.services = [...defaultData.services];
      }
      
      // Ensure promotions are updated with better titles
      if (!data.promos) {
        data.promos = [];
      }
      
      // Update or add BER MONTHS promos
      const promo001 = data.promos.find((p: Promo) => p.id === 'promo001');
      const promo002 = data.promos.find((p: Promo) => p.id === 'promo002');
      
      const defaultPromo001 = defaultData.promos.find((p: Promo) => p.id === 'promo001');
      const defaultPromo002 = defaultData.promos.find((p: Promo) => p.id === 'promo002');
      
      if (defaultPromo001) {
        if (promo001) {
          Object.assign(promo001, defaultPromo001);
        } else {
          data.promos.push({ ...defaultPromo001 });
        }
      }
      
      if (defaultPromo002) {
        if (promo002) {
          Object.assign(promo002, defaultPromo002);
        } else {
          data.promos.push({ ...defaultPromo002 });
        }
      }
      
      // Ensure schedules array exists and migrate default schedules
      if (!data.schedules) {
        data.schedules = [];
      }
      
      // Create a map of existing schedules by ID
      const existingSchedulesMap = new Map<string, Schedule>();
      data.schedules.forEach((schedule: Schedule) => {
        if (schedule && schedule.id) {
          existingSchedulesMap.set(schedule.id, schedule);
        }
      });
      
      // Add missing default schedules
      defaultData.schedules.forEach((defaultSchedule: Schedule) => {
        const existing = existingSchedulesMap.get(defaultSchedule.id);
        if (!existing) {
          // Add missing default schedule
          data.schedules.push({ ...defaultSchedule });
        }
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  },

  // Get all data
  getData(): ClinicData {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      this.init();
      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ClinicData;
    }
    return JSON.parse(data) as ClinicData;
  },

  // Save all data
  saveData(data: ClinicData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Trigger sync event after writing data
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clinicDataUpdated'));
      // Also trigger storage event for cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: localStorage.getItem(STORAGE_KEY)
      }));
      // Update lastDataUpdate timestamp for cross-tab sync
      localStorage.setItem('lastDataUpdate', Date.now().toString());
    }
  },

  // User management
  getAllUsers(): Array<StaffProfile | PatientProfile> {
    const data = this.getData();
    return [...data.users, ...data.patients];
  },

  getUserById(id: string): StaffProfile | PatientProfile | undefined {
    const users = this.getAllUsers();
    return users.find(u => u.id === id);
  },

  getUserByUsername(username: string): StaffProfile | PatientProfile | undefined {
    const users = this.getAllUsers();
    return users.find(u => u.username === username);
  },

  getUserByEmail(email: string): StaffProfile | PatientProfile | undefined {
    const users = this.getAllUsers();
    return users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(user: CreateUserInput): StaffProfile | PatientProfile {
    const data = this.getData();
    const newUser: StaffProfile | PatientProfile = {
      ...user,
      id: 'user' + Date.now(),
      dateCreated: new Date().toISOString()
    } as StaffProfile | PatientProfile;
    
    if (newUser.role === 'patient') {
      // Ensure firstName and lastName are set for patients
      const patientUser = newUser as PatientProfile;
      if (!patientUser.firstName || !patientUser.lastName) {
        const nameParts = patientUser.fullName.split(' ');
        patientUser.firstName = nameParts[0] || '';
        patientUser.lastName = nameParts.slice(1).join(' ') || '';
      }
      data.patients.push(patientUser);
    } else {
      data.users.push(newUser as StaffProfile);
    }
    this.saveData(data);
    return newUser;
  },

  updateUser(userId: string, updates: Partial<StaffProfile | PatientProfile>): StaffProfile | PatientProfile | undefined {
    const data = this.getData();
    let user = data.users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
    } else {
      user = data.patients.find(u => u.id === userId);
      if (user) Object.assign(user, updates);
    }
    this.saveData(data);
    return user;
  },

  deleteUser(userId: string): void {
    const data = this.getData();
    data.users = data.users.filter(u => u.id !== userId);
    data.patients = data.patients.filter(u => u.id !== userId);
    this.saveData(data);
  },

  // Patient management
  getPatients(): PatientProfile[] {
    const data = this.getData();
    return data.patients || [];
  },

  getPatientById(id: string): PatientProfile | undefined {
    const data = this.getData();
    return data.patients.find(p => p.id === id);
  },

  // Doctor management
  getDoctors(): DoctorProfile[] {
    const data = this.getData();
    return data.doctors;
  },

  getDoctorById(id: string): DoctorProfile | undefined {
    const data = this.getData();
    return data.doctors.find(d => d.id === id);
  },

  createDoctor(doctor: Omit<DoctorProfile, 'id'>): DoctorProfile {
    const data = this.getData();
    const newDoctor: DoctorProfile = {
      ...doctor,
      id: 'doc' + Date.now()
    };
    data.doctors.push(newDoctor);
    this.saveData(data);
    return newDoctor;
  },

  updateDoctor(doctorId: string, updates: Partial<DoctorProfile>): DoctorProfile | undefined {
    const data = this.getData();
    const doctor = data.doctors.find(d => d.id === doctorId);
    if (doctor) {
      Object.assign(doctor, updates);
      this.saveData(data);
    }
    return doctor;
  },

  deleteDoctor(doctorId: string): void {
    const data = this.getData();
    data.doctors = data.doctors.filter(d => d.id !== doctorId);
    this.saveData(data);
  },

  // Service management
  getServices(): ServiceItem[] {
    const data = this.getData();
    let services = Array.isArray(data.services) ? [...data.services] : [];
    let modified = false;
    
    // Normalize names and durations to avoid whitespace-related duplicates
    services = services.map(service => {
      if (!service) return service;
      const trimmedName = typeof service.name === 'string' ? service.name.trim() : service.name;
      const trimmedDuration = typeof service.duration === 'string' ? service.duration.trim() : service.duration;
      if (trimmedName !== service.name || trimmedDuration !== service.duration) {
        modified = true;
        return { ...service, name: trimmedName, duration: trimmedDuration };
      }
      return service;
    });
    
    // Remove duplicate services by ID (not by name, as multiple services can have similar names)
    const seenById = new Map<string, ServiceItem>();
    const uniqueServices: ServiceItem[] = [];
    services.forEach(service => {
      if (!service || !service.id) return;
      // Only remove if it's a true duplicate (same ID)
      if (seenById.has(service.id)) {
        // Keep the first one, skip duplicates with same ID
        modified = true;
        return;
      }
      seenById.set(service.id, service);
      uniqueServices.push(service);
    });
    
    services = uniqueServices;
    
    // Ensure Consultation service is always present (default service)
    const consultationService: ServiceItem = {
      id: 'srv001',
      name: 'Consultation',
      description: 'Dental consultation - P500 only, but FREE if you avail any dental procedures',
      duration: '30 mins',
      price: '₱500 (Free with any dental procedure)'
    };
    
    const hasConsultation = services.some(s => s && (s.id === 'srv001' || (typeof s.name === 'string' && s.name.trim().toLowerCase() === 'consultation')));
    if (!hasConsultation) {
      services.unshift(consultationService);
      modified = true;
    } else {
      // Ensure Consultation is at the beginning if it exists
      const consultationIndex = services.findIndex(s => s && (s.id === 'srv001' || (typeof s.name === 'string' && s.name.trim().toLowerCase() === 'consultation')));
      if (consultationIndex > 0) {
        const consultation = services.splice(consultationIndex, 1)[0];
        services.unshift(consultation);
        modified = true;
      }
    }
    
    if (modified) {
      data.services = services;
      this.saveData(data);
    }
    
    return services;
  },

  getServiceById(id: string): ServiceItem | undefined {
    const data = this.getData();
    const service = data.services.find(s => s.id === id);
    
    if (id === 'srv001' && service) {
      // Verify it's actually Consultation
      const serviceName = typeof service.name === 'string' ? service.name.trim().toLowerCase() : '';
      if (serviceName !== 'consultation') {
        console.info('Auto-correcting srv001 back to Consultation. Found:', service.name);
        const correctedService: ServiceItem = {
          ...service,
          id: 'srv001',
          name: 'Consultation',
          description: service.description || 'Dental consultation - P500 only, but FREE if you avail any dental procedures',
          duration: service.duration || '30 mins',
          price: service.price || '₱500 (Free with any dental procedure)'
        };

        // Persist correction once so future reads are clean
        const allServices = this.getData();
        const index = allServices.services.findIndex(s => s.id === 'srv001');
        if (index !== -1) {
          allServices.services[index] = correctedService;
          this.saveData(allServices);
        }

        return correctedService;
      }
    }
    
    return service;
  },

  createService(service: Partial<ServiceItem> & { name: string }): ServiceItem {
    const data = this.getData();
    if (!Array.isArray(data.services)) {
      data.services = [];
    }
    
    const newService: ServiceItem = {
      ...service
    } as ServiceItem;
    
    if (!newService.id) {
      newService.id = 'srv' + Date.now();
    }
    
    // Ensure timestamps exist for consistency with backend payloads
    const timestamp = new Date().toISOString();
    if (!newService.createdAt && !newService.created_at) {
      newService.createdAt = timestamp;
    }
    newService.updatedAt = timestamp;
    
    data.services.push(newService);
    this.saveData(data);
    return newService;
  },
  
  setServices(services: ServiceItem[]): ServiceItem[] {
    const data = this.getData();
    data.services = Array.isArray(services) 
      ? services.map(service => ({ ...service }))
      : [];
    this.saveData(data);
    return data.services;
  },

  updateService(serviceId: string, updates: Partial<ServiceItem>): ServiceItem | undefined {
    const data = this.getData();
    const service = data.services.find(s => s.id === serviceId);
    if (service) {
      Object.assign(service, updates);
      this.saveData(data);
    }
    return service;
  },

  deleteService(serviceId: string): void {
    const data = this.getData();
    
    // Prevent deletion of Consultation service (default service)
    const service = data.services.find(s => s.id === serviceId);
    const serviceName = service && typeof service.name === 'string' ? service.name.trim().toLowerCase() : '';
    if (service && (service.id === 'srv001' || serviceName === 'consultation')) {
      throw new Error('Consultation service cannot be deleted as it is a default system service.');
    }
    
    data.services = data.services.filter(s => s.id !== serviceId);
    this.saveData(data);
  },

  // Appointment management
  getAppointments(): Appointment[] {
    const data = this.getData();
    return data.appointments;
  },

  getAppointmentById(id: string): Appointment | undefined {
    const data = this.getData();
    return data.appointments.find(a => a.id === id);
  },

  getAppointmentsByPatient(patientId: string): Appointment[] {
    const data = this.getData();
    return data.appointments.filter(a => a.patientId === patientId);
  },

  getAppointmentsByDoctor(doctorId: string): Appointment[] {
    const data = this.getData();
    return data.appointments.filter(a => a.doctorId === doctorId);
  },

  createPatient(patient: Partial<PatientProfile> & { username: string; password: string; email: string; fullName: string; firstName: string; lastName: string }): PatientProfile {
    const data = this.getData();
    if (!data.patients) {
      data.patients = [];
    }
    // Ensure patient has an ID
    const newPatient: PatientProfile = {
      ...patient,
      id: patient.id || ('pat' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
      dateCreated: patient.dateCreated || new Date().toISOString(),
      role: 'patient'
    } as PatientProfile;
    data.patients.push(newPatient);
    this.saveData(data);
    return newPatient;
  },

  createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Appointment {
    const data = this.getData();
    
    // Validate required fields - support both date/time and appointmentDate/appointmentTime
    const hasDate = appointment.date || appointment.appointmentDate;
    const hasTime = appointment.time || appointment.appointmentTime;
    
    if (!appointment.patientId || !appointment.doctorId || !appointment.serviceId || !hasDate || !hasTime) {
      throw new Error('Missing required appointment fields. All fields must be filled.');
    }
    
    // Normalize date and time fields for consistency
    const appointmentDate = appointment.date || appointment.appointmentDate!;
    const appointmentTime = appointment.time || appointment.appointmentTime!;
    
    const newAppointment: Appointment = {
      ...appointment,
      date: appointmentDate,
      time: appointmentTime,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime
    };
    
    // Check for double-booking (same doctor, date, and time, excluding cancelled)
    const conflictingAppointment = data.appointments.find(a => {
      const aDate = a.date || a.appointmentDate;
      const aTime = a.time || a.appointmentTime;
      return a.doctorId === newAppointment.doctorId &&
             aDate === appointmentDate &&
             aTime === appointmentTime &&
             a.status !== 'cancelled' &&
             a.id !== newAppointment.id;
    });
    
    if (conflictingAppointment) {
      throw new Error('This time slot is already booked. Please select a different time.');
    }
    
    // Check maximum 5 appointments per time slot (same date and time, excluding cancelled)
    const appointmentsAtSameTime = data.appointments.filter(a => {
      const aDate = a.date || a.appointmentDate;
      const aTime = a.time || a.appointmentTime;
      return aDate === appointmentDate &&
             aTime === appointmentTime &&
             a.status !== 'cancelled' &&
             a.id !== newAppointment.id;
    });
    
    if (appointmentsAtSameTime.length >= 5) {
      throw new Error('This time slot is fully booked. Maximum 5 appointments per time slot. Please select a different time.');
    }
    
    // Check maximum 15 appointments per day (same date, excluding cancelled)
    const appointmentsOnSameDate = data.appointments.filter(a => {
      const aDate = a.date || a.appointmentDate;
      return aDate === appointmentDate &&
             a.status !== 'cancelled' &&
             a.id !== newAppointment.id;
    });
    
    if (appointmentsOnSameDate.length >= 15) {
      throw new Error('This date is fully booked. Maximum 15 appointments per day. Please select a different date.');
    }
    
    // Only save if all validations pass
    newAppointment.id = 'apt' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    newAppointment.createdAt = new Date().toISOString();
    newAppointment.updatedAt = new Date().toISOString();
    data.appointments.push(newAppointment);
    this.saveData(data);
    return newAppointment;
  },

  updateAppointment(appointmentId: string, updates: Partial<Appointment>): Appointment {
    const data = this.getData();
    const appointment = data.appointments.find(a => a.id === appointmentId);
    if (appointment) {
      Object.assign(appointment, updates);
      appointment.updatedAt = new Date().toISOString();
      this.saveData(data);
      return appointment;
    }
    throw new Error('Appointment not found');
  },

  deleteAppointment(appointmentId: string): void {
    const data = this.getData();
    data.appointments = data.appointments.filter(a => a.id !== appointmentId);
    this.saveData(data);
  },

  // Session Images Management (for treatment documentation)
  getSessionImages(): SessionImage[] {
    const data = this.getData();
    return data.sessionImages || [];
  },

  getSessionImagesByPatient(patientId: string): SessionImage[] {
    const data = this.getData();
    const sessionImages = data.sessionImages || [];
    return sessionImages.filter(img => img.patientId === patientId);
  },

  getSessionImageById(imageId: string): SessionImage | undefined {
    const data = this.getData();
    const sessionImages = data.sessionImages || [];
    return sessionImages.find(img => img.id === imageId);
  },

  createSessionImage(imageData: Omit<SessionImage, 'id' | 'uploadedAt'>): SessionImage {
    const data = this.getData();
    if (!data.sessionImages) {
      data.sessionImages = [];
    }
    const newImage: SessionImage = {
      id: 'img' + Date.now(),
      uploadedAt: new Date().toISOString(),
      ...imageData
    } as SessionImage;
    data.sessionImages.push(newImage);
    this.saveData(data);
    return newImage;
  },

  updateSessionImage(imageId: string, updates: Partial<SessionImage>): SessionImage | undefined {
    const data = this.getData();
    const sessionImages = data.sessionImages || [];
    const image = sessionImages.find(img => img.id === imageId);
    if (image) {
      Object.assign(image, updates);
      this.saveData(data);
    }
    return image;
  },

  deleteSessionImage(imageId: string): void {
    const data = this.getData();
    if (data.sessionImages) {
      data.sessionImages = data.sessionImages.filter(img => img.id !== imageId);
      this.saveData(data);
    }
  },

  // Schedule management
  getSchedules(): Schedule[] {
    const data = this.getData();
    return data.schedules;
  },

  getSchedulesByDoctor(doctorId: string): Schedule[] {
    const data = this.getData();
    return data.schedules.filter(s => s.doctorId === doctorId);
  },

  getScheduleById(scheduleId: string): Schedule | undefined {
    const data = this.getData();
    return data.schedules.find(s => s.id === scheduleId);
  },

  createSchedule(schedule: Omit<Schedule, 'id'>): Schedule {
    const data = this.getData();
    const newSchedule: Schedule = {
      ...schedule,
      id: 'sch' + Date.now()
    };
    data.schedules.push(newSchedule);
    this.saveData(data);
    return newSchedule;
  },

  updateSchedule(scheduleId: string, updates: Partial<Schedule>): Schedule | undefined {
    const data = this.getData();
    const schedule = data.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      Object.assign(schedule, updates);
      this.saveData(data);
    }
    return schedule;
  },

  deleteSchedule(scheduleId: string): void {
    const data = this.getData();
    data.schedules = data.schedules.filter(s => s.id !== scheduleId);
    this.saveData(data);
  },

  // Medical History management
  getMedicalHistory(): MedicalHistoryRecord[] {
    const data = this.getData();
    return data.medicalHistory || [];
  },

  getMedicalHistoryByPatient(patientId: string): MedicalHistoryRecord[] {
    const data = this.getData();
    const medicalHistory = data.medicalHistory || [];
    return medicalHistory.filter(record => record.patientId === patientId);
  },

  getMedicalHistoryById(recordId: string): MedicalHistoryRecord | undefined {
    const data = this.getData();
    const medicalHistory = data.medicalHistory || [];
    return medicalHistory.find(record => record.id === recordId);
  },

  createMedicalHistory(record: Omit<MedicalHistoryRecord, 'id' | 'createdAt'>): MedicalHistoryRecord {
    const data = this.getData();
    if (!data.medicalHistory) {
      data.medicalHistory = [];
    }
    const newRecord: MedicalHistoryRecord = {
      id: 'med' + Date.now(),
      createdAt: new Date().toISOString(),
      ...record
    } as MedicalHistoryRecord;
    data.medicalHistory.push(newRecord);
    this.saveData(data);
    return newRecord;
  },

  updateMedicalHistory(recordId: string, updates: Partial<MedicalHistoryRecord>): MedicalHistoryRecord | undefined {
    const data = this.getData();
    if (!data.medicalHistory) {
      data.medicalHistory = [];
    }
    const record = data.medicalHistory.find(r => r.id === recordId);
    if (record) {
      Object.assign(record, updates);
      this.saveData(data);
    }
    return record;
  },

  deleteMedicalHistory(recordId: string): void {
    const data = this.getData();
    if (data.medicalHistory) {
      data.medicalHistory = data.medicalHistory.filter(r => r.id !== recordId);
      this.saveData(data);
    }
  },

  // Promo management
  getPromos(): Promo[] {
    const data = this.getData();
    return data.promos || [];
  },

  getPromoById(id: string): Promo | undefined {
    const data = this.getData();
    const promos = data.promos || [];
    return promos.find(p => p.id === id);
  },

  createPromo(promo: Omit<Promo, 'id' | 'createdAt'>): Promo {
    const data = this.getData();
    if (!data.promos) {
      data.promos = [];
    }
    const newPromo: Promo = {
      ...promo,
      id: 'promo' + Date.now(),
      createdAt: new Date().toISOString()
    };
    data.promos.push(newPromo);
    this.saveData(data);
    return newPromo;
  },

  updatePromo(promoId: string, updates: Partial<Promo>): Promo | undefined {
    const data = this.getData();
    if (!data.promos) {
      data.promos = [];
    }
    const promo = data.promos.find(p => p.id === promoId);
    if (promo) {
      Object.assign(promo, updates);
      this.saveData(data);
    }
    return promo;
  },

  deletePromo(promoId: string): void {
    const data = this.getData();
    if (data.promos) {
      data.promos = data.promos.filter(p => p.id !== promoId);
      this.saveData(data);
    }
  },

  // Clinic Schedule management
  getClinicSchedule(): ClinicSchedule {
    const data = this.getData();
    return data.clinicSchedule || defaultClinicSchedule;
  },

  updateClinicSchedule(schedule: ClinicSchedule): ClinicSchedule {
    const data = this.getData();
    data.clinicSchedule = schedule;
    this.saveData(data);
    return schedule;
  },

  // Session management
  setCurrentUser(user: StaffProfile | PatientProfile): void {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  },

  getCurrentUser(): StaffProfile | PatientProfile | null {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  logout(): void {
    sessionStorage.removeItem('currentUser');
  },

  // Audit Log management
  getAuditLogs(): AuditLog[] {
    const data = this.getData();
    return data.auditLogs || [];
  },

  saveAuditLogs(auditLogs: AuditLog[]): void {
    const data = this.getData();
    data.auditLogs = auditLogs;
    this.saveData(data);
  },

  clearAuditLogs(): void {
    const data = this.getData();
    data.auditLogs = [];
    this.saveData(data);
  },

  // Notification management
  getNotifications(userId: string | null = null): Notification[] {
    const data = this.getData();
    const notifications = data.notifications || [];
    
    // Filter by user if specified, otherwise return all
    if (userId) {
      return notifications.filter(n => n.userId === userId || n.userId === 'all');
    }
    return notifications;
  },

  getUnreadNotifications(userId: string | null = null): Notification[] {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => !n.read);
  },

  addNotification(notification: CreateNotificationInput): Notification {
    const data = this.getData();
    if (!data.notifications) {
      data.notifications = [];
    }
    
    const notificationEntry: Notification = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: notification.type || 'info',
      title: notification.title || 'Notification',
      message: notification.message || '',
      userId: notification.userId || 'all',
      read: false,
      action: notification.action || null,
      actionData: notification.actionData || null
    };
    
    data.notifications.unshift(notificationEntry);
    
    // Keep only last 500 notifications
    if (data.notifications.length > 500) {
      data.notifications.splice(500);
    }
    
    this.saveData(data);
    
    // Trigger notification event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notificationEntry }));
    }
    
    return notificationEntry;
  },

  markNotificationAsRead(notificationId: string): void {
    const data = this.getData();
    const notification = data.notifications?.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveData(data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notificationRead', { detail: notificationId }));
      }
    }
  },

  markAllNotificationsAsRead(userId: string | null = null): void {
    const data = this.getData();
    const notifications = data.notifications || [];
    
    notifications.forEach(n => {
      if ((!userId || n.userId === userId || n.userId === 'all') && !n.read) {
        n.read = true;
      }
    });
    
    this.saveData(data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allNotificationsRead'));
    }
  },

  deleteNotification(notificationId: string): void {
    const data = this.getData();
    if (data.notifications) {
      data.notifications = data.notifications.filter(n => n.id !== notificationId);
      this.saveData(data);
    }
  },

  clearNotifications(userId: string | null = null): void {
    const data = this.getData();
    if (userId) {
      data.notifications = (data.notifications || []).filter(n => n.userId !== userId && n.userId !== 'all');
    } else {
      data.notifications = [];
    }
    this.saveData(data);
  }
};

// Make Storage available globally and initialize
if (typeof window !== 'undefined') {
  (window as any).Storage = Storage;
  Storage.init();
}

// Export types for use in other files
export type {
  UserRole,
  BaseUser,
  PatientProfile,
  StaffProfile,
  DoctorProfile,
  ServiceItem,
  Appointment,
  ClinicSchedule,
  ClinicScheduleDay,
  Schedule,
  Promo,
  SessionImage,
  MedicalHistoryRecord,
  AuditLog,
  Notification,
  ClinicData,
  CreateUserInput,
  CreateNotificationInput
};

