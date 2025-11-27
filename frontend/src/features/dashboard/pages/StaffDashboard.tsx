import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuthStore } from '@/store/auth-store';
import type { StaffProfile } from '@/types/user';
import { AppointmentsTab } from '../components/AppointmentsTab';
import { PatientsTab } from '../components/PatientsTab';
import { ServicesTab } from '../components/ServicesTab';
import { DoctorsTab } from '../components/DoctorsTab';
import { SchedulesTab } from '../components/SchedulesTab';
import { ClinicScheduleTab } from '../components/ClinicScheduleTab';
import { PromosTab } from '../components/PromosTab';

export function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('appointments');
  const authUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Load user from auth store
    if (authUser && (authUser.role === 'staff' || authUser.role === 'admin')) {
      setUser(authUser as StaffProfile);
      setLoading(false);
    } else if (authUser && authUser.role !== 'staff' && authUser.role !== 'admin') {
      navigate('/login', { replace: true });
    }
  }, [authUser, navigate]);

  // Update local user state when auth store changes
  useEffect(() => {
    if (authUser && (authUser.role === 'staff' || authUser.role === 'admin')) {
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
    return null; // Will redirect to login
  }

  return (
    <DashboardLayout
      role="staff"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
    >
      <DashboardContent activeTab={activeTab} />
    </DashboardLayout>
  );
}

function DashboardContent({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case 'appointments':
      return <AppointmentsTab />;
    case 'patients':
      return <PatientsTab role="staff" />;
    case 'services':
      return <ServicesTab role="staff" />;
    case 'doctors':
      return <DoctorsTab role="staff" />;
    case 'schedules':
      return <SchedulesTab role="staff" />;
    case 'clinic-schedule':
      return <ClinicScheduleTab role="staff" />;
    case 'promos':
      return <PromosTab role="staff" />;
    default:
      return <AppointmentsTab />;
  }
}

// PatientsTab is now imported from components

// ServicesTab is now imported from components

// DoctorsTab is now imported from components

// SchedulesTab is now imported from components

// PromosTab is now imported from components
