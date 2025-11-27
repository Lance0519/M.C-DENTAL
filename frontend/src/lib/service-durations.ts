// Service Duration Mapping for Smart Scheduling
// Duration in minutes

type ServiceInput = { name?: string; duration?: string | number } | string;

export const ServiceDurations = {
  _parseDurationValue(value: string | number | null | undefined): number {
    if (value === undefined || value === null) return NaN;

    if (typeof value === 'number') {
      return value > 0 ? Math.round(value) : NaN;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      if (!trimmed) return NaN;

      // Handle HH:MM format
      if (/^\d{1,2}:\d{1,2}$/.test(trimmed)) {
        const [h, m] = trimmed.split(':').map((num) => parseInt(num, 10));
        if (!Number.isNaN(h) && !Number.isNaN(m)) {
          return h * 60 + m;
        }
      }

      let totalMinutes = 0;
      const timeRegex = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/g;
      let match;
      while ((match = timeRegex.exec(trimmed)) !== null) {
        const valueNum = parseFloat(match[1]);
        const unit = match[2];
        if (Number.isNaN(valueNum)) continue;

        if (unit.startsWith('h')) {
          totalMinutes += valueNum * 60;
        } else {
          totalMinutes += valueNum;
        }
      }

      if (totalMinutes > 0) {
        return Math.round(totalMinutes);
      }

      const numericValue = parseFloat(trimmed);
      if (!Number.isNaN(numericValue) && numericValue > 0) {
        return Math.round(numericValue);
      }
    }

    return NaN;
  },

  getDuration(serviceInput: ServiceInput): number {
    if (!serviceInput) return 30; // Default 30 minutes

    let durationValue: string | number | null = null;
    let name = '';

    if (typeof serviceInput === 'object') {
      durationValue = serviceInput.duration ?? null;
      name = (serviceInput.name || '').toLowerCase();
    } else {
      name = String(serviceInput).toLowerCase();
    }

    // Try to use the stored duration value first (as minutes)
    const parsedDuration = this._parseDurationValue(durationValue);
    if (!Number.isNaN(parsedDuration) && parsedDuration > 0) {
      return parsedDuration;
    }

    // If we only received a string (possibly "1 hour 30 minutes"), attempt to parse that too
    if (typeof serviceInput === 'string') {
      const parsedFromString = this._parseDurationValue(serviceInput);
      if (!Number.isNaN(parsedFromString) && parsedFromString > 0) {
        return parsedFromString;
      }
    }

    const nameForLookup = name;

    // Exact matches
    if (nameForLookup.includes('braces installation')) return 60;
    if (nameForLookup.includes('adjustment') && nameForLookup.includes('cleaning')) return 30;
    if (nameForLookup.includes('adjustment') && nameForLookup.includes('1 pasta')) return 30;
    if (nameForLookup.includes('adjustment') && nameForLookup.includes('2 pasta')) return 45;
    if (nameForLookup.includes('adjustment') && nameForLookup.includes('3 pasta')) return 60;
    if (nameForLookup.includes('adjustment')) return 15;
    if (nameForLookup.includes('cleaning') || nameForLookup.includes('op')) return 30;
    if (nameForLookup.includes('pasta (1)') || nameForLookup.includes('pasta 1')) return 30;
    if (nameForLookup.includes('pasta (2)') || nameForLookup.includes('pasta 2')) return 45;
    if (nameForLookup.includes('bunot') || nameForLookup.includes('exo')) {
      if (nameForLookup.includes('(1)') || nameForLookup.includes(' 1')) return 30;
      if (nameForLookup.includes('(2)') || nameForLookup.includes(' 2')) return 45;
      return 30;
    }
    if (nameForLookup.includes('odontect') || nameForLookup.includes('oral surgery') || nameForLookup.includes('wisdom tooth extraction')) return 120;

    // Partial matches
    if (nameForLookup.includes('consultation')) return 30;
    if (nameForLookup.includes('extraction')) return 30;
    if (nameForLookup.includes('root canal')) return 90;
    if (nameForLookup.includes('crown') || nameForLookup.includes('jacket')) return 45;
    if (nameForLookup.includes('veneer')) return 90;
    if (nameForLookup.includes('whitening')) return 60;
    if (nameForLookup.includes('x-ray') || nameForLookup.includes('xray')) return 15;
    if (nameForLookup.includes('denture')) return 60;
    if (nameForLookup.includes('braces')) return 60;

    return 30; // Default fallback
  },

  minutesToTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
  },

  addMinutesToTime(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  },

  isTimeSlotAvailable(doctorId: string, date: string, startTime: string, durationMinutes: number, appointments: any[], excludeAppointmentId: string | null = null, getServiceById?: (id: string) => any): boolean {
    const endTime = this.addMinutesToTime(startTime, durationMinutes);

    // Check each appointment for conflicts
    for (const apt of appointments) {
      if (apt.id === excludeAppointmentId) continue;
      
      // Skip cancelled appointments
      const status = String(apt.status || '').toLowerCase();
      if (status === 'cancelled') continue;

      // Handle multiple field name formats from API
      const aptDate = apt.date || apt.appointment_date || (apt as any).appointmentDate;
      const aptTime = apt.time || apt.appointment_time || (apt as any).appointmentTime;
      const aptDoctorId = apt.doctorId || apt.doctor_id;
      
      // Normalize date format (handle "2024-11-27" vs Date objects)
      const normalizedAptDate = typeof aptDate === 'string' ? aptDate.split('T')[0] : String(aptDate);
      const normalizedDate = typeof date === 'string' ? date.split('T')[0] : String(date);
      
      // Check if same doctor and date (use string comparison to handle type mismatches)
      const sameDoctor = String(aptDoctorId) === String(doctorId);
      const sameDate = normalizedAptDate === normalizedDate;
      
      if (!sameDoctor || !sameDate) continue;

      // Normalize time format (handle "09:00:00" vs "09:00")
      const normalizedAptTime = aptTime ? String(aptTime).substring(0, 5) : '';
      const normalizedStartTime = String(startTime).substring(0, 5);

      // Get appointment duration
      let aptServiceName = apt.serviceName || apt.service_name;
      if (!aptServiceName && (apt.serviceId || apt.service_id) && getServiceById) {
        const aptService = getServiceById(String(apt.serviceId || apt.service_id));
        aptServiceName = aptService ? aptService.name : '';
      }

      const aptDuration = this.getDuration(aptServiceName || '');
      const aptEndTime = this.addMinutesToTime(normalizedAptTime, aptDuration);

      // Check for overlap: appointments overlap if:
      // - New appointment starts before existing appointment ends AND
      // - New appointment ends after existing appointment starts
      const hasOverlap = normalizedStartTime < aptEndTime && endTime > normalizedAptTime;
      
      if (hasOverlap) {
        return false; // Slot is NOT available
      }
    }

    return true; // Slot IS available
  },

  // Find an available doctor at a specific time slot (returns doctor ID or null)
  findAvailableDoctor(date: string, startTime: string, durationMinutes: number, doctors: any[], appointments: any[], excludeAppointmentId: string | null = null, getServiceById?: (id: string) => any): string | null {
    const availableDoctors = doctors.filter((doctor) => {
      if (!doctor.available) return false;
      return this.isTimeSlotAvailable(doctor.id, date, startTime, durationMinutes, appointments, excludeAppointmentId, getServiceById);
    });

    return availableDoctors.length > 0 ? availableDoctors[0].id : null;
  },

  // Generate time slots between start and end time with specified interval
  generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number = 30): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
      currentMinutes += intervalMinutes;
    }
    
    return slots;
  }
};

