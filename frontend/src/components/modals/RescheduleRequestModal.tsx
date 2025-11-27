import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ServiceDurations } from '@/lib/service-durations';
import { overlapsBreakTime } from '@/lib/time-utils';
import { useAppointments } from '@/hooks/useAppointments';
import { useDoctors } from '@/hooks/useDoctors';
import { useServices } from '@/hooks/useServices';
import { useSchedules } from '@/hooks/useSchedules';
import { useClinicSchedule } from '@/hooks/useClinicSchedule';
import type { Appointment } from '@/types/dashboard';

interface RescheduleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

export function RescheduleRequestModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: RescheduleRequestModalProps) {
  const { appointments, loadAppointments, updateAppointment } = useAppointments();
  const { doctors } = useDoctors();
  const { getServiceById } = useServices();
  const { schedules } = useSchedules();
  const { clinicSchedule } = useClinicSchedule();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load appointments for the selected doctor and date
  useEffect(() => {
    if (isOpen && appointment?.doctorId && selectedDate) {
      loadAppointments({ doctorId: appointment.doctorId, date: selectedDate, public: true });
    }
  }, [isOpen, appointment?.doctorId, selectedDate, loadAppointments]);

  useEffect(() => {
    if (isOpen && appointment) {
      // Prevent rescheduling completed or cancelled appointments
      if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        setError('Cannot reschedule completed or cancelled appointments.');
        return;
      }

      // Set minimum date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
      setSelectedTime('');
      setError(null);
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (selectedDate && appointment?.doctorId) {
      loadAvailableTimes();
    } else {
      setAvailableTimes([]);
      setSelectedTime('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, appointment?.doctorId, appointment?.serviceId]);

  const loadAvailableTimes = () => {
    if (!appointment?.doctorId || !selectedDate) {
      setAvailableTimes([]);
      return;
    }

    try {
      const service = getServiceById(String(appointment.serviceId || ''));
      if (!service) {
        setAvailableTimes([]);
        return;
      }

      const serviceDuration = ServiceDurations.getDuration(service);
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      if (!doctor || !doctor.available) {
        setAvailableTimes([]);
        return;
      }

      // Get clinic schedule
      const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
      const clinicDayKey = dayOfWeek as keyof typeof clinicSchedule;
      const clinicDay = clinicSchedule[clinicDayKey];

      if (!clinicDay || !clinicDay.isOpen) {
        setAvailableTimes([]);
        setError('Clinic is closed on this day.');
        return;
      }

      // Get doctor schedules - normalize day name to match both 'day' and 'dayOfWeek' fields
      const daySchedules = schedules.filter((s) => {
        const scheduleDay = (s.day || '').toString();
        return s.doctorId === appointment.doctorId && scheduleDay === dayOfWeek;
      });

      if (daySchedules.length === 0) {
        setAvailableTimes([]);
        return;
      }

      // Use the first schedule for the day
      const doctorSchedule = daySchedules[0];
      const actualStart = doctorSchedule.startTime > clinicDay.startTime ? doctorSchedule.startTime : clinicDay.startTime;
      const actualEnd = doctorSchedule.endTime < clinicDay.endTime ? doctorSchedule.endTime : clinicDay.endTime;

      const allSlots = ServiceDurations.generateTimeSlots(actualStart, actualEnd, 30);

      // Get break time from clinic schedule
      const breakStart = clinicDay.breakStartTime;
      const breakEnd = clinicDay.breakEndTime;

      // Filter slots to only show available ones based on service duration
      const availableSlots = allSlots.filter((slot) => {
        if (slot < doctorSchedule.startTime || slot >= doctorSchedule.endTime) {
          return false;
        }

        const slotEnd = ServiceDurations.addMinutesToTime(slot, serviceDuration);
        if (slotEnd > doctorSchedule.endTime) {
          return false;
        }

        // Check if slot overlaps with break time
        if (breakStart && breakEnd) {
          const startsDuringBreak = slot >= breakStart && slot < breakEnd;
          const endsDuringBreak = slotEnd > breakStart && slotEnd <= breakEnd;
          const spansBreak = slot < breakStart && slotEnd > breakEnd;
          const startsAtBreakStart = slot === breakStart;
          const endsAtBreakEnd = slotEnd === breakEnd;
          
          if (startsDuringBreak || endsDuringBreak || spansBreak || startsAtBreakStart || endsAtBreakEnd) {
            return false;
          }
        }

        // Check if this time slot conflicts with existing appointments (excluding current appointment)
        return ServiceDurations.isTimeSlotAvailable(
          String(appointment.doctorId || ''),
          selectedDate,
          slot,
          serviceDuration,
          appointments,
          appointment.id ? String(appointment.id) : null,
          (id: string) => getServiceById(id)
        );
      });

      setAvailableTimes(availableSlots);
    } catch (error) {
      console.error('Error loading available times:', error);
      setAvailableTimes([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !selectedDate || !selectedTime) {
      setError('Please select a date and time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate date is not in the past
      const selectedDateObj = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDateObj < today) {
        setError('Cannot schedule appointments in the past. Please select a future date.');
        setLoading(false);
        return;
      }

      // Check for conflicts
      const service = getServiceById(String(appointment.serviceId || ''));
      const serviceDuration = ServiceDurations.getDuration(service || appointment.serviceName || '');

      const isAvailable = ServiceDurations.isTimeSlotAvailable(
        String(appointment.doctorId || ''),
        selectedDate,
        selectedTime,
        serviceDuration,
        appointments,
        appointment.id ? String(appointment.id) : null,
        (id: string) => getServiceById(id)
      );

      if (!isAvailable) {
        setError('The selected time slot is not available. Please select a different time.');
        setLoading(false);
        return;
      }

      // Check if selected time overlaps with break time
      const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
      const clinicDayKey = dayOfWeek as keyof typeof clinicSchedule;
      const clinicDay = clinicSchedule[clinicDayKey];
      const breakStart = clinicDay?.breakStartTime;
      const breakEnd = clinicDay?.breakEndTime;
      const slotEnd = ServiceDurations.addMinutesToTime(selectedTime, serviceDuration);
      
      if (breakStart && breakEnd && overlapsBreakTime(selectedTime, slotEnd, breakStart, breakEnd)) {
        setError(
          `The selected time slot overlaps with the clinic's break time (${breakStart} - ${breakEnd}).\n\nPlease select a different time.`
        );
        setLoading(false);
        return;
      }

      // Store reschedule request in notes
      const rescheduleRequest = `RESCHEDULE REQUEST\nRequested Date: ${selectedDate}\nRequested Time: ${selectedTime}\nOriginal Date: ${appointment.date || (appointment as any).appointmentDate}\nOriginal Time: ${appointment.time || (appointment as any).appointmentTime}\n\n`;
      const updatedNotes = appointment.notes 
        ? `${appointment.notes}\n\n${rescheduleRequest}`
        : rescheduleRequest;

      // Update appointment with reschedule request status via API
      const result = await updateAppointment(String(appointment.id), {
        notes: updatedNotes,
        rescheduleRequestedDate: selectedDate,
        rescheduleRequestedTime: selectedTime,
        rescheduleRequested: true,
      });

      if (!result.success) {
        setError(result.message || 'Failed to submit reschedule request');
        setLoading(false);
        return;
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit reschedule request';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  const service = getServiceById(String(appointment.serviceId || ''));
  const serviceDuration = service ? ServiceDurations.getDuration(service) : 30;
  const doctor = doctors.find((d) => d.id === appointment.doctorId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Reschedule" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Current Appointment Info */}
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 dark:from-gold-600/30 dark:to-gold-500/30 rounded-lg p-4 border-2 border-gold-200 dark:border-gold-600">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Current Appointment</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-900 dark:text-white"><span className="font-semibold">Service:</span> {appointment.serviceName || 'Service'}</p>
            <p className="text-gray-900 dark:text-white"><span className="font-semibold">Doctor:</span> {doctor ? doctor.name : 'Unknown'}</p>
            <p className="text-gray-900 dark:text-white"><span className="font-semibold">Date:</span> {appointment.date || (appointment as any).appointmentDate}</p>
            <p className="text-gray-900 dark:text-white"><span className="font-semibold">Time:</span> {appointment.time || (appointment as any).appointmentTime}</p>
            <p className="text-gray-900 dark:text-white"><span className="font-semibold">Duration:</span> {ServiceDurations.minutesToTime(serviceDuration)}</p>
          </div>
        </div>

        {/* New Date */}
        <div>
          <label htmlFor="rescheduleDate" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            New Date *
          </label>
          <input
            type="date"
            id="rescheduleDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            required
          />
        </div>

        {/* New Time */}
        <div>
          <label htmlFor="rescheduleTime" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            New Time *
          </label>
          {availableTimes.length === 0 ? (
            <div className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-gray-100 dark:bg-black-800 text-gray-500 dark:text-gray-400">
              {selectedDate ? 'No available time slots for this date' : 'Please select a date first'}
            </div>
          ) : (
            <select
              id="rescheduleTime"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
              required
            >
              <option value="">Select a time</option>
              {availableTimes.map((time) => (
                <option key={time} value={time}>
                  {(() => {
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour % 12 || 12;
                    return `${displayHour}:${minutes} ${ampm}`;
                  })()}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">Note:</p>
          <p>Your reschedule request will be sent to staff/admin for approval. You will be notified once it is confirmed.</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedDate || !selectedTime}
            className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
