import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { StaffProfile } from '@/types/user';

const normalizeStaff = (raw: Record<string, any>): StaffProfile => ({
  id: raw.id,
  username: raw.username ?? '',
  email: raw.email ?? '',
  fullName: raw.full_name ?? raw.fullName ?? '',
  firstName: raw.first_name ?? raw.firstName ?? '',
  lastName: raw.last_name ?? raw.lastName ?? '',
  phone: raw.phone ?? raw.contact_number ?? '',
  role: raw.role ?? 'staff',
  jobTitle: (raw.job_title ?? raw.jobTitle) || null,
  dateCreated: raw.created_at ?? raw.dateCreated ?? '',
  profileImage: raw.profile_image ?? raw.profile_image_url ?? raw.profileImage ?? undefined,
});

export function useStaff() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getStaff();
      const data = Array.isArray(response) ? response : (response as { data?: unknown[] })?.data ?? [];
      const normalized = (data as Record<string, any>[]).map(normalizeStaff);
      console.log('Loaded staff data:', normalized.map(s => ({ id: s.id, name: s.fullName, jobTitle: s.jobTitle })));
      setStaff(normalized);
    } catch (err) {
      console.error('Error loading staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const createStaff = async (staffData: Omit<StaffProfile, 'id' | 'dateCreated' | 'role'> & { password: string }) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffData.email)) {
        return { success: false, message: 'Please enter a valid email address' };
      }

      const payload = {
        username: staffData.username,
        email: staffData.email,
        password: staffData.password,
        fullName: staffData.fullName,
        firstName: staffData.firstName || staffData.fullName.split(' ')[0] || staffData.fullName,
        lastName: staffData.lastName || staffData.fullName.split(' ').slice(1).join(' ') || '',
        phone: staffData.phone,
        jobTitle: staffData.jobTitle,
        role: 'staff',
      };
      if (staffData.profileImage) {
        payload.profileImage = staffData.profileImage;
      }

      const response = await api.createStaffMember(payload);
      await loadStaff();
      return { success: true, data: response };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create staff member';
      return { success: false, message };
    }
  };

  const updateStaff = async (id: string, updates: Partial<StaffProfile>) => {
    try {
      // Validate email format if email is being updated
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          return { success: false, message: 'Please enter a valid email address' };
        }
      }

      const payload: Record<string, unknown> = {};
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.fullName !== undefined) payload.fullName = updates.fullName;
      if (updates.firstName !== undefined) payload.firstName = updates.firstName;
      if (updates.lastName !== undefined) payload.lastName = updates.lastName;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.jobTitle !== undefined) payload.jobTitle = updates.jobTitle;
      if (updates.profileImage !== undefined) payload.profileImage = updates.profileImage;
      if (updates.profileImage !== undefined) payload.profileImage = updates.profileImage;

      const response = await api.updateStaffMember(id, payload);
      await loadStaff();

      // Update auth store if the updated staff member is the current user
      const authStore = useAuthStore.getState();
      if (authStore.user && authStore.user.id === id) {
        // Merge updates with current user, ensuring all fields are properly updated
        const updatedUser = {
          ...authStore.user,
          ...updates,
          // Ensure jobTitle is included if it was updated
          jobTitle: updates.jobTitle !== undefined ? updates.jobTitle : authStore.user.jobTitle,
        } as StaffProfile;
        authStore.setUser(updatedUser);
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update staff member';
      return { success: false, message };
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      await api.deleteStaffMember(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete staff member';
      return { success: false, message };
    }
  };

  return {
    staff,
    loading,
    error,
    loadStaff,
    createStaff,
    updateStaff,
    deleteStaff
  };
}
