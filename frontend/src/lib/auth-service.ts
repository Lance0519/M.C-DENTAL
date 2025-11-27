import { api } from '@/lib/api';
import type { PatientProfile, StaffProfile, UserRole } from '@/types/user';

const SESSION_USER_KEY = 'currentUser';

export type AuthResult =
  | { success: true; user?: StaffProfile | PatientProfile }
  | { success: false; message: string };

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  password: string;
};

// Session management functions
const setCurrentUser = (user: StaffProfile | PatientProfile) => {
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
};

const getCurrentUser = (): (StaffProfile | PatientProfile) | null => {
  const value = sessionStorage.getItem(SESSION_USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    sessionStorage.removeItem(SESSION_USER_KEY);
    return null;
  }
};

const clearCurrentUser = () => {
  sessionStorage.removeItem(SESSION_USER_KEY);
};

export class AuthService {
  static async login(usernameOrEmail: string, password: string): Promise<AuthResult> {
    try {
      const response = await api.login(usernameOrEmail, password);

      if (!response?.user) {
        throw new Error('Invalid response from server.');
      }

      setCurrentUser(response.user);

      return { success: true, user: response.user };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid username/email or password.';

      return { success: false, message };
    }
  }

  static logout() {
    clearCurrentUser();
    api.logout();
  }

  static getCurrentUser() {
    return getCurrentUser();
  }

  static async register(payload: RegisterPayload): Promise<AuthResult> {
    try {
      const apiPayload = {
        ...payload,
        fullName: `${payload.firstName} ${payload.lastName}`.trim(),
      };

      await api.register(apiPayload);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed.';
      return { success: false, message };
    }
  }

  static async recoverPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.request<{ message?: string }>('/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ email, send_reset_link: true }),
      });

      const message =
        response?.message || 'Password recovery email sent. Please check your inbox.';

      return { success: true, message };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to process password recovery request.';

      return { success: false, message };
    }
  }

  static getDashboardPath(role: UserRole) {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'staff':
        return '/dashboard/staff';
      default:
        return '/dashboard/patient';
    }
  }
}
