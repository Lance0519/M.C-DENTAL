import { useState, useEffect, useMemo, FormEvent } from 'react';
import { ServiceDurations } from '@/lib/service-durations';
import { useServices } from '@/hooks/useServices';
import { useDoctors } from '@/hooks/useDoctors';
import { useAppointments } from '@/hooks/useAppointments';
import { usePromos } from '@/hooks/usePromos';
import { useSchedules } from '@/hooks/useSchedules';
import { useClinicSchedule } from '@/hooks/useClinicSchedule';
import { useAuthStore } from '@/store/auth-store';
import { overlapsBreakTime } from '@/lib/time-utils';
import { Modal } from '@/components/modals/Modal';
import { HealthScreeningModal } from './HealthScreeningModal';
import { BookingCalendar } from './BookingCalendar';
import { TimeSlotSelector } from './TimeSlotSelector';
import { AppointmentSuccessModal } from './AppointmentSuccessModal';
import api from '@/lib/api';
import type { ServiceItem } from '@/types/user';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookingModal({ isOpen, onClose, onSuccess }: BookingModalProps) {
  const { services, getServiceById } = useServices();
  const { doctors } = useDoctors();
  const { appointments, loadAppointments, createAppointment } = useAppointments();
  const { promos, getActivePromos, getPromoById } = usePromos();
  const { schedules } = useSchedules();
  const { clinicSchedule } = useClinicSchedule();
  const { user: currentUser } = useAuthStore();

  // Health screening state
  const [showScreening, setShowScreening] = useState(false);
  const [screeningPassed, setScreeningPassed] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: '',
    email: '',
    procedure: '',
    doctorId: '',
    paymentMethod: '',
    cardType: '',
  });

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // UI state
  const [showCardType, setShowCardType] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    patientName: string;
    serviceName: string;
    dentistName: string;
    date: string;
    time: string;
    isGuest?: boolean;
  } | null>(null);

  // Always show health screening when modal opens - required for both guests and logged-in patients
  useEffect(() => {
    if (isOpen) {
      // Always require health screening for each booking
      setShowScreening(true);
      setScreeningPassed(false);
    }
  }, [isOpen]);

  // Get active promotions
  const activePromos = useMemo(() => getActivePromos(), [getActivePromos]);

  // Check if user is logged in and pre-fill form
  useEffect(() => {
    if (isOpen) {
      if (currentUser && currentUser.role === 'patient') {
        let userAge = '';
        if ((currentUser as any).dateOfBirth) {
          const birthDate = new Date((currentUser as any).dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          userAge = age.toString();
        }
        setFormData({
          name: (currentUser as any).fullName || '',
          age: userAge,
          contact: (currentUser as any).phone || '',
          procedure: '',
          doctorId: '',
          paymentMethod: '',
          cardType: '',
        });
      } else {
        // Reset form for guests
        setFormData({
          name: '',
          age: '',
          contact: '',
          procedure: '',
          doctorId: '',
          paymentMethod: '',
          cardType: '',
        });
      }
      // Reset other state
      setSelectedDate(null);
      setSelectedTime(null);
      setError(null);
      setShowCardType(false);
    }
  }, [isOpen, currentUser]);

  // Get available doctors
  const availableDoctors = useMemo(() => {
    return doctors.filter((doctor) => doctor.available);
  }, [doctors]);

  // Get available dates for selected doctor
  const availableDates = useMemo(() => {
    if (!formData.doctorId) return [];
    const doctorSchedules = schedules.filter((s) => s.doctorId === formData.doctorId);
    const dates: number[] = [];
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);

    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const hasSchedule = doctorSchedules.some((s) => s.day === dayName);
      if (hasSchedule) {
        dates.push(d.getDate());
      }
    }
    return dates;
  }, [formData.doctorId, schedules]);

  const formatDuration = (service: ServiceItem | string): string => {
    if (typeof service === 'string') {
      return ServiceDurations.minutesToTime(ServiceDurations.getDuration(service));
    }
    return ServiceDurations.minutesToTime(ServiceDurations.getDuration(service));
  };

  const handleDoctorChange = (doctorId: string) => {
    setFormData({ ...formData, doctorId });
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handlePaymentMethodChange = (method: string) => {
    setFormData({ ...formData, paymentMethod: method, cardType: '' });
    setShowCardType(method === 'Debit Card' || method === 'Credit Card');
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const phPattern = /^(09|\+639|639)\d{9}$/;
    return phPattern.test(phone.replace(/\s+/g, ''));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate health screening first
      if (!screeningPassed) {
        setError('Please complete the health screening before booking an appointment.');
        setShowScreening(true);
        setLoading(false);
        return;
      }

      // Check if user is logged in
      const isUserLoggedIn = currentUser && currentUser.role === 'patient';

      // Validate required fields
      const missingFields: string[] = [];
      
      // These fields are only required for guests (not logged-in users)
      if (!isUserLoggedIn) {
        if (!formData.name.trim()) missingFields.push('Name');
        if (!formData.age.trim()) missingFields.push('Age');
        if (!formData.contact.trim()) missingFields.push('Contact Number');
      }
      
      // These fields are always required
      if (!formData.procedure) missingFields.push('Dental Procedure');
      if (!formData.doctorId) missingFields.push('Dentist');
      if (!selectedDate) missingFields.push('Appointment Date');
      if (!selectedTime) missingFields.push('Appointment Time');

      if (missingFields.length > 0) {
        setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Validate phone number only for guests
      if (!isUserLoggedIn && !isValidPhoneNumber(formData.contact)) {
        setError('Please enter a valid Philippine mobile number.\n\nAccepted formats:\n• 09XXXXXXXXX\n• +639XXXXXXXXX\n• 639XXXXXXXXX');
        setLoading(false);
        return;
      }

      // Validate date - require 1 day advance booking (earliest is tomorrow)
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateObj = new Date(selectedDate!);
      selectedDateObj.setHours(0, 0, 0, 0);

      // Calculate minimum booking date (tomorrow)
      const minBookingDate = new Date(today);
      minBookingDate.setDate(minBookingDate.getDate() + 1); // Add 1 day (tomorrow)

      if (selectedDateObj < minBookingDate) {
        setError('Appointments cannot be booked for today.\n\nPlease select a date starting from ' + minBookingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + '.');
        setLoading(false);
        return;
      }

      // Check if booking is within 2 weeks
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 14);
      if (selectedDateObj > maxDate) {
        setError('Appointments can only be booked up to 2 weeks in advance.\n\nPlease select a date within the next 2 weeks.');
        setLoading(false);
        return;
      }

      // Check if date/time is in the past
      const year = selectedDate!.getFullYear();
      const month = String(selectedDate!.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate!.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const selectedDateTime = new Date(`${dateStr}T${selectedTime}`);
      if (selectedDateTime < now) {
        setError('You cannot select a time in the past.\n\nPlease select a future date and time for your appointment.');
        setLoading(false);
        return;
      }

      // Get service details
      let serviceId: string;
      let serviceName: string;
      let selectedService: ServiceItem | null = null;
      let isPromo = false;

      if (formData.procedure.startsWith('promo_')) {
        isPromo = true;
        const promoId = formData.procedure.replace('promo_', '');
        const promo = getPromoById(promoId);
        if (!promo) {
          setError('Selected promotion not found. Please try again.');
          setLoading(false);
          return;
        }
        serviceId = 'srv001';
        serviceName = promo.title;
        selectedService = getServiceById('srv001') || null;
      } else if (formData.procedure === 'consultation') {
        serviceId = 'srv001';
        const consultService = getServiceById('srv001');
        if (!consultService) {
          setError('Consultation service not found. Please contact support.');
          setLoading(false);
          return;
        }
        serviceName = consultService.name;
        selectedService = consultService;
      } else {
        serviceId = formData.procedure;
        const service = getServiceById(serviceId);
        if (!service) {
          setError('Selected service not found. Please try again.');
          setLoading(false);
          return;
        }
        serviceName = service.name;
        selectedService = service;
      }

      // Calculate service duration
      let serviceDuration = ServiceDurations.getDuration(selectedService);
      if (isPromo) {
        const promoId = formData.procedure.replace('promo_', '');
        const promo = getPromoById(promoId);
        if (promo?.duration && promo.duration > 0) {
          serviceDuration = promo.duration;
        }
      }

      // Fetch appointments directly for validation (to avoid stale data)
      let appointmentsForValidation: any[] = [];
      try {
        const response = await api.getAppointments({ doctor_id: formData.doctorId, date: dateStr, public: 'true' });
        appointmentsForValidation = Array.isArray(response) ? response : (response as any)?.data ?? [];
      } catch (err) {
        console.error('Failed to fetch appointments for validation:', err);
      }

      // Check availability
      const isAvailable = ServiceDurations.isTimeSlotAvailable(
        formData.doctorId,
        dateStr,
        selectedTime!,
        serviceDuration,
        appointmentsForValidation,
        null,
        (id: string) => getServiceById(id)
      );

      if (!isAvailable) {
        const doctor = doctors.find((d) => d.id === formData.doctorId);
        setError(
          `Sorry, the selected time slot is no longer available for ${doctor?.name || 'the selected dentist'}.\n\nThe selected service requires ${ServiceDurations.minutesToTime(serviceDuration)}.\n\nPlease select a different time.`
        );
        setLoading(false);
        return;
      }

      // Check if selected time overlaps with break time
      const dayOfWeek = selectedDate!.toLocaleDateString('en-US', { weekday: 'long' });
      const clinicDay = clinicSchedule[dayOfWeek as keyof typeof clinicSchedule];
      const breakStart = clinicDay?.breakStartTime;
      const breakEnd = clinicDay?.breakEndTime;
      const slotEnd = ServiceDurations.addMinutesToTime(selectedTime!, serviceDuration);
      
      if (breakStart && breakEnd && overlapsBreakTime(selectedTime!, slotEnd, breakStart, breakEnd)) {
        setError(
          `The selected time slot overlaps with the clinic's break time (${breakStart} - ${breakEnd}).\n\nPlease select a different time.`
        );
        setLoading(false);
        return;
      }

      // Get patient info
      let patientId: string;
      let patientName: string;
      let notes: string;

      if (currentUser && currentUser.role === 'patient') {
        patientId = currentUser.id;
        patientName = (currentUser as any).fullName || (currentUser as any).name || formData.name;
        notes = '';
      } else {
        // For guest booking, create a patient record first
        try {
          const nameParts = formData.name.split(' ');
          const firstName = nameParts[0] || formData.name;
          const lastName = nameParts.slice(1).join(' ') || '';
          const usernameBase = `guest_${Date.now()}`;
          
          // Use provided email or fallback to guest email
          const hasRealEmail = formData.email && formData.email.includes('@') && !formData.email.includes('@guest.local');
          const patientEmail = hasRealEmail ? formData.email : `${usernameBase}@guest.local`;
          
          // Calculate date of birth from age
          let dateOfBirth = '';
          if (formData.age) {
            const ageNum = parseInt(formData.age);
            if (!isNaN(ageNum)) {
              const today = new Date();
              const birthYear = today.getFullYear() - ageNum;
              dateOfBirth = `${birthYear}-01-01`;
            }
          }

          const patientResponse = await api.createPatient({
            username: usernameBase,
            password: 'patient123',
            fullName: formData.name,
            email: patientEmail,
            phone: formData.contact,
            dateOfBirth: dateOfBirth || undefined,
            address: '',
            firstName,
            lastName,
          });

          patientId = (patientResponse as any)?.id || usernameBase;
          patientName = formData.name;
        } catch (patientErr) {
          console.error('Failed to create guest patient:', patientErr);
          setError('Failed to create patient record. Please try again.');
          setLoading(false);
          return;
        }
        
        notes = `GUEST PATIENT\nName: ${formData.name}\nAge: ${formData.age}\nContact: ${formData.contact}${formData.email ? `\nEmail: ${formData.email}` : ''}`;
      }

      // Payment info
      let paymentInfo = formData.paymentMethod;
      if ((formData.paymentMethod === 'Debit Card' || formData.paymentMethod === 'Credit Card') && formData.cardType) {
        paymentInfo = `${formData.paymentMethod} (${formData.cardType})`;
      }

      // Get service price (from promo or regular service)
      let servicePrice: string | undefined;
      if (isPromo) {
        const promoId = formData.procedure.replace('promo_', '');
        const promo = getPromoById(promoId);
        servicePrice = promo?.promoPrice || promo?.price || selectedService?.price;
      } else {
        servicePrice = selectedService?.price;
      }

      // Create appointment via API
      const result = await createAppointment({
        patientId,
        patientName,
        doctorId: formData.doctorId,
        serviceId,
        serviceName,
        services: [{
          serviceId,
          serviceName,
          price: servicePrice,
        }],
        date: dateStr,
        time: selectedTime!,
        notes,
        status: 'pending',
      });

      if (!result.success) {
        setError(result.message || 'Failed to book appointment. Please try again.');
        setLoading(false);
        return;
      }

      // Format date and time for display
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      };

      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      };

      const doctor = doctors.find((d) => d.id === formData.doctorId);

      // Set success details and show modal
      setSuccessDetails({
        patientName,
        serviceName,
        dentistName: doctor?.name || 'N/A',
        date: formatDate(dateStr),
        time: formatTime(selectedTime!),
        isGuest: !currentUser || currentUser.role !== 'patient',
      });
      setShowSuccessModal(true);
      onSuccess?.();
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err instanceof Error ? err.message : 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLoggedIn = currentUser && currentUser.role === 'patient';

  // Get service options with durations
  const serviceOptions = useMemo(() => {
    const consultationService = services.find((s) => s.id === 'srv001' || s.name?.toLowerCase().trim() === 'consultation');
    const consultationDuration = formatDuration(consultationService || 'consultation');
    const consultationOption = { value: 'consultation', label: `Consultation (${consultationDuration})` };

    const otherServices = services
      .filter((s) => !(s.id === 'srv001' || s.name?.toLowerCase().trim() === 'consultation'))
      .map((s) => ({
        value: s.id,
        label: `${s.name} (${formatDuration(s)})`,
      }));

    return [consultationOption, ...otherServices];
  }, [services]);

  // Show health screening modal if not passed
  if (!screeningPassed && isOpen) {
    return (
      <HealthScreeningModal
        isOpen={showScreening}
        onClose={() => {
          onClose();
        }}
        onComplete={() => {
          // Health screening passed, show booking form
          setShowScreening(false);
          setScreeningPassed(true);
        }}
      />
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen && screeningPassed}
        onClose={onClose}
        title="Book Appointment"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg whitespace-pre-line">
              {error}
            </div>
          )}

          {/* Patient Name - Show for logged in users */}
          {isLoggedIn && (
            <div className="p-4 bg-gradient-to-r from-gold-50 to-gold-100 dark:from-gold-900/30 dark:to-gold-800/30 rounded-lg border-2 border-gold-200 dark:border-gold-700">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Patient</label>
              <p className="text-lg font-bold text-black dark:text-gray-100">
                {(currentUser as any)?.fullName || 'Loading...'}
              </p>
            </div>
          )}

          {/* Name - Hidden for logged in users */}
          {!isLoggedIn && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                placeholder="Full Name"
                required={!isLoggedIn}
              />
            </div>
          )}

          {/* Age - Hidden for logged in users */}
          {!isLoggedIn && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Age *</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                placeholder="Age"
                required={!isLoggedIn}
              />
            </div>
          )}

          {/* Contact and Email - Hidden for logged in users */}
          {!isLoggedIn && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Contact Number *</label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                  placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                  required={!isLoggedIn}
                />
              </div>

              {/* Email for account claiming */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">(for account access)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                  placeholder="your@email.com (optional - to access your account later)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💡 Provide your email to claim your account and view appointments later
                </p>
              </div>
            </>
          )}

          {/* Service */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Service *
            </label>
            <select
              value={formData.procedure}
              onChange={(e) => {
                setFormData({ ...formData, procedure: e.target.value });
                if (selectedDate && formData.doctorId) {
                  setSelectedTime(null);
                }
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
              required
            >
              <option value="">Select a service or promotion</option>
              {serviceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {activePromos.length > 0 && (
                <optgroup label="Promotions">
                  {activePromos.map((promo) => (
                    <option key={promo.id} value={`promo_${promo.id}`}>
                      {promo.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Dentist */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Dentist (Optional - will auto-assign)
            </label>
            <select
              value={formData.doctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
            >
              <option value="">Auto-assign</option>
              {availableDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty || 'General Dentistry'}
                </option>
              ))}
            </select>
            <small className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              Please select a dentist to see their available dates and times
            </small>
          </div>

          {/* Date and Time - Side by Side Layout */}
          {formData.doctorId ? (
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
                  <TimeSlotSelector
                    doctorId={formData.doctorId}
                    selectedDate={selectedDate}
                    serviceId={formData.procedure}
                    onTimeSelect={handleTimeSelect}
                    selectedTime={selectedTime}
                  />
                </div>
              </div>
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

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
            >
              <option value="">Select Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Gcash">Gcash</option>
              <option value="Maya">Maya</option>
              <option value="Online Banking">Online Banking</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>

          {/* Card Type */}
          {showCardType && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Card Type *
              </label>
              <select
                value={formData.cardType}
                onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                required={showCardType}
              >
                <option value="">Select Card Type</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Visa Card">Visa Card</option>
                <option value="JBC">JBC</option>
                <option value="Union Pay">Union Pay</option>
                <option value="American Express">American Express</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 resize-none"
              placeholder="Any additional notes or special requests..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {loading ? 'Booking...' : 'Book Now'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Modal */}
      {successDetails && (
        <AppointmentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessDetails(null);
            onClose();
          }}
          appointmentDetails={successDetails}
        />
      )}
    </>
  );
}
