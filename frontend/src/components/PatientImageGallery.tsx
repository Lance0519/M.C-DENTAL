import { useState, useEffect, useRef } from 'react';
import { usePatientImages } from '@/hooks/usePatientImages';
import type { PatientImage } from '@/hooks/usePatientImages';

interface PatientImageGalleryProps {
  patientId: string;
  patientName: string;
  canEdit?: boolean;
  uploadedBy?: string;
}

const IMAGE_TYPES = [
  { value: 'xray', label: 'X-Ray' },
  { value: 'photo', label: 'Photo' },
  { value: 'scan', label: 'Scan' },
  { value: 'treatment', label: 'Treatment Progress' },
  { value: 'before', label: 'Before Treatment' },
  { value: 'after', label: 'After Treatment' },
  { value: 'other', label: 'Other' },
];

export function PatientImageGallery({
  patientId,
  patientName,
  canEdit = false,
  uploadedBy,
}: PatientImageGalleryProps) {
  const {
    images,
    loading,
    error,
    loadImages,
    uploadImage,
    updateImage,
    deleteImage,
    imageCount,
    canUploadMore,
  } = usePatientImages(patientId);

  const [selectedImage, setSelectedImage] = useState<PatientImage | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<PatientImage | null>(null);
  const [editingImage, setEditingImage] = useState<PatientImage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadData, setUploadData] = useState({
    imagePreview: '',
    description: '',
    imageType: '',
    takenDate: '',
  });

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadData((prev) => ({
        ...prev,
        imagePreview: reader.result as string,
      }));
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadData.imagePreview) {
      setUploadError('Please select an image');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    const result = await uploadImage(
      uploadData.imagePreview,
      uploadData.description || undefined,
      uploadData.imageType || undefined,
      uploadData.takenDate || undefined,
      uploadedBy
    );

    setUploadLoading(false);

    if (result.success) {
      setShowUploadModal(false);
      setUploadData({
        imagePreview: '',
        description: '',
        imageType: '',
        takenDate: '',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setUploadError(result.message || 'Failed to upload image');
    }
  };

  const handleEdit = (image: PatientImage) => {
    setEditingImage(image);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    setUploadLoading(true);
    const result = await updateImage(editingImage.id, {
      description: editingImage.description || undefined,
      imageType: editingImage.imageType || undefined,
      takenDate: editingImage.takenDate || undefined,
    });

    setUploadLoading(false);

    if (result.success) {
      setShowEditModal(false);
      setEditingImage(null);
    }
  };

  const handleDeleteClick = (image: PatientImage) => {
    setImageToDelete(image);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;

    setDeleteLoading(true);
    const result = await deleteImage(imageToDelete.id);
    setDeleteLoading(false);

    if (result.success) {
      setSelectedImage(null);
      setShowDeleteModal(false);
      setImageToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setImageToDelete(null);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getImageTypeLabel = (type: string | null): string => {
    if (!type) return 'Uncategorized';
    const found = IMAGE_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Patient Images
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {imageCount} of 25 images used
          </p>
        </div>
        {canEdit && canUploadMore && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow hover:shadow-md transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Image
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && images.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && images.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-black-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No images</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No dental images have been uploaded for this patient yet.
          </p>
          {canEdit && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition"
            >
              Upload First Image
            </button>
          )}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-black-800 cursor-pointer hover:ring-2 hover:ring-gold-500 transition-all"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.imageUrl}
                alt={image.description || 'Patient image'}
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <span className="text-white text-xs font-medium text-center line-clamp-2">
                  {image.description || 'No description'}
                </span>
                <span className="text-gold-400 text-xs mt-1">
                  {getImageTypeLabel(image.imageType)}
                </span>
              </div>
              {/* Type badge */}
              {image.imageType && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded-full">
                  {getImageTypeLabel(image.imageType)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white dark:bg-black-900 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative bg-black flex items-center justify-center" style={{ maxHeight: '60vh' }}>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.description || 'Patient image'}
                className="max-w-full max-h-[60vh] object-contain"
              />
              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                      setSelectedImage(images[prevIndex]);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
                      const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                      setSelectedImage(images[nextIndex]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Image Info */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedImage.imageType && (
                      <span className="px-3 py-1 bg-gold-500/20 text-gold-600 dark:text-gold-400 text-sm font-medium rounded-full">
                        {getImageTypeLabel(selectedImage.imageType)}
                      </span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(selectedImage.takenDate || selectedImage.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedImage.description || 'No description provided'}
                  </h3>
                  {selectedImage.uploadedBy && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Uploaded by: {selectedImage.uploadedBy}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(selectedImage)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(selectedImage)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Image counter */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Image {images.findIndex((img) => img.id === selectedImage.id) + 1} of {images.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-black-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Upload Patient Image
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Add a new dental/medical image for {patientName}
              </p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {uploadError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}

              {/* Image Preview / Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image *
                </label>
                {uploadData.imagePreview ? (
                  <div className="relative">
                    <img
                      src={uploadData.imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setUploadData((prev) => ({ ...prev, imagePreview: '' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gold-500 transition"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Click to select an image or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this image shows..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                />
              </div>

              {/* Image Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Type
                </label>
                <select
                  value={uploadData.imageType}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, imageType: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                >
                  <option value="">Select type...</option>
                  {IMAGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Taken */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={uploadData.takenDate}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, takenDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                disabled={uploadLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadLoading || !uploadData.imagePreview}
                className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                )}
                Upload Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-black-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Image Details</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingImage.description || ''}
                  onChange={(e) =>
                    setEditingImage((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  placeholder="Describe what this image shows..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                />
              </div>

              {/* Image Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Type
                </label>
                <select
                  value={editingImage.imageType || ''}
                  onChange={(e) =>
                    setEditingImage((prev) => (prev ? { ...prev, imageType: e.target.value } : null))
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                >
                  <option value="">Select type...</option>
                  {IMAGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Taken */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={editingImage.takenDate || ''}
                  onChange={(e) =>
                    setEditingImage((prev) => (prev ? { ...prev, takenDate: e.target.value } : null))
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingImage(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                disabled={uploadLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={uploadLoading}
                className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow hover:shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploadLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && imageToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={handleCancelDelete}
        >
          <div
            className="relative max-w-md w-full bg-white dark:bg-black-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Image</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Image Preview */}
              <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={imageToDelete.imageUrl}
                  alt={imageToDelete.description || 'Image to delete'}
                  className="w-full h-32 object-cover"
                />
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to delete this image?
              </p>
              
              {imageToDelete.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <span className="font-medium">Description:</span> {imageToDelete.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow hover:shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Image
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

