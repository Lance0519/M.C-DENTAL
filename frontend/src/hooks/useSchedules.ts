import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Schedule {
  id: string;
  doctorId: string;
  day: string;
  startTime: string;
  endTime: string;
}

// Normalize time format (remove seconds if present: "09:00:00" -> "09:00")
const normalizeTime = (time: string | null | undefined): string => {
  if (!time) return '';
  return time.substring(0, 5);
};

// Convert day_of_week number (1-7) to day name
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeDayOfWeek = (dayValue: any): string => {
  // If it's already a string day name, return it
  if (typeof dayValue === 'string' && isNaN(Number(dayValue))) {
    return dayValue;
  }
  // If it's a number (1-7), convert to day name
  const dayNum = typeof dayValue === 'number' ? dayValue : parseInt(dayValue, 10);
  if (dayNum >= 1 && dayNum <= 7) {
    return DAY_NAMES[dayNum];
  }
  return String(dayValue);
};

const normalizeSchedule = (raw: any): Schedule => ({
  id: raw.id,
  doctorId: raw.doctor_id ?? raw.doctorId,
  day: normalizeDayOfWeek(raw.day_of_week ?? raw.day ?? raw.dayOfWeek ?? ''),
  startTime: normalizeTime(raw.start_time ?? raw.startTime),
  endTime: normalizeTime(raw.end_time ?? raw.endTime),
});

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSchedules();
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      const normalized = (data as any[]).map(normalizeSchedule);
      setSchedules(normalized);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const createSchedule = async (schedule: Omit<Schedule, 'id'>) => {
    try {
      const payload = {
        doctorId: schedule.doctorId,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      };
      const response = await api.request('/schedules', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await loadSchedules();
      return { success: true, data: response };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create schedule';
      return { success: false, message };
    }
  };

  const updateSchedule = async (id: string, schedule: Partial<Schedule>) => {
    try {
      const payload: Record<string, any> = {};
      if (schedule.doctorId !== undefined) payload.doctorId = schedule.doctorId;
      if (schedule.day !== undefined) payload.day = schedule.day;
      if (schedule.startTime !== undefined) payload.startTime = schedule.startTime;
      if (schedule.endTime !== undefined) payload.endTime = schedule.endTime;

      await api.updateSchedule(id, payload);
      await loadSchedules();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update schedule';
      return { success: false, message };
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await api.request(`/schedules?id=${id}`, { method: 'DELETE' });
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete schedule';
      return { success: false, message };
    }
  };

  return {
    schedules,
    loading,
    error,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule
  };
}
