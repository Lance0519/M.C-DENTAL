import { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import type { ClinicSchedule } from '@/types/user';
import { SuccessModal } from '@/components/modals/SuccessModal';

interface ClinicScheduleTabProps {
  role?: 'admin' | 'staff';
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function ClinicScheduleTab({ role: _role = 'staff' }: ClinicScheduleTabProps) {
  const [clinicSchedule, setClinicSchedule] = useState<ClinicSchedule | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadClinicSchedule();
    
    // Listen for storage updates
    const handleStorageUpdate = () => {
      loadClinicSchedule();
    };
    window.addEventListener('clinicDataUpdated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    
    return () => {
      window.removeEventListener('clinicDataUpdated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const loadClinicSchedule = () => {
    const schedule = StorageService.getClinicSchedule();
    setClinicSchedule(schedule);
    setHasChanges(false);
  };

  const handleToggleDay = (day: keyof ClinicSchedule) => {
    if (!clinicSchedule) return;
    
    const updatedSchedule = {
      ...clinicSchedule,
      [day]: {
        ...clinicSchedule[day],
        isOpen: !clinicSchedule[day].isOpen,
      },
    };
    
    setClinicSchedule(updatedSchedule);
    setHasChanges(true);
  };

  const handleTimeChange = (
    day: keyof ClinicSchedule,
    timeType: 'startTime' | 'endTime' | 'breakStartTime' | 'breakEndTime',
    value: string
  ) => {
    if (!clinicSchedule) return;
    
    const updatedSchedule = {
      ...clinicSchedule,
      [day]: {
        ...clinicSchedule[day],
        [timeType]: value,
      },
    };
    
    setClinicSchedule(updatedSchedule);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!clinicSchedule || !hasChanges) return;
    
    setIsSaving(true);
    try {
      StorageService.updateClinicSchedule(clinicSchedule);
      setHasChanges(false);
      setShowSuccessModal(true);
      
      // Trigger data sync event
      window.dispatchEvent(new Event('clinicDataUpdated'));
      
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving clinic schedule:', error);
      alert('Failed to save clinic schedule. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes? This will restore the current saved schedule.')) {
      loadClinicSchedule();
    }
  };

  const openDaysCount = clinicSchedule 
    ? Object.values(clinicSchedule).filter((day) => day.isOpen).length 
    : 0;

  if (!clinicSchedule) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500 dark:text-gray-400">
        Loading clinic schedule...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Save/Reset */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Clinic Operating Hours</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage the clinic's daily opening, closing, and break times.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              <span className="font-semibold">{openDaysCount}</span> days open per week.
            </p>
          </div>
          {hasChanges && (
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                disabled={isSaving}
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.032 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info Banner */}
        {hasChanges && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">You have unsaved changes</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Click "Save Changes" to apply your updates to the clinic schedule.</p>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedule = clinicSchedule[day];
            const isOpen = daySchedule.isOpen;

            return (
              <div
                key={day}
                className={`bg-white dark:bg-black-800 rounded-xl shadow-md hover:shadow-lg transition-all border-2 ${
                  isOpen
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Day Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{day}</h3>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          isOpen
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOpen}
                          onChange={() => handleToggleDay(day)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 dark:peer-focus:ring-gold-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Time Settings (only show if open) */}
                {isOpen && (
                  <div className="p-4 space-y-4">
                    {/* Opening/Closing Times */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`${day}-open`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Opening Time
                        </label>
                        <input
                          type="time"
                          id={`${day}-open`}
                          value={daySchedule.startTime}
                          onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                          className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-gold-500 focus:ring-gold-500"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${day}-close`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Closing Time
                        </label>
                        <input
                          type="time"
                          id={`${day}-close`}
                          value={daySchedule.endTime}
                          onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                          className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-gold-500 focus:ring-gold-500"
                        />
                      </div>
                    </div>

                    {/* Break Times */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Break Time (Optional)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor={`${day}-break-start`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Break Start
                          </label>
                          <input
                            type="time"
                            id={`${day}-break-start`}
                            value={daySchedule.breakStartTime || ''}
                            onChange={(e) => handleTimeChange(day, 'breakStartTime', e.target.value)}
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-gold-500 focus:ring-gold-500"
                          />
                        </div>
                        <div>
                          <label htmlFor={`${day}-break-end`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Break End
                          </label>
                          <input
                            type="time"
                            id={`${day}-break-end`}
                            value={daySchedule.breakEndTime || ''}
                            onChange={(e) => handleTimeChange(day, 'breakEndTime', e.target.value)}
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-gold-500 focus:ring-gold-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Appointments cannot be booked during break time.</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Clinic schedule updated successfully!"
      />
    </>
  );
}

