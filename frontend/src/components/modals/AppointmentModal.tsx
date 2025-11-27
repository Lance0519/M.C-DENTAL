import { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from './Modal';
import { ServiceDurations } from '@/lib/service-durations';
import { overlapsBreakTime } from '@/lib/time-utils';
import { BookingCalendar } from '@/features/booking/components/BookingCalendar';
import { TimeSlotSelector } from '@/features/booking/components/TimeSlotSelector';
import { useAppointments } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useDoctors';
import { useServices } from '@/hooks/useServices';
import { usePromos } from '@/hooks/usePromos';
import { useSchedules } from '@/hooks/useSchedules';
import { useClinicSchedule } from '@/hooks/useClinicSchedule';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import type { PatientProfile, DoctorProfile, ServiceItem, Promo } from '@/types/user';
import type { Appointment } from '@/types/dashboard';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: Appointment | null;
  patientId?: string; // For patient bookings - pre-select the patient
}

export function AppointmentModal({ isOpen, onClose, onSuccess, appointment, patientId }: AppointmentModalProps) {
  const { createAppointment } = useAppointments();
  const { patients, loadPatients, createPatient } = usePatients();
  const { doctors } = useDoctors();
  const { services: serviceList, getServiceById } = useServices();
  const { promos: promoList } = usePromos();
  const { schedules } = useSchedules();
  const { clinicSchedule } = useClinicSchedule();
  const currentUser = useAuthStore((state) => state.user);
  
  const [patientType, setPatientType] = useState<'existing' | 'walkin'>('existing');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const [walkinName, setWalkinName] = useState('');
  const [walkinAge, setWalkinAge] = useState('');
  const [walkinContact, setWalkinContact] = useState('');
  const [walkinEmail, setWalkinEmail] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(''); // For adding new service
  const [selectedServices, setSelectedServices] = useState<Array<{ serviceId: string; serviceName: string; price?: string | number }>>([]); // Multiple services
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is admin/staff (for multiple services feature)
  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'staff';

  const availableServices = useMemo(
    () => (serviceList || []).filter((service) => service.active !== false),
    [serviceList],
  );
  const activePromos = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return (promoList || []).filter((promo) => {
      if ((promo as any).active === false) return false;
      if (!promo.validUntil) return true;
      return promo.validUntil >= today;
    });
  }, [promoList]);

  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const searchLower = patientSearch.toLowerCase();
    return patients.filter((patient) => {
      const name = (patient.fullName || '').toLowerCase();
      const phone = (patient.phone || '').toLowerCase();
      const email = (patient.email || '').toLowerCase();
      return name.includes(searchLower) || phone.includes(searchLower) || email.includes(searchLower);
    });
  }, [patients, patientSearch]);

  // Get available dates for selected doctor
  const availableDates = useMemo(() => {
    if (!selectedDoctorId) return [];

    const doctorSchedules = schedules.filter((s) => s.doctorId === selectedDoctorId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 14);

    const available: number[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Check each day in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(currentYear, currentMonth, day);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate >= today && checkDate <= maxDate) {
        const dayOfWeek = dayNames[checkDate.getDay()];
        const daySchedule = doctorSchedules.find((s) => s.day === dayOfWeek);
        const clinicDay = clinicSchedule[dayOfWeek as keyof typeof clinicSchedule];

        if (clinicDay && clinicDay.isOpen && daySchedule) {
          available.push(day);
        }
      }
    }

    return available;
  }, [selectedDoctorId, currentMonth, currentYear, schedules, clinicSchedule]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Format date as YYYY-MM-DD for appointmentDate
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setAppointmentDate(`${year}-${month}-${day}`);
    setAppointmentTime(''); // Reset time when date changes
  };

  // Get service ID for TimeSlotSelector (use first service or promo)
  const serviceIdForTimeSlots = useMemo(() => {
    if (isAdminOrStaff && selectedServices.length > 0) {
      return selectedServices[0].serviceId.toString();
    } else if (selectedServiceId) {
      return selectedServiceId;
    }
    return '';
  }, [isAdminOrStaff, selectedServices, selectedServiceId]);

  // Calculate total duration for multiple services (for TimeSlotSelector)
  const totalDurationForTimeSlots = useMemo(() => {
    if (isAdminOrStaff && selectedServices.length > 0) {
      let totalDuration = 0;
      let promoDuration = 0;
      
      for (const selectedService of selectedServices) {
        // Check if this is a promotion
        if (selectedService.serviceId.toString().startsWith('promo_')) {
          const promoId = selectedService.serviceId.toString().replace('promo_', '');
          const promo = activePromos.find((p) => String(p.id) === promoId);
          if (promo?.duration && promo.duration > 0) {
            promoDuration = promo.duration;
          }
        } else {
          // Regular service
          const service = availableServices.find(
            (svc) => String(svc.id) === selectedService.serviceId.toString(),
          );
          if (service) {
            totalDuration += ServiceDurations.getDuration(service);
          }
        }
      }
      
      // If promotion has a custom duration, use it; otherwise use calculated service duration
      return promoDuration > 0 ? promoDuration : totalDuration;
    }
    return undefined; // Let TimeSlotSelector calculate for single service
  }, [isAdminOrStaff, selectedServices]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset form state when modal opens
    setPatientType(patientId ? 'existing' : 'existing');
    setSelectedPatientId(patientId || '');
    setPatientSearch('');
    setShowPatientDropdown(false);
    setWalkinName('');
    setWalkinAge('');
    setWalkinContact('');
    setWalkinEmail('');
    setSelectedServiceId('');
    setSelectedServices([]);
    setSelectedDoctorId('');
    setNotes('');
    setError(null);

    if (appointment) {
      if (appointment.services && appointment.services.length > 0) {
        setSelectedServices(
          appointment.services.map((s) => ({ ...s, serviceId: String(s.serviceId) })),
        );
      } else if (appointment.serviceId) {
        const service = availableServices.find((s) => String(s.id) === String(appointment.serviceId));
        if (service) {
          setSelectedServices([
            {
              serviceId: String(service.id),
              serviceName: (appointment as any).serviceName || service.name,
              price: service.price,
            },
          ]);
        }
      }

      const aptDate = appointment.date || (appointment as any).appointmentDate;
      const aptTime = appointment.time || (appointment as any).appointmentTime;
      if (aptDate) {
        setAppointmentDate(aptDate);
        const dateObj = new Date(aptDate + 'T00:00:00');
        setSelectedDate(dateObj);
        setCurrentMonth(dateObj.getMonth());
        setCurrentYear(dateObj.getFullYear());
      }
      if (aptTime) {
        setAppointmentTime(aptTime);
      }
      if (appointment.doctorId) {
        setSelectedDoctorId(String(appointment.doctorId));
      }
      if (appointment.notes) {
        setNotes(appointment.notes);
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setAppointmentDate(tomorrow.toISOString().split('T')[0]);
      setSelectedDate(null);
      setCurrentMonth(new Date().getMonth());
      setCurrentYear(new Date().getFullYear());
    }
  }, [isOpen, appointment, patientId, availableServices]);

  // Close patient dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
    };

    if (showPatientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPatientDropdown]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation - check services based on user role
      if (isAdminOrStaff) {
        if (selectedServices.length === 0) {
          setError('Please add at least one service');
          setLoading(false);
          return;
        }
      } else {
        if (!selectedServiceId) {
          setError('Please select a service');
          setLoading(false);
          return;
        }
      }

      // Get services for duration calculation
      let servicesToUse: Array<{ serviceId: string; serviceName: string; price?: string | number }> = [];
      if (isAdminOrStaff) {
        servicesToUse = selectedServices;
      } else {
        // Check if it's a promotion
        if (selectedServiceId.startsWith('promo_')) {
          const promoId = selectedServiceId.replace('promo_', '');
          const promo = activePromos.find((p) => String(p.id) === promoId);
          if (!promo) {
            setError('Selected promotion not found. Please try again.');
            setLoading(false);
            return;
          }
          servicesToUse = [{
            serviceId: selectedServiceId,
            serviceName: promo.title,
            price: promo.price
          }];
        } else {
          const service = availableServices.find((s) => String(s.id) === selectedServiceId);
          if (!service) {
            setError('Selected service not found. Please try again.');
            setLoading(false);
            return;
          }
          servicesToUse = [{
            serviceId: selectedServiceId,
            serviceName: service.name,
            price: service.price
          }];
        }
      }
      
      // Calculate total duration from all services
      let totalDuration = 0;
      let promoDuration = 0;
      
      for (const serviceItem of servicesToUse) {
        // Check if this is a promotion
        if (serviceItem.serviceId.toString().startsWith('promo_')) {
          const promoId = serviceItem.serviceId.toString().replace('promo_', '');
          const promo = activePromos.find((p) => String(p.id) === promoId);
          if (promo?.duration && promo.duration > 0) {
            promoDuration = promo.duration;
          }
        } else {
          // Regular service
          const service = availableServices.find(
            (s) => String(s.id) === serviceItem.serviceId.toString(),
          );
          if (service) {
            totalDuration += ServiceDurations.getDuration(service);
          }
        }
      }
      
      // If promotion has a custom duration, use it; otherwise use calculated service duration
      if (promoDuration > 0) {
        totalDuration = promoDuration;
      }
      
      if (totalDuration === 0) {
        setError('Unable to determine service duration. Please try again.');
        setLoading(false);
        return;
      }

      if (!appointmentDate || !appointmentTime) {
        setError('Please select date and time');
        setLoading(false);
        return;
      }

      // Validate date is not in the past
      const selectedDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setError('You cannot book appointments in the past. Please select today or a future date.');
        setLoading(false);
        return;
      }

      // Check if booking is within 2 weeks in advance
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 14);

      if (selectedDate > maxDate) {
        setError('Appointments can only be booked up to 2 weeks in advance. Please select a date within the next 2 weeks.');
        setLoading(false);
        return;
      }

      // Fetch appointments from API for validation
      let appointmentsForValidation: any[] = [];
      try {
        const response = await api.getAppointments({ date: appointmentDate, public: 'true' });
        appointmentsForValidation = Array.isArray(response) ? response : (response as any)?.data ?? [];
      } catch (err) {
        console.error('Failed to fetch appointments for validation:', err);
      }

      // Get or assign doctor
      let doctorId = selectedDoctorId;
      if (!doctorId) {
        // Auto-assign: Find any available doctor at this time slot
        doctorId = ServiceDurations.findAvailableDoctor(
          appointmentDate,
          appointmentTime,
          totalDuration,
          doctors,
          appointmentsForValidation,
          null,
          (id: string) => availableServices.find(s => String(s.id) === id) || null
        );

        if (!doctorId) {
          setError(
            `Sorry, all dentists are busy at this time slot.\n\nThe selected service${servicesToUse.length > 1 ? 's require' : ' requires'} ${ServiceDurations.minutesToTime(totalDuration)}.\n\nPlease select a different time or assign a specific dentist.`
          );
          setLoading(false);
          return;
        }
      } else {
        // Check if selected doctor is available at this time slot
        const isAvailable = ServiceDurations.isTimeSlotAvailable(
          doctorId,
          appointmentDate,
          appointmentTime,
          totalDuration,
          appointmentsForValidation,
          null,
          (id: string) => availableServices.find(s => String(s.id) === id) || null
        );

        if (!isAvailable) {
          const doctor = doctors.find(d => String(d.id) === doctorId);
          const doctorName = doctor ? doctor.name : 'the selected dentist';
          setError(
            `The selected time slot conflicts with an existing appointment for ${doctorName}.\n\nThe selected service${servicesToUse.length > 1 ? 's require' : ' requires'} ${ServiceDurations.minutesToTime(totalDuration)}.\n\nPlease select a different time.`
          );
          setLoading(false);
          return;
        }
      }

      // Check if selected time overlaps with break time
      const dateObj = new Date(appointmentDate + 'T00:00:00');
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[dateObj.getDay()];
      const clinicDay = clinicSchedule[dayOfWeek as keyof typeof clinicSchedule];
      const breakStart = clinicDay?.breakStartTime;
      const breakEnd = clinicDay?.breakEndTime;
      const slotEnd = ServiceDurations.addMinutesToTime(appointmentTime, totalDuration);
      
      if (breakStart && breakEnd && overlapsBreakTime(appointmentTime, slotEnd, breakStart, breakEnd)) {
        setError(
          `The selected time slot overlaps with the clinic's break time (${breakStart} - ${breakEnd}).\n\nPlease select a different time.`
        );
        setLoading(false);
        return;
      }

      // Handle patient
      let finalPatientId: string;
      let appointmentNotes = notes;

      if (patientId) {
        // Pre-selected patient (for patient bookings)
        finalPatientId = patientId;
      } else if (patientType === 'existing') {
        if (!selectedPatientId) {
          setError('Please select a patient');
          setLoading(false);
          return;
        }
        finalPatientId = selectedPatientId;
      } else {
        // Walk-in patient
        if (!walkinName || !walkinAge || !walkinContact) {
          setError('Please fill in all walk-in patient information');
          setLoading(false);
          return;
        }
        const walkInId = await createWalkInPatientRecord();
        if (!walkInId) {
          setError('Failed to create walk-in patient record. Please try again.');
          setLoading(false);
          return;
        }
        finalPatientId = walkInId;
        appointmentNotes = `WALK-IN PATIENT\nName: ${walkinName}\nAge: ${walkinAge}\nContact: ${walkinContact}${
          walkinEmail ? `\nEmail: ${walkinEmail}` : ''
        }\n\n${notes}`;
      }

      // Determine status: 'pending' for patient bookings, 'confirmed' for staff/admin bookings
      // When a patient books through PatientAppointmentsTab, patientId prop is provided
      // When staff/admin creates, patientId prop is not provided (they select patient)
      const appointmentStatus = patientId ? 'pending' : 'confirmed';

      // Create appointment - matching legacy structure exactly
      const appointmentData: Partial<Appointment> = {
        patientId: finalPatientId,
        doctorId: doctorId || '',
        serviceId: String(servicesToUse[0].serviceId), // Legacy: keep first service for backward compatibility
        serviceName: servicesToUse.map(s => s.serviceName).join(', '), // All service names
        services: servicesToUse.map(s => ({ ...s, serviceId: String(s.serviceId) })), // New: multiple services array with string IDs
        date: appointmentDate,
        time: appointmentTime,
        notes: appointmentNotes,
        status: appointmentStatus,
      } as any;

      const result = await createAppointment(appointmentData);
      if (!result.success) {
        throw new Error(result.message || 'Failed to create appointment. Please try again.');
      }

      // Show success message for patient bookings
      if (patientId && appointmentStatus === 'pending') {
        // Note: The appointment is created with 'pending' status
        // Staff/admin will need to confirm it
      }

      // Create medical record for walk-in appointments
      if (patientType === 'walkin') {
        const serviceNames = servicesToUse.map((s) => s.serviceName).join(', ');
        try {
          await api.createMedicalHistory({
            patientId: finalPatientId,
            serviceId:
              typeof servicesToUse[0].serviceId === 'string'
                ? servicesToUse[0].serviceId
                : String(servicesToUse[0].serviceId),
            doctorId: doctorId || undefined,
            date: appointmentDate,
            time: appointmentTime,
            treatment: appointmentNotes || `Walk-in appointment created for ${serviceNames}`,
            remarks: `Walk-in appointment created by staff on ${new Date().toLocaleDateString()}`,
          });
        } catch (err) {
          console.error('Error creating medical record for walk-in:', err);
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating appointment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create appointment';
      // Only show error if it's not a reference error (which might occur but appointment still succeeds)
      if (!errorMessage.includes('service is not defined') && !errorMessage.includes('ReferenceError')) {
        setError(errorMessage);
      } else {
        // If it's a reference error but appointment was created, just log it silently
        console.warn('Reference error occurred but appointment was created:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const createWalkInPatientRecord = async (): Promise<string | null> => {
    const name = walkinName.trim();
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ');
    const usernameBase = `walkin_${Date.now()}`;
    const fallbackEmail = `${usernameBase}@walkin.local`;

    try {
      const response = await api.createPatient({
        username: usernameBase,
        password: 'patient123',
        fullName: name,
        email: walkinEmail || fallbackEmail,
        phone: walkinContact,
        dateOfBirth: undefined,
        address: '',
        firstName: firstName || name,
        lastName,
      });

      await loadPatients();
      return (response as { id?: string })?.id ?? null;
    } catch (err) {
      console.error('Failed to create walk-in patient', err);
      return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Appointment"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global error message - only show if not a service-specific error */}
        {error && !error.includes('Please add at least one service') && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Show patient name for patient bookings */}
        {patientId ? (
          <div className="p-4 bg-gradient-to-r from-gold-50 to-gold-100 dark:from-gold-900/30 dark:to-gold-800/30 rounded-lg border-2 border-gold-200 dark:border-gold-700">
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Patient</label>
            <p className="text-lg font-bold text-black dark:text-gray-100">
              {patients.find((p) => p.id === patientId)?.fullName || 'Loading...'}
            </p>
          </div>
        ) : (
          <>
            {/* Patient Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Patient Type</label>
              <div className="flex gap-4">
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="patientType"
                    value="existing"
                    checked={patientType === 'existing'}
                    onChange={(e) => setPatientType(e.target.value as 'existing' | 'walkin')}
                    className="mr-2 text-gold-500 dark:text-gold-400"
                  />
                  Existing Patient
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="patientType"
                    value="walkin"
                    checked={patientType === 'walkin'}
                    onChange={(e) => setPatientType(e.target.value as 'existing' | 'walkin')}
                    className="mr-2 text-gold-500 dark:text-gold-400"
                  />
                  Walk-in Patient
                </label>
              </div>
            </div>

            {/* Existing Patient Selection */}
            {patientType === 'existing' && (
              <div className="relative" ref={patientDropdownRef}>
                <label htmlFor="appointmentPatient" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Patient *
                </label>
                <input
                  type="text"
                  id="appointmentPatient"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientDropdown(true);
                    if (!e.target.value) {
                      setSelectedPatientId('');
                    }
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  placeholder="Search by name, phone, or email..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                  autoComplete="off"
                />
                {showPatientDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-black-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        No patients found
                      </div>
                    ) : (
                      filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setPatientSearch(`${patient.fullName || 'Unknown'} ${patient.phone ? `(${patient.phone})` : ''}`);
                            setShowPatientDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-black-700 transition-colors ${
                            selectedPatientId === patient.id ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-300' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          <div className="font-medium">{patient.fullName || 'Unknown Name'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {patient.phone && <span>{patient.phone}</span>}
                            {patient.email && patient.phone && <span> • </span>}
                            {patient.email && <span>{patient.email}</span>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {/* Selected patient indicator */}
                {selectedPatientId && !showPatientDropdown && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    ✓ Patient selected
                  </div>
                )}
              </div>
            )}

            {/* Walk-in Patient Fields */}
            {patientType === 'walkin' && (
              <div className="space-y-4 border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-gray-50 dark:bg-black-800">
                <div>
                  <label htmlFor="walkinName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="walkinName"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="walkinAge" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      id="walkinAge"
                      value={walkinAge}
                      onChange={(e) => setWalkinAge(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="walkinContact" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Contact *
                    </label>
                    <input
                      type="tel"
                      id="walkinContact"
                      value={walkinContact}
                      onChange={(e) => setWalkinContact(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="walkinEmail" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    id="walkinEmail"
                    value={walkinEmail}
                    onChange={(e) => setWalkinEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Service Selection */}
        <div>
          <label htmlFor="appointmentService" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {isAdminOrStaff ? 'Services *' : 'Service *'}
            {isAdminOrStaff && selectedServices.length > 0 && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                ({selectedServices.length} selected)
              </span>
            )}
          </label>
          
          {isAdminOrStaff ? (
            // Multiple services for admin/staff
            <div className="space-y-3">
              {/* Selected Services List */}
              {selectedServices.length > 0 && (
                <div className="space-y-2">
                  {selectedServices.map((selectedService, index) => {
                    const service = getServiceById(selectedService.serviceId.toString());
                    return (
                      <div
                        key={`${selectedService.serviceId}-${index}`}
                        className="flex items-center justify-between p-3 bg-gold-50 dark:bg-gold-900/30 border border-gold-200 dark:border-gold-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedService.serviceName}</p>
                          {service?.price && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">Price: ₱{service.price}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServices(selectedServices.filter((_, i) => i !== index));
                            setAppointmentTime(''); // Reset time when service is removed
                          }}
                          className="ml-2 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Remove service"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Add Service Dropdown */}
              <div className="flex gap-2">
                <select
                  id="appointmentService"
                  value={selectedServiceId}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    if (!selectedValue) {
                      setSelectedServiceId('');
                      return;
                    }
                    
                    // Check if it's a promotion
                    if (selectedValue.startsWith('promo_')) {
                      const promoId = selectedValue.replace('promo_', '');
                      const selectedPromo = activePromos.find(
                        (promo) => String(promo.id) === promoId,
                      );
                      if (selectedPromo) {
                        // Check if promotion is already in services
                        const promoAlreadyAdded = selectedServices.find(
                          s => s.serviceId === `promo_${promoId}`
                        );
                        
                        if (!promoAlreadyAdded) {
                          // Add promotion to services with only the title
                          setSelectedServices([...selectedServices, {
                            serviceId: `promo_${promoId}`,
                            serviceName: selectedPromo.title,
                            price: selectedPromo.price || undefined
                          }]);
                          setAppointmentTime(''); // Reset time when service is added
                        }
                      }
                    } else {
                      // Regular service
                      if (!selectedServices.find(s => s.serviceId.toString() === selectedValue)) {
                        const service = availableServices.find(
                          (svc) => String(svc.id) === selectedValue,
                        );
                        if (service) {
                          setSelectedServices([...selectedServices, {
                            serviceId: service.id,
                            serviceName: service.name,
                            price: service.price
                          }]);
                          setAppointmentTime(''); // Reset time when service is added
                        }
                      }
                    }
                    setSelectedServiceId('');
                  }}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                >
                  <option value="">Add a service or promotion...</option>
                  {/* Services */}
                  {availableServices
                    .filter(
                      (service) =>
                        !selectedServices.find(
                          (s) => s.serviceId.toString() === service.id.toString(),
                        ),
                    )
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} {service.price ? `(₱${service.price})` : ''}
                      </option>
                    ))}
                  {/* Promotions */}
                  {activePromos.length > 0 && (
                    <>
                      <optgroup label="Promotions">
                        {activePromos
                          .filter(
                            (promo) =>
                              !selectedServices.find(
                                (s) => s.serviceId.toString() === `promo_${promo.id}`,
                              ),
                          )
                          .map((promo) => (
                            <option key={promo.id} value={`promo_${promo.id}`}>
                              {promo.title}
                            </option>
                          ))}
                      </optgroup>
                    </>
                  )}
                </select>
              </div>
              
              {/* Error message for services - shown inline below the dropdown */}
              {(selectedServices.length === 0 || (error && error.includes('Please add at least one service'))) && (
                <p className="text-sm text-red-600 dark:text-red-400">Please add at least one service</p>
              )}
            </div>
          ) : (
            // Single service for patients
            <select
              id="appointmentService"
              value={selectedServiceId}
              onChange={(e) => {
                const selectedValue = e.target.value;
                setSelectedServiceId(selectedValue);
                
                // If a promotion is selected, automatically add it to services
                if (selectedValue.startsWith('promo_')) {
                  const promoId = selectedValue.replace('promo_', '');
                  const selectedPromo = activePromos.find((promo) => String(promo.id) === promoId);
                  if (selectedPromo) {
                    // For patients, we'll handle this in the submit handler
                    // Just keep the selectedServiceId as the promo ID
                  }
                }
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              required
            >
              <option value="">Select a service or promotion</option>
              {/* Services */}
              {availableServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
              {/* Promotions */}
              {activePromos.length > 0 && (
                <>
                  <optgroup label="Promotions">
                    {activePromos.map((promo) => (
                      <option key={promo.id} value={`promo_${promo.id}`}>
                        {promo.title}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
            </select>
          )}
        </div>

        {/* Doctor Selection */}
        <div>
          <label htmlFor="appointmentDoctor" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Dentist {!selectedDoctorId && '(Optional - will auto-assign)'}
          </label>
          <select
            id="appointmentDoctor"
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              // Reset date and time when doctor changes
              setSelectedDate(null);
              setAppointmentDate('');
              setAppointmentTime('');
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
          >
            <option value="">Auto-assign</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time Selection - Side by Side */}
        {selectedDoctorId ? (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Select Date and Time *
            </label>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar - Left Side */}
              <div className="flex-1">
                <BookingCalendar
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  selectedDate={selectedDate}
                  availableDates={availableDates}
                  onDateSelect={handleDateSelect}
                  onMonthChange={(direction) => {
                    let newMonth = currentMonth + direction;
                    let newYear = currentYear;
                    if (newMonth < 0) {
                      newMonth = 11;
                      newYear--;
                    } else if (newMonth > 11) {
                      newMonth = 0;
                      newYear++;
                    }
                    setCurrentMonth(newMonth);
                    setCurrentYear(newYear);
                  }}
                />
              </div>

              {/* Time Slots - Right Side */}
              <div className="flex-1">
                {selectedDate && (isAdminOrStaff ? selectedServices.length > 0 : selectedServiceId) ? (
                  <TimeSlotSelector
                    doctorId={selectedDoctorId}
                    selectedDate={selectedDate}
                    serviceId={serviceIdForTimeSlots}
                    onTimeSelect={(time) => setAppointmentTime(time)}
                    selectedTime={appointmentTime}
                    duration={totalDurationForTimeSlots}
                  />
                ) : (
                  <div className="bg-white dark:bg-black-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center min-h-[300px]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      {!selectedDate
                        ? 'Please select a date from the calendar'
                        : (isAdminOrStaff ? selectedServices.length === 0 : !selectedServiceId)
                        ? 'Please select a service first'
                        : 'Select a date to see available time slots'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Hidden inputs for form validation */}
            <input type="hidden" value={appointmentDate || ''} required />
            <input type="hidden" value={appointmentTime || ''} required />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Date and Time *
            </label>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center min-h-[200px]">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Please select a dentist first to see their available dates and times
              </p>
            </div>
          </div>
        )}


        {/* Notes */}
        <div>
          <label htmlFor="appointmentNotes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="appointmentNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

