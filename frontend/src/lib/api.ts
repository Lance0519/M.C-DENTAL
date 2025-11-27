/**
 * React API Client
 * TypeScript wrapper for backend API calls
 */

const getAPIBaseURL = (): string => {
  const w = window as any;
  const normalize = (url: string) => url.replace(/\/+$/, '');

  // Check for Vite environment variable first (for production builds)
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return normalize(envApiUrl);
  }

  // Check for runtime overrides
  const override =
    w.NEXT_API_BASE_URL || w.__NEXT_API_BASE_URL__ || localStorage.getItem('NEXT_API_BASE_URL');
  if (override) {
    return normalize(override);
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  if (protocol === 'file:') {
    return 'http://localhost:3000/api';
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Always use port 3000 for backend API in development
    return `${protocol}//${hostname}:3000/api`;
  }

  // For production: assume API is on same domain at /api
  if (port) {
    return `${protocol}//${hostname}:${port}/api`;
  }

  return `${protocol}//${hostname}/api`;
};

const API_BASE_URL = getAPIBaseURL();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

class ApiClient {
  private getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  setToken(token: string): void {
    sessionStorage.setItem('token', token);
  }

  removeToken(): void {
    sessionStorage.removeItem('token');
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return (data.data || data) as T;
    } catch (error) {
      if (error instanceof Error) {
        console.error('API Error:', error.message);
        throw error;
      }
      throw new Error('Unknown API error');
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    this.removeToken();
  }

  async register(payload: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Appointments
  async getAppointments(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/appointments${query}`);
  }

  async createAppointment(appointment: any) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
  }

  async updateAppointment(id: string | number, appointment: any) {
    return this.request(`/appointments?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
  }

  async deleteAppointment(id: string | number) {
    return this.request(`/appointments?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Patients
  async getPatients(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/patients${query}`);
  }

  async getPatient(id: string | number) {
    return this.request(`/patients?id=${id}`);
  }

  async createPatient(patient: any) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  }

  async updatePatient(id: string | number, patient: any) {
    return this.request(`/patients?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    });
  }

  async deletePatient(id: string | number) {
    return this.request(`/patients?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Services
  async getServices() {
    return this.request('/services');
  }

  async getService(id: string | number) {
    return this.request(`/services?id=${id}`);
  }

  async createService(service: any) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
  }

  async updateService(id: string | number, service: any) {
    return this.request(`/services?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
  }

  async deleteService(id: string | number) {
    return this.request(`/services?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Doctors
  async getDoctors() {
    return this.request('/doctors');
  }

  async getDoctor(id: string | number) {
    return this.request(`/doctors?id=${id}`);
  }

  async createDoctor(doctor: any) {
    return this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctor),
    });
  }

  async updateDoctor(id: string | number, doctor: any) {
    return this.request(`/doctors?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctor),
    });
  }

  async deleteDoctor(id: string | number) {
    return this.request(`/doctors?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Staff
  async getStaff() {
    return this.request('/staff');
  }

  async getStaffMember(id: string | number) {
    return this.request(`/staff?id=${id}`);
  }

  async createStaffMember(staff: any) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
  }

  async updateStaffMember(id: string | number, staff: any) {
    return this.request(`/staff?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(staff),
    });
  }

  async deleteStaffMember(id: string | number) {
    return this.request(`/staff?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getStatistics() {
    return this.request('/statistics');
  }

  // Reports
  async getReports(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/reports${query}`);
  }

  // Schedules
  async getSchedules(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/schedules${query}`);
  }

  async updateSchedule(id: string | number, schedule: any) {
    return this.request(`/schedules?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    });
  }

  // Promotions
  async getPromotions(params?: { active?: boolean }) {
    const query = params?.active ? '?active=true' : '';
    return this.request(`/promotions${query}`);
  }

  async createPromotion(promo: any) {
    return this.request('/promotions', {
      method: 'POST',
      body: JSON.stringify(promo),
    });
  }

  async updatePromotion(id: string | number, promo: any) {
    return this.request(`/promotions?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(promo),
    });
  }

  async deletePromotion(id: string | number) {
    return this.request(`/promotions?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Medical History
  async getMedicalHistory(patientId?: string) {
    const query = patientId ? `?patient_id=${patientId}` : '';
    return this.request(`/medical-history${query}`);
  }

  async createMedicalHistory(record: any) {
    return this.request('/medical-history', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async updateMedicalHistory(id: string | number, updates: any) {
    return this.request(`/medical-history?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMedicalHistory(id: string | number) {
    return this.request(`/medical-history?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Profile
  async updateProfile(data: any) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return this.request('/profile', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Generic GET method
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API GET Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Generic POST method
  async post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API POST Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Claim Account
  async checkClaimableAccount(email: string): Promise<ApiResponse<{ found: boolean; fullName: string; email: string; canClaim: boolean }>> {
    return this.get(`/auth/claim-account?email=${encodeURIComponent(email)}`);
  }

  async claimAccount(email: string, newPassword: string): Promise<ApiResponse<{ claimed: boolean; username: string; email: string }>> {
    return this.post('/auth/claim-account', { email, newPassword });
  }
}

export const api = new ApiClient();
export default api;

