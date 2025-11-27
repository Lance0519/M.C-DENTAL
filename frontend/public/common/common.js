// Common utilities and authentication

const Auth = {
    // Login function - now accepts email or username
    async login(usernameOrEmail, password) {
        if (typeof API === 'undefined') {
            return { success: false, message: 'Backend API is not available.' };
        }

        try {
            const response = await API.login(usernameOrEmail, password);
            if (response && response.user) {
                Storage.setCurrentUser(response.user);

                if (typeof logActivity === 'function') {
                    const userType = response.user.role === 'admin' ? 'Admin' :
                                     response.user.role === 'staff' ? 'Staff' :
                                     response.user.role === 'patient' ? 'Patient' : 'User';
                    logActivity('authentication', 'User Login', `${userType} ${response.user.fullName} (${response.user.email || response.user.username}) logged in`, response.user.id);
                }

                return { success: true, user: response.user };
            }

            return { success: false, message: 'Invalid username/email or password' };
        } catch (error) {
            const message = error?.message || 'Invalid username/email or password';

            if (typeof logActivity === 'function') {
                logActivity('authentication', 'Failed Login Attempt', `Failed login attempt with username/email: ${usernameOrEmail}`, 'system');
            }

            return { success: false, message };
        }
    },

    // Logout function
    logout() {
        const currentUser = this.getCurrentUser();
        Storage.logout();
        
        // Log logout activity
        if (currentUser && typeof logActivity === 'function') {
            const userType = currentUser.role === 'admin' ? 'Admin' : 
                           currentUser.role === 'staff' ? 'Staff' : 
                           currentUser.role === 'patient' ? 'Patient' : 'User';
            logActivity('authentication', 'User Logout', `${userType} ${currentUser.fullName} logged out`, currentUser.id);
        }
        
        window.location.href = '/legacy/login/login.html';
    },

    // Check if user is authenticated
    isAuthenticated() {
        return Storage.getCurrentUser() !== null;
    },

    // Get current user
    getCurrentUser() {
        return Storage.getCurrentUser();
    },

    // Check user role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    },

    // Require authentication
    requireAuth(allowedRoles = []) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = '/legacy/login/login.html';
            return false;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            CustomAlert.error('You do not have permission to access this page');
            this.redirectToDashboard(user.role);
            return false;
        }
        return true;
    },

    // Redirect to appropriate dashboard
    redirectToDashboard(role) {
        switch(role) {
            case 'admin':
                window.location.href = '../dashboard/admin.html';
                break;
            case 'staff':
                window.location.href = '../dashboard/staff.html';
                break;
            case 'patient':
                window.location.href = '../dashboard/patient.html';
                break;
            default:
                window.location.href = '/legacy/login/login.html';
        }
    },

    // Register new patient via backend
    async register(userData) {
        if (typeof API === 'undefined') {
            return { success: false, message: 'Backend API is not available.' };
        }

        try {
            const response = await API.register(userData);

            const newUser = {
                id: response?.id || `user${Date.now()}`,
                username: userData.username,
                email: userData.email,
                password: userData.password,
                role: 'patient',
                fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                dateOfBirth: userData.dateOfBirth,
                gender: userData.gender,
                address: userData.address
            };

            Storage.createUser(newUser);

            if (typeof logActivity === 'function') {
                logActivity('patient', 'Patient Account Created', `New patient account created for ${newUser.fullName} (${newUser.email}) via backend API`, newUser.id);
            }

            return { success: true, user: newUser, message: response?.message || 'Registration successful!' };
        } catch (apiError) {
            const message = apiError?.message || 'Registration failed. Please try again.';
            return { success: false, message };
        }
    },

    // Password recovery
    async recoverPassword(email) {
        if (typeof API === 'undefined') {
            return { success: false, message: 'Backend API is not available.' };
        }

        try {
            await API.recoverPassword(email);
            return { success: true, message: 'Password recovery email sent! Please check your inbox.' };
        } catch (apiError) {
            const message = apiError?.message || 'Email not found. Please check your email address.';
            return { success: false, message };
        }
    }
};

// Utility functions
const Utils = {
    // Generate unique ID
    generateId() {
        return 'id' + Date.now() + Math.random().toString(36).substr(2, 9);
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },

    // Format time
    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    },

    // Generate time slots
    generateTimeSlots(startTime, endTime, interval = 30) {
        const slots = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            slots.push(timeString);
            
            currentMinute += interval;
            if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60);
                currentMinute = currentMinute % 60;
            }
        }
        
        return slots;
    },

    // Convert any dollar-formatted prices to Philippine Peso symbol
    toPeso(value) {
        if (value == null) return '';
        const str = String(value);
        return str.replace(/\$/g, '₱');
    },

    // Get day of week from date
    getDayOfWeek(dateString) {
        const date = new Date(dateString);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    },

    // Check if date is in the past
    isPastDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    },

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone
    validatePhone(phone) {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Confirm dialog - Uses CustomConfirm
    async confirm(message, options = {}) {
        return await CustomConfirm.show(message, options.title || 'Confirm', options);
    },

    // Get appointment status badge class
    getStatusBadgeClass(status) {
        const statusMap = {
            'pending': 'badge-warning',
            'confirmed': 'badge-success',
            'cancelled': 'badge-danger',
            'completed': 'badge-info'
        };
        return statusMap[status] || 'badge-secondary';
    },

    // Sort appointments by date and time
    sortAppointments(appointments) {
        return appointments.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            // Sort ascending (soonest first) for better appointment management
            return dateA - dateB;
        });
    },

    // Get future appointments
    getFutureAppointments(appointments) {
        const now = new Date();
        return appointments.filter(apt => {
            const aptDate = new Date(apt.date + ' ' + apt.time);
            return aptDate >= now;
        });
    },

    // Get past appointments
    getPastAppointments(appointments) {
        const now = new Date();
        return appointments.filter(apt => {
            const aptDate = new Date(apt.date + ' ' + apt.time);
            return aptDate < now;
        });
    }
};

// Navigation helper
function setupNavigation() {
    const user = Auth.getCurrentUser();
    const navElement = document.querySelector('.user-nav');
    
    if (navElement && user) {
        navElement.innerHTML = `
            <span class="user-name">Welcome, ${user.fullName}</span>
            <button onclick="Auth.logout()" class="btn-logout">Logout</button>
        `;
    }
    
    // Update Login button to Dashboard button if user is logged in
    updateLoginButton(user);
}

// Update Login button to Dashboard button based on login status
function updateLoginButton(user) {
    const nav = document.querySelector('nav ul');
    if (!nav) return;
    
    const loginLink = nav.querySelector('a[href="../login/login.html"]') || 
                     nav.querySelector('a[href="login/login.html"]') ||
                     nav.querySelector('a[href="../login/login.html"].btn-primary');
    
    if (loginLink && user) {
        const listItem = loginLink.parentElement;
        const dashboardPath = user.role === 'admin' ? 'admin' : 
                            user.role === 'staff' ? 'staff' : 'patient';
        
        // Determine the correct path based on current location
        let dashboardUrl = '';
        if (window.location.pathname.includes('/dashboard/')) {
            dashboardUrl = `${dashboardPath}.html`;
        } else if (window.location.pathname.includes('/home/')) {
            dashboardUrl = `../dashboard/${dashboardPath}.html`;
        } else {
            dashboardUrl = `../dashboard/${dashboardPath}.html`;
        }
        
        listItem.innerHTML = `
            <a href="${dashboardUrl}" class="btn btn-primary">Dashboard</a>
        `;
    }
}

// Theme Management - REMOVED: Dark mode completely removed, system is light mode only
const Theme = {
    init() {
        // Force light mode always - dark mode removed per requirements
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        // Hide theme toggle if it exists
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.style.display = 'none';
        }
    },

    toggle() {
        // Theme toggle disabled - light mode only
        return;
    },

    updateThemeIcon() {
        // No-op - theme toggle removed
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.style.display = 'none';
        }
    }
};

// Custom Alert System
const CustomAlert = {
    show(message, title = 'Alert', type = 'error') {
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        
        const emoji = type === 'error' ? '😔' : '✅';
        const defaultTitle = type === 'error' ? 'Oops!' : 'Success!';
        
        overlay.innerHTML = `
            <div class="custom-alert-modal">
                <div class="custom-alert-icon">${emoji}</div>
                <h2 class="custom-alert-title">${title || defaultTitle}</h2>
                <p class="custom-alert-message">${message}</p>
                <button class="custom-alert-button" onclick="this.closest('.custom-alert-overlay').remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Trigger animation
        setTimeout(() => overlay.classList.add('active'), 10);
        
        // Close on button click
        overlay.querySelector('.custom-alert-button').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        });
        
        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    document.removeEventListener('keydown', handleEscape);
                }, 300);
            }
        };
        document.addEventListener('keydown', handleEscape);
    },

    // Replace the standard alert with custom alert
    error(message) {
        this.show(message, '😔 Sorry, we couldn\'t proceed', 'error');
    },

    success(message) {
        this.show(message, '✅ Success!', 'success');
    },

    info(message) {
        this.show(message, 'ℹ️ Information', 'info');
    }
};

// Custom Confirm Modal - Replaces window.confirm()
const CustomConfirm = {
    show(message, title = 'Confirm', options = {}) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'custom-alert-overlay';
            
            const {
                confirmText = 'OK',
                cancelText = 'Cancel',
                onConfirm = null,
                onCancel = null,
                confirmPrimary = true // Primary button on right
            } = options;
            
            overlay.innerHTML = `
                <div class="custom-alert-modal" style="max-width: 500px;">
                    <div class="custom-alert-icon">❓</div>
                    <h2 class="custom-alert-title">${title}</h2>
                    <p class="custom-alert-message">${message}</p>
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button class="custom-alert-button" style="flex: 1; ${!confirmPrimary ? 'order: 2;' : ''} background: ${confirmPrimary ? 'var(--border-color)' : 'var(--gold-primary)'}; color: ${confirmPrimary ? 'var(--text-primary)' : 'var(--black)'};" data-action="cancel">${cancelText}</button>
                        <button class="custom-alert-button" style="flex: 1; ${confirmPrimary ? 'order: 2;' : ''}" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            setTimeout(() => overlay.classList.add('active'), 10);
            
            const handleAction = (action) => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    if (action === 'confirm') {
                        if (onConfirm) onConfirm();
                        resolve(true);
                    } else {
                        if (onCancel) onCancel();
                        resolve(false);
                    }
                }, 300);
            };
            
            overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => handleAction('confirm'));
            overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => handleAction('cancel'));
            
            // Close on escape key (cancels)
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleAction('cancel');
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
            
            // Close on overlay click (cancels)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    handleAction('cancel');
                }
            });
        });
    }
};

// Replace window.confirm globally
window.confirm = function(message) {
    // This won't work as a direct replacement, but we'll replace all calls manually
    console.warn('Using window.confirm() is deprecated. Use CustomConfirm.show() instead.');
    return CustomConfirm.show(message, 'Confirm', {
        confirmText: 'OK',
        cancelText: 'Cancel'
    });
};

// Global Audit Logging Function
function logActivity(type, action, details, userId = null) {
    const logEntry = {
        id: Utils.generateId(),
        timestamp: new Date().toISOString(),
        type: type,
        action: action,
        details: details,
        userId: userId || Auth.getCurrentUser()?.id || 'system',
        userName: Auth.getCurrentUser()?.fullName || 'System'
    };
    
    const auditLogs = Storage.getAuditLogs();
    auditLogs.unshift(logEntry);
    
    // Check and export logs older than 6 months BEFORE filtering
    // This ensures old logs are exported before being removed
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    const oldLogs = auditLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        return logDate < sixMonthsAgo;
    });
    
    // Export old logs if any exist (only check periodically to avoid too many exports)
    if (oldLogs.length > 0 && (!window.lastAuditExportCheck || Date.now() - window.lastAuditExportCheck > 3600000)) {
        // Only check once per hour to avoid excessive exports
        try {
            if (typeof exportAuditLogsToExcel === 'function') {
                exportAuditLogsToExcel(oldLogs, true);
                window.lastAuditExportCheck = Date.now();
            }
        } catch (error) {
            console.error('Error auto-exporting old audit logs:', error);
        }
    }
    
    // Keep only logs from the last 6 months in active storage
    const recentLogs = auditLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        return logDate >= sixMonthsAgo;
    });
    
    Storage.saveAuditLogs(recentLogs);
}

// Make globals available on window
if (typeof window !== 'undefined') {
    window.Auth = Auth;
    window.Utils = Utils;
    window.Theme = Theme;
    window.CustomAlert = CustomAlert;
    window.CustomConfirm = CustomConfirm;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    Theme.init();
    
    // Theme toggle removed - light mode only
});

