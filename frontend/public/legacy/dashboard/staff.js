// Staff dashboard functionality

let currentUser = null;
let currentFilter = 'all';
let currentSort = 'date-asc';
let profileImageDraft = null;
let profileModalBackdropHandler = null;
let profileModalEscapeHandler = null;
let calendarDayOverlay = null;
let calendarDayOverlayEscHandler = null;

const PROFILE_IMAGE_MAX_DIMENSION = 256;
const PROFILE_IMAGE_MAX_BYTES = 180 * 1024; // approx 180 KB

function getRoleLabel(role) {
    if (!role) return 'Staff';
    switch (role.toLowerCase()) {
        case 'admin':
            return 'Admin';
        case 'staff':
            return 'Staff';
        case 'patient':
            return 'Patient';
        default:
            return role.charAt(0).toUpperCase() + role.slice(1);
    }
}

function getDefaultJobTitle(role) {
    if (!role) return 'Office Manager';
    switch (role.toLowerCase()) {
        case 'admin':
            return 'System Administrator';
        case 'staff':
            return 'Office Manager';
        default:
            return 'Team Member';
    }
}

function getInitials(name) {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return 'ST';
    }
    const initials = parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
    return initials || 'ST';
}

function estimateDataUrlSize(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return 0;
    const base64 = dataUrl.split(',')[1] || '';
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return (base64.length * 3) / 4 - padding;
}

function getCalendarServiceName(apt) {
    let serviceName = apt.serviceName;
    if (!serviceName || serviceName.trim() === '') {
        const service = Storage.getServiceById(apt.serviceId);
        serviceName = service ? service.name : 'Service';
    }
    if (apt.serviceId === 'srv001' && serviceName.toLowerCase() !== 'consultation') {
        serviceName = 'Consultation';
    }
    return serviceName;
}

function getCalendarPatientName(apt) {
    let patientName = apt.patientName || apt.patientFullName || apt.patient_full_name || apt.patient;
    if (patientName && typeof patientName === 'object') {
        patientName = patientName.fullName || patientName.name || '';
    }
    if (!patientName) {
        patientName = apt.walkInName || apt.walkInFullName || apt.walkIn?.fullName;
    }
    return patientName || 'Patient';
}

function formatDentistName(name) {
    if (!name) return 'Staff';
    const cleaned = name.trim().replace(/^Dr\.?\s*/i, '');
    return cleaned ? `Dr. ${cleaned}` : 'Staff';
}

function triggerStaffCreateAppointment(dateStr) {
    if (typeof showCreateAppointmentModal === 'function') {
        showCreateAppointmentModal();
    }
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.value = dateStr;
    }
}

function closeCalendarDayOverlay() {
    if (calendarDayOverlay) {
        calendarDayOverlay.remove();
        calendarDayOverlay = null;
    }
    if (calendarDayOverlayEscHandler) {
        document.removeEventListener('keydown', calendarDayOverlayEscHandler);
        calendarDayOverlayEscHandler = null;
    }
    document.body.style.overflow = '';
}

function showCalendarDayOverlay(dateStr, appointments = []) {
    closeCalendarDayOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'calendar-day-overlay';
    overlay.tabIndex = -1;

    const card = document.createElement('div');
    card.className = 'calendar-day-overlay-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', `Appointments for ${Utils.formatDate(dateStr)}`);
    card.setAttribute('tabindex', '-1');

    const header = document.createElement('div');
    header.className = 'calendar-day-overlay-header';

    const headerText = document.createElement('div');
    headerText.className = 'calendar-day-overlay-header-text';

    const title = document.createElement('h3');
    title.className = 'calendar-day-overlay-title';
    title.textContent = Utils.formatDate(dateStr);

    const count = document.createElement('span');
    count.className = 'calendar-day-overlay-count';
    count.textContent = appointments.length === 0
        ? 'No bookings yet'
        : `${appointments.length} ${appointments.length === 1 ? 'booking' : 'bookings'}`;

    headerText.appendChild(title);
    headerText.appendChild(count);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'calendar-day-overlay-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeCalendarDayOverlay);

    header.appendChild(headerText);
    header.appendChild(closeBtn);

    const list = document.createElement('div');
    list.className = 'calendar-day-overlay-list';

    if (appointments.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day-overlay-empty';
        empty.textContent = 'No bookings yet for this day. Create a new appointment to fill your schedule.';
        list.appendChild(empty);
    } else {
        appointments.forEach(apt => {
            const serviceName = getCalendarServiceName(apt);
            const serviceColor = getServiceColor(serviceName);
            const time = formatTimeForCalendar(apt.appointmentTime || apt.time || '');
            const patientName = getCalendarPatientName(apt);
            const statusLabel = apt.status ? apt.status.charAt(0).toUpperCase() + apt.status.slice(1) : 'Status';

            const item = document.createElement('div');
            item.className = `calendar-day-overlay-item ${apt.status || ''}`.trim();
            item.style.setProperty('--service-color', serviceColor);

            const topRow = document.createElement('div');
            topRow.className = 'calendar-day-overlay-item-top';

            const timeSpan = document.createElement('span');
            timeSpan.className = 'calendar-day-overlay-time';
            timeSpan.textContent = time;

            const status = document.createElement('span');
            status.className = 'calendar-day-overlay-status';
            status.textContent = statusLabel;

            topRow.appendChild(timeSpan);
            topRow.appendChild(status);

            const service = document.createElement('div');
            service.className = 'calendar-day-overlay-service';
            service.textContent = serviceName;

            const patient = document.createElement('div');
            patient.className = 'calendar-day-overlay-patient';
            patient.textContent = patientName;

            const actions = document.createElement('div');
            actions.className = 'calendar-day-overlay-item-actions';

            const detailsBtn = document.createElement('button');
            detailsBtn.type = 'button';
            detailsBtn.className = 'calendar-day-overlay-item-btn';
            detailsBtn.textContent = 'View Details';
            detailsBtn.addEventListener('click', () => {
                closeCalendarDayOverlay();
                viewAppointmentDetails(apt.id);
            });

            actions.appendChild(detailsBtn);

            item.appendChild(topRow);
            item.appendChild(service);
            item.appendChild(patient);
            item.appendChild(actions);

            list.appendChild(item);
        });
    }

    const actions = document.createElement('div');
    actions.className = 'calendar-day-overlay-actions';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'calendar-day-overlay-action-btn secondary';
    backBtn.textContent = 'Go Back';
    backBtn.addEventListener('click', closeCalendarDayOverlay);

    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.className = 'calendar-day-overlay-action-btn primary';
    createBtn.textContent = 'Create Appointment';
    createBtn.addEventListener('click', () => {
        closeCalendarDayOverlay();
        triggerStaffCreateAppointment(dateStr);
    });

    actions.appendChild(backBtn);
    actions.appendChild(createBtn);

    card.appendChild(header);
    card.appendChild(list);
    card.appendChild(actions);

    overlay.appendChild(card);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeCalendarDayOverlay();
        }
    });

    calendarDayOverlayEscHandler = (event) => {
        if (event.key === 'Escape') {
            closeCalendarDayOverlay();
        }
    };
    document.addEventListener('keydown', calendarDayOverlayEscHandler);

    calendarDayOverlay = overlay;
    document.body.appendChild(calendarDayOverlay);
    document.body.style.overflow = 'hidden';
    card.focus();
}

function setAvatarDisplay(imageData, fullName, imageElement, initialsElement) {
    const initials = getInitials(fullName);

    if (imageElement) {
        if (imageData) {
            imageElement.src = imageData;
            imageElement.style.display = 'block';
        } else {
            imageElement.src = '';
            imageElement.style.display = 'none';
        }
    }

    if (initialsElement) {
        if (imageData) {
            initialsElement.style.display = 'none';
        } else {
            initialsElement.textContent = initials;
            initialsElement.style.display = 'flex';
        }
    }
}

function refreshUserProfileUI(user = null) {
    const activeUser = user || Auth.getCurrentUser();
    if (!activeUser) return;

    currentUser = activeUser;
    profileImageDraft = activeUser.profileImage || null;

    const fullName = activeUser.fullName || 'Staff User';
    const jobTitle = activeUser.jobTitle || getDefaultJobTitle(activeUser.role);
    const roleLabel = getRoleLabel(activeUser.role);

    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = fullName;
    }

    const jobTitleEl = document.getElementById('userJobTitle');
    if (jobTitleEl) {
        jobTitleEl.textContent = jobTitle;
    }

    const roleEl = document.getElementById('userRole');
    if (roleEl) {
        roleEl.textContent = roleLabel;
    }

    const avatarImg = document.getElementById('profileAvatarImage');
    const initialsSpan = document.getElementById('profileInitials');
    setAvatarDisplay(activeUser.profileImage, fullName, avatarImg, initialsSpan);

    const profileMenuName = document.getElementById('profileMenuName');
    if (profileMenuName) {
        profileMenuName.textContent = fullName;
    }

    const profileMenuTitle = document.getElementById('profileMenuTitle');
    if (profileMenuTitle) {
        profileMenuTitle.textContent = `${jobTitle} • ${roleLabel}`;
    }

    const profileMenuRole = document.getElementById('profileMenuRoleLabel');
    if (profileMenuRole) {
        profileMenuRole.textContent = roleLabel;
    }

    const profileMenuEmail = document.getElementById('profileMenuEmail');
    if (profileMenuEmail) {
        profileMenuEmail.textContent = activeUser.email || 'Not set';
    }

    const profileMenuImage = document.getElementById('profilePictureSmallImg');
    const profileMenuInitials = document.getElementById('profileInitialsSmall');
    if (profileMenuImage || profileMenuInitials) {
        setAvatarDisplay(activeUser.profileImage, fullName, profileMenuImage, profileMenuInitials);
    }
}

function updateProfileModalAvatar(imageData, fullName) {
    const modalImage = document.getElementById('profileModalAvatarImage');
    const modalInitials = document.getElementById('profileModalInitials');
    const displayName = fullName || document.getElementById('profileFullNameInput')?.value || currentUser?.fullName || 'Staff User';
    setAvatarDisplay(imageData, displayName, modalImage, modalInitials);
}

function openUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    const user = Auth.getCurrentUser();
    if (!user) return;

    currentUser = user;
    profileImageDraft = user.profileImage || null;

    const fullNameInput = document.getElementById('profileFullNameInput');
    if (fullNameInput) {
        fullNameInput.value = user.fullName || '';
    }

    const jobTitleInput = document.getElementById('profileJobTitleInput');
    if (jobTitleInput) {
        jobTitleInput.value = user.jobTitle || getDefaultJobTitle(user.role);
    }

    const roleValue = document.getElementById('profileRoleValue');
    if (roleValue) {
        roleValue.textContent = getRoleLabel(user.role);
    }

    const emailValue = document.getElementById('profileEmailValue');
    if (emailValue) {
        emailValue.textContent = user.email || 'Not set';
    }

    const fileInput = document.getElementById('profileImageInput');
    if (fileInput) {
        fileInput.value = '';
    }

    updateProfileModalAvatar(profileImageDraft, user.fullName);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    profileModalBackdropHandler = (event) => {
        if (event.target === modal) {
            closeUserProfileModal();
        }
    };
    modal.addEventListener('click', profileModalBackdropHandler);

    profileModalEscapeHandler = (event) => {
        if (event.key === 'Escape') {
            closeUserProfileModal();
        }
    };
    document.addEventListener('keydown', profileModalEscapeHandler);
}

function closeUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (profileModalBackdropHandler) {
        modal.removeEventListener('click', profileModalBackdropHandler);
        profileModalBackdropHandler = null;
    }

    if (profileModalEscapeHandler) {
        document.removeEventListener('keydown', profileModalEscapeHandler);
        profileModalEscapeHandler = null;
    }
}

function handleProfileImageInputChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        Utils.showNotification('Please upload a valid image file.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > height) {
                if (width > PROFILE_IMAGE_MAX_DIMENSION) {
                    height = Math.round(height * (PROFILE_IMAGE_MAX_DIMENSION / width));
                    width = PROFILE_IMAGE_MAX_DIMENSION;
                }
            } else {
                if (height > PROFILE_IMAGE_MAX_DIMENSION) {
                    width = Math.round(width * (PROFILE_IMAGE_MAX_DIMENSION / height));
                    height = PROFILE_IMAGE_MAX_DIMENSION;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(width));
            canvas.height = Math.max(1, Math.round(height));
            const ctx = canvas.getContext('2d', { alpha: false });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let quality = 0.85;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);

            while (estimateDataUrlSize(dataUrl) > PROFILE_IMAGE_MAX_BYTES && quality > 0.55) {
                quality -= 0.05;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }

            if (estimateDataUrlSize(dataUrl) > PROFILE_IMAGE_MAX_BYTES) {
                Utils.showNotification('Profile image is too large even after compression. Please choose a smaller image.', 'error');
                return;
            }

            profileImageDraft = dataUrl;
            updateProfileModalAvatar(
                profileImageDraft,
                document.getElementById('profileFullNameInput')?.value || currentUser?.fullName
            );
        };
        img.onerror = () => {
            Utils.showNotification('Could not process the selected image. Please choose a different file.', 'error');
        };
        img.src = reader.result;
    };
    reader.onerror = () => {
        Utils.showNotification('Unable to read the selected image file.', 'error');
    };
    reader.readAsDataURL(file);
}

function removeProfileImage() {
    profileImageDraft = null;
    updateProfileModalAvatar(null, document.getElementById('profileFullNameInput')?.value || currentUser?.fullName);
}

function handleUserProfileSubmit(event) {
    if (event) {
        event.preventDefault();
    }

    const user = Auth.getCurrentUser();
    if (!user) return;

    const fullNameInput = document.getElementById('profileFullNameInput');
    const jobTitleInput = document.getElementById('profileJobTitleInput');

    const fullName = fullNameInput?.value.trim();
    const jobTitle = jobTitleInput?.value.trim();

    if (!fullName) {
        Utils.showNotification('Full name is required to update the profile.', 'error');
        return;
    }

    if (profileImageDraft && estimateDataUrlSize(profileImageDraft) > PROFILE_IMAGE_MAX_BYTES) {
        Utils.showNotification('Profile image is too large. Please upload a smaller image.', 'error');
        return;
    }

    const updates = {
        fullName,
        jobTitle: jobTitle || getDefaultJobTitle(user.role),
        profileImage: profileImageDraft || null
    };

    let updatedUser = null;
    try {
        updatedUser = Storage.updateUser(user.id, updates);
    } catch (error) {
        if (error && (error.name === 'QuotaExceededError' || error.code === 22)) {
            Utils.showNotification('Profile could not be saved because the browser storage is full. Please remove or reduce your profile image size and try again.', 'error');
            return;
        }
        console.error('Failed to update user profile:', error);
        Utils.showNotification('Unable to update profile. Please try again.', 'error');
        return;
    }

    if (!updatedUser) {
        Utils.showNotification('Unable to update profile. Please try again.', 'error');
        return;
    }

    Storage.setCurrentUser(updatedUser);
    currentUser = updatedUser;
    refreshUserProfileUI(updatedUser);
    Utils.showNotification('Profile updated successfully.', 'success');
    closeUserProfileModal();
}

// Logout with confirmation
function confirmLogout() {
    // Close sidebar on mobile before showing logout confirmation
    if (window.innerWidth <= 767) {
        const sidebar = document.querySelector('.sidebar-nav');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    }
    
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'logout-confirmation-modal';
    modal.innerHTML = `
        <div class="logout-confirmation-content">
            <div class="logout-confirmation-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
            </div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout? You will need to login again to access the dashboard.</p>
            <div class="logout-confirmation-buttons">
                <button class="logout-confirm-btn" onclick="handleLogout()">Yes, Logout</button>
                <button class="logout-cancel-btn" onclick="closeLogoutConfirmation()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeLogoutConfirmation();
        }
    });
    
    // Close on ESC key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeLogoutConfirmation();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Close logout confirmation modal
function closeLogoutConfirmation() {
    const modal = document.querySelector('.logout-confirmation-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Handle logout after confirmation
function handleLogout() {
    closeLogoutConfirmation();
    Auth.logout();
}

// Make functions globally accessible
window.confirmLogout = confirmLogout;
window.closeLogoutConfirmation = closeLogoutConfirmation;
window.handleLogout = handleLogout;

// Toggle sidebar collapse/expand (desktop)
function toggleSidebarCollapseDesktop() {
    const sidebar = document.querySelector('.sidebar-nav');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        // Save state to localStorage
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }
}

// Toggle sidebar function (for mobile - expands/collapses)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar-nav');
    const overlay = document.querySelector('.sidebar-overlay');
    const fixedHamburger = document.querySelector('.mobile-hamburger-fixed');
    
    // Mobile: Toggle sidebar visibility
    if (sidebar && window.innerWidth <= 767) {
        const isActive = sidebar.classList.toggle('active');
        if (overlay) {
            // Show overlay when sidebar is active (open)
            if (isActive) {
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                // Hide fixed hamburger when sidebar opens
                if (fixedHamburger) {
                    fixedHamburger.style.display = 'none';
                }
            } else {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                // Show fixed hamburger when sidebar closes
                if (fixedHamburger) {
                    fixedHamburger.style.display = 'flex';
                }
            }
        }
    } else if (sidebar && window.innerWidth > 767 && window.innerWidth <= 1024) {
        // Tablet: Toggle collapse state
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }
}

// Make toggleSidebar globally accessible
window.toggleSidebar = toggleSidebar;

// Make toggleSidebarCollapse globally accessible and handle both desktop and mobile
window.toggleSidebarCollapse = function() {
    if (window.innerWidth <= 767) {
        // On mobile, toggle the sidebar open/close
        toggleSidebar();
    } else if (window.innerWidth > 767 && window.innerWidth <= 1024) {
        // On tablet, toggle collapse/expand
        const sidebar = document.querySelector('.sidebar-nav');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        }
    } else {
        // On desktop, collapse/expand the sidebar
        toggleSidebarCollapseDesktop();
    }
};

// Close sidebar when clicking overlay (mobile only)
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (window.innerWidth <= 767) {
                toggleSidebar();
            }
        });
    }
    
    // Ensure fixed hamburger is visible on mobile when sidebar is closed
    const fixedHamburger = document.querySelector('.mobile-hamburger-fixed');
    const sidebar = document.querySelector('.sidebar-nav');
    if (fixedHamburger && sidebar && window.innerWidth <= 767) {
        if (!sidebar.classList.contains('active')) {
            fixedHamburger.style.display = 'flex';
        }
    }
    
    // Restore sidebar collapse state (desktop only)
    if (sidebar && window.innerWidth > 767) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }
    }
    
    // On mobile, start with sidebar hidden (not active)
    if (sidebar && window.innerWidth <= 767) {
        sidebar.classList.remove('active');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    }
    
    // On tablet, restore collapse state
    if (sidebar && window.innerWidth > 767 && window.innerWidth <= 1024) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }
    
    // Handle window resize - switch between mobile/desktop modes
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            const sidebar = document.querySelector('.sidebar-nav');
            const overlay = document.querySelector('.sidebar-overlay');
            
            if (window.innerWidth <= 767) {
                // Mobile mode: Sidebar hidden by default
                if (sidebar) {
                    sidebar.classList.remove('active');
                    sidebar.classList.remove('collapsed'); // Remove collapsed class on mobile
                }
                if (overlay) overlay.classList.remove('active');
                if (document.body) document.body.style.overflow = '';
            } else if (window.innerWidth > 767 && window.innerWidth <= 1024) {
                // Tablet mode: Restore collapse state
                if (sidebar) {
                    sidebar.classList.remove('active'); // Remove active class (mobile only)
                    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                    if (isCollapsed) {
                        sidebar.classList.add('collapsed');
                    } else {
                        sidebar.classList.remove('collapsed');
                    }
                }
                if (overlay) overlay.classList.remove('active');
                if (document.body) document.body.style.overflow = '';
            } else {
                // Desktop mode: Restore collapse state
                if (sidebar) {
                    sidebar.classList.remove('active'); // Remove active class (mobile only)
                    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                    if (isCollapsed) {
                        sidebar.classList.add('collapsed');
                    } else {
                        sidebar.classList.remove('collapsed');
                    }
                }
                if (overlay) overlay.classList.remove('active');
                if (document.body) document.body.style.overflow = '';
            }
        }, 100);
    });
    
    // Prevent sidebar from expanding when clicking sidebar items on desktop (when collapsed)
    if (sidebar && window.innerWidth > 769) {
        // Track if collapse button was clicked to allow legitimate expansion
        let collapseButtonClicked = false;
        
        // Monitor clicks on the collapse button
        const collapseBtn = sidebar.querySelector('.sidebar-collapse-btn, .desktop-collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', function() {
                collapseButtonClicked = true;
                // Reset flag after a short delay
                setTimeout(() => {
                    collapseButtonClicked = false;
                }, 100);
            });
        }
        
        // Add click handler to prevent expansion when clicking sidebar items
        sidebar.addEventListener('click', function(e) {
            // Only prevent expansion if sidebar is collapsed and clicking on sidebar items
            // Don't prevent if clicking the collapse button itself
            if (sidebar.classList.contains('collapsed') && !collapseButtonClicked) {
                const target = e.target;
                const isCollapseBtn = target.closest('.sidebar-collapse-btn, .desktop-collapse-btn');
                const isSidebarItem = target.closest('.sidebar-item, .tab-btn, .sidebar-action-btn, .sidebar-logout-btn');
                
                // If clicking on a sidebar item (but not the collapse button), ensure sidebar stays collapsed
                if (isSidebarItem && !isCollapseBtn) {
                    // Use setTimeout to ensure collapsed state is maintained after all handlers run
                    setTimeout(() => {
                        if (sidebar && window.innerWidth > 769 && !collapseButtonClicked) {
                            sidebar.classList.add('collapsed');
                            // Ensure localStorage state is maintained
                            localStorage.setItem('sidebarCollapsed', 'true');
                        }
                    }, 0);
                }
            }
        }, true); // Use capture phase to handle before item's own handlers
    }
});

// Calendar state
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let isCalendarView = true;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Require staff authentication
    if (!Auth.requireAuth(['staff'])) {
        return;
    }
    
    currentUser = Auth.getCurrentUser();
    refreshUserProfileUI(currentUser);
    
    const profileForm = document.getElementById('userProfileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleUserProfileSubmit);
    }
    
    const profileImageInput = document.getElementById('profileImageInput');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageInputChange);
    }
    
    const profileImageRemoveBtn = document.getElementById('profileImageRemoveBtn');
    if (profileImageRemoveBtn) {
        profileImageRemoveBtn.addEventListener('click', (event) => {
            event.preventDefault();
            removeProfileImage();
        });
    }
    
    // Load dashboard data
    loadStatistics();
    loadAppointments();
    loadSchedules();
    loadServices();
    loadDoctors();
    loadPromos();
    loadPatients();
    populateDropdowns();
    
    // Setup tabs
    setupTabs();
    
    // Set appointments as default active tab and initialize
    const appointmentsBtn = document.querySelector('[data-tab="appointments"]');
    const appointmentsTab = document.getElementById('appointmentsTab');
    if (appointmentsBtn && appointmentsTab) {
        appointmentsBtn.classList.add('active');
        appointmentsTab.classList.add('active');
        // Initialize calendar view
        renderCalendar();
        populateServiceFilter();
    }
    
    // Setup patient search
    setupStaffPatientSearch();
    
    // Handle doctor selection - enable date input and load calendar
    const appointmentDoctorSelect = document.getElementById('appointmentDoctor');
    const appointmentDateInput = document.getElementById('appointmentDate');
    const appointmentTimeSelect = document.getElementById('appointmentTime');
    
    // Set date constraint: Allow dates from today onwards (dynamic)
    if (appointmentDateInput) {
        // Initially disabled - will be enabled when doctor is selected
        appointmentDateInput.disabled = true;
        
        // Handle date change - enable time select and load time slots
        appointmentDateInput.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const maxAllowedDate = new Date(todayDate);
            maxAllowedDate.setDate(maxAllowedDate.getDate() + 14); // 2 weeks = 14 days
            
            // Check if doctor is selected
            const selectedDoctorId = appointmentDoctorSelect ? appointmentDoctorSelect.value : '';
            if (!selectedDoctorId) {
                CustomAlert.error('Please select a dentist first before choosing a date.');
                this.value = '';
                return;
            }
            
            if (selectedDate < todayDate) {
                CustomAlert.error('You cannot book appointments in the past.\n\nPlease select today or a future date.');
                this.value = '';
                if (appointmentTimeSelect) {
                    appointmentTimeSelect.disabled = true;
                    appointmentTimeSelect.innerHTML = '<option value="">Select a date first</option>';
                }
            } else if (selectedDate > maxAllowedDate) {
                CustomAlert.error('Appointments can only be booked up to 2 weeks in advance.\n\nPlease select a date within the next 2 weeks.');
                this.value = '';
                if (appointmentTimeSelect) {
                    appointmentTimeSelect.disabled = true;
                    appointmentTimeSelect.innerHTML = '<option value="">Select a date first</option>';
                }
            } else {
                // Enable time select and load time slots
                if (appointmentTimeSelect) {
                    appointmentTimeSelect.disabled = false;
                }
                console.log('Date changed, loading time slots...');
                loadAppointmentTimeSlots();
            }
        });
    }
    
    if (appointmentDoctorSelect) {
        appointmentDoctorSelect.addEventListener('change', function() {
            const selectedDoctorId = this.value;
            
            if (selectedDoctorId) {
                // Enable date input
                if (appointmentDateInput) {
                    appointmentDateInput.disabled = false;
                    appointmentDateInput.value = ''; // Clear previous selection
                    updateDateInputMinMax(selectedDoctorId);
                }
                
                // Disable and clear time select
                if (appointmentTimeSelect) {
                    appointmentTimeSelect.disabled = true;
                    appointmentTimeSelect.innerHTML = '<option value="">Select a date first</option>';
                }
            } else {
                // Disable date and time if no doctor selected
                if (appointmentDateInput) {
                    appointmentDateInput.disabled = true;
                    appointmentDateInput.value = '';
                }
                if (appointmentTimeSelect) {
                    appointmentTimeSelect.disabled = true;
                    appointmentTimeSelect.innerHTML = '<option value="">Select a dentist first</option>';
                }
            }
        });
    }
    
    // Handle service change - reload time slots if date is already selected
    const appointmentServiceSelect = document.getElementById('appointmentService');
    if (appointmentServiceSelect) {
        appointmentServiceSelect.addEventListener('change', function() {
            if (appointmentDateInput && appointmentDateInput.value && appointmentDoctorSelect && appointmentDoctorSelect.value) {
                console.log('Service changed, reloading time slots...');
                loadAppointmentTimeSlots();
            }
        });
    }
    
    // Update date input min/max based on doctor's schedule
    function updateDateInputMinMax(doctorId) {
        if (!appointmentDateInput) return;
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Set minimum to tomorrow
        const minDate = tomorrow.toISOString().split('T')[0];
        appointmentDateInput.min = minDate;
        
        // Allow booking up to 2 weeks in advance
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 14);
        appointmentDateInput.max = maxDate.toISOString().split('T')[0];
    }
    
    
    // Auto-refresh disabled - data only refreshes manually or on storage events
    // setInterval(() => {
    //     loadStatistics();
    //     // Only refresh appointments if appointments tab is active
    //     const appointmentsTab = document.getElementById('appointmentsTab');
    //     if (appointmentsTab?.classList.contains('active')) {
    //         if (isCalendarView) {
    //             renderCalendar();
    //         } else {
    //             loadAppointmentsList();
    //         }
    //     }
    // }, 5000);
    
    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'clinicData' || e.key === 'lastDataUpdate') {
            loadStatistics();
            loadAppointments();
            loadSchedules();
            loadServices();
            loadDoctors();
            loadPromos();
            loadPatients();
            // Refresh service dropdowns when services change
            populateServiceFilter();
            populateDropdowns();
        }
    });
    
    // Listen for custom data update events (same-tab sync)
    window.addEventListener('clinicDataUpdated', () => {
        loadStatistics();
        loadAppointments();
        loadPatients();
        // Refresh service dropdowns when services change
        populateServiceFilter();
        populateDropdowns();
    });
});

// Setup tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    if (tabButtons.length === 0) {
        console.error('No tab buttons found! Check HTML structure.');
        return;
    }
    
    // Tab switching is handled by inline onclick handlers
    // This function is kept for compatibility but doesn't add duplicate listeners
    console.log('Tab buttons found:', tabButtons.length);
}

// Switch tab programmatically (global function for onclick handlers)
// Make it available immediately for inline onclick handlers
// Define it BEFORE DOMContentLoaded so it's available when HTML loads
window.switchTab = function switchTab(tabName) {
    console.log('switchTab called with:', tabName);
    
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    if (!tabBtn) {
        console.error('Tab button not found:', tabName);
        return;
    }
    
    // Remove active class from all tabs and buttons
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab button
    tabBtn.classList.add('active');
    
    // Handle mobile vs desktop differently
    const sidebar = document.querySelector('.sidebar-nav');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (window.innerWidth <= 767) {
        // Mobile: Close sidebar after selection (like admin dashboard)
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    } else {
        // Desktop: Ensure sidebar stays collapsed if it was collapsed
        const wasCollapsed = sidebar && sidebar.classList.contains('collapsed');
        if (wasCollapsed && sidebar) {
            sidebar.classList.add('collapsed');
        }
    }
    
    // Show corresponding tab content
    const tabId = tabName + 'Tab';
    const tabElement = document.getElementById(tabId);
    
    if (tabElement) {
        tabElement.classList.add('active');
        console.log('Tab content activated:', tabId);
        
        // Load data for the selected tab
        try {
            switch(tabName) {
                case 'appointments':
                    if (typeof isCalendarView !== 'undefined' && isCalendarView) {
                        if (typeof renderCalendar === 'function') renderCalendar();
                    } else {
                        if (typeof loadAppointmentsList === 'function') loadAppointmentsList();
                    }
                    if (typeof populateServiceFilter === 'function') populateServiceFilter();
                    break;
                case 'patients':
                    if (typeof loadPatients === 'function') loadPatients();
                    if (typeof setupStaffPatientSearch === 'function') setupStaffPatientSearch();
                    break;
                case 'services':
                    if (typeof loadServices === 'function') loadServices();
                    break;
                case 'doctors':
                    if (typeof loadDoctors === 'function') loadDoctors();
                    break;
                case 'schedules':
                    if (typeof loadSchedules === 'function') loadSchedules();
                    break;
                case 'clinicSchedule':
                    if (typeof loadClinicSchedule === 'function') loadClinicSchedule();
                    break;
                case 'promos':
                    if (typeof loadPromos === 'function') loadPromos();
                    break;
                default:
                    console.warn('Unknown tab:', tabName);
            }
        } catch (error) {
            console.error('Error loading tab data:', error);
        }
    } else {
        console.error('Tab content not found:', tabId);
    }
};

// Make switchTab available as a regular function reference too
const switchTab = window.switchTab;

// Show/hide sections
function showSection(sectionName) {
    const appointmentsSection = document.getElementById('appointmentsSection');
    const clinicScheduleSection = document.getElementById('clinicScheduleSection');
    const schedulesSection = document.getElementById('schedulesSection');
    const patientsSection = document.getElementById('patientsSection');
    
    // Hide all sections
    appointmentsSection.style.display = 'none';
    clinicScheduleSection.style.display = 'none';
    schedulesSection.style.display = 'none';
    patientsSection.style.display = 'none';
    
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 767) {
        const sidebar = document.querySelector('.sidebar-nav');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    }
    
    // Show selected section
    if (sectionName === 'appointments') {
        appointmentsSection.style.display = 'block';
        appointmentsSection.scrollIntoView({ behavior: 'smooth' });
        // Initialize sort dropdown if it exists
        const sortSelect = document.getElementById('sortAppointments');
        if (sortSelect && !sortSelect.value) {
            sortSelect.value = currentSort;
        }
        loadAppointments();
    } else if (sectionName === 'clinicSchedule') {
        clinicScheduleSection.style.display = 'block';
        clinicScheduleSection.scrollIntoView({ behavior: 'smooth' });
        loadClinicSchedule();
    } else if (sectionName === 'schedules') {
        schedulesSection.style.display = 'block';
        schedulesSection.scrollIntoView({ behavior: 'smooth' });
        loadSchedules();
    } else if (sectionName === 'patients') {
        patientsSection.style.display = 'block';
        patientsSection.scrollIntoView({ behavior: 'smooth' });
        loadStaffPatients();
        // Re-setup search in case it wasn't initialized
        setupPatientSearch();
    } else {
        appointmentsSection.style.display = 'block';
        appointmentsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Load statistics (for compatibility, but stats cards removed in new design)
function loadStatistics() {
    // Statistics cards are no longer displayed in the new tab-based design
    // This function is kept for compatibility with existing code
    // Update filter counts if needed
    const filterCountButtons = document.querySelectorAll('.filter-btn');
    if (filterCountButtons.length > 0) {
        updateFilterCounts();
    }
}

// Navigate to appointments tab with filter (legacy function for compatibility)
function navigateToAppointments(filter) {
    switchTab('appointments');
    // Set the filter in the status filter dropdown if it exists
    setTimeout(() => {
        const statusFilter = document.getElementById('appointmentStatusFilter');
        if (statusFilter && filter === 'pending') {
            statusFilter.value = 'pending';
            filterAppointments();
        } else if (statusFilter && filter === 'confirmed') {
            statusFilter.value = 'confirmed';
            filterAppointments();
        } else if (filter === 'today') {
            const dateFilter = document.getElementById('appointmentDateFilter');
            if (dateFilter) {
                dateFilter.value = 'today';
                filterAppointments();
            }
        }
    }, 150);
}

// Setup filters
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        // Remove existing listeners by cloning
        const newBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(newBtn, btn);
        }
        
        // Add click handler to new button
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value
            const filterValue = this.dataset.filter || this.getAttribute('data-filter');
            if (filterValue) {
                currentFilter = filterValue;
                loadAppointments();
                updateFilterCounts();
            }
        });
    });
    
    // Update filter counts
    updateFilterCounts();
}

// Update filter counts
function updateFilterCounts() {
    const appointments = Storage.getAppointments();
    const today = new Date().toISOString().split('T')[0];
    
    const counts = {
        all: appointments.length,
        pending: appointments.filter(apt => apt.status === 'pending').length,
        confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
        today: appointments.filter(apt => apt.date === today).length
    };
    
    // Update button text with counts
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filter = btn.dataset.filter || btn.getAttribute('data-filter');
        if (filter) {
            const count = counts[filter] || 0;
            const label = filter.charAt(0).toUpperCase() + filter.slice(1);
            const currentText = btn.textContent.trim();
            // Only update if count changed to avoid breaking event listeners
            if (!currentText.includes(`(${count})`)) {
                btn.innerHTML = `${label} <span class="filter-count">(${count})</span>`;
                // Re-attach event listener if button was replaced
                const filterValue = filter;
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentFilter = filterValue;
                    loadAppointments();
                    updateFilterCounts();
                };
            }
        }
    });
}

// Load appointments
function loadAppointments() {
    let appointments = Storage.getAppointments();
    
    // Apply filters
    const today = new Date().toISOString().split('T')[0];
    let filterLabel = 'All Appointments';
    
    switch(currentFilter) {
        case 'pending':
            appointments = appointments.filter(apt => apt.status === 'pending');
            filterLabel = 'Pending Appointments (Awaiting Approval)';
            break;
        case 'confirmed':
            appointments = appointments.filter(apt => apt.status === 'confirmed');
            filterLabel = 'Confirmed Appointments';
            break;
        case 'today':
            appointments = appointments.filter(apt => apt.date === today);
            filterLabel = "Today's Appointments";
            break;
        case 'all':
        default:
            // Show all appointments
            filterLabel = 'All Appointments';
            break;
    }
    
    // Apply sorting
    appointments = sortAppointmentsList(appointments);
    
    // Only update list view if we're in list mode
    if (!isCalendarView) {
        loadAppointmentsList();
        return;
    }
    
    // For calendar view, just render the calendar
    renderCalendar();
    
    // Legacy code for old appointmentsList container (if it exists in list view)
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    
    // Calculate filter counts from ALL appointments (not filtered)
    const allAppointments = Storage.getAppointments();
    const todayDate = new Date().toISOString().split('T')[0];
    const appointmentFilterCounts = {
        all: allAppointments.length,
        pending: allAppointments.filter(a => a.status === 'pending').length,
        confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
        completed: allAppointments.filter(a => a.status === 'completed').length,
        today: allAppointments.filter(a => {
            const aptDate = a.date || a.appointmentDate;
            return aptDate === todayDate;
        }).length
    };
    
    // Generate filter buttons with counts
    const filterButtonsHTML = `
        <div class="filter-buttons" style="margin-bottom: 1rem;">
            <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="filterAppointments('all')">All <span class="filter-count">(${appointmentFilterCounts.all})</span></button>
            <button class="filter-btn ${currentFilter === 'pending' ? 'active' : ''}" onclick="filterAppointments('pending')">Pending <span class="filter-count">(${appointmentFilterCounts.pending})</span></button>
            <button class="filter-btn ${currentFilter === 'confirmed' ? 'active' : ''}" onclick="filterAppointments('confirmed')">Confirmed <span class="filter-count">(${appointmentFilterCounts.confirmed})</span></button>
            <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" onclick="filterAppointments('completed')">Completed <span class="filter-count">(${appointmentFilterCounts.completed})</span></button>
            <button class="filter-btn ${currentFilter === 'today' ? 'active' : ''}" onclick="filterAppointments('today')">Today <span class="filter-count">(${appointmentFilterCounts.today})</span></button>
        </div>
    `;
    
    // Show filter indicator
    const filterIndicator = currentFilter !== 'all' ? 
        `<div class="filter-indicator">
            <span class="filter-indicator-icon">🔍</span>
            <span class="filter-indicator-text">Showing: ${filterLabel}</span>
        </div>` : '';
    
    if (appointments.length === 0) {
        container.innerHTML = filterButtonsHTML + filterIndicator + `
            <div class="no-data">
                <div class="no-data-icon">📅</div>
                <p>No ${currentFilter !== 'all' ? filterLabel.toLowerCase() : 'appointments'} found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filterButtonsHTML + filterIndicator + `
        <div class="appointment-row appointment-row-header">
            <div>Patient</div>
            <div>Service</div>
            <div>Doctor</div>
            <div>Date & Time</div>
            <div>Status</div>
            <div>Actions</div>
        </div>
    ` + appointments.map(apt => {
        const patient = patientMap.get(apt.patientId);
        const doctor = doctorMap.get(apt.doctorId);
        const service = serviceMap.get(apt.serviceId);
        
        // Handle guest appointments and walk-ins
        const isGuest = apt.patientId && apt.patientId.startsWith('guest_appointment');
        const isWalkin = apt.patientId && apt.patientId.startsWith('walkin_');
        let patientDisplayName;
        if (isGuest) {
            const notesMatch = apt.notes && apt.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
            const name = notesMatch ? notesMatch[1] : 'Guest Patient';
            patientDisplayName = `${name} (guest appointment)`;
        } else if (isWalkin) {
            const notesMatch = apt.notes && apt.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
            const name = notesMatch ? notesMatch[1] : 'Walk-in Patient';
            patientDisplayName = `${name} (walk-in)`;
        } else {
            patientDisplayName = patient ? patient.fullName : 'Unknown Patient';
        }
        
        let serviceName = 'N/A';
        if (service && service.name) {
            serviceName = service.name;
        } else if (apt.serviceName) {
            serviceName = apt.serviceName;
        }
        
        if (apt.serviceId === 'srv001' && serviceName && serviceName.toLowerCase() !== 'consultation') {
            serviceName = 'Consultation';
        }
        
        return `
            <div class="appointment-row">
                <div>
                    ${patientDisplayName}${isWalkin ? ' <span class="badge badge-info" style="margin-left: 0.5rem; font-size: 0.7rem;">WALK-IN</span>' : ''}${isGuest ? ' <span class="badge badge-info" style="margin-left: 0.5rem; font-size: 0.7rem;">GUEST</span>' : ''}
                </div>
                <div>${serviceName}</div>
                <div>${doctor ? doctor.name : 'Unknown'}</div>
                <div>
                    <div>${Utils.formatDate(apt.date || apt.appointmentDate)}</div>
                    <div style="font-size: 0.85rem; color: var(--text-color);">${Utils.formatTime(apt.time || apt.appointmentTime)}</div>
                    ${apt.notes ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; font-style: italic; display: flex; align-items: center; gap: 0.25rem;"><img src="../assets/icons/notes.png" alt="Notes" style="width: 14px; height: 14px; object-fit: contain;"> ${apt.notes.substring(0, 50)}${apt.notes.length > 50 ? '...' : ''}</div>` : ''}
                </div>
                <div>
                    <span class="badge ${Utils.getStatusBadgeClass(apt.status)}">${apt.status.toUpperCase()}</span>
                </div>
                <div>
                    <div class="action-dropdown">
                        <button class="action-dropdown-btn" onclick="toggleActionDropdown(event, '${apt.id}')" aria-label="Open appointment actions menu" title="Open appointment actions menu">
                            <img src="../assets/icons/gear.png" alt="Settings" class="action-dropdown-icon">
                        </button>
                        <div class="action-dropdown-menu" id="dropdown-${apt.id}">
                            ${apt.status === 'pending' ? 
                                `<button class="action-dropdown-item" onclick="confirmAppointment('${apt.id}')">
                                    <span class="action-icon"><img src="../assets/icons/confirmation.png" alt="Confirm"></span> Confirm
                                </button>` : ''}
                            <button class="action-dropdown-item" onclick="viewAppointmentDetails('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/view.png" alt="View"></span> View Details
                            </button>
                            <button class="action-dropdown-item" onclick="changeAppointmentDentist('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/assign.png" alt="Assign"></span> Assign Dentist
                            </button>
                            <button class="action-dropdown-item" onclick="editAppointmentStatus('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/status.png" alt="Status"></span> Edit Status
                            </button>
                            ${apt.status !== 'completed' && apt.status !== 'cancelled' ? `
                            <button class="action-dropdown-item" onclick="openRescheduleModal('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/status.png" alt="Reschedule"></span> Reschedule
                            </button>` : ''}
                            <button class="action-dropdown-item" onclick="openEditNotesModal('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/notes.png" alt="Notes"></span> Edit Notes
                            </button>
                            <button class="action-dropdown-item action-dropdown-item-danger" onclick="cancelAppointment('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/cancel.png" alt="Cancel"></span> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle between calendar and list view
function toggleAppointmentView() {
    isCalendarView = !isCalendarView;
    const calendarView = document.getElementById('calendarView');
    const listView = document.getElementById('listView');
    const toggleBtn = document.getElementById('viewToggleBtn');
    const toggleText = document.getElementById('viewToggleText');
    
    if (isCalendarView) {
        if (calendarView) calendarView.style.display = 'block';
        if (listView) listView.style.display = 'none';
        if (toggleText) toggleText.textContent = 'List View';
        renderCalendar();
    } else {
        if (calendarView) calendarView.style.display = 'none';
        if (listView) listView.style.display = 'block';
        if (toggleText) toggleText.textContent = 'Calendar View';
        loadAppointmentsList();
    }
}

// Make function globally available
window.toggleAppointmentView = toggleAppointmentView;

// Change calendar month
function changeMonth(direction) {
    currentCalendarMonth += direction;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderCalendar();
}

// Helper function to get service color
function getServiceColor(serviceName) {
    if (!serviceName) return '#6B7280';
    
    const name = serviceName.toLowerCase();
    const colorMap = {
        'braces': '#8B5CF6',
        'veneer': '#F59E0B',
        'bridge': '#10B981',
        'crown': '#3B82F6',
        'surgery': '#EF4444',
        'restoration': '#06B6D4',
        'denture': '#EC4899',
        'root canal': '#F97316',
        'whitening': '#84CC16',
        'x-ray': '#6366F1',
        'extraction': '#DC2626',
        'cleaning': '#14B8A6',
        'pasta': '#F59E0B',
        'adjustment': '#8B5CF6'
    };
    
    for (const [key, color] of Object.entries(colorMap)) {
        if (name.includes(key)) return color;
    }
    
    return '#6B7280'; // Default gray
}

// Helper function to format time
function formatTimeForCalendar(timeStr) {
    if (!timeStr) return '';
    try {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
}

// Render calendar
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonth = document.getElementById('calendarMonth');
    if (!calendarGrid || !calendarMonth) return;
    closeCalendarDayOverlay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    calendarMonth.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const appointments = getFilteredAppointments();
    const statusFilterValue = document.getElementById('appointmentStatusFilter')?.value || 'all';
    const hideCancelled = statusFilterValue === 'all';
    const appointmentsByDate = new Map();

    appointments.forEach(apt => {
        const aptDate = apt.appointmentDate || apt.date;
        if (!aptDate) return;

        if (hideCancelled) {
            if (apt.status === 'cancelled') {
                return;
            }
        } else if (statusFilterValue !== 'all' && apt.status !== statusFilterValue) {
            return;
        }

        const bucket = appointmentsByDate.get(aptDate);
        if (bucket) {
            bucket.push(apt);
        } else {
            appointmentsByDate.set(aptDate, [apt]);
        }
    });

    // Sort each day's appointments by time once
    appointmentsByDate.forEach(list => {
        list.sort((a, b) => {
            const timeA = a.appointmentTime || a.time || '00:00';
            const timeB = b.appointmentTime || b.time || '00:00';
            return timeA.localeCompare(timeB);
        });
    });

    calendarGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        fragment.appendChild(header);
    });

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        fragment.appendChild(emptyDay);
    }
    
    // Days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDayDate = new Date(currentCalendarYear, currentCalendarMonth, day);
        currentDayDate.setHours(0, 0, 0, 0);
        const isToday = today.getTime() === currentDayDate.getTime();
        const isPast = currentDayDate < today;
        
        const className = isToday ? 'calendar-day today' : 'calendar-day';
        dayElement.className = className;
        if (isPast && !isToday) {
            dayElement.classList.add('past-day');
        }
        
        const dayOfWeek = (startingDayOfWeek + day - 1) % 7;
        if (dayOfWeek >= 5) {
            dayElement.classList.add('calendar-day-align-right');
        }
        
        const appointmentsForDay = appointmentsByDate.get(dateStr) || [];
        
        if (appointmentsForDay.length > 0) {
            dayElement.classList.add('has-appointments');
        }
        
        dayElement.innerHTML = `
            <div class="calendar-day-number">${day}</div>
            <div class="calendar-day-appointments"></div>
        `;
        
        const appointmentsContainer = dayElement.querySelector('.calendar-day-appointments');
        
        // Show up to 3 appointments with details
        appointmentsForDay.slice(0, 3).forEach((apt, index) => {
            // PRIORITY: Use stored serviceName first (it's the source of truth)
            // Only look up by serviceId if serviceName is missing
            let serviceName = apt.serviceName;
            if (!serviceName || serviceName.trim() === '') {
                const service = Storage.getServiceById(apt.serviceId);
                serviceName = service ? service.name : 'Service';
            }
            
            // CRITICAL FIX: If serviceId is srv001, force serviceName to be "Consultation"
            // This prevents corrupted data from showing wrong service names
            if (apt.serviceId === 'srv001' && serviceName.toLowerCase() !== 'consultation') {
                console.warn('Calendar: Fixing service name for srv001 appointment', {
                    appointmentId: apt.id,
                    storedServiceName: apt.serviceName,
                    lookedUpServiceName: serviceName,
                    serviceId: apt.serviceId
                });
                serviceName = 'Consultation';
            }
            const serviceColor = getServiceColor(serviceName);
            const time = formatTimeForCalendar(apt.appointmentTime || apt.time || '');
            const shortServiceName = serviceName.length > 12 ? serviceName.substring(0, 12) + '...' : serviceName;
            
            const appointmentItem = document.createElement('div');
            appointmentItem.className = `calendar-appointment-item ${apt.status}`;
            appointmentItem.style.setProperty('--service-color', serviceColor);
            appointmentItem.style.borderLeftColor = serviceColor;
            appointmentItem.setAttribute('data-appointment-id', apt.id);
            appointmentItem.setAttribute('title', `${time} - ${serviceName} (${apt.status})`);
            
            appointmentItem.innerHTML = `
                <span class="calendar-appointment-time">${time}</span>
                <span class="calendar-appointment-service">${shortServiceName}</span>
            `;
            
            // Add click handler to view appointment details
            appointmentItem.addEventListener('click', (e) => {
                e.stopPropagation();
                viewAppointmentDetails(apt.id);
            });
            
            appointmentsContainer.appendChild(appointmentItem);
        });
        
        // Show "more" indicator if there are additional appointments
        if (appointmentsForDay.length > 3) {
            const more = document.createElement('div');
            more.className = 'calendar-appointment-more';
            more.textContent = `+${appointmentsForDay.length - 3} more`;
            more.setAttribute('title', `Click to view all ${appointmentsForDay.length} appointments`);
            
            // Add click handler to show all appointments for this day
            more.addEventListener('click', (e) => {
                e.stopPropagation();
                showCalendarDayOverlay(dateStr, appointmentsForDay.slice());
            });
            
            appointmentsContainer.appendChild(more);
        }

        // Add click handler to create appointment on this day
        dayElement.addEventListener('click', () => {
            if (!dayElement.classList.contains('other-month')) {
                showCalendarDayOverlay(dateStr, appointmentsForDay.slice());
            }
        });
        
        fragment.appendChild(dayElement);
    }
    
    // Fill remaining cells to complete grid
    const totalCells = 42; // 6 rows × 7 days
    const filledCells = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells - filledCells;
    
    for (let i = 0; i < remainingCells && i < 7; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        fragment.appendChild(emptyDay);
    }

    calendarGrid.appendChild(fragment);
}

// Get filtered appointments
function getFilteredAppointments() {
    const allAppointments = Storage.getAppointments();
    const dateFilter = document.getElementById('appointmentDateFilter')?.value || 'all';
    const serviceFilter = document.getElementById('appointmentServiceFilter')?.value || 'all';
    const patientFilter = document.getElementById('appointmentPatientFilter')?.value || '';
    // Check both the dropdown and the currentFilter variable (from filter buttons)
    const statusFilterDropdown = document.getElementById('appointmentStatusFilter')?.value || 'all';
    const statusFilter = (currentFilter && currentFilter !== 'all' && currentFilter !== 'today') ? currentFilter : statusFilterDropdown;
    
    const patients = Storage.getPatients() || [];
    const patientMap = new Map(patients.map(patient => [patient.id, patient]));
    const searchTerm = patientFilter.trim().toLowerCase();

    let filtered = [...allAppointments];

    // Date filter
    if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayStr = today.toISOString().split('T')[0];
        let weekStart;
        let monthStart;

        if (dateFilter === 'week') {
            weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            weekStart.setHours(0, 0, 0, 0);
        }
        if (dateFilter === 'month') {
            monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        filtered = filtered.filter(apt => {
            const aptDate = apt.appointmentDate || apt.date;
            if (!aptDate) return false;

            if (dateFilter === 'today') {
                return aptDate === todayStr;
            }

            const aptDateObj = new Date(aptDate);

            if (dateFilter === 'week') {
                return aptDateObj >= weekStart;
            }
            if (dateFilter === 'month') {
                return aptDateObj >= monthStart;
            }
            return true;
        });
    }

    // Service filter
    if (serviceFilter !== 'all') {
        filtered = filtered.filter(apt => apt.serviceId === serviceFilter);
    }

    // Patient filter
    if (searchTerm) {
        filtered = filtered.filter(apt => {
            const patientId = apt.patientId;
            const isGuest = patientId && patientId.startsWith('guest_appointment');
            const isWalkin = patientId && patientId.startsWith('walkin_');

            if (isGuest || isWalkin) {
                const notesMatch = apt.notes && apt.notes.match(/(?:GUEST|WALK-IN) PATIENT\nName: ([^\n]+)/);
                const guestName = notesMatch ? notesMatch[1].toLowerCase() : '';
                return guestName.includes(searchTerm);
            }

            const patient = patientMap.get(patientId);
            if (patient) {
                const fullName = patient.fullName ? patient.fullName.toLowerCase() : '';
                const email = patient.email ? patient.email.toLowerCase() : '';
                const phone = patient.phone || '';
                return fullName.includes(searchTerm) ||
                       email.includes(searchTerm) ||
                       phone.includes(searchTerm);
            }
            return false;
        });
    }

    // Status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    return filtered;
}

// Filter appointments
function filterAppointments(filter) {
    if (filter) {
        currentFilter = filter;
        // Also update the status filter dropdown to match
        if (filter !== 'all' && filter !== 'today') {
            const statusFilterDropdown = document.getElementById('appointmentStatusFilter');
            if (statusFilterDropdown) {
                statusFilterDropdown.value = filter;
            }
        } else if (filter === 'all') {
            const statusFilterDropdown = document.getElementById('appointmentStatusFilter');
            if (statusFilterDropdown) {
                statusFilterDropdown.value = 'all';
            }
        }
    }
    
    // Apply filters from the filter inputs
    const appointments = getFilteredAppointments();
    
    if (isCalendarView) {
        // Force calendar to re-render with filtered appointments
        renderCalendar();
    } else {
        loadAppointmentsList();
    }
}

// Load appointments list view
function loadAppointmentsList() {
    let appointments = getFilteredAppointments();
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    
    // Apply currentFilter if it's set (from filter buttons) - this takes priority over dropdown filters
    if (currentFilter && currentFilter !== 'all') {
        if (currentFilter === 'today') {
            const todayDate = new Date().toISOString().split('T')[0];
            appointments = appointments.filter(apt => {
                const aptDate = apt.date || apt.appointmentDate;
                return aptDate === todayDate;
            });
        } else if (['pending', 'confirmed', 'completed', 'cancelled'].includes(currentFilter)) {
            appointments = appointments.filter(apt => apt.status === currentFilter);
        }
    }
    
    // Calculate filter counts from ALL appointments (not filtered)
    const allAppointments = Storage.getAppointments();
    const todayDate = new Date().toISOString().split('T')[0];
    const appointmentFilterCounts = {
        all: allAppointments.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
        today: 0
    };

    allAppointments.forEach(apt => {
        switch (apt.status) {
            case 'pending':
                appointmentFilterCounts.pending++;
                break;
            case 'confirmed':
                appointmentFilterCounts.confirmed++;
                break;
            case 'completed':
                appointmentFilterCounts.completed++;
                break;
            default:
                break;
        }

        const aptDate = apt.date || apt.appointmentDate;
        if (aptDate === todayDate) {
            appointmentFilterCounts.today++;
        }
    });
    
    // Get filter label
    let filterLabel = 'All Appointments';
    switch(currentFilter) {
        case 'pending':
            filterLabel = 'Pending Appointments (Awaiting Approval)';
            break;
        case 'confirmed':
            filterLabel = 'Confirmed Appointments';
            break;
        case 'completed':
            filterLabel = 'Completed Appointments';
            break;
        case 'today':
            filterLabel = "Today's Appointments";
            break;
        default:
            filterLabel = 'All Appointments';
    }
    
    // Generate filter buttons with counts
    const filterButtonsHTML = `
        <div class="filter-buttons" style="margin-bottom: 1rem;">
            <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="filterAppointments('all')">All <span class="filter-count">(${appointmentFilterCounts.all})</span></button>
            <button class="filter-btn ${currentFilter === 'pending' ? 'active' : ''}" onclick="filterAppointments('pending')">Pending <span class="filter-count">(${appointmentFilterCounts.pending})</span></button>
            <button class="filter-btn ${currentFilter === 'confirmed' ? 'active' : ''}" onclick="filterAppointments('confirmed')">Confirmed <span class="filter-count">(${appointmentFilterCounts.confirmed})</span></button>
            <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" onclick="filterAppointments('completed')">Completed <span class="filter-count">(${appointmentFilterCounts.completed})</span></button>
            <button class="filter-btn ${currentFilter === 'today' ? 'active' : ''}" onclick="filterAppointments('today')">Today <span class="filter-count">(${appointmentFilterCounts.today})</span></button>
        </div>
    `;
    
    // Show filter indicator
    const filterIndicator = currentFilter !== 'all' ? 
        `<div class="filter-indicator">
            <span class="filter-indicator-icon">🔍</span>
            <span class="filter-indicator-text">Showing: ${filterLabel}</span>
        </div>` : '';
    
    if (appointments.length === 0) {
        container.innerHTML = filterButtonsHTML + filterIndicator + `
            <div class="no-data">
                <div class="no-data-icon">📅</div>
                <p>No ${currentFilter !== 'all' ? filterLabel.toLowerCase() : 'appointments'} found</p>
            </div>
        `;
        return;
    }
    
    const patients = Storage.getPatients() || [];
    const doctors = Storage.getDoctors() || [];
    const services = Storage.getServices() || [];

    const patientMap = new Map(patients.map(patient => [patient.id, patient]));
    const doctorMap = new Map(doctors.map(doctor => [doctor.id, doctor]));
    const serviceMap = new Map(services.map(service => [service.id, service]));

    container.innerHTML = filterButtonsHTML + filterIndicator + `
        <div class="appointment-row appointment-row-header">
            <div>Patient</div>
            <div>Service</div>
            <div>Doctor</div>
            <div>Date & Time</div>
            <div>Status</div>
            <div>Actions</div>
        </div>
    ` + appointments.map(apt => {
        const patient = patientMap.get(apt.patientId);
        const doctor = doctorMap.get(apt.doctorId);
        const service = serviceMap.get(apt.serviceId);
        
        // Handle guest appointments and walk-ins
        const isGuest = apt.patientId && apt.patientId.startsWith('guest_appointment');
        const isWalkin = apt.patientId && apt.patientId.startsWith('walkin_');
        let patientDisplayName;
        if (isGuest) {
            const notesMatch = apt.notes && apt.notes.match(/GUEST PATIENT[\s\S]*?Name:\s*([^\r\n]+)/i);
            const name = notesMatch ? notesMatch[1].trim() : 'Guest Patient';
            patientDisplayName = name;
        } else if (isWalkin) {
            const notesMatch = apt.notes && apt.notes.match(/WALK-IN PATIENT[\s\S]*?Name:\s*([^\r\n]+)/i);
            const name = notesMatch ? notesMatch[1].trim() : 'Walk-in Patient';
            patientDisplayName = name;
        } else {
            patientDisplayName = patient ? patient.fullName : 'Unknown Patient';
        }
        
        let serviceName = 'N/A';
        if (service && service.name) {
            serviceName = service.name;
        } else if (apt.serviceName) {
            serviceName = apt.serviceName;
        }
        
        if (apt.serviceId === 'srv001' && serviceName && serviceName.toLowerCase() !== 'consultation') {
            serviceName = 'Consultation';
        }
        
        // Format date and time
        const appointmentDate = Utils.formatDate(apt.date || apt.appointmentDate);
        const appointmentTime = Utils.formatTime(apt.time || apt.appointmentTime);
        
        // Extract guest/walk-in patient details from notes if available
        let guestDetails = '';
        if (isGuest && apt.notes) {
            // Extract guest patient information from notes
            const guestMatch = apt.notes.match(/GUEST PATIENT[\s\S]*?Name:\s*([^\r\n]+)(?:[\s\S]*?Age:\s*([^\r\n]+))?(?:[\s\S]*?Contact:\s*([^\r\n]+))?/i);
            if (guestMatch) {
                const name = guestMatch[1].trim();
                const age = guestMatch[2] ? guestMatch[2].trim() : '';
                const contact = guestMatch[3] ? guestMatch[3].trim() : '';
                let details = `GUEST PATIENT Name: ${name}`;
                if (age) details += ` Age: ${age}`;
                if (contact) details += ` Contact: ${contact.substring(0, 15)}${contact.length > 15 ? '...' : ''}`;
                guestDetails = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.4;">${details}</div>`;
            }
        } else if (isWalkin && apt.notes) {
            // Extract walk-in patient information from notes
            const walkinMatch = apt.notes.match(/WALK-IN PATIENT[\s\S]*?Name:\s*([^\r\n]+)(?:[\s\S]*?Age:\s*([^\r\n]+))?(?:[\s\S]*?Contact:\s*([^\r\n]+))?/i);
            if (walkinMatch) {
                const name = walkinMatch[1].trim();
                const age = walkinMatch[2] ? walkinMatch[2].trim() : '';
                const contact = walkinMatch[3] ? walkinMatch[3].trim() : '';
                let details = `WALK-IN PATIENT Name: ${name}`;
                if (age) details += ` Age: ${age}`;
                if (contact) details += ` Contact: ${contact.substring(0, 15)}${contact.length > 15 ? '...' : ''}`;
                guestDetails = `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.4;">${details}</div>`;
            }
        }
        
        return `
            <div class="appointment-row">
                <div class="appointment-patient-col">
                    ${patientDisplayName}
                </div>
                <div class="appointment-service-col">
                    ${serviceName}
                </div>
                <div class="appointment-doctor-col">
                    ${doctor ? doctor.name : 'Unknown'}
                </div>
                <div class="appointment-datetime-col">
                    <div class="appointment-date">${appointmentDate}</div>
                    <div class="appointment-time">${appointmentTime}</div>
                    ${guestDetails}
                </div>
                <div class="appointment-status-col">
                    <span class="badge ${Utils.getStatusBadgeClass(apt.status)}">${apt.status.toUpperCase()}</span>
                </div>
                <div class="appointment-actions-col">
                    <div class="action-dropdown">
                        <button class="action-dropdown-btn" onclick="toggleActionDropdown(event, '${apt.id}')" aria-label="Open appointment actions menu" title="Open appointment actions menu">
                            <img src="../assets/icons/gear.png" alt="Settings" class="action-dropdown-icon">
                        </button>
                        <div class="action-dropdown-menu" id="dropdown-${apt.id}">
                            ${apt.status === 'pending' ? 
                                `<button class="action-dropdown-item" onclick="confirmAppointment('${apt.id}')">
                                    <span class="action-icon"><img src="../assets/icons/confirmation.png" alt="Confirm"></span> Confirm
                                </button>` : ''}
                            <button class="action-dropdown-item" onclick="viewAppointmentDetails('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/view.png" alt="View"></span> View Details
                            </button>
                            <button class="action-dropdown-item" onclick="changeAppointmentDentist('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/assign.png" alt="Assign"></span> Assign Dentist
                            </button>
                            <button class="action-dropdown-item" onclick="editAppointmentStatus('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/status.png" alt="Status"></span> Edit Status
                            </button>
                            ${apt.status !== 'completed' && apt.status !== 'cancelled' ? `
                            <button class="action-dropdown-item" onclick="openRescheduleModal('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/status.png" alt="Reschedule"></span> Reschedule
                            </button>` : ''}
                            <button class="action-dropdown-item" onclick="openEditNotesModal('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/notes.png" alt="Notes"></span> Edit Notes
                            </button>
                            <button class="action-dropdown-item action-dropdown-item-danger" onclick="cancelAppointment('${apt.id}')">
                                <span class="action-icon"><img src="../assets/icons/cancel.png" alt="Cancel"></span> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Populate service filter
function populateServiceFilter() {
    const services = Storage.getServices();
    const serviceFilter = document.getElementById('appointmentServiceFilter');
    if (!serviceFilter) return;
    
    serviceFilter.innerHTML = '<option value="all">All Services</option>' +
        services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

// Service helpers for staff dashboard
function normalizeStaffServiceDuration(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    if (typeof value === 'number') {
        return `${value} mins`;
    }
    
    const stringValue = String(value).trim();
    if (stringValue === '') {
        return '';
    }
    
    if (/^\d+$/.test(stringValue)) {
        return `${stringValue} mins`;
    }
    
    return stringValue;
}

function normalizeStaffServiceFromApi(service) {
    if (!service) {
        return null;
    }
    
    const normalized = {
        id: service.id || service.service_id || service.serviceId || null,
        name: service.name || service.service_name || service.serviceName || 'Unnamed Service',
        description: service.description || service.details || '',
        duration: normalizeStaffServiceDuration(
            service.duration !== undefined ? service.duration :
            service.duration_minutes !== undefined ? service.duration_minutes :
            service.durationMinutes
        ),
        price: service.price ?? service.cost ?? service.fee ?? ''
    };
    
    if (!normalized.id) {
        const slug = normalized.name
            ? normalized.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            : 'service';
        normalized.id = `srv-auto-${slug || Date.now()}`;
    }
    
    if (normalized.price !== '' && typeof normalized.price !== 'string') {
        normalized.price = String(normalized.price);
    } else if (typeof normalized.price === 'string') {
        normalized.price = normalized.price.trim();
    }
    
    if ((service.created_at || service.createdAt) && !normalized.createdAt) {
        normalized.createdAt = service.created_at || service.createdAt;
    }
    
    if ((service.updated_at || service.updatedAt) && !normalized.updatedAt) {
        normalized.updatedAt = service.updated_at || service.updatedAt;
    }
    
    return normalized;
}

function isStaffNetworkError(error) {
    const message = typeof error === 'string' ? error : (error && error.message);
    if (!message) {
        return false;
    }
    
    if (error && error.name === 'AbortError') {
        return true;
    }
    
    const patterns = [
        'Failed to fetch',
        'NetworkError',
        'ERR_CONNECTION',
        'ECONNREFUSED',
        'ENOTFOUND',
        'timeout',
        'Timed out',
        'The network connection was lost'
    ];
    
    return patterns.some(pattern => message.includes(pattern));
}

// Load services (read-only for staff)
async function loadServices(options = {}) {
    const container = document.getElementById('servicesList');
    if (!container) return;
    
    const skipBackend = options.skipBackend === true;
    
    if (!skipBackend && typeof API !== 'undefined' && typeof API.getServices === 'function') {
        try {
            const backendReady = await API.checkBackendAvailability();
            if (backendReady) {
                const apiServices = await API.getServices();
                
                if (Array.isArray(apiServices)) {
                    const normalized = apiServices
                        .map(normalizeStaffServiceFromApi)
                        .filter(Boolean);
                    
                    Storage.setServices(normalized);
                }
            }
        } catch (error) {
            console.warn('Unable to refresh services from backend (staff). Showing cached data.', error);
            if (!isStaffNetworkError(error) && typeof Utils !== 'undefined' && typeof Utils.showNotification === 'function') {
                Utils.showNotification('Unable to sync services with the server. Showing cached data instead.', 'warning');
            }
        }
    }
    
    const services = Storage.getServices();
    
    try {
        if (services.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">💼</div>
                    <p>No services found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = services.map(s => {
            const duration = ServiceDurations.getDuration(s);
            const durationText = ServiceDurations.minutesToTime(duration);
            return `
            <div class="data-card">
                <div class="data-info">
                    <h3>${s.name}</h3>
                    <div class="data-details">
                        <div class="data-detail-item">
                            <span class="data-detail-label">Duration:</span>
                            <span>${durationText}</span>
                        </div>
                    </div>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-color);">${s.description}</p>
                </div>
                <div class="data-actions">
                    <button onclick="editService('${s.id}')" class="btn btn-secondary btn-sm">Edit</button>
                    <button onclick="deleteService('${s.id}')" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load doctors (read-only for staff)
function loadDoctors() {
    try {
        const doctors = Storage.getDoctors();
        const container = document.getElementById('doctorsList');
        
        if (!container) return;
        
        if (doctors.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">🦷</div>
                    <p>No dentists found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = doctors.map(d => {
            const profileImg = d.profileImage ? 
                `<img src="${d.profileImage}" alt="${d.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gold-primary); margin-right: 1rem;">` :
                `<div style="width: 60px; height: 60px; border-radius: 50%; background: var(--gold-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; margin-right: 1rem;">${d.name.charAt(0).toUpperCase()}</div>`;
            
            return `
            <div class="data-card">
                <div class="data-info" style="display: flex; align-items: center;">
                    ${profileImg}
                    <div>
                        <h3>${d.name}</h3>
                        <div class="data-details">
                            <div class="data-detail-item">
                                <span class="data-detail-label">Specialty:</span>
                                <span>${d.specialty}</span>
                            </div>
                            <div class="data-detail-item">
                                <span class="data-detail-label">Status:</span>
                                <span class="badge ${d.available ? 'badge-success' : 'badge-danger'}">
                                    ${d.available ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="data-actions">
                    <button onclick="editDoctor('${d.id}')" class="btn btn-secondary btn-sm">Edit</button>
                    <button onclick="toggleDoctorAvailability('${d.id}')" class="btn btn-${d.available ? 'warning' : 'success'} btn-sm">${d.available ? 'Set Unavailable' : 'Set Available'}</button>
                    <button onclick="deleteDoctor('${d.id}')" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

// Load promotions (read-only for staff)
function loadPromos() {
    try {
        const promos = Storage.getPromos();
        const container = document.getElementById('promosList');
        
        if (!container) return;
        
        if (promos.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">⭐</div>
                    <p>No promotions found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = promos.map(promo => `
            <div class="data-card">
                <div class="data-info">
                    <h3>${promo.title}</h3>
                    <div class="data-details">
                        <div class="data-detail-item">
                            <span class="data-detail-label">Discount:</span>
                            <span>${promo.discount}</span>
                        </div>
                        <div class="data-detail-item">
                            <span class="data-detail-label">Price:</span>
                            <span>${Utils.toPeso(promo.price)}</span>
                        </div>
                        ${promo.validUntil ? `
                        <div class="data-detail-item">
                            <span class="data-detail-label">Valid Until:</span>
                            <span>${Utils.formatDate(promo.validUntil)}</span>
                        </div>
                        ` : ''}
                    </div>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-color);">${promo.description}</p>
                </div>
                <div class="data-actions">
                    <button onclick="editPromo('${promo.id}')" class="btn btn-secondary btn-sm">Edit</button>
                    <button onclick="deletePromo('${promo.id}')" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading promotions:', error);
    }
}

// Load patients
let staffPatientSearchFilter = '';

function loadPatients() {
    let patients = Storage.getPatients();
    const container = document.getElementById('patientsList');
    
    if (!container) return;
    
    // Read live search query from input
    const searchInput = document.getElementById('staffPatientSearchInput');
    const q = (searchInput?.value || staffPatientSearchFilter || '').toLowerCase().trim();
    
    // Apply search filter
    if (q) {
        patients = patients.filter(p => {
            const fullName = p.fullName?.toLowerCase() || '';
            const email = p.email?.toLowerCase() || '';
            const phone = p.phone?.toLowerCase() || '';
            const username = p.username?.toLowerCase() || '';
            const id = p.id?.toLowerCase() || '';
            return (
                fullName.includes(q) ||
                email.includes(q) ||
                phone.includes(q) ||
                username.includes(q) ||
                id.includes(q)
            );
        });
        staffPatientSearchFilter = q;
    }
    
    if (patients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">👥</div>
                <p>${q ? 'No patients found matching your search' : 'No patients found'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = patients.map(patient => {
        const appointments = Storage.getAppointmentsByPatient(patient.id);
        const upcomingAppts = Utils.getFutureAppointments(appointments).filter(a => a.status !== 'cancelled');
        
        return `
            <div class="patient-profile-card">
                <div class="patient-card-header">
                    <div class="patient-avatar"></div>
                    <div class="patient-header-info">
                        <h3>${patient.fullName}</h3>
                        <p class="patient-id">ID: ${patient.id}</p>
                    </div>
                    ${upcomingAppts.length > 0 ? `
                        <span class="patient-badge">
                            ${upcomingAppts.length} upcoming
                        </span>
                    ` : ''}
                </div>
                <div class="patient-card-body">
                    <div class="patient-info-grid">
                        <div class="patient-info-item">
                            <div class="info-content">
                                <span class="info-label">EMAIL</span>
                                <span class="info-value">${patient.email || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="patient-info-item">
                            <div class="info-content">
                                <span class="info-label">PHONE</span>
                                <span class="info-value">${patient.phone || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="patient-info-item">
                            <div class="info-content">
                                <span class="info-label">DATE OF BIRTH</span>
                                <span class="info-value">${patient.dateOfBirth ? Utils.formatDate(patient.dateOfBirth) : 'N/A'}</span>
                            </div>
                        </div>
                        <div class="patient-info-item">
                            <div class="info-content">
                                <span class="info-label">ADDRESS</span>
                                <span class="info-value">${patient.address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="patient-card-actions">
                    <button onclick="viewPatientProfile('${patient.id}')" class="btn btn-primary">
                        View Full Profile
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Setup patient search
function setupStaffPatientSearch() {
    const searchInput = document.getElementById('staffPatientSearchInput');
    if (searchInput) {
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        newInput.addEventListener('input', handleStaffPatientSearch);
        newInput.addEventListener('keyup', handleStaffPatientSearch);
    }
}

function handleStaffPatientSearch(e) {
    const searchValue = e.target?.value || '';
    staffPatientSearchFilter = searchValue.toLowerCase();
    loadPatients();
}

function clearStaffPatientFilter() {
    const searchInput = document.getElementById('staffPatientSearchInput');
    if (searchInput) {
        searchInput.value = '';
        staffPatientSearchFilter = '';
        loadPatients();
    }
}

// Sort appointments based on current sort option
function sortAppointmentsList(appointments) {
    const sortSelect = document.getElementById('sortAppointments');
    if (sortSelect) {
        currentSort = sortSelect.value;
    }
    
    return appointments.sort((a, b) => {
        switch(currentSort) {
            case 'date-asc':
                // Earliest first (default Utils.sortAppointments behavior)
                const dateA = new Date(a.date + ' ' + a.time);
                const dateB = new Date(b.date + ' ' + b.time);
                return dateA - dateB;
                
            case 'date-desc':
                // Latest first
                const dateA_desc = new Date(a.date + ' ' + a.time);
                const dateB_desc = new Date(b.date + ' ' + b.time);
                return dateB_desc - dateA_desc;
                
            case 'patient-asc':
                // Patient name A-Z
                const patientA = Storage.getPatientById(a.patientId);
                const patientB = Storage.getPatientById(b.patientId);
                const isGuestA = a.patientId && a.patientId.startsWith('guest_appointment');
                const isGuestB = b.patientId && b.patientId.startsWith('guest_appointment');
                const isWalkinA = a.patientId && a.patientId.startsWith('walkin_');
                const isWalkinB = b.patientId && b.patientId.startsWith('walkin_');
                let nameA = 'Unknown';
                let nameB = 'Unknown';
                
                if (isGuestA) {
                    const notesMatch = a.notes && a.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
                    nameA = notesMatch ? notesMatch[1] : 'Guest Patient';
                } else if (isWalkinA) {
                    const notesMatch = a.notes && a.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
                    nameA = notesMatch ? notesMatch[1] : 'Walk-in Patient';
                } else {
                    nameA = patientA ? patientA.fullName : 'Unknown';
                }
                
                if (isGuestB) {
                    const notesMatch = b.notes && b.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
                    nameB = notesMatch ? notesMatch[1] : 'Guest Patient';
                } else if (isWalkinB) {
                    const notesMatch = b.notes && b.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
                    nameB = notesMatch ? notesMatch[1] : 'Walk-in Patient';
                } else {
                    nameB = patientB ? patientB.fullName : 'Unknown';
                }
                
                return nameA.localeCompare(nameB);
                
            case 'patient-desc':
                // Patient name Z-A
                const patientA_desc = Storage.getPatientById(a.patientId);
                const patientB_desc = Storage.getPatientById(b.patientId);
                const isGuestA_desc = a.patientId && a.patientId.startsWith('guest_appointment');
                const isGuestB_desc = b.patientId && b.patientId.startsWith('guest_appointment');
                const isWalkinA_desc = a.patientId && a.patientId.startsWith('walkin_');
                const isWalkinB_desc = b.patientId && b.patientId.startsWith('walkin_');
                let nameA_desc = 'Unknown';
                let nameB_desc = 'Unknown';
                
                if (isGuestA_desc) {
                    const notesMatch = a.notes && a.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
                    nameA_desc = notesMatch ? notesMatch[1] : 'Guest Patient';
                } else if (isWalkinA_desc) {
                    const notesMatch = a.notes && a.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
                    nameA_desc = notesMatch ? notesMatch[1] : 'Walk-in Patient';
                } else {
                    nameA_desc = patientA_desc ? patientA_desc.fullName : 'Unknown';
                }
                
                if (isGuestB_desc) {
                    const notesMatch = b.notes && b.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
                    nameB_desc = notesMatch ? notesMatch[1] : 'Guest Patient';
                } else if (isWalkinB_desc) {
                    const notesMatch = b.notes && b.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
                    nameB_desc = notesMatch ? notesMatch[1] : 'Walk-in Patient';
                } else {
                    nameB_desc = patientB_desc ? patientB_desc.fullName : 'Unknown';
                }
                
                return nameB_desc.localeCompare(nameA_desc);
                
            case 'doctor-asc':
                // Doctor name A-Z
                const doctorA = Storage.getDoctorById(a.doctorId);
                const doctorB = Storage.getDoctorById(b.doctorId);
                const doctorNameA = doctorA ? doctorA.name : 'Unknown';
                const doctorNameB = doctorB ? doctorB.name : 'Unknown';
                return doctorNameA.localeCompare(doctorNameB);
                
            case 'doctor-desc':
                // Doctor name Z-A
                const doctorA_desc = Storage.getDoctorById(a.doctorId);
                const doctorB_desc = Storage.getDoctorById(b.doctorId);
                const doctorNameA_desc = doctorA_desc ? doctorA_desc.name : 'Unknown';
                const doctorNameB_desc = doctorB_desc ? doctorB_desc.name : 'Unknown';
                return doctorNameB_desc.localeCompare(doctorNameA_desc);
                
            case 'status-asc':
                // Status A-Z
                return a.status.localeCompare(b.status);
                
            case 'status-desc':
                // Status Z-A
                return b.status.localeCompare(a.status);
                
            default:
                // Default: date ascending (earliest first)
                const dateA_def = new Date(a.date + ' ' + a.time);
                const dateB_def = new Date(b.date + ' ' + b.time);
                return dateA_def - dateB_def;
        }
    });
}

// Sort appointments function (called from HTML)
function sortAppointments() {
    loadAppointments();
}

// Helper function to create or find patient record from guest/walk-in appointment
function createOrFindPatientRecord(appointment) {
    const isGuest = appointment.patientId && appointment.patientId.startsWith('guest_appointment');
    const isWalkin = appointment.patientId && appointment.patientId.startsWith('walkin_');
    
    if (!isGuest && !isWalkin) {
        return null; // Not a guest or walk-in, skip
    }
    
    // Extract patient information from notes
    let patientName = '';
    let patientAge = '';
    let patientContact = '';
    let patientEmail = '';
    
    if (appointment.notes) {
        const nameMatch = appointment.notes.match(/(?:GUEST|WALK-IN) PATIENT\nName: ([^\n]+)/);
        const ageMatch = appointment.notes.match(/Age: ([^\n]+)/);
        const contactMatch = appointment.notes.match(/Contact: ([^\n]+)/);
        const emailMatch = appointment.notes.match(/Email: ([^\n]+)/);
        
        patientName = nameMatch ? nameMatch[1].trim() : '';
        patientAge = ageMatch ? ageMatch[1].trim() : '';
        patientContact = contactMatch ? contactMatch[1].trim() : '';
        patientEmail = emailMatch ? emailMatch[1].trim() : '';
    }
    
    if (!patientName && !patientContact) {
        return null; // Not enough information to create a patient record
    }
    
    // Check if patient already exists by contact number
    const allPatients = Storage.getPatients();
    let existingPatient = null;
    
    if (patientContact) {
        existingPatient = allPatients.find(p => p.phone === patientContact);
    }
    
    // If patient exists, return existing patient ID
    if (existingPatient) {
        return existingPatient.id;
    }
    
    // Create new patient record
    const nameParts = patientName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const newPatient = {
        fullName: patientName,
        firstName: firstName,
        lastName: lastName,
        phone: patientContact || '',
        email: patientEmail || '',
        dateOfBirth: patientAge ? calculateDateOfBirth(patientAge) : '',
        gender: '', // Not available from guest booking
        address: '', // Not available from guest booking
        role: 'patient', // Mark as patient for future use
        dateCreated: new Date().toISOString()
    };
    
    try {
        const createdPatient = Storage.createPatient(newPatient);
        return createdPatient.id;
    } catch (error) {
        console.error('Error creating patient record:', error);
        return null;
    }
}

// Helper function to calculate approximate date of birth from age
function calculateDateOfBirth(age) {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return '';
    
    const today = new Date();
    const birthYear = today.getFullYear() - ageNum;
    // Use January 1st as default date
    return `${birthYear}-01-01`;
}

// Confirm appointment
function confirmAppointment(appointmentId) {
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        CustomAlert.error('Appointment not found');
        return;
    }
    
    // Create or find patient record for guest/walk-in appointments
    const newPatientId = createOrFindPatientRecord(appointment);
    let updatedAppointment = { status: 'confirmed' };
    
    if (newPatientId) {
        // Update appointment to link to the new/existing patient record
        updatedAppointment.patientId = newPatientId;
    }
    
    Storage.updateAppointment(appointmentId, updatedAppointment);
    
    // Get updated appointment
    const updatedApt = Storage.getAppointmentById(appointmentId);
    
    // Get patient name
    const patient = Storage.getPatientById(updatedApt.patientId);
    let patientDisplayName = patient ? patient.fullName : 'Unknown Patient';
    
    // Auto-create medical record when appointment is confirmed
    const doctor = Storage.getDoctorById(updatedApt.doctorId);
    const service = Storage.getServiceById(updatedApt.serviceId);
    
    let treatmentNotes = updatedApt.treatment || updatedApt.notes || '';
    let remarks = updatedApt.remarks || '';
    
    treatmentNotes = treatmentNotes || `Confirmed appointment for ${service ? service.name : 'dental service'}`;
    remarks = remarks || `Appointment confirmed on ${new Date().toLocaleDateString()}`;
    
    const recordData = {
        patientId: updatedApt.patientId,
        serviceId: updatedApt.serviceId || null,
        doctorId: updatedApt.doctorId || null,
        date: updatedApt.appointmentDate || updatedApt.date,
        time: updatedApt.appointmentTime || updatedApt.time,
        treatment: treatmentNotes,
        remarks: remarks
    };
    
    try {
        Storage.createMedicalHistory(recordData);
    } catch (error) {
        console.error('Error creating medical record:', error);
    }
    
    // Log activity
    if (typeof logActivity === 'function') {
        logActivity('appointment', 'Appointment Confirmed', `Staff ${currentUser.fullName} confirmed appointment for ${patientDisplayName}${newPatientId ? ' (patient record created)' : ''}`);
    }
    
    CustomAlert.success(`Appointment confirmed successfully!\n\nPatient: ${patientDisplayName}${newPatientId ? '\n\nA patient record has been created for future appointments.' : ''}`);
    loadStatistics();
    loadAppointments();
    updateFilterCounts();
    triggerDataSync();
}

// Edit appointment status
function editAppointmentStatus(appointmentId) {
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    // Store appointment ID
    document.getElementById('changeStatusAppointmentId').value = appointmentId;
    
    // Get appointment details
    const patient = Storage.getPatientById(appointment.patientId);
    const doctor = Storage.getDoctorById(appointment.doctorId);
    const service = Storage.getServiceById(appointment.serviceId);
    const isGuest = appointment.patientId && appointment.patientId.startsWith('guest_appointment');
    const isWalkin = appointment.patientId && appointment.patientId.startsWith('walkin_');
    
    let patientDisplayName;
    if (isGuest) {
        const notesMatch = appointment.notes && appointment.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
        patientDisplayName = notesMatch ? notesMatch[1] : 'Guest Patient';
    } else if (isWalkin) {
        const notesMatch = appointment.notes && appointment.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
        patientDisplayName = notesMatch ? notesMatch[1] : 'Walk-in Patient';
    } else {
        patientDisplayName = patient ? patient.fullName : 'Unknown';
    }
    
    // Define valid transitions
    const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
    };
    
    const allowedStatuses = validTransitions[appointment.status] || [];
    
    // Display appointment info
    const infoHTML = `
        <div class="status-info-card">
            <div class="status-info-row">
                <span class="status-info-label">Patient:</span>
                <span class="status-info-value">${patientDisplayName}</span>
            </div>
            <div class="status-info-row">
                <span class="status-info-label">Service:</span>
                <span class="status-info-value">${service ? service.name : 'N/A'}</span>
            </div>
            <div class="status-info-row">
                <span class="status-info-label">Doctor:</span>
                <span class="status-info-value">${doctor ? doctor.name : 'Unknown'}</span>
            </div>
            <div class="status-info-row">
                <span class="status-info-label">Date:</span>
                <span class="status-info-value">${Utils.formatDate(appointment.date)}</span>
            </div>
            <div class="status-info-row">
                <span class="status-info-label">Time:</span>
                <span class="status-info-value">${Utils.formatTime(appointment.time)}</span>
            </div>
            <div class="status-info-row">
                <span class="status-info-label">Current Status:</span>
                <span class="badge ${Utils.getStatusBadgeClass(appointment.status)}">${appointment.status.toUpperCase()}</span>
            </div>
            ${allowedStatuses.length === 0 ? `
            <div class="status-info-row" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <span class="status-info-value" style="color: var(--text-secondary); font-size: 0.9rem;">
                    ⚠️ This appointment is finalized and cannot be changed.
                </span>
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('changeStatusInfo').innerHTML = infoHTML;
    
    // Enable/disable status buttons based on valid transitions
    setTimeout(() => {
        const statusButtons = document.querySelectorAll('#changeStatusModal .status-btn');
        statusButtons.forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/updateAppointmentStatus\('(\w+)'\)/);
                if (match) {
                    const statusValue = match[1];
                    if (allowedStatuses.includes(statusValue)) {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                        btn.style.cursor = 'pointer';
                        btn.title = '';
                    } else {
                        btn.disabled = true;
                        btn.style.opacity = '0.5';
                        btn.style.cursor = 'not-allowed';
                        btn.title = `Cannot change from ${appointment.status} to ${statusValue}. ${appointment.status === 'pending' && statusValue === 'completed' ? 'Must be confirmed first.' : 'Invalid transition.'}`;
                    }
                }
            }
        });
    }, 100);
    
    // Close dropdown and overlay before opening modal
    document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
        menu.classList.remove('active');
    });
    const overlay = document.getElementById('action-dropdown-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    // Close dropdown immediately before opening modal
    const activeMenus = document.querySelectorAll('.action-dropdown-menu.active');
    activeMenus.forEach(menu => {
        menu.classList.remove('active');
        const button = menu.previousElementSibling;
        if (button && button.classList.contains('action-dropdown-btn')) {
            button.classList.remove('active');
        }
    });
    
    // Open the modal with explicit display
    const modal = document.getElementById('changeStatusModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
    }
}

function updateAppointmentStatus(newStatus) {
    const appointmentId = document.getElementById('changeStatusAppointmentId').value;
    
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        CustomAlert.error('Appointment not found');
        return;
    }
    
    // Enforce status flow: Pending → Confirmed → Completed
    // Pending cannot skip directly to Completed
    if (appointment.status === 'pending' && newStatus === 'completed') {
        CustomAlert.error('Invalid status transition.\n\nPending appointments must be confirmed first before marking as completed.\n\nPlease change status to "Confirmed" first.');
        return;
    }
    
    // Validate status transitions
    const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled'],
        'completed': [], // Cannot change from completed
        'cancelled': [] // Cannot change from cancelled
    };
    
    if (!validTransitions[appointment.status] || !validTransitions[appointment.status].includes(newStatus)) {
        const currentStatus = appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);
        const allowedStatuses = validTransitions[appointment.status].map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' or ');
        CustomAlert.error(`Invalid status transition.\n\nCurrent status: ${currentStatus}\n\nAllowed transitions: ${allowedStatuses || 'None (appointment is finalized)'}`);
        return;
    }
    
    // Create or find patient record for guest/walk-in appointments when confirming or completing
    const isGuest = appointment.patientId && appointment.patientId.startsWith('guest_appointment');
    const isWalkin = appointment.patientId && appointment.patientId.startsWith('walkin_');
    let newPatientId = null;
    
    if ((isGuest || isWalkin) && (newStatus === 'confirmed' || newStatus === 'completed')) {
        newPatientId = createOrFindPatientRecord(appointment);
    }
    
    // Update appointment status and patient ID if needed
    let updatedAppointment = { status: newStatus };
    if (newPatientId) {
        updatedAppointment.patientId = newPatientId;
    }
    
    Storage.updateAppointment(appointmentId, updatedAppointment);
    
    // Get updated appointment
    const updatedApt = Storage.getAppointmentById(appointmentId);
    
    // Get patient name for display
    const patient = Storage.getPatientById(updatedApt.patientId);
    let patientDisplayName;
    if (patient) {
        patientDisplayName = patient.fullName;
    } else {
        // Fallback to notes if patient not found
        const notesMatch = updatedApt.notes && updatedApt.notes.match(/(?:GUEST|WALK-IN) PATIENT\nName: ([^\n]+)/);
        patientDisplayName = notesMatch ? notesMatch[1] : 'Unknown Patient';
    }
    
    // Auto-create medical record when appointment is completed
    if (newStatus === 'completed') {
        const doctor = Storage.getDoctorById(updatedApt.doctorId);
        const service = Storage.getServiceById(updatedApt.serviceId);
        
        let treatmentNotes = updatedApt.treatment || updatedApt.notes || '';
        let remarks = updatedApt.remarks || '';
        
        treatmentNotes = treatmentNotes || `Completed appointment for ${service ? service.name : 'dental service'}`;
        remarks = remarks || `Appointment completed on ${new Date().toLocaleDateString()}`;
        
        const recordData = {
            patientId: updatedApt.patientId,
            serviceId: updatedApt.serviceId || null,
            doctorId: updatedApt.doctorId || null,
            date: updatedApt.appointmentDate || updatedApt.date,
            time: updatedApt.appointmentTime || updatedApt.time,
            treatment: treatmentNotes,
            remarks: remarks
        };
        
        try {
            Storage.createMedicalHistory(recordData);
        } catch (error) {
            console.error('Error creating medical record:', error);
        }
    }
    
    // Log activity
    if (typeof logActivity === 'function') {
        logActivity('appointment', `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, `Staff ${currentUser.fullName} changed appointment status from ${appointment.status} to ${newStatus} for ${patientDisplayName}${newPatientId ? ' (patient record created)' : ''}`);
    }
    
    // Show success alert
    CustomAlert.success(`Appointment status updated successfully!\n\nPrevious: ${appointment.status.toUpperCase()}\nNew: ${newStatus.toUpperCase()}\nPatient: ${patientDisplayName}${newPatientId ? '\n\nA patient record has been created for future appointments.' : ''}`);
    
    closeChangeStatusModal();
    loadStatistics();
    loadAppointments();
    updateFilterCounts();
    triggerDataSync();
}

function closeChangeStatusModal() {
    const modal = document.getElementById('changeStatusModal');
    if (modal) {
        modal.classList.remove('active');
        // Reset inline styles for all screen sizes
        modal.style.display = '';
        modal.style.opacity = '';
        modal.style.visibility = '';
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Cancel appointment
function cancelAppointment(appointmentId) {
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        CustomAlert.error('Appointment not found');
        return;
    }
    
    CustomConfirm.show(
        'Are you sure you want to cancel this appointment?',
        'Cancel Appointment',
        {
            confirmText: 'Yes, Cancel',
            cancelText: 'No, Keep',
            onConfirm: async () => {
                try {
                    Storage.updateAppointment(appointmentId, { status: 'cancelled' });
                    
                    // Get patient name for logging
                    const patient = Storage.getPatientById(appointment.patientId);
                    const isGuest = appointment.patientId && appointment.patientId.startsWith('guest_appointment');
                    const isWalkin = appointment.patientId && appointment.patientId.startsWith('walkin_');
                    let patientDisplayName;
                    if (isGuest) {
                        const notesMatch = appointment.notes && appointment.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
                        patientDisplayName = notesMatch ? notesMatch[1] : 'Guest Patient';
                    } else if (isWalkin) {
                        const notesMatch = appointment.notes && appointment.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
                        patientDisplayName = notesMatch ? notesMatch[1] : 'Walk-in Patient';
                    } else {
                        patientDisplayName = patient ? patient.fullName : 'Unknown Patient';
                    }
                    
                    // Log activity
                    if (typeof logActivity === 'function') {
                        logActivity('appointment', 'Appointment Cancelled', `Staff ${currentUser.fullName} cancelled appointment for ${patientDisplayName}`);
                    }
                    
                    CustomAlert.success(`Appointment cancelled successfully.\n\nPatient: ${patientDisplayName}`);
                    loadStatistics();
                    loadAppointments();
                    updateFilterCounts();
                    triggerDataSync();
                } catch (error) {
                    CustomAlert.error(`Failed to cancel appointment: ${error.message}`);
                }
            }
        }
    );
}

// Change appointment dentist
function changeAppointmentDentist(appointmentId) {
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    // Store appointment ID
    document.getElementById('changeDentistAppointmentId').value = appointmentId;
    
    // Get appointment date and day of week
    const appointmentDate = appointment.date || appointment.appointmentDate;
    let dayOfWeek = null;
    
    if (appointmentDate) {
        let dateObj;
        if (appointmentDate.includes('-')) {
            dateObj = new Date(appointmentDate + 'T00:00:00');
        } else {
            dateObj = new Date(appointmentDate);
        }
        
        if (!isNaN(dateObj.getTime())) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            dayOfWeek = dayNames[dateObj.getDay()];
        }
    }
    
    // Populate dentist dropdown
    const doctors = Storage.getDoctors();
    const dentistSelect = document.getElementById('changeDentistSelect');
    const options = doctors.map(d => {
        // Check if dentist has schedule for this day
        let scheduleStatus = '';
        if (dayOfWeek) {
            const dentistSchedules = Storage.getSchedulesByDoctor(d.id);
            const hasScheduleForDay = dentistSchedules.some(schedule => schedule.day === dayOfWeek);
            if (!hasScheduleForDay) {
                scheduleStatus = ' ⚠️ (Not scheduled on ' + dayOfWeek + ')';
            }
        }
        
        const unavailableText = !d.available ? ' (Unavailable)' : '';
        const selected = d.id === appointment.doctorId ? 'selected' : '';
        return `<option value="${d.id}" ${selected}>${d.name} - ${d.specialty}${unavailableText}${scheduleStatus}</option>`;
    }).join('');
    
    dentistSelect.innerHTML = '<option value="">Select Dentist</option>' + options;
    
    // Show current assignment info
    const currentDoctor = Storage.getDoctorById(appointment.doctorId);
    const patient = Storage.getPatientById(appointment.patientId);
    const service = Storage.getServiceById(appointment.serviceId);
    
    // Format date display with day of week
    const dateDisplay = appointmentDate && dayOfWeek 
        ? `${Utils.formatDate(appointmentDate)} (${dayOfWeek})`
        : Utils.formatDate(appointment.date || appointmentDate);
    
    document.getElementById('changeDentistInfo').innerHTML = `
        <div style="background: linear-gradient(135deg, #FAFBFC 0%, #FFFFFF 100%); padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1.5rem; border: 2px solid #FFD700; box-shadow: 0 2px 8px rgba(255, 215, 0, 0.1);">
            <p style="margin: 0.5rem 0; font-weight: 600; color: #1A1A1A;"><strong>Patient:</strong> <span style="font-weight: 500;">${patient ? patient.fullName : 'Unknown'}</span></p>
            <p style="margin: 0.5rem 0; font-weight: 600; color: #1A1A1A;"><strong>Service:</strong> <span style="font-weight: 500;">${service ? service.name : 'N/A'}</span></p>
            <p style="margin: 0.5rem 0; font-weight: 600; color: #1A1A1A;"><strong>Date & Time:</strong> <span style="font-weight: 500;">${dateDisplay} at ${Utils.formatTime(appointment.time)}</span></p>
            <p style="margin: 0.5rem 0; font-weight: 600; color: #1A1A1A;"><strong>Current Dentist:</strong> <span style="font-weight: 500;">${currentDoctor ? currentDoctor.name : 'Not assigned'}</span></p>
            ${dayOfWeek ? `<p style="margin: 0.5rem 0; font-size: 0.9rem; color: #EF4444; font-weight: 600;">⚠️ Only dentists scheduled on <strong>${dayOfWeek}</strong> can be assigned to this appointment.</p>` : ''}
        </div>
    `;
    
    // Close dropdown and overlay before opening modal
    document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
        menu.classList.remove('active');
    });
    const overlay = document.getElementById('action-dropdown-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    // Close dropdown immediately before opening modal
    const activeMenus = document.querySelectorAll('.action-dropdown-menu.active');
    activeMenus.forEach(menu => {
        menu.classList.remove('active');
        const button = menu.previousElementSibling;
        if (button && button.classList.contains('action-dropdown-btn')) {
            button.classList.remove('active');
        }
    });
    
    // Open modal with explicit display
    const modal = document.getElementById('changeDentistModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
    }
}

function closeChangeDentistModal() {
    const modal = document.getElementById('changeDentistModal');
    if (modal) {
        modal.classList.remove('active');
        // Reset inline styles for all screen sizes
        modal.style.display = '';
        modal.style.opacity = '';
        modal.style.visibility = '';
        // Restore body scroll
        document.body.style.overflow = '';
    }
    const form = document.getElementById('changeDentistForm');
    if (form) form.reset();
}

// Handle change dentist form submission
document.getElementById('changeDentistForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const appointmentId = document.getElementById('changeDentistAppointmentId').value;
    const newDoctorId = document.getElementById('changeDentistSelect').value;
    
    if (!newDoctorId) {
        Utils.showNotification('Please select a dentist', 'error');
        return;
    }
    
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        CustomAlert.error('Appointment not found');
        return;
    }
    
    const newDoctor = Storage.getDoctorById(newDoctorId);
    if (!newDoctor) {
        CustomAlert.error('Selected dentist not found');
        return;
    }
    
    // Check if dentist is scheduled on the appointment date
    const appointmentDate = appointment.date || appointment.appointmentDate;
    if (!appointmentDate) {
        CustomAlert.error('Appointment date not found');
        return;
    }
    
    // Get day of week from appointment date
    let dateObj;
    if (appointmentDate.includes('-')) {
        dateObj = new Date(appointmentDate + 'T00:00:00');
    } else {
        dateObj = new Date(appointmentDate);
    }
    
    if (isNaN(dateObj.getTime())) {
        CustomAlert.error('Invalid appointment date');
        return;
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    
    // Check if dentist has a schedule for this day
    const dentistSchedules = Storage.getSchedulesByDoctor(newDoctorId);
    const hasScheduleForDay = dentistSchedules.some(schedule => schedule.day === dayOfWeek);
    
    if (!hasScheduleForDay) {
        CustomAlert.error(
            `Cannot assign dentist: ${newDoctor.name}\n\n` +
            `The selected dentist (${newDoctor.name}) is not scheduled to work on ${dayOfWeek}.\n\n` +
            `Appointment Date: ${Utils.formatDate(appointmentDate)} (${dayOfWeek})\n` +
            `Appointment Time: ${Utils.formatTime(appointment.time)}\n\n` +
            `Please select a dentist who has a schedule for ${dayOfWeek}, or update the appointment date to a day when ${newDoctor.name} is available.\n\n` +
            `You can add a schedule for ${newDoctor.name} in the "Schedules" section.`
        );
        return;
    }
    
    // Update appointment with new dentist
    Storage.updateAppointment(appointmentId, { doctorId: newDoctorId });
    
    // Get patient name for logging
    const patient = Storage.getPatientById(appointment.patientId);
    const isWalkin = appointment.patientId && appointment.patientId.startsWith('walkin_');
    let patientDisplayName;
    if (isWalkin) {
        const notesMatch = appointment.notes && appointment.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
        patientDisplayName = notesMatch ? notesMatch[1] : 'Walk-in Patient';
    } else {
        patientDisplayName = patient ? patient.fullName : 'Unknown Patient';
    }
    
    // Log activity
    if (typeof logActivity === 'function') {
        logActivity('appointment', 'Dentist Assigned', `Staff ${currentUser.fullName} assigned ${newDoctor ? newDoctor.name : 'dentist'} to appointment for ${patientDisplayName}`);
    }
    
    CustomAlert.success(`Dentist updated successfully!\n\nNew Dentist: ${newDoctor ? newDoctor.name : 'Selected Dentist'}\nPatient: ${patientDisplayName}`);
    closeChangeDentistModal();
    loadStatistics();
    loadAppointments();
    updateFilterCounts();
    triggerDataSync();
});

// Load schedules
function loadSchedules() {
    try {
        const doctors = Storage.getDoctors();
        const container = document.getElementById('schedulesList');
        
        if (!container) {
            console.error('schedulesList container not found');
            return;
        }
        
        if (doctors.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">🦷</div>
                    <p>No dentists found</p>
                </div>
            `;
            return;
        }
        
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        container.innerHTML = doctors.map(doctor => {
            let schedules = Storage.getSchedulesByDoctor(doctor.id);
            
            // Sort schedules by day of week
            schedules = schedules.sort((a, b) => {
                const dayA = dayOrder.indexOf(a.day);
                const dayB = dayOrder.indexOf(b.day);
                return dayA - dayB;
            });
            
            if (schedules.length === 0) {
                return `
                    <div class="schedule-group">
                        <div class="schedule-group-header">
                            <div class="schedule-doctor-name">${doctor.name} - ${doctor.specialty}</div>
                        </div>
                        <p style="color: var(--text-secondary); padding: 1rem;">No schedules set</p>
                    </div>
                `;
            }
            
            return `
                <div class="schedule-group">
                    <div class="schedule-group-header">
                        <div class="schedule-doctor-name">${doctor.name} - ${doctor.specialty}</div>
                    </div>
                    <div class="schedule-items">
                        ${schedules.map(schedule => `
                            <div class="schedule-item">
                                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${schedule.day}</div>
                                <div style="color: var(--text-secondary); margin-bottom: 0.75rem;">${Utils.formatTime(schedule.startTime)} - ${Utils.formatTime(schedule.endTime)}</div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button onclick="editSchedule('${schedule.id}')" class="btn btn-secondary btn-xs" style="flex: 1;">Edit</button>
                                    <button onclick="deleteSchedule('${schedule.id}')" class="btn btn-danger btn-xs" style="flex: 1;">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading schedules:', error);
    }
}

// Edit schedule
async function editSchedule(scheduleId) {
    const schedule = Storage.getScheduleById(scheduleId);
    if (!schedule) {
        CustomAlert.error('Schedule not found');
        return;
    }
    
    const doctor = Storage.getDoctorById(schedule.doctorId);
    if (!doctor) {
        CustomAlert.error('Doctor not found');
        return;
    }
    
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const result = await CustomPrompt.showForm('Edit Dentist Schedule', [
        {
            name: 'dentist',
            label: 'Dentist',
            type: 'text',
            defaultValue: `${doctor.name} - ${doctor.specialty}`,
            required: false,
            readonly: true,
            helperText: 'This field cannot be changed'
        },
        {
            name: 'day',
            label: 'Day of Week',
            type: 'select',
            defaultValue: schedule.day || '',
            required: true,
            options: dayOrder.map(day => ({
                value: day,
                label: day,
                selected: schedule.day === day
            }))
        },
        {
            name: 'startTime',
            label: 'Start Time',
            type: 'time',
            defaultValue: schedule.startTime || '',
            required: true
        },
        {
            name: 'endTime',
            label: 'End Time',
            type: 'time',
            defaultValue: schedule.endTime || '',
            required: true
        }
    ], {
        okText: 'Update Schedule',
        cancelText: 'Cancel'
    });
    
    if (!result) return;
    
    const { day, startTime, endTime } = result;
    if (!day || !startTime || !endTime) {
        CustomAlert.error('Please fill in all required fields');
        return;
    }
    
    // Validate time range
    if (startTime >= endTime) {
        CustomAlert.error('End time must be after start time');
        return;
    }
    
    // Check for duplicate schedule (same doctor, same day)
    const existingSchedules = Storage.getSchedulesByDoctor(schedule.doctorId);
    const duplicate = existingSchedules.find(s => 
        s.id !== scheduleId && 
        s.day === day
    );
    
    if (duplicate) {
        CustomAlert.error(`${doctor.name} already has a schedule for ${day}`);
        return;
    }
    
    Storage.updateSchedule(scheduleId, {
        day,
        startTime,
        endTime
    });
    
    // Log activity
    if (typeof logActivity === 'function') {
        logActivity('schedule', 'Schedule Updated', `Staff ${currentUser.fullName} updated schedule for ${doctor.name}: ${day} ${startTime}-${endTime}`);
    }
    
    Utils.showNotification('Schedule updated successfully!', 'success');
    loadSchedules();
    triggerDataSync();
}

function closeEditScheduleModal() {
    document.getElementById('editScheduleModal').classList.remove('active');
    document.getElementById('editScheduleForm').reset();
}

// Delete schedule
async function deleteSchedule(scheduleId) {
    // Get schedule before deleting
    const schedule = Storage.getScheduleById(scheduleId);
    if (!schedule) {
        CustomAlert.error('Schedule not found');
        return;
    }
    
    const doctor = Storage.getDoctorById(schedule.doctorId);
    
    const confirmed = await Utils.confirm('Are you sure you want to delete this schedule?');
    if (!confirmed) {
        return; // User cancelled, do nothing
    }
    
    try {
        Storage.deleteSchedule(scheduleId);
        
        // Log activity
        if (typeof logActivity === 'function') {
            logActivity('schedule', 'Schedule Deleted', `Staff ${currentUser.fullName} deleted schedule for ${doctor ? doctor.name : 'Unknown'} - ${schedule.day} ${schedule.startTime}-${schedule.endTime}`);
        }
        
        CustomAlert.success(`Schedule deleted successfully.\n\nDoctor: ${doctor ? doctor.name : 'Unknown'}\nDay: ${schedule.day}\nTime: ${schedule.startTime} - ${schedule.endTime}`);
        loadSchedules();
        triggerDataSync();
    } catch (error) {
        CustomAlert.error(`Failed to delete schedule: ${error.message}`);
    }
}

// Populate dropdowns
function populateDropdowns() {
    // Populate patients
    const patients = Storage.getPatients();
    const patientSelect = document.getElementById('appointmentPatient');
    patientSelect.innerHTML = '<option value="">Select Patient</option>' +
        patients.map(p => `<option value="${p.id}">${p.fullName} - ${p.email}</option>`).join('');
    
    // Populate doctors for schedule modal and appointment doctor selection
    const doctors = Storage.getDoctors();
    const scheduleDoctor = document.getElementById('scheduleDoctor');
    if (scheduleDoctor) {
        scheduleDoctor.innerHTML = '<option value="">Select Dentist</option>' +
            doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
    }
    
    // Populate doctors for appointment creation (required - no auto-assign)
    const appointmentDoctor = document.getElementById('appointmentDoctor');
    if (appointmentDoctor) {
        const availableDoctors = doctors.filter(d => d.available);
        appointmentDoctor.innerHTML = '<option value="">Select a dentist first</option>' +
            availableDoctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
    }
    
    // Populate services with duration
    const services = Storage.getServices();
    const serviceSelect = document.getElementById('appointmentService');
    
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
    
    const consultationService = services.find(s => s && (s.id === 'srv001' || (s.name && s.name.trim().toLowerCase() === 'consultation')));
    const consultationDuration = ServiceDurations.getDuration(consultationService || 'consultation');
    const consultationOption = `<option value="consultation">Consultation (${formatDuration(consultationDuration)})</option>`;
    
    const filteredServices = services.filter(s => !(s && (s.id === 'srv001' || (s.name && s.name.trim().toLowerCase() === 'consultation'))));
    
    const serviceOptions = filteredServices.map(s => {
        const duration = ServiceDurations.getDuration(s);
        const durationText = formatDuration(duration);
        return `<option value="${s.id}">${s.name} (${durationText})</option>`;
    }).join('');
    
    serviceSelect.innerHTML = '<option value="">Select Service</option>' + consultationOption + serviceOptions;
    
    // Load time slots when date or service changes
    loadAppointmentTimeSlots();
}

// Load available time slots for appointment creation
function loadAppointmentTimeSlots() {
    try {
        const dateInput = document.getElementById('appointmentDate');
        const timeSelect = document.getElementById('appointmentTime');
        const serviceSelect = document.getElementById('appointmentService');
        const doctorSelect = document.getElementById('appointmentDoctor');
        
        if (!dateInput || !timeSelect) {
            console.warn('Date input or time select not found');
            return;
        }
        
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
        
        console.log('Loading time slots for doctor:', selectedDoctorId, 'date:', selectedDate);
    
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
    
    // Get selected doctor (required - no auto-assign)
    const doctor = Storage.getDoctorById(selectedDoctorId);
    if (!doctor || !doctor.available) {
        timeSelect.innerHTML = '<option value="">Selected dentist is not available</option>';
        return;
    }
    
    const doctorsToCheck = [doctor];
    
    // Get clinic schedule
    const clinicSchedule = Storage.getClinicSchedule();
    if (!clinicSchedule) {
        console.error('Clinic schedule not found');
        timeSelect.innerHTML = '<option value="">Error: Clinic schedule not configured</option>';
        return;
    }
    
    // Parse date properly (handle both YYYY-MM-DD and other formats)
    let dateObj;
    if (selectedDate.includes('-')) {
        dateObj = new Date(selectedDate + 'T00:00:00'); // Add time to avoid timezone issues
    } else {
        dateObj = new Date(selectedDate);
    }
    
    if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', selectedDate);
        timeSelect.innerHTML = '<option value="">Invalid date selected</option>';
        return;
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    const clinicDay = clinicSchedule[dayOfWeek];
    
    console.log('Day of week:', dayOfWeek, 'Clinic day:', clinicDay);
    
    if (!clinicDay || !clinicDay.isOpen) {
        timeSelect.innerHTML = '<option value="">Clinic is closed on ' + dayOfWeek + 's</option>';
        return;
    }
    
    // Get all doctor schedules for this day
    const schedules = Storage.getSchedules();
    if (!schedules || schedules.length === 0) {
        console.warn('No schedules found');
        timeSelect.innerHTML = '<option value="">No dentist schedules configured</option>';
        return;
    }
    
    const daySchedules = schedules.filter(s => s.day === dayOfWeek);
    console.log('Day schedules for', dayOfWeek + ':', daySchedules.length);
    
    if (daySchedules.length === 0) {
        timeSelect.innerHTML = '<option value="">No dentist schedules available for ' + dayOfWeek + 's</option>';
        return;
    }
    
    // Find the earliest start time and latest end time from relevant doctor schedules
    let earliestStart = '23:59';
    let latestEnd = '00:00';
    
    const relevantSchedules = daySchedules.filter(s => 
        doctorsToCheck.some(d => d.id === s.doctorId)
    );
    
    console.log('Relevant schedules for selected doctors:', relevantSchedules.length);
    
    if (relevantSchedules.length === 0) {
        timeSelect.innerHTML = '<option value="">Selected dentist(s) have no schedule for ' + dayOfWeek + 's</option>';
        return;
    }
    
    relevantSchedules.forEach(schedule => {
        if (schedule.startTime < earliestStart) {
            earliestStart = schedule.startTime;
        }
        if (schedule.endTime > latestEnd) {
            latestEnd = schedule.endTime;
        }
    });
    
    // Use clinic hours as limits
    const clinicStart = clinicDay.startTime;
    const clinicEnd = clinicDay.endTime;
    const actualStart = clinicStart > earliestStart ? clinicStart : earliestStart;
    const actualEnd = clinicEnd < latestEnd ? clinicEnd : latestEnd;
    
    console.log('Time range:', actualStart, 'to', actualEnd);
    
    // Generate all possible 30-minute time slots
    if (typeof Utils === 'undefined' || typeof Utils.generateTimeSlots !== 'function') {
        console.error('Utils.generateTimeSlots not available');
        timeSelect.innerHTML = '<option value="">Error: Time slot generator not available</option>';
        return;
    }
    
    const allSlots = Utils.generateTimeSlots(actualStart, actualEnd, 30);
    console.log('Generated', allSlots.length, 'potential time slots');
    
    // Filter slots to only show those where at least one doctor is available
    const availableSlots = allSlots.filter(slot => {
        // Check if at least one doctor can accommodate this time slot
        return doctorsToCheck.some(doctor => {
            // Check if doctor has schedule for this day
            const doctorSchedule = relevantSchedules.find(s => s.doctorId === doctor.id);
            if (!doctorSchedule) return false;
            
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
                return ServiceDurations.isTimeSlotAvailable(doctor.id, selectedDate, slot, serviceDuration);
            }
            
            return true;
        });
    });
    
    console.log('Available slots after filtering:', availableSlots.length);
    
    if (availableSlots.length === 0) {
        timeSelect.innerHTML = '<option value="">No available time slots for this date</option>';
        return;
    }
    
    // Populate time select with available slots
    timeSelect.innerHTML = '<option value="">Select Time</option>' +
        availableSlots.map(slot => {
            const time12 = Utils.formatTime(slot);
            return `<option value="${slot}">${time12}</option>`;
        }).join('');
    
    console.log(`Loaded ${availableSlots.length} available time slots`);
    } catch (error) {
        console.error('Error loading time slots:', error);
        const timeSelect = document.getElementById('appointmentTime');
        if (timeSelect) {
            timeSelect.innerHTML = '<option value="">Error loading time slots. Please try again.</option>';
        }
    }
}

// Make loadAppointmentTimeSlots globally accessible immediately
window.loadAppointmentTimeSlots = loadAppointmentTimeSlots;

// Toggle between registered and walk-in patient
window.togglePatientType = function togglePatientType() {
    const patientType = document.querySelector('input[name="patientType"]:checked').value;
    const existingSection = document.getElementById('existingPatientSection');
    const walkinSection = document.getElementById('walkinPatientSection');
    const patientSelect = document.getElementById('appointmentPatient');
    
    if (patientType === 'existing') {
        existingSection.style.display = 'block';
        walkinSection.style.display = 'none';
        patientSelect.required = true;
        // Clear walk-in fields
        document.getElementById('walkinName').required = false;
        document.getElementById('walkinAge').required = false;
        document.getElementById('walkinContact').required = false;
    } else {
        existingSection.style.display = 'none';
        walkinSection.style.display = 'block';
        patientSelect.required = false;
        // Make walk-in fields required
        document.getElementById('walkinName').required = true;
        document.getElementById('walkinAge').required = true;
        document.getElementById('walkinContact').required = true;
    }
};

// Update service price display (removed - prices not shown to patients)
function updateServicePrice() {
    // Function kept for compatibility but no longer displays prices
}

// Create appointment modal
window.showCreateAppointmentModal = function showCreateAppointmentModal() {
    // Close sidebar on mobile before showing modal
    if (window.innerWidth <= 767) {
        const sidebar = document.querySelector('.sidebar-nav');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    }
    
    // Populate dropdowns first
    if (typeof populateDropdowns === 'function') populateDropdowns();
    
    // Reset to existing patient by default
    const existingRadio = document.querySelector('input[name="patientType"][value="existing"]');
    if (existingRadio) existingRadio.checked = true;
    if (typeof window.togglePatientType === 'function') window.togglePatientType();
    
    // Reset payment method
    const paymentMethod = document.getElementById('appointmentPaymentMethod');
    const cardType = document.getElementById('appointmentCardType');
    const cardContainer = document.getElementById('cardTypeContainer');
    if (paymentMethod) paymentMethod.value = '';
    if (cardType) cardType.value = '';
    if (cardContainer) cardContainer.style.display = 'none';
    
    const modal = document.getElementById('createAppointmentModal');
    if (modal) modal.classList.add('active');
};

window.closeCreateAppointmentModal = function closeCreateAppointmentModal() {
    document.getElementById('createAppointmentModal').classList.remove('active');
    document.getElementById('createAppointmentForm').reset();
    
    // Reset to existing patient view
    document.querySelector('input[name="patientType"][value="existing"]').checked = true;
    if (typeof window.togglePatientType === 'function') window.togglePatientType();
};

// Create appointment form submission
document.getElementById('createAppointmentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const patientType = document.querySelector('input[name="patientType"]:checked').value;
    let patientId;
    let patientName;
    let additionalNotes = document.getElementById('appointmentNotes').value || '';
    
    // Get service info first (needed for smart scheduling)
    const serviceSelect = document.getElementById('appointmentService');
    let serviceId = serviceSelect.value;
    
    if (!serviceId) {
        Utils.showNotification('Please select a service', 'error');
        return;
    }
    
    // Handle consultation service - map directly to Consultation service ID
    if (serviceId === 'consultation') {
        // Consultation service is always srv001 - use it directly
        serviceId = 'srv001';
        console.log('Mapped consultation to service ID: srv001');
    }
    
    const service = Storage.getServiceById(serviceId);
    if (!service) {
        Utils.showNotification('Selected service not found. Please try again.', 'error');
        console.error('Service not found for serviceId:', serviceId, 'Original selection:', serviceSelect.value);
        return;
    }
    let serviceName = service.name;
    
    // Double-check: if consultation was selected but we got a different service, fix it
    if (serviceSelect.value === 'consultation' && service.id !== 'srv001') {
        console.warn('Consultation selected but wrong service found. Correcting to srv001...');
        const consultService = Storage.getServiceById('srv001');
        if (consultService) {
            serviceId = 'srv001';
            serviceName = consultService.name;
        }
    }
    
    // Get appointment time for smart scheduling
    const appointmentTime = document.getElementById('appointmentTime').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    
    // Get assigned doctor or auto-assign
    const selectedDoctorId = document.getElementById('appointmentDoctor').value;
    let doctorId;
    let wasAutoAssigned = false;
    
    if (selectedDoctorId) {
        // Use the manually selected doctor - will check availability later
        doctorId = selectedDoctorId;
    } else {
        // Auto-assign: Find any available doctor at this time slot
        wasAutoAssigned = true;
        if (typeof ServiceDurations !== 'undefined' && appointmentTime && appointmentDate) {
            const serviceDuration = ServiceDurations.getDuration(service);
            // Find any available doctor at this time slot (considers duration)
            doctorId = ServiceDurations.findAvailableDoctor(appointmentDate, appointmentTime, serviceDuration);
            
            if (!doctorId) {
                CustomAlert.error(`Sorry, all dentists are busy at this time slot.\n\nThe selected service requires ${ServiceDurations.minutesToTime(serviceDuration)}.\n\nPlease select a different time or assign a specific dentist.`);
                return;
            }
        } else {
            // Fallback: Get first available doctor if ServiceDurations not available
            const doctors = Storage.getDoctors();
            const availableDoctor = doctors.find(d => d.available) || doctors[0];
            
            if (!availableDoctor) {
                Utils.showNotification('No dentists available. Please add a dentist first.', 'error');
                return;
            }
            doctorId = availableDoctor.id;
        }
    }
    
    const assignedDoctor = Storage.getDoctorById(doctorId);
    
    // Handle patient type
    if (patientType === 'existing') {
        patientId = document.getElementById('appointmentPatient').value;
        if (!patientId) {
            Utils.showNotification('Please select a patient', 'error');
            return;
        }
        const patient = Storage.getPatientById(patientId);
        // Check if it's a walk-in patient
        const isWalkin = patientId && patientId.startsWith('walkin_');
        if (isWalkin) {
            // For existing walk-in patients, we need to get the appointment to extract name
            // But since we're creating a new appointment, this won't apply here
            // This case is mainly for display purposes when loading existing appointments
            patientName = 'Walk-in Patient';
        } else {
            patientName = patient ? patient.fullName : 'Unknown';
        }
    } else {
        // Walk-in patient
        const walkinName = document.getElementById('walkinName').value;
        const walkinAge = document.getElementById('walkinAge').value;
        const walkinContact = document.getElementById('walkinContact').value;
        const walkinEmail = document.getElementById('walkinEmail').value;
        
        if (!walkinName || !walkinAge || !walkinContact) {
            Utils.showNotification('Please fill in all walk-in patient information', 'error');
            return;
        }
        
        // Create a temporary patient ID for walk-ins
        patientId = 'walkin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        patientName = walkinName || 'Walk-in Patient'; // Use provided name or default
        
        // Add walk-in info to notes
        additionalNotes = `WALK-IN PATIENT\nName: ${walkinName}\nAge: ${walkinAge}\nContact: ${walkinContact}${walkinEmail ? `\nEmail: ${walkinEmail}` : ''}\n\n${additionalNotes}`;
    }
    
    // Service info already retrieved at line 2077, no need to get it again
    // Payment method removed from staff appointment form
    
    // serviceId already set at line 2078, no need to check again
    
    // Validate date is not in the past (appointmentDate already set above)
    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        CustomAlert.error('You cannot book appointments in the past.\n\nPlease select today or a future date.');
        return;
    }
    
    // Check if booking is within 2 weeks in advance
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 14); // 2 weeks = 14 days
    
    if (selectedDate > maxDate) {
        CustomAlert.error('Appointments can only be booked up to 2 weeks in advance.\n\nPlease select a date within the next 2 weeks.');
        return;
    }
    
           // Smart scheduling: Check for conflicts based on service duration
           if (typeof ServiceDurations !== 'undefined') {
               const serviceDuration = ServiceDurations.getDuration(service);
               
               // Check availability for selected doctor
               if (!ServiceDurations.isTimeSlotAvailable(doctorId, appointmentDate, appointmentTime, serviceDuration)) {
                   const doctorName = assignedDoctor ? assignedDoctor.name : 'the selected dentist';
                   CustomAlert.error(`The selected time slot conflicts with an existing appointment for ${doctorName}.\n\nThe selected service requires ${ServiceDurations.minutesToTime(serviceDuration)}.\n\nPlease select a different time.`);
                   return;
               }
           }
    
    // Get payment method
    const paymentMethod = document.getElementById('appointmentPaymentMethod').value;
    const cardType = document.getElementById('appointmentCardType').value;
    let paymentInfo = paymentMethod;
    if ((paymentMethod === 'Debit Card' || paymentMethod === 'Credit Card') && cardType) {
        paymentInfo = `${paymentMethod} (${cardType})`;
    }
    
    // Ensure we have the correct service - double check after consultation mapping
    const finalService = Storage.getServiceById(serviceId);
    if (!finalService) {
        Utils.showNotification('Selected service not found. Please try again.', 'error');
        console.error('Service not found for serviceId:', serviceId);
        return;
    }
    
    // Create appointment
    const appointmentData = {
        patientId: patientId,
        doctorId: doctorId,
        serviceId: serviceId,
        serviceName: finalService.name, // Store service name for display
        date: appointmentDate,
        appointmentDate: appointmentDate, // Store both for compatibility
        time: document.getElementById('appointmentTime').value,
        appointmentTime: document.getElementById('appointmentTime').value, // Store both for compatibility
        notes: additionalNotes,
        paymentMethod: paymentInfo,
        status: 'confirmed',
        createdBy: currentUser.id
    };
    
    try {
        const createdAppointment = Storage.createAppointment(appointmentData);
        
        // Create medical record for walk-in appointments when created by staff
        const isWalkin = appointmentData.patientId && appointmentData.patientId.startsWith('walkin_');
        if (isWalkin && createdAppointment) {
            const doctor = Storage.getDoctorById(appointmentData.doctorId);
            const service = Storage.getServiceById(appointmentData.serviceId);
            
            const recordData = {
                patientId: appointmentData.patientId,
                serviceId: appointmentData.serviceId || null,
                doctorId: appointmentData.doctorId || null,
                date: appointmentData.date,
                time: appointmentData.time,
                treatment: appointmentData.notes || `Walk-in appointment created for ${service ? service.name : 'dental service'}`,
                remarks: `Walk-in appointment created by staff on ${new Date().toLocaleDateString()}`
            };
            
            try {
                Storage.createMedicalHistory(recordData);
            } catch (error) {
                console.error('Error creating medical record for walk-in:', error);
            }
        }
        
        // Log activity
        if (typeof logActivity === 'function') {
            logActivity('appointment', 'Appointment Created', `Staff ${currentUser.fullName} created appointment for ${patientName} - ${serviceName} with ${assignedDoctor.name} on ${Utils.formatDate(appointmentData.date)} at ${Utils.formatTime(appointmentData.time)}`);
        }
        
        // Show success message
        const formattedDate = Utils.formatDate(appointmentData.date);
        const appointmentTime = Utils.formatTime(appointmentData.time);
        
        CustomAlert.success(`Appointment created successfully!\n\nPatient: ${patientName}\nService: ${serviceName}\nDentist: ${assignedDoctor.name}\nDate: ${formattedDate}\nTime: ${appointmentTime}`);
        
        closeCreateAppointmentModal();
        loadStatistics();
        loadAppointments();
        updateFilterCounts();
        triggerDataSync();
    } catch (error) {
        console.error('Error creating appointment:', error);
        CustomAlert.error('Failed to create appointment. Please try again or contact support.');
    }
});

// Add schedule modal
function showAddScheduleModal() {
    populateDropdowns(); // Populate the doctor dropdown
    document.getElementById('addScheduleModal').classList.add('active');
}

function showAddScheduleModalForDoctor(doctorId) {
    populateDropdowns();
    document.getElementById('scheduleDoctor').value = doctorId;
    document.getElementById('addScheduleModal').classList.add('active');
}

function closeAddScheduleModal() {
    document.getElementById('addScheduleModal').classList.remove('active');
    document.getElementById('addScheduleForm').reset();
}

// Add schedule form submission
document.getElementById('addScheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const startTime = document.getElementById('scheduleStartTime').value;
    const endTime = document.getElementById('scheduleEndTime').value;
    
    if (startTime >= endTime) {
        Utils.showNotification('End time must be after start time', 'error');
        return;
    }
    
    const scheduleData = {
        doctorId: document.getElementById('scheduleDoctor').value,
        day: document.getElementById('scheduleDay').value,
        startTime: startTime,
        endTime: endTime
    };
    
    Storage.createSchedule(scheduleData);
    
    // Log activity
    if (typeof logActivity === 'function') {
        const doctor = Storage.getDoctorById(scheduleData.doctorId);
        logActivity('schedule', 'Schedule Added', `Staff ${currentUser.fullName} added schedule for ${doctor ? doctor.name : 'Unknown'} - ${scheduleData.day} ${scheduleData.startTime}-${scheduleData.endTime}`);
    }
    
    CustomAlert.success(`Schedule added successfully!\n\nDay: ${scheduleData.day}\nTime: ${scheduleData.startTime} - ${scheduleData.endTime}`);
    closeAddScheduleModal();
    loadSchedules();
    triggerDataSync();
});

// Edit schedule form submission (legacy modal - kept for backward compatibility but not used)
// The editSchedule function now uses CustomPrompt.showForm instead
// document.getElementById('editScheduleForm').addEventListener('submit', (e) => {
//     // This is now handled by the async editSchedule function using CustomPrompt
// });

// Refresh data manually
window.refreshData = function refreshData() {
    try {
        if (typeof loadStatistics === 'function') loadStatistics();
        // Refresh appointments based on current view
        if (typeof isCalendarView !== 'undefined' && isCalendarView) {
            if (typeof renderCalendar === 'function') renderCalendar();
        } else {
            if (typeof loadAppointmentsList === 'function') loadAppointmentsList();
        }
        if (typeof loadSchedules === 'function') loadSchedules();
        if (typeof loadServices === 'function') loadServices();
        if (typeof loadDoctors === 'function') loadDoctors();
        if (typeof loadPromos === 'function') loadPromos();
        if (typeof loadPatients === 'function') loadPatients();
        if (typeof updateFilterCounts === 'function') updateFilterCounts();
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('Data refreshed', 'success');
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
        alert('Error refreshing data: ' + error.message);
    }
};

// Create Patient Modal Functions
window.showCreatePatientModal = function showCreatePatientModal() {
    // Close sidebar on mobile before showing modal
    if (window.innerWidth <= 767) {
        const sidebar = document.querySelector('.sidebar-nav');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    }
    
    document.getElementById('createPatientModal').classList.add('active');
};

window.closeCreatePatientModal = function closeCreatePatientModal() {
    document.getElementById('createPatientModal').classList.remove('active');
    document.getElementById('createPatientForm').reset();
};

// Create patient form submission
document.getElementById('createPatientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('newPatientUsername').value;
    
    // Check if username already exists
    if (Storage.getUserByUsername(username)) {
        Utils.showNotification('Username already exists. Please choose a different username.', 'error');
        return;
    }
    
    const patientData = {
        fullName: document.getElementById('newPatientName').value,
        username: username,
        email: document.getElementById('newPatientEmail').value,
        phone: document.getElementById('newPatientPhone').value,
        dateOfBirth: document.getElementById('newPatientDOB').value,
        address: document.getElementById('newPatientAddress').value,
        password: document.getElementById('newPatientPassword').value,
        role: 'patient'
    };
    
    // Validate email
    if (!Utils.validateEmail(patientData.email)) {
        Utils.showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Check if email already exists
    const existingEmail = Storage.getUserByEmail(patientData.email);
    if (existingEmail) {
        Utils.showNotification('This email is already registered. Please use a different email address.', 'error');
        return;
    }
    
    // Validate phone
    if (!Utils.validatePhone(patientData.phone)) {
        Utils.showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    Storage.createUser(patientData);
    
    // Log activity
    if (typeof logActivity === 'function') {
        logActivity('patient', 'Patient Account Created', `Staff ${currentUser.fullName} created patient account for ${patientData.fullName} (${patientData.email})`);
    }
    
    CustomAlert.success(`Patient account created successfully!\n\nPatient: ${patientData.fullName}\nEmail: ${patientData.email}\nUsername: ${patientData.username}`);
    closeCreatePatientModal();
    loadStatistics();
    loadStaffPatients();
    populateDropdowns();
    triggerDataSync();
});

// Load and manage clinic schedule
function loadClinicSchedule() {
    const clinicSchedule = Storage.getClinicSchedule();
    const container = document.getElementById('clinicScheduleManager');
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    container.innerHTML = days.map(day => {
        const daySchedule = clinicSchedule[day] || { isOpen: false, startTime: '09:00', endTime: '18:00' };
        
        return `
            <div class="clinic-schedule-card">
                <div class="clinic-schedule-header">
                    <h3>${day}</h3>
                    <label class="toggle-switch">
                        <input type="checkbox" ${daySchedule.isOpen ? 'checked' : ''} 
                               onchange="toggleClinicDay('${day}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">${daySchedule.isOpen ? 'Open' : 'Closed'}</span>
                </div>
                ${daySchedule.isOpen ? `
                    <div class="clinic-schedule-times">
                        <div class="time-input-group">
                            <label>Opening Time</label>
                            <input type="time" value="${daySchedule.startTime}" 
                                   onchange="updateClinicTime('${day}', 'startTime', this.value)"
                                   class="form-control">
                        </div>
                        <div class="time-input-group">
                            <label>Closing Time</label>
                            <input type="time" value="${daySchedule.endTime}" 
                                   onchange="updateClinicTime('${day}', 'endTime', this.value)"
                                   class="form-control">
                        </div>
                    </div>
                    <div class="clinic-schedule-summary">
                        ${Utils.formatTime(daySchedule.startTime)} - ${Utils.formatTime(daySchedule.endTime)}
                    </div>
                ` : `
                    <div class="clinic-schedule-closed">Clinic is closed on ${day}s</div>
                `}
            </div>
        `;
    }).join('');
}

function toggleClinicDay(day, isOpen) {
    const clinicSchedule = Storage.getClinicSchedule();
    clinicSchedule[day].isOpen = isOpen;
    Storage.updateClinicSchedule(clinicSchedule);
    Utils.showNotification(`${day} ${isOpen ? 'opened' : 'closed'}`, 'success');
    loadClinicSchedule();
    triggerDataSync();
}

function updateClinicTime(day, timeType, value) {
    const clinicSchedule = Storage.getClinicSchedule();
    clinicSchedule[day][timeType] = value;
    Storage.updateClinicSchedule(clinicSchedule);
    Utils.showNotification(`${day} hours updated`, 'success');
    loadClinicSchedule();
    triggerDataSync();
}

// Filter patients search
let patientSearchFilter = '';

function setupPatientSearch() {
    const searchInput = document.getElementById('patientSearchInput');
    if (searchInput) {
        // Remove existing event listeners
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        // Add fresh event listener
        document.getElementById('patientSearchInput').addEventListener('input', (e) => {
            patientSearchFilter = e.target.value.toLowerCase();
            loadStaffPatients();
        });
    }
}

function clearPatientFilter() {
    const searchInput = document.getElementById('patientSearchInput');
    if (searchInput) {
        searchInput.value = '';
        patientSearchFilter = '';
        loadStaffPatients();
    }
}

// Load staff patients list
function loadStaffPatients() {
    let patients = Storage.getPatients();
    const container = document.getElementById('patientsList');
    
    if (!container) {
        console.warn('Patient list container not found');
        return;
    }
    
    // Read live search query from input (use the same search input as loadPatients)
    const searchInput = document.getElementById('staffPatientSearchInput');
    const q = (searchInput?.value || staffPatientSearchFilter || '').toLowerCase().trim();
    
    // Apply search filter
    if (q) {
        patients = patients.filter(p => {
            const fullName = p.fullName?.toLowerCase() || '';
            const email = p.email?.toLowerCase() || '';
            const phone = p.phone?.toLowerCase() || '';
            const username = p.username?.toLowerCase() || '';
            const id = p.id?.toLowerCase() || '';
            return (
                fullName.includes(q) ||
                email.includes(q) ||
                phone.includes(q) ||
                username.includes(q) ||
                id.includes(q)
            );
        });
        staffPatientSearchFilter = q;
    }
    
    if (patients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">👥</div>
                <p>${q ? 'No patients found matching your search' : 'No patients found'}</p>
                ${q ? `<button onclick="clearStaffPatientFilter()" class="btn btn-primary mt-2">Clear Filter</button>` : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = patients.map(p => {
        const appointments = Storage.getAppointmentsByPatient(p.id);
        const upcomingAppts = Utils.getFutureAppointments(appointments).filter(a => a.status !== 'cancelled');
        
        return `
            <div class="patient-profile-card">
                <div class="patient-card-header">
                    <div class="patient-avatar"></div>
                    <div class="patient-header-info">
                        <h3>${p.fullName}</h3>
                        <p class="patient-id">ID: ${p.id}</p>
                    </div>
                    ${upcomingAppts.length > 0 ? `
                        <span class="patient-badge">
                            ${upcomingAppts.length} upcoming
                        </span>
                    ` : ''}
                </div>
                <div class="patient-card-body">
                    <div class="patient-info-grid">
                        <div class="patient-info-item">
                            <div class="info-content">
                                <span class="info-label">EMAIL</span>
                                <span class="info-value">${p.email || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="patient-info-item">
                            <div class="info-content">
                                <span class="info-label">PHONE</span>
                                <span class="info-value">${p.phone || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="patient-info-item">
                            <div class="info-content">
                                <span class="info-label">DATE OF BIRTH</span>
                                <span class="info-value">${p.dateOfBirth ? Utils.formatDate(p.dateOfBirth) : 'N/A'}</span>
                            </div>
                        </div>
                        <div class="patient-info-item">
                            <div class="info-content">
                                <span class="info-label">ADDRESS</span>
                                <span class="info-value">${p.address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="patient-card-actions">
                    <button onclick="viewPatientProfile('${p.id}')" class="btn btn-primary">
                        View Full Profile
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// View all appointments for a patient
function viewPatientAllAppointments(patientId) {
    const patient = Storage.getPatientById(patientId);
    if (!patient) {
        Utils.showNotification('Patient not found', 'error');
        return;
    }
    
    // Open the patient profile modal which shows all appointments
    viewPatientProfile(patientId);
    
    // Auto-scroll to medical history section after modal opens
    setTimeout(() => {
        const medicalSection = document.querySelector('#patientMedicalHistory');
        if (medicalSection) {
            medicalSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
}

// View patient profile
function viewPatientProfile(patientId) {
    const patient = Storage.getPatientById(patientId);
    if (!patient) {
        Utils.showNotification('Patient not found', 'error');
        return;
    }
    
    // Set current patient ID
    const currentPatientIdInput = document.getElementById('currentPatientId');
    if (currentPatientIdInput) {
        currentPatientIdInput.value = patientId;
    }
    
    // Update modal title
    const profileTitle = document.getElementById('patientProfileTitle');
    if (profileTitle) {
        profileTitle.textContent = `Patient Profile - ${patient.fullName}`;
    }
    
    // Populate personal information
    const fullNameInput = document.getElementById('patientFullName');
    const emailInput = document.getElementById('patientEmail');
    
    if (fullNameInput) fullNameInput.value = patient.fullName || '';
    if (emailInput) emailInput.value = patient.email || '';
    document.getElementById('patientPhone').value = patient.phone || '';
    document.getElementById('patientDOB').value = patient.dateOfBirth || '';
    document.getElementById('patientAddress').value = patient.address || '';
    
    // Load session images
    loadPatientSessionImages(patientId);
    
    // Load medical history
    loadPatientMedicalHistory(patientId);
    
    // Populate dropdowns for medical history modal
    populateMedicalHistoryDropdowns();
    
    // Show modal
    document.getElementById('patientProfileModal').classList.add('active');
}

function closePatientProfileModal() {
    document.getElementById('patientProfileModal').classList.remove('active');
}

// Update patient information
document.getElementById('patientInfoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const patientId = document.getElementById('currentPatientId').value;
    const updates = {
        fullName: document.getElementById('patientFullName').value,
        email: document.getElementById('patientEmail').value,
        phone: document.getElementById('patientPhone').value,
        dateOfBirth: document.getElementById('patientDOB').value,
        address: document.getElementById('patientAddress').value
    };
    
    const patient = Storage.getPatientById(patientId);
    Storage.updateUser(patientId, updates);
    
    // Log patient profile update activity
    if (typeof logActivity === 'function') {
        logActivity('patient', 'Patient Profile Updated', `Staff ${currentUser.fullName} updated patient profile for ${patient ? patient.fullName : 'Unknown'}: ${Object.keys(updates).join(', ')}`);
    }
    
    Utils.showNotification('Patient profile updated successfully!', 'success');
    loadStaffPatients();
    
    // Update modal title
    document.getElementById('patientProfileTitle').textContent = `Patient Profile - ${updates.fullName}`;
});

// Load patient session images
function loadPatientSessionImages(patientId) {
    const sessionImages = Storage.getSessionImagesByPatient(patientId);
    const container = document.getElementById('patientSessionImages');
    
    if (sessionImages.length === 0) {
        container.innerHTML = `
            <div class="no-data" style="padding: 2rem;">
                <p style="color: var(--text-color);">No treatment photos uploaded yet</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    sessionImages.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sessionImages.map(img => `
        <div class="session-image-card">
            <div class="session-image-thumb">
                <img src="${img.imageUrl}" alt="${img.label}" onclick="viewSessionImageFullscreen('${img.id}')">
            </div>
            <div class="session-image-info">
                <h4>${img.sessionTitle || 'Treatment Session'}</h4>
                <p><strong>Date:</strong> ${Utils.formatDate(img.date)}</p>
                <p><strong>Type:</strong> ${img.type}</p>
                <p><strong>Procedure:</strong> ${img.procedure}</p>
                <p><strong>Dentist:</strong> ${formatDentistName(img.dentist)}</p>
                ${img.label ? `<p><strong>Label:</strong> ${img.label}</p>` : ''}
                ${img.description ? `<p><strong>Notes:</strong> ${img.description}</p>` : ''}
            </div>
            <div class="session-image-actions">
                <button onclick="deleteSessionImage('${img.id}')" class="btn btn-danger btn-xs">Delete</button>
            </div>
        </div>
    `).join('');
}

// Show upload session image modal
function showUploadSessionImageModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sessionDate').value = today;
    
    // Populate procedure dropdown with services
    const services = Storage.getServices();
    const procedureSelect = document.getElementById('sessionProcedure');
    procedureSelect.innerHTML = '<option value="">Select Procedure</option>' +
        services.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    
    // Populate dentist dropdown
    const doctors = Storage.getDoctors();
    const dentistSelect = document.getElementById('sessionDentist');
    dentistSelect.innerHTML = '<option value="">Select Dentist</option>' +
        doctors.map(d => `<option value="${d.name}">${d.name} - ${d.specialty}</option>`).join('');
    
    document.getElementById('uploadSessionImageModal').classList.add('active');
}

function closeUploadSessionImageModal() {
    document.getElementById('uploadSessionImageModal').classList.remove('active');
    document.getElementById('uploadSessionImageForm').reset();
}

// Upload session image
document.getElementById('uploadSessionImageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const patientId = document.getElementById('currentPatientId').value;
    const fileInput = document.getElementById('sessionImageFile');
    const file = fileInput.files[0];
    
    if (!file) {
        Utils.showNotification('Please select an image file', 'error');
        return;
    }
    
    // Convert image to base64
    const reader = new FileReader();
    reader.onload = function(event) {
        const selectedDentist = document.getElementById('sessionDentist').value;
        const dentistName = selectedDentist ? selectedDentist.replace(/^Dr\.?\s*/i, '').trim() : '';
        
        const imageData = {
            patientId: patientId,
            sessionTitle: document.getElementById('sessionTitle').value,
            date: document.getElementById('sessionDate').value,
            procedure: document.getElementById('sessionProcedure').value,
            dentist: dentistName,
            type: document.getElementById('sessionPhotoType').value,
            label: document.getElementById('sessionPhotoLabel').value,
            description: document.getElementById('sessionDescription').value,
            imageUrl: event.target.result,
            sessionId: 'sess' + Date.now()
        };
        
        Storage.createSessionImage(imageData);
        Utils.showNotification('Session photo uploaded successfully!', 'success');
        closeUploadSessionImageModal();
        loadPatientSessionImages(patientId);
    };
    
    reader.readAsDataURL(file);
});

// View session image fullscreen
function viewSessionImageFullscreen(imageId) {
    const image = Storage.getSessionImageById(imageId);
    if (!image) return;
    
    // Create a simple fullscreen viewer
    const viewer = document.createElement('div');
    viewer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    viewer.innerHTML = `<img src="${image.imageUrl}" style="max-width: 90%; max-height: 90%; object-fit: contain;">`;
    viewer.onclick = () => document.body.removeChild(viewer);
    document.body.appendChild(viewer);
}

// Delete session image
async function deleteSessionImage(imageId) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this treatment photo?');
    if (!confirmed) {
        return;
    }
    
    const patientId = document.getElementById('currentPatientId').value;
    Storage.deleteSessionImage(imageId);
    Utils.showNotification('Session photo deleted', 'info');
    loadPatientSessionImages(patientId);
}

// Trigger data sync across all dashboards
function triggerDataSync() {
    // Dispatch a custom event that other dashboards can listen to
    window.dispatchEvent(new CustomEvent('clinicDataUpdated', {
        detail: { timestamp: Date.now() }
    }));
    
    // Also update localStorage to trigger storage event in other tabs
    localStorage.setItem('lastDataUpdate', Date.now().toString());
}

// Load patient medical history
function loadPatientMedicalHistory(patientId) {
    const appointments = Storage.getAppointmentsByPatient(patientId);
    const medicalHistory = Storage.getMedicalHistoryByPatient(patientId);
    
    // Combine appointments (completed/past) and manual medical history
    const allRecords = [];
    
    // Add appointments as medical records
    appointments.forEach(apt => {
        if (apt.status === 'completed' || (apt.status === 'confirmed' && new Date(apt.date) < new Date())) {
            const doctor = Storage.getDoctorById(apt.doctorId);
            const service = Storage.getServiceById(apt.serviceId);
            
            allRecords.push({
                id: apt.id,
                type: 'appointment',
                date: apt.date,
                time: apt.time,
                service: service ? service.name : 'N/A',
                doctor: doctor ? doctor.name : 'Unknown',
                specialty: doctor ? doctor.specialty : '',
                treatment: apt.treatment || 'Standard consultation and treatment provided',
                remarks: apt.remarks || 'No additional remarks recorded',
                status: apt.status
            });
        }
    });
    
    // Add manual medical history
    medicalHistory.forEach(record => {
        const doctor = Storage.getDoctorById(record.doctorId);
        const service = Storage.getServiceById(record.serviceId);
        
        allRecords.push({
            id: record.id,
            type: 'manual',
            date: record.date,
            time: record.time,
            service: service ? service.name : record.serviceName || 'N/A',
            doctor: doctor ? doctor.name : record.doctorName || 'Unknown',
            specialty: doctor ? doctor.specialty : '',
            treatment: record.treatment,
            remarks: record.remarks || 'No remarks',
            status: 'completed'
        });
    });
    
    // Sort by date (newest first)
    allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const container = document.getElementById('patientMedicalHistory');
    
    if (allRecords.length === 0) {
        container.innerHTML = `
            <div class="no-data" style="padding: 2rem;">
                <p style="color: var(--text-color);">No medical history records found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allRecords.map(record => `
        <div class="medical-record-card">
            <div class="medical-record-header">
                <div>
                    <h4>${record.service}</h4>
                    <p style="color: var(--text-color); font-size: 0.9rem;">
                        Dr. ${record.doctor}${record.specialty ? ' - ' + record.specialty : ''}
                    </p>
                </div>
                <div style="text-align: right;">
                    <p style="font-weight: bold;">${Utils.formatDate(record.date)}</p>
                    <p style="color: var(--text-color); font-size: 0.9rem;">${Utils.formatTime(record.time)}</p>
                </div>
            </div>
            <div class="medical-record-body">
                <div style="margin-bottom: 0.5rem;">
                    <strong>Treatment Notes:</strong>
                    <p style="margin: 0.25rem 0; color: var(--text-color);">${record.treatment}</p>
                </div>
                <div>
                    <strong>Remarks:</strong>
                    <p style="margin: 0.25rem 0; color: var(--text-color);">${record.remarks}</p>
                </div>
            </div>
            <div class="medical-record-actions">
                <button onclick="editMedicalHistoryRecord('${record.id}', '${record.type}')" class="btn btn-warning btn-xs">Edit</button>
                ${record.type === 'manual' ? `<button onclick="deleteMedicalHistoryRecord('${record.id}')" class="btn btn-danger btn-xs">Delete</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Populate medical history dropdowns
function populateMedicalHistoryDropdowns() {
    const services = Storage.getServices();
    const doctors = Storage.getDoctors();
    
    const serviceSelect = document.getElementById('medHistoryService');
    const doctorSelect = document.getElementById('medHistoryDoctor');
    
    serviceSelect.innerHTML = '<option value="">Select Service</option>' +
        services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>' +
        doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
}

// Show add medical history modal
function showAddMedicalHistoryModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('medHistoryDate').value = today;
    document.getElementById('addMedicalHistoryModal').classList.add('active');
}

function closeAddMedicalHistoryModal() {
    document.getElementById('addMedicalHistoryModal').classList.remove('active');
    document.getElementById('addMedicalHistoryForm').reset();
}

// Add medical history record
document.getElementById('addMedicalHistoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const patientId = document.getElementById('currentPatientId').value;
    const recordData = {
        patientId: patientId,
        serviceId: document.getElementById('medHistoryService').value,
        doctorId: document.getElementById('medHistoryDoctor').value,
        date: document.getElementById('medHistoryDate').value,
        time: document.getElementById('medHistoryTime').value,
        treatment: document.getElementById('medHistoryTreatment').value,
        remarks: document.getElementById('medHistoryRemarks').value
    };
    
    Storage.createMedicalHistory(recordData);
    Utils.showNotification('Medical history record added successfully!', 'success');
    closeAddMedicalHistoryModal();
    loadPatientMedicalHistory(patientId);
});

// Edit medical history record
function editMedicalHistoryRecord(recordId, recordType) {
    let record;
    let doctor, service;
    
    if (recordType === 'appointment') {
        record = Storage.getAppointmentById(recordId);
        doctor = Storage.getDoctorById(record.doctorId);
        service = Storage.getServiceById(record.serviceId);
        
        document.getElementById('editMedHistoryId').value = recordId;
        document.getElementById('editMedHistoryService').value = service ? service.name : 'N/A';
        document.getElementById('editMedHistoryDoctor').value = doctor ? doctor.name : 'Unknown';
        document.getElementById('editMedHistoryDate').value = Utils.formatDate(record.date);
        document.getElementById('editMedHistoryTime').value = Utils.formatTime(record.time);
        document.getElementById('editMedHistoryTreatment').value = record.treatment || 'Standard consultation and treatment provided';
        document.getElementById('editMedHistoryRemarks').value = record.remarks || '';
        
        // Store type for later
        document.getElementById('editMedHistoryId').setAttribute('data-type', 'appointment');
    } else {
        record = Storage.getMedicalHistoryById(recordId);
        doctor = Storage.getDoctorById(record.doctorId);
        service = Storage.getServiceById(record.serviceId);
        
        document.getElementById('editMedHistoryId').value = recordId;
        document.getElementById('editMedHistoryService').value = service ? service.name : 'N/A';
        document.getElementById('editMedHistoryDoctor').value = doctor ? doctor.name : 'Unknown';
        document.getElementById('editMedHistoryDate').value = Utils.formatDate(record.date);
        document.getElementById('editMedHistoryTime').value = Utils.formatTime(record.time);
        document.getElementById('editMedHistoryTreatment').value = record.treatment;
        document.getElementById('editMedHistoryRemarks').value = record.remarks || '';
        
        document.getElementById('editMedHistoryId').setAttribute('data-type', 'manual');
    }
    
    document.getElementById('editMedicalHistoryModal').classList.add('active');
}

function closeEditMedicalHistoryModal() {
    document.getElementById('editMedicalHistoryModal').classList.remove('active');
}

// Update medical history record
document.getElementById('editMedicalHistoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const recordId = document.getElementById('editMedHistoryId').value;
    const recordType = document.getElementById('editMedHistoryId').getAttribute('data-type');
    const patientId = document.getElementById('currentPatientId').value;
    
    const updates = {
        treatment: document.getElementById('editMedHistoryTreatment').value,
        remarks: document.getElementById('editMedHistoryRemarks').value
    };
    
    if (recordType === 'appointment') {
        Storage.updateAppointment(recordId, updates);
    } else {
        Storage.updateMedicalHistory(recordId, updates);
    }
    
    Utils.showNotification('Medical history record updated successfully!', 'success');
    closeEditMedicalHistoryModal();
    loadPatientMedicalHistory(patientId);
});

// Delete medical history record
async function deleteMedicalHistoryRecord(recordId) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this medical history record?');
    if (!confirmed) {
        return;
    }
    
    const patientId = document.getElementById('currentPatientId').value;
    Storage.deleteMedicalHistory(recordId);
    Utils.showNotification('Medical history record deleted', 'info');
    loadPatientMedicalHistory(patientId);
}

// Toggle action dropdown
function toggleActionDropdown(event, appointmentId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
        // Prevent the click from reaching elements below (especially appointment-row)
        if (event.cancelBubble !== undefined) {
            event.cancelBubble = true;
        }
    }
    
    // Close all other dropdowns
    document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
        if (menu.id !== `dropdown-${appointmentId}`) {
            menu.classList.remove('active');
            // Remove active state from associated button
            const button = menu.previousElementSibling;
            if (button && button.classList.contains('action-dropdown-btn')) {
                button.classList.remove('active');
            }
        }
    });
    
    // Toggle current dropdown
    const dropdown = document.getElementById(`dropdown-${appointmentId}`);
    if (dropdown) {
        const isActive = dropdown.classList.contains('active');
        
        if (!isActive) {
            // On mobile, ensure dropdown is visible and centered
            if (window.innerWidth <= 767) {
                // Set fixed positioning for mobile
                dropdown.style.position = 'fixed';
                dropdown.style.left = '50%';
                dropdown.style.top = '50%';
                dropdown.style.transform = 'translate(-50%, -50%)';
                dropdown.style.right = 'auto';
                dropdown.style.zIndex = '10002';
                dropdown.style.pointerEvents = 'auto';
                dropdown.style.userSelect = 'none';
                dropdown.style.isolation = 'isolate';
                dropdown.style.willChange = 'transform';
                dropdown.style.display = 'block';
                dropdown.style.visibility = 'visible';
                dropdown.style.opacity = '1';
            } else {
                // Desktop: use original positioning
                dropdown.style.position = '';
                dropdown.style.left = '';
                dropdown.style.top = '';
                dropdown.style.transform = '';
                dropdown.style.right = '';
                dropdown.style.display = '';
                dropdown.style.visibility = '';
                dropdown.style.opacity = '';
                
            }
        }
        
        // Always remove old overlay if it exists (shouldn't exist anymore, but just in case)
        const overlay = document.getElementById('action-dropdown-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        dropdown.classList.toggle('active');
        
        // Update button active state
        const button = dropdown.previousElementSibling;
        if (button && button.classList.contains('action-dropdown-btn')) {
            if (dropdown.classList.contains('active')) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    }
    
    // Return false to prevent any default behavior
    return false;
}

// Close all dropdowns when clicking outside (with delay to prevent immediate closing)
let clickTimeout = null;
document.addEventListener('click', (event) => {
    // Don't close if clicking on dropdown button (it will toggle itself)
    if (event.target.closest('.action-dropdown-btn')) {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
        }
        return;
    }
    
    // Don't close if clicking inside the dropdown menu or items
    const clickedDropdownItem = event.target.closest('.action-dropdown-item');
    const clickedDropdownMenu = event.target.closest('.action-dropdown-menu');
    
        if (clickedDropdownMenu || clickedDropdownItem) {
        // If clicking on a dropdown item, let the onclick handler execute first
        // The modal opening function will handle closing the dropdown
        if (clickedDropdownItem) {
            // Close dropdown and remove backdrop after a short delay to allow onclick to execute
            setTimeout(() => {
                const activeMenus = document.querySelectorAll('.action-dropdown-menu.active');
                activeMenus.forEach(menu => {
                    menu.classList.remove('active');
                    // Remove active state from associated button
                    const button = menu.previousElementSibling;
                    if (button && button.classList.contains('action-dropdown-btn')) {
                        button.classList.remove('active');
                    }
                });
            }, 100);
            return;
        } else {
            // If clicking on menu but not an item, just prevent closing
            if (clickTimeout) {
                clearTimeout(clickTimeout);
            }
        }
        return;
    }
    
    // Clear any existing timeout
    if (clickTimeout) {
        clearTimeout(clickTimeout);
    }
    
    // Only close if clicking outside (with small delay to allow menu to open)
    clickTimeout = setTimeout(() => {
        const activeMenus = document.querySelectorAll('.action-dropdown-menu.active');
        if (activeMenus.length > 0) {
            activeMenus.forEach(menu => {
                menu.classList.remove('active');
                // Remove active state from associated button
                const button = menu.previousElementSibling;
                if (button && button.classList.contains('action-dropdown-btn')) {
                    button.classList.remove('active');
                }
            });
            // Remove overlay
            const overlay = document.getElementById('action-dropdown-overlay');
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            // Remove backdrop
        }
    }, 150); // Small delay to prevent immediate closing
}, false); // Use bubble phase

// View appointment details in modal
function viewAppointmentDetails(appointmentId) {
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    const patient = Storage.getPatientById(appointment.patientId);
    const doctor = Storage.getDoctorById(appointment.doctorId);
    // Use stored serviceName if available, otherwise look it up
    let service = null;
    let serviceName = appointment.serviceName;
    if (!serviceName && appointment.serviceId) {
        service = Storage.getServiceById(appointment.serviceId);
        serviceName = service ? service.name : 'N/A';
    } else if (serviceName && appointment.serviceId) {
        service = Storage.getServiceById(appointment.serviceId);
    }
    
    const isGuest = appointment.patientId && appointment.patientId.startsWith('guest_appointment');
    const isWalkin = appointment.patientId && appointment.patientId.startsWith('walkin_');
    
    let patientDisplayName;
    let patientAge = '';
    let patientContact = '';
    let patientEmail = '';
    
    if (isGuest) {
        const notesMatch = appointment.notes && appointment.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
        patientDisplayName = notesMatch ? notesMatch[1] : 'Guest Patient';
        
        // Extract contact information from notes
        if (appointment.notes) {
            const ageMatch = appointment.notes.match(/Age: ([^\n]+)/);
            const contactMatch = appointment.notes.match(/Contact: ([^\n]+)/);
            const emailMatch = appointment.notes.match(/Email: ([^\n]+)/);
            patientAge = ageMatch ? ageMatch[1] : '';
            patientContact = contactMatch ? contactMatch[1] : '';
            patientEmail = emailMatch ? emailMatch[1] : '';
        }
    } else if (isWalkin) {
        const notesMatch = appointment.notes && appointment.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
        patientDisplayName = notesMatch ? notesMatch[1] : 'Walk-in Patient';
        
        // Extract contact information from notes
        if (appointment.notes) {
            const ageMatch = appointment.notes.match(/Age: ([^\n]+)/);
            const contactMatch = appointment.notes.match(/Contact: ([^\n]+)/);
            const emailMatch = appointment.notes.match(/Email: ([^\n]+)/);
            patientAge = ageMatch ? ageMatch[1] : '';
            patientContact = contactMatch ? contactMatch[1] : '';
            patientEmail = emailMatch ? emailMatch[1] : '';
        }
    } else {
        patientDisplayName = patient ? patient.fullName : 'Unknown';
        patientContact = patient ? patient.phone : '';
        patientEmail = patient ? patient.email : '';
    }
    
    // Format date for display
    const appointmentDate = appointment.appointmentDate || appointment.date;
    const formattedDate = appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
    }) : '';
    
    // Populate modal content - matching the photo design
    let detailsHTML = `
        <div class="appointment-detail-card">
            <div class="detail-row">
                <span class="detail-label">PATIENT:</span>
                <span class="detail-value">${patientDisplayName}</span>
            </div>
            ${patientContact ? `
            <div class="detail-row">
                <span class="detail-label">CONTACT NUMBER:</span>
                <span class="detail-value">${patientContact}</span>
            </div>
            ` : ''}
            ${patientEmail ? `
            <div class="detail-row">
                <span class="detail-label">EMAIL:</span>
                <span class="detail-value">${patientEmail}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">SERVICE:</span>
                <span class="detail-value">${serviceName || (service ? service.name : 'N/A')}${(serviceName || service) ? ` (${ServiceDurations.minutesToTime(ServiceDurations.getDuration(service || serviceName))})` : ''}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">DOCTOR:</span>
                <span class="detail-value">${doctor ? doctor.name : 'Unknown'}</span>
            </div>
            <div class="detail-row detail-row-with-update">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
                    <span class="detail-label">DATE:</span>
                    <span class="detail-value">${formattedDate}</span>
                    <span class="detail-icon">📅</span>
                </div>
                <button onclick="updateAppointmentDateTime('${appointmentId}')" class="btn-update-datetime">
                    <input type="date" id="editAppointmentDate" value="${appointmentDate}" class="form-control date-time-input" style="display: none;">
                    Update
                </button>
            </div>
            <div class="detail-row detail-row-with-update">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
                    <span class="detail-label">TIME:</span>
                    <span class="detail-value">${Utils.formatTime(appointment.appointmentTime || appointment.time)}</span>
                    <span class="detail-icon">🕐</span>
                </div>
                <button onclick="updateAppointmentDateTime('${appointmentId}')" class="btn-update-datetime">
                    <input type="time" id="editAppointmentTime" value="${appointment.appointmentTime || appointment.time}" class="form-control date-time-input" style="display: none;">
                    Update
                </button>
            </div>
            ${appointment.paymentMethod ? `
            <div class="detail-row">
                <span class="detail-label">PAYMENT METHOD:</span>
                <span class="detail-value">${appointment.paymentMethod}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">STATUS:</span>
                <span class="badge ${Utils.getStatusBadgeClass(appointment.status)}">${appointment.status.toUpperCase()}</span>
            </div>
            ${appointment.notes ? `
            <div class="detail-row detail-row-full">
                <span class="detail-label">NOTES:</span>
                <span class="detail-value" style="white-space: pre-wrap; word-wrap: break-word;">${appointment.notes}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('appointmentDetailsContent').innerHTML = detailsHTML;
    
    // Close dropdown and overlay immediately before opening modal
    document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
        menu.classList.remove('active');
        // Remove active state from associated button
        const button = menu.previousElementSibling;
        if (button && button.classList.contains('action-dropdown-btn')) {
            button.classList.remove('active');
        }
    });
    const overlay = document.getElementById('action-dropdown-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    // Close dropdown immediately before opening modal
    const activeMenus = document.querySelectorAll('.action-dropdown-menu.active');
    activeMenus.forEach(menu => {
        menu.classList.remove('active');
        const button = menu.previousElementSibling;
        if (button && button.classList.contains('action-dropdown-btn')) {
            button.classList.remove('active');
        }
    });
    
    // Open the modal immediately with explicit display
    const modal = document.getElementById('appointmentDetailsModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

// Update appointment date/time (for staff)
function updateAppointmentDateTime(appointmentId) {
    // Show date/time inputs
    const dateInput = document.getElementById('editAppointmentDate');
    const timeInput = document.getElementById('editAppointmentTime');
    
    if (!dateInput || !timeInput) {
        Utils.showNotification('Date/time inputs not found', 'error');
        return;
    }
    
    // Toggle visibility of inputs
    const dateRow = dateInput.closest('.detail-row-with-update');
    const timeRow = timeInput.closest('.detail-row-with-update');
    
    if (dateInput.style.display === 'none') {
        // Show inputs for editing
        dateInput.style.display = 'inline-block';
        timeInput.style.display = 'inline-block';
        
        // Hide the display values
        if (dateRow) {
            const dateValue = dateRow.querySelector('.detail-value');
            if (dateValue) dateValue.style.display = 'none';
            const dateIcon = dateRow.querySelector('.detail-icon');
            if (dateIcon) dateIcon.style.display = 'none';
        }
        if (timeRow) {
            const timeValue = timeRow.querySelector('.detail-value');
            if (timeValue) timeValue.style.display = 'none';
            const timeIcon = timeRow.querySelector('.detail-icon');
            if (timeIcon) timeIcon.style.display = 'none';
        }
        
        // Change button text
        const buttons = document.querySelectorAll('.btn-update-datetime');
        buttons.forEach(btn => {
            if (btn.textContent.trim() === 'Update') {
                btn.textContent = 'Save';
            }
        });
    } else {
        // Save the changes
        const newDate = dateInput.value;
        const newTime = timeInput.value;
        
        if (!newDate || !newTime) {
            Utils.showNotification('Please provide both date and time', 'error');
            return;
        }
        
        const appointment = Storage.getAppointmentById(appointmentId);
        if (!appointment) {
            Utils.showNotification('Appointment not found', 'error');
            return;
        }
        
        // Smart scheduling: Check if the current doctor is available, or find another available doctor
        let doctorId = appointment.doctorId;
        let doctorChanged = false;
        
        if (typeof ServiceDurations !== 'undefined') {
            const service = Storage.getServiceById(appointment.serviceId);
            const serviceDuration = ServiceDurations.getDuration(service || appointment.serviceName);
            
            // Check if current doctor is available at new time
            if (!ServiceDurations.isTimeSlotAvailable(doctorId, newDate, newTime, serviceDuration, appointmentId)) {
                // Current doctor is busy, try to find another available doctor
                const newDoctorId = ServiceDurations.findAvailableDoctor(newDate, newTime, serviceDuration, appointmentId);
                
                if (newDoctorId) {
                    doctorId = newDoctorId;
                    doctorChanged = true;
                    const newDoctor = Storage.getDoctorById(newDoctorId);
                    CustomAlert.info(`The originally assigned dentist is busy at this time.\n\nThe appointment has been reassigned to ${newDoctor ? newDoctor.name : 'another available dentist'}.\n\nTime: ${Utils.formatTime(newTime)}`);
                } else {
                    CustomAlert.error(`Sorry, all dentists are busy at this time slot.\n\nThe selected service requires ${ServiceDurations.minutesToTime(serviceDuration)}.\n\nPlease select a different time.`);
                    return;
                }
            }
        }
        
        // Update appointment with new date/time and potentially new doctor
        const updateData = {
            date: newDate,
            appointmentDate: newDate,
            time: newTime,
            appointmentTime: newTime
        };
        
        if (doctorChanged) {
            updateData.doctorId = doctorId;
        }
        
        Storage.updateAppointment(appointmentId, updateData);
        
        // Log activity
        if (typeof logActivity === 'function') {
            const doctor = Storage.getDoctorById(doctorId);
            const doctorInfo = doctorChanged ? ` (reassigned to ${doctor ? doctor.name : 'another dentist'})` : '';
            logActivity('appointment', 'Appointment Updated', `Staff ${currentUser.fullName} updated appointment date/time to ${Utils.formatDate(newDate)} ${Utils.formatTime(newTime)}${doctorInfo}`);
        }
        
        Utils.showNotification('Appointment date/time updated successfully' + (doctorChanged ? ' (doctor reassigned)' : ''), 'success');
        viewAppointmentDetails(appointmentId); // Refresh view
        loadAppointments();
        if (isCalendarView) {
            renderCalendar();
        }
        triggerDataSync();
    }
}

// Update appointment notes (for staff)
function updateAppointmentNotes(appointmentId) {
    const notesTextarea = document.getElementById('appointmentDetailsNotes');
    if (!notesTextarea) return;
    
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    // Preserve guest/walk-in info in notes if present
    let notes = notesTextarea.value.trim();
    const existingNotes = appointment.notes || '';
    const guestMatch = existingNotes.match(/GUEST PATIENT\nName: [^\n]+(\n[^\n]+)*/);
    const walkinMatch = existingNotes.match(/WALK-IN PATIENT\nName: [^\n]+(\n[^\n]+)*/);
    
    if (guestMatch) {
        notes = guestMatch[0] + (notes ? '\n\n' + notes : '');
    } else if (walkinMatch) {
        notes = walkinMatch[0] + (notes ? '\n\n' + notes : '');
    }
    
    Storage.updateAppointment(appointmentId, { notes: notes });
    
    // Log activity
    if (typeof logActivity === 'function') {
        const patient = Storage.getPatientById(appointment.patientId);
        const isGuest = appointment.patientId && appointment.patientId.startsWith('guest_appointment');
        const isWalkin = appointment.patientId && appointment.patientId.startsWith('walkin_');
        let patientDisplayName;
        if (isGuest) {
            const notesMatch = appointment.notes && appointment.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
            patientDisplayName = notesMatch ? notesMatch[1] : 'Guest Patient';
        } else if (isWalkin) {
            const notesMatch = appointment.notes && appointment.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
            patientDisplayName = notesMatch ? notesMatch[1] : 'Walk-in Patient';
        } else {
            patientDisplayName = patient ? patient.fullName : 'Unknown Patient';
        }
        logActivity('appointment', 'Notes Updated', `Staff ${currentUser.fullName} updated notes for appointment of ${patientDisplayName}`);
    }
    
    Utils.showNotification('Notes updated successfully', 'success');
    triggerDataSync();
    
    // Refresh appointment list to show updated notes
    if (isCalendarView) {
        renderCalendar();
    } else {
        loadAppointmentsList();
    }
}

function closeAppointmentDetailsModal() {
    const modal = document.getElementById('appointmentDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        // Reset inline styles for all screen sizes
        modal.style.display = '';
        modal.style.opacity = '';
        modal.style.visibility = '';
        // Restore body scroll
        document.body.style.overflow = '';
        // Clear content
        const content = document.getElementById('appointmentDetailsContent');
        if (content) content.innerHTML = '';
    }
}

// Open reschedule modal
function openRescheduleModal(appointmentId) {
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    // Close any open dropdowns
    document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
        menu.classList.remove('active');
        const button = menu.previousElementSibling;
        if (button && button.classList.contains('action-dropdown-btn')) {
            button.classList.remove('active');
        }
    });
    
    const rescheduleAppointmentId = document.getElementById('rescheduleAppointmentId');
    const rescheduleDate = document.getElementById('rescheduleDate');
    const rescheduleDoctor = document.getElementById('rescheduleDoctor');
    
    if (!rescheduleAppointmentId || !rescheduleDate || !rescheduleDoctor) {
        console.warn('Reschedule form elements not found');
        return;
    }
    
    rescheduleAppointmentId.value = appointmentId;
    rescheduleDate.value = appointment.date || appointment.appointmentDate;
    rescheduleDate.min = new Date().toISOString().split('T')[0];
    
    // Populate doctor dropdown
    const doctors = Storage.getDoctors();
    rescheduleDoctor.innerHTML = '<option value="">Select Doctor</option>' +
        doctors.map(d => `<option value="${d.id}" ${d.id === appointment.doctorId ? 'selected' : ''}>${d.name}</option>`).join('');
    
    // Load available time slots
    loadRescheduleTimeSlots(appointment.doctorId || rescheduleDoctor.value, rescheduleDate.value, appointmentId);
    
    document.getElementById('rescheduleModal').classList.add('active');
}

function closeRescheduleModal() {
    const modal = document.getElementById('rescheduleModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('rescheduleForm').reset();
    }
}

// Load time slots for reschedule
function loadRescheduleTimeSlots(doctorId, date, excludeAppointmentId) {
    if (!doctorId || !date) {
        const timeSelect = document.getElementById('rescheduleTime');
        if (timeSelect) {
            timeSelect.innerHTML = '<option value="">Please select a doctor and date</option>';
        }
        return;
    }
    
    const dayOfWeek = Utils.getDayOfWeek(date);
    const timeSelect = document.getElementById('rescheduleTime');
    if (!timeSelect) return;
    
    // Check clinic opening hours
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
    
    // Get overlapping time
    const clinicStart = clinicDay.startTime;
    const clinicEnd = clinicDay.endTime;
    const doctorStart = doctorSchedule.startTime;
    const doctorEnd = doctorSchedule.endTime;
    
    const actualStart = clinicStart > doctorStart ? clinicStart : doctorStart;
    const actualEnd = clinicEnd < doctorEnd ? clinicEnd : doctorEnd;
    
    if (actualStart >= actualEnd) {
        timeSelect.innerHTML = '<option value="">No available slots</option>';
        return;
    }
    
    // Generate time slots
    const slots = Utils.generateTimeSlots(actualStart, actualEnd);
    
    // Filter out booked appointments (excluding the current one being rescheduled)
    const appointments = Storage.getAppointments();
    const bookedSlots = appointments
        .filter(apt => {
            const aptDate = apt.date || apt.appointmentDate;
            const aptTime = apt.time || apt.appointmentTime;
            return apt.id !== excludeAppointmentId &&
                   apt.doctorId === doctorId &&
                   aptDate === date &&
                   apt.status !== 'cancelled';
        })
        .map(apt => apt.time || apt.appointmentTime);
    
    const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));
    
    if (availableSlots.length === 0) {
        timeSelect.innerHTML = '<option value="">No available slots</option>';
        return;
    }
    
    timeSelect.innerHTML = '<option value="">Select time</option>' +
        availableSlots.map(slot => `<option value="${slot}">${Utils.formatTime(slot)}</option>`).join('');
}

// Handle reschedule form submission
if (document.getElementById('rescheduleForm')) {
    document.getElementById('rescheduleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const rescheduleAppointmentId = document.getElementById('rescheduleAppointmentId');
        const rescheduleDate = document.getElementById('rescheduleDate');
        const rescheduleTime = document.getElementById('rescheduleTime');
        const rescheduleDoctor = document.getElementById('rescheduleDoctor');
        
        if (!rescheduleAppointmentId || !rescheduleDate || !rescheduleTime || !rescheduleDoctor) {
            Utils.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        const appointmentId = rescheduleAppointmentId.value;
        const newDate = rescheduleDate.value;
        const newTime = rescheduleTime.value;
        const doctorId = rescheduleDoctor.value;
        
        if (!newTime || !doctorId) {
            Utils.showNotification('Please select a time slot and doctor', 'error');
            return;
        }
        
        const appointment = Storage.getAppointmentById(appointmentId);
        if (!appointment) {
            Utils.showNotification('Appointment not found', 'error');
            return;
        }
        
        // Check for conflicts
        const appointments = Storage.getAppointments();
        const conflict = appointments.find(a => {
            const aDate = a.date || a.appointmentDate;
            const aTime = a.time || a.appointmentTime;
            return a.id !== appointmentId &&
                   a.doctorId === doctorId &&
                   aDate === newDate &&
                   aTime === newTime &&
                   a.status !== 'cancelled';
        });
        
        if (conflict) {
            Utils.showNotification('This time slot is already booked for the selected dentist', 'error');
            return;
        }
        
        // Update appointment
        const updateData = {
            date: newDate,
            appointmentDate: newDate,
            time: newTime,
            appointmentTime: newTime,
            doctorId: doctorId
        };
        
        // Keep status as is (don't reset to pending for staff/admin rescheduling)
        Storage.updateAppointment(appointmentId, updateData);
        
        // Log activity
        if (typeof logActivity === 'function') {
            const patient = Storage.getPatientById(appointment.patientId);
            const doctor = Storage.getDoctorById(doctorId);
            let patientDisplayName = patient ? patient.fullName : 'Unknown';
            if (appointment.patientId && appointment.patientId.startsWith('guest_appointment')) {
                const notesMatch = appointment.notes && appointment.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
                patientDisplayName = notesMatch ? notesMatch[1] : 'Guest Patient';
            } else if (appointment.patientId && appointment.patientId.startsWith('walkin_')) {
                const notesMatch = appointment.notes && appointment.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
                patientDisplayName = notesMatch ? notesMatch[1] : 'Walk-in Patient';
            }
            logActivity('appointment', 'Appointment Rescheduled', `Staff ${currentUser.fullName} rescheduled appointment for ${patientDisplayName} to ${Utils.formatDate(newDate)} ${Utils.formatTime(newTime)}${doctor ? ' with ' + doctor.name : ''}`);
        }
        
        Utils.showNotification('Appointment rescheduled successfully!', 'success');
        closeRescheduleModal();
        loadAppointments();
        if (isCalendarView) {
            renderCalendar();
        }
        triggerDataSync();
    });
    
    // Update time slots when date or doctor changes
    const rescheduleDateElement = document.getElementById('rescheduleDate');
    const rescheduleDoctorElement = document.getElementById('rescheduleDoctor');
    
    if (rescheduleDateElement) {
        rescheduleDateElement.addEventListener('change', (e) => {
            const rescheduleAppointmentId = document.getElementById('rescheduleAppointmentId');
            const rescheduleDoctor = document.getElementById('rescheduleDoctor');
            if (rescheduleAppointmentId && rescheduleDoctor) {
                const appointmentId = rescheduleAppointmentId.value;
                const doctorId = rescheduleDoctor.value;
                if (appointmentId && doctorId) {
                    loadRescheduleTimeSlots(doctorId, e.target.value, appointmentId);
                }
            }
        });
    }
    
    if (rescheduleDoctorElement) {
        rescheduleDoctorElement.addEventListener('change', (e) => {
            const rescheduleAppointmentId = document.getElementById('rescheduleAppointmentId');
            const rescheduleDate = document.getElementById('rescheduleDate');
            if (rescheduleAppointmentId && rescheduleDate) {
                const appointmentId = rescheduleAppointmentId.value;
                const date = rescheduleDate.value;
                if (appointmentId && date) {
                    loadRescheduleTimeSlots(e.target.value, date, appointmentId);
                }
            }
        });
    }
}

// Open edit notes modal
function openEditNotesModal(appointmentId) {
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    // Close any open dropdowns
    document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
        menu.classList.remove('active');
        const button = menu.previousElementSibling;
        if (button && button.classList.contains('action-dropdown-btn')) {
            button.classList.remove('active');
        }
    });
    
    const editNotesAppointmentId = document.getElementById('editNotesAppointmentId');
    const editNotesTextarea = document.getElementById('editNotesTextarea');
    
    if (!editNotesAppointmentId || !editNotesTextarea) {
        console.warn('Edit notes form elements not found');
        return;
    }
    
    editNotesAppointmentId.value = appointmentId;
    
    // Extract notes (excluding guest/walk-in info for editing)
    let notes = appointment.notes || '';
    const guestMatch = notes.match(/GUEST PATIENT\nName: [^\n]+(\n[^\n]+)*/);
    const walkinMatch = notes.match(/WALK-IN PATIENT\nName: [^\n]+(\n[^\n]+)*/);
    
    // Remove guest/walk-in info from editable notes (we'll preserve it when saving)
    if (guestMatch) {
        notes = notes.replace(guestMatch[0], '').trim();
        if (notes.startsWith('\n\n')) notes = notes.substring(2);
    } else if (walkinMatch) {
        notes = notes.replace(walkinMatch[0], '').trim();
        if (notes.startsWith('\n\n')) notes = notes.substring(2);
    }
    
    editNotesTextarea.value = notes;
    
    document.getElementById('editNotesModal').classList.add('active');
}

function closeEditNotesModal() {
    const modal = document.getElementById('editNotesModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('editNotesForm');
        if (form) form.reset();
    }
}

// Handle edit notes form submission
if (document.getElementById('editNotesForm')) {
    document.getElementById('editNotesForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const editNotesAppointmentId = document.getElementById('editNotesAppointmentId');
        const editNotesTextarea = document.getElementById('editNotesTextarea');
        
        if (!editNotesAppointmentId || !editNotesTextarea) {
            Utils.showNotification('Form elements not found', 'error');
            return;
        }
        
        const appointmentId = editNotesAppointmentId.value;
        const appointment = Storage.getAppointmentById(appointmentId);
        
        if (!appointment) {
            Utils.showNotification('Appointment not found', 'error');
            return;
        }
        
        // Preserve guest/walk-in info in notes if present
        let notes = editNotesTextarea.value.trim();
        const existingNotes = appointment.notes || '';
        const guestMatch = existingNotes.match(/GUEST PATIENT\nName: [^\n]+(\n[^\n]+)*/);
        const walkinMatch = existingNotes.match(/WALK-IN PATIENT\nName: [^\n]+(\n[^\n]+)*/);
        
        if (guestMatch) {
            notes = guestMatch[0] + (notes ? '\n\n' + notes : '');
        } else if (walkinMatch) {
            notes = walkinMatch[0] + (notes ? '\n\n' + notes : '');
        }
        
        Storage.updateAppointment(appointmentId, { notes: notes });
        
        // Log activity
        if (typeof logActivity === 'function') {
            const patient = Storage.getPatientById(appointment.patientId);
            const isGuest = appointment.patientId && appointment.patientId.startsWith('guest_appointment');
            const isWalkin = appointment.patientId && appointment.patientId.startsWith('walkin_');
            let patientDisplayName;
            if (isGuest) {
                const notesMatch = appointment.notes && appointment.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
                patientDisplayName = notesMatch ? notesMatch[1] : 'Guest Patient';
            } else if (isWalkin) {
                const notesMatch = appointment.notes && appointment.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
                patientDisplayName = notesMatch ? notesMatch[1] : 'Walk-in Patient';
            } else {
                patientDisplayName = patient ? patient.fullName : 'Unknown Patient';
            }
            logActivity('appointment', 'Notes Updated', `Staff ${currentUser.fullName} updated notes for appointment of ${patientDisplayName}`);
        }
        
        Utils.showNotification('Notes updated successfully', 'success');
        closeEditNotesModal();
        loadAppointments();
        if (isCalendarView) {
            renderCalendar();
        }
        triggerDataSync();
    });
}

// Edit service (for staff)
async function editService(serviceId) {
    const service = Storage.getServiceById(serviceId);
    if (!service) {
        CustomAlert.error('Service not found');
        return;
    }
    
    const result = await CustomPrompt.showForm('Edit Service', [
        {
            name: 'name',
            label: 'Service Name',
            type: 'text',
            defaultValue: service.name,
            required: true
        },
        {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            rows: 3,
            defaultValue: service.description,
            required: true
        },
        {
            name: 'duration',
            label: 'Duration',
            type: 'text',
            defaultValue: service.duration,
            placeholder: 'e.g., 30 mins',
            required: true
        }
    ], {
        okText: 'Update Service',
        cancelText: 'Cancel'
    });
    
    if (!result) return;
    
    const { name: newName, description: newDescription, duration: newDuration } = result;
    if (!newName || !newDescription || !newDuration) return;
    
    const updatedPayload = {
        name: newName.trim(),
        description: newDescription.trim(),
        duration: normalizeStaffServiceDuration(newDuration),
        price: service.price || ''
    };
    
    let skipBackendRefresh = false;
    
    if (typeof API !== 'undefined' && typeof API.updateService === 'function') {
        try {
            const backendReady = await API.checkBackendAvailability();
            if (backendReady) {
                await API.updateService(serviceId, {
                    name: updatedPayload.name,
                    description: updatedPayload.description,
                    duration: updatedPayload.duration,
                    price: updatedPayload.price
                });
            }
        } catch (error) {
            if (!isStaffNetworkError(error)) {
                CustomAlert.error(error?.message || 'Failed to update service. Please try again.');
                return;
            }
            console.warn('Backend unavailable when staff attempted to update service; applying change locally.', error);
            skipBackendRefresh = true;
        }
    }
    
    Storage.updateService(serviceId, updatedPayload);
    
    if (typeof logActivity === 'function') {
        logActivity('service', 'Service Updated', `Staff ${currentUser.fullName} updated service: ${newName}`);
    }
    
    Utils.showNotification('Service updated successfully!', 'success');
    await loadServices({ skipBackend: skipBackendRefresh });
    // Refresh service dropdowns
    populateServiceFilter();
    populateDropdowns();
    triggerDataSync();
}

// Edit doctor (for staff)
async function editDoctor(doctorId) {
    const doctor = Storage.getDoctorById(doctorId);
    if (!doctor) {
        CustomAlert.error('Dentist not found');
        return;
    }
    
    // Debug: Check if doctor has profileImage
    console.log('=== EDIT DOCTOR DEBUG (STAFF) ===');
    console.log('Doctor ID:', doctorId);
    console.log('Doctor object:', JSON.stringify(doctor, null, 2));
    console.log('Doctor keys:', Object.keys(doctor));
    console.log('Doctor profileImage:', doctor.profileImage);
    console.log('Doctor profileImage type:', typeof doctor.profileImage);
    console.log('Doctor profileImage exists?', 'profileImage' in doctor);
    console.log('Doctor profileImage value (first 100 chars):', doctor.profileImage ? doctor.profileImage.substring(0, 100) : 'null/undefined');
    
    // Handle profileImage - check for various possible property names or values
    let currentImageValue = null;
    if (doctor.profileImage !== null && doctor.profileImage !== undefined) {
        // If it's a string (base64), use it
        if (typeof doctor.profileImage === 'string') {
            const trimmed = doctor.profileImage.trim();
            if (trimmed !== '' && trimmed.length > 0) {
                currentImageValue = doctor.profileImage;
                console.log('✅ Found valid profileImage, length:', currentImageValue.length);
            } else {
                console.log('⚠️ profileImage is empty string');
            }
        } else {
            console.log('⚠️ profileImage is not a string, type:', typeof doctor.profileImage);
        }
    } else {
        console.log('⚠️ profileImage is null or undefined');
    }
    
    console.log('Passing currentImageValue to form:', currentImageValue ? 'YES (length: ' + currentImageValue.length + ')' : 'NO (null)');
    console.log('=== END DEBUG ===');
    
    const result = await CustomPrompt.showForm('Edit Dentist', [
        {
            name: 'profileImage',
            label: 'Profile Image (Optional)',
            type: 'file',
            accept: 'image/*',
            currentImage: currentImageValue,
            helperText: 'Select a new image to change it, or click "Remove Image" to remove the current image'
        },
        {
            name: 'name',
            label: 'Dentist Name',
            type: 'text',
            defaultValue: doctor.name || '',
            required: true,
            placeholder: 'Enter dentist name'
        },
        {
            name: 'specialty',
            label: 'Specialty',
            type: 'select',
            defaultValue: doctor.specialty || '',
            required: true,
            options: [
                { value: 'General Dentistry', label: 'General Dentistry', selected: doctor.specialty === 'General Dentistry' },
                { value: 'Orthodontics', label: 'Orthodontics', selected: doctor.specialty === 'Orthodontics' },
                { value: 'Oral Surgery', label: 'Oral Surgery', selected: doctor.specialty === 'Oral Surgery' },
                { value: 'Prosthodontics', label: 'Prosthodontics', selected: doctor.specialty === 'Prosthodontics' },
                { value: 'Cosmetic Dentistry', label: 'Cosmetic Dentistry', selected: doctor.specialty === 'Cosmetic Dentistry' },
                { value: 'Endodontics', label: 'Endodontics', selected: doctor.specialty === 'Endodontics' },
                { value: 'Periodontics', label: 'Periodontics', selected: doctor.specialty === 'Periodontics' }
            ]
        },
        {
            name: 'available',
            label: 'Available',
            type: 'select',
            defaultValue: doctor.available !== undefined && doctor.available !== null 
                ? (doctor.available === true || doctor.available === 'true' || doctor.available === 1 ? 'true' : 'false')
                : 'true',
            required: true,
            options: [
                { value: 'true', label: 'Yes', selected: doctor.available === true || doctor.available === 'true' || doctor.available === 1 },
                { value: 'false', label: 'No', selected: doctor.available === false || doctor.available === 'false' || doctor.available === 0 }
            ]
        }
    ], {
        okText: 'Update Dentist',
        cancelText: 'Cancel'
    });
    
    if (!result) return;
    
    const { name: newName, specialty: newSpecialty, available: availableValue, profileImage: imageFile } = result;
    if (!newName || !newSpecialty || availableValue === undefined) return;
    
    // Convert string to boolean
    const isAvailable = availableValue === 'true';
    
    // Prepare update data
    const updateData = {
        name: newName,
        specialty: newSpecialty,
        available: isAvailable
    };
    
    // Handle profile image
    if (imageFile === 'REMOVE') {
        // Remove image
        updateData.profileImage = null;
        Storage.updateDoctor(doctorId, updateData);
        
        if (typeof logActivity === 'function') {
            logActivity('doctor', 'Doctor Updated', `Staff ${currentUser.fullName} updated doctor: ${newName} (image removed)`);
        }
        
        Utils.showNotification('Dentist updated successfully! Image removed.', 'success');
        loadDoctors();
        triggerDataSync();
    } else if (imageFile && imageFile instanceof File) {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = function(event) {
            updateData.profileImage = event.target.result;
            // Update doctor with image
            Storage.updateDoctor(doctorId, updateData);
            
            if (typeof logActivity === 'function') {
                logActivity('doctor', 'Doctor Updated', `Staff ${currentUser.fullName} updated doctor: ${newName}`);
            }
            
            Utils.showNotification('Dentist updated successfully!', 'success');
            loadDoctors();
            triggerDataSync();
        };
        reader.onerror = function() {
            CustomAlert.error('Error reading image file. Please try again.');
        };
        reader.readAsDataURL(imageFile);
    } else {
        // No new image selected, update without changing image
        Storage.updateDoctor(doctorId, updateData);
        
        if (typeof logActivity === 'function') {
            logActivity('doctor', 'Doctor Updated', `Staff ${currentUser.fullName} updated doctor: ${newName}`);
        }
        
        Utils.showNotification('Dentist updated successfully!', 'success');
        loadDoctors();
        triggerDataSync();
    }
}

// Toggle doctor availability (for staff)
function toggleDoctorAvailability(doctorId) {
    const doctor = Storage.getDoctorById(doctorId);
    Storage.updateDoctor(doctorId, { available: !doctor.available });
    
    if (typeof logActivity === 'function') {
        logActivity('doctor', 'Doctor Availability Updated', `Staff ${currentUser.fullName} ${!doctor.available ? 'set' : 'removed'} availability for ${doctor.name}`);
    }
    
    Utils.showNotification('Dentist availability updated', 'success');
    loadDoctors();
    triggerDataSync();
}

// Edit promo (for staff) - using modal instead of prompts
function editPromo(promoId) {
    const promo = Storage.getPromoById(promoId);
    if (!promo) {
        Utils.showNotification('Promotion not found', 'error');
        return;
    }
    
    document.getElementById('editPromoId').value = promo.id;
    document.getElementById('editPromoTitle').value = promo.title;
    document.getElementById('editPromoDescription').value = promo.description;
    document.getElementById('editPromoDiscount').value = promo.discount || '';
    document.getElementById('editPromoValidUntil').value = promo.validUntil || '';
    document.getElementById('editPromoOriginalPrice').value = promo.originalPrice || '';
    document.getElementById('editPromoPrice').value = promo.promoPrice || promo.price || '';
    
    document.getElementById('editPromoModal').classList.add('active');
}

function closeEditPromoModal() {
    document.getElementById('editPromoModal').classList.remove('active');
    document.getElementById('editPromoForm').reset();
}

// Edit Promo Form Handler
document.getElementById('editPromoForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const promoId = document.getElementById('editPromoId').value;
    const updates = {
        title: document.getElementById('editPromoTitle').value,
        description: document.getElementById('editPromoDescription').value,
        discount: document.getElementById('editPromoDiscount').value,
        validUntil: document.getElementById('editPromoValidUntil').value || null,
        originalPrice: document.getElementById('editPromoOriginalPrice').value || null,
        promoPrice: document.getElementById('editPromoPrice').value,
        price: document.getElementById('editPromoPrice').value
    };
    
    Storage.updatePromo(promoId, updates);
    
    if (typeof logActivity === 'function') {
        logActivity('promo', 'Promotion Updated', `Staff ${currentUser.fullName} updated promotion: ${updates.title}`);
    }
    
    Utils.showNotification('Promotion updated successfully!', 'success');
    closeEditPromoModal();
    loadPromos();
    triggerDataSync();
});

// Create Service Modal Functions (for staff)
function showCreateServiceModal() {
    document.getElementById('createServiceModal').classList.add('active');
}

function closeCreateServiceModal() {
    document.getElementById('createServiceModal').classList.remove('active');
    document.getElementById('createServiceForm').reset();
}

// Create Service Form Handler
document.getElementById('createServiceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const serviceNameInput = document.getElementById('serviceName');
    const serviceDescriptionInput = document.getElementById('serviceDescription');
    const serviceDurationInput = document.getElementById('serviceDuration');
    const servicePriceInput = document.getElementById('servicePrice');
    
    const serviceData = {
        name: serviceNameInput.value.trim(),
        description: serviceDescriptionInput.value.trim(),
        duration: normalizeStaffServiceDuration(serviceDurationInput.value),
        price: servicePriceInput?.value ? servicePriceInput.value.trim() : ''
    };
    
    let skipBackendRefresh = false;
    
    const hasApiToken = typeof API !== 'undefined' &&
        typeof API.getToken === 'function' &&
        !!API.getToken();
    
    if (typeof API !== 'undefined' && typeof API.createService === 'function' && hasApiToken) {
        try {
            const backendReady = await API.checkBackendAvailability();
            if (backendReady) {
                const apiResponse = await API.createService({
                    name: serviceData.name,
                    description: serviceData.description,
                    duration: serviceData.duration,
                    price: serviceData.price
                });
                
                const backendId = apiResponse?.id || apiResponse?.service_id || apiResponse?.serviceId;
                if (backendId) {
                    serviceData.id = backendId;
                }
            }
        } catch (error) {
            const errorMessage = (error?.message || '').toLowerCase();
            const missingToken = errorMessage.includes('token');
            
            if (missingToken) {
                console.info('Staff service creation skipped backend call: API token missing.', error);
                skipBackendRefresh = true;
            } else if (!isStaffNetworkError(error)) {
                CustomAlert.error(error?.message || 'Failed to add service. Please try again.');
                return;
            } else {
                console.warn('Backend unavailable when staff attempted to create service; saving locally instead.', error);
                skipBackendRefresh = true;
            }
        }
    } else if (typeof API !== 'undefined' && typeof API.createService === 'function' && !hasApiToken) {
        console.info('Staff service creation using local storage only (no API token available).');
        skipBackendRefresh = true;
    }
    
    Storage.createService(serviceData);
    
    if (typeof logActivity === 'function') {
        logActivity('service', 'Service Added', `Staff ${currentUser.fullName} added new service: ${serviceData.name}`);
    }
    
    Utils.showNotification('Service added successfully!', 'success');
    closeCreateServiceModal();
    await loadServices({ skipBackend: skipBackendRefresh });
    // Refresh service dropdowns
    populateServiceFilter();
    populateDropdowns();
    triggerDataSync();
});

// Delete Service (for staff)
async function deleteService(serviceId) {
    const service = Storage.getServiceById(serviceId);
    
    // Prevent deletion of Consultation service
    if (service && (service.id === 'srv001' || (service.name && service.name.trim().toLowerCase() === 'consultation'))) {
        CustomAlert.error('Consultation service cannot be deleted as it is a default system service.');
        return;
    }
    
    const confirmed = await Utils.confirm('Are you sure you want to delete this service?');
    if (!confirmed) {
        return;
    }
    
    let skipBackendRefresh = false;
    
    if (typeof API !== 'undefined' && typeof API.deleteService === 'function') {
        try {
            const backendReady = await API.checkBackendAvailability();
            if (backendReady) {
                await API.deleteService(serviceId);
            }
        } catch (error) {
            if (!isStaffNetworkError(error)) {
                CustomAlert.error(error?.message || 'Cannot delete this service.');
                return;
            }
            console.warn('Backend unavailable when staff attempted to delete service; removing locally instead.', error);
            skipBackendRefresh = true;
        }
    }
    
    try {
        Storage.deleteService(serviceId);
    } catch (error) {
        CustomAlert.error(error.message || 'Cannot delete this service.');
        return;
    }
    
    if (typeof logActivity === 'function') {
        logActivity('service', 'Service Deleted', `Staff ${currentUser.fullName} deleted service: ${service?.name || 'Unknown'}`);
    }
    
    Utils.showNotification('Service deleted', 'info');
    await loadServices({ skipBackend: skipBackendRefresh });
    // Refresh service dropdowns
    populateServiceFilter();
    populateDropdowns();
    triggerDataSync();
}

// Create Doctor Modal Functions (for staff)
function showCreateDoctorModal() {
    document.getElementById('createDoctorModal').classList.add('active');
}

function closeCreateDoctorModal() {
    document.getElementById('createDoctorModal').classList.remove('active');
    document.getElementById('createDoctorForm').reset();
    const preview = document.getElementById('doctorImagePreview');
    if (preview) preview.style.display = 'none';
}

// Image preview for doctor profile
document.getElementById('doctorProfileImage')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('doctorImagePreview');
    const previewImg = document.getElementById('doctorPreviewImg');
    
    if (file && preview && previewImg) {
        const reader = new FileReader();
        reader.onload = function(event) {
            previewImg.src = event.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else if (preview) {
        preview.style.display = 'none';
    }
});

// Create Doctor Form Handler
document.getElementById('createDoctorForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const doctorData = {
        name: document.getElementById('doctorName').value,
        specialty: document.getElementById('doctorSpecialty').value,
        available: document.getElementById('doctorAvailable').value === 'true'
    };
    
    // Handle profile image upload
    const imageInput = document.getElementById('doctorProfileImage');
    if (imageInput && imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            doctorData.profileImage = event.target.result;
            createDoctorWithImage(doctorData);
        };
        reader.readAsDataURL(file);
    } else {
        // No image - use default
        doctorData.profileImage = null;
        createDoctorWithImage(doctorData);
    }
});

function createDoctorWithImage(doctorData) {
    Storage.createDoctor(doctorData);
    
    if (typeof logActivity === 'function') {
        logActivity('doctor', 'Doctor Added', `Staff ${currentUser.fullName} added new doctor: ${doctorData.name} - ${doctorData.specialty}`);
    }
    
    Utils.showNotification('Dentist added successfully!', 'success');
    closeCreateDoctorModal();
    loadDoctors();
    triggerDataSync();
    loadSchedules();
}

// Delete Doctor (for staff)
async function deleteDoctor(doctorId) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this dentist? This will also remove their schedules.');
    if (!confirmed) {
        return;
    }
    
    const doctor = Storage.getDoctorById(doctorId);
    Storage.deleteDoctor(doctorId);
    
    // Delete associated schedules
    const schedules = Storage.getSchedulesByDoctor(doctorId);
    schedules.forEach(sch => Storage.deleteSchedule(sch.id));
    
    if (typeof logActivity === 'function') {
        logActivity('doctor', 'Doctor Deleted', `Staff ${currentUser.fullName} deleted doctor: ${doctor?.name || 'Unknown'}`);
    }
    
    Utils.showNotification('Dentist deleted', 'info');
    loadDoctors();
    triggerDataSync();
    loadSchedules();
}

// Create Promo Modal Functions (for staff)
function showCreatePromoModal() {
    document.getElementById('createPromoModal').classList.add('active');
}

function closeCreatePromoModal() {
    document.getElementById('createPromoModal').classList.remove('active');
    document.getElementById('createPromoForm').reset();
}

// Create Promo Form Handler
document.getElementById('createPromoForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const promoData = {
        title: document.getElementById('promoTitle').value,
        description: document.getElementById('promoDescription').value,
        discount: document.getElementById('promoDiscount').value,
        validUntil: document.getElementById('promoValidUntil').value || null,
        originalPrice: document.getElementById('promoOriginalPrice').value || null,
        promoPrice: document.getElementById('promoPrice').value,
        price: document.getElementById('promoPrice').value
    };
    
    Storage.createPromo(promoData);
    
    if (typeof logActivity === 'function') {
        logActivity('promo', 'Promotion Added', `Staff ${currentUser.fullName} added new promotion: ${promoData.title}`);
    }
    
    Utils.showNotification('Promotion added successfully!', 'success');
    closeCreatePromoModal();
    loadPromos();
    triggerDataSync();
});

// Delete Promo (for staff)
async function deletePromo(promoId) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this promotion?');
    if (!confirmed) {
        return;
    }
    
    const promo = Storage.getPromoById(promoId);
    Storage.deletePromo(promoId);
    
    if (typeof logActivity === 'function') {
        logActivity('promo', 'Promotion Deleted', `Staff ${currentUser.fullName} deleted promotion: ${promo?.title || 'Unknown'}`);
    }
    
    Utils.showNotification('Promotion deleted', 'info');
    loadPromos();
    triggerDataSync();
}

// All critical functions are already assigned to window when defined above
// No need for duplicate assignments
window.showCreateServiceModal = showCreateServiceModal;
window.closeCreateServiceModal = closeCreateServiceModal;
window.showCreateDoctorModal = showCreateDoctorModal;
window.closeCreateDoctorModal = closeCreateDoctorModal;
window.showCreatePromoModal = showCreatePromoModal;
window.closeCreatePromoModal = closeCreatePromoModal;
window.editService = editService;
window.deleteService = deleteService;
window.editDoctor = editDoctor;
window.deleteDoctor = deleteDoctor;
window.toggleDoctorAvailability = toggleDoctorAvailability;
window.editPromo = editPromo;
window.deletePromo = deletePromo;
window.updateAppointmentDateTime = updateAppointmentDateTime;
// Ensure filterAppointments and changeMonth are global
if (typeof window.filterAppointments === 'undefined') {
    window.filterAppointments = function() {
        if (typeof isCalendarView !== 'undefined' && isCalendarView) {
            if (typeof renderCalendar === 'function') renderCalendar();
        } else {
            if (typeof loadAppointmentsList === 'function') loadAppointmentsList();
        }
    };
}

if (typeof window.changeMonth === 'undefined') {
    window.changeMonth = function(direction) {
        if (typeof currentCalendarMonth === 'undefined') {
            currentCalendarMonth = new Date().getMonth();
            currentCalendarYear = new Date().getFullYear();
        }
        currentCalendarMonth += direction;
        if (currentCalendarMonth < 0) {
            currentCalendarMonth = 11;
            currentCalendarYear--;
        } else if (currentCalendarMonth > 11) {
            currentCalendarMonth = 0;
            currentCalendarYear++;
        }
        if (typeof renderCalendar === 'function') renderCalendar();
    };
}
window.toggleSidebar = toggleSidebar;
window.confirmAppointment = confirmAppointment;
window.editAppointmentStatus = editAppointmentStatus;
window.cancelAppointment = cancelAppointment;
window.changeAppointmentDentist = changeAppointmentDentist;
window.viewAppointmentDetails = viewAppointmentDetails;
window.closeAppointmentDetailsModal = closeAppointmentDetailsModal;
window.updateAppointmentNotes = updateAppointmentNotes;
window.toggleActionDropdown = toggleActionDropdown;

// Add touch event support for mobile dropdown buttons to prevent card highlighting
if (typeof document !== 'undefined') {
    // Use event delegation for dynamically created buttons
    document.addEventListener('touchstart', function(event) {
        const dropdownBtn = event.target.closest('.action-dropdown-btn');
        if (dropdownBtn && window.innerWidth <= 768) {
            // Prevent default touch behavior and card highlighting
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Get appointment ID from button's onclick attribute
            const onclickAttr = dropdownBtn.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/toggleActionDropdown\(event,\s*['"]([^'"]+)['"]\)/);
                if (match && match[1]) {
                    // Create a synthetic click event that won't bubble
                    const clickEvent = new MouseEvent('click', {
                        bubbles: false,
                        cancelable: true,
                        view: window
                    });
                    toggleActionDropdown(clickEvent, match[1]);
                }
            }
        }
    }, { passive: false, capture: true });
}

// Handle clicks on dropdown items - close dropdown after action executes
// Note: We don't stop propagation here - let the onclick handlers execute naturally
// The "close on outside click" handler will check if we're clicking inside the dropdown
window.showAddScheduleModal = showAddScheduleModal;
window.showAddScheduleModalForDoctor = showAddScheduleModalForDoctor;
window.closeAddScheduleModal = closeAddScheduleModal;
window.editSchedule = editSchedule;
window.deleteSchedule = deleteSchedule;
window.toggleClinicDay = toggleClinicDay;
window.updateClinicTime = updateClinicTime;
window.viewPatientProfile = viewPatientProfile;
window.closePatientProfileModal = closePatientProfileModal;
window.showUploadSessionImageModal = showUploadSessionImageModal;
window.closeUploadSessionImageModal = closeUploadSessionImageModal;
window.viewSessionImageFullscreen = viewSessionImageFullscreen;
window.deleteSessionImage = deleteSessionImage;
window.showAddMedicalHistoryModal = showAddMedicalHistoryModal;
window.closeAddMedicalHistoryModal = closeAddMedicalHistoryModal;
window.editMedicalHistoryRecord = editMedicalHistoryRecord;
window.deleteMedicalHistoryRecord = deleteMedicalHistoryRecord;
window.closeEditMedicalHistoryModal = closeEditMedicalHistoryModal;
window.viewPatientAllAppointments = viewPatientAllAppointments;
window.clearStaffPatientFilter = clearStaffPatientFilter;
window.closeChangeStatusModal = closeChangeStatusModal;
window.closeChangeDentistModal = closeChangeDentistModal;

// Add event listeners for closing modals on backdrop click and ESC key
document.addEventListener('DOMContentLoaded', function() {
    // Close modals when clicking on backdrop
    document.addEventListener('click', function(e) {
        // Only close if clicking directly on the modal backdrop, not on modal-content or its children
        const modal = e.target.closest('.modal');
        if (modal && e.target === modal) {
            // Clicked directly on modal backdrop, not on modal-content
            if (modal.classList.contains('active') || modal.classList.contains('show')) {
                // Find which modal it is and close it
                if (modal.id === 'changeStatusModal') {
                    closeChangeStatusModal();
                } else if (modal.id === 'changeDentistModal') {
                    closeChangeDentistModal();
                } else if (modal.id === 'appointmentDetailsModal') {
                    closeAppointmentDetailsModal();
                }
            }
        }
    });
    
    // Close modals on ESC key press
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const activeModal = document.querySelector('.modal.active, .modal.show');
            if (activeModal) {
                if (activeModal.id === 'changeStatusModal') {
                    closeChangeStatusModal();
                } else if (activeModal.id === 'changeDentistModal') {
                    closeChangeDentistModal();
                } else if (activeModal.id === 'appointmentDetailsModal') {
                    closeAppointmentDetailsModal();
                }
            }
        }
    });
});

// Header action functions
function showNotifications() {
    // Close sidebar on mobile after clicking
    if (window.innerWidth <= 767) {
        const sidebar = document.querySelector('.sidebar-nav');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    }
    // Show notification modal
    showNotificationModal();
}

function showSettings() {
    // Close sidebar on mobile after clicking
    if (window.innerWidth <= 767) {
        const sidebar = document.querySelector('.sidebar-nav');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    }
    Utils.showNotification('Settings panel coming soon', 'info');
}

function showProfileMenu() {
    // Close sidebar on mobile after clicking
    if (window.innerWidth <= 767) {
        const sidebar = document.querySelector('.sidebar-nav');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (document.body) document.body.style.overflow = '';
    }
    
    // Create profile menu dropdown
    const existingMenu = document.querySelector('.profile-menu-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const profileMenu = document.createElement('div');
    profileMenu.className = 'profile-menu-dropdown';
    
    const user = Auth.getCurrentUser();
    const fullName = user?.fullName || 'Staff User';
    const jobTitle = user?.jobTitle || getDefaultJobTitle(user?.role);
    const roleLabel = getRoleLabel(user?.role);
    const email = user?.email || 'Not set';
    
    profileMenu.innerHTML = `
        <div class="profile-menu-content">
            <div class="profile-menu-header">
                <div class="profile-picture-small" id="profilePictureSmall">
                    <img id="profilePictureSmallImg" src="" alt="Profile image" class="profile-picture-img" style="display: none;">
                    <span id="profileInitialsSmall">${getInitials(fullName)}</span>
                </div>
                <div class="profile-menu-user-info">
                    <div class="profile-menu-name" id="profileMenuName">${fullName}</div>
                    <div class="profile-menu-role" id="profileMenuTitle">${jobTitle} • ${roleLabel}</div>
                </div>
            </div>
            <div class="profile-menu-details">
                <div class="profile-menu-detail">
                    <span class="profile-detail-label">Role / Access</span>
                    <span class="profile-detail-value" id="profileMenuRoleLabel">${roleLabel}</span>
                </div>
                <div class="profile-menu-detail">
                    <span class="profile-detail-label">Email</span>
                    <span class="profile-detail-value" id="profileMenuEmail">${email}</span>
                </div>
            </div>
            <div class="profile-menu-divider"></div>
            <div class="profile-menu-items">
                <button class="profile-menu-item" onclick="showProfileMenu(); openUserProfileModal();">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Manage Profile</span>
                </button>
                <button class="profile-menu-item" onclick="showProfileMenu(); showSettings();">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
                    </svg>
                    <span>Settings</span>
                </button>
                <div class="profile-menu-divider"></div>
                <button class="profile-menu-item profile-menu-item-danger" onclick="showProfileMenu(); confirmLogout();">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    `;
    
    const profilePicture = document.getElementById('profilePicture');
    if (profilePicture) {
        const rect = profilePicture.getBoundingClientRect();
        const sidebar = document.querySelector('.sidebar-nav');
        const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
        
        profileMenu.style.position = 'fixed';
        profileMenu.style.zIndex = '10000';
        
        // Position relative to profile picture location
        if (window.innerWidth > 767 && sidebarRect) {
            // Desktop/Tablet: Position above profile picture, aligned to the right edge of sidebar
            const menuWidth = 280; // min-width from CSS
            const sidebarRight = sidebarRect.right;
            const spaceOnRight = window.innerWidth - sidebarRight;
            
            if (spaceOnRight >= menuWidth + 20) {
                // Enough space on right side of sidebar
                profileMenu.style.left = (sidebarRight + 10) + 'px';
                profileMenu.style.top = (rect.top - 10) + 'px';
                profileMenu.style.right = 'auto';
                profileMenu.style.bottom = 'auto';
            } else {
                // Not enough space, position above profile picture on left side
                profileMenu.style.right = (window.innerWidth - sidebarRight + 10) + 'px';
                profileMenu.style.top = (rect.top - 10) + 'px';
                profileMenu.style.left = 'auto';
                profileMenu.style.bottom = 'auto';
            }
        } else {
            // Mobile: Position below profile picture, aligned to right
            const menuWidth = 280;
            const spaceOnRight = window.innerWidth - rect.right;
            
            if (spaceOnRight >= menuWidth) {
                // Position to the right of profile picture
                profileMenu.style.left = (rect.right + 10) + 'px';
                profileMenu.style.top = (rect.top - 10) + 'px';
                profileMenu.style.right = 'auto';
                profileMenu.style.bottom = 'auto';
            } else {
                // Position below profile picture, aligned to right edge
                profileMenu.style.right = '20px';
                profileMenu.style.top = (rect.bottom + 8) + 'px';
                profileMenu.style.left = 'auto';
                profileMenu.style.bottom = 'auto';
            }
        }
        
        setAvatarDisplay(user?.profileImage, fullName, profileMenu.querySelector('#profilePictureSmallImg'), profileMenu.querySelector('#profileInitialsSmall'));
        
        // Ensure menu doesn't go off-screen
        setTimeout(() => {
            const menuRect = profileMenu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
                profileMenu.style.right = '20px';
                profileMenu.style.left = 'auto';
            }
            if (menuRect.bottom > window.innerHeight) {
                profileMenu.style.bottom = '20px';
                profileMenu.style.top = 'auto';
            }
            if (menuRect.top < 0) {
                profileMenu.style.top = '20px';
                profileMenu.style.bottom = 'auto';
            }
        }, 0);
        
        document.body.appendChild(profileMenu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!profileMenu.contains(e.target) && !profilePicture.contains(e.target)) {
                    profileMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }
}

// Notification System (shared with admin.js)
function showNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (!modal) {
        console.error('Notification modal not found');
        return;
    }
    
    modal.classList.add('active');
    loadNotifications();
}

function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function loadNotifications() {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return;
    
    // Determine user role for filtering
    let userId = null;
    if (currentUser.role === 'staff') {
        userId = 'staff';
    } else if (currentUser.role === 'admin') {
        userId = 'admin';
    } else {
        userId = currentUser.id;
    }
    
    const notifications = Storage.getNotifications(userId);
    const unreadCount = Storage.getUnreadNotifications(userId).length;
    
    const list = document.getElementById('notificationList');
    const empty = document.getElementById('notificationEmpty');
    const badge = document.querySelector('.notification-badge');
    
    // Update badge
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    if (notifications.length === 0) {
        if (list) list.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    if (list) list.style.display = 'block';
    if (empty) empty.style.display = 'none';
    
    if (list) {
        list.innerHTML = notifications.map(notif => {
            const date = new Date(notif.timestamp);
            const timeAgo = getTimeAgo(date);
            const typeIcon = getNotificationTypeIcon(notif.type);
            const typeColor = getNotificationTypeColor(notif.type);
            
            return `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="handleNotificationClick('${notif.id}')">
                    <div class="notification-item-icon" style="background: ${typeColor}20; color: ${typeColor};">
                        ${typeIcon}
                    </div>
                    <div class="notification-item-content">
                        <div class="notification-item-header">
                            <h4 class="notification-item-title">${escapeHtml(notif.title)}</h4>
                            ${!notif.read ? '<span class="notification-item-unread-dot"></span>' : ''}
                        </div>
                        <p class="notification-item-message">${escapeHtml(notif.message)}</p>
                        <span class="notification-item-time">${timeAgo}</span>
                    </div>
                    <button class="notification-item-delete" onclick="event.stopPropagation(); deleteNotification('${notif.id}')" title="Delete notification">
                        &times;
                    </button>
                </div>
            `;
        }).join('');
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

function getNotificationTypeIcon(type) {
    const icons = {
        'appointment': '📅',
        'system': '⚙️',
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };
    return icons[type] || '🔔';
}

function getNotificationTypeColor(type) {
    const colors = {
        'appointment': '#2196F3',
        'system': '#9E9E9E',
        'info': '#3B82F6',
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444'
    };
    return colors[type] || '#757575';
}

function handleNotificationClick(notificationId) {
    const notification = Storage.getNotifications().find(n => n.id === notificationId);
    if (!notification) return;
    
    // Mark as read
    Storage.markNotificationAsRead(notificationId);
    
    // Handle action if specified
    if (notification.action === 'view' && notification.actionData) {
        if (notification.actionData.tab) {
            switchTab(notification.actionData.tab);
        }
        if (notification.actionData.appointmentId) {
            // Could open appointment details if needed
            console.log('View appointment:', notification.actionData.appointmentId);
        }
    }
    
    // Reload notifications
    loadNotifications();
    updateNotificationBadge();
}

function deleteNotification(notificationId) {
    Storage.deleteNotification(notificationId);
    loadNotifications();
    updateNotificationBadge();
}

function markAllNotificationsAsRead() {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return;
    
    let userId = null;
    if (currentUser.role === 'staff') {
        userId = 'staff';
    } else if (currentUser.role === 'admin') {
        userId = 'admin';
    } else {
        userId = currentUser.id;
    }
    
    Storage.markAllNotificationsAsRead(userId);
    loadNotifications();
    updateNotificationBadge();
}

function clearAllNotifications() {
    CustomConfirm.show(
        'Are you sure you want to clear all notifications? This action cannot be undone.',
        'Clear All Notifications',
        {
            confirmText: 'Clear All',
            cancelText: 'Cancel',
            onConfirm: () => {
                const currentUser = Auth.getCurrentUser();
                if (!currentUser) return;
                
                let userId = null;
                if (currentUser.role === 'staff') {
                    userId = 'staff';
                } else if (currentUser.role === 'admin') {
                    userId = 'admin';
                } else {
                    userId = currentUser.id;
                }
                
                Storage.clearNotifications(userId);
                loadNotifications();
                updateNotificationBadge();
            }
        }
    );
}

function updateNotificationBadge() {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return;
    
    let userId = null;
    if (currentUser.role === 'staff') {
        userId = 'staff';
    } else if (currentUser.role === 'admin') {
        userId = 'admin';
    } else {
        userId = currentUser.id;
    }
    
    const unreadCount = Storage.getUnreadNotifications(userId).length;
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Listen for new notifications
window.addEventListener('notificationAdded', () => {
    updateNotificationBadge();
    // If notification modal is open, reload it
    const modal = document.getElementById('notificationModal');
    if (modal && modal.classList.contains('active')) {
        loadNotifications();
    }
});

// Update badge on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();
    
    // Update badge periodically
    setInterval(updateNotificationBadge, 30000); // Every 30 seconds
});

// Make functions globally accessible
window.showNotifications = showNotifications;
window.showSettings = showSettings;
window.showProfileMenu = showProfileMenu;
window.openUserProfileModal = openUserProfileModal;
window.closeUserProfileModal = closeUserProfileModal;
window.showNotificationModal = showNotificationModal;
window.closeNotificationModal = closeNotificationModal;
window.handleNotificationClick = handleNotificationClick;
window.deleteNotification = deleteNotification;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.clearAllNotifications = clearAllNotifications;

function initProfilePicture() {
    refreshUserProfileUI();
}

// Scroll to Top Functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button based on scroll position
window.addEventListener('scroll', function() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    }
});

window.closeEditScheduleModal = closeEditScheduleModal;
window.closeEditPromoModal = closeEditPromoModal;

