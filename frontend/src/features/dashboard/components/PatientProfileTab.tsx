import { useState, useEffect, useCallback } from 'react';
import { ProfileModal } from '@/components/modals/ProfileModal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import { PatientImageGallery } from '@/components/PatientImageGallery';
import api from '@/lib/api';
import type { PatientProfile } from '@/types/user';
import { useAuthStore } from '@/store/auth-store';

interface PatientProfileTabProps {
  user: PatientProfile;
}

export function PatientProfileTab({ user }: PatientProfileTabProps) {
  const [currentUser, setCurrentUser] = useState<PatientProfile>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    dateOfBirth: user.dateOfBirth || '',
    gender: user.gender || '',
    address: user.address || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatientData = useCallback(async () => {
    try {
      const response = await api.request(`/patients?id=${user.id}`);
      const data = (response as any)?.data ?? response;
      if (data) {
        const patientData: PatientProfile = {
          id: data.id,
          username: data.username,
          fullName: data.full_name ?? data.fullName,
          email: data.email,
          phone: data.phone ?? data.contact_number,
          role: 'patient',
          dateOfBirth: data.date_of_birth ?? data.dateOfBirth,
          gender: data.gender ?? '',
          address: data.address,
          profileImage: data.profile_image ?? data.profileImage,
        };
        setCurrentUser(patientData);
        setFormData({
          fullName: patientData.fullName || '',
          email: patientData.email || '',
          phone: patientData.phone || '',
          dateOfBirth: patientData.dateOfBirth || '',
          gender: patientData.gender || '',
          address: patientData.address || '',
        });
      }
    } catch (err) {
      console.error('Error loading patient data:', err);
    }
  }, [user.id]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      fullName: currentUser.fullName || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      dateOfBirth: currentUser.dateOfBirth || '',
      gender: currentUser.gender || '',
      address: currentUser.address || '',
    });
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Validate phone if provided
      if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
        setError('Please enter a valid phone number');
        setLoading(false);
        return;
      }

      // Update patient via API
      const response = await api.updatePatient(user.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
      });

      if (response && (response as any).success !== false) {
        // Reload patient data
        await loadPatientData();
        
        // Update auth store with new user info
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          authStore.setUser({
            ...authStore.user,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
          });
        }
        
        setIsEditing(false);
        setShowSuccessModal(true);
      } else {
        setError((response as any)?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not provided';
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

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
        {!isEditing && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              Edit Profile Picture
            </button>
            <button
              onClick={handleEdit}
              className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-6 border-b-2 border-gold-600">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              {currentUser.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-black shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-gold-500 font-bold text-4xl border-4 border-black shadow-xl">
                  {getInitials(currentUser.fullName || 'User')}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-black mb-1">{currentUser.fullName || 'User'}</h2>
              <p className="text-black/80 font-semibold">Patient ID: {currentUser.id}</p>
              <p className="text-black/70 text-sm mt-1">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8">
          {!isEditing ? (
            // View Mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-black-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Full Name</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentUser.fullName || 'Not provided'}</div>
              </div>

              <div className="bg-white dark:bg-black-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Email</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentUser.email || 'Not provided'}</div>
              </div>

              <div className="bg-white dark:bg-black-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentUser.phone || 'Not provided'}</div>
              </div>

              <div className="bg-white dark:bg-black-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Date of Birth</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatDate(currentUser.dateOfBirth || '')}</div>
              </div>

              <div className="bg-white dark:bg-black-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Gender</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentUser.gender || 'Not provided'}</div>
              </div>

              <div className="bg-white dark:bg-black-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700 md:col-span-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Address</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentUser.address || 'Not provided'}</div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="e.g., +1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2.5 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors resize-y placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your full address"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Patient Images Section */}
      <div className="mt-8 bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-4 border-b-2 border-gold-600">
          <h2 className="text-xl font-bold text-black">My Dental Images</h2>
          <p className="text-black/70 text-sm">View and manage your dental X-rays, photos, and treatment images</p>
        </div>
        <div className="p-6">
          <PatientImageGallery
            patientId={currentUser.id || ''}
            patientName={currentUser.fullName || 'Patient'}
            canEdit={true}
            uploadedBy={currentUser.fullName || currentUser.email}
          />
        </div>
      </div>

      {/* Profile Picture Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onUpdate={async () => {
          await loadPatientData();
          setShowProfileModal(false);
        }}
      />

      {/* Success Confirmation Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Profile Updated!"
        message="Your profile has been successfully updated."
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
}
