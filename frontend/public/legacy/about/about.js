// About page functionality

document.addEventListener('DOMContentLoaded', () => {
    loadTeam();
});

function loadTeam() {
    const doctors = Storage.getDoctors();
    const container = document.getElementById('teamGrid');
    
    container.innerHTML = doctors.map(doctor => {
        const avatarHTML = doctor.profileImage ? 
            `<img src="${doctor.profileImage}" alt="${doctor.name}" class="member-avatar-img">` :
            `<div class="member-avatar-fallback">${doctor.name.charAt(0).toUpperCase()}</div>`;
        
        return `
        <div class="team-member">
            <div class="member-avatar">${avatarHTML}</div>
            <h3>${doctor.name}</h3>
            <div class="member-specialty">${doctor.specialty}</div>
            <div class="member-bio">
                Dedicated healthcare professional committed to providing excellent patient care and treatment.
            </div>
        </div>
    `;
    }).join('');
}

