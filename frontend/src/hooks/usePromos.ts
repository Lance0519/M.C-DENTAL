import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Promo } from '@/types/user';

const normalizePromo = (raw: any): Promo => ({
  id: raw.id,
  title: raw.title ?? '',
  description: raw.description ?? '',
  discount: raw.discount ?? '',
  price: raw.price ?? '',
  originalPrice: raw.original_price ?? raw.originalPrice ?? '',
  promoPrice: raw.promo_price ?? raw.promoPrice ?? '',
  validUntil: raw.valid_until ?? raw.validUntil ?? '',
  duration: raw.duration ?? undefined,
  active: raw.active !== false,
  createdAt: raw.created_at ?? raw.createdAt ?? '',
});

export function usePromos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPromos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPromotions();
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      const normalized = (data as any[]).map(normalizePromo);
      setPromos(normalized);
    } catch (err) {
      console.error('Error loading promos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load promotions');
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  // Get active promos only
  const getActivePromos = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return promos.filter((promo) => {
      if (promo.active === false) return false;
      if (promo.validUntil) {
        return promo.validUntil >= today;
      }
      return true;
    });
  }, [promos]);

  // Get promo by ID (use string comparison to handle type mismatches)
  const getPromoById = useCallback((id: string) => {
    return promos.find((p) => String(p.id) === String(id));
  }, [promos]);

  const createPromo = async (promo: Omit<Promo, 'id' | 'createdAt'>) => {
    try {
      const payload = {
        title: promo.title,
        description: promo.description,
        discount: promo.discount,
        price: promo.price,
        originalPrice: promo.originalPrice,
        promoPrice: promo.promoPrice,
        validUntil: promo.validUntil,
        duration: promo.duration,
        active: promo.active !== false,
      };
      const response = await api.createPromotion(payload);
      await loadPromos();
      return { success: true, data: response };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create promotion';
      return { success: false, message };
    }
  };

  const updatePromo = async (id: string, promo: Partial<Promo>) => {
    try {
      const payload: Record<string, any> = {};
      if (promo.title !== undefined) payload.title = promo.title;
      if (promo.description !== undefined) payload.description = promo.description;
      if (promo.discount !== undefined) payload.discount = promo.discount;
      if (promo.price !== undefined) payload.price = promo.price;
      if (promo.originalPrice !== undefined) payload.originalPrice = promo.originalPrice;
      if (promo.promoPrice !== undefined) payload.promoPrice = promo.promoPrice;
      if (promo.validUntil !== undefined) payload.validUntil = promo.validUntil;
      if (promo.duration !== undefined) payload.duration = promo.duration;
      if (promo.active !== undefined) payload.active = promo.active;

      await api.updatePromotion(id, payload);
      await loadPromos();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update promotion';
      return { success: false, message };
    }
  };

  const deletePromo = async (id: string) => {
    try {
      await api.deletePromotion(id);
      setPromos((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete promotion';
      return { success: false, message };
    }
  };

  return {
    promos,
    loading,
    error,
    loadPromos,
    getActivePromos,
    getPromoById,
    createPromo,
    updatePromo,
    deletePromo
  };
}
