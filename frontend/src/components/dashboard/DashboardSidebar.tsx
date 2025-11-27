import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { StaffProfile } from '@/types/user';
import { api } from '@/lib/api';
import { ProfileModal } from '@/components/modals/ProfileModal';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/store/auth-store';
import { useNotifications } from '@/hooks/useNotifications';
import clinicLogo from '@/assets/images/logo.png';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  isPrimary?: boolean;
}

interface DashboardSidebarProps {
  role: 'admin' | 'staff' | 'patient';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  user?: StaffProfile | null;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

const getInitials = (name: string | undefined): string => {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  const initials = parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
  return initials || 'ST';
};

const getRoleLabel = (role: string | undefined): string => {
  if (!role) return 'Staff';
  switch (role.toLowerCase()) {
    case 'admin':
      return 'Admin';
    case 'staff':
      return 'Staff';
    case 'patient':
      return 'Patient';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

const getDefaultJobTitle = (role: string | undefined): string => {
  if (!role) return 'Office Manager';
  switch (role.toLowerCase()) {
    case 'admin':
      return 'System Administrator';
    case 'staff':
      return 'Office Manager';
    default:
      return 'Team Member';
  }
};

export function DashboardSidebar({ role, activeTab, onTabChange, user, onCollapseChange }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const navigate = useNavigate();
  
  // Use the notifications hook
  const { notifications, unreadCount: unreadNotifications, markAsRead, markAllAsRead, deleteAllRead } = useNotifications();

  // Ensure portal only renders on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Notify parent of collapse state changes
  useEffect(() => {
    if (onCollapseChange && !isMobile) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, isMobile, onCollapseChange]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        setIsCollapsed(false); // On mobile, don't collapse, just hide/show
        if (!mobile && isMobileOpen) {
          setIsMobileOpen(false); // Close mobile menu on resize to desktop
        }
      } else {
        // On desktop, maintain collapsed state preference
        // Start collapsed on smaller desktop screens (768-1024)
        if (window.innerWidth < 1024 && !isCollapsed) {
          setIsCollapsed(true);
        }
      }
    };
    
    // Set initial state
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) {
      setIsMobileOpen(false);
      setIsCollapsed(false);
    } else if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Close mobile menu when clicking outside or on navigation
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile && isMobileOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest('aside') && !target.closest('button[aria-label="Toggle sidebar"]')) {
          setIsMobileOpen(false);
        }
      }
    };

    if (isMobileOpen && isMobile) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileOpen, isMobile]);

  // Notifications are now loaded via useNotifications hook

  const handleLogout = async () => {
    try {
      // Call auth store logout to clear state and sessionStorage
      const { logout } = useAuthStore.getState();
      logout();
      
      // Also call API logout if available
      try {
        await api.logout();
      } catch (apiError) {
        // API logout failed, but we still clear local state
        console.warn('API logout failed, but local logout succeeded:', apiError);
      }
      
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to clear local state
      const { logout } = useAuthStore.getState();
      logout();
      navigate('/login');
    }
  };

  const handleCreatePatientSuccess = () => {
    setShowCreatePatientModal(false);
    // Trigger a custom event to refresh patient list if needed
    window.dispatchEvent(new Event('patientCreated'));
  };

  // Define sidebar items based on role
  const getSidebarItems = (): SidebarItem[] => {
    const items: SidebarItem[] = [];
    
    if (role === 'staff') {
      items.push(
        {
          id: 'create-patient',
          label: 'Create Patient Account',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ),
          isPrimary: true,
          onClick: () => {
            setShowCreatePatientModal(true);
          }
        },
        {
          id: 'appointments',
          label: 'Appointments',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          ),
          isActive: activeTab === 'appointments',
          onClick: () => onTabChange?.('appointments')
        },
        {
          id: 'patients',
          label: 'Patients',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ),
          isActive: activeTab === 'patients',
          onClick: () => onTabChange?.('patients')
        },
        {
          id: 'services',
          label: 'Services',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          ),
          isActive: activeTab === 'services',
          onClick: () => onTabChange?.('services')
        },
        {
          id: 'doctors',
          label: 'Dentists',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          ),
          isActive: activeTab === 'doctors',
          onClick: () => onTabChange?.('doctors')
        },
        {
          id: 'schedules',
          label: 'Schedules',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          ),
          isActive: activeTab === 'schedules',
          onClick: () => onTabChange?.('schedules')
        },
        {
          id: 'clinic-schedule',
          label: 'Clinic Hours',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
            </svg>
          ),
          isActive: activeTab === 'clinic-schedule',
          onClick: () => onTabChange?.('clinic-schedule')
        },
        {
          id: 'promos',
          label: 'Promotions',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ),
          isActive: activeTab === 'promos',
          onClick: () => onTabChange?.('promos')
        }
      );
    } else if (role === 'admin') {
      items.push(
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          ),
          isActive: activeTab === 'dashboard',
          onClick: () => onTabChange?.('dashboard')
        },
        {
          id: 'appointments',
          label: 'Appointments',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          ),
          isActive: activeTab === 'appointments',
          onClick: () => onTabChange?.('appointments')
        },
        {
          id: 'patients',
          label: 'Patients',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ),
          isActive: activeTab === 'patients',
          onClick: () => onTabChange?.('patients')
        },
        {
          id: 'services',
          label: 'Services',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          ),
          isActive: activeTab === 'services',
          onClick: () => onTabChange?.('services')
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          ),
          isActive: activeTab === 'reports',
          onClick: () => onTabChange?.('reports')
        },
        {
          id: 'doctors',
          label: 'Dentists',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          ),
          isActive: activeTab === 'doctors',
          onClick: () => onTabChange?.('doctors')
        },
        {
          id: 'staff',
          label: 'Staff',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ),
          isActive: activeTab === 'staff',
          onClick: () => onTabChange?.('staff')
        },
        {
          id: 'schedules',
          label: 'Schedules',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          ),
          isActive: activeTab === 'schedules',
          onClick: () => onTabChange?.('schedules')
        },
        {
          id: 'clinic-schedule',
          label: 'Clinic Hours',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
            </svg>
          ),
          isActive: activeTab === 'clinic-schedule',
          onClick: () => onTabChange?.('clinic-schedule')
        },
        {
          id: 'promos',
          label: 'Promotions',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ),
          isActive: activeTab === 'promos',
          onClick: () => onTabChange?.('promos')
        },
        {
          id: 'audit',
          label: 'Audit Log',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          ),
          isActive: activeTab === 'audit',
          onClick: () => onTabChange?.('audit')
        }
      );
    } else if (role === 'patient') {
      items.push(
        {
          id: 'appointments',
          label: 'Appointments',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          ),
          isActive: activeTab === 'appointments',
          onClick: () => onTabChange?.('appointments')
        },
        {
          id: 'history',
          label: 'Medical History',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          ),
          isActive: activeTab === 'history',
          onClick: () => onTabChange?.('history')
        },
        {
          id: 'profile',
          label: 'My Profile',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          ),
          isActive: activeTab === 'profile',
          onClick: () => onTabChange?.('profile')
        }
      );
    }
    
    return items;
  };

  const sidebarItems = getSidebarItems();
  const displayName = user?.fullName || 'User';
  const jobTitle = user?.jobTitle || getDefaultJobTitle(user?.role);
  const userRole = getRoleLabel(user?.role);
  const initials = getInitials(displayName);

  const handleProfileUpdate = async () => {
    // Reload user data from auth store - the ProfileModal updates the store directly
    // Just trigger a re-render event for any components that need to update
    window.dispatchEvent(new Event('userUpdated'));
  };

  return (
    <>
      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user ?? null}
        onUpdate={handleProfileUpdate}
      />

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Hamburger Button */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden bg-gradient-to-r from-gold-500 to-gold-400 p-2.5 rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        aria-expanded={isMobileOpen}
      >
        <svg
          className="w-5 h-5 text-black"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white
          transition-all duration-300 ease-in-out z-40 flex flex-col
          ${isCollapsed && !isMobile ? 'w-20' : 'w-64 md:w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isMobile ? 'shadow-2xl' : 'shadow-lg'}
        `}
        style={{
          maxHeight: '100vh',
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gradient-to-b from-gray-900 to-gray-800 z-10">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-gold-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {(!isCollapsed || isMobile) && (
            <button
              onClick={() => {
                navigate('/');
                if (isMobile) {
                  setIsMobileOpen(false);
                }
              }}
              className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity ml-2"
            >
              <span className="text-xs md:text-sm font-semibold text-gold-400 truncate">
                M.C DENTAL CLINIC
              </span>
              <img
                src={clinicLogo}
                alt="M.C DENTAL CLINIC Logo"
                className="h-8 w-8 object-contain flex-shrink-0"
              />
            </button>
          )}
          {isCollapsed && !isMobile && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <img
                src={clinicLogo}
                alt="M.C DENTAL CLINIC Logo"
                className="h-6 w-6 object-contain"
              />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1 overflow-y-auto flex-1 min-h-0">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick?.();
                if (isMobile) {
                  setIsMobileOpen(false);
                }
              }}
              className={`
                w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all
                text-sm md:text-base
                ${item.isPrimary 
                  ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold hover:from-gold-400 hover:to-gold-300 shadow-md' 
                  : item.isActive
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30 font-medium'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
                ${isCollapsed && !isMobile ? 'justify-center' : ''}
              `}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <span className="flex-shrink-0 w-5 h-5 md:w-5 md:h-5 flex items-center justify-center">{item.icon}</span>
              {(!isCollapsed || isMobile) && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 md:p-3 border-t border-gray-700 dark:border-gray-600 bg-gradient-to-b from-gray-900 to-gray-800 dark:from-black-950 dark:to-black-900 flex-shrink-0 mt-auto">
          {/* Theme Toggle */}
          <div className={`flex ${(isCollapsed && !isMobile) ? 'justify-center' : 'justify-end'} mb-2`}>
            <ThemeToggle size="sm" className={`${(isCollapsed && !isMobile) ? 'w-full' : ''}`} />
          </div>
          <div className={`flex items-center gap-1.5 md:gap-2 mb-2 ${(isCollapsed && !isMobile) ? 'flex-col' : 'flex-row'}`}>
            <button
              onClick={() => setShowProfileModal(true)}
              className={`${(isCollapsed && !isMobile) ? 'w-full justify-center' : 'flex-1'} flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-lg hover:bg-gray-700 transition-colors`}
              title={isCollapsed && !isMobile ? 'Edit Profile' : undefined}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gold-500 flex items-center justify-center text-black font-semibold flex-shrink-0 shadow-md cursor-pointer hover:ring-2 hover:ring-gold-400 transition-all">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs md:text-sm">{initials}</span>
                )}
              </div>
              {(!isCollapsed || isMobile) && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-semibold text-white truncate leading-tight">{displayName}</div>
                  <div className="text-xs text-gold-400 truncate leading-tight">{jobTitle}</div>
                  <div className="text-xs text-gray-400 truncate leading-tight">{userRole}</div>
                </div>
              )}
            </button>
            {/* Notification Icon - For Admin, Staff, and Patient */}
            {(role === 'admin' || role === 'staff' || role === 'patient') && (
              <>
                <button
                  onClick={() => setShowNotifications(true)}
                  className={`relative p-1.5 md:p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0 ${(isCollapsed && !isMobile) ? 'w-full flex justify-center items-center' : 'self-center'}`}
                  title={unreadNotifications > 0 ? `${unreadNotifications} unread notifications` : 'Notifications'}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
                
                {/* Notifications Modal - Rendered via Portal to appear in center of screen */}
                {isMounted && createPortal(
                  <Modal
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    title="Notifications"
                    size="md"
                    zIndex={10001}
                    position="center"
                    className="max-w-lg"
                  >
                    <div className="space-y-4">
                      {/* Header Actions */}
                      <div className="flex justify-between items-center gap-2">
                        {unreadNotifications > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-semibold"
                          >
                            Mark all as read
                          </button>
                        )}
                        {notifications.some(n => n.read) && (
                          <button
                            onClick={() => deleteAllRead()}
                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold"
                          >
                            Delete all read
                          </button>
                        )}
                      </div>
                      
                      {/* Notifications List */}
                      <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {notifications.map((notif: any) => (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  if (!notif.read) {
                                    markAsRead(notif.id);
                                  }
                                }}
                                className={`p-2.5 md:p-3 rounded-lg border cursor-pointer transition-colors ${
                                  !notif.read 
                                    ? 'bg-gold-50 dark:bg-gold-900/20 border-gold-200 dark:border-gold-700 hover:bg-gold-100 dark:hover:bg-gold-900/30' 
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    !notif.read ? 'bg-gold-500' : 'bg-transparent'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start md:items-center justify-between mb-1 gap-2">
                                      <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100 break-words flex-1">{notif.title}</p>
                                      <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                                        {new Date(notif.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-[11px] md:text-xs text-gray-600 dark:text-gray-300 break-words">{notif.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Footer - Only show for admin */}
                      {notifications.length > 0 && role === 'admin' && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              if (onTabChange) {
                                onTabChange('audit');
                              }
                              if (isMobile) {
                                setIsMobileOpen(false);
                              }
                            }}
                            className="w-full px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg hover:shadow-md transition"
                          >
                            View All in Audit Log
                          </button>
                        </div>
                      )}
                    </div>
                  </Modal>,
                  document.body
                )}
              </>
            )}
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-xs md:text-sm font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${(isCollapsed && !isMobile) ? 'px-2' : ''}`}
            title={isCollapsed && !isMobile ? 'Logout' : undefined}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>
      
      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Create Patient Modal */}
      <CreatePatientModal
        isOpen={showCreatePatientModal}
        onClose={() => setShowCreatePatientModal(false)}
        onSuccess={handleCreatePatientSuccess}
      />
    </>
  );
}

// Create Patient Modal Component
function CreatePatientModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if username already exists
      const existingUser = StorageService.getUserByUsername(formData.username);
      if (existingUser) {
        setError('Username already exists. Please choose a different username.');
        setLoading(false);
        return;
      }

      // Split full name into first and last name
      const nameParts = formData.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create patient
      const patientData = {
        username: formData.username,
        password: formData.password || 'patient123', // Default password
        fullName: formData.fullName,
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        role: 'patient' as const,
      };

      StorageService.createPatient(patientData);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Add New Patient" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Leave empty for default password"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Patient'}
            </button>
          </div>
        </form>
      </Modal>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Patient account created successfully!"
      />
    </>
  );
}

