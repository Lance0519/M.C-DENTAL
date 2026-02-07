import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { SuccessModal } from './SuccessModal';
import api from '@/lib/api';
import type { StaffProfile, PatientProfile } from '@/types/user';
import { useAuthStore } from '@/store/auth-store';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StaffProfile | PatientProfile | null;
  onUpdate: () => void | Promise<void>;
}

export function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const currentUser = useAuthStore((state) => state.user);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    profileImage: null as File | null,
    profileImagePreview: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      // Get profile image from either StaffProfile or PatientProfile
      const profileImage = (user as StaffProfile).profileImage || (user as PatientProfile).profileImage || '';
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: (user as StaffProfile).jobTitle || '',
        profileImage: null,
        profileImagePreview: profileImage,
      });
      setError(null);
    }
  }, [isOpen, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setFormData({ ...formData, profileImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profileImagePreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const updates: Record<string, unknown> = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
      };

      // Handle phone - send null if empty, otherwise send the trimmed value
      const phoneValue = formData.phone.trim();
      if (phoneValue) {
        updates.phone = phoneValue;
      } else {
        updates.phone = null;
      }

      if ((user as StaffProfile).jobTitle !== undefined) {
        const jobTitleValue = formData.jobTitle.trim();
        // Always send jobTitle, even if empty (send null to clear it)
        updates.jobTitle = jobTitleValue || null;
      }

      // Handle profile image
      const currentProfileImage = (user as StaffProfile).profileImage || (user as PatientProfile).profileImage || '';
      
      // If a new image file was selected, convert it to base64
      if (formData.profileImage) {
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.onloadend = () => {
            const result = reader.result as string;
            if (!result || !result.startsWith('data:image/')) {
              reject(new Error('Invalid image data'));
            } else {
              resolve(result);
            }
          };
          reader.readAsDataURL(formData.profileImage!);
        });
        updates.profileImage = imageData;
      } 
      // If preview is empty and there was a previous image, image was removed
      else if (!formData.profileImagePreview && currentProfileImage) {
        updates.profileImage = null;
      }
      // If preview exists and is different from current, update it (for cases where image was set but file wasn't selected)
      else if (formData.profileImagePreview && formData.profileImagePreview !== currentProfileImage && formData.profileImagePreview.startsWith('data:image/')) {
        updates.profileImage = formData.profileImagePreview;
      }

      // Determine which API to call based on user role
      const isPatient = user.role === 'patient';
      const endpoint = isPatient 
        ? `/patients?id=${user.id}` 
        : `/staff?id=${user.id}`;

      console.log('Sending profile update:', { endpoint, updates });
      
      const response = await api.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      // Check if the response indicates an error
      if (response && typeof response === 'object' && 'success' in response && !(response as any).success) {
        throw new Error((response as any).message || 'Failed to update profile');
      }

      // Update auth store with new user info
      if (currentUser && currentUser.id === user.id) {
        let nextProfileImage: string | undefined;
        if (updates.profileImage === null) {
          nextProfileImage = undefined;
        } else if (typeof updates.profileImage === 'string') {
          nextProfileImage = updates.profileImage;
        } else if (formData.profileImagePreview) {
          nextProfileImage = formData.profileImagePreview;
        } else {
          nextProfileImage = currentProfileImage || (currentUser.profileImage as string | undefined);
        }

        const updatedUser: any = {
          ...currentUser,
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          profileImage: nextProfileImage,
        };

        // Include jobTitle if it's a staff member
        if ((user as StaffProfile).jobTitle !== undefined) {
          const jobTitleValue = formData.jobTitle.trim();
          updatedUser.jobTitle = jobTitleValue || null;
        }

        setUser(updatedUser);
      }

      // Wait a bit to ensure the database update is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Dispatch event to notify other components (like StaffTab) to refresh
      // This ensures StaffTab stays in sync when profiles are updated
      if (user.role === 'staff') {
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: { userId: user.id, role: user.role } }));
      }
      
      setShowSuccessModal(true);
      await onUpdate();
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, profileImage: null, profileImagePreview: '' });
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  if (!user) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {formData.profileImagePreview ? (
                <img
                  src={formData.profileImagePreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gold-500 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gold-500 flex items-center justify-center text-black font-bold text-3xl border-4 border-gold-600 shadow-lg">
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <label className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                Change Photo
              </label>
              {formData.profileImagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            />
          </div>

          {/* Job Title (for staff/admin only) */}
          {(user as StaffProfile).jobTitle !== undefined && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
              />
            </div>
          )}

          {/* Buttons */}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Confirmation Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Profile Updated!"
        message="Your profile has been successfully updated."
        autoClose={true}
        autoCloseDelay={2000}
      />
    </>
  );
}
