// Admin dashboard functionality

let currentUser = null;
let profileImageDraft = null;
let profileModalBackdropHandler = null;
let profileModalEscapeHandler = null;
let calendarDayOverlay = null;
let calendarDayOverlayEscHandler = null;

const PROFILE_IMAGE_MAX_DIMENSION = 256;
const PROFILE_IMAGE_MAX_BYTES = 180 * 1024; // approx 180 KB

function getRoleLabel(role) {
    if (!role) return 'Admin';
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
    if (!role) return 'System Administrator';
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
    if (!name) return 'SA';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return 'SA';
    }
    const initials = parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
    return initials || 'SA';
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
    actions.className = 'calendar-day-overlay-actions single-action';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'calendar-day-overlay-action-btn secondary';
    backBtn.textContent = 'Go Back';
    backBtn.addEventListener('click', closeCalendarDayOverlay);

    actions.appendChild(backBtn);

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

    const fullName = activeUser.fullName || 'System Administrator';
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
    const displayName = fullName || document.getElementById('profileFullNameInput')?.value || currentUser?.fullName || 'System Administrator';
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
    if (window.innerWidth <= 768) {
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

// Password toggle function for re-authentication modal
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
        button.title = 'Hide password';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
        button.title = 'Show password';
    }
}

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

// Make toggleSidebar globally accessible (define before DOMContentLoaded)
if (typeof window !== 'undefined') {
    window.toggleSidebar = toggleSidebar;
}

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
        overlay.addEventListener('click', (e) => {
            // Only close if clicking directly on the overlay, not on sidebar content
            if (window.innerWidth <= 767 && e.target === overlay) {
                toggleSidebar();
            }
        });
    }
    
    // Prevent sidebar clicks from bubbling to overlay
    const sidebar = document.querySelector('.sidebar-nav');
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            // Stop propagation to prevent overlay from closing sidebar
            e.stopPropagation();
        });
    }
    
    // Ensure fixed hamburger is visible on mobile when sidebar is closed
    const fixedHamburger = document.querySelector('.mobile-hamburger-fixed');
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
                const fixedHamburger = document.querySelector('.mobile-hamburger-fixed');
                if (sidebar) {
                    sidebar.classList.remove('active');
                    sidebar.classList.remove('collapsed'); // Remove collapsed class on mobile
                }
                if (overlay) overlay.classList.remove('active');
                if (document.body) document.body.style.overflow = '';
                // Ensure fixed hamburger is visible on mobile when sidebar is closed
                if (fixedHamburger) {
                    fixedHamburger.style.display = 'flex';
                }
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Require admin authentication
    if (!Auth.requireAuth(['admin'])) {
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
    loadDashboard();
    // Don't load staff on dashboard - only load when staff tab is accessed
    // loadStaff();
    loadDoctors();
    loadServices();
    loadSchedules();
    loadAppointments();
    // Don't load audit log on page load - only when navigating to audit tab
    // loadAuditLog();
    
    // Setup tabs
    setupTabs();
    
    // Set dashboard as default active tab
    const dashboardBtn = document.querySelector('[data-tab="dashboard"]');
    if (dashboardBtn) {
        dashboardBtn.classList.add('active');
    }
    
    // Initialize calendar view if appointments tab is active
    if (document.getElementById('appointmentsTab')?.classList.contains('active')) {
        renderCalendar();
        populateServiceFilter();
    }
    
    // Setup patient search
    setupAdminPatientSearch();
    
    // Auto-refresh disabled - data only refreshes manually or on storage events
    // setInterval(() => {
    //     loadStatistics();
    //     loadAppointments();
    // }, 5000);
    
    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'clinicData' || e.key === 'lastDataUpdate') {
            loadStatistics();
            loadStaff();
            loadDoctors();
            loadServices();
            loadSchedules();
            loadAppointments();
            loadPatients();
            loadPromos();
        }
    });
    
    // Listen for custom data update events (same-tab sync)
    window.addEventListener('clinicDataUpdated', () => {
        loadStatistics();
        loadAppointments();
        loadPatients();
        // Refresh service dropdowns when services change
        populateServiceFilter();
    });
});

// Setup tabs
function setupTabs() {
    console.log('Setting up tabs...');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('Found tab buttons:', tabButtons.length);
    console.log('Found tab contents:', tabContents.length);
    
    if (tabButtons.length === 0) {
        console.error('No tab buttons found! Check HTML structure.');
        return;
    }
    
    tabButtons.forEach((btn, index) => {
        console.log(`Setting up tab ${index}:`, btn.dataset.tab);
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling that might trigger sidebar expansion
            console.log('Tab clicked:', btn.dataset.tab);
            
            const sidebar = document.querySelector('.sidebar-nav');
            const overlay = document.querySelector('.sidebar-overlay');
            
            // Handle mobile: Close sidebar after selection (like staff dashboard)
            if (window.innerWidth <= 767) {
                if (sidebar) sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                if (document.body) document.body.style.overflow = '';
            } else {
                // Desktop: Ensure sidebar stays collapsed if it was collapsed
                if (sidebar && sidebar.classList.contains('collapsed')) {
                    sidebar.classList.add('collapsed');
                }
            }
            
            // Remove active class from all
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked
            btn.classList.add('active');
            const tabId = btn.dataset.tab + 'Tab';
            const tabElement = document.getElementById(tabId);
            
            console.log('Looking for tab element:', tabId);
            
            if (tabElement) {
                tabElement.classList.add('active');
                console.log('Tab element activated:', tabId);
                
                // Reload data when switching tabs
                const tabName = btn.dataset.tab;
                console.log('Loading data for:', tabName);
                
                switch(tabName) {
                    case 'dashboard':
                        loadDashboard();
                        break;
                    case 'reports':
                        loadReports();
                        break;
                    case 'staff':
                        loadStaff();
                        break;
                    case 'doctors':
                        loadDoctors();
                        break;
                    case 'services':
                        loadServices();
                        break;
                    case 'schedules':
                        loadSchedules();
                        break;
                    case 'appointments':
                        loadAppointments();
                        // Initialize calendar view
                        if (isCalendarView) {
                            renderCalendar();
                        } else {
                            loadAppointmentsList();
                        }
                        // Populate service filter
                        populateServiceFilter();
                        break;
                    case 'patients':
                        loadPatients();
                        // Re-setup search in case tab wasn't loaded initially
                        setupAdminPatientSearch();
                        break;
                    case 'promos':
                        loadPromos();
                        break;
                    case 'audit':
                        // Check and export old logs before showing audit log
                        checkAndExportOldAuditLogs();
                        // Require password authentication before viewing audit log
                        // Reset authentication state when navigating to audit tab
                        auditLogAuthenticated = false;
                        showAuditLogAuthModal();
                        break;
                    default:
                        // Reset authentication when navigating away from audit tab
                        if (auditLogAuthenticated && tabName !== 'audit') {
                            auditLogAuthenticated = false;
                        }
                        if (tabName !== 'audit') {
                            console.warn('Unknown tab:', tabName);
                        }
                        break;
                }
            } else {
                console.error('Tab element not found:', tabId);
            }
        });
    });
    
    console.log('Tab setup complete!');
}

// Dashboard chart instances
let dashboardTrendsChartInstance = null;
let dashboardStatusChartInstance = null;

// Load dashboard
function loadDashboard() {
    const appointments = Storage.getAppointments();
    const patients = Storage.getPatients();
    
    // Calculate metrics
    const totalAppointments = appointments.length;
    const patientAppointmentCount = {};
    appointments.forEach(apt => {
        if (!patientAppointmentCount[apt.patientId]) {
            patientAppointmentCount[apt.patientId] = 0;
        }
        patientAppointmentCount[apt.patientId]++;
    });
    const newPatients = Object.keys(patientAppointmentCount).filter(id => patientAppointmentCount[id] === 1).length;
    
    const upcoming = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate + ' ' + apt.appointmentTime);
        return aptDate >= new Date() && (apt.status === 'confirmed' || apt.status === 'pending');
    }).sort((a, b) => {
        const dateA = new Date(a.appointmentDate + ' ' + a.appointmentTime);
        const dateB = new Date(b.appointmentDate + ' ' + b.appointmentTime);
        return dateA - dateB;
    }).slice(0, 5);
    
    // Update metric cards
    const totalEl = document.getElementById('dashboardTotalAppointments');
    const newEl = document.getElementById('dashboardNewPatients');
    const upcomingEl = document.getElementById('dashboardUpcoming');
    
    if (totalEl) totalEl.textContent = totalAppointments;
    if (newEl) newEl.textContent = newPatients;
    if (upcomingEl) upcomingEl.textContent = upcoming.length;
    
    // Load trends chart (last 7 days)
    const days = [];
    const dayData = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
        dayData.push(appointments.filter(apt => apt.appointmentDate === dateStr).length);
    }
    
    renderDashboardTrendsChart(days, dayData);
    
    // Load status chart
    const statusCounts = {
        'completed': appointments.filter(a => a.status === 'completed').length,
        'confirmed': appointments.filter(a => a.status === 'confirmed').length,
        'pending': appointments.filter(a => a.status === 'pending').length,
        'cancelled': appointments.filter(a => a.status === 'cancelled').length
    };
    
    renderDashboardStatusChart(statusCounts);
    
    // Load upcoming appointments list
    renderUpcomingAppointments(upcoming, patients);
}

function renderDashboardTrendsChart(labels, data) {
    const ctx = document.getElementById('dashboardTrendsChart');
    if (!ctx) return;
    
    if (dashboardTrendsChartInstance) {
        dashboardTrendsChartInstance.destroy();
    }
    
    const maxValue = Math.max(...data);
    const hasData = maxValue > 0;
    
    dashboardTrendsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Appointments',
                data: data,
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: hasData ? 5 : 0,
                pointHoverRadius: 7,
                pointBackgroundColor: '#D4AF37',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#FFD700',
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    titleColor: '#FFD700',
                    bodyColor: '#FFFFFF',
                    borderColor: '#D4AF37',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Appointments: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: hasData ? 1 : 1,
                        precision: 0,
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    min: 0,
                    max: hasData ? undefined : 5 // Show up to 5 if all data is 0
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // Force chart resize after a short delay to ensure proper rendering
    setTimeout(() => {
        if (dashboardTrendsChartInstance) {
            dashboardTrendsChartInstance.resize();
        }
    }, 100);
}

function renderDashboardStatusChart(statusCounts) {
    const ctx = document.getElementById('dashboardStatusChart');
    if (!ctx) return;
    
    if (dashboardStatusChartInstance) {
        dashboardStatusChartInstance.destroy();
    }
    
    const colors = {
        'completed': '#10B981',
        'confirmed': '#3B82F6',
        'pending': '#F59E0B',
        'cancelled': '#EF4444'
    };
    
    const total = Object.values(statusCounts).reduce((sum, val) => sum + val, 0);
    
    // If no data, show empty state message
    if (total === 0) {
        const container = ctx.parentElement;
        if (container) {
            container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">No appointment data available</div>';
        }
        return;
    }
    
    dashboardStatusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: Object.keys(statusCounts).map(s => colors[s] || '#CBD5E1'),
                borderWidth: 2,
                borderColor: '#1a1a1a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function renderUpcomingAppointments(upcoming, patients) {
    const container = document.getElementById('upcomingAppointmentsList');
    if (!container) return;
    
    if (upcoming.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No upcoming appointments</p>';
        return;
    }
    
    container.innerHTML = upcoming.map(apt => {
        const patient = patients.find(p => p.id === apt.patientId);
        const date = new Date(apt.appointmentDate);
        const time = apt.appointmentTime || 'N/A';
        
        return `
            <div class="upcoming-item">
                <div class="upcoming-item-header">
                    <div class="upcoming-item-name">${patient ? patient.fullName : 'Unknown Patient'}</div>
                    <div class="upcoming-item-time">${time}</div>
                </div>
                <div class="upcoming-item-details">
                    <span>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span style="color: var(--gold-primary); font-weight: 600;">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Load statistics
function loadStatistics() {
    const appointments = Storage.getAppointments();
    const patients = Storage.getPatients();
    const doctors = Storage.getDoctors();
    const services = Storage.getServices();
    
    const totalAppointmentsEl = document.getElementById('totalAppointments');
    const totalPatientsEl = document.getElementById('totalPatients');
    const totalDoctorsEl = document.getElementById('totalDoctors');
    const totalServicesEl = document.getElementById('totalServices');
    
    if (totalAppointmentsEl) totalAppointmentsEl.textContent = appointments.length;
    if (totalPatientsEl) totalPatientsEl.textContent = patients.length;
    if (totalDoctorsEl) totalDoctorsEl.textContent = doctors.length;
    if (totalServicesEl) totalServicesEl.textContent = services.length;
    
    // Load dashboard if it exists
    if (document.getElementById('dashboardTab')?.classList.contains('active')) {
        loadDashboard();
    }
    
    // Load reports data
    loadReports();
}

// Chart rendering helpers (Recharts)
const rechartsRoots = {};
const rechartsRetryState = {};
const RECHARTS_RETRY_DELAY = 400;
const RECHARTS_MAX_RETRIES = 15;
const RECHARTS_THEME = {
    gold: '#D4AF37',
    goldLight: '#F2D97B',
    goldLighter: 'rgba(212, 175, 55, 0.18)',
    goldDark: '#A47E1B',
    midnight: '#0F0F0F',
    graphite: '#1A1A1A',
    slate: 'rgba(26, 26, 26, 0.55)',
    grid: 'rgba(26, 26, 26, 0.08)',
    tooltipBg: 'rgba(15, 15, 15, 0.94)'
};
const RECHARTS_TOOLTIP_STYLE = {
    backgroundColor: RECHARTS_THEME.tooltipBg,
    border: `1px solid ${RECHARTS_THEME.gold}`,
    borderRadius: 14,
    color: '#FFFFFF',
    padding: 14,
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.35)'
};
const RECHARTS_TICK_STYLE = {
    fontSize: 11,
    fontWeight: 500,
    fill: RECHARTS_THEME.slate,
    letterSpacing: 0.2
};

function renderWithRecharts(containerId, renderFn, fallbackMessage = 'No data available') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const ReactGlobal = window.React;
    const ReactDOMGlobal = window.ReactDOM;
    const RechartsGlobal = window.Recharts;
    const ReactIsGlobal = window.ReactIs;
    const libsReady = !!(ReactGlobal && ReactDOMGlobal && ReactIsGlobal && RechartsGlobal);

    if (!libsReady) {
        const retryState = rechartsRetryState[containerId] || { attempts: 0, warned: false, timeout: null };

        if (!retryState.warned) {
            console.warn(
                `Recharts dependencies are not available yet (container: ${containerId}). ` +
                `Will retry up to ${RECHARTS_MAX_RETRIES} times.`
            );
            retryState.warned = true;
        }

        if (retryState.attempts >= RECHARTS_MAX_RETRIES) {
            container.innerHTML = '<div class="chart-empty-state">Analytics libraries failed to load.</div>';
            rechartsRetryState[containerId] = retryState;
            return;
        }

        retryState.attempts += 1;
        clearTimeout(retryState.timeout);
        retryState.timeout = setTimeout(() => {
            renderWithRecharts(containerId, renderFn, fallbackMessage);
        }, RECHARTS_RETRY_DELAY);

        rechartsRetryState[containerId] = retryState;
        container.innerHTML = '<div class="chart-empty-state">Loading analytics libraries…</div>';
        return;
    }

    const retryState = rechartsRetryState[containerId];
    if (retryState?.timeout) {
        clearTimeout(retryState.timeout);
    }
    if (retryState) {
        delete rechartsRetryState[containerId];
    }

    if (!rechartsRoots[containerId]) {
        if (typeof ReactDOMGlobal.createRoot === 'function') {
            rechartsRoots[containerId] = ReactDOMGlobal.createRoot(container);
        } else if (typeof ReactDOMGlobal.render === 'function') {
            rechartsRoots[containerId] = {
                render: (element) => ReactDOMGlobal.render(element, container)
            };
        } else {
            console.warn('ReactDOM does not expose a renderer for container:', containerId);
            return;
        }
    }

    const root = rechartsRoots[containerId];
    const element = renderFn(ReactGlobal, RechartsGlobal, fallbackMessage);
    if (element) {
        root.render(element);
    } else if (fallbackMessage) {
        root.render(ReactGlobal.createElement('div', {
            className: 'chart-empty-state'
        }, fallbackMessage));
    }
}

let currentAppointmentsPeriod = 'day';

function loadReports() {
    const appointments = Storage.getAppointments();
    const patients = Storage.getPatients();
    const services = Storage.getServices();
    const timeRange = document.getElementById('timeRangeFilter')?.value || 'all';
    
    // Filter appointments by time range
    const filteredAppointments = filterAppointmentsByTimeRange(appointments, timeRange);
    
    // Overview Dashboard
    loadOverviewDashboard(filteredAppointments, patients);
    
    // Appointment Analytics
    loadAppointmentAnalytics(filteredAppointments, services);
    
    // Patient Reports
    loadPatientReports(filteredAppointments, patients);
    
    // Service Reports
    loadServiceReports(filteredAppointments, services);
}

function filterAppointmentsByTimeRange(appointments, range) {
    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    
    switch(range) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            return appointments;
    }
    
    return appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate + ' ' + apt.appointmentTime);
        return aptDate >= startDate;
    });
}

function loadOverviewDashboard(appointments, patients) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(today.getDate() - today.getDay());
    thisWeek.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Today's appointments
    const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
    });
    
    // This week's appointments
    const weekAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= thisWeek;
    });
    
    // This month's appointments
    const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= thisMonth;
    });
    
    // New vs returning patients
    const patientAppointmentCount = {};
    appointments.forEach(apt => {
        if (!patientAppointmentCount[apt.patientId]) {
            patientAppointmentCount[apt.patientId] = 0;
        }
        patientAppointmentCount[apt.patientId]++;
    });
    
    const newPatients = Object.keys(patientAppointmentCount).filter(id => patientAppointmentCount[id] === 1).length;
    const returningPatients = Object.keys(patientAppointmentCount).filter(id => patientAppointmentCount[id] > 1).length;
    
    // Upcoming appointments
    const upcoming = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate + ' ' + apt.appointmentTime);
        return aptDate >= new Date() && (apt.status === 'confirmed' || apt.status === 'pending');
    });
    
    // Canceled and no-shows
    const canceled = appointments.filter(apt => apt.status === 'cancelled').length;
    const noShow = appointments.filter(apt => apt.status === 'no-show').length;
    
    // Update UI
    document.getElementById('overviewToday').textContent = todayAppointments.length;
    document.getElementById('overviewWeek').textContent = weekAppointments.length;
    document.getElementById('overviewMonth').textContent = monthAppointments.length;
    document.getElementById('overviewNewPatients').textContent = newPatients;
    document.getElementById('overviewReturningPatients').textContent = returningPatients;
    document.getElementById('overviewUpcoming').textContent = upcoming.length;
    document.getElementById('overviewCanceled').textContent = canceled;
    document.getElementById('overviewNoShow').textContent = noShow;
}

function loadAppointmentAnalytics(appointments, services) {
    // Update appointments chart
    updateAppointmentsChart(currentAppointmentsPeriod);
    
    // Status breakdown pie chart
    const statusCounts = {
        'completed': appointments.filter(a => a.status === 'completed').length,
        'confirmed': appointments.filter(a => a.status === 'confirmed').length,
        'pending': appointments.filter(a => a.status === 'pending').length,
        'cancelled': appointments.filter(a => a.status === 'cancelled').length,
        'no-show': appointments.filter(a => a.status === 'no-show').length
    };
    
    renderStatusChart(statusCounts);
    
    // Most popular services
    const serviceCounts = {};
    appointments.forEach(apt => {
        if (apt.serviceId) {
            serviceCounts[apt.serviceId] = (serviceCounts[apt.serviceId] || 0) + 1;
        }
    });
    
    const sortedServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    renderServicesChart(sortedServices, services);
    
    // Peak booking hours & days for summary
    const hourCounts = {};
    const dayCounts = {
        'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
        'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };
    
    appointments.forEach(apt => {
        if (apt.appointmentTime) {
            const hour = parseInt(apt.appointmentTime.split(':')[0]);
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
        
        if (apt.appointmentDate) {
            const date = new Date(apt.appointmentDate);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            if (dayCounts[dayName] !== undefined) {
                dayCounts[dayName]++;
            }
        }
    });
    
    // Average duration
    let totalDuration = 0;
    let count = 0;
    appointments.forEach(apt => {
        if (apt.serviceId) {
            const service = services.find(s => s.id === apt.serviceId);
            if (service && service.duration) {
                totalDuration += parseInt(service.duration) || 30;
                count++;
            }
        }
    });
    
    const avgDuration = count > 0 ? Math.round(totalDuration / count) : 0;
    const summaryAvgDurationEl = document.getElementById('insightAvgDuration');
    if (summaryAvgDurationEl) {
        summaryAvgDurationEl.textContent = count > 0 ? `${avgDuration} min` : '—';
    }

    const topDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const summaryTopDayEl = document.getElementById('insightTopDay');
    if (summaryTopDayEl) {
        if (topDayEntry && topDayEntry[1] > 0) {
            summaryTopDayEl.textContent = `${topDayEntry[0]} (${topDayEntry[1]})`;
        } else {
            summaryTopDayEl.textContent = '—';
        }
    }

    const topHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const summaryTopHourEl = document.getElementById('insightTopHour');
    if (summaryTopHourEl) {
        if (topHourEntry && topHourEntry[1] > 0) {
            const hourNumber = parseInt(topHourEntry[0], 10);
            const hour12 = hourNumber === 0 ? 12 : hourNumber > 12 ? hourNumber - 12 : hourNumber;
            const ampm = hourNumber < 12 ? 'AM' : 'PM';
            summaryTopHourEl.textContent = `${hour12}:00 ${ampm} (${topHourEntry[1]})`;
        } else {
            summaryTopHourEl.textContent = '—';
        }
    }
}

// Make updateAppointmentsChart globally accessible
window.updateAppointmentsChart = function(period) {
    currentAppointmentsPeriod = period;
    const appointments = Storage.getAppointments();
    const timeRange = document.getElementById('timeRangeFilter')?.value || 'all';
    const filteredAppointments = filterAppointmentsByTimeRange(appointments, timeRange);
    
    // Update button states
    document.querySelectorAll('.chart-controls .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });
    
    let labels = [];
    let data = [];
    
    if (period === 'day') {
        // Last 30 days
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            days.push(date.toISOString().split('T')[0]);
        }
        
        labels = days.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        data = days.map(day => {
            return filteredAppointments.filter(apt => {
                if (!apt.appointmentDate) return false;
                // Normalize appointment date to YYYY-MM-DD format
                const aptDateStr = apt.appointmentDate.includes('T') 
                    ? apt.appointmentDate.split('T')[0] 
                    : apt.appointmentDate.split(' ')[0];
                return aptDateStr === day;
            }).length;
        });
    } else if (period === 'week') {
        // Last 12 weeks
        const weeks = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            date.setHours(0, 0, 0, 0);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            weekStart.setHours(0, 0, 0, 0);
            weeks.push({
                start: weekStart,
                startStr: weekStart.toISOString().split('T')[0]
            });
        }
        
        labels = weeks.map(w => {
            return `Week ${w.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        });
        
        data = weeks.map(week => {
            const weekEnd = new Date(week.start);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            return filteredAppointments.filter(apt => {
                if (!apt.appointmentDate) return false;
                // Normalize appointment date
                const aptDateStr = apt.appointmentDate.includes('T') 
                    ? apt.appointmentDate.split('T')[0] 
                    : apt.appointmentDate.split(' ')[0];
                const aptDate = new Date(aptDateStr);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate >= week.start && aptDate <= weekEnd;
            }).length;
        });
    } else if (period === 'month') {
        // Last 12 months
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        }
        
        labels = months.map(m => {
            const [year, month] = m.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        
        data = months.map(month => {
            return filteredAppointments.filter(apt => {
                if (!apt.appointmentDate) return false;
                // Normalize appointment date to get YYYY-MM format
                const aptDateStr = apt.appointmentDate.includes('T') 
                    ? apt.appointmentDate.split('T')[0] 
                    : apt.appointmentDate.split(' ')[0];
                const aptMonth = aptDateStr.substring(0, 7);
                return aptMonth === month;
            }).length;
        });
    }
    
    renderAppointmentsChart(labels, data);
};

window.loadReports = loadReports;

function renderAppointmentsChart(labels, data) {
    const chartData = labels.map((label, index) => {
        const numericValue = Number(data[index]);
        return {
            label,
            value: Number.isFinite(numericValue) ? numericValue : 0
        };
    });
    const hasData = chartData.some(item => item.value > 0);

    renderWithRecharts('appointmentsChart', (React, Recharts) => {
        if (!hasData) {
            return React.createElement('div', {
                className: 'chart-empty-state'
            }, 'No appointment data available');
        }

        const { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } = Recharts;

        return React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(AreaChart, {
                data: chartData,
                margin: { top: 18, right: 26, left: 6, bottom: 24 }
            },
            React.createElement('defs', null,
                React.createElement('linearGradient', {
                    id: 'appointmentsAreaGradient',
                    x1: '0',
                    y1: '0',
                    x2: '0',
                    y2: '1'
                },
                    React.createElement('stop', { offset: '0%', stopColor: RECHARTS_THEME.gold, stopOpacity: 0.75 }),
                    React.createElement('stop', { offset: '65%', stopColor: RECHARTS_THEME.goldLight, stopOpacity: 0.25 }),
                    React.createElement('stop', { offset: '100%', stopColor: RECHARTS_THEME.goldLighter, stopOpacity: 0 })
                )
            ),
            React.createElement(CartesianGrid, {
                strokeDasharray: '3 3',
                stroke: RECHARTS_THEME.grid,
                vertical: false
            }),
            React.createElement(XAxis, {
                dataKey: 'label',
                interval: 0,
                angle: labels.length > 8 ? -25 : 0,
                textAnchor: labels.length > 8 ? 'end' : 'middle',
                height: labels.length > 8 ? 72 : 36,
                tick: RECHARTS_TICK_STYLE,
                axisLine: { stroke: RECHARTS_THEME.gold, strokeWidth: 1, opacity: 0.6 },
                tickLine: false
            }),
            React.createElement(YAxis, {
                allowDecimals: false,
                tick: RECHARTS_TICK_STYLE,
                domain: [0, 'auto'],
                axisLine: { stroke: RECHARTS_THEME.gold, strokeWidth: 1, opacity: 0.6 },
                tickLine: false,
                width: 40
            }),
            React.createElement(Tooltip, {
                cursor: { stroke: '#D4AF37', strokeWidth: 1 },
                contentStyle: RECHARTS_TOOLTIP_STYLE,
                labelStyle: { color: RECHARTS_THEME.goldLight, fontWeight: 600, marginBottom: 2 },
                formatter: (value) => [`${value} appointments`, 'Total']
            }),
            React.createElement(Area, {
                type: 'monotone',
                dataKey: 'value',
                stroke: RECHARTS_THEME.gold,
                strokeWidth: 3,
                fill: 'url(#appointmentsAreaGradient)',
                activeDot: { r: 7, stroke: RECHARTS_THEME.goldDark, strokeWidth: 2, fill: '#FFFFFF' },
                dot: { r: 0 }
            })));
    }, 'No appointment data available');
}

function renderStatusChart(statusCounts) {
    const colors = {
        completed: '#D4AF37',
        confirmed: '#B28500',
        pending: '#8A6E00',
        cancelled: '#3B82F6',
        'no-show': '#F97316'
    };

    const normalizedData = Object.entries(statusCounts).map(([status, value]) => {
        const numericValue = Number(value);
        return {
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: Number.isFinite(numericValue) ? numericValue : 0,
            color: colors[status] || '#CBD5E1'
        };
    }).filter(item => item.value > 0);

    const total = normalizedData.reduce((sum, item) => sum + item.value, 0);

    renderWithRecharts('statusChart', (React, Recharts) => {
        if (total <= 0 || normalizedData.length === 0) {
            return React.createElement('div', {
                className: 'chart-empty-state'
            }, 'No appointment data available');
        }

        const { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } = Recharts;
        const totalValue = total;
        const tooltipFormatter = (value, name) => {
            const numericValue = Number(value) || 0;
            const percentage = totalValue > 0 ? ((numericValue / totalValue) * 100).toFixed(1) : 0;
            return [`${numericValue} (${percentage}%)`, name];
        };

        return React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(PieChart, null,
                React.createElement(Pie, {
                    data: normalizedData,
                    dataKey: 'value',
                    nameKey: 'name',
                    cx: '50%',
                    cy: '50%',
                    innerRadius: '38%',
                    outerRadius: '80%',
                    paddingAngle: 2,
                    stroke: '#FFFFFF',
                    strokeWidth: 2
                },
                normalizedData.map((entry, index) => React.createElement(Cell, {
                    key: `${entry.name}-${index}`,
                    fill: entry.color
                }))),
                React.createElement(Tooltip, {
                    formatter: tooltipFormatter,
                    contentStyle: RECHARTS_TOOLTIP_STYLE,
                    labelStyle: { color: RECHARTS_THEME.goldLight, fontWeight: 600 }
                }),
                React.createElement(Legend, {
                    verticalAlign: 'bottom',
                    iconType: 'circle',
                    wrapperStyle: {
                        paddingTop: 10,
                        fontSize: 13,
                        color: '#1C1C1C',
                        fontWeight: 600,
                        letterSpacing: 0.01
                    }
                })
            )
        );
    }, 'No appointment data available');
}

function renderServicesChart(sortedServices, services) {
    const data = sortedServices.map(([id, count]) => {
        const service = services.find(s => s.id === id);
        return {
            id,
            name: service ? service.name : 'Unknown',
            value: Number(count) || 0
        };
    }).filter(item => item.value > 0);

    renderWithRecharts('servicesChart', (React, Recharts) => {
        if (data.length === 0) {
            return React.createElement('div', {
                className: 'chart-empty-state'
            }, 'No service data available');
        }

        const { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } = Recharts;

        return React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(BarChart, {
                data,
                layout: 'vertical',
                margin: { top: 16, right: 28, left: 140, bottom: 16 }
            },
            React.createElement('defs', null,
                React.createElement('linearGradient', {
                    id: 'servicesBarGradient',
                    x1: '0',
                    y1: '0',
                    x2: '1',
                    y2: '0'
                },
                    React.createElement('stop', { offset: '0%', stopColor: RECHARTS_THEME.gold, stopOpacity: 0.95 }),
                    React.createElement('stop', { offset: '100%', stopColor: RECHARTS_THEME.goldDark, stopOpacity: 0.9 })
                )
            ),
            React.createElement(CartesianGrid, {
                strokeDasharray: '3 3',
                stroke: RECHARTS_THEME.grid,
                horizontal: false
            }),
            React.createElement(XAxis, {
                type: 'number',
                allowDecimals: false,
                tick: RECHARTS_TICK_STYLE,
                axisLine: { stroke: RECHARTS_THEME.gold, strokeWidth: 1, opacity: 0.4 },
                tickLine: false
            }),
            React.createElement(YAxis, {
                type: 'category',
                dataKey: 'name',
                tick: Object.assign({}, RECHARTS_TICK_STYLE, { fontSize: 12 }),
                width: 180,
                axisLine: { stroke: RECHARTS_THEME.gold, strokeWidth: 1, opacity: 0.4 },
                tickLine: false
            }),
            React.createElement(Tooltip, {
                contentStyle: RECHARTS_TOOLTIP_STYLE,
                labelStyle: { color: RECHARTS_THEME.goldLight, fontWeight: 600 },
                formatter: (value) => [`${value} bookings`, 'Bookings']
            }),
            React.createElement(Bar, {
                dataKey: 'value',
                fill: 'url(#servicesBarGradient)',
                radius: [10, 10, 10, 10],
                barSize: 18,
                background: { fill: RECHARTS_THEME.goldLighter }
            })));
    }, 'No service data available');
}

function loadPatientReports(appointments, patients) {
    // New vs Returning
    const patientAppointmentCount = {};
    appointments.forEach(apt => {
        if (!patientAppointmentCount[apt.patientId]) {
            patientAppointmentCount[apt.patientId] = 0;
        }
        patientAppointmentCount[apt.patientId]++;
    });
    
    const newPatients = Object.keys(patientAppointmentCount).filter(id => patientAppointmentCount[id] === 1).length;
    const returningPatients = Object.keys(patientAppointmentCount).filter(id => patientAppointmentCount[id] > 1).length;
    
    renderPatientTypeChart(newPatients, returningPatients);
    
    // Top patients by visit count
    const patientVisitCounts = Object.entries(patientAppointmentCount)
        .map(([patientId, count]) => {
            const patient = patients.find(p => p.id === patientId);
            return {
                name: patient ? patient.fullName : 'Unknown',
                count: count
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    renderTopPatientsList(patientVisitCounts);
    
    // Patient visit trends (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    
    const monthlyVisits = months.map(month => {
        const uniquePatients = new Set();
        appointments.forEach(apt => {
            const aptMonth = apt.appointmentDate.substring(0, 7);
            if (aptMonth === month) {
                uniquePatients.add(apt.patientId);
            }
        });
        return uniquePatients.size;
    });
    
    renderPatientTrendsChart(months, monthlyVisits);
}

function renderPatientTypeChart(newPatients, returningPatients) {
    const data = [
        {
            name: 'New Patients',
            value: Number(newPatients) || 0,
            color: RECHARTS_THEME.gold
        },
        {
            name: 'Returning Patients',
            value: Number(returningPatients) || 0,
            color: RECHARTS_THEME.midnight
        }
    ].filter(item => item.value > 0);

    const total = data.reduce((sum, item) => sum + item.value, 0);

    renderWithRecharts('patientTypeChart', (React, Recharts) => {
        if (total <= 0) {
            return React.createElement('div', {
                className: 'chart-empty-state'
            }, 'No patient data available');
        }

        const { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } = Recharts;
        const totalValue = total;
        const tooltipFormatter = (value, name) => {
            const numericValue = Number(value) || 0;
            const percentage = totalValue > 0 ? ((numericValue / totalValue) * 100).toFixed(1) : 0;
            return [`${numericValue} (${percentage}%)`, name];
        };

        return React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(PieChart, null,
                React.createElement(Pie, {
                    data,
                    dataKey: 'value',
                    nameKey: 'name',
                    cx: '50%',
                    cy: '50%',
                    innerRadius: '40%',
                    outerRadius: '75%',
                    paddingAngle: 4
                },
                data.map((entry, index) => React.createElement(Cell, {
                    key: `${entry.name}-${index}`,
                    fill: entry.color
                }))),
                React.createElement(Tooltip, {
                    formatter: tooltipFormatter,
                    contentStyle: RECHARTS_TOOLTIP_STYLE,
                    labelStyle: { color: RECHARTS_THEME.goldLight, fontWeight: 600 }
                }),
                React.createElement(Legend, {
                    verticalAlign: 'bottom',
                    iconType: 'circle',
                    wrapperStyle: {
                        paddingTop: 10,
                        fontSize: 12,
                        color: RECHARTS_THEME.slate,
                        fontWeight: 500
                    }
                })
            )
        );
    }, 'No patient data available');
}

function renderTopPatientsList(patientVisitCounts) {
    const container = document.getElementById('topPatientsList');
    if (!container) return;
    
    if (patientVisitCounts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No patient data available</p>';
        return;
    }
    
    container.innerHTML = patientVisitCounts.map((patient, index) => `
        <div class="patient-item">
            <div>
                <div class="patient-item-name">${index + 1}. ${patient.name}</div>
            </div>
            <div class="patient-item-count">${patient.count} visit${patient.count !== 1 ? 's' : ''}</div>
        </div>
    `).join('');
}

function renderPatientTrendsChart(months, visits) {
    const chartData = months.map((monthKey, index) => {
        const [year, month] = monthKey.split('-');
        const label = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const numericValue = Number(visits[index]);
        return {
            label,
            value: Number.isFinite(numericValue) ? numericValue : 0
        };
    });

    const hasData = chartData.some(item => item.value > 0);

    renderWithRecharts('patientTrendsChart', (React, Recharts) => {
        if (!hasData) {
            return React.createElement('div', {
                className: 'chart-empty-state'
            }, 'No patient trend data available');
        }

        const { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Area } = Recharts;

        return React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement(LineChart, {
                data: chartData,
                margin: { top: 18, right: 26, left: 8, bottom: 18 }
            },
            React.createElement('defs', null,
                React.createElement('linearGradient', {
                    id: 'patientTrendsGradient',
                    x1: '0',
                    y1: '0',
                    x2: '0',
                    y2: '1'
                },
                    React.createElement('stop', { offset: '0%', stopColor: RECHARTS_THEME.gold, stopOpacity: 0.45 }),
                    React.createElement('stop', { offset: '100%', stopColor: RECHARTS_THEME.goldLighter, stopOpacity: 0 })
                )
            ),
            React.createElement(CartesianGrid, {
                strokeDasharray: '3 3',
                stroke: RECHARTS_THEME.grid,
                vertical: false
            }),
            React.createElement(XAxis, {
                dataKey: 'label',
                tick: RECHARTS_TICK_STYLE,
                axisLine: { stroke: RECHARTS_THEME.gold, opacity: 0.4 },
                tickLine: false
            }),
            React.createElement(YAxis, {
                allowDecimals: false,
                tick: RECHARTS_TICK_STYLE,
                domain: [0, 'auto'],
                axisLine: { stroke: RECHARTS_THEME.gold, opacity: 0.4 },
                tickLine: false
            }),
            React.createElement(Tooltip, {
                contentStyle: RECHARTS_TOOLTIP_STYLE,
                labelStyle: { color: RECHARTS_THEME.goldLight, fontWeight: 600 },
                formatter: (value) => [`${value} unique patients`, 'Patients']
            }),
            React.createElement(Area, {
                type: 'monotone',
                dataKey: 'value',
                stroke: 'transparent',
                fill: 'url(#patientTrendsGradient)'
            }),
            React.createElement(Line, {
                type: 'monotone',
                dataKey: 'value',
                stroke: RECHARTS_THEME.gold,
                strokeWidth: 3,
                dot: { r: 4, stroke: '#FFFFFF', strokeWidth: 2, fill: RECHARTS_THEME.gold },
                activeDot: { r: 6, stroke: RECHARTS_THEME.goldDark, strokeWidth: 2, fill: '#FFFFFF' }
            })));
    }, 'No patient trend data available');
}

function loadServiceReports(appointments, services) {
    // Service usage trends
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    
    const topServices = services.slice(0, 5);
    const serviceTrends = topServices.map(service => {
        return {
            name: service.name,
            data: months.map(month => {
                return appointments.filter(apt => {
                    const aptMonth = apt.appointmentDate.substring(0, 7);
                    return aptMonth === month && apt.serviceId === service.id;
                }).length;
            })
        };
    });
    
    renderServiceTrendsChart(months, serviceTrends);
    
    // Most and least requested services
    const serviceCounts = {};
    appointments.forEach(apt => {
        if (apt.serviceId) {
            serviceCounts[apt.serviceId] = (serviceCounts[apt.serviceId] || 0) + 1;
        }
    });
    
    const serviceStats = Object.entries(serviceCounts)
        .map(([id, count]) => {
            const service = services.find(s => s.id === id);
            return {
                name: service ? service.name : 'Unknown',
                count: count,
                duration: service ? (service.duration || 30) : 30
            };
        })
        .sort((a, b) => b.count - a.count);
    
    renderServiceComparison(serviceStats);
    
    // Average time per service
    renderServiceDurations(serviceStats);
}

function renderServiceTrendsChart(months, serviceTrends) {
    const labels = months.map(m => {
        const [year, month] = m.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
    });
    
    const chartData = labels.map((label, index) => {
        const point = { label };
        serviceTrends.forEach(service => {
            const numericValue = Number(service.data?.[index]);
            point[service.name] = Number.isFinite(numericValue) ? numericValue : 0;
        });
        return point;
    });

    const hasData = serviceTrends.some(service => (service.data || []).some(value => Number(value) > 0));
    const colors = [
        RECHARTS_THEME.gold,
        RECHARTS_THEME.goldLight,
        RECHARTS_THEME.goldDark,
        RECHARTS_THEME.midnight,
        '#5C5C5C',
        '#9C9C9C'
    ];

    renderWithRecharts('serviceTrendsChart', (React, Recharts) => {
        if (!hasData) {
            return React.createElement('div', {
                className: 'chart-empty-state'
            }, 'No service trend data available');
        }

        const { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } = Recharts;
        const lineSeries = serviceTrends.map((service, index) => {
            const strokeColor = colors[index % colors.length];
            return React.createElement(Line, {
                key: service.name || index,
                type: 'monotone',
                dataKey: service.name,
                stroke: strokeColor,
                strokeWidth: index === 0 ? 3 : 2,
                strokeDasharray: index === 0 ? null : '6 4',
                dot: { r: 3, stroke: '#FFFFFF', strokeWidth: 1 },
                activeDot: { r: 5, stroke: RECHARTS_THEME.gold, strokeWidth: 2, fill: '#FFFFFF' }
            });
        });
        const lineChartChildren = [
            React.createElement(CartesianGrid, {
                strokeDasharray: '3 3',
                stroke: RECHARTS_THEME.grid,
                vertical: false
            }),
            React.createElement(XAxis, {
                dataKey: 'label',
                tick: RECHARTS_TICK_STYLE,
                axisLine: { stroke: RECHARTS_THEME.gold, opacity: 0.4 },
                tickLine: false
            }),
            React.createElement(YAxis, {
                allowDecimals: false,
                tick: RECHARTS_TICK_STYLE,
                domain: [0, 'auto'],
                axisLine: { stroke: RECHARTS_THEME.gold, opacity: 0.4 },
                tickLine: false
            }),
            React.createElement(Tooltip, {
                contentStyle: RECHARTS_TOOLTIP_STYLE,
                labelStyle: { color: RECHARTS_THEME.goldLight, fontWeight: 600 },
                formatter: (value, name) => [`${value} bookings`, name]
            })
        ];
        lineSeries.forEach(series => lineChartChildren.push(series));
        lineChartChildren.push(React.createElement(Legend, {
            verticalAlign: 'bottom',
            wrapperStyle: {
                paddingTop: 10,
                fontSize: 12,
                color: RECHARTS_THEME.slate,
                fontWeight: 500
            }
        }));

        return React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
            React.createElement.apply(null, [LineChart, {
                data: chartData,
                margin: { top: 16, right: 24, left: 0, bottom: 16 }
            }].concat(lineChartChildren)));
    }, 'No service trend data available');
}

function renderServiceComparison(serviceStats) {
    const container = document.getElementById('serviceComparisonList');
    if (!container) return;
    
    if (serviceStats.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No service data available</p>';
        return;
    }
    
    const mostRequested = serviceStats.slice(0, 5);
    const leastRequested = serviceStats.slice(-5).reverse();
    
    container.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h5 style="color: var(--gold-primary); margin-bottom: 1rem; font-weight: 700; font-size: 1rem;">Most Requested</h5>
            ${mostRequested.map((service, index) => `
                <div class="service-item">
                    <div class="service-item-name">${index + 1}. ${service.name}</div>
                    <div class="service-item-count">${service.count}</div>
                </div>
            `).join('')}
        </div>
        <div>
            <h5 style="color: var(--text-secondary); margin-bottom: 1rem; font-weight: 700; font-size: 1rem;">Least Requested</h5>
            ${leastRequested.map((service, index) => `
                <div class="service-item">
                    <div class="service-item-name">${index + 1}. ${service.name}</div>
                    <div class="service-item-count">${service.count}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderServiceDurations(serviceStats) {
    const container = document.getElementById('serviceDurationList');
    if (!container) return;
    
    if (serviceStats.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No service data available</p>';
        return;
    }
    
    container.innerHTML = serviceStats.map(service => `
        <div class="service-item">
            <div class="service-item-name">${service.name}</div>
            <div>
                <span class="service-item-count">${service.count}</span>
                <span class="service-item-duration">× ${service.duration} min avg</span>
            </div>
        </div>
    `).join('');
}

// Make refreshReports globally accessible
window.refreshReports = function() {
    loadReports();
    Utils.showNotification('Reports refreshed', 'success');
};

// Load staff
function loadStaff() {
    const data = Storage.getData();
    const staff = data.users.filter(u => u.role === 'staff');
    
    const container = document.getElementById('staffList');
    
    if (staff.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">👥</div>
                <p>No staff accounts found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = staff.map(s => `
        <div class="data-card">
            <div class="data-info">
                <h3>${s.fullName}</h3>
                <div class="data-details">
                    <div class="data-detail-item">
                        <span class="data-detail-label">Username:</span>
                        <span>${s.username}</span>
                    </div>
                    <div class="data-detail-item">
                        <span class="data-detail-label">Email:</span>
                        <span>${s.email}</span>
                    </div>
                </div>
            </div>
            <div class="data-actions">
                <button onclick="deleteStaff('${s.id}')" class="btn btn-danger btn-xs">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load doctors
function loadDoctors() {
    try {
        const doctors = Storage.getDoctors();
        const container = document.getElementById('doctorsList');
        
        if (!container) {
            console.error('doctorsList container not found');
            return;
        }
        
        console.log('Loading doctors:', doctors.length);
        
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
                    <button onclick="editDoctor('${d.id}')" class="btn btn-secondary btn-xs">Edit</button>
                    <button onclick="toggleDoctorAvailability('${d.id}')" class="btn btn-warning btn-xs">
                        Toggle Availability
                    </button>
                    <button onclick="deleteDoctor('${d.id}')" class="btn btn-danger btn-xs">Delete</button>
                </div>
            </div>
        `;
        }).join('');
        console.log('Doctors loaded successfully');
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

// Service helpers (backend normalization + network detection)
function normalizeServiceDuration(value) {
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

function normalizeServiceFromApi(service) {
    if (!service) {
        return null;
    }
    
    const normalized = {
        id: service.id || service.service_id || service.serviceId || null,
        name: service.name || service.service_name || service.serviceName || 'Unnamed Service',
        description: service.description || service.details || '',
        duration: normalizeServiceDuration(
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

function isNetworkError(error) {
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

// Load services
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
                        .map(normalizeServiceFromApi)
                        .filter(Boolean);
                    
                    Storage.setServices(normalized);
                }
            }
        } catch (error) {
            console.warn('Unable to refresh services from backend. Falling back to cached data.', error);
            if (!isNetworkError(error) && typeof Utils !== 'undefined' && typeof Utils.showNotification === 'function') {
                Utils.showNotification('Unable to sync services with the server. Showing cached data instead.', 'warning');
            }
        }
    }
    
    const services = Storage.getServices();
    
    // Check if we should use grid layout
    if (container.classList.contains('services-grid')) {
        if (services.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--text-secondary); grid-column: 1 / -1;">No services found</p>';
            return;
        }
        
        container.innerHTML = services.map(service => {
            const duration = ServiceDurations.getDuration(service);
            const durationText = ServiceDurations.minutesToTime(duration);
            return `
            <div class="service-grid-card">
                <h3>${service.name}</h3>
                <p>${service.description || 'No description available'}</p>
                <div class="service-meta">
                    <div class="service-duration">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${durationText}
                    </div>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button onclick="editService('${service.id}')" class="btn btn-secondary btn-sm" style="flex: 1;">Edit</button>
                    <button onclick="deleteService('${service.id}')" class="btn btn-danger btn-sm" style="flex: 1;">Delete</button>
                </div>
            </div>
        `;
        }).join('');
        return;
    }
    
    // Fallback to original layout
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
                    <button onclick="editService('${s.id}')" class="btn btn-warning btn-xs">Edit</button>
                    <button onclick="deleteService('${s.id}')" class="btn btn-danger btn-xs">Delete</button>
                </div>
            </div>
        `;
        }).join('');
        console.log('Services loaded successfully');
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Load schedules
function loadSchedules() {
    try {
        const doctors = Storage.getDoctors();
        const container = document.getElementById('schedulesList');
        
        if (!container) {
            console.error('schedulesList container not found');
            return;
        }
        
        console.log('Loading schedules for', doctors.length, 'doctors');
        
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        container.innerHTML = doctors.map(doctor => {
            let schedules = Storage.getSchedulesByDoctor(doctor.id);
            
            // Sort schedules by day of week
            schedules = schedules.sort((a, b) => {
                const dayA = dayOrder.indexOf(a.day);
                const dayB = dayOrder.indexOf(b.day);
                return dayA - dayB;
            });
            
            return `
                <div class="schedule-group">
                    <div class="schedule-group-header">
                        <div class="schedule-doctor-name">${doctor.name} - ${doctor.specialty}</div>
                    </div>
                    <div class="schedule-items">
                        ${schedules.length > 0 ? schedules.map(sch => `
                            <div class="schedule-item">
                                <div class="schedule-day">${sch.day}</div>
                                <div class="schedule-time">${Utils.formatTime(sch.startTime)} - ${Utils.formatTime(sch.endTime)}</div>
                                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                    <button onclick="editSchedule('${sch.id}')" class="btn btn-secondary btn-xs" style="flex: 1;">Edit</button>
                                    <button onclick="deleteSchedule('${sch.id}')" class="btn btn-danger btn-xs" style="flex: 1;">Delete</button>
                                </div>
                            </div>
                        `).join('') : '<p style="color: var(--text-color);">No schedules set</p>'}
                    </div>
                </div>
            `;
        }).join('');
        console.log('Schedules loaded successfully');
    } catch (error) {
        console.error('Error loading schedules:', error);
    }
}

// Filter state for appointments
let appointmentFilter = 'all';
let appointmentFilterCounts = { all: 0, pending: 0, confirmed: 0, completed: 0, today: 0 };

// Load appointments with filtering and sorting
// Calendar state
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let isCalendarView = true;

// Toggle between calendar and list view
function toggleAppointmentView() {
    isCalendarView = !isCalendarView;
    const calendarView = document.getElementById('calendarView');
    const listView = document.getElementById('listView');
    const toggleBtn = document.getElementById('viewToggleBtn');
    const toggleText = document.getElementById('viewToggleText');
    
    if (isCalendarView) {
        calendarView.style.display = 'block';
        listView.style.display = 'none';
        if (toggleText) toggleText.textContent = 'List View';
        renderCalendar();
    } else {
        calendarView.style.display = 'none';
        listView.style.display = 'block';
        if (toggleText) toggleText.textContent = 'Calendar View';
        loadAppointmentsList();
    }
}

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

// Helper function to get service color (admin)
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

// Helper function to format time (admin)
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
    const statusFilter = document.getElementById('appointmentStatusFilter')?.value || 'all';
    
    const patients = Storage.getPatients() || [];
    const patientMap = new Map(patients.map(patient => [patient.id, patient]));
    const searchTerm = patientFilter.trim().toLowerCase();

    let filtered = [...allAppointments];

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

    if (serviceFilter !== 'all') {
        filtered = filtered.filter(apt => apt.serviceId === serviceFilter);
    }

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

    if (statusFilter !== 'all') {
        filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    return filtered;
}

// Filter appointments
function filterAppointments() {
    if (isCalendarView) {
        renderCalendar();
    } else {
        loadAppointmentsList();
    }
}

// Load appointments list view
function loadAppointmentsList() {
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    
    const appointments = getFilteredAppointments();
    const patients = Storage.getPatients() || [];
    const services = Storage.getServices() || [];
    const patientMap = new Map(patients.map(patient => [patient.id, patient]));
    const serviceMap = new Map(services.map(service => [service.id, service]));
    
    if (appointments.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--text-secondary);">No appointments found</p>';
        return;
    }
    
    container.innerHTML = appointments.map(apt => {
        const patient = patientMap.get(apt.patientId);
        const service = serviceMap.get(apt.serviceId);
        const dateStr = apt.appointmentDate || apt.date;
        const date = new Date(dateStr);
        const statusColors = {
            'pending': '#F59E0B',
            'confirmed': '#3B82F6',
            'completed': '#10B981',
            'cancelled': '#EF4444'
        };
        
        let serviceName = 'Unknown Service';
        if (service && service.name) {
            serviceName = service.name;
        } else if (apt.serviceName) {
            serviceName = apt.serviceName;
        }
        
        if (apt.serviceId === 'srv001' && serviceName.toLowerCase() !== 'consultation') {
            serviceName = 'Consultation';
        }
        
        return `
            <div class="appointment-row" style="border-left: 4px solid ${statusColors[apt.status] || '#CBD5E1'};">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">${(function() {
                            const isGuest = apt.patientId && apt.patientId.startsWith('guest_appointment');
                            const isWalkin = apt.patientId && apt.patientId.startsWith('walkin_');
                            if (isGuest) {
                                const notesMatch = apt.notes && apt.notes.match(/GUEST PATIENT\nName: ([^\n]+)/);
                                const name = notesMatch ? notesMatch[1] : 'Guest Patient';
                                return `${name} (guest appointment)`;
                            } else if (isWalkin) {
                                const notesMatch = apt.notes && apt.notes.match(/WALK-IN PATIENT\nName: ([^\n]+)/);
                                const name = notesMatch ? notesMatch[1] : 'Walk-in Patient';
                                return `${name} (walk-in)`;
                            }
                            return patient ? patient.fullName : 'Unknown Patient';
                        })()}</h3>
                        <p style="margin: 0.25rem 0; color: var(--text-secondary); font-size: 0.9rem;">
                            ${serviceName}
                        </p>
                        <p style="margin: 0.25rem 0; color: var(--text-secondary); font-size: 0.9rem;">
                            ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${apt.appointmentTime || apt.time || 'N/A'}
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span style="padding: 0.375rem 0.75rem; border-radius: var(--radius-md); background: ${statusColors[apt.status] || '#CBD5E1'}20; color: ${statusColors[apt.status] || '#64748B'}; font-weight: 600; font-size: 0.875rem;">
                            ${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadAppointments() {
    try {
        // Update filter counts first
        updateAppointmentFilterCounts();
        
        // Use filtered appointments from getFilteredAppointments()
        let appointments = getFilteredAppointments();
        const container = document.getElementById('appointmentsList');
        
        if (!container) {
            console.error('appointmentsList container not found');
            return;
        }
        
        // Apply status filter buttons (these are separate from the filter inputs)
        let filterLabel = 'All Appointments';
        if (appointmentFilter !== 'all') {
            if (appointmentFilter === 'today') {
                const today = new Date().toDateString();
                appointments = appointments.filter(apt => {
                    const aptDate = apt.date || apt.appointmentDate;
                    return aptDate && new Date(aptDate).toDateString() === today;
                });
                filterLabel = "Today's Appointments";
            } else {
                appointments = appointments.filter(apt => apt.status === appointmentFilter);
                filterLabel = `${appointmentFilter.charAt(0).toUpperCase() + appointmentFilter.slice(1)} Appointments`;
                if (appointmentFilter === 'pending') {
                    filterLabel += ' (Awaiting Approval)';
                }
            }
        }
        
        // Sort appointments (soonest first)
        appointments = Utils.sortAppointments(appointments);
        
        console.log('Loading appointments:', appointments.length);
        
        const patients = Storage.getPatients() || [];
        const doctors = Storage.getDoctors() || [];
        const services = Storage.getServices() || [];
        const patientMap = new Map(patients.map(patient => [patient.id, patient]));
        const doctorMap = new Map(doctors.map(doctor => [doctor.id, doctor]));
        const serviceMap = new Map(services.map(service => [service.id, service]));
        
        // Generate filter buttons with counts
        const filterButtonsHTML = `
            <div class="filter-buttons" style="margin-bottom: 1rem;">
                <button class="filter-btn ${appointmentFilter === 'all' ? 'active' : ''}" onclick="filterAppointments('all')">All <span class="filter-count">(${appointmentFilterCounts.all})</span></button>
                <button class="filter-btn ${appointmentFilter === 'pending' ? 'active' : ''}" onclick="filterAppointments('pending')">Pending <span class="filter-count">(${appointmentFilterCounts.pending})</span></button>
                <button class="filter-btn ${appointmentFilter === 'confirmed' ? 'active' : ''}" onclick="filterAppointments('confirmed')">Confirmed <span class="filter-count">(${appointmentFilterCounts.confirmed})</span></button>
                <button class="filter-btn ${appointmentFilter === 'completed' ? 'active' : ''}" onclick="filterAppointments('completed')">Completed <span class="filter-count">(${appointmentFilterCounts.completed})</span></button>
                <button class="filter-btn ${appointmentFilter === 'today' ? 'active' : ''}" onclick="filterAppointments('today')">Today <span class="filter-count">(${appointmentFilterCounts.today})</span></button>
            </div>
        `;
        
        // Show filter indicator
        const filterIndicator = appointmentFilter !== 'all' ? 
            `<div class="filter-indicator">
                <span class="filter-indicator-icon">🔍</span>
                <span class="filter-indicator-text">Showing: ${filterLabel}</span>
            </div>` : '';
        
        if (appointments.length === 0) {
            container.innerHTML = filterButtonsHTML + filterIndicator + `
                <div class="no-data">
                    <div class="no-data-icon">📅</div>
                    <p>No ${appointmentFilter !== 'all' ? filterLabel.toLowerCase() : 'appointments'} found</p>
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
            
            // Determine patient display name, handling guest and walk-in bookings
            const isGuest = apt.patientId && apt.patientId.startsWith('guest_appointment');
            const isWalkin = apt.patientId && apt.patientId.startsWith('walkin_');
            let patientName;
            if (isGuest) {
                const notesMatch = apt.notes && apt.notes.match(/GUEST PATIENT[\s\S]*?Name:\s*([^\r\n]+)/);
                patientName = notesMatch ? notesMatch[1].trim() : 'Guest Patient';
            } else if (isWalkin) {
                const notesMatch = apt.notes && apt.notes.match(/WALK-IN PATIENT[\s\S]*?Name:\s*([^\r\n]+)/);
                patientName = notesMatch ? notesMatch[1].trim() : 'Walk-in Patient';
            } else if (patient && patient.fullName) {
                patientName = patient.fullName;
            } else {
                patientName = 'Patient';
            }
            
            let serviceName = 'N/A';
            if (service && service.name) {
                serviceName = service.name;
            } else if (apt.serviceName) {
                serviceName = apt.serviceName;
            }
            
            if (apt.serviceId === 'srv001' && serviceName.toLowerCase() !== 'consultation') {
                serviceName = 'Consultation';
            }
            
            return `
                <div class="appointment-row">
                    <div>
                        ${patientName}${isGuest ? ' <span class="badge badge-warning" style="margin-left: 0.5rem; font-size: 0.7rem;">GUEST</span>' : ''}${isWalkin ? ' <span class="badge badge-info" style="margin-left: 0.5rem; font-size: 0.7rem;">WALK-IN</span>' : ''}
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
                                <button class="action-dropdown-item" onclick="editAppointmentStatus('${apt.id}')">
                                    <span class="action-icon"><img src="../assets/icons/status.png" alt="Status"></span> Change Status
                                </button>
                                ${apt.status !== 'completed' && apt.status !== 'cancelled' ? `
                                <button class="action-dropdown-item" onclick="openRescheduleModal('${apt.id}')">
                                    <span class="action-icon"><img src="../assets/icons/status.png" alt="Reschedule"></span> Reschedule
                                </button>` : ''}
                                <button class="action-dropdown-item" onclick="openEditNotesModal('${apt.id}')">
                                    <span class="action-icon"><img src="../assets/icons/notes.png" alt="Notes"></span> Edit Notes
                                </button>
                                <button class="action-dropdown-item" onclick="viewAppointmentDetails('${apt.id}')">
                                    <span class="action-icon"><img src="../assets/icons/view.png" alt="View"></span> View Details
                                </button>
                                <button class="action-dropdown-item action-dropdown-item-danger" onclick="deleteAppointment('${apt.id}')">
                                    <span class="action-icon"><img src="../assets/icons/delete.png" alt="Delete"></span> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        console.log('Appointments loaded successfully');
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

// Filter appointments
function filterAppointments(filter) {
    if (filter) {
        appointmentFilter = filter;
    }
    
    // Apply filters from the filter inputs
    const appointments = getFilteredAppointments();
    
    loadAppointments();
}

// Update filter counts
function updateAppointmentFilterCounts() {
    const appointments = Storage.getAppointments();
    const today = new Date().toDateString();
    
    appointmentFilterCounts = {
        all: appointments.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
        today: 0
    };

    appointments.forEach(apt => {
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
        if (aptDate && new Date(aptDate).toDateString() === today) {
            appointmentFilterCounts.today++;
        }
    });
}

// Edit appointment status
function editAppointmentStatus(appointmentId) {
    console.log('editAppointmentStatus called with:', appointmentId);
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
    
    // Get patient display name
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
    
    // Open the modal with explicit display
    const modal = document.getElementById('changeStatusModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
    }
}

// Helper function to create or find patient record from guest/walk-in appointment (admin)
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
    
    // Calculate date of birth from age
    let dateOfBirth = '';
    const ageNum = parseInt(patientAge);
    if (!isNaN(ageNum)) {
        const today = new Date();
        const birthYear = today.getFullYear() - ageNum;
        dateOfBirth = `${birthYear}-01-01`;
    }
    
    const newPatient = {
        fullName: patientName,
        firstName: firstName,
        lastName: lastName,
        phone: patientContact || '',
        email: patientEmail || '',
        dateOfBirth: dateOfBirth,
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
        const currentUser = Auth.getCurrentUser();
        logActivity('appointment', `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, `Admin ${currentUser ? currentUser.fullName : 'System'} changed appointment status from ${appointment.status} to ${newStatus} for ${patientDisplayName}${newPatientId ? ' (patient record created)' : ''}`);
    }
    
    // Show success alert
    CustomAlert.success(`Appointment status updated successfully!\n\nPrevious: ${appointment.status.toUpperCase()}\nNew: ${newStatus.toUpperCase()}\nPatient: ${patientDisplayName}${newPatientId ? '\n\nA patient record has been created for future appointments.' : ''}`);
    
    closeChangeStatusModal();
    updateAppointmentFilterCounts();
    loadAppointments();
    loadStatistics();
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

// View appointment details
function viewAppointmentDetails(appointmentId) {
    console.log('viewAppointmentDetails called with:', appointmentId);
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    const patient = Storage.getPatientById(appointment.patientId);
    const doctor = Storage.getDoctorById(appointment.doctorId);
    const service = Storage.getServiceById(appointment.serviceId);
    
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
        patientDisplayName = patient ? patient.fullName : 'Unknown Patient';
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
                <span class="detail-value">${service ? service.name : 'N/A'}${service ? ` (${ServiceDurations.minutesToTime(ServiceDurations.getDuration(service))})` : ''}</span>
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
    document.getElementById('appointmentDetailsAppointmentId').value = appointmentId;
    
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

// Update appointment date/time (admin)
function updateAppointmentDateTime(appointmentId) {
    const newDate = document.getElementById('editAppointmentDate').value;
    const newTime = document.getElementById('editAppointmentTime').value;
    
    if (!newDate || !newTime) {
        Utils.showNotification('Please provide both date and time', 'error');
        return;
    }
    
    const appointment = Storage.getAppointmentById(appointmentId);
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    // Check for conflicts with new date/time
    const appointments = Storage.getAppointments();
    const conflict = appointments.find(a => {
        const aDate = a.date || a.appointmentDate;
        const aTime = a.time || a.appointmentTime;
        return a.id !== appointmentId &&
               a.doctorId === appointment.doctorId &&
               aDate === newDate &&
               aTime === newTime &&
               a.status !== 'cancelled';
    });
    
    if (conflict) {
        Utils.showNotification('This time slot is already booked for the selected dentist', 'error');
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
        const currentUser = Auth.getCurrentUser();
        const doctor = Storage.getDoctorById(doctorId);
        const doctorInfo = doctorChanged ? ` (reassigned to ${doctor ? doctor.name : 'another dentist'})` : '';
        logActivity('appointment', 'Appointment Updated', `Admin ${currentUser ? currentUser.fullName : 'System'} updated appointment date/time to ${Utils.formatDate(newDate)} ${Utils.formatTime(newTime)}${doctorInfo}`);
    }
    
    Utils.showNotification('Appointment date/time updated successfully' + (doctorChanged ? ' (doctor reassigned)' : ''), 'success');
    viewAppointmentDetails(appointmentId); // Refresh view
    loadAppointments();
    triggerDataSync();
}

// Make function globally accessible
window.updateAppointmentDateTime = updateAppointmentDateTime;

// Update appointment notes
function updateAppointmentNotes(appointmentId) {
    const notesTextarea = document.getElementById('appointmentDetailsNotes');
    if (!notesTextarea) return;
    
    const notes = notesTextarea.value.trim();
    const appointment = Storage.getAppointmentById(appointmentId);
    
    if (!appointment) {
        Utils.showNotification('Appointment not found', 'error');
        return;
    }
    
    Storage.updateAppointment(appointmentId, { notes: notes });
    
    // Log activity
    if (typeof logActivity === 'function') {
        const currentUser = Auth.getCurrentUser();
        const patient = Storage.getPatientById(appointment.patientId);
        logActivity('appointment', 'Notes Updated', `${currentUser ? currentUser.fullName : 'System'} updated notes for appointment of ${patient ? patient.fullName : 'Unknown Patient'}`);
    }
    
    Utils.showNotification('Notes updated successfully', 'success');
    triggerDataSync();
    
    // Refresh appointment list to show updated notes
    loadAppointments();
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
        document.getElementById('appointmentDetailsContent').innerHTML = '';
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
            const currentUser = Auth.getCurrentUser();
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
            logActivity('appointment', 'Appointment Rescheduled', `Admin ${currentUser ? currentUser.fullName : 'System'} rescheduled appointment for ${patientDisplayName} to ${Utils.formatDate(newDate)} ${Utils.formatTime(newTime)}${doctor ? ' with ' + doctor.name : ''}`);
        }
        
        Utils.showNotification('Appointment rescheduled successfully!', 'success');
        closeRescheduleModal();
        loadAppointments();
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
            const currentUser = Auth.getCurrentUser();
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
            logActivity('appointment', 'Notes Updated', `${currentUser ? currentUser.fullName : 'System'} updated notes for appointment of ${patientDisplayName}`);
        }
        
        Utils.showNotification('Notes updated successfully', 'success');
        closeEditNotesModal();
        loadAppointments();
        triggerDataSync();
    });
}

// Delete appointment
async function deleteAppointment(appointmentId) {
    console.log('deleteAppointment called with:', appointmentId);
    const confirmed = await Utils.confirm('Are you sure you want to delete this appointment? This action cannot be undone.');
    if (!confirmed) {
        return;
    }
    
    Storage.deleteAppointment(appointmentId);
    Utils.showNotification('Appointment deleted successfully', 'info');
    updateAppointmentFilterCounts();
    loadAppointments();
    loadStatistics();
    triggerDataSync();
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

// Create staff modal
function showCreateStaffModal() {
    document.getElementById('createStaffModal').classList.add('active');
}

function closeCreateStaffModal() {
    document.getElementById('createStaffModal').classList.remove('active');
    document.getElementById('createStaffForm').reset();
}

document.getElementById('createStaffForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const staffData = {
        fullName: document.getElementById('staffName').value,
        username: document.getElementById('staffUsername').value,
        email: document.getElementById('staffEmail').value,
        password: document.getElementById('staffPassword').value,
        role: 'staff'
    };
    
    // Validate email format
    if (!Utils.validateEmail(staffData.email)) {
        Utils.showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Check if username already exists
    const existing = Storage.getUserByUsername(staffData.username);
    if (existing) {
        Utils.showNotification('Username already exists', 'error');
        return;
    }
    
    // Check if email already exists
    const existingEmail = Storage.getUserByEmail(staffData.email);
    if (existingEmail) {
        Utils.showNotification('This email is already registered. Please use a different email address.', 'error');
        return;
    }
    
    Storage.createUser(staffData);
    logActivity('staff', 'Staff Account Created', `Created staff account for ${staffData.fullName} (${staffData.email})`);
    Utils.showNotification('Staff account created successfully!', 'success');
    closeCreateStaffModal();
    loadStaff();
});

// Delete staff
async function deleteStaff(staffId) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this staff account?');
    if (!confirmed) {
        return;
    }
    
    const staff = Storage.getUserById(staffId);
    Storage.deleteUser(staffId);
    logActivity('staff', 'Staff Account Deleted', `Deleted staff account for ${staff?.fullName || 'Unknown'} (${staff?.email || 'Unknown'})`);
    Utils.showNotification('Staff account deleted', 'info');
    loadStaff();
}

// Create doctor modal
function showCreateDoctorModal() {
    document.getElementById('createDoctorModal').classList.add('active');
}

function closeCreateDoctorModal() {
    document.getElementById('createDoctorModal').classList.remove('active');
    document.getElementById('createDoctorForm').reset();
    const preview = document.getElementById('doctorImagePreview');
    if (preview) preview.style.display = 'none';
}

// Image preview for doctor profile (admin)
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

document.getElementById('createDoctorForm').addEventListener('submit', (e) => {
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
    logActivity('doctor', 'Doctor Added', `Added new doctor: ${doctorData.name} - ${doctorData.specialty}`);
    Utils.showNotification('Dentist added successfully!', 'success');
    closeCreateDoctorModal();
    loadDoctors();
    triggerDataSync();
    loadSchedules();
    populateScheduleDoctors();
}

// Toggle doctor availability
function toggleDoctorAvailability(doctorId) {
    const doctor = Storage.getDoctorById(doctorId);
    Storage.updateDoctor(doctorId, { available: !doctor.available });
    Utils.showNotification('Dentist availability updated', 'success');
    loadDoctors();
    triggerDataSync();
}

// Delete doctor
async function deleteDoctor(doctorId) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this dentist? This will also remove their schedules.');
    if (!confirmed) {
        return;
    }
    
    Storage.deleteDoctor(doctorId);
    // Delete associated schedules
    const schedules = Storage.getSchedulesByDoctor(doctorId);
    schedules.forEach(sch => Storage.deleteSchedule(sch.id));
    
    Utils.showNotification('Dentist deleted', 'info');
    loadDoctors();
    triggerDataSync();
    loadSchedules();
    populateScheduleDoctors();
}

// Edit doctor (for admin)
async function editDoctor(doctorId) {
    const doctor = Storage.getDoctorById(doctorId);
    if (!doctor) {
        CustomAlert.error('Dentist not found');
        return;
    }
    
    // Debug: Check if doctor has profileImage
    console.log('=== EDIT DOCTOR DEBUG ===');
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
        
        logActivity('doctor', 'Doctor Updated', `Admin ${currentUser.fullName} updated doctor: ${newName} (image removed)`);
        
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
            
            logActivity('doctor', 'Doctor Updated', `Admin ${currentUser.fullName} updated doctor: ${newName}`);
            
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
        
        logActivity('doctor', 'Doctor Updated', `Admin ${currentUser.fullName} updated doctor: ${newName}`);
        
        Utils.showNotification('Dentist updated successfully!', 'success');
        loadDoctors();
        triggerDataSync();
    }
}

// Create service modal
function showCreateServiceModal() {
    document.getElementById('createServiceModal').classList.add('active');
}

function closeCreateServiceModal() {
    document.getElementById('createServiceModal').classList.remove('active');
    document.getElementById('createServiceForm').reset();
}

document.getElementById('createServiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const serviceNameInput = document.getElementById('serviceName');
    const serviceDescriptionInput = document.getElementById('serviceDescription');
    const serviceDurationInput = document.getElementById('serviceDuration');
    const servicePriceInput = document.getElementById('servicePrice');
    
    const serviceData = {
        name: serviceNameInput.value.trim(),
        description: serviceDescriptionInput.value.trim(),
        duration: normalizeServiceDuration(serviceDurationInput.value),
        price: servicePriceInput.value ? servicePriceInput.value.trim() : ''
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
                console.info('Skipping backend service creation: API token missing.', error);
                skipBackendRefresh = true;
            } else if (!isNetworkError(error)) {
                CustomAlert.error(error?.message || 'Failed to add service. Please try again.');
                return;
            } else {
                console.warn('Backend unavailable when creating service; saving locally instead.', error);
                skipBackendRefresh = true;
            }
        }
    } else if (typeof API !== 'undefined' && typeof API.createService === 'function' && !hasApiToken) {
        console.info('Skipping backend service creation: no API token available.');
        skipBackendRefresh = true;
    }
    
    Storage.createService(serviceData);
    logActivity('service', 'Service Added', `Added new service: ${serviceData.name} - ${serviceData.description}`);
    Utils.showNotification('Service added successfully!', 'success');
    closeCreateServiceModal();
    await loadServices({ skipBackend: skipBackendRefresh });
    // Refresh service dropdowns
    populateServiceFilter();
    triggerDataSync();
    loadStatistics();
});

// Edit service
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
        duration: normalizeServiceDuration(newDuration),
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
            if (!isNetworkError(error)) {
                CustomAlert.error(error?.message || 'Failed to update service. Please try again.');
                return;
            }
            console.warn('Backend unavailable when updating service; applying change locally.', error);
            skipBackendRefresh = true;
        }
    }
    
    Storage.updateService(serviceId, updatedPayload);
    
    logActivity('service', 'Service Updated', `Updated service: ${newName}`);
    Utils.showNotification('Service updated successfully!', 'success');
    await loadServices({ skipBackend: skipBackendRefresh });
    // Refresh service dropdowns
    populateServiceFilter();
    triggerDataSync();
}

// Delete service
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
            if (!isNetworkError(error)) {
                CustomAlert.error(error?.message || 'Cannot delete this service.');
                return;
            }
            console.warn('Backend unavailable when deleting service; removing locally instead.', error);
            skipBackendRefresh = true;
        }
    }
    
    try {
        Storage.deleteService(serviceId);
    } catch (error) {
        CustomAlert.error(error.message || 'Cannot delete this service.');
        return;
    }
    Utils.showNotification('Service deleted', 'info');
    await loadServices({ skipBackend: skipBackendRefresh });
    // Refresh service dropdowns
    populateServiceFilter();
    triggerDataSync();
    loadStatistics();
}

// Create schedule modal
function showCreateScheduleModal() {
    populateScheduleDoctors();
    document.getElementById('createScheduleModal').classList.add('active');
}

function closeCreateScheduleModal() {
    document.getElementById('createScheduleModal').classList.remove('active');
    document.getElementById('createScheduleForm').reset();
}

function populateScheduleDoctors() {
    const doctors = Storage.getDoctors();
    const select = document.getElementById('scheduleDoctor');
    select.innerHTML = '<option value="">Select Doctor</option>' +
        doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
}

document.getElementById('createScheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const scheduleData = {
        doctorId: document.getElementById('scheduleDoctor').value,
        day: document.getElementById('scheduleDay').value,
        startTime: document.getElementById('scheduleStartTime').value,
        endTime: document.getElementById('scheduleEndTime').value
    };
    
    // Validate required fields
    if (!scheduleData.doctorId || !scheduleData.day || !scheduleData.startTime || !scheduleData.endTime) {
        CustomAlert.error('Please fill in all required fields');
        return;
    }
    
    // Validate time range
    if (scheduleData.startTime >= scheduleData.endTime) {
        CustomAlert.error('End time must be after start time');
        return;
    }
    
    // Check for duplicate schedule (same doctor, same day)
    const existingSchedules = Storage.getSchedulesByDoctor(scheduleData.doctorId);
    const duplicate = existingSchedules.find(s => s.day === scheduleData.day);
    
    if (duplicate) {
        const doctor = Storage.getDoctorById(scheduleData.doctorId);
        CustomAlert.error(`${doctor?.name || 'This doctor'} already has a schedule for ${scheduleData.day}`);
        return;
    }
    
    // Get doctor for logging
    const doctor = Storage.getDoctorById(scheduleData.doctorId);
    
    Storage.createSchedule(scheduleData);
    logActivity('schedule', 'Schedule Added', `Added schedule for ${doctor?.name || 'Unknown'}: ${scheduleData.day} ${scheduleData.startTime}-${scheduleData.endTime}`);
    Utils.showNotification('Schedule added successfully!', 'success');
    closeCreateScheduleModal();
    loadSchedules();
    triggerDataSync();
});

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
    
    logActivity('schedule', 'Schedule Updated', `Updated schedule for ${doctor.name}: ${day} ${startTime}-${endTime}`);
    Utils.showNotification('Schedule updated successfully!', 'success');
    loadSchedules();
    triggerDataSync();
}

// Delete schedule
async function deleteSchedule(scheduleId) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this schedule?');
    if (!confirmed) {
        return; // User cancelled, do nothing
    }
    
    const schedule = Storage.getScheduleById(scheduleId);
    const doctor = Storage.getDoctorById(schedule?.doctorId);
    Storage.deleteSchedule(scheduleId);
    logActivity('schedule', 'Schedule Deleted', `Deleted schedule for ${doctor?.name || 'Unknown'}: ${schedule?.day || 'Unknown'} ${schedule?.startTime || ''}-${schedule?.endTime || ''}`);
    Utils.showNotification('Schedule deleted', 'info');
    loadSchedules();
    triggerDataSync();
}

// Refresh all data manually
function refreshAllData() {
    loadStatistics();
    loadStaff();
    loadDoctors();
    loadServices();
    loadSchedules();
    loadAppointments();
    Utils.showNotification('All data refreshed', 'success');
}

// Helper functions for header actions
function showNotifications() {
    // Close sidebar on mobile after clicking
    if (window.innerWidth <= 768) {
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
    if (window.innerWidth <= 768) {
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
    if (window.innerWidth <= 768) {
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
    const fullName = user?.fullName || 'User';
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

// Make functions globally accessible
window.showNotifications = showNotifications;
window.showSettings = showSettings;
window.showProfileMenu = showProfileMenu;
window.openUserProfileModal = openUserProfileModal;
window.closeUserProfileModal = closeUserProfileModal;

// Populate service filter dropdown
function populateServiceFilter() {
    const serviceFilter = document.getElementById('appointmentServiceFilter');
    if (!serviceFilter) return;
    
    const services = Storage.getServices();
    const currentValue = serviceFilter.value;
    
    serviceFilter.innerHTML = '<option value="all">All Services</option>';
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.name;
        serviceFilter.appendChild(option);
    });
    
    if (currentValue && currentValue !== 'all') {
        serviceFilter.value = currentValue;
    }
}

function initProfilePicture() {
    refreshUserProfileUI();
}

// Manual tab switching function (backup for inline onclick)
function switchTab(tabName) {
    console.log('Manual switch to tab:', tabName);
    
    const sidebar = document.querySelector('.sidebar-nav');
    const overlay = document.querySelector('.sidebar-overlay');
    const fixedHamburger = document.querySelector('.mobile-hamburger-fixed');
    
    // Handle mobile vs desktop differently
    if (window.innerWidth <= 768) {
        // Mobile: Close sidebar after selection (with small delay to allow click to complete)
        setTimeout(() => {
            if (sidebar) {
                sidebar.classList.remove('active');
            }
            if (overlay) {
                overlay.classList.remove('active');
            }
            if (document.body) {
                document.body.style.overflow = '';
            }
            // Show fixed hamburger button when sidebar closes
            if (fixedHamburger) {
                fixedHamburger.style.display = 'flex';
            }
        }, 100);
    } else {
        // Desktop: Ensure sidebar stays collapsed if it was collapsed
        const wasCollapsed = sidebar && sidebar.classList.contains('collapsed');
        if (wasCollapsed && sidebar) {
            sidebar.classList.add('collapsed');
        }
    }
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Find and activate the clicked button
    const clickedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // Activate the tab content
    const tabId = tabName + 'Tab';
    const tabElement = document.getElementById(tabId);
    
    if (tabElement) {
        tabElement.classList.add('active');
        
        // Load data for the tab
        switch(tabName) {
            case 'staff':
                loadStaff();
                break;
            case 'doctors':
                loadDoctors();
                break;
            case 'services':
                loadServices();
                break;
            case 'promos':
                loadPromos();
                break;
            case 'schedules':
                loadSchedules();
                break;
            case 'appointments':
                loadAppointments();
                // Always refresh service filter to sync with current services
                populateServiceFilter();
                break;
            case 'patients':
                loadPatients();
                break;
        }
        
        Utils.showNotification(`Switched to ${tabName} tab`, 'info');
    } else {
        console.error('Tab element not found:', tabId);
    }
}
window.switchTab = switchTab;

// Promo Management Functions
function loadPromos() {
    const promos = Storage.getPromos();
    const container = document.getElementById('promosList');
    
    if (promos.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">🎉</div>
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
                        <span>${Utils.toPeso(promo.promoPrice || promo.price)}</span>
                    </div>
                    ${promo.validUntil ? `
                        <div class="data-detail-item">
                            <span class="data-detail-label">Valid Until:</span>
                            <span>${Utils.formatDate(promo.validUntil)}</span>
                        </div>
                    ` : ''}
                    <div class="data-detail-item" style="grid-column: 1 / -1;">
                        <span class="data-detail-label">Description:</span>
                        <span>${promo.description}</span>
                    </div>
                </div>
            </div>
            <div class="data-actions">
                <button onclick="editPromo('${promo.id}')" class="btn btn-warning btn-xs">Edit</button>
                <button onclick="deletePromo('${promo.id}')" class="btn btn-danger btn-xs">Delete</button>
            </div>
        </div>
    `).join('');
}

function showCreatePromoModal() {
    document.getElementById('createPromoModal').classList.add('active');
}

function closeCreatePromoModal() {
    document.getElementById('createPromoModal').classList.remove('active');
    document.getElementById('createPromoForm').reset();
}

document.getElementById('createPromoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const promoData = {
        title: document.getElementById('promoTitle').value,
        description: document.getElementById('promoDescription').value,
        discount: document.getElementById('promoDiscount').value,
        validUntil: document.getElementById('promoValidUntil').value,
        originalPrice: document.getElementById('promoOriginalPrice').value,
        promoPrice: document.getElementById('promoPrice').value
    };
    
    Storage.createPromo(promoData);
    Utils.showNotification('Promotion created successfully!', 'success');
    closeCreatePromoModal();
    loadPromos();
    triggerDataSync();
});

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

document.getElementById('editPromoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const promoId = document.getElementById('editPromoId').value;
    const updates = {
        title: document.getElementById('editPromoTitle').value,
        description: document.getElementById('editPromoDescription').value,
        discount: document.getElementById('editPromoDiscount').value,
        validUntil: document.getElementById('editPromoValidUntil').value,
        originalPrice: document.getElementById('editPromoOriginalPrice').value,
        promoPrice: document.getElementById('editPromoPrice').value
    };
    
    Storage.updatePromo(promoId, updates);
    Utils.showNotification('Promotion updated successfully!', 'success');
    closeEditPromoModal();
    loadPromos();
    triggerDataSync();
});

async function deletePromo(promoId) {
    const confirmed = await Utils.confirm('Are you sure you want to delete this promotion?');
    if (!confirmed) {
        return;
    }
    
    Storage.deletePromo(promoId);
    Utils.showNotification('Promotion deleted', 'info');
    loadPromos();
    triggerDataSync();
}

// Load patients list
// Filter state for admin patients
window.adminPatientSearchFilter = window.adminPatientSearchFilter || '';

function setupAdminPatientSearch() {
    const searchInput = document.getElementById('adminPatientSearchInput');
    if (searchInput) {
        // Remove any existing event listeners by replacing the element
        const parent = searchInput.parentNode;
        const newInput = searchInput.cloneNode(true);
        parent.replaceChild(newInput, searchInput);
        
        // Add event listener to the new element
        newInput.addEventListener('input', handlePatientSearch);
        newInput.addEventListener('keyup', handlePatientSearch);
    }
}

function handlePatientSearch(e) {
    const searchValue = e.target?.value || '';
    window.adminPatientSearchFilter = searchValue.toLowerCase();
    loadPatients();
}

// Add a more robust search handler that works on any input
document.addEventListener('input', function(event) {
    if (event.target && event.target.id === 'adminPatientSearchInput') {
        window.adminPatientSearchFilter = event.target.value.toLowerCase();
        loadPatients();
    }
});

function clearAdminPatientFilter() {
    const searchInput = document.getElementById('adminPatientSearchInput');
    if (searchInput) {
        searchInput.value = '';
        window.adminPatientSearchFilter = '';
        loadPatients();
    }
}

function loadPatients() {
    let patients = Storage.getPatients();
    const container = document.getElementById('patientsList');
    
    // Read live search query from input to ensure reliability
    const searchInput = document.getElementById('adminPatientSearchInput');
    const q = (searchInput?.value || window.adminPatientSearchFilter || '').toLowerCase().trim();
    
    // Apply search filter (supports full name, first name, last name, email, phone, username, id)
    if (q) {
        patients = patients.filter(p => {
            const fullName = p.fullName?.toLowerCase() || '';
            const firstName = p.firstName?.toLowerCase() || '';
            const lastName = p.lastName?.toLowerCase() || '';
            const email = p.email?.toLowerCase() || '';
            const phone = p.phone?.toLowerCase() || '';
            const username = p.username?.toLowerCase() || '';
            const id = p.id?.toLowerCase() || '';
            return (
                fullName.includes(q) ||
                firstName.includes(q) ||
                lastName.includes(q) ||
                email.includes(q) ||
                phone.includes(q) ||
                username.includes(q) ||
                id.includes(q)
            );
        });
        // keep global in sync
        window.adminPatientSearchFilter = q;
    }
    
    if (patients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">👥</div>
                <p>${q ? 'No patients found matching your search' : 'No patients found'}</p>
                ${q ? `<button onclick="clearAdminPatientFilter()" class="btn btn-primary mt-2">Clear Filter</button>` : ''}
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
function viewAllPatientAppointments(patientId) {
    const patient = Storage.getPatientById(patientId);
    if (!patient) {
        Utils.showNotification('Patient not found', 'error');
        return;
    }
    
    // Just open the patient profile modal which shows all appointments
    viewPatientProfile(patientId);
}

// View patient profile
function viewPatientProfile(patientId) {
    const patient = Storage.getPatientById(patientId);
    if (!patient) {
        Utils.showNotification('Patient not found', 'error');
        return;
    }
    
    // Set current patient ID
    document.getElementById('currentPatientId').value = patientId;
    
    // Update modal title
    document.getElementById('patientProfileTitle').textContent = `Patient Profile - ${patient.fullName}`;
    
    // Populate personal information
    document.getElementById('patientFullName').value = patient.fullName;
    document.getElementById('patientEmail').value = patient.email;
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
    
    Storage.updateUser(patientId, updates);
    logActivity('update', 'Patient Profile Updated', `Updated patient profile for ${patient.fullName}: ${Object.keys(updates).join(', ')}`);
    Utils.showNotification('Patient profile updated successfully!', 'success');
    loadPatients();
    
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
            if (window.innerWidth <= 768) {
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

// Make functions globally available for inline onclick handlers
window.toggleActionDropdown = toggleActionDropdown;
window.editAppointmentStatus = editAppointmentStatus;
window.viewAppointmentDetails = viewAppointmentDetails;
window.deleteAppointment = deleteAppointment;
window.closeAppointmentDetailsModal = closeAppointmentDetailsModal;
window.closeChangeStatusModal = closeChangeStatusModal;
window.closeAuditLogAuthModal = closeAuditLogAuthModal;

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
                } else if (modal.id === 'appointmentDetailsModal') {
                    closeAppointmentDetailsModal();
                } else if (modal.id === 'auditLogAuthModal') {
                    closeAuditLogAuthModal();
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
                } else if (activeModal.id === 'appointmentDetailsModal') {
                    closeAppointmentDetailsModal();
                } else if (activeModal.id === 'auditLogAuthModal') {
                    closeAuditLogAuthModal();
                }
            }
        }
    });
});

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
        // If clicking on a dropdown item, close the dropdown after a longer delay
        // to allow the onclick handler to execute and open the modal first
        if (clickedDropdownItem) {
            // Close dropdown and remove backdrop after a short delay to allow onclick to execute
            setTimeout(() => {
                const dropdown = clickedDropdownItem.closest('.action-dropdown-menu');
                if (dropdown && dropdown.classList.contains('active')) {
                    dropdown.classList.remove('active');
                    // Remove active state from associated button
                    const button = dropdown.previousElementSibling;
                    if (button && button.classList.contains('action-dropdown-btn')) {
                        button.classList.remove('active');
                    }
                }
                const overlay = document.getElementById('action-dropdown-overlay');
                if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 100); // Short delay to allow onclick handler to execute
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
        }
    }, 150); // Small delay to prevent immediate closing
}, false); // Use bubble phase

// Audit Log Functions
let auditLogFilter = 'all';
let auditDateFilter = 'all';
let auditSelectedDate = null;
let auditCalendarMonth = new Date().getMonth();
let auditCalendarYear = new Date().getFullYear();
let auditCalendarViewVisible = false;

function logActivity(type, action, details, userId = null) {
    const logEntry = {
        id: Utils.generateId(),
        timestamp: new Date().toISOString(),
        type: type,
        action: action,
        details: details,
        userId: userId || currentUser?.id || 'system',
        userName: currentUser?.fullName || 'System'
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
            exportAuditLogsToExcel(oldLogs, true);
            window.lastAuditExportCheck = Date.now();
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

// Audit log authentication state
let auditLogAuthenticated = false;

// Show audit log authentication modal
function showAuditLogAuthModal() {
    const modal = document.getElementById('auditLogAuthModal');
    if (!modal) {
        // Create modal if it doesn't exist
        createAuditLogAuthModal();
    }
    const existingModal = document.getElementById('auditLogAuthModal');
    if (existingModal) {
        existingModal.classList.add('active');
        document.getElementById('auditLogAuthForm').reset();
        document.getElementById('auditLogAuthError').style.display = 'none';
        const currentUser = Auth.getCurrentUser();
        if (currentUser && currentUser.role === 'admin') {
            document.getElementById('auditLogAuthUsername').value = currentUser.username || '';
        }
        setTimeout(() => {
            document.getElementById('auditLogAuthPassword').focus();
        }, 100);
    }
}

// Create audit log authentication modal
function createAuditLogAuthModal() {
    const modalHTML = `
        <div id="auditLogAuthModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">Audit Log Authentication Required</div>
                <form id="auditLogAuthForm" onsubmit="handleAuditLogAuth(event)">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="auditLogAuthUsername" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="auditLogAuthPassword" class="form-control" required>
                    </div>
                    <div id="auditLogAuthError" class="error-message" style="display: none;"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeAuditLogAuthModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Authenticate</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Handle audit log authentication
function handleAuditLogAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auditLogAuthUsername').value;
    const password = document.getElementById('auditLogAuthPassword').value;
    const errorDiv = document.getElementById('auditLogAuthError');
    
    const currentUser = Auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        errorDiv.textContent = 'Only administrators can access audit logs.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Verify password matches current user
    if (username !== currentUser.username) {
        errorDiv.textContent = 'Invalid username. Please enter your admin username.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Verify password using Storage to get the correct user
    const user = Storage.getUserByUsername(username);
    
    if (!user) {
        errorDiv.textContent = 'Invalid username. Please try again.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (user.role !== 'admin') {
        errorDiv.textContent = 'Only administrators can access audit logs.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (user.id !== currentUser.id) {
        errorDiv.textContent = 'Username does not match the currently logged-in administrator.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (user.password !== password) {
        errorDiv.textContent = 'Invalid password. Please try again.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Authentication successful
    auditLogAuthenticated = true;
    closeAuditLogAuthModal();
    loadAuditLog();
    
    // Log the access
    if (typeof logActivity === 'function') {
        logActivity('system', 'Audit Log Accessed', `Administrator ${currentUser.fullName} (${currentUser.username}) accessed the audit log after authentication`);
    }
}

function closeAuditLogAuthModal() {
    const modal = document.getElementById('auditLogAuthModal');
    if (modal) {
        modal.classList.remove('active');
    }
    // If user cancels without authenticating, navigate away from audit tab
    if (!auditLogAuthenticated) {
        const auditTab = document.getElementById('auditTab');
        if (auditTab && auditTab.classList.contains('active')) {
            // Switch to dashboard tab if audit tab was active
            const dashboardBtn = document.querySelector('[data-tab="dashboard"]');
            if (dashboardBtn) {
                dashboardBtn.click();
            }
        }
    }
}

function loadAuditLog() {
    // Check authentication
    if (!auditLogAuthenticated) {
        showAuditLogAuthModal();
        return;
    }
    
    // Check and export old logs before loading (only once per session to avoid multiple downloads)
    if (!window.auditLogExportChecked) {
        checkAndExportOldAuditLogs();
        window.auditLogExportChecked = true;
    }
    
    const auditLogs = Storage.getAuditLogs();
    const container = document.getElementById('auditLogList');
    
    if (!container) {
        console.error('auditLogList container not found');
        return;
    }
    
    let filteredLogs = [...auditLogs];
    
    // Apply activity type filter
    if (auditLogFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.type === auditLogFilter);
    }
    
    // Apply date filter
    if (auditDateFilter !== 'all' || auditSelectedDate) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filteredLogs = filteredLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
            
            if (auditSelectedDate) {
                // Filter by selected calendar date
                const selectedDateOnly = new Date(auditSelectedDate.getFullYear(), auditSelectedDate.getMonth(), auditSelectedDate.getDate());
                return logDateOnly.getTime() === selectedDateOnly.getTime();
            }
            
            switch(auditDateFilter) {
                case 'today':
                    return logDateOnly.getTime() === today.getTime();
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return logDateOnly.getTime() === yesterday.getTime();
                case 'week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    return logDateOnly >= weekStart;
                case 'month':
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    return logDateOnly >= monthStart;
                case 'custom':
                    const fromDate = document.getElementById('auditDateFrom')?.value;
                    const toDate = document.getElementById('auditDateTo')?.value;
                    if (fromDate && toDate) {
                        const from = new Date(fromDate);
                        const to = new Date(toDate);
                        to.setHours(23, 59, 59, 999);
                        return logDate >= from && logDate <= to;
                    }
                    return true;
                default:
                    return true;
            }
        });
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (filteredLogs.length === 0) {
        container.innerHTML = `
            <div class="no-data" style="padding: 3rem; text-align: center;">
                <div class="no-data-icon" style="font-size: 4rem; margin-bottom: 1rem;">📋</div>
                <p style="font-size: 1.1rem; color: var(--text-secondary);">No audit log entries found</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    // Group logs by date
    const logsByDate = {};
    filteredLogs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const dateKey = logDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!logsByDate[dateKey]) {
            logsByDate[dateKey] = [];
        }
        logsByDate[dateKey].push(log);
    });
    
    container.innerHTML = Object.keys(logsByDate).map(dateKey => {
        const dateLogs = logsByDate[dateKey];
        return `
            <div class="audit-log-date-group">
                <div class="audit-log-date-header">
                    <span class="audit-log-date-icon">📅</span>
                    <h3 class="audit-log-date-title">${dateKey}</h3>
                    <span class="audit-log-date-count">${dateLogs.length} ${dateLogs.length === 1 ? 'entry' : 'entries'}</span>
                </div>
                <div class="audit-log-entries">
                    ${dateLogs.map(log => {
                        const timestamp = new Date(log.timestamp);
                        const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        const typeIcon = getActivityTypeIcon(log.type);
                        const typeColor = getActivityTypeColor(log.type);
                        
                        return `
                            <div class="audit-log-entry" style="border-left: 4px solid ${typeColor};">
                                <div class="audit-log-entry-header">
                                    <div class="audit-log-entry-icon" style="background: ${typeColor}20; color: ${typeColor};">
                                        ${typeIcon}
                                    </div>
                                    <div class="audit-log-entry-content">
                                        <div class="audit-log-entry-action">${log.action}</div>
                                        <div class="audit-log-entry-meta">
                                            <span class="audit-log-entry-user">
                                                <span class="audit-log-entry-user-icon">👤</span>
                                                ${log.userName}
                                            </span>
                                            <span class="audit-log-entry-time">
                                                <span class="audit-log-entry-time-icon">🕐</span>
                                                ${timeStr}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="audit-log-entry-details">${log.details}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // Update calendar if visible
    if (auditCalendarViewVisible) {
        renderAuditCalendar();
    }
}

function getActivityTypeIcon(type) {
    const icons = {
        'appointment': '📅',
        'patient': '👤',
        'update': '✏️',
        'staff': '👥',
        'doctor': '👨‍⚕️',
        'service': '🛠️',
        'schedule': '⏰',
        'system': '⚙️'
    };
    return icons[type] || '📝';
}

function filterAuditLog() {
    const filterSelect = document.getElementById('auditFilter');
    auditLogFilter = filterSelect.value;
    loadAuditLog();
}

// Date filter functions
function toggleAuditDateFilter() {
    const dropdown = document.getElementById('auditDateFilterDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function setAuditDateFilter(filter) {
    auditDateFilter = filter;
    auditSelectedDate = null;
    
    const customRange = document.getElementById('auditCustomDateRange');
    if (filter === 'custom') {
        if (customRange) customRange.style.display = 'block';
    } else {
        if (customRange) customRange.style.display = 'none';
        updateAuditDateFilterText();
        loadAuditLog();
    }
    
    // Close dropdown if not custom
    if (filter !== 'custom') {
        const dropdown = document.getElementById('auditDateFilterDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
}

function applyAuditDateFilter() {
    const fromDate = document.getElementById('auditDateFrom')?.value;
    const toDate = document.getElementById('auditDateTo')?.value;
    
    if (fromDate && toDate) {
        updateAuditDateFilterText();
        loadAuditLog();
        
        // Close dropdown
        const dropdown = document.getElementById('auditDateFilterDropdown');
        if (dropdown) dropdown.style.display = 'none';
    } else {
        Utils.showNotification('Please select both from and to dates', 'error');
    }
}

function updateAuditDateFilterText() {
    const filterText = document.getElementById('auditDateFilterText');
    if (!filterText) return;
    
    let text = '📅 ';
    switch(auditDateFilter) {
        case 'today':
            text += 'Today';
            break;
        case 'yesterday':
            text += 'Yesterday';
            break;
        case 'week':
            text += 'This Week';
            break;
        case 'month':
            text += 'This Month';
            break;
        case 'custom':
            const fromDate = document.getElementById('auditDateFrom')?.value;
            const toDate = document.getElementById('auditDateTo')?.value;
            if (fromDate && toDate) {
                const from = new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const to = new Date(toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                text += `${from} - ${to}`;
            } else {
                text += 'Custom Range';
            }
            break;
        default:
            text += 'All Dates';
    }
    
    if (auditSelectedDate) {
        text = '📅 ' + auditSelectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    filterText.textContent = text;
}

// Calendar functions
function toggleAuditCalendar() {
    auditCalendarViewVisible = !auditCalendarViewVisible;
    const calendarView = document.getElementById('auditCalendarView');
    const toggleBtn = document.getElementById('auditCalendarToggle');
    
    if (calendarView) {
        calendarView.style.display = auditCalendarViewVisible ? 'block' : 'none';
    }
    
    if (toggleBtn) {
        toggleBtn.textContent = auditCalendarViewVisible ? '📅 Hide Calendar' : '📅 Calendar';
    }
    
    if (auditCalendarViewVisible) {
        renderAuditCalendar();
    }
}

function renderAuditCalendar() {
    const calendarGrid = document.getElementById('auditCalendarGrid');
    const calendarMonthYear = document.getElementById('auditCalendarMonthYear');
    
    if (!calendarGrid || !calendarMonthYear) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    calendarMonthYear.textContent = `${monthNames[auditCalendarMonth]} ${auditCalendarYear}`;
    
    const firstDay = new Date(auditCalendarYear, auditCalendarMonth, 1);
    const lastDay = new Date(auditCalendarYear, auditCalendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get all audit logs to mark dates with activities
    const allLogs = Storage.getAuditLogs();
    const datesWithActivities = new Set();
    allLogs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
        datesWithActivities.add(dateKey);
    });
    
    calendarGrid.innerHTML = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'audit-calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'audit-calendar-day audit-calendar-day-empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const dateStr = `${auditCalendarYear}-${String(auditCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getDate() === day && 
                       today.getMonth() === auditCalendarMonth && 
                       today.getFullYear() === auditCalendarYear;
        const isSelected = auditSelectedDate && 
                          auditSelectedDate.getDate() === day &&
                          auditSelectedDate.getMonth() === auditCalendarMonth &&
                          auditSelectedDate.getFullYear() === auditCalendarYear;
        const hasActivities = datesWithActivities.has(dateStr);
        const dayDate = new Date(auditCalendarYear, auditCalendarMonth, day);
        dayDate.setHours(0, 0, 0, 0);
        const isPast = dayDate < today;
        
        dayElement.className = 'audit-calendar-day';
        if (isToday) dayElement.classList.add('audit-calendar-day-today');
        if (isSelected) dayElement.classList.add('audit-calendar-day-selected');
        if (hasActivities) dayElement.classList.add('audit-calendar-day-has-activities');
        if (isPast && !isToday && !isSelected) {
            dayElement.classList.add('audit-calendar-day-past');
        }
        
        dayElement.innerHTML = `<span class="audit-calendar-day-number">${day}</span>`;
        
        dayElement.addEventListener('click', () => {
            const selectedDate = new Date(auditCalendarYear, auditCalendarMonth, day);
            auditSelectedDate = selectedDate;
            auditDateFilter = 'all';
            updateAuditDateFilterText();
            loadAuditLog();
        });
        
        calendarGrid.appendChild(dayElement);
    }
    
    // Fill remaining cells
    const totalCells = 42;
    const filledCells = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells - filledCells;
    for (let i = 0; i < remainingCells && i < 7; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'audit-calendar-day audit-calendar-day-empty';
        calendarGrid.appendChild(emptyDay);
    }
}

function changeAuditCalendarMonth(direction) {
    auditCalendarMonth += direction;
    if (auditCalendarMonth < 0) {
        auditCalendarMonth = 11;
        auditCalendarYear--;
    } else if (auditCalendarMonth > 11) {
        auditCalendarMonth = 0;
        auditCalendarYear++;
    }
    renderAuditCalendar();
}

function getActivityTypeColor(type) {
    const colors = {
        'appointment': '#2196F3',
        'patient': '#4CAF50',
        'update': '#FF9800',
        'staff': '#9C27B0',
        'doctor': '#00BCD4',
        'service': '#F44336',
        'schedule': '#795548',
        'authentication': '#607D8B',
        'system': '#9E9E9E'
    };
    return colors[type] || '#757575';
}

// Close date filter dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('auditDateFilterDropdown');
    const button = document.getElementById('auditDateFilterBtn');
    if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Check and export audit logs older than 6 months
function checkAndExportOldAuditLogs() {
    const auditLogs = Storage.getAuditLogs();
    if (auditLogs.length === 0) return;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    const oldLogs = auditLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);
        return logDate < sixMonthsAgo;
    });
    
    if (oldLogs.length > 0) {
        // Export old logs to Excel (silently, without user interaction)
        try {
            const oldestDate = new Date(oldLogs[0].timestamp);
            const newestDate = new Date(oldLogs[oldLogs.length - 1].timestamp);
            const oldestStr = oldestDate.toISOString().split('T')[0];
            const newestStr = newestDate.toISOString().split('T')[0];
            const filename = `Audit_Logs_${oldestStr}_to_${newestStr}.xls`;
            
            exportAuditLogsToExcel(oldLogs, true);
            console.log(`Auto-exported ${oldLogs.length} audit log entries older than 6 months to Excel`);
            
            // Notify admin about audit log export
            if (typeof Storage.addNotification === 'function') {
                Storage.addNotification({
                    type: 'system',
                    title: 'Audit Logs Exported',
                    message: `${oldLogs.length} audit log entries (${oldestStr} to ${newestStr}) have been automatically exported to Excel file: ${filename}`,
                    userId: 'admin', // Notify admin
                    action: 'view',
                    actionData: { tab: 'audit' }
                });
            }
        } catch (error) {
            console.error('Error auto-exporting old audit logs:', error);
        }
    }
}

// Export audit logs to Excel
function exportAuditLogs(logsToExport = null) {
    const auditLogs = Storage.getAuditLogs();
    const logs = logsToExport || auditLogs;
    
    if (logs.length === 0) {
        CustomAlert.error('No audit logs to export');
        return;
    }
    
    // Show confirmation for manual export
    if (!logsToExport) {
        CustomConfirm.show(
            `Export ${logs.length} audit log entries to Excel?`,
            'Export Audit Logs',
            {
                confirmText: 'Export',
                cancelText: 'Cancel',
                onConfirm: () => {
                    exportAuditLogsToExcel(logs, false);
                }
            }
        );
    } else {
        exportAuditLogsToExcel(logs, true);
    }
}

// Export audit logs to Excel file
function exportAuditLogsToExcel(logs, isAutoExport = false) {
    try {
        // Sort logs by timestamp (oldest first for auto-export, or keep current order)
        const sortedLogs = isAutoExport ? [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) : logs;
        
        // Create Excel XML format
        let xml = '<?xml version="1.0"?>\n';
        xml += '<?mso-application progid="Excel.Sheet"?>\n';
        xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
        xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
        xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
        xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
        xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
        xml += '<Worksheet ss:Name="Audit Logs">\n';
        xml += '<Table>\n';
        
        // Header row
        xml += '<Row>\n';
        xml += '<Cell><Data ss:Type="String">ID</Data></Cell>\n';
        xml += '<Cell><Data ss:Type="String">Timestamp</Data></Cell>\n';
        xml += '<Cell><Data ss:Type="String">Date</Data></Cell>\n';
        xml += '<Cell><Data ss:Type="String">Time</Data></Cell>\n';
        xml += '<Cell><Data ss:Type="String">Type</Data></Cell>\n';
        xml += '<Cell><Data ss:Type="String">Action</Data></Cell>\n';
        xml += '<Cell><Data ss:Type="String">Details</Data></Cell>\n';
        xml += '<Cell><Data ss:Type="String">User ID</Data></Cell>\n';
        xml += '<Cell><Data ss:Type="String">User Name</Data></Cell>\n';
        xml += '</Row>\n';
        
        // Data rows
        sortedLogs.forEach(log => {
            const logDate = new Date(log.timestamp);
            const dateStr = logDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const timeStr = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            
            xml += '<Row>\n';
            xml += `<Cell><Data ss:Type="String">${escapeXml(log.id)}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeXml(log.timestamp)}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeXml(timeStr)}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeXml(log.type || 'N/A')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeXml(log.action || 'N/A')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeXml(log.details || 'N/A')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeXml(log.userId || 'N/A')}</Data></Cell>\n`;
            xml += `<Cell><Data ss:Type="String">${escapeXml(log.userName || 'N/A')}</Data></Cell>\n`;
            xml += '</Row>\n';
        });
        
        xml += '</Table>\n';
        xml += '</Worksheet>\n';
        xml += '</Workbook>';
        
        // Create filename with date range
        let filename;
        if (isAutoExport) {
            const oldestDate = new Date(sortedLogs[0].timestamp);
            const newestDate = new Date(sortedLogs[sortedLogs.length - 1].timestamp);
            const oldestStr = oldestDate.toISOString().split('T')[0];
            const newestStr = newestDate.toISOString().split('T')[0];
            filename = `Audit_Logs_${oldestStr}_to_${newestStr}.xls`;
        } else {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            filename = `Audit_Logs_Export_${dateStr}.xls`;
        }
        
        // Create blob and download
        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up after a short delay
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        if (!isAutoExport) {
            CustomAlert.success(`Successfully exported ${logs.length} audit log entries to Excel file: ${filename}`);
            
            // Notify admin about manual export
            if (typeof Storage.addNotification === 'function') {
                Storage.addNotification({
                    type: 'system',
                    title: 'Audit Logs Exported',
                    message: `Successfully exported ${logs.length} audit log entries to Excel file: ${filename}`,
                    userId: 'admin',
                    action: 'view',
                    actionData: { tab: 'audit' }
                });
            }
        } else {
            // For auto-export, show a subtle notification
            console.log(`Auto-exported ${logs.length} audit log entries to ${filename}`);
        }
    } catch (error) {
        console.error('Error exporting audit logs:', error);
        CustomAlert.error('Failed to export audit logs. Please try again.');
    }
}

// Helper function to escape XML special characters
function escapeXml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Store pending audit log action
let pendingAuditLogAction = null;

function clearAuditLog() {
    // First confirmation
    CustomConfirm.show(
        'Are you sure you want to clear the entire audit log? This action cannot be undone.',
        'Clear Audit Log',
        {
            confirmText: 'Yes, Clear Log',
            cancelText: 'No, Cancel',
            onConfirm: () => {
                // Set pending action and show re-authentication modal
                pendingAuditLogAction = 'clear';
                showReauthModal();
            }
        }
    );
}

// Show re-authentication modal
function showReauthModal() {
    const modal = document.getElementById('reauthModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('reauthForm').reset();
        document.getElementById('reauthError').style.display = 'none';
        // Pre-fill username if current user exists
        const currentUser = Auth.getCurrentUser();
        if (currentUser && currentUser.role === 'admin') {
            document.getElementById('reauthUsername').value = currentUser.username || '';
        }
        // Focus on password field
        setTimeout(() => {
            document.getElementById('reauthPassword').focus();
        }, 100);
    }
}

// Close re-authentication modal
function closeReauthModal() {
    const modal = document.getElementById('reauthModal');
    if (modal) {
        modal.classList.remove('active');
        pendingAuditLogAction = null;
        document.getElementById('reauthForm').reset();
        document.getElementById('reauthError').style.display = 'none';
    }
}

// Handle re-authentication form submission
function handleReauthSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('reauthUsername').value.trim();
    const password = document.getElementById('reauthPassword').value;
    const errorDiv = document.getElementById('reauthError');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    // Get current admin user to verify
    const currentUser = Auth.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
        errorDiv.textContent = 'Only administrators can perform audit log operations.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Verify credentials match current admin
    const user = Storage.getUserByUsername(username);
    
    if (!user) {
        errorDiv.textContent = 'Invalid username. Please try again.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (user.id !== currentUser.id) {
        errorDiv.textContent = 'Username does not match the currently logged-in administrator.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (user.password !== password) {
        errorDiv.textContent = 'Incorrect password. Please try again.';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (user.role !== 'admin') {
        errorDiv.textContent = 'Access denied. Administrator privileges required.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Re-authentication successful - proceed with pending action
    closeReauthModal();
    
    if (pendingAuditLogAction === 'clear') {
        // Perform the clear audit log action
        try {
            Storage.clearAuditLogs();
            
            // Log this action
            if (typeof logActivity === 'function') {
                logActivity('system', 'Audit Log Cleared', `Administrator ${currentUser.fullName} (${currentUser.username}) cleared all audit log entries after re-authentication`);
            }
            
            loadAuditLog();
            CustomAlert.success('Audit log cleared successfully.\n\nAll audit log entries have been removed.');
        } catch (error) {
            CustomAlert.error(`Failed to clear audit log: ${error.message}`);
        }
    }
    
    // Reset pending action
    pendingAuditLogAction = null;
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const reauthModal = document.getElementById('reauthModal');
        if (reauthModal && reauthModal.classList.contains('active')) {
            closeReauthModal();
        }
    }
});

// Notification System
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

// Make notification functions globally accessible
window.showNotificationModal = showNotificationModal;
window.closeNotificationModal = closeNotificationModal;
window.handleNotificationClick = handleNotificationClick;
window.deleteNotification = deleteNotification;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.clearAllNotifications = clearAllNotifications;

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

