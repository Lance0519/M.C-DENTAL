import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { DoctorProfile } from '@/types/user';

// Normalize doctor data from API (backend uses 'active', frontend uses 'available')
const normalizeDoctor = (raw: any): DoctorProfile => ({
  id: raw.id,
  name: raw.name,
  fullName: raw.full_name ?? raw.fullName ?? raw.name,
  specialty: raw.specialization ?? raw.specialty ?? '',
  available: raw.active ?? raw.available ?? true,
  profileImage: raw.profile_image_url ?? raw.profileImage ?? undefined,
});

export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getDoctors();
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      const normalized = (Array.isArray(data) ? data : []).map(normalizeDoctor);
      setDoctors(normalized);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const createDoctor = async (doctor: Partial<DoctorProfile> & { name: string }) => {
    try {
      // Convert frontend 'available' to backend 'active' and 'specialty' to 'specialization'
      const payload: any = {
        name: doctor.name,
        specialization: doctor.specialty,
        active: doctor.available ?? true,
      };
      await api.createDoctor(payload);
      await loadDoctors();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create doctor';
      return { success: false, message };
    }
  };

  const updateDoctor = async (id: string | number, doctor: Partial<DoctorProfile>) => {
    try {
      // Convert frontend 'available' to backend 'active' and 'specialty' to 'specialization'
      const payload: any = {};
      if (doctor.name !== undefined) payload.name = doctor.name;
      if (doctor.specialty !== undefined) payload.specialization = doctor.specialty;
      if (doctor.available !== undefined) payload.active = doctor.available;
      
      await api.updateDoctor(String(id), payload);
      await loadDoctors();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update doctor';
      return { success: false, message };
    }
  };

  const deleteDoctor = async (id: string | number) => {
    try {
      await api.deleteDoctor(String(id));
      await loadDoctors();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete doctor';
      return { success: false, message };
    }
  };

  return {
    doctors,
    loading,
    error,
    loadDoctors,
    createDoctor,
    updateDoctor,
    deleteDoctor
  };
}

