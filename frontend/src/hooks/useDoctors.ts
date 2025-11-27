import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { DoctorProfile } from '@/types/user';

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
      setDoctors(Array.isArray(data) ? data : []);
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
      await api.createDoctor(doctor);
      await loadDoctors();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create doctor';
      return { success: false, message };
    }
  };

  const updateDoctor = async (id: string | number, doctor: Partial<DoctorProfile>) => {
    try {
      await api.updateDoctor(String(id), doctor);
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

