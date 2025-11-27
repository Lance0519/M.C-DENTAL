import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown> | string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  ipAddress?: string;
}

const normalizeAuditLog = (raw: any): AuditLog => ({
  id: raw.id,
  action: raw.action,
  details: raw.details ?? {},
  userId: raw.user_id ?? raw.userId,
  userName: raw.user_name ?? raw.userName ?? 'Unknown',
  userRole: raw.user_role ?? raw.userRole ?? 'unknown',
  timestamp: raw.created_at ?? raw.timestamp ?? '',
  ipAddress: raw.ip_address ?? raw.ipAddress,
});

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.request('/audit-logs');
      const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
      const normalized = (data as any[]).map(normalizeAuditLog);
      // Sort by timestamp descending
      normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(normalized);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const createAuditLog = async (log: {
    action: string;
    details?: Record<string, unknown>;
    userId?: string;
    userName?: string;
    userRole?: string;
  }) => {
    try {
      await api.request('/audit-logs', {
        method: 'POST',
        body: JSON.stringify(log),
      });
      await loadAuditLogs();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create audit log';
      return { success: false, message };
    }
  };

  const deleteAllLogs = async () => {
    try {
      await api.request('/audit-logs?all=true', { method: 'DELETE' });
      setAuditLogs([]);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete audit logs';
      return { success: false, message };
    }
  };

  const deleteOldLogs = async (olderThan: string) => {
    try {
      await api.request(`/audit-logs?olderThan=${encodeURIComponent(olderThan)}`, {
        method: 'DELETE',
      });
      await loadAuditLogs();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete old audit logs';
      return { success: false, message };
    }
  };

  return {
    auditLogs,
    loading,
    error,
    loadAuditLogs,
    createAuditLog,
    deleteAllLogs,
    deleteOldLogs,
  };
}

