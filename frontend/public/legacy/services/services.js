// Services page functionality

const serviceIcons = {
    'General Consultation': '🩺',
    'Cardiology': '❤️',
    'Pediatric': '👶',
    'Orthopedic': '🦴',
    'Dermatology': '✨',
    'Lab Tests': '🔬',
    'X-Ray': '📷',
    'Physical Therapy': '💪'
};

document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    loadPromos();
});

function loadPromos() {
    const promos = Storage.getPromos();
    const promosSection = document.getElementById('promosSection');
    const container = document.getElementById('promosList');
    
    if (!promosSection || !container) {
        console.error('Promos section elements not found');
        return;
    }
    
    // Filter out expired promos
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activePromos = promos.filter(promo => {
        if (!promo.validUntil) return true; // No expiry date means always valid
        const validUntil = new Date(promo.validUntil);
        validUntil.setHours(0, 0, 0, 0);
        return validUntil >= today;
    });
    
    if (activePromos.length === 0) {
        promosSection.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    
    promosSection.style.display = 'block';
    
    container.innerHTML = activePromos.map(promo => `
        <div class="promo-card">
            <div class="promo-badge">${promo.discount || promo.title || 'Special Offer'}</div>
            <div class="promo-content">
                <h3>${promo.title || 'Special Promotion'}</h3>
                <p class="promo-description">${promo.description || 'Limited time offer on selected dental services'}</p>
                ${promo.originalPrice ? `
                    <div class="promo-pricing">
                        <span class="original-price">${Utils.toPeso(promo.originalPrice)}</span>
                        <span class="promo-price">${Utils.toPeso(promo.price || promo.promoPrice)}</span>
                    </div>
                ` : `
                    <div class="promo-pricing">
                        <span class="promo-price">${Utils.toPeso(promo.price || promo.promoPrice || '0')}</span>
                    </div>
                `}
                ${promo.validUntil ? `
                    <div class="promo-validity">Valid until: ${Utils.formatDate(promo.validUntil)}</div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function loadServices() {
    const services = Storage.getServices();
    const container = document.getElementById('servicesList');
    
    container.innerHTML = services.map(service => {
        // Try to match icon based on service name
        let icon = '🦷'; // default dental icon
        for (const [key, value] of Object.entries(serviceIcons)) {
            if (service.name.toLowerCase().includes(key.toLowerCase())) {
                icon = value;
                break;
            }
        }
        
        const duration = ServiceDurations.getDuration(service);
        const durationText = ServiceDurations.minutesToTime(duration);
        return `
            <div class="service-card" onclick="showServiceDetails('${service.id}')">
                <div class="service-icon">${icon}</div>
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div class="service-duration-display" style="margin: 0.75rem 0; padding: 0.5rem; background: rgba(212, 175, 55, 0.1); border-radius: 0.5rem; font-weight: 600; color: var(--gold-primary);">
                    ⏱️ Duration: ${durationText}
                </div>
                <div class="service-features">
                    <div class="service-feature">
                        <span class="checkmark">✓</span>
                        <span>Comprehensive Evaluation</span>
                    </div>
                    <div class="service-feature">
                        <span class="checkmark">✓</span>
                        <span>Professional Care</span>
                    </div>
                </div>
                <button class="btn btn-primary service-view-btn">View Details</button>
            </div>
        `;
    }).join('');
}

// Show service details modal
function showServiceDetails(serviceId) {
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

