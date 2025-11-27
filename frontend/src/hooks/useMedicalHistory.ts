import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { MedicalHistoryRecord } from '@/types/dashboard';

export function useMedicalHistory(patientId?: string) {
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : '';
      const response = await api.request<MedicalHistoryRecord[] | { data?: MedicalHistoryRecord[] }>(
        `/medical-history${query}`,
      );
      const records =
        Array.isArray(response) ? response : (response as { data?: MedicalHistoryRecord[] }).data ?? [];

      // Sort by date and time (most recent first)
      const sorted = [...records].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return dateB - dateA;
      });

      setMedicalHistory(sorted);
    } catch (err) {
      console.error('Error loading medical history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load medical history');
      setMedicalHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicalHistory();
  }, [patientId]);

  const createMedicalHistory = async (record: Omit<MedicalHistoryRecord, 'id' | 'createdAt'>) => {
    try {
      const response = await api.request<MedicalHistoryRecord>('/medical-history', {
        method: 'POST',
        body: JSON.stringify(record),
      });
      await loadMedicalHistory();
      return { success: true, data: response };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create medical history record';
      return { success: false, message };
    }
  };

  const updateMedicalHistory = async (recordId: string, updates: Partial<MedicalHistoryRecord>) => {
    try {
      const response = await api.request<MedicalHistoryRecord>(`/medical-history?id=${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      await loadMedicalHistory();
      return { success: true, data: response };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update medical history record';
      return { success: false, message };
    }
  };

  const deleteMedicalHistory = async (recordId: string) => {
    try {
      await api.request(`/medical-history?id=${recordId}`, {
        method: 'DELETE',
      });
      await loadMedicalHistory();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete medical history record';
      return { success: false, message };
    }
  };

  return {
    medicalHistory,
    loading,
    error,
    loadMedicalHistory,
    createMedicalHistory,
    updateMedicalHistory,
    deleteMedicalHistory,
  };
}

