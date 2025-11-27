import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface PatientImage {
  id: string;
  patientId: string;
  imageUrl: string;
  description: string | null;
  imageType: string | null;
  takenDate: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Normalize image data from API (snake_case to camelCase)
const normalizeImage = (raw: any): PatientImage => ({
  id: raw.id,
  patientId: raw.patient_id,
  imageUrl: raw.image_url,
  description: raw.description,
  imageType: raw.image_type,
  takenDate: raw.taken_date,
  uploadedBy: raw.uploaded_by,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

export function usePatientImages(patientId: string | null) {
  const [images, setImages] = useState<PatientImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.request(`/patient-images?patientId=${patientId}`);
      const data = Array.isArray(response) ? response : [];
      const normalized = data.map(normalizeImage);
      setImages(normalized);
    } catch (err) {
      console.error('Error loading patient images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const uploadImage = async (
    imageData: string,
    description?: string,
    imageType?: string,
    takenDate?: string,
    uploadedBy?: string
  ) => {
    if (!patientId) {
      return { success: false, message: 'Patient ID is required' };
    }

    try {
      setLoading(true);
      const response = await api.request('/patient-images', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          imageUrl: imageData,
          description,
          imageType,
          takenDate,
          uploadedBy,
        }),
      });

      await loadImages();
      return { success: true, data: normalizeImage(response) };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const updateImage = async (
    imageId: string,
    updates: { description?: string; imageType?: string; takenDate?: string }
  ) => {
    try {
      setLoading(true);
      const response = await api.request(`/patient-images?id=${imageId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      await loadImages();
      return { success: true, data: normalizeImage(response) };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update image';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      setLoading(true);
      await api.request(`/patient-images?id=${imageId}`, {
        method: 'DELETE',
      });

      await loadImages();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete image';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  return {
    images,
    loading,
    error,
    loadImages,
    uploadImage,
    updateImage,
    deleteImage,
    imageCount: images.length,
    canUploadMore: images.length < 25,
  };
}

