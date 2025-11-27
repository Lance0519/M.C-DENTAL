import { useState, useEffect } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { useAppointments } from '@/hooks/useAppointments';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { useServices } from '@/hooks/useServices';
import { useDoctors } from '@/hooks/useDoctors';
import { Modal } from '@/components/modals/Modal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import { PatientImageGallery } from '@/components/PatientImageGallery';
import { useAuthStore } from '@/store/auth-store';
import type { PatientProfile } from '@/types/user';
import type { Appointment, MedicalHistoryRecord } from '@/types/dashboard';

interface PatientsTabProps {
  role?: 'admin' | 'staff';
}

export function PatientsTab({ role = 'staff' }: PatientsTabProps) {
  const { patients, loadPatients, createPatient, updatePatient } = usePatients();
  const { appointments, loadAppointments } = useAppointments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateSuccessModal, setShowCreateSuccessModal] = useState(false);

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Filter patients based on search query - matching legacy logic exactly
  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const fullName = patient.fullName?.toLowerCase() || '';
    const firstName = patient.firstName?.toLowerCase() || '';
    const lastName = patient.lastName?.toLowerCase() || '';
    const email = patient.email?.toLowerCase() || '';
    const phone = patient.phone?.toLowerCase() || '';
    const username = patient.username?.toLowerCase() || '';
    const id = patient.id?.toLowerCase() || '';

    return (
      fullName.includes(q) ||
      firstName.includes(q) ||
      lastName.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      username.includes(q) ||
      id.includes(q)
    );
  });

  // Get upcoming appointments for a patient - matching legacy logic
  const getUpcomingAppointments = (patientId: string): Appointment[] => {
    const patientAppointments = appointments.filter((apt) => apt.patientId === patientId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return patientAppointments.filter((apt) => {
      const aptDate = apt.date || (apt as any).appointmentDate;
      if (!aptDate) return false;

      const appointmentDate = new Date(aptDate);
      appointmentDate.setHours(0, 0, 0, 0);

      return appointmentDate >= today && apt.status !== 'cancelled';
    });
  };

  const handleViewProfile = (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setShowProfileModal(true);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
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

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Calculate statistics
  const totalPatients = patients.length;
  const patientsWithUpcoming = patients.filter(p => getUpcomingAppointments(p.id || '').length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Patients</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage patient records and information</p>
        </div>
        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {patients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalPatients}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">With Upcoming Appointments</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{patientsWithUpcoming}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients by name, email, phone, username, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-5 py-4 pl-12 pr-12 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-4 focus:ring-gold-500/20 dark:focus:ring-gold-400/20 transition-all shadow-sm hover:shadow-md placeholder-gray-400 dark:placeholder-gray-500"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Patients List - Enhanced */}
      {filteredPatients.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No Patients Found' : 'No Patients Yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first patient'}
          </p>
          {searchQuery ? (
            <button
              onClick={clearSearch}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Clear Search
            </button>
          ) : (role === 'admin' || role === 'staff') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              + Add Your First Patient
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => {
            const upcomingAppts = getUpcomingAppointments(patient.id || '');

            return (
              <div
                key={patient.id}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-500 overflow-hidden transform hover:-translate-y-1"
              >
                {/* Patient Card Header - Enhanced */}
                <div className="bg-gradient-to-r from-gold-500 to-gold-400 px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Patient Avatar */}
                      {patient.profileImage ? (
                        <img
                          src={patient.profileImage}
                          alt={patient.fullName}
                          className="w-16 h-16 rounded-full object-cover shadow-lg border-4 border-black/20 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center text-2xl font-bold text-black shadow-lg border-4 border-black/20 flex-shrink-0">
                          {patient.fullName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-black truncate">{patient.fullName}</h3>
                        <p className="text-sm text-black/70 font-medium">ID: {patient.id}</p>
                      </div>
                    </div>
                    {upcomingAppts.length > 0 && (
                      <span className="px-3 py-1 bg-black/20 text-black text-xs font-bold rounded-full flex-shrink-0">
                        {upcomingAppts.length} upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Patient Card Body - matching legacy info grid */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Email</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate" title={patient.email || 'N/A'}>
                        {patient.email || 'N/A'}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate" title={patient.phone || 'N/A'}>
                        {patient.phone || 'N/A'}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Date of Birth</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate" title={formatDate(patient.dateOfBirth || '')}>
                        {formatDate(patient.dateOfBirth || '')}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Address</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate" title={patient.address || 'N/A'}>
                        {patient.address || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Card Actions */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleViewProfile(patient)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow hover:shadow-md transition"
                  >
                    View Full Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <PatientProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          onUpdate={loadPatients}
          onUpdatePatient={updatePatient}
          role={role}
        />
      )}

      {/* Create Patient Modal (Admin only) */}
      {(role === 'admin' || role === 'staff') && (
        <CreatePatientModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            await loadPatients();
            setShowCreateModal(false);
            setShowCreateSuccessModal(true);
          }}
          onCreate={createPatient}
        />
      )}

      {/* Success Modal for Patient Creation */}
      <SuccessModal
        isOpen={showCreateSuccessModal}
        onClose={() => setShowCreateSuccessModal(false)}
        title="Patient Created!"
        message="New patient has been successfully added to the system."
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
}

// Patient Profile Modal Component
function PatientProfileModal({
  isOpen,
  onClose,
  patient,
  onUpdate,
  onUpdatePatient,
  role = 'staff',
}: {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onUpdate: () => void | Promise<void>;
  onUpdatePatient: (id: string, updates: Partial<PatientProfile>) => Promise<{ success: boolean; message?: string }>;
  role?: 'admin' | 'staff';
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'images'>('info');
  const currentUser = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: patient.fullName || '',
    email: patient.email || '',
    phone: patient.phone || '',
    dateOfBirth: patient.dateOfBirth || '',
    gender: patient.gender || '',
    address: patient.address || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Medical history
  const { medicalHistory, createMedicalHistory, loadMedicalHistory } = useMedicalHistory(patient.id);
  const { services } = useServices();
  const { doctors } = useDoctors();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await onUpdatePatient(patient.id || '', formData);
      if (result.success) {
        await onUpdate();
        setIsEditing(false);
        setShowSuccessModal(true);
      } else {
        setError(result.message || 'Failed to update patient');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      // Medical history will load automatically via useMedicalHistory hook
    }
  }, [isOpen, activeTab]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Patient Profile - ${patient.fullName}`} size="xl">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'info'
              ? 'text-gold-600 dark:text-gold-400 border-gold-500 dark:border-gold-400'
              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Personal Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'text-gold-600 dark:text-gold-400 border-gold-500 dark:border-gold-400'
              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Medical History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'images'
              ? 'text-gold-600 dark:text-gold-400 border-gold-500 dark:border-gold-400'
              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Images
        </button>
      </div>

      {activeTab === 'info' ? (
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Profile Picture */}
          <div className="flex justify-center mb-6">
            {patient.profileImage ? (
              <img
                src={patient.profileImage}
                alt={patient.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-gold-500 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gold-500 flex items-center justify-center text-black font-bold text-3xl border-4 border-gold-600 shadow-lg">
                {patient.fullName?.charAt(0).toUpperCase() || 'P'}
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Personal Information
            </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                  required
                />
              ) : (
                <div className="text-gray-900 dark:text-gray-100">{formData.fullName}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                />
              ) : (
                <div className="text-gray-900 dark:text-gray-100">{formData.email || 'N/A'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                />
              ) : (
                <div className="text-gray-900 dark:text-gray-100">{formData.phone || 'N/A'}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formatDate(formData.dateOfBirth)}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                />
              ) : (
                <div className="text-gray-900 dark:text-gray-100">
                  {formData.dateOfBirth
                    ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gender</label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              ) : (
                <div className="text-gray-900 dark:text-gray-100">{formData.gender || 'N/A'}</div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                />
              ) : (
                <div className="text-gray-900 dark:text-gray-100">{formData.address || 'N/A'}</div>
              )}
            </div>
          </div>
        </div>

          {/* Actions */}
          {(role === 'admin' || role === 'staff') && (
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        fullName: patient.fullName,
                        email: patient.email || '',
                        phone: patient.phone || '',
                        dateOfBirth: patient.dateOfBirth || '',
                        gender: patient.gender || '',
                        address: patient.address || '',
                      });
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          )}
        </form>
      ) : activeTab === 'history' ? (
        <MedicalHistorySection
          patientId={patient.id || ''}
          medicalHistory={medicalHistory}
          services={services}
          doctors={doctors}
          onCreateMedicalHistory={createMedicalHistory}
          onRefresh={loadMedicalHistory}
          role={role}
        />
      ) : (
        <PatientImageGallery
          patientId={patient.id || ''}
          patientName={patient.fullName || 'Patient'}
          canEdit={role === 'admin' || role === 'staff'}
          uploadedBy={currentUser?.fullName || currentUser?.email}
        />
      )}

      {/* Success Confirmation Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Patient Updated!"
        message="Patient profile has been successfully updated."
        autoClose={true}
        autoCloseDelay={3000}
      />
    </Modal>
  );
}

// Medical History Section Component
function MedicalHistorySection({
  patientId,
  medicalHistory,
  services,
  doctors,
  onCreateMedicalHistory,
  onRefresh,
  role,
}: {
  patientId: string;
  medicalHistory: MedicalHistoryRecord[];
  services: any[];
  doctors: any[];
  onCreateMedicalHistory: (
    record: Omit<MedicalHistoryRecord, 'id' | 'createdAt'>,
  ) => Promise<{ success: boolean; message?: string; data?: MedicalHistoryRecord }>;
  onRefresh: () => void | Promise<void>;
  role?: 'admin' | 'staff';
}) {
  const [showAddModal, setShowAddModal] = useState(false);

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

  return (
    <div className="space-y-4">
      {(role === 'admin' || role === 'staff') && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition"
          >
            + Add Medical Record
          </button>
        </div>
      )}

      {medicalHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-black-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No medical history records found</p>
        </div>
      ) : (
        <div className="space-y-4">
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
                      <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{getServiceName(record)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="text-gray-900 dark:text-gray-100 bg-white dark:bg-black-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    {record.treatment}
                  </div>
                </div>
                {record.remarks && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Remarks:</div>
                    <div className="text-gray-900 dark:text-gray-100 bg-white dark:bg-black-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      {record.remarks}
                    </div>
                  </div>
                )}
              </div>

              {/* Images */}
              {record.images && record.images.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Medical Images:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {record.images.map((imageUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-gold-400 dark:hover:border-gold-500 transition-all"
                        onClick={() => {
                          // Open image in fullscreen viewer
                          const viewer = document.createElement('div');
                          viewer.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-200';
                          viewer.onclick = () => document.body.removeChild(viewer);
                          const img = document.createElement('img');
                          img.src = imageUrl;
                          img.className = 'max-w-full max-h-full object-contain rounded-lg';
                          viewer.appendChild(img);
                          document.body.appendChild(viewer);
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`Medical record image ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
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

      {/* Add Medical History Modal */}
      {(role === 'admin' || role === 'staff') && (
        <AddMedicalHistoryModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          patientId={patientId}
          services={services}
          doctors={doctors}
          onCreate={onCreateMedicalHistory}
          onSuccess={async () => {
            await onRefresh();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// Add Medical History Modal Component
function AddMedicalHistoryModal({
  isOpen,
  onClose,
  patientId,
  services,
  doctors,
  onCreate,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  services: any[];
  doctors: any[];
  onCreate: (
    record: Omit<MedicalHistoryRecord, 'id' | 'createdAt'>,
  ) => Promise<{ success: boolean; message?: string; data?: MedicalHistoryRecord }>;
  onSuccess: () => void | Promise<void>;
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    serviceId: '',
    doctorId: '',
    treatment: '',
    remarks: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        serviceId: '',
        doctorId: '',
        treatment: '',
        remarks: '',
      });
      setImages([]);
      setImagePreviews([]);
      setError(null);
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit to 5 images
    const remainingSlots = 5 - images.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    setImages((prev) => [...prev, ...filesToAdd]);

    // Create previews
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.treatment.trim()) {
      setError('Treatment notes are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert images to base64
      const imagePromises = images.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const imageUrls = await Promise.all(imagePromises);

      // Get service and doctor names
      const service = services.find((s) => s.id === formData.serviceId);
      const doctor = doctors.find((d) => d.id === formData.doctorId);

      const record: Omit<MedicalHistoryRecord, 'id' | 'createdAt'> = {
        patientId,
        serviceId: formData.serviceId || undefined,
        doctorId: formData.doctorId || undefined,
        serviceName: service?.name || undefined,
        doctorName: doctor?.name || undefined,
        date: formData.date,
        time: formData.time,
        treatment: formData.treatment.trim(),
        remarks: formData.remarks.trim() || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      };

      const result = await onCreate(record);
      if (result.success) {
        await onSuccess();
      } else {
        setError(result.message || 'Failed to create medical history record');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create medical history record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Medical History Record" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Time *</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Service</label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            >
              <option value="">Select Service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Doctor</label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            >
              <option value="">Select Doctor</option>
              {doctors.filter((d) => d.available !== false).map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name || doctor.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Treatment Notes *</label>
          <textarea
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            rows={4}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Enter treatment notes..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            rows={3}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Enter additional remarks (optional)..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <p className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Medical Images (Optional) - Max 5 images, 5MB each
          </p>
          <label
            className={`flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-700 dark:text-gray-300 px-4 py-4 hover:border-gold-500 dark:hover:border-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors cursor-pointer ${images.length >= 5 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                console.log('File input changed:', e.target.files);
                handleImageChange(e);
                // Reset input value so same file can be selected again
                e.target.value = '';
              }}
              disabled={images.length >= 5}
              className="absolute w-0 h-0 opacity-0"
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }}
            />
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">
              {images.length >= 5 ? 'Maximum images reached' : 'Click to upload images'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({images.length}/5)
            </span>
          </label>
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Create Patient Modal Component (Admin only)
function CreatePatientModal({
  isOpen,
  onClose,
  onSuccess,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  onCreate: (
    patient: Partial<PatientProfile> & { fullName: string; password?: string },
  ) => Promise<{ success: boolean; message?: string }>;
}) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Split full name into first and last name
      const nameParts = formData.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create patient - matching legacy structure exactly
      const patientData = {
        username: formData.username,
        password: formData.password || 'patient123', // Default password like legacy
        fullName: formData.fullName,
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        role: 'patient' as const,
      };

      const result = await onCreate(patientData as any);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to create patient');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Patient" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Leave empty for default password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
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
            {loading ? 'Creating...' : 'Create Patient'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

