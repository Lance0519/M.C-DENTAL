import { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceDurations } from '@/lib/service-durations';
import { useSchedules } from '@/hooks/useSchedules';
import { useServices } from '@/hooks/useServices';
import { usePromos } from '@/hooks/usePromos';
import { useClinicSchedule } from '@/hooks/useClinicSchedule';
import api from '@/lib/api';

interface TimeSlotSelectorProps {
  doctorId: string;
  selectedDate: Date | null;
  serviceId: string;
  onTimeSelect: (time: string) => void;
  selectedTime: string | null;
  duration?: number; // Optional: override duration calculation (useful for multiple services)
}

export function TimeSlotSelector({
  doctorId,
  selectedDate,
  serviceId,
  onTimeSelect,
  selectedTime,
  duration,
}: TimeSlotSelectorProps) {
  const { schedules, loading: schedulesLoading } = useSchedules();
  const { getServiceById, services } = useServices();
  const { getPromoById } = usePromos();
  const { clinicSchedule, loading: clinicLoading } = useClinicSchedule();
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const appointmentsRef = useRef<any[]>([]);

  const loadTimeSlots = useCallback(async () => {
    if (!selectedDate || !doctorId || !serviceId) {
      setAvailableSlots([]);
      return;
    }

    // Wait for schedules to be loaded
    if (schedulesLoading || clinicLoading || schedules.length === 0) {
      return;
    }

    setLoading(true);

    try {
      // Fetch appointments directly for this doctor and date
      // Use local date components to avoid timezone issues (toISOString converts to UTC which can shift the date)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const response = await api.getAppointments({ doctor_id: doctorId, date: dateStr, public: 'true' });
      const appointmentsData = Array.isArray(response) ? response : (response as any)?.data ?? [];
      
      setAppointments(appointmentsData);
      appointmentsRef.current = appointmentsData;
      // Get service to determine duration
      let serviceDuration = duration || 30; // Use provided duration or default
      
      // If duration is not provided, calculate from service
      if (!duration) {
        if (serviceId === 'consultation') {
          const consultationService = getServiceById('srv001');
          serviceDuration = ServiceDurations.getDuration(consultationService || 'consultation');
        } else if (serviceId.startsWith('promo_')) {
          // Handle promotion
          const promoId = serviceId.replace('promo_', '');
          const promo = getPromoById(promoId);
          if (promo?.duration && promo.duration > 0) {
            serviceDuration = promo.duration;
          } else {
            // Fallback to consultation duration if promo has no duration
            const consultationService = getServiceById('srv001');
            serviceDuration = ServiceDurations.getDuration(consultationService || 'consultation');
          }
        } else {
          const service = getServiceById(serviceId);
          if (service) {
            serviceDuration = ServiceDurations.getDuration(service);
          }
        }
      }
      

      // Get doctor schedules (use string comparison for consistency)
      const doctorSchedules = schedules.filter((s) => String(s.doctorId) === String(doctorId));

      if (doctorSchedules.length === 0) {
        setAvailableSlots([]);
        setLoading(false);
        return;
      }

      // Get day of week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[selectedDate.getDay()];
      const daySchedule = doctorSchedules.find((s) => s.day === dayOfWeek);

      if (!daySchedule) {
        setAvailableSlots([]);
        setLoading(false);
        return;
      }

      // Get clinic schedule for the day
      const clinicDay = clinicSchedule[dayOfWeek as keyof typeof clinicSchedule];

      if (!clinicDay || !clinicDay.isOpen) {
        setAvailableSlots([]);
        setLoading(false);
        return;
      }

      // Generate time slots
      const slots: string[] = [];
      const startTime = daySchedule.startTime;
      const endTime = daySchedule.endTime;

      // Get break time from clinic schedule
      const breakStart = clinicDay.breakStartTime;
      const breakEnd = clinicDay.breakEndTime;

      // Generate slots every 30 minutes
      let currentTime = startTime;
      while (currentTime < endTime) {
        const slotEnd = ServiceDurations.addMinutesToTime(currentTime, serviceDuration);
        
        // Check if slot overlaps with break time
        let overlapsBreak = false;
        if (breakStart && breakEnd) {
          const startsDuringBreak = currentTime >= breakStart && currentTime < breakEnd;
          const endsDuringBreak = slotEnd > breakStart && slotEnd <= breakEnd;
          const spansBreak = currentTime < breakStart && slotEnd > breakEnd;
          const startsAtBreakStart = currentTime === breakStart;
          const endsAtBreakEnd = slotEnd === breakEnd;
          
          overlapsBreak = startsDuringBreak || endsDuringBreak || spansBreak || startsAtBreakStart || endsAtBreakEnd;
        }
        
        if (slotEnd <= endTime && !overlapsBreak) {
          // Check if slot is available - use directly fetched appointments
          const isAvailable = ServiceDurations.isTimeSlotAvailable(
            String(doctorId),
            dateStr,
            currentTime,
            serviceDuration,
            appointmentsData,
            null,
            (id: string) => getServiceById(id)
          );

          // Only add slot if it's available (not occupied)
          if (isAvailable) {
            slots.push(currentTime);
          }
        }

        // Move to next 30-minute slot
        currentTime = ServiceDurations.addMinutesToTime(currentTime, 30);
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, doctorId, serviceId, duration, schedules, schedulesLoading, clinicSchedule, clinicLoading, getServiceById, getPromoById]);

  useEffect(() => {
    if (!selectedDate || !doctorId || !serviceId) {
      setAvailableSlots([]);
      setShowConfirmation(false);
      return;
    }

    loadTimeSlots();
  }, [selectedDate, doctorId, serviceId, duration, loadTimeSlots]);

  useEffect(() => {
    if (selectedTime) {
      setShowConfirmation(true);
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedTime]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${dayName}, ${monthName} ${day}`;
  };

  if (!selectedDate) {
    return (
      <div className="flex-1 min-w-[300px]">
        <div className="text-center py-8 text-gray-600 dark:text-gray-300">
          Select a date to see available time slots
        </div>
      </div>
    );
  }

  if (showConfirmation && selectedTime) {
    return (
      <div className="flex-1 min-w-[300px]">
        <div className="bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/30 dark:to-gold-800/30 border-2 border-gold-500 rounded-xl p-6 text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-black">
            ✓
          </div>
          <h3 className="text-lg font-bold text-gold-700 dark:text-gold-300 mb-4">Appointment Selected</h3>
          <div className="bg-white dark:bg-black-800 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Date:</span>
              <span className="text-sm font-bold text-gold-700 dark:text-gold-300">{formatDate(selectedDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Time:</span>
              <span className="text-sm font-bold text-gold-700 dark:text-gold-300">{formatTime(selectedTime)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmation(false)}
            className="w-full px-4 py-2 border-2 border-gold-500 text-gold-500 font-semibold rounded-lg hover:bg-gold-500 hover:text-black transition-all uppercase tracking-wide"
          >
            Change Time
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[300px]">
      {selectedDate && (
        <>
          <div className="bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold text-center py-2 px-4 rounded-lg mb-2">
            {formatDate(selectedDate)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center mb-4">
            TIME ZONE: MANILA (GMT+08:00)
          </div>
        </>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading time slots...</div>
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-300 italic">
          No available time slots for this date
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {availableSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onTimeSelect(slot)}
              className={`
                w-full px-6 py-3 border-2 rounded-lg text-center font-medium transition-all
                ${selectedTime === slot
                  ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-black border-gold-500 shadow-lg scale-105'
                  : 'bg-white dark:bg-black-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-gold-500 hover:bg-gold-50 dark:hover:bg-gold-900/20 hover:text-gold-700 dark:hover:text-gold-300'
                }
              `}
            >
              {formatTime(slot)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
