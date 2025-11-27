import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const normalizeNotification = (raw: any): Notification => ({
  id: raw.id,
  userId: raw.user_id ?? raw.userId,
  type: raw.type ?? 'info',
  title: raw.title ?? '',
  message: raw.message ?? '',
  read: raw.read ?? false,
  createdAt: raw.created_at ?? raw.createdAt ?? '',
});

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.request('/notifications');
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      const normalized = (data as any[]).map(normalizeNotification);
      setNotifications(normalized);
      setUnreadCount(normalized.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.request(`/notifications?id=${id}`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark notification as read';
      return { success: false, message };
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.request('/notifications?mark_all_read=true', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      return { success: false, message };
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.request(`/notifications?id=${id}`, { method: 'DELETE' });
      setNotifications(prev => {
        const removed = prev.find(n => n.id === id);
        if (removed && !removed.read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== id);
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete notification';
      return { success: false, message };
    }
  };

  const deleteAllRead = async () => {
    try {
      await api.request('/notifications?delete_all_read=true', { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => !n.read));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete read notifications';
      return { success: false, message };
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  };
}

