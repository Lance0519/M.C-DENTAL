import { useState, useEffect } from 'react';
import { useDoctors } from '@/hooks/useDoctors';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import type { DoctorProfile } from '@/types/user';

interface DoctorsTabProps {
  role?: 'admin' | 'staff';
}

export function DoctorsTab({ role = 'staff' }: DoctorsTabProps) {
  const { doctors, loadDoctors, createDoctor, updateDoctor, deleteDoctor } = useDoctors();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<DoctorProfile | null>(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [doctorToToggle, setDoctorToToggle] = useState<DoctorProfile | null>(null);

  const handleEdit = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setShowEditModal(true);
  };

  const handleDelete = (doctor: DoctorProfile) => {
    setDoctorToDelete(doctor);
    setShowDeleteModal(true);
  };

  const handleToggleAvailability = (doctor: DoctorProfile) => {
    setDoctorToToggle(doctor);
    setShowToggleModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!doctorToDelete) return;

    const result = await deleteDoctor(doctorToDelete.id || '');
    if (result.success) {
      setShowDeleteModal(false);
      setDoctorToDelete(null);
    } else {
      alert(result.message || 'Failed to delete doctor');
    }
  };

  const handleConfirmToggle = async () => {
    if (!doctorToToggle) return;

    const newAvailability = !doctorToToggle.available;
    const result = await updateDoctor(doctorToToggle.id || '', { available: newAvailability });
    if (result.success) {
      setShowToggleModal(false);
      setDoctorToToggle(null);
    } else {
      alert(result.message || 'Failed to update availability');
    }
  };

  // Calculate statistics
  const totalDoctors = doctors.length;
  const availableDoctors = doctors.filter(d => d.available).length;
  const unavailableDoctors = totalDoctors - availableDoctors;

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dentists</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage dentist profiles and availability</p>
        </div>
        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Dentist
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {doctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Dentists</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalDoctors}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Available</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{availableDoctors}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-6 border border-red-200 dark:border-red-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Unavailable</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">{unavailableDoctors}</p>
              </div>
              <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-700 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctors List - Enhanced card layout */}
      {doctors.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Dentists Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding your first dentist</p>
          {(role === 'admin' || role === 'staff') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              + Add Your First Dentist
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => {
            const profileImg = (doctor as any).profileImage ? (
              <img
                src={(doctor as any).profileImage}
                alt={doctor.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-gold-400 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center text-3xl font-bold text-black shadow-lg border-4 border-gold-300">
                {doctor.name?.charAt(0).toUpperCase() || 'D'}
              </div>
            );

            return (
              <div
                key={doctor.id}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-500 overflow-hidden transform hover:-translate-y-1"
              >
                {/* Doctor Header */}
                <div className="bg-gradient-to-r from-gold-500 to-gold-400 px-6 py-5">
                  <div className="flex items-center gap-4">
                    {profileImg}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-black truncate">{doctor.name}</h3>
                      {doctor.specialty && (
                        <p className="text-sm text-black/70 font-medium truncate">{doctor.specialty}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Doctor Body */}
                <div className="p-6 space-y-4">
                  {/* Availability Status */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                    doctor.available
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      doctor.available ? 'bg-green-500' : 'bg-red-500'
                    } animate-pulse`}></div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">Status</p>
                      <p className={`text-sm font-bold ${
                        doctor.available ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                      }`}>
                        {doctor.available ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Doctor Actions - Admin only */}
                {(role === 'admin' || role === 'staff') && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-black-800 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-black-900 hover:bg-gray-100 dark:hover:bg-black-700 rounded-lg transition-all font-semibold text-sm shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(doctor)}
                      className={`flex-1 px-4 py-2.5 rounded-lg transition-all font-semibold text-sm shadow-sm hover:shadow-md border ${
                        doctor.available
                          ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 border-yellow-200 dark:border-yellow-700'
                          : 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border-green-200 dark:border-green-700'
                      }`}
                    >
                      {doctor.available ? 'Set Unavailable' : 'Set Available'}
                    </button>
                    <button
                      onClick={() => handleDelete(doctor)}
                      className="flex-1 px-4 py-2.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all font-semibold text-sm shadow-sm hover:shadow-md border border-red-200 dark:border-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Doctor Modal (Admin only) */}
      {(role === 'admin' || role === 'staff') && (
        <CreateDoctorModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            void loadDoctors();
            setShowCreateModal(false);
          }}
          onCreateDoctor={createDoctor}
        />
      )}

      {/* Edit Doctor Modal (Admin only) */}
      {(role === 'admin' || role === 'staff') && selectedDoctor && (
        <EditDoctorModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDoctor(null);
          }}
          doctor={selectedDoctor}
          onSuccess={() => {
            void loadDoctors();
            setShowEditModal(false);
            setSelectedDoctor(null);
          }}
          onUpdateDoctor={updateDoctor}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDoctorToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Dentist"
        message={`Are you sure you want to delete "${doctorToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Toggle Availability Confirmation Modal */}
      <ConfirmModal
        isOpen={showToggleModal}
        onClose={() => {
          setShowToggleModal(false);
          setDoctorToToggle(null);
        }}
        onConfirm={handleConfirmToggle}
        title={doctorToToggle?.available ? 'Set Dentist Unavailable' : 'Set Dentist Available'}
        message={`Are you sure you want to ${doctorToToggle?.available ? 'set' : 'make'} "${doctorToToggle?.name}" ${doctorToToggle?.available ? 'unavailable' : 'available'}?`}
        confirmText={`Yes, ${doctorToToggle?.available ? 'Set Unavailable' : 'Set Available'}`}
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}

// Create Doctor Modal Component
function CreateDoctorModal({
  isOpen,
  onClose,
  onSuccess,
  onCreateDoctor,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCreateDoctor: (
    doctor: Partial<DoctorProfile> & { name: string },
  ) => Promise<{ success: boolean; message?: string }>;
}) {
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    available: true,
    profileImage: '',
  });
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        specialty: '',
        available: true,
        profileImage: '',
      });
      setProfileImagePreview(null);
      setError(null);
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setProfileImagePreview(imageData);
      setFormData({ ...formData, profileImage: imageData });
    };
    reader.onerror = () => {
      setError('Error reading image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.specialty) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const doctorData: Partial<DoctorProfile> & { name: string } = {
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        available: formData.available,
        ...(formData.profileImage ? { profileImage: formData.profileImage } : {}),
      };

      const result = await onCreateDoctor(doctorData);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to create doctor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Dentist" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Profile Image */}
        <div className="flex flex-col items-center gap-4">
          {profileImagePreview ? (
            <img
              src={profileImagePreview}
              alt="Profile preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-gold-400 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center text-4xl font-bold text-black shadow-lg">
              {formData.name.charAt(0).toUpperCase() || 'D'}
            </div>
          )}
          <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300">
            {profileImagePreview ? 'Change Image' : 'Upload Profile Image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specialty *</label>
          <input
            type="text"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            placeholder="e.g., General Dentistry, Orthodontics"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="available"
            checked={formData.available}
            onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-gold-600 focus:ring-gold-500 dark:focus:ring-gold-400"
          />
          <label htmlFor="available" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Available for appointments
          </label>
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
            {loading ? 'Creating...' : 'Create Dentist'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Doctor Modal Component
function EditDoctorModal({
  isOpen,
  onClose,
  doctor,
  onSuccess,
  onUpdateDoctor,
}: {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  onSuccess: () => void;
  onUpdateDoctor: (
    id: string,
    updates: Partial<DoctorProfile>,
  ) => Promise<{ success: boolean; message?: string }>;
}) {
  const [formData, setFormData] = useState({
    name: doctor.name || '',
    specialty: doctor.specialty || '',
    available: doctor.available !== undefined ? doctor.available : true,
    profileImage: (doctor as any).profileImage || '',
  });
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    doctor.profileImage || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: doctor.name || '',
        specialty: doctor.specialty || '',
        available: doctor.available !== undefined ? doctor.available : true,
        profileImage: (doctor as any).profileImage || '',
      });
      setProfileImagePreview(doctor.profileImage || null);
      setError(null);
    }
  }, [isOpen, doctor]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setProfileImagePreview(imageData);
      setFormData({ ...formData, profileImage: imageData });
    };
    reader.onerror = () => {
      setError('Error reading image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.specialty) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const updates: Partial<DoctorProfile> = {
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        available: formData.available,
        ...(formData.profileImage ? { profileImage: formData.profileImage } : {}),
      };

      const result = await onUpdateDoctor(doctor.id || '', updates);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to update doctor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Dentist" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Profile Image */}
        <div className="flex flex-col items-center gap-4">
          {profileImagePreview ? (
            <img
              src={profileImagePreview}
              alt="Profile preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-gold-400 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center text-4xl font-bold text-black shadow-lg">
              {formData.name.charAt(0).toUpperCase() || 'D'}
            </div>
          )}
          <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300">
            {profileImagePreview ? 'Change Image' : 'Upload Profile Image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specialty *</label>
          <input
            type="text"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            placeholder="e.g., General Dentistry, Orthodontics"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="editAvailable"
            checked={formData.available}
            onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-gold-600 focus:ring-gold-500 dark:focus:ring-gold-400"
          />
          <label htmlFor="editAvailable" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Available for appointments
          </label>
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
            {loading ? 'Updating...' : 'Update Dentist'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

