/**
 * Frontend API Wrapper
 * Connects frontend to PHP backend API
 * Replace localStorage Storage calls with API calls
 */

// API Configuration
// Automatically detects the correct URL based on how the page is accessed
// - If accessed via localhost: uses localhost
// - If accessed via IP address: uses that IP address
// This allows mobile phone access without manual configuration
function getAPIBaseURL() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    const override =
        window.NEXT_API_BASE_URL ||
        window.__NEXT_API_BASE_URL__ ||
        localStorage.getItem('NEXT_API_BASE_URL');

    const normalize = (url) => url.replace(/\/+$/, '');

    if (override) {
        return normalize(override);
    }
    
    // ⚠️ DETECT FILE PROTOCOL - Show helpful error message
    if (protocol === 'file:') {
        console.error('❌ CORS ERROR: You are opening files directly using file:// protocol!');
        console.error('');
        console.error('🔴 PROBLEM:');
        console.error('   - You double-clicked an HTML file or opened it directly');
        console.error('   - Browsers block fetch requests from file:// for security');
        console.error('   - PHP/Next APIs cannot execute via file:// protocol');
        console.error('');
        console.error('✅ SOLUTION:');
        console.error('   1. Run the frontend through a dev server (npm run dev) or');
        console.error('   2. Host the project on Vercel/Netlify');
        console.error('');
        
        if (typeof CustomAlert !== 'undefined') {
            CustomAlert.error(
                'CORS Error: Please use a web server!\n\n' +
                'You are opening files directly. This causes CORS errors.\n\n' +
                'SOLUTION:\n' +
                '1. Use `npm run dev`, OR\n' +
                '2. Deploy via Vercel/Netlify and access over HTTP/HTTPS.'
            );
        } else {
            alert(
                '❌ CORS ERROR\n\n' +
                'You are opening files directly (file:// protocol).\n\n' +
                'Use `npm run dev` or deploy the site so it is served over http(s).'
            );
        }
        
        return 'http://localhost:3000/api';
    }
    
    // Local development defaults to Next.js dev server on port 3000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const nextPort = port || '3000';
        return `${protocol}//${hostname}:${nextPort}/api`;
    }
    
    // For production (Vercel, Netlify, etc.) assume API is on the same origin under /api
    if (port) {
        return `${protocol}//${hostname}:${port}/api`;
    }
    
    return `${protocol}//${hostname}/api`;
}

const API_BASE_URL = getAPIBaseURL();

// Enable/disable backend email verification (set to false to use local validation only)
const ENABLE_BACKEND_VERIFICATION = true;

// Backend availability check
let backendAvailable = null;
let backendCheckPromise = null;
let backendCheckAttempted = false;

/**
 * Main API Class
 * Handles all HTTP requests to backend
 */
class API {
    /**
     * Get authentication token from session storage
     */
    static getToken() {
        return sessionStorage.getItem('token');
    }
    
    /**
     * Set authentication token
     */
    static setToken(token) {
        sessionStorage.setItem('token', token);
    }
    
    /**
     * Remove authentication token
     */
    static removeToken() {
        sessionStorage.removeItem('token');
    }
    
    /**
     * Make HTTP request to backend
     */
    static async request(endpoint, options = {}) {
        const token = this.getToken();
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            // Check if response is ok before parsing JSON
            if (!response.ok) {
                // Try to parse error response
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data.data || data;
        } catch (error) {
            // Only log non-network errors to avoid console spam
            if (error.message && !error.message.includes('Failed to fetch') && 
                !error.message.includes('ERR_CONNECTION_REFUSED') && 
                !error.message.includes('NetworkError')) {
                console.error('API Error:', error);
            }
            throw error;
        }
    }
    
    // ==================== AUTHENTICATION ====================
    
    /**
     * Check if backend is available
     */
    static async checkBackendAvailability() {
        // Return cached result if available
        if (backendAvailable !== null) {
            return backendAvailable;
        }
        
        // If check is in progress, wait for it
        if (backendCheckPromise) {
            return await backendCheckPromise;
        }
        
        // Perform health check with very short timeout
        backendCheckPromise = (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout - very fast
                
                // Try multiple endpoints to check backend availability
                const endpoints = [
                    `${API_BASE_URL}/email-verification?health=1`,
                    `${API_BASE_URL}/health`,
                    `${API_BASE_URL}/auth/login`
                ];
                
                // Try first endpoint (most reliable)
                let response;
                try {
                    response = await fetch(endpoints[0], {
                        method: 'GET',
                        signal: controller.signal,
                        cache: 'no-cache'
                    });
                } catch (e) {
                    // Try fallback endpoint
                    try {
                        response = await fetch(endpoints[1], {
                            method: 'GET',
                            signal: controller.signal,
                            cache: 'no-cache'
                        });
                    } catch (e2) {
                        // Try auth endpoint as last resort
                        response = await fetch(endpoints[2], {
                            method: 'GET',
                            signal: controller.signal,
                            cache: 'no-cache'
                        });
                    }
                }
                
                clearTimeout(timeoutId);
                
                // Check if response is valid
                if (response && response.ok) {
                    backendAvailable = true;
                    return true;
                }
                
                backendAvailable = false;
                return false;
            } catch (error) {
                // Quick failure detection - mark as unavailable
                backendAvailable = false;
                return false;
            } finally {
                backendCheckPromise = null;
            }
        })();
        
        return await backendCheckPromise;
    }
    
    /**
     * Verify email address using SMTP/MX records
     */
    static async verifyEmail(email) {
        // If backend verification is disabled, skip immediately
        if (!ENABLE_BACKEND_VERIFICATION) {
            return {
                valid: false,
                message: 'Email verification service disabled',
                error: true,
                unavailable: true
            };
        }
        
        // Check backend availability first (cache the result)
        // Only check once, then cache the result
        if (!backendCheckAttempted) {
            backendCheckAttempted = true;
            const isAvailable = await this.checkBackendAvailability();
            
            if (!isAvailable) {
                // Backend is not available, return immediately without trying
                return {
                    valid: false,
                    message: 'Email verification service unavailable',
                    error: true,
                    unavailable: true
                };
            }
        } else if (backendAvailable === false) {
            // Backend was already checked and is unavailable
            return {
                valid: false,
                message: 'Email verification service unavailable',
                error: true,
                unavailable: true
            };
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 second timeout
            
            const response = await fetch(`${API_BASE_URL}/email-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email }),
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle both success and error responses
            if (data.success && data.data) {
                return data.data;
            } else if (data.success) {
                return data;
            } else {
                return {
                    valid: false,
                    message: data.error || 'Email verification failed',
                    error: true
                };
            }
        } catch (error) {
            // Mark backend as unavailable if request fails
            if (error.name === 'AbortError' || error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
                backendAvailable = false; // Cache failure
            }
            
            // Handle AbortError (timeout) silently
            if (error.name === 'AbortError') {
                return {
                    valid: false,
                    message: 'Email verification service unavailable',
                    error: true,
                    unavailable: true,
                    timeout: true
                };
            }
            
            // Silently handle connection errors (backend not available)
            // Only log if it's not a network error
            if (error.message && !error.message.includes('Failed to fetch') && !error.message.includes('ERR_CONNECTION_REFUSED') && !error.message.includes('NetworkError')) {
                console.warn('Email verification API error:', error);
            }
            
            // Return error result for graceful fallback
            return {
                valid: false,
                message: 'Email verification service unavailable',
                error: true,
                unavailable: true // Flag to indicate backend is not available
            };
        }
    }
    
    /**
     * Login user
     */
    static async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }
    
    /**
     * Register new patient
     */
    static async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    /**
     * Recover password (sends reset link by default)
     * @param {string} email User email
     * @param {boolean} sendResetLink If true, sends reset link; if false, sends password directly
     */
    static async recoverPassword(email, sendResetLink = true) {
        return this.request('/auth/recover', {
            method: 'POST',
            body: JSON.stringify({ 
                email,
                send_reset_link: sendResetLink
            })
        });
    }
    
    /**
     * Reset password using token
     * @param {string} token Reset token
     * @param {string} newPassword New password
     */
    static async resetPassword(token, newPassword) {
        return this.request('/auth/reset', {
            method: 'POST',
            body: JSON.stringify({
                token,
                new_password: newPassword
            })
        });
    }
    
    /**
     * Verify reset token
     * @param {string} token Reset token
     */
    static async verifyResetToken(token) {
        return this.request('/auth/verify-reset-token', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }
    
    /**
     * Logout user
     */
    static logout() {
        this.removeToken();
        sessionStorage.removeItem('currentUser');
        window.location.href = '/legacy/login/login.html';
    }
    
    // ==================== APPOINTMENTS ====================
    
    /**
     * Get all appointments or filter by patient/doctor
     */
    static async getAppointments(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/appointments?${queryParams}` : '/appointments';
        return this.request(endpoint);
    }
    
    /**
     * Get appointments by patient ID
     */
    static async getAppointmentsByPatient(patientId) {
        return this.request(`/appointments?patient_id=${patientId}`);
    }
    
    /**
     * Create new appointment
     */
    static async createAppointment(appointmentData) {
        return this.request('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    }
    
    /**
     * Update appointment
     */
    static async updateAppointment(id, updates) {
        return this.request(`/appointments?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    /**
     * Delete appointment
     */
    static async deleteAppointment(id) {
        return this.request(`/appointments?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== DOCTORS ====================
    
    /**
     * Get all doctors
     */
    static async getDoctors(availableOnly = false) {
        const query = availableOnly ? '?available=true' : '';
        return this.request(`/doctors${query}`);
    }
    
    /**
     * Get doctor by ID
     */
    static async getDoctorById(id) {
        return this.request(`/doctors?id=${id}`);
    }
    
    /**
     * Create new doctor
     */
    static async createDoctor(doctorData) {
        return this.request('/doctors', {
            method: 'POST',
            body: JSON.stringify(doctorData)
        });
    }
    
    /**
     * Update doctor
     */
    static async updateDoctor(id, updates) {
        return this.request(`/doctors?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    /**
     * Delete doctor
     */
    static async deleteDoctor(id) {
        return this.request(`/doctors?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== SERVICES ====================
    
    /**
     * Get all services
     */
    static async getServices() {
        return this.request('/services');
    }
    
    /**
     * Get service by ID
     */
    static async getServiceById(id) {
        return this.request(`/services?id=${id}`);
    }
    
    /**
     * Create new service
     */
    static async createService(serviceData) {
        return this.request('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData)
        });
    }
    
    /**
     * Update service
     */
    static async updateService(id, updates) {
        return this.request(`/services?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    /**
     * Delete service
     */
    static async deleteService(id) {
        return this.request(`/services?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== PATIENTS ====================
    
    /**
     * Get all patients
     */
    static async getPatients() {
        return this.request('/patients');
    }
    
    /**
     * Get patient by ID
     */
    static async getPatientById(id) {
        return this.request(`/patients?id=${id}`);
    }
    
    /**
     * Create new patient
     */
    static async createPatient(patientData) {
        return this.request('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
    }
    
    /**
     * Update patient
     */
    static async updatePatient(id, updates) {
        return this.request(`/patients?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    /**
     * Delete patient
     */
    static async deletePatient(id) {
        return this.request(`/patients?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== SCHEDULES ====================
    
    /**
     * Get all schedules or filter by doctor
     */
    static async getSchedules(doctorId = null) {
        const query = doctorId ? `?doctor_id=${doctorId}` : '';
        return this.request(`/schedules${query}`);
    }
    
    /**
     * Get schedules by doctor ID
     */
    static async getSchedulesByDoctor(doctorId) {
        return this.request(`/schedules?doctor_id=${doctorId}`);
    }
    
    /**
     * Create new schedule
     */
    static async createSchedule(scheduleData) {
        return this.request('/schedules', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
    }
    
    /**
     * Update schedule
     */
    static async updateSchedule(id, updates) {
        return this.request(`/schedules?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    /**
     * Delete schedule
     */
    static async deleteSchedule(id) {
        return this.request(`/schedules?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== MEDICAL HISTORY ====================
    
    /**
     * Get medical history by patient
     */
    static async getMedicalHistoryByPatient(patientId) {
        return this.request(`/medical-history?patient_id=${patientId}`);
    }
    
    /**
     * Create medical history record
     */
    static async createMedicalHistory(recordData) {
        return this.request('/medical-history', {
            method: 'POST',
            body: JSON.stringify(recordData)
        });
    }
    
    /**
     * Update medical history record
     */
    static async updateMedicalHistory(id, updates) {
        return this.request(`/medical-history?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    /**
     * Delete medical history record
     */
    static async deleteMedicalHistory(id) {
        return this.request(`/medical-history?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== SESSION IMAGES ====================
    
    /**
     * Get session images by patient
     */
    static async getSessionImagesByPatient(patientId) {
        return this.request(`/session-images?patient_id=${patientId}`);
    }
    
    /**
     * Upload session image
     */
    static async createSessionImage(imageData) {
        return this.request('/session-images', {
            method: 'POST',
            body: JSON.stringify(imageData)
        });
    }
    
    /**
     * Update session image
     */
    static async updateSessionImage(id, updates) {
        return this.request(`/session-images?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    /**
     * Delete session image
     */
    static async deleteSessionImage(id) {
        return this.request(`/session-images?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== PROMOTIONS ====================
    
    /**
     * Get all promotions
     */
    static async getPromos(activeOnly = false) {
        const query = activeOnly ? '?active=true' : '';
        return this.request(`/promotions${query}`);
    }
    
    /**
     * Create promotion
     */
    static async createPromo(promoData) {
        return this.request('/promotions', {
            method: 'POST',
            body: JSON.stringify(promoData)
        });
    }
    
    /**
     * Update promotion
     */
    static async updatePromo(id, updates) {
        return this.request(`/promotions?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    /**
     * Delete promotion
     */
    static async deletePromo(id) {
        return this.request(`/promotions?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // ==================== CLINIC SCHEDULE ====================
    
    /**
     * Get clinic schedule
     */
    static async getClinicSchedule(day = null) {
        const query = day ? `?day=${day}` : '';
        return this.request(`/clinic-schedule${query}`);
    }
    
    /**
     * Update clinic schedule
     */
    static async updateClinicSchedule(day, updates) {
        return this.request(`/clinic-schedule?day=${day}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}

