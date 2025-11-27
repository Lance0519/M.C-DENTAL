import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ClinicSchedule } from '@/types/user';

const defaultClinicSchedule: ClinicSchedule = {
  Monday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Thursday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Friday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Saturday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
  Sunday: { isOpen: false, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' }
};

export function useClinicSchedule() {
  const [clinicSchedule, setClinicSchedule] = useState<ClinicSchedule>(defaultClinicSchedule);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClinicSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Try to fetch from API - if endpoint doesn't exist, use defaults
      try {
        const response = await api.request('/clinic-schedule');
        const data = response?.data ?? response;
        
        // Transform array response to object format
        if (Array.isArray(data)) {
          const transformed: ClinicSchedule = { ...defaultClinicSchedule };
          data.forEach((item: any) => {
            const dayName = item.day_of_week as keyof ClinicSchedule;
            if (dayName && transformed[dayName]) {
              // Normalize time format (remove seconds if present)
              const normalizeTime = (time: string) => time ? time.substring(0, 5) : '';
              transformed[dayName] = {
                isOpen: item.is_open ?? true,
                startTime: normalizeTime(item.start_time ?? item.startTime ?? '09:00'),
                endTime: normalizeTime(item.end_time ?? item.endTime ?? '18:00'),
                breakStartTime: normalizeTime(item.break_start_time ?? item.breakStartTime ?? '12:00'),
                breakEndTime: normalizeTime(item.break_end_time ?? item.breakEndTime ?? '13:00'),
              };
            }
          });
          setClinicSchedule(transformed);
        } else if (data && typeof data === 'object') {
          setClinicSchedule({ ...defaultClinicSchedule, ...data });
        }
      } catch {
        // API endpoint may not exist yet, use defaults
        setClinicSchedule(defaultClinicSchedule);
      }
    } catch (err) {
      console.error('Error loading clinic schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clinic schedule');
      setClinicSchedule(defaultClinicSchedule);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinicSchedule();
  }, [loadClinicSchedule]);

  const updateClinicSchedule = async (schedule: ClinicSchedule) => {
    try {
      await api.request('/clinic-schedule', {
        method: 'PUT',
        body: JSON.stringify(schedule),
      });
      setClinicSchedule(schedule);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update clinic schedule';
      return { success: false, message };
    }
  };

  return {
    clinicSchedule,
    loading,
    error,
    loadClinicSchedule,
    updateClinicSchedule
  };
}

