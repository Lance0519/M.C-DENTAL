// Service Duration Mapping for Smart Scheduling
// Duration in minutes

const ServiceDurations = {
    // Attempt to parse any duration value (number, string like "90", "1 hour 30 minutes", "1:30", etc.)
    _parseDurationValue(value) {
        if (value === undefined || value === null) return NaN;
        
        if (typeof value === 'number') {
            return value > 0 ? Math.round(value) : NaN;
        }
        
        if (typeof value === 'string') {
            const trimmed = value.trim().toLowerCase();
            if (!trimmed) return NaN;
            
            // Handle HH:MM format
            if (/^\d{1,2}:\d{1,2}$/.test(trimmed)) {
                const [h, m] = trimmed.split(':').map(num => parseInt(num, 10));
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
    
    // Map service names to durations (in minutes)
    getDuration: function(serviceInput) {
        if (!serviceInput) return 30; // Default 30 minutes
        
        let durationValue = null;
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
        if (nameForLookup.includes('braces')) return 60;
        if (nameForLookup.includes('pasta')) return 30;
        if (nameForLookup.includes('extraction') || nameForLookup.includes('bunot')) return 30;
        if (nameForLookup.includes('surgery')) return 120;
        
        return 30; // Default
    },
    
    // Get duration for combined services
    getCombinedDuration: function(services) {
        if (!services || services.length === 0) return 30;
        
        let totalMinutes = 0;
        services.forEach(service => {
            const serviceName = typeof service === 'string' ? service : (service.name || '');
            totalMinutes += this.getDuration(serviceName);
        });
        
        return totalMinutes;
    },
    
    // Convert minutes to time string
    minutesToTime: function(minutes) {
        if (!minutes || Number.isNaN(minutes)) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} and ${mins} minute${mins > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return `${mins} minute${mins > 1 ? 's' : ''}`;
        }
    },
    
    // Add minutes to time string (HH:MM)
    addMinutesToTime: function(timeStr, minutes) {
        const [hours, mins] = timeStr.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMins = totalMinutes % 60;
        return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
    },
    
    // Check if time slot is available considering duration for a specific doctor
    isTimeSlotAvailable: function(doctorId, date, startTime, durationMinutes, excludeAppointmentId = null) {
        if (!Storage || typeof Storage.getAppointments !== 'function') {
            console.warn('Storage not available for conflict check');
            return true; // Allow if storage not ready
        }
        
        const appointments = Storage.getAppointments();
        const endTime = this.addMinutesToTime(startTime, durationMinutes);
        
        return !appointments.some(apt => {
            if (apt.id === excludeAppointmentId) return false;
            if (apt.status === 'cancelled') return false;
            
            const aptDate = apt.date || apt.appointmentDate;
            const aptTime = apt.time || apt.appointmentTime;
            if (aptDate !== date || apt.doctorId !== doctorId) return false;
            
            // Get appointment duration - use stored serviceName if available, otherwise lookup service
            let aptServiceName = apt.serviceName;
            if (!aptServiceName && apt.serviceId) {
                const aptService = Storage.getServiceById(apt.serviceId);
                aptServiceName = aptService ? aptService.name : '';
            }
            
            const aptDuration = this.getDuration(aptServiceName || '');
            const aptEndTime = this.addMinutesToTime(aptTime, aptDuration);
            
            // Check for overlap: appointments overlap if:
            // - New appointment starts before existing appointment ends AND
            // - New appointment ends after existing appointment starts
            // This prevents any time overlap between appointments
            // 
            // Example: If existing appointment is 1:00 PM - 1:30 PM (30 mins):
            // - 1:30 PM appointment (30 mins) is OK (no overlap, back-to-back)
            // - 1:15 PM appointment (30 mins) is NOT OK (overlaps from 1:15-1:45)
            // - 1:00 PM appointment (30 mins) is NOT OK (overlaps from 1:00-1:30)
            //
            // Using < and > (not <= and >=) allows back-to-back appointments:
            // - startTime (1:30) < aptEndTime (1:30)? false → no overlap ✓
            const hasOverlap = (startTime < aptEndTime && endTime > aptTime);
            
            if (hasOverlap) {
                console.log(`Overlap detected: Doctor ${doctorId} has appointment from ${aptTime} to ${aptEndTime} (${aptDuration} mins), cannot book from ${startTime} to ${endTime} (${durationMinutes} mins)`);
            }
            
            return hasOverlap;
        });
    },
    
    // Find an available doctor at a specific time slot (returns doctor ID or null)
    findAvailableDoctor: function(date, startTime, durationMinutes, excludeAppointmentId = null) {
        if (!Storage || typeof Storage.getDoctors !== 'function' || typeof Storage.getAppointments !== 'function') {
            console.warn('Storage not available for doctor availability check');
            return null;
        }
        
        const doctors = Storage.getDoctors();
        const availableDoctors = doctors.filter(d => d.available);
        
        if (availableDoctors.length === 0) return null;
        
        // Check each available doctor to see if they have time slot available
        for (const doctor of availableDoctors) {
            if (this.isTimeSlotAvailable(doctor.id, date, startTime, durationMinutes, excludeAppointmentId)) {
                return doctor.id;
            }
        }
        
        return null; // No doctor available at this time slot
    },
    
    // Get available time slots for a doctor on a specific date
    getAvailableTimeSlots: function(doctorId, date, durationMinutes = 30) {
        if (!Storage || typeof Storage.getSchedules !== 'function') {
            console.warn('Storage not available for time slot calculation');
            return [];
        }
        
        const schedules = Storage.getSchedules();
        const doctorSchedules = schedules.filter(s => s.doctorId === doctorId);
        
        if (doctorSchedules.length === 0) return [];
        
        // Get day of week
        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = dayNames[dateObj.getDay()];
        
        const daySchedule = doctorSchedules.find(s => s.day === dayOfWeek);
        if (!daySchedule) return [];
        
        const availableSlots = [];
        const startTime = daySchedule.startTime;
        const endTime = daySchedule.endTime;
        
        // Generate time slots every 15 minutes
        let currentTime = startTime;
        while (currentTime < endTime) {
            const slotEnd = this.addMinutesToTime(currentTime, durationMinutes);
            if (slotEnd <= endTime && this.isTimeSlotAvailable(doctorId, date, currentTime, durationMinutes)) {
                availableSlots.push(currentTime);
            }
            currentTime = this.addMinutesToTime(currentTime, 15);
        }
        
        return availableSlots;
    }
};

