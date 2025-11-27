const adminMarkup = `<main class="dashboard">
        <div class="sidebar-overlay"></div>
        <!-- Mobile: Fixed hamburger button (always visible when sidebar is closed) -->
        <button class="mobile-hamburger-fixed" onclick="toggleSidebar()" aria-label="Toggle sidebar menu" title="Menu">
            <img src="/assets/icons/hamburger.png" alt="Menu" style="width: 20px; height: 20px;">
        </button>
        <div class="dashboard-wrapper">
            <!-- Left Sidebar Navigation -->
            <aside class="sidebar-nav" id="sidebarNav">
                <!-- Sidebar Header with Logo -->
                <div class="sidebar-header">
                    
                    <button class="sidebar-collapse-btn desktop-collapse-btn mobile-hamburger-btn" onclick="toggleSidebarCollapse()" aria-label="Toggle sidebar">
                        <img src="/assets/icons/hamburger.png" alt="Menu" class="sidebar-icon" style="width: 18px; height: 18px;">
                    </button>
                    <span class="sidebar-logo-text">M.C DENTAL CLINIC</span>
                </div>

                <!-- Navigation Menu -->
                <nav class="sidebar-menu">
                    <button class="sidebar-item tab-btn active" data-tab="dashboard" onclick="switchTab('dashboard')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        <span class="sidebar-text">Dashboard</span>
                    </button>
                    <button class="sidebar-item tab-btn" data-tab="appointments" onclick="switchTab('appointments')">
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
                    <button class="sidebar-item tab-btn" data-tab="reports" onclick="switchTab('reports')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"/>
                            <line x1="12" y1="20" x2="12" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                        <span class="sidebar-text">Reports</span>
                    </button>
                    <button class="sidebar-item tab-btn" data-tab="doctors" onclick="switchTab('doctors')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span class="sidebar-text">Dentists</span>
                    </button>
                    <button class="sidebar-item tab-btn" data-tab="staff" onclick="switchTab('staff')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span class="sidebar-text">Staff</span>
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
                    <button class="sidebar-item tab-btn" data-tab="audit" onclick="switchTab('audit')">
                        <svg class="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <span class="sidebar-text">Audit Log</span>
                    </button>
                </nav>

                <!-- Sidebar Footer with User Actions -->
                <div class="sidebar-footer">
                    <div class="sidebar-user-section">
                        <div class="sidebar-user-info">
                            <div class="profile-picture" id="profilePicture" onclick="showProfileMenu()" style="cursor: pointer;" aria-label="Profile Menu" title="Click to open profile menu">
                                <img id="profileAvatarImage" src="" alt="Profile image" class="profile-picture-img" style="display: none;">
                                <span id="profileInitials">A</span>
                            </div>
                            <div class="sidebar-user-details">
                                <span class="sidebar-user-name" id="userName">System Administrator</span>
                                <span class="sidebar-user-job" id="userJobTitle">System Administrator</span>
                                <span class="sidebar-user-role" id="userRole">Admin</span>
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

                    <!-- Dashboard Tab -->
                    <div id="dashboardTab" class="tab-content active">
                        <div class="dashboard-header">
                            <h1 class="dashboard-title">Dashboard</h1>
                            <button onclick="refreshAllData()" class="btn btn-secondary btn-sm" title="Refresh data">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem; vertical-align: middle;">
                                    <polyline points="23 4 23 10 17 10"/>
                                    <polyline points="1 20 1 14 7 14"/>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                                </svg>
                                Refresh
                            </button>
                        </div>

                        <!-- Metric Cards -->
                        <div class="dashboard-metrics">
                            <div class="metric-card">
                                <div class="metric-icon" style="background: rgba(212, 175, 55, 0.1);">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                </div>
                                <div class="metric-content">
                                    <div class="metric-value" id="dashboardTotalAppointments">0</div>
                                    <div class="metric-label">Total Appointments</div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-icon" style="background: rgba(59, 130, 246, 0.1);">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </div>
                                <div class="metric-content">
                                    <div class="metric-value" id="dashboardNewPatients">0</div>
                                    <div class="metric-label">New Patients</div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-icon" style="background: rgba(16, 185, 129, 0.1);">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                                        <polyline points="9 11 12 14 22 4"/>
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                    </svg>
                                </div>
                                <div class="metric-content">
                                    <div class="metric-value" id="dashboardUpcoming">0</div>
                                    <div class="metric-label">Upcoming Appointments</div>
                                </div>
                            </div>
                        </div>

                        <!-- Charts Row -->
                        <div class="dashboard-charts">
                            <div class="chart-card">
                                <h3 class="chart-title">Appointment Trends</h3>
                                <div class="chart-wrapper">
                                    <canvas id="dashboardTrendsChart"></canvas>
                                </div>
                            </div>
                            <div class="chart-card">
                                <h3 class="chart-title">Status Breakdown</h3>
                                <div class="chart-wrapper">
                                    <canvas id="dashboardStatusChart"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Upcoming Appointments Sidebar -->
                        <div class="dashboard-upcoming">
                            <div class="upcoming-card">
                                <h3 class="upcoming-title">Upcoming Appointments</h3>
                                <div class="upcoming-list" id="upcomingAppointmentsList">
                                    <!-- Will be populated by JavaScript -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Statistics Overview (Legacy) -->
                    <div id="overviewTab" class="tab-content" style="display: none;">
                        <div class="dashboard-header">
                            <h1 class="dashboard-title">System Overview</h1>
                            <button onclick="refreshAllData()" class="btn btn-secondary" title="Refresh all data">
                                Refresh All Data
                            </button>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-card stat-card-primary clickable-stat" onclick="switchTab('appointments')" style="cursor: pointer;">
                                <div class="stat-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                </div>
                                <div class="stat-info">
                                    <div class="stat-value" id="totalAppointments">0</div>
                                    <div class="stat-label">Total Appointments</div>
                                </div>
                            </div>
                            <div class="stat-card stat-card-success clickable-stat" onclick="switchTab('patients')" style="cursor: pointer;">
                                <div class="stat-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </div>
                                <div class="stat-info">
                                    <div class="stat-value" id="totalPatients">0</div>
                                    <div class="stat-label">Total Patients</div>
                                </div>
                            </div>
                            <div class="stat-card stat-card-info clickable-stat" onclick="switchTab('doctors')" style="cursor: pointer;">
                                <div class="stat-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                </div>
                                <div class="stat-info">
                                    <div class="stat-value" id="totalDoctors">0</div>
                                    <div class="stat-label">Total Dentists</div>
                                </div>
                            </div>
                            <div class="stat-card stat-card-warning clickable-stat" onclick="switchTab('services')" style="cursor: pointer;">
                                <div class="stat-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2L2 7v10c0 5 4 8 10 10 6-2 10-5 10-10V7l-10-5z"/>
                                        <path d="M12 8v8"/>
                                        <path d="M8 12h8"/>
                                    </svg>
                                </div>
                                <div class="stat-info">
                                    <div class="stat-value" id="totalServices">0</div>
                                    <div class="stat-label">Total Services</div>
                                </div>
                            </div>
                        </div>
                    </div>

            <!-- Reports Tab -->
            <div id="reportsTab" class="tab-content">
                <div class="section-header">
                    <h2>Reports & Analytics</h2>
                    <div class="section-controls">
                        <label for="timeRangeFilter" style="display: none;">Time Range</label>
                        <select id="timeRangeFilter" onchange="if(window.loadReports) window.loadReports();" class="form-control" aria-label="Filter reports by time range" title="Filter reports by time range">
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                        <button onclick="refreshReports()" class="btn btn-primary">Refresh Reports</button>
                    </div>
                </div>

                <!-- Overview Dashboard -->
                <div class="analytics-section">
                    <h3 class="section-subtitle">Overview Dashboard</h3>
                    <div class="overview-grid">
                        <div class="stat-card stat-card-primary">
                            <div class="stat-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value" id="overviewToday">0</div>
                                <div class="stat-label">Today's Appointments</div>
                            </div>
                        </div>
                        <div class="stat-card stat-card-success">
                            <div class="stat-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value" id="overviewWeek">0</div>
                                <div class="stat-label">This Week</div>
                            </div>
                        </div>
                        <div class="stat-card stat-card-info">
                            <div class="stat-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value" id="overviewMonth">0</div>
                                <div class="stat-label">This Month</div>
                            </div>
                        </div>
                        <div class="stat-card stat-card-warning">
                            <div class="stat-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value" id="overviewNewPatients">0</div>
                                <div class="stat-label">New Patients</div>
                            </div>
                        </div>
                        <div class="stat-card stat-card-primary">
                            <div class="stat-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value" id="overviewReturningPatients">0</div>
                                <div class="stat-label">Returning Patients</div>
                            </div>
                        </div>
                        <div class="stat-card stat-card-success">
                            <div class="stat-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 11 12 14 22 4"/>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value" id="overviewUpcoming">0</div>
                                <div class="stat-label">Upcoming Appointments</div>
                            </div>
                        </div>
                        <div class="stat-card stat-card-danger">
                            <div class="stat-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="15" y1="9" x2="9" y2="15"/>
                                    <line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value" id="overviewCanceled">0</div>
                                <div class="stat-label">Canceled</div>
                            </div>
                        </div>
                        <div class="stat-card stat-card-warning">
                            <div class="stat-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value" id="overviewNoShow">0</div>
                                <div class="stat-label">No-Shows</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Appointment Analytics -->
                <div class="analytics-section">
                    <h3 class="section-subtitle">Appointment Analytics</h3>
                    <div class="analytics-layout appointments-layout">
                        <section class="analytics-panel panel-large">
                            <div class="panel-heading">
                                <h4>Appointments Over Time</h4>
                                <div class="chart-controls">
                                    <button class="filter-btn active" onclick="updateAppointmentsChart('day')" data-period="day">Daily</button>
                                    <button class="filter-btn" onclick="updateAppointmentsChart('week')" data-period="week">Weekly</button>
                                    <button class="filter-btn" onclick="updateAppointmentsChart('month')" data-period="month">Monthly</button>
                                </div>
                            </div>
                            <div class="panel-body">
                                <div class="chart-container">
                                    <div id="appointmentsChart"></div>
                                </div>
                            </div>
                            <div class="panel-metrics" id="appointmentsSummary">
                                <div class="metric-chip">
                                    <span class="metric-label">Busiest Day</span>
                                    <span class="metric-value" id="insightTopDay">—</span>
                                </div>
                                <div class="metric-chip">
                                    <span class="metric-label">Peak Hour</span>
                                    <span class="metric-value" id="insightTopHour">—</span>
                                </div>
                                <div class="metric-chip">
                                    <span class="metric-label">Average Duration</span>
                                    <span class="metric-value" id="insightAvgDuration">—</span>
                                </div>
                            </div>
                        </section>
                        <section class="analytics-panel panel-compact">
                            <div class="panel-heading">
                                <h4>Appointment Status Breakdown</h4>
                            </div>
                            <div class="panel-body">
                                <div class="chart-container">
                                    <div id="statusChart"></div>
                                </div>
                            </div>
                        </section>
                    </div>
                    <div class="analytics-layout single-column">
                        <section class="analytics-panel panel-full">
                            <div class="panel-heading">
                                <h4>Most Popular Services</h4>
                            </div>
                            <div class="panel-body">
                                <div class="chart-container tall">
                                    <div id="servicesChart"></div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <!-- Patient Reports -->
                <div class="analytics-section">
                    <h3 class="section-subtitle">Patient Reports</h3>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <h4>New vs Returning Patients</h4>
                            <div class="chart-container">
                                <div id="patientTypeChart"></div>
                            </div>
                        </div>
                        <div class="analytics-card">
                            <h4>Top Patients by Visit Count</h4>
                            <div class="patient-list" id="topPatientsList">
                                <!-- Will be populated by JavaScript -->
                            </div>
                        </div>
                        <div class="analytics-card">
                            <h4>Patient Visit Trends</h4>
                            <div class="chart-container">
                                <div id="patientTrendsChart"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Service Reports -->
                <div class="analytics-section">
                    <h3 class="section-subtitle">Service Reports</h3>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <h4>Service Usage Trends</h4>
                            <div class="chart-container">
                                <div id="serviceTrendsChart"></div>
                            </div>
                        </div>
                        <div class="analytics-card">
                            <h4>Most & Least Requested Services</h4>
                            <div class="service-list" id="serviceComparisonList">
                                <!-- Will be populated by JavaScript -->
                            </div>
                        </div>
                        <div class="analytics-card">
                            <h4>Average Time per Service</h4>
                            <div class="service-duration-list" id="serviceDurationList">
                                <!-- Will be populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Staff Management Tab -->
            <div id="staffTab" class="tab-content">
                <div class="section-header">
                    <h2>Staff Accounts</h2>
                    <button onclick="showCreateStaffModal()" class="btn btn-primary">
                        + Create Staff Account
                    </button>
                </div>
                <div id="staffList" class="data-grid"></div>
            </div>

            <!-- Doctors Management Tab -->
            <div id="doctorsTab" class="tab-content">
                <div class="section-header">
                    <h2>Dentists</h2>
                    <button onclick="showCreateDoctorModal()" class="btn btn-primary">
                        + Add Dentist
                    </button>
                </div>
                <div id="doctorsList" class="data-grid"></div>
            </div>

            <!-- Services Management Tab -->
            <div id="servicesTab" class="tab-content">
                <div class="section-header">
                    <h2>Services</h2>
                    <button onclick="showCreateServiceModal()" class="btn btn-primary">
                        + Add Service
                    </button>
                </div>
                <div id="servicesList" class="data-grid"></div>
            </div>

            <!-- Promos Management Tab -->
            <div id="promosTab" class="tab-content">
                <div class="section-header">
                    <h2>Special Promotions</h2>
                    <button onclick="showCreatePromoModal()" class="btn btn-primary">
                        + Add Promotion
                    </button>
                </div>
                <div id="promosList" class="data-grid"></div>
            </div>

            <!-- Schedules Management Tab -->
            <div id="schedulesTab" class="tab-content">
                <div class="section-header">
                    <h2>Dentist Schedules</h2>
                    <button onclick="showCreateScheduleModal()" class="btn btn-primary">
                        + Add Schedule
                    </button>
                </div>
                <div id="schedulesList"></div>
            </div>

            <!-- Appointments Tab -->
            <div id="appointmentsTab" class="tab-content">
                <div class="dashboard-header">
                    <h1 class="dashboard-title">Appointments</h1>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <button onclick="toggleAppointmentView()" class="btn btn-secondary btn-sm" id="viewToggleBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span id="viewToggleText">Calendar View</span>
                        </button>
                        <button onclick="loadAppointments()" class="btn btn-secondary btn-sm">
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
                        <input type="text" id="adminPatientSearchInput" class="patient-search-input" placeholder="Search patients by name, email, phone, or username...">
                        <button onclick="clearAdminPatientFilter()" class="btn btn-secondary btn-sm">Clear</button>
                    </div>
                </div>
                <div id="patientsList" class="patients-grid"></div>
            </div>

            <!-- Audit Log Tab -->
            <div id="auditTab" class="tab-content">
                <div class="section-header">
                    <h2>Audit Log</h2>
                    <div class="audit-log-filters" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                        <!-- Activity Type Filter -->
                        <div class="filter-group">
                            <label for="auditFilter" style="display: none;">Filter Audit Log</label>
                            <select id="auditFilter" onchange="filterAuditLog()" class="form-control" style="min-width: 180px;" aria-label="Filter audit log by activity type" title="Filter audit log by activity type">
                                <option value="all">All Activities</option>
                                <option value="appointment">Appointment Bookings</option>
                                <option value="patient">Patient Data Access</option>
                                <option value="update">Patient Detail Updates</option>
                                <option value="staff">Staff Management</option>
                                <option value="doctor">Doctor Management</option>
                                <option value="service">Service Management</option>
                                <option value="schedule">Schedule Management</option>
                                <option value="authentication">Authentication</option>
                                <option value="system">System Activities</option>
                            </select>
                        </div>
                        
                        <!-- Date Range Filter and Export - Grouped to prevent overlap -->
                        <div class="audit-filter-actions-group">
                            <!-- Calendar View Toggle and Export Button - Top row -->
                            <div class="audit-actions-row">
                                <div class="filter-group">
                                    <button id="auditCalendarToggle" class="btn btn-secondary" onclick="toggleAuditCalendar()" title="Toggle calendar view for date selection">
                                        📅 Calendar
                                    </button>
                                </div>
                                
                                <div class="filter-group">
                                    <button id="auditExportBtn" class="btn btn-primary" onclick="exportAuditLogs()" title="Export audit logs to Excel">
                                        📊 Export to Excel
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Date Range Filter - Below actions -->
                            <div class="filter-group audit-date-filter-group">
                                <button id="auditDateFilterBtn" class="btn btn-secondary" onclick="toggleAuditDateFilter()" style="min-width: 200px; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                                    <span id="auditDateFilterText">📅 All Dates</span>
                                    <span>▼</span>
                                </button>
                                <div id="auditDateFilterDropdown" class="audit-date-filter-dropdown" style="display: none;">
                                    <div class="audit-date-filter-options">
                                        <button class="audit-date-option" onclick="setAuditDateFilter('all')">All Dates</button>
                                        <button class="audit-date-option" onclick="setAuditDateFilter('today')">Today</button>
                                        <button class="audit-date-option" onclick="setAuditDateFilter('yesterday')">Yesterday</button>
                                        <button class="audit-date-option" onclick="setAuditDateFilter('week')">This Week</button>
                                        <button class="audit-date-option" onclick="setAuditDateFilter('month')">This Month</button>
                                        <button class="audit-date-option" onclick="setAuditDateFilter('custom')">Custom Range</button>
                                    </div>
                                    <div id="auditCustomDateRange" class="audit-custom-date-range" style="display: none; padding: 1rem; border-top: 1px solid #e0e0e0;">
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                            <div>
                                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">From Date</label>
                                                <input type="date" id="auditDateFrom" class="form-control" onchange="applyAuditDateFilter()">
                                            </div>
                                            <div>
                                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">To Date</label>
                                                <input type="date" id="auditDateTo" class="form-control" onchange="applyAuditDateFilter()">
                                            </div>
                                        </div>
                                        <button class="btn btn-primary" onclick="applyAuditDateFilter()" style="width: 100%;">Apply Filter</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Calendar View (Hidden by default) -->
                <div id="auditCalendarView" class="audit-calendar-view" style="display: none; margin-bottom: 2rem;">
                    <div class="audit-calendar-container">
                        <div class="audit-calendar-header">
                            <button onclick="changeAuditCalendarMonth(-1)" class="audit-calendar-nav-btn">◀</button>
                            <h3 id="auditCalendarMonthYear"></h3>
                            <button onclick="changeAuditCalendarMonth(1)" class="audit-calendar-nav-btn">▶</button>
                        </div>
                        <div id="auditCalendarGrid" class="audit-calendar-grid"></div>
                        <div class="audit-calendar-legend">
                            <div class="audit-calendar-legend-item">
                                <span class="audit-calendar-legend-dot" style="background: #4CAF50;"></span>
                                <span>Has Activities</span>
                            </div>
                            <div class="audit-calendar-legend-item">
                                <span class="audit-calendar-legend-dot" style="background: #2196F3;"></span>
                                <span>Selected Date</span>
                            </div>
                                <div class="audit-calendar-legend-item">
                                    <span class="audit-calendar-legend-dot audit-calendar-legend-dot-past"></span>
                                    <span>Past Date</span>
                                </div>
                        </div>
                    </div>
                </div>
                
                <div id="auditLogList" class="audit-log-list"></div>
            </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Create Staff Modal -->
    <div id="createStaffModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Create Staff Account</div>
            <form id="createStaffForm">
                <div class="form-group">
                    <label for="staffName">Full Name</label>
                    <input type="text" id="staffName" class="form-control" required aria-label="Enter staff full name" title="Enter staff full name">
                </div>
                <div class="form-group">
                    <label for="staffUsername">Username</label>
                    <input type="text" id="staffUsername" class="form-control" required aria-label="Enter staff username" title="Enter staff username">
                </div>
                <div class="form-group">
                    <label for="staffEmail">Email</label>
                    <input type="email" id="staffEmail" class="form-control" required aria-label="Enter staff email address" title="Enter staff email address">
                </div>
                <div class="form-group">
                    <label for="staffPassword">Password</label>
                    <input type="password" id="staffPassword" class="form-control" required aria-label="Enter staff password" title="Enter staff password">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeCreateStaffModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Account</button>
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
                    <button type="button" class="btn btn-secondary" onclick="closeCreateDoctorModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Dentist</button>
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
                    <label for="promoTitle">Promotion Title</label>
                    <input type="text" id="promoTitle" class="form-control" placeholder="e.g., Summer Teeth Whitening Special" required aria-label="Enter promotion title" title="Enter promotion title">
                </div>
                <div class="form-group">
                    <label for="promoDescription">Description</label>
                    <textarea id="promoDescription" class="form-control" rows="3" placeholder="Describe the promotion details..." required aria-label="Enter promotion description" title="Enter promotion description"></textarea>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="promoDiscount">Discount Badge</label>
                        <input type="text" id="promoDiscount" class="form-control" placeholder="e.g., 20% OFF, ₱500 OFF" required aria-label="Enter discount badge text" title="Enter discount badge text">
                    </div>
                    <div class="form-group">
                        <label for="promoValidUntil">Valid Until</label>
                        <input type="date" id="promoValidUntil" class="form-control" aria-label="Select promotion valid until date" title="Select promotion valid until date">
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="promoOriginalPrice">Original Price (Optional)</label>
                        <input type="text" id="promoOriginalPrice" class="form-control" placeholder="e.g., ₱10,000" aria-label="Enter original price (optional)" title="Enter original price (optional)">
                    </div>
                    <div class="form-group">
                        <label for="promoPrice">Promo Price</label>
                        <input type="text" id="promoPrice" class="form-control" placeholder="e.g., ₱8,000" required aria-label="Enter promotional price" title="Enter promotional price">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeCreatePromoModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Promotion</button>
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
                    <label for="editPromoTitle">Promotion Title</label>
                    <input type="text" id="editPromoTitle" class="form-control" required aria-label="Enter promotion title" title="Enter promotion title">
                </div>
                <div class="form-group">
                    <label for="editPromoDescription">Description</label>
                    <textarea id="editPromoDescription" class="form-control" rows="3" required aria-label="Enter promotion description" title="Enter promotion description"></textarea>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="editPromoDiscount">Discount Badge</label>
                        <input type="text" id="editPromoDiscount" class="form-control" required aria-label="Enter discount badge text" title="Enter discount badge text">
                    </div>
                    <div class="form-group">
                        <label for="editPromoValidUntil">Valid Until</label>
                        <input type="date" id="editPromoValidUntil" class="form-control" aria-label="Select promotion valid until date" title="Select promotion valid until date">
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="editPromoOriginalPrice">Original Price (Optional)</label>
                        <input type="text" id="editPromoOriginalPrice" class="form-control" aria-label="Enter original price (optional)" title="Enter original price (optional)">
                    </div>
                    <div class="form-group">
                        <label for="editPromoPrice">Promo Price</label>
                        <input type="text" id="editPromoPrice" class="form-control" required aria-label="Enter promotional price" title="Enter promotional price">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeEditPromoModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Promotion</button>
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
                    <label for="serviceName">Service Name</label>
                    <input type="text" id="serviceName" class="form-control" required aria-label="Enter service name" title="Enter service name">
                </div>
                <div class="form-group">
                    <label for="serviceDescription">Description</label>
                    <textarea id="serviceDescription" class="form-control" rows="3" required aria-label="Enter service description" title="Enter service description"></textarea>
                </div>
                <div class="form-group">
                    <label for="serviceDuration">Duration</label>
                    <input type="text" id="serviceDuration" class="form-control" placeholder="e.g., 30 mins" required aria-label="Enter service duration" title="Enter service duration">
                </div>
                <div class="form-group">
                    <label for="servicePrice">Price</label>
                    <input type="text" id="servicePrice" class="form-control" placeholder="Internal use only (optional)" style="opacity: 0.6;" aria-label="Enter service price (optional, internal use only)" title="Enter service price (optional, internal use only)">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeCreateServiceModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Service</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Create Schedule Modal -->
    <div id="createScheduleModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Add Schedule</div>
            <form id="createScheduleForm">
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
                    <button type="button" class="btn btn-secondary" onclick="closeCreateScheduleModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Schedule</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Patient Profile Modal -->
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
                        <button type="submit" class="btn btn-primary">Update Profile</button>
                    </form>
                </div>

                <!-- Treatment Session Documentation Section -->
                <div class="profile-section">
                    <div class="section-header-inline">
                        <h3>Treatment Session Documentation</h3>
                        <button onclick="showUploadSessionImageModal()" class="btn btn-primary btn-sm">
                            + Upload Session Photo
                        </button>
                    </div>
                    <div id="patientSessionImages" class="session-images-list"></div>
                </div>

                <!-- Medical History Section -->
                <div class="profile-section">
                    <div class="section-header-inline">
                        <h3>Patient Chart - Medical History</h3>
                        <button onclick="showAddMedicalHistoryModal()" class="btn btn-primary btn-sm">
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
                    <button type="button" class="btn btn-secondary" onclick="closeUploadSessionImageModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Upload Photo</button>
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
                    <button type="button" class="btn btn-secondary" onclick="closeAddMedicalHistoryModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Record</button>
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
                    <label for="editMedHistoryService">Service/Procedure</label>
                    <input type="text" id="editMedHistoryService" class="form-control" readonly aria-label="Medical history service/procedure (read-only)" title="Medical history service/procedure (read-only)">
                </div>
                <div class="form-group">
                    <label for="editMedHistoryDoctor">Doctor</label>
                    <input type="text" id="editMedHistoryDoctor" class="form-control" readonly aria-label="Medical history doctor (read-only)" title="Medical history doctor (read-only)">
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label for="editMedHistoryDate">Date</label>
                        <input type="text" id="editMedHistoryDate" class="form-control" readonly aria-label="Medical history date (read-only)" title="Medical history date (read-only)">
                    </div>
                    <div class="form-group">
                        <label for="editMedHistoryTime">Time</label>
                        <input type="text" id="editMedHistoryTime" class="form-control" readonly aria-label="Medical history time (read-only)" title="Medical history time (read-only)">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editMedHistoryTreatment">Treatment Notes</label>
                    <textarea id="editMedHistoryTreatment" class="form-control" rows="3" required aria-label="Enter treatment notes" title="Enter treatment notes"></textarea>
                </div>
                <div class="form-group">
                    <label for="editMedHistoryRemarks">Remarks</label>
                    <textarea id="editMedHistoryRemarks" class="form-control" rows="3" aria-label="Enter medical history remarks" title="Enter medical history remarks"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeEditMedicalHistoryModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Record</button>
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
                <input type="hidden" id="appointmentDetailsAppointmentId">
                <div id="appointmentDetailsContent"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="closeAppointmentDetailsModal()">Go Back</button>
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
                <button type="button" class="btn btn-secondary" onclick="closeChangeStatusModal()">Cancel</button>
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
                    <button type="button" class="btn btn-secondary" onclick="closeRescheduleModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Reschedule</button>
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
                    <button type="button" class="btn btn-secondary" onclick="closeEditNotesModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Notes</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Re-Authentication Modal for Audit Log Operations -->
    <div id="reauthModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">🔒 Re-Authentication Required</h2>
                <button class="modal-close" onclick="closeReauthModal()" aria-label="Close reauthentication modal" title="Close">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                    For security purposes, you must re-enter your admin credentials to perform this action on the audit log.
                </p>
                <form id="reauthForm" onsubmit="handleReauthSubmit(event)">
                    <div class="form-group">
                        <label for="reauthUsername">Username</label>
                        <input type="text" id="reauthUsername" class="form-control" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="reauthPassword">Password</label>
                        <div style="position: relative;">
                            <input type="password" id="reauthPassword" class="form-control" required autocomplete="current-password">
                            <button type="button" class="password-toggle" onclick="togglePassword('reauthPassword', this)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.25rem; color: var(--text-secondary);">👁️</button>
                        </div>
                    </div>
                    <div id="reauthError" style="display: none; color: var(--danger); margin-bottom: 1rem; padding: 0.75rem; background: rgba(220, 53, 69, 0.1); border-radius: var(--radius-md);"></div>
                    <div class="modal-footer" style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" onclick="closeReauthModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Confirm & Proceed</button>
                    </div>
                </form>
            </div>
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
                                <span id="profileModalInitials">SA</span>
                            </div>
                            <div class="profile-avatar-actions">
                                <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
                                <label for="profileImageInput" class="btn btn-primary btn-sm profile-avatar-upload-btn">Upload Photo</label>
                                <button type="button" class="btn btn-secondary btn-sm profile-avatar-remove-btn" id="profileImageRemoveBtn">Remove Photo</button>
                            </div>
                        </div>
                        <div class="profile-details-wrapper">
                            <div class="form-group">
                                <label for="profileFullNameInput">Full Name</label>
                                <input type="text" id="profileFullNameInput" class="form-control" placeholder="Enter full name" required>
                            </div>
                            <div class="form-group">
                                <label for="profileJobTitleInput">Job Title</label>
                                <input type="text" id="profileJobTitleInput" class="form-control" placeholder="e.g., System Administrator" required>
                            </div>
                            <div class="profile-meta-overview">
                                <div class="profile-meta-item">
                                    <span class="profile-meta-label">Role / Access Level</span>
                                    <span class="profile-meta-value" id="profileRoleValue">Admin</span>
                                </div>
                                <div class="profile-meta-item">
                                    <span class="profile-meta-label">Email</span>
                                    <span class="profile-meta-value" id="profileEmailValue">admin@clinic.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeUserProfileModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
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
                <button class="btn btn-secondary" onclick="markAllNotificationsAsRead()">Mark All as Read</button>
                <button class="btn btn-secondary" onclick="clearAllNotifications()">Clear All</button>
            </div>
        </div>
    </div>

    <!-- Scroll to Top Button -->
    <button id="scrollToTopBtn" class="scroll-to-top-btn" onclick="scrollToTop()" aria-label="Scroll to top" title="Scroll to top">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"/>
        </svg>
    </button>`;

function AdminApp() {
    return React.createElement('div', { dangerouslySetInnerHTML: { __html: adminMarkup } });
}

(function initAdminApp() {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(AdminApp));
})();
