const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-400 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold-500/30 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2';
const primaryButtonSmallClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-gold-500/30 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2';
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black-900 focus-visible:ring-offset-2';
const secondaryButtonSmallClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black-900 focus-visible:ring-offset-2';

const staffMarkup = `<main class="dashboard">
        <div class="sidebar-overlay"></div>
        <!-- Mobile: Fixed hamburger button -->
        <button class="mobile-hamburger-fixed" onclick="toggleSidebar()" aria-label="Toggle sidebar menu" title="Menu">
            <img src="../assets/icons/hamburger.png" alt="Menu" style="width: 20px; height: 20px;">
        </button>
        <div class="dashboard-wrapper">
            <!-- Left Sidebar Navigation -->
            <aside class="sidebar-nav" id="sidebarNav">
                <!-- Sidebar Header with Logo -->
                <div class="sidebar-header">
                    <button class="sidebar-collapse-btn desktop-collapse-btn mobile-hamburger-btn" onclick="toggleSidebarCollapse()" aria-label="Toggle sidebar">
                        <img src="../assets/icons/hamburger.png" alt="Menu" class="sidebar-icon" style="width: 18px; height: 18px;">
                    </button>
                    <span class="sidebar-logo-text">M.C DENTAL CLINIC</span>
                </div>

                <!-- Navigation Menu -->
                <nav class="sidebar-menu">
                    <button onclick="showCreateAppointmentModal()" class="sidebar-item sidebar-item-primary">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span class="sidebar-text">Create Appointment</span>
                    </button>
                    <button onclick="showCreatePatientModal()" class="sidebar-item sidebar-item-primary">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span class="sidebar-text">Create Patient Account</span>
                    </button>
                    <button class="sidebar-item tab-btn active" data-tab="appointments" onclick="switchTab('appointments')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span class="sidebar-text">Appointments</span>
                    </button>
                    <button class="sidebar-item tab-btn" data-tab="patients" onclick="switchTab('patients')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span class="sidebar-text">Patients</span>
                    </button>
                    <button class="sidebar-item tab-btn" data-tab="services" onclick="switchTab('services')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                        <span class="sidebar-text">Services</span>
                    </button>
                    <button class="sidebar-item tab-btn" data-tab="doctors" onclick="switchTab('doctors')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span class="sidebar-text">Dentists</span>
                    </button>
                    <button class="sidebar-item tab-btn" data-tab="schedules" onclick="switchTab('schedules')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span class="sidebar-text">Schedules</span>
                    </button>
                    <button class="sidebar-item tab-btn" data-tab="promos" onclick="switchTab('promos')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <span class="sidebar-text">Promotions</span>
                    </button>
                </nav>

                <!-- Sidebar Footer with User Actions -->
                <div class="sidebar-footer">
                    <div class="sidebar-user-section">
                        <div class="sidebar-user-info">
                            <div class="profile-picture" id="profilePicture" onclick="showProfileMenu()" style="cursor: pointer;" aria-label="Profile Menu" title="Click to open profile menu">
                                <img id="profileAvatarImage" src="" alt="Profile image" class="profile-picture-img" style="display: none;">
                                <span id="profileInitials">S</span>
                            </div>
                            <div class="sidebar-user-details">
                                <span class="sidebar-user-name" id="userName">Staff User</span>
                                <span class="sidebar-user-job" id="userJobTitle">Office Manager</span>
                                <span class="sidebar-user-role" id="userRole">Staff</span>
                            </div>
                            <button class="sidebar-action-btn sidebar-notification-btn" onclick="showNotifications()" aria-label="Notifications" title="Notifications">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                                <span class="notification-badge"></span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>


            <!-- Main Content Area -->
            <div class="dashboard-content">
                <div class="container">

                    <!-- Appointments Tab -->
                    <div id="appointmentsTab" class="tab-content active">
                        <div class="dashboard-header">
                            <h1 class="dashboard-title">Appointments</h1>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <button onclick="toggleAppointmentView()" class="${secondaryButtonSmallClass}" id="viewToggleBtn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                    <span id="viewToggleText">Calendar View</span>
                                </button>
                                <button onclick="loadAppointments()" class="${secondaryButtonSmallClass}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                                        <polyline points="23 4 23 10 17 10"/>
                                        <polyline points="1 20 1 14 7 14"/>
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <!-- Quick Filters -->
                        <div class="appointment-filters">
                            <div class="filter-group">
                                <label for="appointmentDateFilter">Date Range</label>
                                <select id="appointmentDateFilter" class="form-control" onchange="filterAppointments()" aria-label="Filter appointments by date range" title="Filter appointments by date range">
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="appointmentServiceFilter">Service</label>
                                <select id="appointmentServiceFilter" class="form-control" onchange="filterAppointments()" aria-label="Filter appointments by service" title="Filter appointments by service">
                                    <option value="all">All Services</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="appointmentPatientFilter">Patient</label>
                                <input type="text" id="appointmentPatientFilter" class="form-control" placeholder="Search patient..." onkeyup="filterAppointments()" aria-label="Search appointments by patient name" title="Search appointments by patient name">
                            </div>
                            <div class="filter-group">
                                <label for="appointmentStatusFilter">Status</label>
                                <select id="appointmentStatusFilter" class="form-control" onchange="filterAppointments()" aria-label="Filter appointments by status" title="Filter appointments by status">
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <!-- Calendar View -->
                        <div id="calendarView" class="appointment-view">
                            <div class="calendar-container">
                                <div class="calendar-header">
                                    <button onclick="changeMonth(-1)" class="calendar-nav-btn" aria-label="Go to previous month" title="Go to previous month">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                            <polyline points="15 18 9 12 15 6"/>
                                        </svg>
                                    </button>
                                    <h3 class="calendar-month" id="calendarMonth"></h3>
                                    <button onclick="changeMonth(1)" class="calendar-nav-btn" aria-label="Go to next month" title="Go to next month">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                            <polyline points="9 18 15 12 9 6"/>
                                        </svg>
                                    </button>
                                </div>
                                <div class="calendar-grid" id="calendarGrid">
                                    <!-- Calendar will be populated by JavaScript -->
                                </div>
                            </div>
                        </div>

                        <!-- List View -->
                        <div id="listView" class="appointment-view" style="display: none;">
                            <div id="appointmentsList"></div>
                        </div>
                    </div>

                    <!-- Patients Tab -->
                    <div id="patientsTab" class="tab-content">
                        <div class="dashboard-header">
                            <h1 class="dashboard-title">Patients</h1>
                        </div>
                        <div class="patient-search-container">
                            <div class="search-wrapper">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="m21 21-4.35-4.35"/>
                                </svg>
                                <input type="text" id="staffPatientSearchInput" class="patient-search-input" placeholder="Search patients by name, email, phone, or username...">
                                <button onclick="clearStaffPatientFilter()" class="${secondaryButtonSmallClass}">Clear</button>
                            </div>
                        </div>
                        <div id="patientsList" class="patients-grid"></div>
                    </div>

                    <!-- Services Tab -->
                    <div id="servicesTab" class="tab-content">
                        <div class="section-header">
                            <h2>Services</h2>
                            <button onclick="showCreateServiceModal()" class="${primaryButtonClass}">
                                + Add Service
                            </button>
                        </div>
                        <div id="servicesList" class="data-grid"></div>
                    </div>

                    <!-- Doctors Tab -->
                    <div id="doctorsTab" class="tab-content">
                        <div class="section-header">
                            <h2>Dentists</h2>
                            <button onclick="showCreateDoctorModal()" class="${primaryButtonClass}">
                                + Add Dentist
                            </button>
                        </div>
                        <div id="doctorsList" class="data-grid"></div>
                    </div>

                    <!-- Schedules Tab -->
                    <div id="schedulesTab" class="tab-content">
                        <div class="section-header">
                            <h2>Dentist Schedules</h2>
                            <button onclick="showAddScheduleModal()" class="${primaryButtonClass}">
                                + Add Schedule
                            </button>
                        </div>
                        <div id="schedulesList"></div>
                    </div>

                    <!-- Clinic Schedule Tab -->
                    <div id="clinicScheduleTab" class="tab-content">
                        <div class="dashboard-header">
                            <h1 class="dashboard-title">Clinic Operating Hours</h1>
                        </div>
                        <div id="clinicScheduleManager" class="clinic-schedule-grid"></div>
                    </div>

                    <!-- Promotions Tab -->
                    <div id="promosTab" class="tab-content">
                        <div class="section-header">
                            <h2>Special Promotions</h2>
                            <button onclick="showCreatePromoModal()" class="${primaryButtonClass}">
                                + Add Promotion
                            </button>
                        </div>
                        <div id="promosList" class="data-grid"></div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Create Appointment Modal -->
    <div id="createAppointmentModal" class="modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">Create New Appointment</div>
            <form id="createAppointmentForm">
                <!-- Patient Type Selection -->
                <div class="form-group">
                    <label>Patient Type</label>
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="patientType" value="existing" checked onchange="togglePatientType()">
                            <span>Registered Patient</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="radio" name="patientType" value="walkin" onchange="togglePatientType()">
                            <span>Walk-in Patient</span>
                        </label>
                    </div>
                </div>

                <!-- Existing Patient Selection -->
                <div id="existingPatientSection" class="form-group">
                    <label for="appointmentPatient">Select Patient</label>
                    <select id="appointmentPatient" class="form-control" aria-label="Select patient for appointment" title="Select patient for appointment">
                        <option value="">Select Patient</option>
                    </select>
                </div>

                <!-- Walk-in Patient Information -->
                <div id="walkinPatientSection" style="display: none;">
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label for="walkinName">Full Name</label>
                            <input type="text" id="walkinName" class="form-control" placeholder="Patient Name" aria-label="Enter walk-in patient full name" title="Enter walk-in patient full name">
                        </div>
                        <div class="form-group">
                            <label for="walkinAge">Age</label>
                            <input type="number" id="walkinAge" class="form-control" placeholder="Age" aria-label="Enter walk-in patient age" title="Enter walk-in patient age">
                        </div>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label for="walkinContact">Contact Number</label>
                            <input type="tel" id="walkinContact" class="form-control" placeholder="09XXXXXXXXX" aria-label="Enter walk-in patient contact number" title="Enter walk-in patient contact number">
                        </div>
                        <div class="form-group">
                            <label for="walkinEmail">Email (Optional)</label>
                            <input type="email" id="walkinEmail" class="form-control" placeholder="email@example.com" aria-label="Enter walk-in patient email address (optional)" title="Enter walk-in patient email address (optional)">
                        </div>
                    </div>
                </div>

                <!-- Service Selection -->
                <div class="form-group">
                    <label for="appointmentService">Dental Service</label>
                    <select id="appointmentService" class="form-control" required aria-label="Select dental service for appointment" title="Select dental service for appointment">
                        <option value="">Select Service</option>
                    </select>
                </div>

                <!-- Doctor Assignment (MUST BE SELECTED FIRST) -->
                <div class="form-group">
                    <label for="appointmentDoctor">Select Dentist <span style="color: red;">*</span></label>
                    <select id="appointmentDoctor" class="form-control" required aria-label="Select dentist for appointment" title="Select dentist for appointment">
                        <option value="">Select a dentist first</option>
                    </select>
                    <small style="color: var(--text-color); font-size: 0.85rem;">Please select a dentist to see their available dates and times</small>
                </div>

                <!-- Date and Time (Disabled until doctor is selected) -->
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="appointmentDate">Appointment Date <span style="color: red;">*</span></label>
                        <input type="date" id="appointmentDate" class="form-control" required disabled aria-label="Select appointment date" title="Select appointment date">
                        <small style="color: var(--text-secondary); font-size: 0.85rem;">Select a dentist first to enable date selection</small>
                    </div>
                    <div class="form-group">
                        <label for="appointmentTime">Time <span style="color: red;">*</span></label>
                        <select id="appointmentTime" class="form-control" required disabled aria-label="Select appointment time" title="Select appointment time">
                            <option value="">Select a date first</option>
                        </select>
                        <small style="color: var(--text-secondary); font-size: 0.85rem;">Select a date to see available time slots</small>
                    </div>
                </div>

                <!-- Payment Method -->
                <div class="form-group">
                    <label for="appointmentPaymentMethod">Payment Method</label>
                    <select id="appointmentPaymentMethod" class="form-control" required aria-label="Select payment method for appointment" title="Select payment method for appointment">
                        <option value="">Select Payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Gcash">Gcash</option>
                        <option value="Maya">Maya</option>
                        <option value="Online Banking">Online Banking</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Credit Card">Credit Card</option>
                    </select>
                </div>
                <div id="cardTypeContainer" class="form-group" style="display: none;">
                    <label for="appointmentCardType">Card Type</label>
                    <select id="appointmentCardType" class="form-control" aria-label="Select card type for payment" title="Select card type for payment">
                        <option value="">Select Card Type</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="Visa Card">Visa Card</option>
                        <option value="JBC">JBC</option>
                        <option value="Union Pay">Union Pay</option>
                        <option value="American Express">American Express</option>
                    </select>
                </div>

                <!-- Notes -->
                <div class="form-group">
                    <label>Additional Notes</label>
                    <textarea id="appointmentNotes" class="form-control" rows="3" placeholder="Any special instructions or notes..."></textarea>
                </div>

                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeCreateAppointmentModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Create Appointment</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Create Patient Modal -->
    <div id="createPatientModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Create Patient Account</div>
            <form id="createPatientForm">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="newPatientName">Full Name</label>
                        <input type="text" id="newPatientName" class="form-control" required aria-label="Enter patient full name" title="Enter patient full name">
                    </div>
                    <div class="form-group">
                        <label for="newPatientUsername">Username</label>
                        <input type="text" id="newPatientUsername" class="form-control" required aria-label="Enter patient username" title="Enter patient username">
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="newPatientEmail">Email</label>
                        <input type="email" id="newPatientEmail" class="form-control" required aria-label="Enter patient email address" title="Enter patient email address">
                    </div>
                    <div class="form-group">
                        <label for="newPatientPhone">Phone</label>
                        <input type="tel" id="newPatientPhone" class="form-control" required aria-label="Enter patient phone number" title="Enter patient phone number">
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="newPatientDOB">Date of Birth</label>
                        <input type="date" id="newPatientDOB" class="form-control" required aria-label="Select patient date of birth" title="Select patient date of birth">
                    </div>
                    <div class="form-group">
                        <label for="newPatientPassword">Password</label>
                        <input type="password" id="newPatientPassword" class="form-control" required minlength="6" aria-label="Enter patient password" title="Enter patient password">
                    </div>
                </div>
                <div class="form-group">
                    <label for="newPatientAddress">Address</label>
                    <textarea id="newPatientAddress" class="form-control" rows="2" required aria-label="Enter patient address" title="Enter patient address"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeCreatePatientModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Create Account</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Schedule Modal -->
    <div id="addScheduleModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Add Dentist Schedule</div>
            <form id="addScheduleForm">
                <div class="form-group">
                    <label for="scheduleDoctor">Dentist</label>
                    <select id="scheduleDoctor" class="form-control" required aria-label="Select dentist for schedule" title="Select dentist for schedule">
                        <option value="">Select Dentist</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="scheduleDay">Day of Week</label>
                    <select id="scheduleDay" class="form-control" required aria-label="Select day of week for schedule" title="Select day of week for schedule">
                        <option value="">Select Day</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="scheduleStartTime">Start Time</label>
                    <input type="time" id="scheduleStartTime" class="form-control" required aria-label="Select schedule start time" title="Select schedule start time">
                </div>
                <div class="form-group">
                    <label for="scheduleEndTime">End Time</label>
                    <input type="time" id="scheduleEndTime" class="form-control" required aria-label="Select schedule end time" title="Select schedule end time">
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeAddScheduleModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Add Schedule</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Schedule Modal -->
    <div id="editScheduleModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Edit Dentist Schedule</div>
            <form id="editScheduleForm">
                <input type="hidden" id="editScheduleId">
                <div class="form-group">
                    <label>Dentist</label>
                    <input type="text" id="editScheduleDoctorName" class="form-control" readonly style="background: #2a2a2a;">
                </div>
                <div class="form-group">
                    <label for="editScheduleDay">Day of Week</label>
                    <select id="editScheduleDay" class="form-control" required aria-label="Select day of week for schedule" title="Select day of week for schedule">
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Start Time</label>
                    <input type="time" id="editScheduleStartTime" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>End Time</label>
                    <input type="time" id="editScheduleEndTime" class="form-control" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeEditScheduleModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Update Schedule</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Patient Profile Modal (same as admin) -->
    <div id="patientProfileModal" class="modal">
        <div class="modal-content" style="width: 90%; max-width: 1200px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header patient-profile-header">
                <span id="patientProfileTitle" class="patient-profile-title">Patient Profile</span>
                <button class="modal-close" onclick="closePatientProfileModal()" aria-label="Close patient profile modal" title="Close">✕</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="currentPatientId">
                
                <!-- Personal Information Section -->
                <div class="profile-section">
                    <h3>Personal Information</h3>
                    <form id="patientInfoForm">
                        <div class="grid grid-2">
                            <div class="form-group">
                                <label for="patientFullName">Full Name</label>
                                <input type="text" id="patientFullName" class="form-control" required aria-label="Enter patient full name" title="Enter patient full name">
                            </div>
                            <div class="form-group">
                                <label for="patientEmail">Email</label>
                                <input type="email" id="patientEmail" class="form-control" required aria-label="Enter patient email address" title="Enter patient email address">
                            </div>
                            <div class="form-group">
                                <label for="patientPhone">Phone</label>
                                <input type="tel" id="patientPhone" class="form-control" required aria-label="Enter patient phone number" title="Enter patient phone number">
                            </div>
                            <div class="form-group">
                                <label for="patientDOB">Date of Birth</label>
                                <input type="date" id="patientDOB" class="form-control" required aria-label="Select patient date of birth" title="Select patient date of birth">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="patientAddress">Address</label>
                            <textarea id="patientAddress" class="form-control" rows="2" required aria-label="Enter patient address" title="Enter patient address"></textarea>
                        </div>
                        <button type="submit" class="${primaryButtonClass}">Update Profile</button>
                    </form>
                </div>

                <!-- Treatment Session Documentation Section -->
                <div class="profile-section">
                    <div class="section-header-inline">
                        <h3>Treatment Session Documentation</h3>
                        <button onclick="showUploadSessionImageModal()" class="${primaryButtonSmallClass}">
                            + Upload Session Photo
                        </button>
                    </div>
                    <div id="patientSessionImages" class="session-images-list"></div>
                </div>

                <!-- Medical History Section -->
                <div class="profile-section">
                    <div class="section-header-inline">
                        <h3>Patient Chart - Medical History</h3>
                        <button onclick="showAddMedicalHistoryModal()" class="${primaryButtonSmallClass}">
                            + Add Medical Record
                        </button>
                    </div>
                    <div id="patientMedicalHistory" class="medical-history-list"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Upload Session Image Modal -->
    <div id="uploadSessionImageModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Upload Treatment Session Photo</div>
            <form id="uploadSessionImageForm">
                <div class="form-group">
                    <label for="sessionTitle">Session Title</label>
                    <input type="text" id="sessionTitle" class="form-control" placeholder="e.g., Root Canal Procedure" required aria-label="Enter session title" title="Enter session title">
                </div>
                <div class="form-group">
                    <label for="sessionDate">Date</label>
                    <input type="date" id="sessionDate" class="form-control" required aria-label="Select session date" title="Select session date">
                </div>
                <div class="form-group">
                    <label for="sessionProcedure">Procedure/Service</label>
                    <select id="sessionProcedure" class="form-control" required aria-label="Select procedure or service" title="Select procedure or service">
                        <option value="">Select Procedure</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="sessionDentist">Dentist</label>
                    <select id="sessionDentist" class="form-control" required aria-label="Select dentist for session" title="Select dentist for session">
                        <option value="">Select Dentist</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="sessionPhotoType">Photo Type</label>
                    <select id="sessionPhotoType" class="form-control" required aria-label="Select photo type" title="Select photo type">
                        <option value="Before">Before Treatment</option>
                        <option value="During">During Treatment</option>
                        <option value="After">After Treatment</option>
                        <option value="X-Ray">X-Ray</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="sessionPhotoLabel">Photo Label</label>
                    <input type="text" id="sessionPhotoLabel" class="form-control" placeholder="e.g., Upper right molar" aria-label="Enter photo label" title="Enter photo label">
                </div>
                <div class="form-group">
                    <label for="sessionImageFile">Image File</label>
                    <input type="file" id="sessionImageFile" class="form-control" accept="image/*" required aria-label="Select image file to upload" title="Select image file to upload">
                </div>
                <div class="form-group">
                    <label for="sessionDescription">Notes/Description</label>
                    <textarea id="sessionDescription" class="form-control" rows="3" placeholder="Additional notes about this session..." aria-label="Enter session notes or description" title="Enter session notes or description"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeUploadSessionImageModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Upload Photo</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Medical History Modal -->
    <div id="addMedicalHistoryModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Add Medical History Record</div>
            <form id="addMedicalHistoryForm">
                <div class="form-group">
                    <label for="medHistoryService">Service/Procedure</label>
                    <select id="medHistoryService" class="form-control" required aria-label="Select service or procedure for medical history" title="Select service or procedure for medical history">
                        <option value="">Select Service</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="medHistoryDoctor">Doctor</label>
                    <select id="medHistoryDoctor" class="form-control" required aria-label="Select doctor for medical history" title="Select doctor for medical history">
                        <option value="">Select Doctor</option>
                    </select>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="medHistoryDate">Date</label>
                        <input type="date" id="medHistoryDate" class="form-control" required aria-label="Select medical history date" title="Select medical history date">
                    </div>
                    <div class="form-group">
                        <label for="medHistoryTime">Time</label>
                        <input type="time" id="medHistoryTime" class="form-control" required aria-label="Select medical history time" title="Select medical history time">
                    </div>
                </div>
                <div class="form-group">
                    <label for="medHistoryTreatment">Treatment Notes</label>
                    <textarea id="medHistoryTreatment" class="form-control" rows="3" placeholder="Describe the treatment provided..." required aria-label="Enter treatment notes" title="Enter treatment notes"></textarea>
                </div>
                <div class="form-group">
                    <label for="medHistoryRemarks">Remarks</label>
                    <textarea id="medHistoryRemarks" class="form-control" rows="3" placeholder="Additional remarks or observations..." aria-label="Enter medical history remarks" title="Enter medical history remarks"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeAddMedicalHistoryModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Add Record</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Medical History Modal -->
    <div id="editMedicalHistoryModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Edit Medical History Record</div>
            <form id="editMedicalHistoryForm">
                <input type="hidden" id="editMedHistoryId">
                <div class="form-group">
                    <label>Service/Procedure</label>
                    <input type="text" id="editMedHistoryService" class="form-control" readonly>
                </div>
                <div class="form-group">
                    <label>Doctor</label>
                    <input type="text" id="editMedHistoryDoctor" class="form-control" readonly>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="text" id="editMedHistoryDate" class="form-control" readonly>
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="text" id="editMedHistoryTime" class="form-control" readonly>
                    </div>
                </div>
                <div class="form-group">
                    <label>Treatment Notes</label>
                    <textarea id="editMedHistoryTreatment" class="form-control" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label>Remarks</label>
                    <textarea id="editMedHistoryRemarks" class="form-control" rows="3"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeEditMedicalHistoryModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Update Record</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Change Dentist Modal -->
    <div id="changeDentistModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Assign/Change Dentist</div>
            <form id="changeDentistForm">
                <input type="hidden" id="changeDentistAppointmentId">
                
                <!-- Appointment Info -->
                <div id="changeDentistInfo"></div>
                
                <div class="form-group">
                    <label for="changeDentistSelect">Select New Dentist</label>
                    <select id="changeDentistSelect" class="form-control" required aria-label="Select dentist to assign or reassign appointment" title="Select dentist to assign or reassign appointment">
                        <option value="">Select Dentist</option>
                    </select>
                    <small style="color: var(--text-color); font-size: 0.85rem; margin-top: 0.5rem; display: block;">
                        Choose a dentist to assign or reassign this appointment
                    </small>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeChangeDentistModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Update Dentist</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Appointment Details Modal -->
    <div id="appointmentDetailsModal" class="modal">
        <div class="modal-content appointment-details-modal">
            <div class="modal-header">
                <span>📅 Appointment Details</span>
                <button class="modal-close" onclick="closeAppointmentDetailsModal()" aria-label="Close appointment details modal" title="Close">✕</button>
            </div>
            <div class="modal-body">
                <div id="appointmentDetailsContent"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="${primaryButtonClass}" onclick="closeAppointmentDetailsModal()">Go Back</button>
            </div>
        </div>
    </div>

    <!-- Change Status Modal -->
    <div id="changeStatusModal" class="modal">
        <div class="modal-content change-status-modal">
            <div class="modal-header">
                <span>📝 Change Appointment Status</span>
                <button class="modal-close" onclick="closeChangeStatusModal()" aria-label="Close change status modal" title="Close">✕</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="changeStatusAppointmentId">
                <div id="changeStatusInfo" class="status-info-card"></div>
                <p style="color: var(--text-color); margin: 1.5rem 0 1rem 0; font-size: 1rem;">
                    Select the new status for this appointment:
                </p>
                <div class="status-buttons-grid">
                    <button class="status-btn status-btn-pending" onclick="updateAppointmentStatus('pending')">
                        <span class="status-icon">⏳</span>
                        <span class="status-label">Pending</span>
                    </button>
                    <button class="status-btn status-btn-confirmed" onclick="updateAppointmentStatus('confirmed')">
                        <span class="status-icon">✓</span>
                        <span class="status-label">Confirmed</span>
                    </button>
                    <button class="status-btn status-btn-completed" onclick="updateAppointmentStatus('completed')">
                        <span class="status-icon">✓✓</span>
                        <span class="status-label">Completed</span>
                    </button>
                    <button class="status-btn status-btn-cancelled" onclick="updateAppointmentStatus('cancelled')">
                        <span class="status-icon">✕</span>
                        <span class="status-label">Cancelled</span>
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeChangeStatusModal()">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Reschedule Appointment Modal -->
    <div id="rescheduleModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span>🔄 Reschedule Appointment</span>
                <button class="modal-close" onclick="closeRescheduleModal()" aria-label="Close reschedule modal" title="Close">✕</button>
            </div>
            <form id="rescheduleForm">
                <div class="modal-body">
                    <input type="hidden" id="rescheduleAppointmentId">
                    <div class="form-group">
                        <label for="rescheduleDoctor">Doctor</label>
                        <select id="rescheduleDoctor" class="form-control" required>
                            <option value="">Select Doctor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="rescheduleDate">Date</label>
                        <input type="date" id="rescheduleDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="rescheduleTime">Time</label>
                        <select id="rescheduleTime" class="form-control" required>
                            <option value="">Select time</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeRescheduleModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Reschedule</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Notes Modal -->
    <div id="editNotesModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span>📝 Edit Appointment Notes</span>
                <button class="modal-close" onclick="closeEditNotesModal()" aria-label="Close edit notes modal" title="Close">✕</button>
            </div>
            <form id="editNotesForm">
                <div class="modal-body">
                    <input type="hidden" id="editNotesAppointmentId">
                    <div class="form-group">
                        <label for="editNotesTextarea">Notes</label>
                        <textarea id="editNotesTextarea" class="form-control" rows="6" placeholder="Enter appointment notes..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeEditNotesModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Save Notes</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Create Service Modal -->
    <div id="createServiceModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Add Service</div>
            <form id="createServiceForm">
                <div class="form-group">
                    <label>Service Name</label>
                    <input type="text" id="serviceName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="serviceDescription" class="form-control" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label>Duration</label>
                    <input type="text" id="serviceDuration" class="form-control" placeholder="e.g., 30 mins" required>
                </div>
                <div class="form-group">
                    <label>Price (Internal use only - optional)</label>
                    <input type="text" id="servicePrice" class="form-control" placeholder="Internal use only (optional)" style="opacity: 0.6;">
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeCreateServiceModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Add Service</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Create Doctor Modal -->
    <div id="createDoctorModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Add Dentist</div>
            <form id="createDoctorForm">
                <div class="form-group">
                    <label>Profile Image (Optional)</label>
                    <input type="file" id="doctorProfileImage" class="form-control" accept="image/*">
                    <small style="color: var(--text-secondary); font-size: 0.85rem;">Leave empty to use default icon</small>
                    <div id="doctorImagePreview" style="margin-top: 0.5rem; display: none;">
                        <img id="doctorPreviewImg" src="" alt="Preview" style="max-width: 150px; max-height: 150px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gold-primary);">
                    </div>
                </div>
                <div class="form-group">
                    <label for="doctorName">Dentist Name</label>
                    <input type="text" id="doctorName" class="form-control" required aria-label="Enter dentist name" title="Enter dentist name">
                </div>
                <div class="form-group">
                    <label for="doctorSpecialty">Specialty</label>
                    <select id="doctorSpecialty" class="form-control" required aria-label="Select dentist specialty" title="Select dentist specialty">
                        <option value="">Select Specialty</option>
                        <option value="General Dentistry">General Dentistry</option>
                        <option value="Orthodontics">Orthodontics</option>
                        <option value="Oral Surgery">Oral Surgery</option>
                        <option value="Prosthodontics">Prosthodontics</option>
                        <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                        <option value="Endodontics">Endodontics</option>
                        <option value="Periodontics">Periodontics</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="doctorAvailable">Available</label>
                    <select id="doctorAvailable" class="form-control" aria-label="Set dentist availability" title="Set dentist availability">
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeCreateDoctorModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Add Dentist</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Create Promo Modal -->
    <div id="createPromoModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Add Promotion</div>
            <form id="createPromoForm">
                <div class="form-group">
                    <label>Promotion Title</label>
                    <input type="text" id="promoTitle" class="form-control" placeholder="e.g., Summer Teeth Whitening Special" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="promoDescription" class="form-control" rows="3" placeholder="Describe the promotion details..." required></textarea>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Discount Badge</label>
                        <input type="text" id="promoDiscount" class="form-control" placeholder="e.g., 20% OFF, ₱500 OFF" required>
                    </div>
                    <div class="form-group">
                        <label>Valid Until</label>
                        <input type="date" id="promoValidUntil" class="form-control">
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Original Price (Optional)</label>
                        <input type="text" id="promoOriginalPrice" class="form-control" placeholder="e.g., ₱10,000">
                    </div>
                    <div class="form-group">
                        <label>Promo Price</label>
                        <input type="text" id="promoPrice" class="form-control" placeholder="e.g., ₱8,000" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeCreatePromoModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Add Promotion</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Promo Modal -->
    <div id="editPromoModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Edit Promotion</div>
            <form id="editPromoForm">
                <input type="hidden" id="editPromoId">
                <div class="form-group">
                    <label>Promotion Title</label>
                    <input type="text" id="editPromoTitle" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="editPromoDescription" class="form-control" rows="3" required></textarea>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Discount Badge</label>
                        <input type="text" id="editPromoDiscount" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Valid Until</label>
                        <input type="date" id="editPromoValidUntil" class="form-control">
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Original Price (Optional)</label>
                        <input type="text" id="editPromoOriginalPrice" class="form-control" placeholder="e.g., ₱10,000">
                    </div>
                    <div class="form-group">
                        <label>Promo Price</label>
                        <input type="text" id="editPromoPrice" class="form-control" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeEditPromoModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Update Promotion</button>
                </div>
            </form>
        </div>
    </div>

    <!-- User Profile Modal -->
    <div id="userProfileModal" class="modal">
        <div class="modal-content profile-modal-content">
            <div class="modal-header">
                <span class="modal-title">Manage Profile</span>
                <button class="modal-close" type="button" onclick="closeUserProfileModal()" aria-label="Close profile modal" title="Close">✕</button>
            </div>
            <form id="userProfileForm">
                <div class="modal-body">
                    <div class="profile-modal-grid">
                        <div class="profile-avatar-wrapper">
                            <div class="profile-picture profile-modal-picture" id="profileModalPicture">
                                <img id="profileModalAvatarImage" src="" alt="Profile image preview" class="profile-picture-img" style="display: none;">
                                <span id="profileModalInitials">ST</span>
                            </div>
                            <div class="profile-avatar-actions">
                                <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
                                <label for="profileImageInput" class="${primaryButtonSmallClass} profile-avatar-upload-btn cursor-pointer">Upload Photo</label>
                                <button type="button" class="${secondaryButtonSmallClass} profile-avatar-remove-btn" id="profileImageRemoveBtn">Remove Photo</button>
                            </div>
                        </div>
                        <div class="profile-details-wrapper">
                            <div class="form-group">
                                <label for="profileFullNameInput">Full Name</label>
                                <input type="text" id="profileFullNameInput" class="form-control" placeholder="Enter full name" required>
                            </div>
                            <div class="form-group">
                                <label for="profileJobTitleInput">Job Title</label>
                                <input type="text" id="profileJobTitleInput" class="form-control" placeholder="e.g., Office Manager" required>
                            </div>
                            <div class="profile-meta-overview">
                                <div class="profile-meta-item">
                                    <span class="profile-meta-label">Role / Access Level</span>
                                    <span class="profile-meta-value" id="profileRoleValue">Staff</span>
                                </div>
                                <div class="profile-meta-item">
                                    <span class="profile-meta-label">Email</span>
                                    <span class="profile-meta-value" id="profileEmailValue">staff@clinic.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="${secondaryButtonClass}" onclick="closeUserProfileModal()">Cancel</button>
                    <button type="submit" class="${primaryButtonClass}">Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Notification Modal -->
    <div id="notificationModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2 class="modal-title">Notifications</h2>
                <button class="modal-close" onclick="closeNotificationModal()" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <div id="notificationList" class="notification-list"></div>
                <div id="notificationEmpty" class="notification-empty" style="display: none; text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔔</div>
                    <p>No notifications</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="${secondaryButtonClass}" onclick="markAllNotificationsAsRead()">Mark All as Read</button>
                <button class="${secondaryButtonClass}" onclick="clearAllNotifications()">Clear All</button>
            </div>
        </div>
    </div>

    <!-- Scroll to Top Button -->
    <button id="scrollToTopBtn" class="scroll-to-top-btn" onclick="scrollToTop()" aria-label="Scroll to top" title="Scroll to top">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"/>
        </svg>
    </button>`;

function StaffApp() {
    return React.createElement('div', { dangerouslySetInnerHTML: { __html: staffMarkup } });
}

(function initStaffApp() {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(StaffApp));
})();
