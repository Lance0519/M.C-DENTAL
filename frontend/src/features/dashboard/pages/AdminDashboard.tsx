import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuthStore } from '@/store/auth-store';
import { AppointmentsTab } from '../components/AppointmentsTab';
import { PatientsTab } from '../components/PatientsTab';
import { ServicesTab } from '../components/ServicesTab';
import { DoctorsTab } from '../components/DoctorsTab';
import { SchedulesTab } from '../components/SchedulesTab';
import { ClinicScheduleTab } from '../components/ClinicScheduleTab';
import { PromosTab } from '../components/PromosTab';
import { StaffTab } from '../components/StaffTab';
import { DashboardTab } from '../components/DashboardTab';
import { ReportsTab } from '../components/ReportsTab';
import { AuditTab } from '../components/AuditTab';
import type { StaffProfile } from '@/types/user';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const authUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Load user from auth store
    if (authUser && authUser.role === 'admin') {
      setUser(authUser as StaffProfile);
      setLoading(false);
    } else if (authUser && authUser.role !== 'admin') {
      navigate('/login', { replace: true });
    }

    // Listen for tab switch events (e.g., from AuditTab cancel)
    const handleTabSwitch = (e: CustomEvent<{ tab: string }>) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('switchAdminTab', handleTabSwitch as EventListener);

    return () => {
      window.removeEventListener('switchAdminTab', handleTabSwitch as EventListener);
    };
  }, [authUser, navigate]);

  // Update local user state when auth store changes
  useEffect(() => {
    if (authUser && authUser.role === 'admin') {
      setUser(authUser as StaffProfile);
    }
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout
      role="admin"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
    >
      <AdminDashboardContent activeTab={activeTab} />
    </DashboardLayout>
  );
}

function AdminDashboardContent({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardTab />;
    case 'appointments':
      return <AppointmentsTab />;
    case 'patients':
      return <PatientsTab role="admin" />;
    case 'services':
      return <ServicesTab role="admin" />;
    case 'reports':
      return <ReportsTab />;
    case 'doctors':
      return <DoctorsTab role="admin" />;
    case 'staff':
      return <StaffTab />;
    case 'schedules':
      return <SchedulesTab role="admin" />;
    case 'clinic-schedule':
      return <ClinicScheduleTab role="admin" />;
    case 'promos':
      return <PromosTab role="admin" />;
    case 'audit':
      return <AuditTab />;
    default:
      return <DashboardTab />;
  }
}
