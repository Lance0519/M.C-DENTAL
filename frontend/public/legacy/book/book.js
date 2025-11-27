// Public Booking Page - Customer Side

// Calendar state variables
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let selectedCalendarDate = null;
let selectedTimeSlot = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if health screening was passed
    const screeningPassed = sessionStorage.getItem('healthScreeningPassed');
    if (!screeningPassed) {
        // Show health screening modal
        showHealthScreeningModal();
    }
    
    // Load dropdowns (services section removed - services still available in dropdown)
    loadProcedureDropdown();
    loadDoctorsDropdown();
    
    // Listen for storage changes (multi-tab sync) to refresh services
    window.addEventListener('storage', (e) => {
        if (e.key === 'clinicData' || e.key === 'lastDataUpdate') {
            // Refresh service dropdown when services are updated
            loadProcedureDropdown();
            loadDoctorsDropdown();
        }
    });
    
    // Listen for custom data update events (same-tab sync)
    window.addEventListener('clinicDataUpdated', () => {
        // Refresh service dropdown when services are updated
        loadProcedureDropdown();
        loadDoctorsDropdown();
    });
    
    // Handle doctor selection - show calendar and enable date selection
    const doctorSelect = document.getElementById('selectedDoctor');
    const calendarTimeGroup = document.getElementById('calendarTimeGroup');
    const calendarDisabledMessage = document.getElementById('calendarDisabledMessage');
    
    if (doctorSelect) {
        doctorSelect.addEventListener('change', function() {
            const selectedDoctorId = this.value;
            
            if (selectedDoctorId) {
                // Show calendar and hide disabled message
                if (calendarTimeGroup) {
                    calendarTimeGroup.style.display = 'block';
                }
                if (calendarDisabledMessage) {
                    calendarDisabledMessage.style.display = 'none';
                }
                
                // Initialize calendar with current month
                initializeCalendar();
                
                // Clear previous selections
                selectedCalendarDate = null;
                selectedTimeSlot = null;
                document.getElementById('appointmentDate').value = '';
                document.getElementById('preferredTime').value = '';
                updateSelectedDateDisplay();
                clearTimeSlots();
            } else {
                // Hide calendar and show disabled message
                if (calendarTimeGroup) {
                    calendarTimeGroup.style.display = 'none';
                }
                if (calendarDisabledMessage) {
                    calendarDisabledMessage.style.display = 'block';
                }
                
                // Clear selections
                selectedCalendarDate = null;
                selectedTimeSlot = null;
                document.getElementById('appointmentDate').value = '';
                document.getElementById('preferredTime').value = '';
            }
        });
    }
    
    // Handle service change - reload time slots if date is already selected
    document.getElementById('dentalProcedure')?.addEventListener('change', function() {
        if (selectedCalendarDate && doctorSelect && doctorSelect.value) {
            loadAvailableTimeSlotsForCalendar();
        }
    });
    
    // Handle form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
    
    // Handle health screening form submission
    document.getElementById('healthScreeningForm').addEventListener('submit', handleHealthScreeningSubmit);
    
    // Handle payment method change to show/hide card type
    document.getElementById('paymentMethod')?.addEventListener('change', function() {
        const cardTypeContainer = document.getElementById('cardTypeContainer');
        const paymentMethod = this.value;
        if (paymentMethod === 'Debit Card' || paymentMethod === 'Credit Card') {
            cardTypeContainer.style.display = 'block';
            document.getElementById('cardType').required = true;
        } else {
            cardTypeContainer.style.display = 'none';
            document.getElementById('cardType').required = false;
            document.getElementById('cardType').value = '';
        }
    });
    
    // For registered patients, hide personal info fields and use stored account data
    const currentUser = Storage.getCurrentUser();
    if (currentUser && currentUser.role === 'patient') {
        // Hide personal information fields for registered patients
        const nameField = document.getElementById('customerName');
        const ageField = document.getElementById('customerAge');
        const contactField = document.getElementById('customerContact');
        const nameGroup = nameField?.closest('.form-group') || nameField?.parentElement;
        const ageGroup = ageField?.closest('.form-group') || ageField?.parentElement;
        const contactGroup = contactField?.closest('.form-group') || contactField?.parentElement;
        
        // Calculate age from dateOfBirth if available
        let userAge = '';
        if (currentUser.dateOfBirth) {
            const birthDate = new Date(currentUser.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            userAge = age.toString();
        }
        
        // Remove required attribute before hiding to prevent validation errors
        if (nameField) {
            nameField.removeAttribute('required');
            nameField.value = currentUser.fullName || currentUser.name || '';
        }
        if (ageField) {
            ageField.removeAttribute('required');
            ageField.value = userAge || currentUser.age || '';
        }
        if (contactField) {
            contactField.removeAttribute('required');
            contactField.value = currentUser.phone || currentUser.contact || '';
        }
        
        // Hide the form groups
        if (nameGroup) nameGroup.style.display = 'none';
        if (ageGroup) ageGroup.style.display = 'none';
        if (contactGroup) contactGroup.style.display = 'none';
        
        // Store user data for use in appointment creation
        window.currentBookingUser = currentUser;
    }
});

// Show health screening modal
function showHealthScreeningModal() {
    const modal = document.getElementById('healthScreeningModal');
    modal.classList.add('show');
}

// Close health screening modal
function closeHealthScreeningModal() {
    const modal = document.getElementById('healthScreeningModal');
    modal.classList.remove('show');
}

// Go back from health screening
function goBackFromScreening() {
    CustomConfirm.show(
        'Are you sure you want to go back? You will need to complete the health screening to book an appointment.',
        'Go Back',
        {
            confirmText: 'Yes, Go Back',
            cancelText: 'No, Stay',
            onConfirm: () => {
                sessionStorage.removeItem('healthScreeningPassed');
                window.location.href = '../home/index.html';
            },
            onCancel: () => {
                // Stay on current page - do nothing
            }
        }
    );
}

// Handle health screening submission
function handleHealthScreeningSubmit(e) {
    e.preventDefault();
    
    // Get all answers
    const answers = {
        q1: document.querySelector('input[name="q1"]:checked').value,
        q2: document.querySelector('input[name="q2"]:checked').value,
        q3: document.querySelector('input[name="q3"]:checked').value,
        q4: document.querySelector('input[name="q4"]:checked').value,
        q5: document.querySelector('input[name="q5"]:checked').value
    };
    
    // Check if any answer is "yes"
    const hasSymptoms = Object.values(answers).some(answer => answer === 'yes');
    
    if (hasSymptoms) {
        // User has symptoms - show custom alert
        CustomAlert.error('Based on your responses, we recommend that you stay at home and contact your health care provider.\n\nFor your safety and the safety of others, please reschedule your appointment once you have recovered.\n\nFor urgent dental concerns, please call the clinic directly.');
        
        setTimeout(() => {
            CustomConfirm.show(
                'Would you like to go to our contact page to get in touch with us?',
                'Contact Us',
                {
                    confirmText: 'Yes, Go to Contact',
                    cancelText: 'No, Go to Home',
                    onConfirm: () => {
                        window.location.href = '../contact/contact.html';
                    },
                    onCancel: () => {
                        // Cancel goes to Home Page, not contact page
                        // Clear screening flag when user explicitly chooses to go home
                        sessionStorage.removeItem('healthScreeningPassed');
                        sessionStorage.removeItem('screeningDate');
                        document.getElementById('healthScreeningForm').reset();
                        closeHealthScreeningModal();
                        window.location.href = '../home/index.html';
                    }
                }
            );
        }, 2000);
    } else {
        // All answers are "no" - proceed to booking
        sessionStorage.setItem('healthScreeningPassed', 'true');
        sessionStorage.setItem('screeningDate', new Date().toISOString());
        
        // Show success message
        CustomAlert.success('Thank you for completing the health screening.\n\nYou may now proceed with your booking.');
        
        // Close modal
        closeHealthScreeningModal();
    }
}

// Load and display services in the grid (DEPRECATED - services section removed)
// Services are still available in the procedure dropdown
function loadServicesDisplay() {
    // Services section removed - function kept for backwards compatibility but does nothing
    const container = document.getElementById('servicesList');
    if (!container) {
        return; // Element doesn't exist, silently return
    }
}

// Helper function to format duration
function formatDuration(value) {
    if (typeof ServiceDurations !== 'undefined') {
        const minutes = ServiceDurations.getDuration({ duration: value });
        return ServiceDurations.minutesToTime(minutes);
    }
    
    const minutes = parseInt(value, 10);
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
}

// Load available time slots based on selected doctor, date, and service
function loadAvailableTimeSlots() {
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('preferredTime');
    const serviceSelect = document.getElementById('dentalProcedure');
    const doctorSelect = document.getElementById('selectedDoctor');
    
    if (!dateInput || !timeSelect) return;
    
    // REQUIRE doctor selection first
    const selectedDoctorId = doctorSelect ? doctorSelect.value : '';
    if (!selectedDoctorId) {
        timeSelect.innerHTML = '<option value="">Select a dentist first</option>';
        timeSelect.disabled = true;
        return;
    }
    
    const selectedDate = dateInput.value;
    if (!selectedDate) {
        timeSelect.innerHTML = '<option value="">Select a date first</option>';
        timeSelect.disabled = true;
        return;
    }
    
    // Get selected service to determine duration
    const selectedServiceId = serviceSelect ? serviceSelect.value : '';
    let serviceDuration = 30; // Default 30 minutes
    
    if (selectedServiceId && typeof ServiceDurations !== 'undefined') {
        if (selectedServiceId === 'consultation') {
            const consultationService = Storage.getServiceById('srv001');
            serviceDuration = ServiceDurations.getDuration(consultationService || 'consultation');
        } else {
            const service = Storage.getServiceById(selectedServiceId);
            if (service) {
                serviceDuration = ServiceDurations.getDuration(service);
            } else {
                serviceDuration = ServiceDurations.getDuration(selectedServiceId);
            }
        }
    }
    
    // Get clinic schedule
    const clinicSchedule = Storage.getClinicSchedule();
    const dateObj = new Date(selectedDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const clinicDay = clinicSchedule[dayOfWeek];
    
    if (!clinicDay || !clinicDay.isOpen) {
        timeSelect.innerHTML = '<option value="">Clinic is closed on ' + dayOfWeek + 's</option>';
        return;
    }
    
    // Get selected doctor (required - no auto-assign)
    const doctor = Storage.getDoctorById(selectedDoctorId);
    if (!doctor || !doctor.available) {
        timeSelect.innerHTML = '<option value="">Selected dentist is not available</option>';
        return;
    }
    
    // Get doctor's schedule for this day
    const schedules = Storage.getSchedules();
    const daySchedules = schedules.filter(s => s.day === dayOfWeek);
    const doctorSchedule = daySchedules.find(s => s.doctorId === selectedDoctorId);
    
    if (!doctorSchedule) {
        timeSelect.innerHTML = '<option value="">Selected dentist has no schedule for ' + dayOfWeek + 's</option>';
        return;
    }
    
    // Use clinic hours and doctor's schedule as limits
    const clinicStart = clinicDay.startTime;
    const clinicEnd = clinicDay.endTime;
    const doctorStart = doctorSchedule.startTime;
    const doctorEnd = doctorSchedule.endTime;
    
    // Find the overlapping time between clinic hours and doctor's schedule
    const actualStart = clinicStart > doctorStart ? clinicStart : doctorStart;
    const actualEnd = clinicEnd < doctorEnd ? clinicEnd : doctorEnd;
    
    if (actualStart >= actualEnd) {
        timeSelect.innerHTML = '<option value="">No available time slots (clinic hours conflict)</option>';
        return;
    }
    
    // Generate all possible 30-minute time slots
    const allSlots = Utils.generateTimeSlots(actualStart, actualEnd, 30);
    
    // Filter slots to only show those where the selected doctor is available
    const availableSlots = allSlots.filter(slot => {
        // Check if slot is within doctor's schedule
        if (slot < doctorSchedule.startTime || slot >= doctorSchedule.endTime) {
            return false;
        }
        
        // Check if slot end time is within doctor's schedule
        const slotEnd = ServiceDurations.addMinutesToTime(slot, serviceDuration);
        if (slotEnd > doctorSchedule.endTime) {
            return false;
        }
        
        // Check if this time slot conflicts with existing appointments for this doctor
        if (typeof ServiceDurations !== 'undefined') {
            return ServiceDurations.isTimeSlotAvailable(selectedDoctorId, selectedDate, slot, serviceDuration);
        }
        
        return true;
    });
    
    if (availableSlots.length === 0) {
        timeSelect.innerHTML = '<option value="">No available time slots for this date</option>';
        return;
    }
    
    // Populate time select with available slots
    timeSelect.innerHTML = '<option value="">Select Time Slot</option>' +
        availableSlots.map(slot => {
            const time12 = Utils.formatTime(slot);
            return `<option value="${slot}">${time12}</option>`;
        }).join('');
}

// Load and display promos
function loadPromosDisplay() {
    try {
        const promos = Storage.getPromos();
        const container = document.getElementById('promosList');
        
        if (!container) return;
        
        // Filter out expired promos
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activePromos = promos.filter(promo => {
            if (!promo.validUntil) return true;
            const validUntil = new Date(promo.validUntil);
            validUntil.setHours(0, 0, 0, 0);
            return validUntil >= today;
        });
        
        if (activePromos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No active promotions at the moment.</p>';
            return;
        }
        
        container.innerHTML = activePromos.map(promo => `
            <div class="promo-card">
                <div class="promo-badge">${promo.discount || 'SPECIAL OFFER'}</div>
                <h4>${promo.title}</h4>
                <p>${promo.description}</p>
                ${promo.originalPrice ? `
                    <div class="promo-pricing">
                        <span class="original-price">${Utils.toPeso(promo.originalPrice)}</span>
                        <span class="promo-price">${Utils.toPeso(promo.price || promo.promoPrice)}</span>
                    </div>
                ` : `
                    <div class="promo-pricing">
                        <span class="promo-price">${Utils.toPeso(promo.price || promo.promoPrice)}</span>
                    </div>
                `}
                ${promo.validUntil ? `
                    <div class="promo-validity">Valid until: ${new Date(promo.validUntil).toLocaleDateString()}</div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading promos:', error);
    }
}

// Populate procedure dropdown
function loadProcedureDropdown() {
    const services = Storage.getServices();
    const select = document.getElementById('dentalProcedure');
    
    // Get duration for consultation (30 minutes default)
    const consultationService = services.find(s => s && (s.id === 'srv001' || (s.name && s.name.trim().toLowerCase() === 'consultation')));
    const consultationDuration = ServiceDurations.getDuration(consultationService || 'consultation');
    const consultationOption = `<option value="consultation">Consultation (${formatDuration(consultationDuration)})</option>`;
    
    const serviceOptions = services
        .filter(s => !(s && (s.id === 'srv001' || (s.name && s.name.trim().toLowerCase() === 'consultation'))))
        .map(s => {
            const duration = ServiceDurations.getDuration(s);
            const durationText = formatDuration(duration);
            return `<option value="${s.id}">${s.name} (${durationText})</option>`;
        }).join('');
    
    select.innerHTML = '<option value="">Select Procedure</option>' + consultationOption + serviceOptions;
}

// Populate doctors dropdown
function loadDoctorsDropdown() {
    const doctors = Storage.getDoctors();
    const select = document.getElementById('selectedDoctor');
    
    if (!select) return;
    
    const availableDoctors = doctors.filter(d => d.available);
    select.innerHTML = '<option value="">Select a dentist first</option>' +
        availableDoctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
}

// ============================================
// Calendar Functions (keeping all existing logic)
// ============================================

// Initialize calendar
function initializeCalendar() {
    renderCalendar();
}

// Render calendar grid
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Update month/year display
    const monthYearDisplay = document.getElementById('calendarMonthYear');
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    }
    
    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Adjust starting day (Monday = 0, Sunday = 6)
    const adjustedStartDay = (startingDayOfWeek + 6) % 7;
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get max allowed date (2 weeks from today)
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 14);
    
    // Get selected doctor
    const doctorSelect = document.getElementById('selectedDoctor');
    const selectedDoctorId = doctorSelect ? doctorSelect.value : '';
    
    // Get doctor's schedules to determine available dates
    let availableDates = [];
    if (selectedDoctorId) {
        const schedules = Storage.getSchedules();
        const doctorSchedules = schedules.filter(s => s.doctorId === selectedDoctorId);
        const clinicSchedule = Storage.getClinicSchedule();
        
        // Check each day in the month
        for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(currentCalendarYear, currentCalendarMonth, day);
            checkDate.setHours(0, 0, 0, 0); // Normalize time for comparison
            const dayOfWeek = dayNames[checkDate.getDay()];
            const daySchedule = doctorSchedules.find(s => s.day === dayOfWeek);
            const clinicDay = clinicSchedule[dayOfWeek];
            
            // Check if date is within allowed range and doctor/clinic is available
            if (checkDate >= today && checkDate <= maxAllowedDate && 
                clinicDay && clinicDay.isOpen && daySchedule) {
                availableDates.push(day);
            }
        }
    }
    
    console.log('Available dates for month:', availableDates);
    
    // Build calendar HTML
    let calendarHTML = '';
    
    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedStartDay; i++) {
        calendarHTML += '<div class="calendar-day"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const checkDate = new Date(currentCalendarYear, currentCalendarMonth, day);
        checkDate.setHours(0, 0, 0, 0); // Normalize time for comparison
        const isPast = checkDate < today;
        const isFuture = checkDate > maxAllowedDate;
        const isAvailable = availableDates.includes(day);
        
        // Check if this date is selected (compare year, month, and day precisely)
        const isSelected = selectedCalendarDate && 
                          selectedCalendarDate.getDate() === day &&
                          selectedCalendarDate.getMonth() === currentCalendarMonth &&
                          selectedCalendarDate.getFullYear() === currentCalendarYear;
        
        let dayClass = 'calendar-day';
        if (isPast || isFuture || !isAvailable) {
            dayClass += ' disabled';
        } else {
            dayClass += ' available';
        }
        if (isSelected) {
            dayClass += ' selected';
            console.log('Marking date', day, 'as selected in calendar');
        }
        
        // Create date string in YYYY-MM-DD format without timezone conversion
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;
        
        // Only add onclick for available dates
        if (isAvailable && !isPast && !isFuture) {
            calendarHTML += `<div class="${dayClass}" data-date="${dateStr}" onclick="selectCalendarDate('${dateStr}')" style="cursor: pointer;">${day}</div>`;
        } else {
            calendarHTML += `<div class="${dayClass}" data-date="${dateStr}">${day}</div>`;
        }
    }
    
    calendarGrid.innerHTML = calendarHTML;
    console.log('Calendar rendered with', daysInMonth, 'days');
}

// Change month
window.changeMonth = function(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    
    renderCalendar();
};

// Select calendar date
window.selectCalendarDate = function(dateStr) {
    console.log('selectCalendarDate called with:', dateStr);
    
    // Parse date string without timezone conversion issues
    const dateParts = dateStr.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed in JS
    const day = parseInt(dateParts[2]);
    
    // Create date object using local time (no timezone conversion)
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 14);
    
    // Check if date is valid
    if (dateObj < today || dateObj > maxAllowedDate) {
        console.log('Date is out of range');
        return;
    }
    
    // Check if doctor is selected
    const doctorSelect = document.getElementById('selectedDoctor');
    if (!doctorSelect || !doctorSelect.value) {
        CustomAlert.error('Please select a dentist first.');
        console.log('No doctor selected');
        return;
    }
    
    console.log('Date is valid, updating selection...');
    console.log('Selected date object:', dateObj);
    
    // Update selected date
    selectedCalendarDate = dateObj;
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        // Use the same date string format (YYYY-MM-DD)
        dateInput.value = dateStr;
    }
    
    // Clear time selection
    selectedTimeSlot = null;
    const timeInput = document.getElementById('preferredTime');
    if (timeInput) {
        timeInput.value = '';
    }
    
    // Update display and load time slots
    updateSelectedDateDisplay();
    console.log('Calling loadAvailableTimeSlotsForCalendar...');
    
    // Re-render calendar to show selected date highlighted (after updating selectedCalendarDate)
    renderCalendar();
    
    // Load time slots (keep calendar visible - time slots appear next to calendar)
    loadAvailableTimeSlotsForCalendar();
};

// Update selected date display
function updateSelectedDateDisplay() {
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    if (!selectedDateDisplay) return;
    
    if (selectedCalendarDate) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const dayName = dayNames[selectedCalendarDate.getDay()];
        const monthName = monthNames[selectedCalendarDate.getMonth()];
        const day = selectedCalendarDate.getDate();
        selectedDateDisplay.textContent = `${dayName}, ${monthName} ${day}`;
    } else {
        selectedDateDisplay.textContent = 'Select a date';
    }
}

// Clear time slots display
function clearTimeSlots() {
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    if (timeSlotsContainer) {
        timeSlotsContainer.innerHTML = '<div class="no-time-slots">Select a date to see available time slots</div>';
    }
}

// Hide calendar and show time slots only
function hideCalendar() {
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const timeSlotsWrapper = document.querySelector('.time-slots-wrapper');
    const calendarTimeContainer = document.querySelector('.calendar-time-container');
    
    if (calendarWrapper) {
        calendarWrapper.style.display = 'none';
    }
    
    if (timeSlotsWrapper) {
        timeSlotsWrapper.style.flex = '1 1 100%';
        timeSlotsWrapper.style.maxWidth = '100%';
    }
    
    if (calendarTimeContainer) {
        calendarTimeContainer.style.justifyContent = 'center';
    }
    
    // Add "Change Date" button if it doesn't exist
    const changeDateBtn = document.getElementById('changeDateBtn');
    if (!changeDateBtn && timeSlotsWrapper) {
        const changeDateButton = document.createElement('button');
        changeDateButton.id = 'changeDateBtn';
        changeDateButton.type = 'button';
        changeDateButton.className = 'change-date-btn';
        changeDateButton.textContent = '← Change Date';
        changeDateButton.onclick = showCalendar;
        timeSlotsWrapper.insertBefore(changeDateButton, timeSlotsWrapper.firstChild);
    }
}

// Show calendar again
function showCalendar() {
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const timeSlotsWrapper = document.querySelector('.time-slots-wrapper');
    const calendarTimeContainer = document.querySelector('.calendar-time-container');
    const changeDateBtn = document.getElementById('changeDateBtn');
    
    if (calendarWrapper) {
        calendarWrapper.style.display = 'block';
    }
    
    if (timeSlotsWrapper) {
        timeSlotsWrapper.style.flex = '1';
        timeSlotsWrapper.style.maxWidth = 'none';
    }
    
    if (calendarTimeContainer) {
        calendarTimeContainer.style.justifyContent = 'space-between';
    }
    
    // Remove "Change Date" button
    if (changeDateBtn) {
        changeDateBtn.remove();
    }
}

// Load available time slots for calendar (using existing logic)
function loadAvailableTimeSlotsForCalendar() {
    console.log('loadAvailableTimeSlotsForCalendar called');
    console.log('selectedCalendarDate:', selectedCalendarDate);
    
    // Ensure time slots container is visible when loading time slots
    showTimeSlotsContainer();
    
    if (!selectedCalendarDate) {
        console.log('No date selected, clearing time slots');
        clearTimeSlots();
        return;
    }
    
    // Fix timezone issue - use local date instead of ISO string which can shift dates
    const year = selectedCalendarDate.getFullYear();
    const month = String(selectedCalendarDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedCalendarDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log('Date string:', dateStr);
    
    const serviceSelect = document.getElementById('dentalProcedure');
    const doctorSelect = document.getElementById('selectedDoctor');
    
    if (!doctorSelect || !doctorSelect.value) {
        console.log('No doctor selected');
        clearTimeSlots();
        return;
    }
    
    console.log('Doctor selected:', doctorSelect.value);
    
    // Get selected service to determine duration
    const selectedServiceId = serviceSelect ? serviceSelect.value : '';
    let serviceDuration = 30; // Default 30 minutes
    
    if (selectedServiceId && typeof ServiceDurations !== 'undefined') {
        if (selectedServiceId === 'consultation') {
            const consultationService = Storage.getServiceById('srv001');
            serviceDuration = ServiceDurations.getDuration(consultationService || 'consultation');
        } else {
            const service = Storage.getServiceById(selectedServiceId);
            if (service) {
                serviceDuration = ServiceDurations.getDuration(service);
            } else {
                serviceDuration = ServiceDurations.getDuration(selectedServiceId);
            }
        }
    }
    
    // Get clinic schedule
    const clinicSchedule = Storage.getClinicSchedule();
    // Use the selectedCalendarDate directly instead of parsing dateStr again
    const dateObj = selectedCalendarDate;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const clinicDay = clinicSchedule[dayOfWeek];
    
    if (!clinicDay || !clinicDay.isOpen) {
        const timeSlotsContainer = document.getElementById('timeSlotsContainer');
        if (timeSlotsContainer) {
            timeSlotsContainer.innerHTML = '<div class="no-time-slots">Clinic is closed on ' + dayOfWeek + 's</div>';
        }
        return;
    }
    
    // Get selected doctor
    const selectedDoctorId = doctorSelect.value;
    const doctor = Storage.getDoctorById(selectedDoctorId);
    
    if (!doctor) {
        const timeSlotsContainer = document.getElementById('timeSlotsContainer');
        if (timeSlotsContainer) {
            timeSlotsContainer.innerHTML = '<div class="no-time-slots">Selected dentist not found</div>';
        }
        return;
    }
    
    // Get doctor's schedule for this day
    const schedules = Storage.getSchedules();
    const daySchedules = schedules.filter(s => s.day === dayOfWeek);
    const doctorSchedule = daySchedules.find(s => s.doctorId === selectedDoctorId);
    
    // Check if doctor has schedule for this day (this is the real availability check)
    if (!doctorSchedule) {
        const timeSlotsContainer = document.getElementById('timeSlotsContainer');
        if (timeSlotsContainer) {
            timeSlotsContainer.innerHTML = '<div class="no-time-slots">Selected dentist has no schedule for ' + dayOfWeek + 's</div>';
        }
        return;
    }
    
    // Doctor has a schedule, so they're available for this day (even if global available flag is false)
    
    // Use clinic hours and doctor's schedule as limits
    const clinicStart = clinicDay.startTime;
    const clinicEnd = clinicDay.endTime;
    const doctorStart = doctorSchedule.startTime;
    const doctorEnd = doctorSchedule.endTime;
    
    // Find the overlapping time between clinic hours and doctor's schedule
    const actualStart = clinicStart > doctorStart ? clinicStart : doctorStart;
    const actualEnd = clinicEnd < doctorEnd ? clinicEnd : doctorEnd;
    
    if (actualStart >= actualEnd) {
        const timeSlotsContainer = document.getElementById('timeSlotsContainer');
        if (timeSlotsContainer) {
            timeSlotsContainer.innerHTML = '<div class="no-time-slots">No available time slots (clinic hours conflict)</div>';
        }
        return;
    }
    
    // Generate all possible 30-minute time slots
    if (typeof Utils === 'undefined' || typeof Utils.generateTimeSlots !== 'function') {
        console.error('Utils.generateTimeSlots not available');
        const timeSlotsContainer = document.getElementById('timeSlotsContainer');
        if (timeSlotsContainer) {
            timeSlotsContainer.innerHTML = '<div class="no-time-slots">Error: Time slot generator not available</div>';
        }
        return;
    }
    
    const allSlots = Utils.generateTimeSlots(actualStart, actualEnd, 30);
    console.log('Generated', allSlots.length, 'potential time slots from', actualStart, 'to', actualEnd);
    
    // Filter slots to only show those where the selected doctor is available
    const availableSlots = allSlots.filter(slot => {
        // Check if slot is within doctor's schedule
        if (slot < doctorSchedule.startTime || slot >= doctorSchedule.endTime) {
            return false;
        }
        
        // Check if slot end time is within doctor's schedule
        if (typeof ServiceDurations === 'undefined' || typeof ServiceDurations.addMinutesToTime !== 'function') {
            console.warn('ServiceDurations.addMinutesToTime not available');
            return true; // Skip duration check if not available
        }
        
        const slotEnd = ServiceDurations.addMinutesToTime(slot, serviceDuration);
        if (slotEnd > doctorSchedule.endTime) {
            return false;
        }
        
        // Check if this time slot conflicts with existing appointments for this doctor
        if (typeof ServiceDurations !== 'undefined' && typeof ServiceDurations.isTimeSlotAvailable === 'function') {
            return ServiceDurations.isTimeSlotAvailable(selectedDoctorId, dateStr, slot, serviceDuration);
        }
        
        return true;
    });
    
    console.log('Filtered to', availableSlots.length, 'available slots');
    
    // Display time slots
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    if (!timeSlotsContainer) {
        console.error('timeSlotsContainer not found!');
        return;
    }
    
    console.log('Available slots found:', availableSlots.length);
    
    if (availableSlots.length === 0) {
        console.log('No available slots, showing message');
        timeSlotsContainer.innerHTML = '<div class="no-time-slots">No available time slots for this date</div>';
        return;
    }
    
    // Create time slot buttons
    console.log('Creating time slot buttons...');
    if (typeof Utils === 'undefined' || typeof Utils.formatTime !== 'function') {
        console.error('Utils.formatTime not available');
        timeSlotsContainer.innerHTML = '<div class="no-time-slots">Error: Time formatter not available</div>';
        return;
    }
    
    const buttonsHTML = availableSlots.map(slot => {
        const time12 = Utils.formatTime(slot);
        const isSelected = selectedTimeSlot === slot;
        return `<button type="button" class="time-slot-btn ${isSelected ? 'selected' : ''}" onclick="selectTimeSlot('${slot}')" data-time="${slot}">${time12}</button>`;
    }).join('');
    
    if (buttonsHTML) {
        timeSlotsContainer.innerHTML = buttonsHTML;
        console.log('Time slots displayed:', availableSlots.length, 'buttons created');
        
        // Force a reflow to ensure visibility
        timeSlotsContainer.offsetHeight;
        
        // Scroll to selected time slot if one is selected
        if (selectedTimeSlot) {
            const selectedButton = timeSlotsContainer.querySelector(`[data-time="${selectedTimeSlot}"]`);
            if (selectedButton) {
                selectedButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Scroll to top if no selection
            timeSlotsContainer.scrollTop = 0;
        }
    } else {
        console.error('No buttons HTML generated');
        timeSlotsContainer.innerHTML = '<div class="no-time-slots">Error generating time slots</div>';
    }
}

// Select time slot
window.selectTimeSlot = function(timeSlot) {
    console.log('selectTimeSlot called with:', timeSlot);
    selectedTimeSlot = timeSlot;
    const timeInput = document.getElementById('preferredTime');
    if (timeInput) {
        timeInput.value = timeSlot;
    }
    
    // Update button states
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    if (timeSlotsContainer) {
        const buttons = timeSlotsContainer.querySelectorAll('.time-slot-btn');
        buttons.forEach(btn => {
            const btnTime = btn.getAttribute('data-time');
            if (btnTime === timeSlot) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }
    
    // Hide time slots and show confirmation
    hideTimeSlots();
    showAppointmentConfirmation();
};

// Hide time slots container
function hideTimeSlots() {
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    const timezoneDisplay = document.querySelector('.timezone-display');
    
    if (timeSlotsContainer) {
        timeSlotsContainer.style.display = 'none';
    }
    
    if (timezoneDisplay) {
        timezoneDisplay.style.display = 'none';
    }
}

// Show time slots container (when date is selected)
function showTimeSlotsContainer() {
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    const timezoneDisplay = document.querySelector('.timezone-display');
    
    if (timeSlotsContainer) {
        timeSlotsContainer.style.display = 'flex';
    }
    
    if (timezoneDisplay) {
        timezoneDisplay.style.display = 'block';
    }
}

// Show time slots again
window.showTimeSlots = function(clearSelection = false) {
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    const timezoneDisplay = document.querySelector('.timezone-display');
    const appointmentConfirmation = document.getElementById('appointmentConfirmation');
    
    if (timeSlotsContainer) {
        timeSlotsContainer.style.display = 'flex';
    }
    
    if (timezoneDisplay) {
        timezoneDisplay.style.display = 'block';
    }
    
    if (appointmentConfirmation) {
        appointmentConfirmation.style.display = 'none';
    }
    
    // Only clear selection if explicitly requested (e.g., when clicking "Change Time" button)
    if (clearSelection) {
        selectedTimeSlot = null;
        const timeInput = document.getElementById('preferredTime');
        if (timeInput) {
            timeInput.value = '';
        }
        
        // Remove selected state from buttons
        const buttons = timeSlotsContainer.querySelectorAll('.time-slot-btn');
        buttons.forEach(btn => {
            btn.classList.remove('selected');
        });
    } else {
        // Preserve selection - re-apply selected state to the previously selected time
        if (selectedTimeSlot && timeSlotsContainer) {
            const buttons = timeSlotsContainer.querySelectorAll('.time-slot-btn');
            buttons.forEach(btn => {
                const btnTime = btn.getAttribute('data-time');
                if (btnTime === selectedTimeSlot) {
                    btn.classList.add('selected');
                }
            });
        }
    }
};

// Show appointment confirmation
function showAppointmentConfirmation() {
    const appointmentConfirmation = document.getElementById('appointmentConfirmation');
    const confirmationDate = document.getElementById('confirmationDate');
    const confirmationTime = document.getElementById('confirmationTime');
    
    if (!appointmentConfirmation) return;
    
    // Update confirmation details
    if (selectedCalendarDate && confirmationDate) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const dayName = dayNames[selectedCalendarDate.getDay()];
        const monthName = monthNames[selectedCalendarDate.getMonth()];
        const day = selectedCalendarDate.getDate();
        confirmationDate.textContent = `${dayName}, ${monthName} ${day}`;
    }
    
    if (selectedTimeSlot && confirmationTime && typeof Utils !== 'undefined' && typeof Utils.formatTime === 'function') {
        confirmationTime.textContent = Utils.formatTime(selectedTimeSlot);
    }
    
    // Show confirmation with animation
    appointmentConfirmation.style.display = 'block';
    setTimeout(() => {
        appointmentConfirmation.classList.add('show');
    }, 10);
    
    // Hide confirmation after 3 seconds
    setTimeout(() => {
        appointmentConfirmation.classList.remove('show');
        setTimeout(() => {
            appointmentConfirmation.style.display = 'none';
            // Show time slots again after confirmation disappears (preserve selection)
            showTimeSlots(false);
        }, 400); // Wait for fade-out animation to complete
    }, 3000); // 3 seconds
}

// Handle booking form submission
function handleBookingSubmit(e) {
    e.preventDefault();
    
    // Check if user is logged in
    const currentUser = Storage.getCurrentUser();
    
    // Get form data
    const doctorSelect = document.getElementById('selectedDoctor');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const cardTypeSelect = document.getElementById('cardType');
    
    // For registered patients, use account data; otherwise use form values
    const nameField = document.getElementById('customerName');
    const ageField = document.getElementById('customerAge');
    const contactField = document.getElementById('customerContact');
    
    // Calculate age from dateOfBirth if user is registered patient
    let userAge = '';
    if (currentUser && currentUser.role === 'patient' && currentUser.dateOfBirth) {
        const birthDate = new Date(currentUser.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        userAge = age.toString();
    }
    
    const procedureSelect = document.getElementById('dentalProcedure');
    const procedureValue = procedureSelect ? procedureSelect.value : '';
    
    // Debug: Log the selected procedure value
    console.log('Form submission - Selected procedure value:', procedureValue);
    
    const formData = {
        name: currentUser && currentUser.role === 'patient' 
            ? (currentUser.fullName || currentUser.name || nameField?.value.trim() || '')
            : (nameField?.value.trim() || ''),
        age: currentUser && currentUser.role === 'patient' 
            ? (userAge || currentUser.age || ageField?.value.trim() || '')
            : (ageField?.value.trim() || ''),
        contact: currentUser && currentUser.role === 'patient' 
            ? (currentUser.phone || currentUser.contact || contactField?.value.trim() || '')
            : (contactField?.value.trim() || ''),
        procedure: procedureValue,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('preferredTime').value,
        doctorId: doctorSelect ? doctorSelect.value : '',
        paymentMethod: paymentMethodSelect ? paymentMethodSelect.value : '',
        cardType: cardTypeSelect ? cardTypeSelect.value : ''
    };
    
    // Validate required fields with specific error messages
    const missingFields = [];
    
    if (!formData.name || formData.name.trim() === '') {
        missingFields.push('Name');
    }
    if (!formData.age || formData.age.trim() === '') {
        missingFields.push('Age');
    }
    if (!formData.contact || formData.contact.trim() === '') {
        missingFields.push('Contact Number');
    }
    if (!formData.procedure || formData.procedure.trim() === '') {
        missingFields.push('Dental Procedure');
    }
    if (!formData.doctorId || formData.doctorId.trim() === '') {
        missingFields.push('Dentist');
    }
    if (!formData.date || formData.date.trim() === '') {
        missingFields.push('Appointment Date');
    }
    if (!formData.time || formData.time.trim() === '') {
        missingFields.push('Appointment Time');
    }
    
    if (missingFields.length > 0) {
        const fieldList = missingFields.join(', ');
        CustomAlert.error(`Please fill in the following required fields: ${fieldList}`);
        return;
    }
    
    // Validate contact number format
    if (!isValidPhoneNumber(formData.contact)) {
        CustomAlert.error('Please enter a valid Philippine mobile number.\n\nAccepted formats:\n• 09XXXXXXXXX\n• +639XXXXXXXXX\n• 639XXXXXXXXX');
        return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        CustomAlert.error('You cannot book appointments in the past.\n\nPlease select today or a future date.');
        return;
    }
    
    // Check if date/time is in the past
    const selectedDateTime = new Date(formData.date + 'T' + formData.time);
    const now = new Date();
    
    if (selectedDateTime < now) {
        CustomAlert.error('You cannot select a time in the past.\n\nPlease select a future date and time for your appointment.');
        return;
    }
    
    // Check if booking is within 2 weeks in advance
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 14); // 2 weeks = 14 days
    
    if (selectedDate > maxDate) {
        CustomAlert.error('Appointments can only be booked up to 2 weeks in advance.\n\nPlease select a date within the next 2 weeks.');
        return;
    }
    
    // Create appointment - works for both registered and non-registered users
    createAppointment(formData, currentUser);
}

// Create appointment
function createAppointment(formData, user) {
    // Get service details
    let serviceId, serviceName;
    let selectedService = null;
    
    // Handle consultation selection - must be mapped to srv001
    if (formData.procedure === 'consultation' || formData.procedure === 'srv001') {
        // Consultation service is always srv001 - use it directly
        serviceId = 'srv001';
        console.log('Mapped consultation to service ID: srv001');
        
        // Get the consultation service directly
        const consultService = Storage.getServiceById('srv001');
        if (!consultService) {
            CustomAlert.error('Consultation service not found. Please contact support.');
            console.error('Consultation service (srv001) not found in storage');
            return;
        }
        serviceName = consultService.name;
        selectedService = consultService;
        
        // Verify it's actually Consultation
        if (consultService.name.toLowerCase() !== 'consultation') {
            console.warn('Service srv001 is not Consultation. Name:', consultService.name);
            // Still use it but log the warning
        }
    } else {
        // For other services, use the selected service ID directly
        serviceId = formData.procedure;
        
        const service = Storage.getServiceById(serviceId);
        if (!service) {
            CustomAlert.error('Selected service not found. Please try again.');
            console.error('Service not found for serviceId:', serviceId, 'Original selection:', formData.procedure);
            return;
        }
        serviceName = service.name;
        selectedService = service;
    }
    
    // Use the selected doctor (required - no auto-assign)
    const availableDoctorId = formData.doctorId;
    
    if (!availableDoctorId) {
        CustomAlert.error('Please select a dentist before submitting your appointment.');
        return;
    }
    
    const availableDoctor = Storage.getDoctorById(availableDoctorId);
    
    if (!availableDoctor) {
        console.error('Doctor not found with ID:', availableDoctorId);
        CustomAlert.error('The selected dentist was not found.\n\nPlease select a different dentist or contact the clinic for assistance.');
        return;
    }
    
    // Check if doctor has schedule for the selected date (this is the real availability check)
    const selectedDate = new Date(formData.date + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[selectedDate.getDay()];
    const schedules = Storage.getSchedules();
    const daySchedules = schedules.filter(s => s.day === dayOfWeek);
    const doctorSchedule = daySchedules.find(s => s.doctorId === availableDoctorId);
    
    if (!doctorSchedule) {
        CustomAlert.error(`The selected dentist has no schedule for ${dayOfWeek}s.\n\nPlease select a different date or dentist.`);
        return;
    }
    
    // Verify the selected time slot is still available for this doctor
    if (typeof ServiceDurations !== 'undefined') {
        const serviceDuration = ServiceDurations.getDuration(selectedService || serviceName);
        
        if (!ServiceDurations.isTimeSlotAvailable(availableDoctorId, formData.date, formData.time, serviceDuration)) {
            CustomAlert.error(`Sorry, the selected time slot is no longer available for ${availableDoctor.name}.\n\nThe selected service requires ${ServiceDurations.minutesToTime(serviceDuration)}.\n\nPlease select a different time.`);
            return;
        }
    }
    
    // Determine patient ID and create patient record if needed
    let patientId;
    let patientName;
    
    if (user && user.role === 'patient') {
        // Registered patient - use their account ID
        patientId = user.id;
        patientName = user.fullName;
    } else {
        // Non-registered patient - create guest appointment record
        patientId = 'guest_appointment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        patientName = formData.name;
    }
    
    // Create notes with patient information
    let notes = `Age: ${formData.age}, Contact: ${formData.contact}`;
    if (!user || user.role !== 'patient') {
        // Add guest patient indicator (for appointments created without account)
        notes = `GUEST PATIENT\nName: ${formData.name}\nAge: ${formData.age}\nContact: ${formData.contact}\n\n${notes}`;
    }
    
    // Get payment info
    let paymentInfo = formData.paymentMethod;
    if ((formData.paymentMethod === 'Debit Card' || formData.paymentMethod === 'Credit Card') && formData.cardType) {
        paymentInfo = `${formData.paymentMethod} (${formData.cardType})`;
    }
    
    // Final verification: ensure service is correct before creating appointment
    // IMPORTANT: For consultation, we already have serviceId='srv001' and serviceName='Consultation'
    // So we should NOT re-fetch the service as it might return the wrong one
    let finalService;
    let verifiedServiceName;
    
    if (formData.procedure === 'consultation') {
        // For consultation, we've already verified and set the correct values above
        // Just verify one more time that srv001 exists and is Consultation
        finalService = Storage.getServiceById('srv001');
        if (!finalService) {
            CustomAlert.error('Consultation service not available. Please contact support.');
            console.error('Consultation service (srv001) not found');
            return;
        }
        
        // CRITICAL CHECK: Ensure srv001 is actually Consultation
        if (finalService.name.toLowerCase() !== 'consultation') {
            console.error('CRITICAL ERROR: srv001 is not Consultation!', {
                expected: 'Consultation',
                found: finalService.name,
                serviceId: finalService.id
            });
            // Force the correct name
            verifiedServiceName = 'Consultation';
            serviceName = 'Consultation';
        } else {
            verifiedServiceName = serviceName; // Already set correctly above
        }
        
        // Ensure serviceId is srv001
        serviceId = 'srv001';
    } else {
        // For other services, get the service normally
        finalService = Storage.getServiceById(serviceId);
        if (!finalService) {
            CustomAlert.error('Selected service not found. Please try again.');
            console.error('Service not found for serviceId:', serviceId, 'Original selection was:', formData.procedure);
            return;
        }
        verifiedServiceName = finalService.name;
    }
    
    // Final validation before creating appointment
    if (formData.procedure === 'consultation') {
        // Triple-check: consultation must be srv001 with name "Consultation"
        if (serviceId !== 'srv001' || verifiedServiceName.toLowerCase() !== 'consultation') {
            console.error('FATAL ERROR: Consultation validation failed!', {
                procedure: formData.procedure,
                serviceId: serviceId,
                serviceName: verifiedServiceName,
                expectedId: 'srv001',
                expectedName: 'Consultation'
            });
            CustomAlert.error('Error: Consultation service validation failed. Please try again or contact support.');
            return;
        }
    }
    
    console.log('Creating appointment with service:', {
        selectedValue: formData.procedure,
        mappedServiceId: serviceId,
        verifiedServiceName: verifiedServiceName,
        finalServiceId: finalService ? finalService.id : 'N/A',
        finalServiceName: finalService ? finalService.name : 'N/A'
    });
    
    // Create appointment object - FORCE Consultation name if consultation was selected
    const finalServiceName = (formData.procedure === 'consultation') ? 'Consultation' : verifiedServiceName;
    
    // Create appointment object - use the verified serviceName
    const appointmentData = {
        patientId: patientId,
        doctorId: availableDoctor.id,
        serviceId: serviceId,
        serviceName: finalServiceName, // FORCE "Consultation" if consultation was selected
        appointmentDate: formData.date,
        appointmentTime: formData.time,
        date: formData.date, // Legacy support
        time: formData.time, // Legacy support
        notes: notes,
        paymentMethod: paymentInfo,
        status: 'pending',
        createdBy: user ? user.id : 'system'
    };
    
    try {
        const createdAppointment = Storage.createAppointment(appointmentData);
        
        // Notify staff about new appointment
        if (typeof Storage.addNotification === 'function' && createdAppointment) {
            Storage.addNotification({
                type: 'appointment',
                title: 'New Appointment',
                message: `${user ? 'Registered Patient' : 'Guest Patient'} ${patientName} booked ${serviceName} on ${formatDate(formData.date)} at ${formatTime(formData.time)} with ${availableDoctor.name}`,
                userId: 'staff', // Notify all staff
                action: 'view',
                actionData: { appointmentId: createdAppointment.id, tab: 'appointments' }
            });
        }
        
        // Don't remove health screening status - it should persist for the session
        // Only remove it when explicitly navigating away or starting a new booking session
        
        // Log appointment booking activity
        if (typeof logActivity === 'function') {
            const userType = user ? 'Registered Patient' : 'Guest Patient';
            const userId = user ? user.id : `guest_${patientId}`;
            const logDetails = `${userType} ${patientName} booked appointment for ${serviceName} on ${formatDate(formData.date)} at ${formatTime(formData.time)} with ${availableDoctor.name}`;
            logActivity('appointment', 'Appointment Booked', logDetails, userId);
        }
        
        // Reset form
        document.getElementById('bookingForm').reset();
        
        // Show success alert
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        overlay.innerHTML = `
            <div class="custom-alert-modal">
                <div class="custom-alert-icon">✅</div>
                <h2 class="custom-alert-title">Success!</h2>
                <p class="custom-alert-message">Appointment Booked Successfully!\n\nPatient: ${patientName}\nService: ${serviceName}\nDentist: ${availableDoctor.name}\nDate: ${formatDate(formData.date)}\nTime: ${formatTime(formData.time)}\n\nWe'll confirm your appointment shortly.${!user ? '\n\nNote: A patient record has been created for you.' : ''}</p>
                <button class="custom-alert-button">OK</button>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        
        // Handle button click
        overlay.querySelector('.custom-alert-button').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                // Redirect registered patients to dashboard, others to home
                if (user && user.role === 'patient') {
                    window.location.href = '../dashboard/patient.html';
                } else {
                    window.location.href = '../home/index.html';
                }
            }, 300);
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        // Check if it's a double-booking error
        if (error.message && error.message.includes('already booked')) {
            CustomAlert.error(`This time slot is already booked.\n\nPlease select a different date or time for your appointment.`);
        } else if (error.message && error.message.includes('Missing required')) {
            CustomAlert.error(`Missing required information.\n\nPlease fill in all required fields and try again.`);
        } else {
            CustomAlert.error(`Failed to book appointment.\n\nError: ${error.message || 'Unknown error'}\n\nPlease try again.`);
        }
        return;
    }
}

// Validate Philippine phone number
function isValidPhoneNumber(phone) {
    if (!phone) return false;
    
    // Remove spaces, dashes, and parentheses
    let cleaned = phone.replace(/[\s\-()]/g, '');
    
    // Handle +63 format (convert to 639 format for validation)
    // +639123456789 should become 639123456789
    if (cleaned.startsWith('+63')) {
        // Remove the + sign, keep the rest (63XXXXXXXXX)
        cleaned = cleaned.substring(1); // Remove '+'
    }
    
    // Check if it's a valid Philippine mobile number (09XXXXXXXXX or 639XXXXXXXXX)
    // Should be 11 digits starting with 09 or 12 digits starting with 639
    return /^(09|639)\d{9}$/.test(cleaned);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Format time for display
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes || '00'} ${ampm}`;
}

// Check for pending booking after login
window.addEventListener('load', () => {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
        const formData = JSON.parse(pendingBooking);
        const currentUser = Storage.getCurrentUser();
        
        if (currentUser) {
            // Auto-fill the form with pending booking data
            document.getElementById('customerName').value = formData.name || '';
            document.getElementById('customerAge').value = formData.age || '';
            document.getElementById('customerContact').value = formData.contact || '';
            document.getElementById('dentalProcedure').value = formData.procedure || '';
            document.getElementById('appointmentDate').value = formData.date || '';
            document.getElementById('preferredTime').value = formData.time || '';
            
            // Clear pending booking
            sessionStorage.removeItem('pendingBooking');
            
            // Show message
            CustomAlert.success('Welcome back! Please review your booking details and click "Book Now" to confirm.');
        }
    }
});
