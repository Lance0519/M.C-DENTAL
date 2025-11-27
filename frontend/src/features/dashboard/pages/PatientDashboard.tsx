import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PatientAppointmentsTab } from '../components/PatientAppointmentsTab';
import { PatientHistoryTab } from '../components/PatientHistoryTab';
import { PatientProfileTab } from '../components/PatientProfileTab';
import { useAuthStore } from '@/store/auth-store';
import type { PatientProfile } from '@/types/user';

export function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('appointments');
  const authUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Load user from auth store
    if (authUser && authUser.role === 'patient') {
      setUser(authUser as PatientProfile);
      setLoading(false);
    } else if (authUser && authUser.role !== 'patient') {
      navigate('/login', { replace: true });
    }
  }, [authUser, navigate]);

  // Update local user state when auth store changes
  useEffect(() => {
    if (authUser && authUser.role === 'patient') {
      setUser(authUser as PatientProfile);
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
      role="patient"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user as any}
    >
      <PatientDashboardContent activeTab={activeTab} user={user} />
    </DashboardLayout>
  );
}

function PatientDashboardContent({ activeTab, user }: { activeTab: string; user: PatientProfile }) {
  switch (activeTab) {
    case 'appointments':
      return <PatientAppointmentsTab user={user} />;
    case 'history':
      return <PatientHistoryTab user={user} />;
    case 'profile':
      return <PatientProfileTab user={user} />;
    default:
      return <PatientAppointmentsTab user={user} />;
  }
}

