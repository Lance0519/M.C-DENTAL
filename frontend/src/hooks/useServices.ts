import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ServiceItem } from '@/types/user';

export function useServices() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getServices();
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading services:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Get service by ID from loaded services (use string comparison to handle type mismatches)
  const getServiceById = useCallback((id: string): ServiceItem | undefined => {
    return services.find((s) => String(s.id) === String(id));
  }, [services]);

  const createService = async (service: Omit<ServiceItem, 'id'>) => {
    try {
      await api.createService(service);
      await loadServices();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create service';
      return { success: false, message };
    }
  };

  const updateService = async (id: string | number, service: Partial<ServiceItem>) => {
    try {
      await api.updateService(String(id), service);
      await loadServices();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update service';
      return { success: false, message };
    }
  };

  const deleteService = async (id: string | number) => {
    try {
      await api.deleteService(String(id));
      await loadServices();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete service';
      return { success: false, message };
    }
  };

  return {
    services,
    loading,
    error,
    loadServices,
    getServiceById,
    createService,
    updateService,
    deleteService
  };
}

