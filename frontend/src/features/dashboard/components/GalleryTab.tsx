import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import api from '@/lib/api';

interface GalleryCase {
  id: string;
  title: string;
  description?: string;
  treatment: string;
  beforeImage: string;
  afterImage: string;
  createdAt?: string;
}

interface GalleryTabProps {
  role?: 'admin' | 'staff';
}

export function GalleryTab({ role = 'staff' }: GalleryTabProps) {
  const [cases, setCases] = useState<GalleryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<GalleryCase | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<GalleryCase | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadCases = async () => {
    try {
      setLoading(true);
      const response = await api.getGalleryCases();
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      const normalizedCases = data.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        treatment: c.treatment || c.treatment_type || 'General',
        beforeImage: c.before_image_url || c.beforeImage,
        afterImage: c.after_image_url || c.afterImage,
        createdAt: c.created_at || c.createdAt,
      }));
      setCases(normalizedCases);
    } catch (error) {
      console.error('Error loading gallery cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleEdit = (caseItem: GalleryCase) => {
    setSelectedCase(caseItem);
    setShowEditModal(true);
  };

  const handleDelete = (caseItem: GalleryCase) => {
    setCaseToDelete(caseItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!caseToDelete) return;

    try {
      await api.deleteGalleryCase(caseToDelete.id);
      setShowDeleteModal(false);
      setCaseToDelete(null);
      loadCases();
      setSuccessMessage(`"${caseToDelete.title}" has been deleted successfully!`);
      setShowSuccessModal(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete case');
    }
  };

  const treatments = [
    'Teeth Whitening',
    'Dental Veneers',
    'Braces',
    'Invisalign',
    'Dental Implants',
    'Crowns & Bridges',
    'Dentures',
    'Root Canal',
    'Tooth Extraction',
    'General Dentistry',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Smile Gallery</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage before & after transformation cases</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Case
        </button>
      </div>

      {/* Statistics */}
      {cases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/30 dark:to-gold-800/30 rounded-xl p-6 border border-gold-200 dark:border-gold-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gold-700 dark:text-gold-300 mb-1">Total Cases</p>
                <p className="text-3xl font-bold text-gold-900 dark:text-gold-100">{cases.length}</p>
              </div>
              <div className="w-12 h-12 bg-gold-200 dark:bg-gold-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gold-700 dark:text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Treatment Types</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {new Set(cases.map(c => c.treatment)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">This Month</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {cases.filter(c => {
                    if (!c.createdAt) return false;
                    const caseDate = new Date(c.createdAt);
                    const now = new Date();
                    return caseDate.getMonth() === now.getMonth() && caseDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && cases.length === 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Gallery Cases Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Start showcasing your work by adding your first before & after case</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            + Add Your First Case
          </button>
        </div>
      )}

      {/* Cases Grid */}
      {!loading && cases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-500 overflow-hidden"
            >
              {/* Images Preview */}
              <div className="relative h-48 grid grid-cols-2 overflow-hidden">
                <div className="relative">
                  <img
                    src={caseItem.beforeImage}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded z-10">
                    Before
                  </span>
                </div>
                <div className="relative">
                  <img
                    src={caseItem.afterImage}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 px-2 py-1 bg-gold-500 text-black text-xs font-semibold rounded z-10">
                    After
                  </span>
                </div>
              </div>

              {/* Case Info */}
              <div className="p-4 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-400 text-black text-xs font-bold rounded-full">
                    {caseItem.treatment}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
                  {caseItem.title}
                </h3>
                {caseItem.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {caseItem.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-black-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  onClick={() => handleEdit(caseItem)}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(caseItem)}
                  className="flex-1 px-3 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-red-700 transition-all text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateCaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(title) => {
          loadCases();
          setShowCreateModal(false);
          setSuccessMessage(`"${title}" has been added to the gallery!`);
          setShowSuccessModal(true);
        }}
        treatments={treatments}
      />

      {/* Edit Modal */}
      {selectedCase && (
        <EditCaseModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCase(null);
          }}
          caseItem={selectedCase}
          onSuccess={() => {
            loadCases();
            setShowEditModal(false);
            setSelectedCase(null);
            setSuccessMessage('Case updated successfully!');
            setShowSuccessModal(true);
          }}
          treatments={treatments}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCaseToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Gallery Case"
        message={`Are you sure you want to delete "${caseToDelete?.title}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message={successMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
}

// Create Case Modal
function CreateCaseModal({
  isOpen,
  onClose,
  onSuccess,
  treatments,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (title: string) => void;
  treatments: string[];
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    treatment: '',
    beforeImage: '',
    afterImage: '',
  });
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        treatment: '',
        beforeImage: '',
        afterImage: '',
      });
      setBeforePreview(null);
      setAfterPreview(null);
      setError(null);
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (type === 'before') {
        setBeforePreview(imageData);
        setFormData({ ...formData, beforeImage: imageData });
      } else {
        setAfterPreview(imageData);
        setFormData({ ...formData, afterImage: imageData });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title || !formData.treatment || !formData.beforeImage || !formData.afterImage) {
        setError('Please fill in all required fields and upload both images');
        setLoading(false);
        return;
      }

      await api.createGalleryCase({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        treatment: formData.treatment,
        beforeImageUrl: formData.beforeImage,
        afterImageUrl: formData.afterImage,
      });

      onSuccess(formData.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Gallery Case" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Image Uploads */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Before Image *</label>
            <div className="relative">
              {beforePreview ? (
                <div className="relative h-40 rounded-lg overflow-hidden">
                  <img src={beforePreview} alt="Before preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setBeforePreview(null);
                      setFormData({ ...formData, beforeImage: '' });
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gold-500 dark:hover:border-gold-400 transition-colors">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Upload Before</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'before')} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">After Image *</label>
            <div className="relative">
              {afterPreview ? (
                <div className="relative h-40 rounded-lg overflow-hidden">
                  <img src={afterPreview} alt="After preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setAfterPreview(null);
                      setFormData({ ...formData, afterImage: '' });
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gold-500 dark:hover:border-gold-400 transition-colors">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Upload After</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'after')} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30"
            placeholder="e.g., Complete Smile Makeover"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Treatment Type *</label>
          <select
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30"
            required
          >
            <option value="">Select treatment type</option>
            {treatments.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30"
            placeholder="Brief description of the case..."
          />
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
            className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Case'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Case Modal
function EditCaseModal({
  isOpen,
  onClose,
  caseItem,
  onSuccess,
  treatments,
}: {
  isOpen: boolean;
  onClose: () => void;
  caseItem: GalleryCase;
  onSuccess: () => void;
  treatments: string[];
}) {
  const [formData, setFormData] = useState({
    title: caseItem.title,
    description: caseItem.description || '',
    treatment: caseItem.treatment,
    beforeImage: caseItem.beforeImage,
    afterImage: caseItem.afterImage,
  });
  const [beforePreview, setBeforePreview] = useState<string | null>(caseItem.beforeImage);
  const [afterPreview, setAfterPreview] = useState<string | null>(caseItem.afterImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: caseItem.title,
        description: caseItem.description || '',
        treatment: caseItem.treatment,
        beforeImage: caseItem.beforeImage,
        afterImage: caseItem.afterImage,
      });
      setBeforePreview(caseItem.beforeImage);
      setAfterPreview(caseItem.afterImage);
      setError(null);
    }
  }, [isOpen, caseItem]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (type === 'before') {
        setBeforePreview(imageData);
        setFormData({ ...formData, beforeImage: imageData });
      } else {
        setAfterPreview(imageData);
        setFormData({ ...formData, afterImage: imageData });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title || !formData.treatment) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      await api.updateGalleryCase(caseItem.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        treatment: formData.treatment,
        beforeImageUrl: formData.beforeImage,
        afterImageUrl: formData.afterImage,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Gallery Case" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Image Uploads */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Before Image</label>
            <div className="relative h-40 rounded-lg overflow-hidden">
              <img src={beforePreview || caseItem.beforeImage} alt="Before preview" className="w-full h-full object-cover" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-sm font-semibold">Change Image</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'before')} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">After Image</label>
            <div className="relative h-40 rounded-lg overflow-hidden">
              <img src={afterPreview || caseItem.afterImage} alt="After preview" className="w-full h-full object-cover" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-sm font-semibold">Change Image</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'after')} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Treatment Type *</label>
          <select
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30"
            required
          >
            {treatments.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30"
          />
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
            className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Case'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

