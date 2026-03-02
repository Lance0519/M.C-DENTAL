const patientMarkup = `<header>
        <div class="container">
            <div class="header-content">
                <a href="/legacy/home/index.html" class="logo">
                    <img src="../assets/images/logo.png" alt="M.C DENTAL CLINIC Logo" class="logo-img">
                    <span class="logo-text">M.C DENTAL CLINIC</span>
                </a>
                <div class="user-nav">
                    <span class="user-name" id="userName"></span>
                    <button onclick="Auth.logout()" class="btn-logout">Logout</button>
                </div>
            </div>
        </div>
    </header>

    <main class="dashboard">
        <div class="container">
            <h1 class="dashboard-title">Patient Dashboard</h1>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <a href="/legacy/book/book.html" class="action-card action-card-primary">
                    <div class="action-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                    </div>
                    <h3>Book Appointment</h3>
                    <p>Schedule a new appointment</p>
                </a>
                <div class="action-card action-card-info" onclick="showSection('upcoming')">
                    <div class="action-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 11l3 3L22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                    </div>
                    <h3>My Appointments</h3>
                    <p>View upcoming appointments</p>
                </div>
                <div class="action-card action-card-warning" onclick="showSection('profile')">
                    <div class="action-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <h3>My Profile</h3>
                    <p>Update profile information</p>
                </div>
            </div>

            <!-- Upcoming Appointments Section -->
            <div id="upcomingSection" class="dashboard-section">
                <div class="section-header">
                    <h2>Upcoming Appointments</h2>
                    <button onclick="refreshAppointments()" class="btn btn-secondary" title="Refresh appointments">
                        Refresh
                    </button>
                </div>
                <div id="upcomingAppointments" class="appointments-list"></div>
            </div>

            <!-- Appointment History Section -->
            <div id="historySection" class="dashboard-section">
                <div class="section-header">
                    <h2>Appointment History</h2>
                </div>
                <div id="appointmentHistory" class="appointments-list"></div>
            </div>

            <!-- Profile Section -->
            <div id="profileSection" class="dashboard-section" style="display: none;">
                <div class="section-header">
                    <h2>My Profile</h2>
                </div>

                <!-- Profile Information Card -->
                <div class="card">
                    <div class="card-header">Personal Information</div>
                    <form id="profileForm">
                        <div class="grid grid-2">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" id="profileName" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="profileEmail" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" id="profilePhone" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Date of Birth</label>
                                <input type="date" id="profileDOB" class="form-control" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <textarea id="profileAddress" class="form-control" rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Update Profile</button>
                    </form>
                </div>

                <!-- Session Image Documentation Card -->
                <div class="card">
                    <div class="card-header">
                        <div class="chart-header-content">
                            <span>Treatment Session Documentation</span>
                            <span class="chart-count" id="sessionImageCount">0 Images</span>
                        </div>
                        <button onclick="refreshSessionImages()" class="btn btn-secondary btn-small" title="Refresh to see latest photos">
                            Refresh
                        </button>
                    </div>
                    <div class="session-doc-info">
                        <p>Treatment progress photos uploaded by clinic staff. These images document your dental procedures and treatment progress.</p>
                    </div>
                    <div id="sessionImagesContainer">
                        <div class="session-images-empty" id="emptySessionImages">
                            <div class="empty-session-icon">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                            </div>
                            <p>No treatment photos available yet</p>
                            <small>Your dental procedure documentation will appear here once uploaded by clinic staff</small>
                        </div>
                        <div class="session-images-gallery" id="sessionImagesGallery" style="display: none;">
                            <!-- Session images will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Patient Chart Card -->
                <div class="card">
                    <div class="card-header">
                        <div class="chart-header-content">
                            <span>Patient Chart - Medical History</span>
                            <span class="chart-count" id="chartCount">0 Records</span>
                        </div>
                        <button onclick="refreshPatientChart()" class="btn btn-secondary btn-small" title="Refresh to see latest records">
                            Refresh
                        </button>
                    </div>
                    <div id="patientChartContainer">
                        <div class="patient-chart-empty" id="emptyChartMessage">
                            <div class="empty-chart-icon"></div>
                            <p>No medical history recorded yet</p>
                            <small>Your visit history and completed services will appear here</small>
                        </div>
                        <div class="patient-chart-list" id="patientChartList" style="display: none;">
                            <!-- Chart records will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Image Viewer Modal -->
    <div id="imageViewerModal" class="modal">
        <div class="modal-content image-viewer-content">
            <div class="modal-header">
                <span id="imageViewerTitle">Treatment Session Photo</span>
                <button class="modal-close" onclick="closeImageViewer()">✕</button>
            </div>
            <div class="image-viewer-panel">
                <div class="image-viewer-body">
                    <div class="image-viewer-preview">
                        <div class="image-preview-frame">
                            <img id="viewerImage" src="" alt="Session Image">
                        </div>
                        <div class="image-preview-meta" id="imageViewerMeta"></div>
                    </div>
                </div>
                <div class="image-viewer-details" id="imageViewerDetails">
                    <!-- Image details will be populated here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Reschedule Modal -->
    <div id="rescheduleModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Reschedule Appointment</div>
            <form id="rescheduleForm">
                <input type="hidden" id="rescheduleAppointmentId">
                <div class="form-group">
                    <label>New Date</label>
                    <input type="date" id="rescheduleDate" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>New Time</label>
                    <select id="rescheduleTime" class="form-control" required>
                        <option value="">Select time</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeRescheduleModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Reschedule</button>
                </div>
            </form>
        </div>
    </div>

    <footer>
        <div class="container">
            <p>&copy; 2025 M.C DENTAL CLINIC. All rights reserved.</p>
        </div>
    </footer>`;

function PatientApp() {
    return React.createElement('div', { dangerouslySetInnerHTML: { __html: patientMarkup } });
}

(function initPatientApp() {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(PatientApp));
})();
