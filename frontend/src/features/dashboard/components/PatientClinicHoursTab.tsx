import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatTime } from '@/lib/utils';
import type { ClinicSchedule } from '@/types/user';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function PatientClinicHoursTab() {
    const [clinicSchedule, setClinicSchedule] = useState<ClinicSchedule | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadClinicHours = async () => {
            try {
                const response = await api.getClinicSchedule();
                const scheduleData = Array.isArray(response) ? response : [];

                // Transform API response to ClinicSchedule format
                const schedule: ClinicSchedule = {
                    Monday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Thursday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Friday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Saturday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Sunday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                };

                scheduleData.forEach((day: any) => {
                    const rawDay = day.day || day.day_of_week;
                    const dayName = (typeof rawDay === 'string' ? rawDay.trim() : rawDay) as keyof ClinicSchedule;

                    if (schedule[dayName]) {
                        schedule[dayName] = {
                            isOpen: day.isOpen ?? day.is_open ?? false,
                            startTime: day.startTime ?? day.start_time ?? '09:00',
                            endTime: day.endTime ?? day.end_time ?? '18:00',
                            breakStartTime: day.breakStartTime ?? day.break_start_time ?? '12:00',
                            breakEndTime: day.breakEndTime ?? day.break_end_time ?? '13:00',
                        };
                    }
                });

                setClinicSchedule(schedule);
            } catch (error) {
                console.error('Error loading clinic hours:', error);
                // Set default schedule on error (matching other components)
                setClinicSchedule({
                    Monday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Thursday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Friday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Saturday: { isOpen: true, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    Sunday: { isOpen: false, startTime: '09:00', endTime: '18:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                });
            } finally {
                setLoading(false);
            }
        };
        loadClinicHours();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clinic Hours</h1>
                <p className="text-gray-600 dark:text-gray-400">View our operating hours and schedule.</p>
            </div>

            <div className="bg-white dark:bg-black-800 rounded-xl shadow-lg border-2 border-gold-200 dark:border-gold-800 overflow-hidden max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-gold-500 to-gold-400 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-xl font-bold text-black">Weekly Schedule</h2>
                    </div>
                    <p className="text-black/70 text-sm mt-1 font-medium">*Hours are subject to change</p>
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {DAYS_OF_WEEK.map((day) => {
                            const daySchedule = clinicSchedule?.[day];
                            const isOpen = daySchedule?.isOpen;

                            return (
                                <div
                                    key={day}
                                    className={`flex items-center justify-between p-4 rounded-lg border-l-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isOpen
                                        ? 'border-green-500 bg-green-50/30 dark:bg-green-900/10'
                                        : 'border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="font-bold text-gray-900 dark:text-gray-100 w-28">{day}</span>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        {isOpen ? (
                                            <>
                                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                                    {formatTime(daySchedule.startTime)} - {formatTime(daySchedule.endTime)}
                                                </span>
                                                {daySchedule.breakStartTime && daySchedule.breakEndTime && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Break: {formatTime(daySchedule.breakStartTime)} - {formatTime(daySchedule.breakEndTime)}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="font-medium text-gray-500 dark:text-gray-400 italic">Closed</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
