import { useState, useEffect } from 'react';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { useServices } from '@/hooks/useServices';
import { useDoctors } from '@/hooks/useDoctors';
import type { PatientProfile } from '@/types/user';
import type { MedicalHistoryRecord } from '@/types/dashboard';

interface PatientHistoryTabProps {
  user: PatientProfile;
}

export function PatientHistoryTab({ user }: PatientHistoryTabProps) {
  const { medicalHistory, loading } = useMedicalHistory(user.id);
  const { services } = useServices();
  const { doctors } = useDoctors();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getDoctorName = (record: MedicalHistoryRecord): string => {
    if (record.doctorName) {
      return record.doctorName.startsWith('Dr. ') ? record.doctorName.substring(4) : record.doctorName.startsWith('Dr.') ? record.doctorName.substring(3) : record.doctorName;
    }
    if (record.doctorId) {
      const doctor = doctors.find((d) => d.id === record.doctorId);
      if (doctor) {
        const name = doctor.name || '';
        return name.startsWith('Dr. ') ? name.substring(4) : name.startsWith('Dr.') ? name.substring(3) : name;
      }
    }
    return 'Unknown';
  };

  const getServiceName = (record: MedicalHistoryRecord): string => {
    if (record.serviceName) return record.serviceName;
    if (record.serviceId) {
      const service = services.find((s) => s.id === record.serviceId);
      if (service) return service.name;
      if (record.serviceId === 'srv001') return 'Consultation';
    }
    return 'Service';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical History</h1>
      </div>

      {medicalHistory.length === 0 ? (
        <div className="bg-white dark:bg-black-900 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No medical history records found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {medicalHistory.map((record) => (
            <div
              key={record.id}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-500 transition-all p-6"
            >
              {/* Record Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatDate(record.date)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">at {formatTime(record.time)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{getServiceName(record)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Dr. {getDoctorName(record)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment and Remarks */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Treatment Notes:</div>
                  <div className="text-gray-900 dark:text-gray-100 bg-white dark:bg-black-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    {record.treatment}
                  </div>
                </div>
                {record.remarks && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Remarks:</div>
                    <div className="text-gray-900 dark:text-gray-100 bg-white dark:bg-black-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      {record.remarks}
                    </div>
                  </div>
                )}
              </div>

              {/* Medical Images */}
              {record.images && record.images.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Medical Images:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {record.images.map((imageUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-gold-400 dark:hover:border-gold-500 transition-all transform hover:scale-105"
                        onClick={() => setSelectedImage(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Medical record image ${idx + 1}`}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer transition-all duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Medical record image"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

