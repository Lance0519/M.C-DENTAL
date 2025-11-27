import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { PatientProfile } from '@/types/user';

// Normalize patient data from API (snake_case to camelCase)
const normalizePatient = (raw: any): PatientProfile => ({
  id: raw.id,
  username: raw.username ?? '',
  email: raw.email ?? '',
  fullName: raw.full_name ?? raw.fullName ?? '',
  firstName: raw.first_name ?? raw.firstName ?? '',
  lastName: raw.last_name ?? raw.lastName ?? '',
  phone: raw.phone ?? raw.contact_number ?? '',
  dateOfBirth: raw.date_of_birth ?? raw.dateOfBirth ?? '',
  gender: raw.gender ?? '',
  address: raw.address ?? '',
  role: 'patient',
  profileImage: raw.profile_image ?? raw.profileImage ?? undefined,
  createdAt: raw.created_at ?? raw.createdAt ?? '',
  updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
});

export function usePatients() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPatients();
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      const normalized = (data as any[]).map(normalizePatient);
      setPatients(normalized);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const createPatient = async (patient: Partial<PatientProfile> & { fullName: string }) => {
    try {
      const response = await api.createPatient(patient);
      await loadPatients();
      return { success: true, data: response };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create patient';
      return { success: false, message };
    }
  };

  const updatePatient = async (id: string | number, patient: Partial<PatientProfile>) => {
    try {
      const response = await api.updatePatient(String(id), patient);
      await loadPatients();
      return { success: true, data: response };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update patient';
      return { success: false, message };
    }
  };

  const deletePatient = async (id: string | number) => {
    try {
      await api.deletePatient(String(id));
      await loadPatients();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete patient';
      return { success: false, message };
    }
  };

  return {
    patients,
    loading,
    error,
    loadPatients,
    createPatient,
    updatePatient,
    deletePatient
  };
}

