import type { RegisterPayload } from '@/lib/auth-service';
import { AuthService } from '@/lib/auth-service';
import type { PatientProfile, StaffProfile } from '@/types/user';
import { create } from 'zustand';

type AuthState = {
  user: StaffProfile | PatientProfile | null;
  loading: boolean;
  error: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<AuthServiceReturn>;
  register: (payload: RegisterPayload) => Promise<AuthServiceReturn>;
  recoverPassword: (email: string) => Promise<AuthServiceReturn>;
  logout: () => void;
  setUser: (user: StaffProfile | PatientProfile | null) => void;
};

type AuthServiceReturn =
  | { success: true; data?: string }
  | { success: false; message: string };

export const useAuthStore = create<AuthState>((set) => ({
  user: AuthService.getCurrentUser(),
  loading: false,
  error: null,
  async login(usernameOrEmail, password) {
    set({ loading: true, error: null });
    try {
      const result = await AuthService.login(usernameOrEmail, password);
      if (result.success) {
        set({ user: result.user, loading: false });
        return { success: true };
      }
      set({ error: result.message, loading: false });
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Login failed', error);
      set({ error: 'Unexpected error occurred.', loading: false });
      return { success: false, message: 'Unexpected error occurred.' };
    }
  },
  async register(payload) {
    set({ loading: true, error: null });
    try {
      const result = await AuthService.register(payload);
      if (result.success) {
        set({ loading: false });
        return { success: true };
      }
      set({ error: result.message, loading: false });
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Registration failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred.';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },
  async recoverPassword(email) {
    set({ loading: true, error: null });
    try {
      const result = await AuthService.recoverPassword(email);
      if (result.success) {
        set({ loading: false });
        return { success: true, data: result.message };
      }
      set({ error: result.message, loading: false });
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Password recovery failed', error);
      set({ error: 'Unexpected error occurred.', loading: false });
      return { success: false, message: 'Unexpected error occurred.' };
    }
  },
  logout() {
    AuthService.logout();
    // Remove token from sessionStorage
    sessionStorage.removeItem('token');
    set({ user: null });
    // Dispatch custom event to notify all components
    window.dispatchEvent(new CustomEvent('userLogout'));
  },
  setUser(user) {
    set({ user });
    // Also update sessionStorage if user exists
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  }
}));
