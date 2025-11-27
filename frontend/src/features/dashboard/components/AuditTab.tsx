import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { useAppointments } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useServices } from '@/hooks/useServices';
import { useDoctors } from '@/hooks/useDoctors';
import { useStaff } from '@/hooks/useStaff';
import { useAuditLogs, type AuditLog } from '@/hooks/useAuditLogs';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';

export function AuditTab() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(true);

  const { appointments, loadAppointments } = useAppointments();
  const { patients } = usePatients();
  const { services } = useServices();
  const { doctors } = useDoctors();
  const { staff } = useStaff();
  const { auditLogs, loadAuditLogs, deleteAllLogs } = useAuditLogs();

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Get current user from auth store
  const currentUser = useAuthStore((state) => state.user);

  // Authentication check - only admins can access audit logs
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      if (!currentUser) {
        navigate('/login', { replace: true });
        return;
      }

      // Only admin role can access audit logs
      if (currentUser.role !== 'admin') {
        // Redirect to dashboard based on user role
        if (currentUser.role === 'staff') {
          navigate('/dashboard/staff', { replace: true });
        } else if (currentUser.role === 'patient') {
          navigate('/dashboard/patient', { replace: true });
        } else {
          navigate('/dashboard/admin', { replace: true });
        }
        return;
      }

      setIsAuthorized(true);
      setLoading(false);

      // Always require password verification (no session storage check)
      setShowPasswordModal(true);
      setIsPasswordVerified(false);
    };

    checkAuth();
  }, [navigate, currentUser]);

  // Load audit logs when password is verified
  useEffect(() => {
    if (!isAuthorized || !isPasswordVerified) return;
    // Reload audit logs from the API
    loadAuditLogs();
  }, [isAuthorized, isPasswordVerified, loadAuditLogs]);

  // Handle password verification
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentUser || currentUser.role !== 'admin') {
      setPasswordError('Unauthorized access');
      return;
    }

    try {
      // Verify password by attempting to authenticate via API
      const response = await api.request('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id,
          password: password,
        }),
      });

      if (response && (response as any).success !== false) {
        setIsPasswordVerified(true);
        setShowPasswordModal(false);
        setPassword('');
        // Don't store in sessionStorage - always require password on each visit
      } else {
        setPasswordError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handlePasswordModalClose = () => {
    // If user closes modal without verifying, switch to dashboard tab
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
    // Dispatch event to switch to dashboard tab
    window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: { tab: 'dashboard' } }));
  };

  // Get unique actions and users for filters
  const uniqueActions = useMemo(() => {
    const actions = new Set(auditLogs.map((log) => log.action));
    return Array.from(actions).sort();
  }, [auditLogs]);

  const uniqueUsers = useMemo(() => {
    const users = new Set(auditLogs.map((log) => log.userName));
    return Array.from(users).sort();
  }, [auditLogs]);

  // Get logs by date for calendar
  const logsByDate = useMemo(() => {
    const grouped: Record<string, AuditLog[]> = {};
    auditLogs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    return grouped;
  }, [auditLogs]);

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    let filtered = [...auditLogs];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(term) ||
          log.userName.toLowerCase().includes(term) ||
          log.userRole.toLowerCase().includes(term) ||
          JSON.stringify(log.details).toLowerCase().includes(term)
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter((log) => log.userName === userFilter);
    }

    // Date filter
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    } else if (dateFilter !== 'all' && dateFilter !== 'custom') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const startDate = new Date(today);

      if (dateFilter === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'month') {
        startDate.setMonth(today.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
      }

      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= today;
      });
    }

    // Selected date filter (for calendar view)
    if (selectedDate) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === selectedDate;
      });
    }

    return filtered;
  }, [auditLogs, searchTerm, actionFilter, userFilter, dateFilter, customStartDate, customEndDate, selectedDate]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('update') || action.includes('edit')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('delete') || action.includes('remove')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('login') || action.includes('logout')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (action.includes('confirm') || action.includes('approve')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDetails = (details: Record<string, unknown> | string): string => {
    // Handle case where details might be a string (legacy data or incorrect storage)
    if (typeof details === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(details);
        if (typeof parsed === 'object' && parsed !== null) {
          details = parsed;
        } else {
          // If it's just a plain string, return it as is
          return details;
        }
      } catch {
        // If parsing fails, it's just a plain string
        return details;
      }
    }

    // Ensure details is an object
    if (typeof details !== 'object' || details === null || Array.isArray(details)) {
      return typeof details === 'string' ? details : 'No details';
    }

    // Build readable details string prioritizing important fields
    const parts: string[] = [];
    
    // Names (prioritized - show first for context)
    if (details.serviceName) parts.push(`Service: ${details.serviceName}`);
    if (details.promotionTitle) parts.push(`Promotion: ${details.promotionTitle}`);
    if (details.patientName) parts.push(`Patient: ${details.patientName}`);
    if (details.doctorName) parts.push(`Doctor: ${details.doctorName}`);
    if (details.staffName) parts.push(`Staff: ${details.staffName}`);
    
    // Status change (important for activation/deactivation)
    if (details.statusChange && typeof details.statusChange === 'string') {
      parts.push(`Status: ${details.statusChange}`);
    }
    
    // Action description
    if (details.action && typeof details.action === 'string' && !details.statusChange) {
      parts.push(details.action);
    }
    
    // Date/Time info
    if (details.date && details.time) {
      parts.push(`Date: ${details.date} at ${details.time}`);
    } else if (details.date) {
      parts.push(`Date: ${details.date}`);
    } else if (details.time) {
      parts.push(`Time: ${details.time}`);
    }
    
    // Day (for schedules)
    if (details.day) parts.push(`Day: ${details.day}`);
    
    // Services list
    if (details.services && typeof details.services === 'string') {
      parts.push(`Services: ${details.services}`);
    }
    
    // Login method
    if (details.loginMethod) {
      parts.push(`Login Method: ${details.loginMethod}`);
    }
    
    // Updated fields (only if there are no more important details)
    if (parts.length <= 1 && details.updatedFields && Array.isArray(details.updatedFields)) {
      const fields = details.updatedFields.filter((f: unknown) => f !== 'updated_at');
      if (fields.length > 0) {
        parts.push(`Updated: ${fields.join(', ')}`);
      }
    }
    
    // If we have parts, return them joined
    if (parts.length > 0) {
      return parts.join(' • ');
    }

    // Fallback to original logic for any remaining fields
    const entries = Object.entries(details);
    if (entries.length === 0) return 'No details';
    
    // Filter out internal fields
    const filteredEntries = entries.filter(([key]) => 
      !['description', 'actionTimestamp', 'action', 'patientName', 'doctorName', 
        'serviceName', 'staffName', 'promotionTitle', 'date', 'time', 'day',
        'services', 'loginMethod', 'updatedFields', 'statusChange'].includes(key)
    );
    
    if (filteredEntries.length === 0) return 'No additional details';
    
    // Format remaining details in a more readable way
    return filteredEntries
      .map(([key, value]) => {
        // Format key: convert camelCase to Title Case
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        
        // Format value based on type
        let formattedValue: string;
        if (value === null || value === undefined) {
          formattedValue = 'N/A';
        } else if (typeof value === 'object') {
          // For arrays, show as comma-separated list
          if (Array.isArray(value)) {
            formattedValue = value.length > 0 ? value.join(', ') : 'None';
          } else {
            // For objects, show as JSON but limit length
            const jsonStr = JSON.stringify(value);
            formattedValue = jsonStr.length > 100 ? jsonStr.substring(0, 100) + '...' : jsonStr;
          }
        } else {
          formattedValue = String(value);
        }
        
        return `${formattedKey}: ${formattedValue}`;
      })
      .join(' • ');
  };

  const handleExport = () => {
    setShowExportConfirm(true);
  };

  const confirmExport = async () => {
    const csvData = [
      ['Timestamp', 'Action', 'User', 'Role', 'Details'],
      ...filteredLogs.map((log) => [
        formatTimestamp(log.timestamp),
        log.action,
        log.userName,
        log.userRole,
        formatDetails(log.details),
      ]),
    ];

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportConfirm(false);

    // Notify all admins about the export
    try {
      await api.request('/audit-logs/export-notification', {
        method: 'POST',
        body: JSON.stringify({
          exportedCount: filteredLogs.length,
          exportedBy: currentUser?.fullName || 'Admin',
        }),
      });
    } catch (err) {
      console.error('Failed to send export notification:', err);
      // Don't show error to user - export was successful, notification is secondary
    }
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    try {
      // Call the system reset API to delete ALL data
      const response = await api.request('/system/reset', { method: 'DELETE' });
      
      // Reload all data
      await loadAuditLogs();
      await loadAppointments();
      
      const result = response as any;
      if (result?.errors?.length > 0) {
        alert(`System reset completed with some errors:\n${result.errors.join('\n')}`);
      } else {
        alert('All system data has been reset successfully.');
      }
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data. Please try again.');
    }
    setShowResetConfirm(false);
  };

  const handleDateClick = (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
      </div>
    );
  }

  // Don't render if not authorized (will redirect)
  if (!isAuthorized) {
    return null;
  }

  // Password verification modal
  if (showPasswordModal) {
    return (
      <Modal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
        title="Admin Password Required"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Access to audit logs requires additional authentication. Please enter your admin password to continue.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="audit-password" className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                id="audit-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter your admin password"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 transition-colors"
                autoFocus
                required
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handlePasswordModalClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition"
              >
                Verify
              </button>
            </div>
          </form>
        </div>
      </Modal>
    );
  }

  // Don't render content until password is verified
  if (!isPasswordVerified) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
          Audit Log
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCalendarView(!isCalendarView)}
            className="px-4 py-2.5 text-sm font-semibold rounded-2xl border border-black/10 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-gray-100 shadow-sm hover:bg-black/5 dark:hover:bg-black-700 transition"
          >
            {isCalendarView ? 'List View' : 'Calendar View'}
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition"
          >
            Export Logs
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition"
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* Export Confirmation Modal */}
      <ConfirmModal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={confirmExport}
        title="Export Audit Logs"
        message={`Are you sure you want to export ${filteredLogs.length} audit log entries? This will download a CSV file with all filtered logs.`}
        confirmText="Export"
        cancelText="Cancel"
        variant="info"
      />

      {/* Reset Data Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="Reset All Data"
        message="⚠️ WARNING: This will permanently delete ALL data including:\n\n• All appointments\n• All patients (except default)\n• All medical history\n• All audit logs\n• All notifications\n\nDefault admin/staff accounts, services, doctors, and schedules will be restored.\n\nThis action CANNOT be undone. Are you absolutely sure?"
        confirmText="Yes, Reset Everything"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Filters */}
      <div className="bg-white dark:bg-black-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search actions, users, details..."
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">User</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month' | 'custom');
                if (e.target.value !== 'custom') {
                  setSelectedDate(null);
                }
              }}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Clear Selected Date (for calendar view) */}
        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedDate(null)}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              Clear Date Selection ({selectedDate})
            </button>
          </div>
        )}
      </div>

      {/* Calendar View or List View */}
      {isCalendarView ? (
        <CalendarView
          auditLogs={logsByDate}
          currentMonth={currentMonth}
          currentYear={currentYear}
          selectedDate={selectedDate}
          onMonthChange={(direction) => {
            let newMonth = currentMonth + direction;
            let newYear = currentYear;
            if (newMonth < 0) {
              newMonth = 11;
              newYear--;
            } else if (newMonth > 11) {
              newMonth = 0;
              newYear++;
            }
            setCurrentMonth(newMonth);
            setCurrentYear(newYear);
          }}
          onDateClick={handleDateClick}
        />
      ) : (
        <AuditLogsTableView filteredLogs={filteredLogs} formatTimestamp={formatTimestamp} getActionBadgeColor={getActionBadgeColor} formatDetails={formatDetails} />
      )}
    </div>
  );
}

// Calendar View Component
function CalendarView({
  auditLogs,
  currentMonth,
  currentYear,
  selectedDate,
  onMonthChange,
  onDateClick,
}: {
  auditLogs: Record<string, AuditLog[]>;
  currentMonth: number;
  currentYear: number;
  selectedDate: string | null;
  onMonthChange: (direction: number) => void;
  onDateClick: (date: string) => void;
}) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const getLogsForDate = (date: Date): AuditLog[] => {
    const dateStr = date.toISOString().split('T')[0];
    return auditLogs[dateStr] || [];
  };

  const isToday = (date: Date): boolean => {
    return date.toISOString().split('T')[0] === todayStr;
  };

  const isPastDate = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return dateStr < todayStr;
  };

  const isSelected = (date: Date): boolean => {
    return date.toISOString().split('T')[0] === selectedDate;
  };

  const getDateColor = (date: Date): string => {
    const logs = getLogsForDate(date);
    if (logs.length === 0) return '';
    if (logs.some((log) => log.action.includes('delete') || log.action.includes('remove'))) {
      return 'bg-red-100 border-red-300';
    }
    if (logs.some((log) => log.action.includes('create') || log.action.includes('add'))) {
      return 'bg-green-100 border-green-300';
    }
    if (logs.some((log) => log.action.includes('update') || log.action.includes('edit'))) {
      return 'bg-blue-100 border-blue-300';
    }
    return 'bg-yellow-100 border-yellow-300';
  };

  const days = [];
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(currentYear, currentMonth, day));
  }

  return (
    <div className="bg-white dark:bg-black-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onMonthChange(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={() => onMonthChange(1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const logs = getLogsForDate(date);
          const dateStr = date.toISOString().split('T')[0];
          const colorClass = getDateColor(date);

          const isPast = isPastDate(date);
          
          return (
            <button
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              className={`
                aspect-square p-2 rounded-lg border-2 transition-all
                ${isToday(date) ? 'ring-2 ring-gold-500' : ''}
                ${isSelected(date) ? 'bg-gold-100 dark:bg-gold-900/30 border-gold-500' : colorClass || 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-black-800'}
                ${isPast ? 'opacity-50 grayscale' : ''}
                ${logs.length > 0 ? 'font-semibold' : 'text-gray-400 dark:text-gray-500'}
              `}
            >
              <div className={`text-sm ${isPast ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{date.getDate()}</div>
              {logs.length > 0 && (
                <div className={`text-xs mt-1 ${isPast ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                  {logs.length} log{logs.length !== 1 ? 's' : ''}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded"></div>
            <span className="text-gray-900 dark:text-gray-100">Create/Add</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded"></div>
            <span className="text-gray-900 dark:text-gray-100">Update/Edit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded"></div>
            <span className="text-gray-900 dark:text-gray-100">Delete/Remove</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded"></div>
            <span className="text-gray-900 dark:text-gray-100">Other Actions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Table View Component
function AuditLogsTableView({
  filteredLogs,
  formatTimestamp,
  getActionBadgeColor,
  formatDetails,
}: {
  filteredLogs: AuditLog[];
  formatTimestamp: (timestamp: string) => string;
  getActionBadgeColor: (action: string) => string;
  formatDetails: (details: Record<string, unknown> | string) => string;
}) {
  return (
    <div className="bg-white dark:bg-black-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-black-800 dark:to-black-700 border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Timestamp</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Action</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">User</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Role</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg font-semibold">No audit logs found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-black-800 transition-colors"
                >
                  <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">{formatTimestamp(log.timestamp)}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">{log.userName}</td>
                  <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400 capitalize">{log.userRole}</td>
                  <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate" title={typeof log.details === 'string' ? log.details : formatDetails(log.details)}>
                    {typeof log.details === 'string' ? log.details : formatDetails(log.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Info */}
      {filteredLogs.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{filteredLogs.length}</span> audit log entries
          </p>
        </div>
      )}
    </div>
  );
}
