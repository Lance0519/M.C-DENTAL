// Patient dashboard functionality

let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Require patient authentication
    if (!Auth.requireAuth(['patient'])) {
        return;
    }
    
    currentUser = Auth.getCurrentUser();
    
    // Update UI with user info (check if element exists)
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser) {
        userNameElement.textContent = `Welcome, ${currentUser.fullName || currentUser.name || 'Patient'}`;
    }
    
    // Load dashboard data
    loadUpcomingAppointments();
    loadAppointmentHistory();
    loadProfile();
    loadSessionImages();
    loadPatientChart();
    
    // Auto-refresh every 5 seconds to sync with appointment updates
    setInterval(() => {
        loadUpcomingAppointments();
        loadAppointmentHistory();
    }, 5000);
    
    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'clinicData' || e.key === 'lastDataUpdate') {
            // Reload current user data first
            const updatedUser = Storage.getUserById(currentUser.id);
            if (updatedUser) {
                currentUser = updatedUser;
                Storage.setCurrentUser(currentUser);
            }
            
            loadUpcomingAppointments();
            loadAppointmentHistory();
            loadSessionImages();
            loadPatientChart();
            loadProfile();
        }
    });
    
    // Listen for custom data update events (same-tab sync)
    window.addEventListener('clinicDataUpdated', () => {
        // Reload current user data first
        const updatedUser = Storage.getUserById(currentUser.id);
        if (updatedUser) {
            currentUser = updatedUser;
            Storage.setCurrentUser(currentUser);
        }
        
        loadUpcomingAppointments();
        loadAppointmentHistory();
        loadSessionImages();
        loadPatientChart();
    });
    
    // Auto-refresh session images and chart every 10 seconds when in profile section
    setInterval(() => {
        const profileSection = document.getElementById('profileSection');
        if (profileSection && profileSection.style.display !== 'none') {
            loadSessionImages();
            loadPatientChart();
        }
    }, 10000);
});

// Show/hide sections
function showSection(sectionName) {
    const sections = {
        upcoming: document.getElementById('upcomingSection'),
        history: document.getElementById('historySection'),
        profile: document.getElementById('profileSection')
    };
    
    // Don't hide upcoming and history by default - only hide profile
    if (sectionName === 'profile') {
        // Hide upcoming and history, show profile
        sections.upcoming.style.display = 'none';
        sections.history.style.display = 'none';
        sections.profile.style.display = 'block';
        sections.profile.scrollIntoView({ behavior: 'smooth' });
    } else {
        // For upcoming and history, just scroll to them
        sections.upcoming.style.display = 'block';
        sections.history.style.display = 'block';
        sections.profile.style.display = 'none';
        
        if (sections[sectionName]) {
            sections[sectionName].scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Load upcoming appointments
function loadUpcomingAppointments() {
    const appointments = Storage.getAppointmentsByPatient(currentUser.id);
    const futureAppointments = Utils.getFutureAppointments(appointments)
        .filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed');
    
    const container = document.getElementById('upcomingAppointments');
    if (!container) {
        console.warn('upcomingAppointments container not found');
        return;
    }
    
    if (futureAppointments.length === 0) {
        container.innerHTML = `
            <div class="no-appointments">
                <div class="no-appointments-icon">📅</div>
                <p>No upcoming appointments</p>
                <a href="/legacy/book/book.html" class="btn btn-primary mt-2">Book an Appointment</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = futureAppointments.map(apt => {
        const doctor = Storage.getDoctorById(apt.doctorId);
        const service = Storage.getServiceById(apt.serviceId);
        
        return `
            <div class="appointment-card">
                <div class="appointment-info">
                    <h3>${doctor ? doctor.name : 'Unknown Dentist'}</h3>
                    <div class="appointment-details">
                        <div class="detail-item">
                            <span class="detail-icon">📅</span>
                            <span>${Utils.formatDate(apt.date)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">🕐</span>
                            <span>${Utils.formatTime(apt.time)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">💼</span>
                            <span>${service ? service.name : 'N/A'}</span>
                        </div>
                        ${apt.paymentMethod ? `
                        <div class="detail-item">
                            <span class="detail-icon">💳</span>
                            <span>${apt.paymentMethod}</span>
                        </div>
                        ` : ''}
                    </div>
                    <span class="badge ${Utils.getStatusBadgeClass(apt.status)}">${apt.status.toUpperCase()}</span>
                </div>
                <div class="appointment-actions">
                    <button onclick="openRescheduleModal('${apt.id}')" class="btn btn-warning btn-small">Reschedule</button>
                    <button onclick="cancelAppointment('${apt.id}')" class="btn btn-danger btn-small">Cancel</button>
                </div>
            </div>
        `;
    }).join('');
}

// Load appointment history
function loadAppointmentHistory() {
    const appointments = Storage.getAppointmentsByPatient(currentUser.id);
    // Include past appointments AND all completed appointments (regardless of date)
    // Exclude cancelled appointments from history
    const pastAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date + ' ' + apt.time);
        const now = new Date();
        // Include if appointment is in the past OR if it's completed, but exclude cancelled
        return apt.status !== 'cancelled' && (aptDate < now || apt.status === 'completed');
    });
    
    // Sort by date (newest first)
    pastAppointments.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA; // Newest first
    });
    
    const container = document.getElementById('appointmentHistory');
    if (!container) {
        console.warn('appointmentHistory container not found');
        return;
    }
    
    if (pastAppointments.length === 0) {
        container.innerHTML = `
            <div class="no-appointments">
                <div class="no-appointments-icon"></div>
                <p>No appointment history</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pastAppointments.map(apt => {
        const doctor = Storage.getDoctorById(apt.doctorId);
        const service = Storage.getServiceById(apt.serviceId);
        
        return `
            <div class="appointment-card">
                <div class="appointment-info">
                    <h3>${doctor ? doctor.name : 'Unknown Dentist'}</h3>
                    <div class="appointment-details">
                        <div class="detail-item">
                            <span class="detail-icon">📅</span>
                            <span>${Utils.formatDate(apt.date)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">🕐</span>
                            <span>${Utils.formatTime(apt.time)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">💼</span>
                            <span>${service ? service.name : 'N/A'}</span>
                        </div>
                        ${apt.paymentMethod ? `
                        <div class="detail-item">
                            <span class="detail-icon">💳</span>
                            <span>${apt.paymentMethod}</span>
                        </div>
                        ` : ''}
                    </div>
                    <span class="badge ${Utils.getStatusBadgeClass(apt.status)}">${apt.status.toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Load profile
function loadProfile() {
    // Refresh current user data from storage
    const latestUser = Storage.getUserById(currentUser.id);
    if (latestUser) {
        currentUser = latestUser;
    }
    
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileDOB = document.getElementById('profileDOB');
    const profileAddress = document.getElementById('profileAddress');
    
    if (profileName) profileName.value = currentUser?.fullName || currentUser?.name || '';
    if (profileEmail) profileEmail.value = currentUser?.email || '';
    if (profilePhone) profilePhone.value = currentUser?.phone || '';
    if (profileDOB) profileDOB.value = currentUser?.dateOfBirth || '';
    if (profileAddress) profileAddress.value = currentUser?.address || '';
}

// Load session images (treatment documentation uploaded by staff/admin)
function loadSessionImages() {
    // Get session images for this patient from localStorage
    const sessionImages = Storage.getSessionImagesByPatient(currentUser.id) || [];
    
    const gallery = document.getElementById('sessionImagesGallery');
    const emptyMessage = document.getElementById('emptySessionImages');
    const imageCount = document.getElementById('sessionImageCount');
    
    // Check if elements exist
    if (!gallery || !emptyMessage) {
        console.warn('Session images containers not found');
        return;
    }
    
    // Update count
    if (imageCount) {
        imageCount.textContent = `${sessionImages.length} Image${sessionImages.length !== 1 ? 's' : ''}`;
    }
    
    if (sessionImages.length === 0) {
        gallery.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }
    
    // Show gallery
    emptyMessage.style.display = 'none';
    gallery.style.display = 'block';
    
    // Sort by date (newest first)
    sessionImages.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Group images by session
    const sessionGroups = {};
    sessionImages.forEach(img => {
        const sessionKey = `${img.sessionId || img.date}`;
        if (!sessionGroups[sessionKey]) {
            sessionGroups[sessionKey] = {
                date: img.date,
                sessionTitle: img.sessionTitle || 'Treatment Session',
                procedure: img.procedure || 'Dental Procedure',
                dentist: img.dentist || 'Staff',
                images: []
            };
        }
        sessionGroups[sessionKey].images.push(img);
    });
    
    // Render session groups
    gallery.innerHTML = Object.values(sessionGroups).map(session => `
        <div class="session-image-item">
            <div class="session-image-header">
                <div class="session-image-title">
                    <h4>${session.sessionTitle}</h4>
                    <span class="session-date-badge">${Utils.formatDate(session.date)}</span>
                </div>
            </div>
            
            <div class="session-image-grid">
                ${session.images.map((img, index) => `
                    <div class="session-photo-container" onclick="openImageViewer('${img.id}')">
                        <div class="session-photo-wrapper">
                            <img src="${img.imageUrl}" alt="${img.label}" class="session-photo">
                            <div class="photo-overlay">
                                <span class="photo-label">${img.label || 'Treatment Photo'}</span>
                            </div>
                        </div>
                        <span class="photo-type-badge">${img.type || 'Before'}</span>
                        ${img.description ? `<p class="photo-description">${img.description}</p>` : ''}
                    </div>
                `).join('')}
            </div>
            
            ${(() => {
                const notes = session.images
                    .map(img => ({
                        label: img.label,
                        description: img.description
                    }))
                    .filter(note => note.description && note.description.trim() !== '');
                if (notes.length === 0) {
                    return '';
                }
                return `
                    <div class="session-image-description">
                        <span class="description-label">📝 Notes:</span>
                        <div class="description-text">
                            ${notes.map(note => `
                                <p>${note.label ? `<strong>${note.label}:</strong> ` : ''}${note.description}</p>
                            `).join('')}
                        </div>
                    </div>
                `;
            })()}
            
            <div class="session-meta-info">
                <div class="meta-item">
                    <span class="meta-label">Procedure</span>
                    <span class="meta-value">${session.procedure}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Dentist</span>
                    <span class="meta-value">Dr. ${session.dentist}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Photos</span>
                    <span class="meta-value">${session.images.length} image${session.images.length !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Open image viewer modal
function openImageViewer(imageId) {
    const sessionImages = Storage.getSessionImagesByPatient(currentUser.id) || [];
    const image = sessionImages.find(img => img.id === imageId);
    
    if (!image) return;
    
    const viewerTitle = document.getElementById('imageViewerTitle');
    const viewerImage = document.getElementById('viewerImage');
    const viewerDetails = document.getElementById('imageViewerDetails');
    const viewerMeta = document.getElementById('imageViewerMeta');
    
    if (!viewerTitle || !viewerImage || !viewerDetails) {
        console.warn('Image viewer elements not found');
        return;
    }
    
    viewerTitle.textContent = image.sessionTitle || 'Treatment Session Photo';
    viewerImage.src = image.imageUrl;
    
    const dentistName = (image.dentist || 'Staff').trim().replace(/^Dr\.?\s*/i, '');
    const dentistDisplay = dentistName ? `Dr. ${dentistName}` : 'Staff';
    const formattedDate = Utils.formatDate(image.date);
    const procedure = image.procedure || 'N/A';
    const label = image.label || image.sessionTitle || 'Treatment Photo';
    const photoType = image.type || 'Treatment';
    
    if (viewerMeta) {
        viewerMeta.innerHTML = `
            <h3>${label}</h3>
            <p>${procedure} • ${dentistDisplay}</p>
            <div class="image-meta-chips">
                <span class="image-meta-chip">${photoType}</span>
                <span class="image-meta-chip">${formattedDate}</span>
            </div>
        `;
    }
    
    viewerDetails.innerHTML = `
        <div class="viewer-detail-row">
            <span class="viewer-detail-label">Photo Type:</span>
            <span class="viewer-detail-value">${image.type || 'Treatment'}</span>
        </div>
        <div class="viewer-detail-row">
            <span class="viewer-detail-label">Label:</span>
            <span class="viewer-detail-value">${image.label || 'N/A'}</span>
        </div>
        <div class="viewer-detail-row">
            <span class="viewer-detail-label">Date:</span>
            <span class="viewer-detail-value">${formattedDate}</span>
        </div>
        <div class="viewer-detail-row">
            <span class="viewer-detail-label">Procedure:</span>
            <span class="viewer-detail-value">${procedure}</span>
        </div>
        <div class="viewer-detail-row">
            <span class="viewer-detail-label">Dentist:</span>
            <span class="viewer-detail-value">${dentistDisplay}</span>
        </div>
        ${image.description ? `
            <div class="viewer-detail-row">
                <span class="viewer-detail-label">Notes:</span>
                <span class="viewer-detail-value">${image.description}</span>
            </div>
        ` : ''}
    `;
    
    document.getElementById('imageViewerModal').classList.add('active');
}

// Close image viewer
function closeImageViewer() {
    document.getElementById('imageViewerModal').classList.remove('active');
}

// Refresh session images manually
function refreshSessionImages() {
    loadSessionImages();
    Utils.showNotification('Treatment photos refreshed!', 'success');
}

// Refresh patient chart manually
function refreshPatientChart() {
    loadPatientChart();
    Utils.showNotification('Medical history refreshed!', 'success');
}

// Load patient chart (medical history)
function loadPatientChart() {
    const appointments = Storage.getAppointmentsByPatient(currentUser.id) || [];
    const medicalHistory = Storage.getMedicalHistoryByPatient(currentUser.id) || [];

    const chartList = document.getElementById('patientChartList');
    const emptyMessage = document.getElementById('emptyChartMessage');
    const chartCount = document.getElementById('chartCount');

    if (!chartList || !emptyMessage || !chartCount) {
        console.warn('Patient chart containers not found');
        return;
    }

    const normalizeTime = (timeString) => {
        if (!timeString) return null;
        const parts = timeString.split(':');
        if (parts.length < 2) return timeString;
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) return 'Date not specified';
        const parsed = new Date(dateString);
        if (Number.isNaN(parsed.getTime())) {
            return dateString;
        }
        try {
            return Utils.formatDate(dateString);
        } catch (error) {
            return parsed.toLocaleDateString();
        }
    };

    const formatTimeDisplay = (timeString) => {
        if (!timeString) return 'Time not specified';
        const normalized = normalizeTime(timeString);
        if (!normalized || normalized.includes('undefined')) {
            return timeString;
        }
        try {
            return Utils.formatTime(normalized);
        } catch (error) {
            return timeString;
        }
    };

    const appointmentRecords = appointments
        .filter(apt => apt.status === 'completed' || (apt.status === 'confirmed' && new Date(apt.date) < new Date()))
        .map(apt => {
            const doctor = Storage.getDoctorById(apt.doctorId);
            const service = Storage.getServiceById(apt.serviceId);

            return {
                id: apt.id,
                source: 'appointment',
                date: apt.date,
                time: apt.time,
                serviceName: service ? service.name : (apt.serviceName || 'General Consultation'),
                dentistName: doctor ? doctor.name : (apt.doctorName || 'Unknown Dentist'),
                specialty: doctor ? doctor.specialty : (apt.doctorSpecialty || 'General Dentistry'),
                treatment: apt.treatment || apt.notes || 'No treatment notes recorded',
                remarks: apt.remarks || 'No additional remarks recorded',
                status: apt.status === 'completed' ? 'completed' : 'confirmed'
            };
        });

    const manualRecords = medicalHistory.map(record => {
        const doctor = record.doctorId ? Storage.getDoctorById(record.doctorId) : null;
        const service = record.serviceId ? Storage.getServiceById(record.serviceId) : null;

        return {
            id: record.id,
            source: 'manual',
            date: record.date,
            time: record.time,
            serviceName: service ? service.name : (record.serviceName || 'Treatment Session'),
            dentistName: doctor ? doctor.name : (record.doctorName || 'Clinic Staff'),
            specialty: doctor ? doctor.specialty : '',
            treatment: record.treatment || 'No treatment notes recorded',
            remarks: record.remarks || 'No additional remarks recorded',
            status: 'completed'
        };
    });

    const allRecords = [...appointmentRecords, ...manualRecords];

    const parseDateTime = (record) => {
        if (!record.date) return null;
        const time = normalizeTime(record.time) || '00:00';
        const combined = new Date(`${record.date}T${time}`);
        return Number.isNaN(combined.getTime()) ? null : combined;
    };

    allRecords.sort((a, b) => {
        const dateA = parseDateTime(a);
        const dateB = parseDateTime(b);
        if (dateA && dateB) return dateB - dateA;
        if (dateA) return -1;
        if (dateB) return 1;
        return 0;
    });

    chartCount.textContent = `${allRecords.length} Record${allRecords.length !== 1 ? 's' : ''}`;

    if (allRecords.length === 0) {
        chartList.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    emptyMessage.style.display = 'none';
    chartList.style.display = 'block';

    chartList.innerHTML = allRecords.map(record => {
        const formattedDate = formatDateDisplay(record.date);
        const formattedTime = formatTimeDisplay(record.time);
        const status = (record.status || 'completed').toLowerCase();
        const statusLabel = status === 'completed' ? 'Completed' : status.charAt(0).toUpperCase() + status.slice(1);
        const sourceLabel = record.source === 'manual' ? 'Staff Entry' : 'Appointment Record';

        return `
            <div class="chart-record">
                <div class="chart-record-header">
                    <div class="chart-record-title">
                        <h4>${record.serviceName}</h4>
                        <div class="chart-record-subtitle">
                            Dr. ${record.dentistName}${record.specialty ? ` - ${record.specialty}` : ''}
                        </div>
                    </div>
                    <div class="chart-record-date">
                        📅 ${formattedDate}<br>
                        🕐 ${formattedTime}
                    </div>
                </div>

                <div class="chart-record-details">
                    <div class="chart-detail-item">
                        <span class="chart-detail-label">Record Type</span>
                        <span class="chart-detail-value">${sourceLabel}</span>
                    </div>
                    <div class="chart-detail-item">
                        <span class="chart-detail-label">Service Type</span>
                        <span class="chart-detail-value">${record.serviceName}</span>
                    </div>
                    <div class="chart-detail-item">
                        <span class="chart-detail-label">Status</span>
                        <span class="chart-status-badge chart-status-${status}">✓ ${statusLabel}</span>
                    </div>
                </div>

                <div class="chart-record-remarks">
                    <span class="chart-record-remarks-label">📝 Treatment Notes</span>
                    <div class="chart-record-remarks-text">${record.treatment}</div>
                </div>
                <div class="chart-record-remarks">
                    <span class="chart-record-remarks-label">💬 Remarks</span>
                    <div class="chart-record-remarks-text">${record.remarks}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Update profile
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const updates = {
        fullName: document.getElementById('profileName')?.value || '',
        email: document.getElementById('profileEmail')?.value || '',
        phone: document.getElementById('profilePhone')?.value || '',
        dateOfBirth: document.getElementById('profileDOB')?.value || '',
        address: document.getElementById('profileAddress')?.value || ''
    };
    
    // Validate email and phone
    if (!Utils.validateEmail(updates.email)) {
        Utils.showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (!Utils.validatePhone(updates.phone)) {
        Utils.showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    Storage.updateUser(currentUser.id, updates);
    Object.assign(currentUser, updates);
    Storage.setCurrentUser(currentUser);
    
    // Log patient profile update activity
    if (typeof logActivity === 'function') {
        logActivity('patient', 'Patient Profile Updated', `Patient ${currentUser.fullName} updated their profile: ${Object.keys(updates).join(', ')}`, currentUser.id);
    }
    
    document.getElementById('userName').textContent = `Welcome, ${currentUser.fullName}`;
    
    Utils.showNotification('Profile updated successfully!', 'success');
    
    // Reload session images and patient chart in case data changed
    loadSessionImages();
    loadPatientChart();
    
    // Stay in profile section - just show success, don't redirect
    showSection('profile');
    });
}

// Reschedule appointment
function openRescheduleModal(appointmentId) {
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) return;
    
    const rescheduleAppointmentId = document.getElementById('rescheduleAppointmentId');
    const rescheduleDate = document.getElementById('rescheduleDate');
    
    if (!rescheduleAppointmentId || !rescheduleDate) {
        console.warn('Reschedule form elements not found');
        return;
    }
    
    rescheduleAppointmentId.value = appointmentId;
    rescheduleDate.value = appointment.date;
    rescheduleDate.min = new Date().toISOString().split('T')[0];
    
    // Load available time slots
    loadTimeSlots(appointment.doctorId, appointment.date);
    
    document.getElementById('rescheduleModal').classList.add('active');
}

function closeRescheduleModal() {
    document.getElementById('rescheduleModal').classList.remove('active');
    document.getElementById('rescheduleForm').reset();
}

function loadTimeSlots(doctorId, date) {
    const dayOfWeek = Utils.getDayOfWeek(date);
    const timeSelect = document.getElementById('rescheduleTime');
    
    // Check clinic opening hours first
    const clinicSchedule = Storage.getClinicSchedule();
    const clinicDay = clinicSchedule[dayOfWeek];
    
    if (!clinicDay || !clinicDay.isOpen) {
        timeSelect.innerHTML = '<option value="">Clinic is closed on ' + dayOfWeek + 's</option>';
        return;
    }
    
    // Check doctor's schedule
    const schedules = Storage.getSchedulesByDoctor(doctorId);
    const doctorSchedule = schedules.find(s => s.day === dayOfWeek);
    
    if (!doctorSchedule) {
        timeSelect.innerHTML = '<option value="">Dentist not available on ' + dayOfWeek + 's</option>';
        return;
    }
    
    // Find the overlapping time between clinic hours and doctor's schedule
    const clinicStart = clinicDay.startTime;
    const clinicEnd = clinicDay.endTime;
    const doctorStart = doctorSchedule.startTime;
    const doctorEnd = doctorSchedule.endTime;
    
    // Get the latest start time and earliest end time
    const actualStart = clinicStart > doctorStart ? clinicStart : doctorStart;
    const actualEnd = clinicEnd < doctorEnd ? clinicEnd : doctorEnd;
    
    // Check if there's any overlap
    if (actualStart >= actualEnd) {
        timeSelect.innerHTML = '<option value="">No available slots (clinic hours conflict)</option>';
        return;
    }
    
    // Generate time slots based on the overlapping period
    const slots = Utils.generateTimeSlots(actualStart, actualEnd);
    
    if (slots.length === 0) {
        timeSelect.innerHTML = '<option value="">No available slots</option>';
        return;
    }
    
    timeSelect.innerHTML = '<option value="">Select time</option>' +
        slots.map(slot => `<option value="${slot}">${Utils.formatTime(slot)}</option>`).join('');
}

const rescheduleDateElement = document.getElementById('rescheduleDate');
if (rescheduleDateElement) {
    rescheduleDateElement.addEventListener('change', (e) => {
        const rescheduleAppointmentId = document.getElementById('rescheduleAppointmentId');
        if (!rescheduleAppointmentId) return;
        const appointmentId = rescheduleAppointmentId.value;
        const appointment = Storage.getAppointmentById(appointmentId);
        if (appointment) {
            loadTimeSlots(appointment.doctorId, e.target.value);
        }
    });
}

document.getElementById('rescheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const rescheduleAppointmentId = document.getElementById('rescheduleAppointmentId');
    const rescheduleDate = document.getElementById('rescheduleDate');
    const rescheduleTime = document.getElementById('rescheduleTime');
    
    if (!rescheduleAppointmentId || !rescheduleDate || !rescheduleTime) {
        console.warn('Reschedule form elements not found');
        return;
    }
    
    const appointmentId = rescheduleAppointmentId.value;
    const newDate = rescheduleDate.value;
    const newTime = rescheduleTime.value;
    
    if (!newTime) {
        Utils.showNotification('Please select a time slot', 'error');
        return;
    }
    
    Storage.updateAppointment(appointmentId, {
        date: newDate,
        time: newTime,
        status: 'pending'
    });
    
    Utils.showNotification('Appointment rescheduled successfully! Your appointment is now pending confirmation.', 'success');
    closeRescheduleModal();
    loadUpcomingAppointments();
    
    // Trigger sync so staff/admin see the change
    window.dispatchEvent(new CustomEvent('clinicDataUpdated', {
        detail: { timestamp: Date.now() }
    }));
    localStorage.setItem('lastDataUpdate', Date.now().toString());
});

// Cancel appointment
async function cancelAppointment(appointmentId) {
    const confirmed = await Utils.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmed) {
        return;
    }
    
    Storage.updateAppointment(appointmentId, { status: 'cancelled' });
    Utils.showNotification('Appointment cancelled', 'info');
    loadUpcomingAppointments();
    loadAppointmentHistory();
}

// Refresh appointments manually
function refreshAppointments() {
    loadUpcomingAppointments();
    loadAppointmentHistory();
    Utils.showNotification('Appointments refreshed', 'success');
}

