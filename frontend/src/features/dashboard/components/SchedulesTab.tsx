import { useState, useEffect } from 'react';
import { useSchedules } from '@/hooks/useSchedules';
import { useDoctors } from '@/hooks/useDoctors';
import { StorageService } from '@/lib/storage';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import type { Schedule } from '@/hooks/useSchedules';
import type { DoctorProfile } from '@/types/user';

interface SchedulesTabProps {
  role?: 'admin' | 'staff';
}

export function SchedulesTab({ role = 'staff' }: SchedulesTabProps) {
  const { schedules, loadSchedules, createSchedule, updateSchedule, deleteSchedule } = useSchedules();
  const { doctors } = useDoctors();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
  };

  const handleDelete = (schedule: Schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!scheduleToDelete) return;

    const result = deleteSchedule(scheduleToDelete.id);
    if (result.success) {
      setShowDeleteModal(false);
      setScheduleToDelete(null);
      loadSchedules();
    } else {
      alert(result.message || 'Failed to delete schedule');
    }
  };

  // Group schedules by doctor - matching legacy logic exactly
  const schedulesByDoctor = doctors.map((doctor) => {
    const doctorSchedules = schedules.filter((s) => s.doctorId === doctor.id);
    
    // Sort schedules by day of week - matching legacy logic
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedSchedules = doctorSchedules.sort((a, b) => {
      const dayA = dayOrder.indexOf(a.day);
      const dayB = dayOrder.indexOf(b.day);
      return dayA - dayB;
    });

    return {
      doctor,
      schedules: sortedSchedules,
    };
  });

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  // Calculate statistics
  const totalSchedules = schedules.length;
  const uniqueDoctors = new Set(schedules.map(s => s.doctorId)).size;

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Schedules</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage dentist schedules and availability</p>
        </div>
        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Schedule
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {schedules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Schedules</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalSchedules}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 border border-purple-200 dark:border-purple-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Dentists Scheduled</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{uniqueDoctors}</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedules List - Enhanced grouped layout */}
      {schedulesByDoctor.length === 0 || schedulesByDoctor.every((g) => g.schedules.length === 0) ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Schedules Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding schedules for your dentists</p>
          {(role === 'admin' || role === 'staff') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              + Add Your First Schedule
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {schedulesByDoctor.map(({ doctor, schedules: doctorSchedules }) => (
            <div key={doctor.id} className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-500 overflow-hidden transition-all">
              {/* Schedule Group Header - Enhanced */}
              <div className="bg-gradient-to-r from-gold-500 to-gold-400 px-6 py-5 border-b-2 border-gold-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">{doctor.name}</h3>
                    {doctor.specialty && (
                      <p className="text-sm text-black/70 font-medium">{doctor.specialty}</p>
                    )}
                  </div>
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-black/10 rounded-full text-xs font-bold text-black">
                      {doctorSchedules.length} {doctorSchedules.length === 1 ? 'Schedule' : 'Schedules'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule Items */}
              <div className="p-6">
                {doctorSchedules.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No schedules set for this dentist</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doctorSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="bg-white dark:bg-black-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-gold-300 dark:hover:border-gold-500 transition-all transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{schedule.day}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                          </div>
                        </div>
                        {(role === 'admin' || role === 'staff') && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => handleEdit(schedule)}
                              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-black-900 hover:bg-gray-200 dark:hover:bg-black-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(schedule)}
                              className="flex-1 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Schedule Modal (Admin only) */}
      {(role === 'admin' || role === 'staff') && (
        <CreateScheduleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadSchedules();
            setShowCreateModal(false);
          }}
          doctors={doctors}
          schedules={schedules}
          createSchedule={createSchedule}
        />
      )}

      {/* Edit Schedule Modal (Admin only) */}
      {(role === 'admin' || role === 'staff') && selectedSchedule && (
        <EditScheduleModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSchedule(null);
          }}
          schedule={selectedSchedule}
          doctors={doctors}
          schedules={schedules}
          updateSchedule={updateSchedule}
          onSuccess={() => {
            loadSchedules();
            setShowEditModal(false);
            setSelectedSchedule(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setScheduleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Schedule"
        message={`Are you sure you want to delete this schedule? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

// Create Schedule Modal Component
function CreateScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  doctors,
  schedules,
  createSchedule,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctors: DoctorProfile[];
  schedules: Schedule[];
  createSchedule: (schedule: Omit<Schedule, 'id'>) => { success: boolean; message?: string; data?: Schedule };
}) {
  const [formData, setFormData] = useState({
    doctorId: '',
    day: '',
    startTime: '',
    endTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        doctorId: '',
        day: '',
        startTime: '',
        endTime: '',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation - matching legacy logic exactly
      if (!formData.doctorId || !formData.day || !formData.startTime || !formData.endTime) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate time range - matching legacy logic
      if (formData.startTime >= formData.endTime) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      // Check for duplicate schedule (same doctor, same day) - matching legacy logic
      const existingSchedules = StorageService.getSchedulesByDoctor(formData.doctorId);
      const duplicate = existingSchedules.find((s) => s.day === formData.day);

      if (duplicate) {
        const doctor = StorageService.getDoctorById(formData.doctorId);
        setError(`${doctor?.name || 'This doctor'} already has a schedule for ${formData.day}`);
        setLoading(false);
        return;
      }

      const scheduleData: Omit<Schedule, 'id'> = {
        doctorId: formData.doctorId,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      const result = createSchedule(scheduleData);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to create schedule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Schedule" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dentist *</label>
          <select
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            required
          >
            <option value="">Select Dentist</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.specialty || 'No specialty'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Day of Week *</label>
          <select
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            required
          >
            <option value="">Select Day</option>
            {dayOptions.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Schedule Modal Component
function EditScheduleModal({
  isOpen,
  onClose,
  schedule,
  doctors,
  schedules,
  updateSchedule,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  doctors: DoctorProfile[];
  schedules: Schedule[];
  updateSchedule: (id: string, schedule: Partial<Schedule>) => { success: boolean; message?: string; data?: Schedule };
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    day: schedule.day || '',
    startTime: schedule.startTime || '',
    endTime: schedule.endTime || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        day: schedule.day || '',
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
      });
      setError(null);
    }
  }, [isOpen, schedule]);

  const doctor = StorageService.getDoctorById(schedule.doctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation - matching legacy logic exactly
      if (!formData.day || !formData.startTime || !formData.endTime) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate time range - matching legacy logic
      if (formData.startTime >= formData.endTime) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      // Check for duplicate schedule (same doctor, same day) - matching legacy logic
      const existingSchedules = StorageService.getSchedulesByDoctor(schedule.doctorId);
      const duplicate = existingSchedules.find((s) => s.id !== schedule.id && s.day === formData.day);

      if (duplicate) {
        setError(`${doctor?.name || 'This doctor'} already has a schedule for ${formData.day}`);
        setLoading(false);
        return;
      }

      const updates: Partial<Schedule> = {
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      const result = updateSchedule(schedule.id, updates);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to update schedule');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Dentist Schedule" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Read-only Doctor Display - matching legacy logic */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dentist</label>
          <input
            type="text"
            value={doctor ? `${doctor.name} - ${doctor.specialty || 'No specialty'}` : 'Unknown'}
            disabled
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This field cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Day of Week *</label>
          <select
            value={formData.day}
            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            required
          >
            <option value="">Select Day</option>
            {dayOptions.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

