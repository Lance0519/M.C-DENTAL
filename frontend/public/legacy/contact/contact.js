// Contact page functionality

// Load and display clinic hours
function loadClinicHours() {
    const clinicSchedule = Storage.getClinicSchedule();
    const container = document.getElementById('clinicHoursDisplay');
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    let hoursHTML = '<div style="line-height: 1.8;">';
    
    days.forEach(day => {
        const daySchedule = clinicSchedule[day] || { isOpen: false, startTime: '09:00', endTime: '18:00' };
        
        if (daySchedule.isOpen) {
            const startTime = Utils.formatTime(daySchedule.startTime);
            const endTime = Utils.formatTime(daySchedule.endTime);
            hoursHTML += `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: center;">
                <strong style="color: black; min-width: 120px;">${day}:</strong>
                <span style="color: black; margin-left: 3rem;">${startTime} - ${endTime}</span>
            </div>`;
        } else {
            hoursHTML += `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: center;">
                <strong style="color: #FFFFFF; min-width: 120px;">${day}:</strong>
                <span style="color: #888; margin-left: 3rem;">Closed</span>
            </div>`;
        }
    });
    
    hoursHTML += '</div>';
    container.innerHTML = hoursHTML;
}

// Load clinic hours on page load
document.addEventListener('DOMContentLoaded', () => {
    loadClinicHours();
    
    // Listen for clinic schedule updates
    window.addEventListener('storage', (e) => {
        if (e.key === 'clinicData' || e.key === 'lastDataUpdate') {
            loadClinicHours();
        }
    });
});

// Contact form submission
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    
    // Validation
    if (!Utils.validateEmail(email)) {
        Utils.showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (!Utils.validatePhone(phone)) {
        Utils.showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // In a real application, this would send the message to a server
    // For now, we'll just show a success notification
    Utils.showNotification('Thank you for your message! We will get back to you soon.', 'success');
    
    // Reset form
    document.getElementById('contactForm').reset();
});

