// Home page functionality

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Wait for Storage and Auth to be available
        if (typeof Storage === 'undefined' || typeof Auth === 'undefined') {
            console.warn('Storage or Auth not loaded yet, retrying...');
            setTimeout(() => {
                initializeHomePage();
            }, 100);
            return;
        }
        
        initializeHomePage();
    } catch (error) {
        console.error('Error initializing home page:', error);
        // Don't crash the page - just log the error
    }
});

function initializeHomePage() {
    try {
        // Check if user is already logged in
        if (typeof Auth === 'undefined' || typeof Auth.getCurrentUser !== 'function') {
            console.warn('Auth not available');
            return;
        }
        
        const currentUser = Auth.getCurrentUser();
        
        // Update navigation if user is logged in
        if (currentUser) {
            updateNavigationForLoggedInUser(currentUser);
        }
    } catch (error) {
        console.error('Error in initializeHomePage:', error);
    }
}

function updateNavigationForLoggedInUser(user) {
    try {
        const nav = document.querySelector('nav ul');
        if (!nav) {
            console.warn('Navigation element not found');
            return;
        }
        
        const loginLink = nav.querySelector('a[href="../login/login.html"]');
        
        if (loginLink && user && user.role) {
            const listItem = loginLink.parentElement;
            if (listItem) {
                listItem.innerHTML = `
                    <a href="../dashboard/${user.role}.html" class="btn btn-primary">Dashboard</a>
                `;
            }
        }
    } catch (error) {
        console.error('Error updating navigation:', error);
    }
}

// Load services on homepage
function loadServices() {
    try {
        const services = Storage.getServices();
        const container = document.getElementById('servicesList');
        
        if (!container) return;
        
        // Display first 6 services
        const displayServices = services.slice(0, 6);
        
        container.innerHTML = displayServices.map(service => {
            const duration = ServiceDurations.getDuration(service);
            const durationText = ServiceDurations.minutesToTime(duration);
            
            // Try to match icon based on service name
            let icon = '🦷'; // default dental icon
            const serviceIcons = {
                'braces': '🔧',
                'cleaning': '✨',
                'surgery': '⚕️',
                'extraction': '🦷',
                'whitening': '💎',
                'consultation': '🩺',
                'x-ray': '📷'
            };
            for (const [key, value] of Object.entries(serviceIcons)) {
                if (service.name.toLowerCase().includes(key)) {
                    icon = value;
                    break;
                }
            }
            
            return `
                <div class="service-card" onclick="showServiceDetails('${service.id}')">
                    <div class="service-icon">${icon}</div>
                    <h3>${service.name}</h3>
                    <p>${service.description || 'Professional dental care service'}</p>
                    <div class="service-duration-display">
                        ⏱️ Duration: ${durationText}
                    </div>
                    <button class="btn btn-primary service-view-btn">View Details</button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Show service details modal
function showServiceDetails(serviceId) {
    try {
        const service = Storage.getServiceById(serviceId);
        if (!service) {
            console.error('Service not found:', serviceId);
            return;
        }
        
        const duration = ServiceDurations.getDuration(service);
        const durationText = ServiceDurations.minutesToTime(duration);
        const price = service.price ? Utils.toPeso(service.price) : 'Contact us for pricing';
        
        const modalContent = document.getElementById('serviceDetailsContent');
        modalContent.innerHTML = `
            <div class="service-details-header">
                <h2>${service.name}</h2>
            </div>
            <div class="service-details-body">
                <div class="service-details-description">
                    <h3>Description</h3>
                    <p>${service.description || 'Professional dental care service tailored to your needs.'}</p>
                </div>
                
                <div class="service-details-info">
                    <div class="service-info-item">
                        <span class="service-info-label">⏱️ Duration:</span>
                        <span class="service-info-value">${durationText}</span>
                    </div>
                    <div class="service-info-item">
                        <span class="service-info-label">💰 Price:</span>
                        <span class="service-info-value price-value">${price}</span>
                    </div>
                </div>
                
                <div class="service-details-features">
                    <h3>What's Included</h3>
                    <ul>
                        <li>✓ Comprehensive evaluation and consultation</li>
                        <li>✓ Professional dental care by experienced dentists</li>
                        <li>✓ Modern equipment and techniques</li>
                        <li>✓ Follow-up care and support</li>
                    </ul>
                </div>
                
                <div class="service-details-actions">
                    <a href="../book/book.html" class="btn btn-primary btn-lg">Book an Appointment</a>
                </div>
            </div>
        `;
        
        document.getElementById('serviceDetailsModal').classList.add('active');
    } catch (error) {
        console.error('Error showing service details:', error);
    }
}

// Close service details modal
function closeServiceDetailsModal() {
    document.getElementById('serviceDetailsModal').classList.remove('active');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('serviceDetailsModal');
    if (e.target === modal) {
        closeServiceDetailsModal();
    }
});

